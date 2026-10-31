import hashlib
import io
import json
import os
import random
import uuid
from datetime import timedelta, timezone
from collections import Counter

import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from PIL import Image as PILImage
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from . import classifier
from .config import (ALLOWED_TYPES, CATEGORIES, CONFIDENCE_THRESHOLD, CORS_ORIGINS, MAX_UPLOAD_BYTES,
                     SECRET_KEY, STATUSES, UPLOAD_DIR)
from .db import Base, SessionLocal, admin_engine, get_db
from .models import now
from .models import (Assignment, Complaint, Department, Image, Notification, Otp, Prediction, StatusHistory, User)
from .services import dhash, find_duplicate, notify
from .priority import compute_priority
from .schemas import ComplaintOut, ComplaintUpdate, FeedbackIn, LoginIn, RegisterIn, TokenOut
from .security import current_user, hash_password, make_token, require_admin, require_staff, verify_password

app = FastAPI(title="CivicLens AI")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    Base.metadata.create_all(admin_engine)
    _migrate()
    from .seed import seed
    with SessionLocal() as db:
        seed(db)


# Load all relations in a few batched queries (avoids N+1 round trips to the remote DB).
EAGER = (selectinload(Complaint.images), selectinload(Complaint.history), selectinload(Complaint.assignments))


def dept_map(db: Session) -> dict[int, str]:
    return {d.id: d.name for d in db.query(Department).all()}  # one query per request


def _migrate():
    """Schema upgrade (no Alembic): add images.data, rating, feedback, probabilities if absent."""
    from sqlalchemy import inspect, text
    with admin_engine.begin() as conn:
        cols_im = {c["name"] for c in inspect(conn).get_columns("images")}
        if "data" not in cols_im:
            conn.execute(text("ALTER TABLE images ADD COLUMN data " + ("BLOB" if admin_engine.dialect.name == "sqlite" else "BYTEA")))
        
        cols_c = {c["name"] for c in inspect(conn).get_columns("complaints")}
        if "rating" not in cols_c:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN rating INTEGER"))
        if "feedback" not in cols_c:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN feedback TEXT"))
        if "probabilities" not in cols_c:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN probabilities TEXT"))
    with SessionLocal() as db:
        rows = db.query(Image).filter(Image.data.is_(None)).all()
        n = 0
        for im in rows:
            path = os.path.join(UPLOAD_DIR, im.filename)
            if os.path.exists(path):
                im.data = open(path, "rb").read()
                n += 1
        if n:
            db.commit()


def compute_sla(c: Complaint) -> tuple[int, str, str]:
    target_hours = 24 if c.priority == "high" else 48 if c.priority == "medium" else 72
    c_time = c.created_at
    if c_time.tzinfo is None:
        c_time = c_time.replace(tzinfo=timezone.utc)
    curr_time = now()
    if c.status in ("resolved", "rejected"):
        u_time = c.updated_at or c_time
        if u_time.tzinfo is None:
            u_time = u_time.replace(tzinfo=timezone.utc)
        elapsed_hours = (u_time - c_time).total_seconds() / 3600
        if elapsed_hours <= target_hours:
            return target_hours, "met", f"SLA Met ({round(elapsed_hours, 1)}h / {target_hours}h)"
        else:
            overdue_h = round(elapsed_hours - target_hours, 1)
            return target_hours, "breached", f"SLA Breached (+{overdue_h}h over {target_hours}h target)"
    else:
        elapsed_hours = (curr_time - c_time).total_seconds() / 3600
        remaining_hours = target_hours - elapsed_hours
        if remaining_hours >= 0:
            h = int(remaining_hours)
            m = int((remaining_hours - h) * 60)
            return target_hours, "on_track", f"{h}h {m}m left (SLA: {target_hours}h)"
        else:
            overdue_h = int(-remaining_hours)
            return target_hours, "overdue", f"SLA Overdue by {overdue_h}h (Escalated)"


def to_out(c: Complaint, depts: dict[int, str] | None = None) -> ComplaintOut:
    out = ComplaintOut.model_validate(c)
    out.image_url = f"/complaints/{c.id}/image" if c.images else None
    if c.assignments and c.assignments[-1].department_id:
        did = c.assignments[-1].department_id
        out.department = (depts or dept_map(Session.object_session(c))).get(did)
    
    target_h, sla_st, sla_tx = compute_sla(c)
    out.sla_hours = target_h
    out.sla_status = sla_st
    out.sla_text = sla_tx

    if c.probabilities:
        try:
            out.probabilities = json.loads(c.probabilities)
        except Exception:
            out.probabilities = None
    if not out.probabilities and c.category:
        rem = max(0.0, 1.0 - (c.confidence or 0.5))
        others = [k for k in CATEGORIES if k != c.category]
        out.probabilities = {c.category: round(c.confidence or 0.5, 4)}
        for o in others:
            out.probabilities[o] = round(rem / len(others), 4)

    return out


def add_history(c: Complaint, status: str, comment: str, user_id: int | None):
    c.history.append(StatusHistory(status=status, comment=comment, updated_by=user_id))


@app.get("/health")
def health():
    return {"ok": True, "model": classifier.model_version()}


# ---------- auth ----------
@app.post("/auth/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(409, "Email already registered")
    u = User(name=body.name, email=body.email.lower(), phone=body.phone,
             role="citizen", password_hash=hash_password(body.password))
    db.add(u)
    db.commit()
    return TokenOut(token=make_token(u), role=u.role, name=u.name)


@app.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == body.email.lower()).first()
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return TokenOut(token=make_token(u), role=u.role, name=u.name)


# ---------- complaints ----------
@app.post("/complaints", response_model=ComplaintOut)
async def create_complaint(
    title: str = Form(...),
    description: str = Form(""),
    lat: float | None = Form(None),
    lng: float | None = Form(None),
    image: UploadFile = File(...),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG or WebP images are allowed")
    data = await image.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image too large (max 8 MB)")
    try:
        pil = PILImage.open(io.BytesIO(data))
        pil.verify()
        pil = PILImage.open(io.BytesIO(data)).convert("RGB")  # re-encode below strips EXIF
    except Exception:
        raise HTTPException(400, "File is not a valid image")

    res = classifier.classify(data)
    category, confidence = res[0], res[1]
    probs = res[2] if len(res) > 2 else None
    needs_review = confidence < CONFIDENCE_THRESHOLD
    level, reasons = compute_priority(db, category, confidence, description, lat, lng)
    ph = dhash(pil)
    dup = find_duplicate(db, category, lat, lng, ph)
    if dup:
        reasons.append(f"Possible duplicate of {dup}")

    filename = f"{uuid.uuid4().hex}.jpg"
    buf = io.BytesIO()
    pil.save(buf, "JPEG", quality=88)
    jpeg = buf.getvalue()

    c = Complaint(ref="TMP", user_id=user.id, title=title[:200], description=description, lat=lat, lng=lng,
                  category=category, confidence=confidence, needs_review=needs_review,
                  priority=level, priority_reasons=" | ".join(reasons), status="submitted", duplicate_of=dup,
                  probabilities=json.dumps(probs) if probs else None)
    c.images.append(Image(filename=filename, phash=ph, data=jpeg))
    c.predictions.append(Prediction(category=category, confidence=confidence, model_version=classifier.model_version()))
    add_history(c, "submitted", "Complaint submitted", user.id)
    db.add(c)
    db.flush()
    c.ref = f"CL-{c.created_at.year}-{c.id:06d}"
    notify(db, user.id, f"Complaint {c.ref} received ({category.replace('_', ' ')}, {level} priority)", f"/track?ref={c.ref}")
    db.commit()
    db.refresh(c)
    return to_out(c)


@app.get("/complaints/mine", response_model=list[ComplaintOut])
def my_complaints(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Complaint).options(*EAGER).filter(Complaint.user_id == user.id).order_by(Complaint.id.desc()).all()
    dm = dept_map(db)
    return [to_out(c, dm) for c in rows]


@app.get("/complaints", response_model=list[ComplaintOut])
def queue(
    status: str | None = None, category: str | None = None, priority: str | None = None,
    needs_review: bool | None = None, q: str | None = None,
    limit: int = Query(100, le=500), offset: int = 0,
    _: User = Depends(require_staff), db: Session = Depends(get_db),
):
    qs = db.query(Complaint).options(*EAGER)
    if status:
        qs = qs.filter(Complaint.status == status)
    if category:
        qs = qs.filter(Complaint.category == category)
    if priority:
        qs = qs.filter(Complaint.priority == priority)
    if needs_review is not None:
        qs = qs.filter(Complaint.needs_review == needs_review)
    if q:
        qs = qs.filter(Complaint.ref.ilike(f"%{q}%") | Complaint.title.ilike(f"%{q}%"))
    order = {"high": 0, "medium": 1, "low": 2}
    rows = qs.order_by(Complaint.id.desc()).offset(offset).limit(limit).all()
    rows.sort(key=lambda c: (c.status in ("resolved", "rejected"), order.get(c.priority, 3)))
    dm = dept_map(db)
    return [to_out(c, dm) for c in rows]


@app.get("/complaints/{ref}", response_model=ComplaintOut)
def get_complaint(ref: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = db.query(Complaint).options(*EAGER).filter(Complaint.ref == ref).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if user.role == "citizen" and c.user_id != user.id:
        raise HTTPException(403, "Not your complaint")
    return to_out(c)


@app.post("/complaints/{ref}/feedback", response_model=ComplaintOut)
def complaint_feedback(ref: str, body: FeedbackIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = db.query(Complaint).options(*EAGER).filter(Complaint.ref == ref).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    if user.role == "citizen" and c.user_id != user.id:
        raise HTTPException(403, "Not your complaint")
    
    if body.reopen:
        c.status = "in_progress"
        c.rating = None
        c.feedback = None
        note = f"Reopened by citizen: {body.comment or 'Issue not resolved properly'}"
        add_history(c, "in_progress", note, user.id)
        notify(db, user.id, f"Complaint {c.ref} has been reopened for physical inspection", f"/track?ref={c.ref}")
        db.commit()
        db.refresh(c)
        return to_out(c)
        
    if c.status not in ("resolved", "rejected"):
        raise HTTPException(400, "Feedback can only be submitted after resolution")
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    
    c.rating = body.rating
    c.feedback = body.comment.strip() if body.comment else None
    comment_text = f"Citizen rating: {body.rating}/5 stars" + (f" - {c.feedback}" if c.feedback else "")
    add_history(c, c.status, comment_text, user.id)
    notify(db, user.id, f"Thank you! Your feedback for {c.ref} has been recorded.", f"/track?ref={c.ref}")
    db.commit()
    db.refresh(c)
    return to_out(c)


@app.get("/complaints/{cid}/image")
def get_image(cid: int, token: str, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    user = db.get(User, int(data["sub"]))
    c = db.get(Complaint, cid)
    if not user or not c or not c.images:
        raise HTTPException(404, "Not found")
    if user.role == "citizen" and c.user_id != user.id:
        raise HTTPException(403, "Not your complaint")
    im = c.images[0]
    if im.data:
        return Response(content=im.data, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})
    path = os.path.join(UPLOAD_DIR, im.filename)  # legacy rows stored on disk
    if os.path.exists(path):
        return FileResponse(path, media_type="image/jpeg")
    raise HTTPException(404, "Image not available")


@app.patch("/complaints/{cid}", response_model=ComplaintOut)
def update_complaint(cid: int, body: ComplaintUpdate, staff: User = Depends(require_staff),
                     db: Session = Depends(get_db)):
    c = db.get(Complaint, cid)
    if not c:
        raise HTTPException(404, "Complaint not found")
    notes = []
    if body.category and body.category != c.category:
        if body.category not in CATEGORIES:
            raise HTTPException(400, "Unknown category")
        notes.append(f"category {c.category} -> {body.category}")
        c.category = body.category
        c.needs_review = False
    if body.priority and body.priority != c.priority:
        if body.priority not in ("high", "medium", "low"):
            raise HTTPException(400, "Unknown priority")
        notes.append(f"priority {c.priority} -> {body.priority}")
        c.priority = body.priority
    if body.department_id:
        if not db.get(Department, body.department_id):
            raise HTTPException(400, "Unknown department")
        c.assignments.append(Assignment(authority_id=staff.id, department_id=body.department_id))
        notes.append("assigned to department")
        if body.status is None and c.status in ("submitted", "under_review"):
            body.status = "assigned"
    if body.status and body.status != c.status:
        if body.status not in STATUSES:
            raise HTTPException(400, "Unknown status")
        c.status = body.status
        notes.append(f"status -> {body.status}")
    if notes or body.comment:
        comment = "; ".join(notes + ([body.comment] if body.comment else []))
        add_history(c, c.status, comment, staff.id)
        if body.status or body.department_id:
            notify(db, c.user_id, f"Update on {c.ref}: {c.status.replace('_', ' ')}" + (f" - {body.comment}" if body.comment else ""),
                   f"/track?ref={c.ref}")
    db.commit()
    db.refresh(c)
    return to_out(c)


@app.get("/departments")
def departments(_: User = Depends(require_staff), db: Session = Depends(get_db)):
    return [{"id": d.id, "name": d.name, "categories": d.categories} for d in db.query(Department).all()]


# ---------- notifications ----------
@app.get("/notifications")
def notifications(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.id.desc()).limit(30).all()
    return [{"id": n.id, "message": n.message, "link": n.link, "read": n.is_read, "created_at": n.created_at} for n in rows]


@app.post("/notifications/read")
def mark_read(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id).update({"is_read": True})
    db.commit()
    return {"ok": True}


# ---------- OTP email verification (SIMULATED delivery: code is returned in the response in demo mode) ----------
def _h(code: str) -> str:
    return hashlib.sha256((code + SECRET_KEY).encode()).hexdigest()


@app.get("/me")
def me(user: User = Depends(current_user)):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "verified": user.verified}


@app.post("/auth/otp/request")
def otp_request(user: User = Depends(current_user), db: Session = Depends(get_db)):
    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    db.query(Otp).filter(Otp.user_id == user.id).delete()
    db.add(Otp(user_id=user.id, code_hash=_h(code), expires_at=now() + timedelta(minutes=10)))
    db.commit()
    import logging
    logging.getLogger("civiclens.notify").warning("[SIMULATED EMAIL] to=%s | Your CivicLens code is %s", user.email, code)
    return {"sent": True, "demo_code": code}  # a real deployment would NOT return the code


@app.post("/auth/otp/verify")
def otp_verify(body: dict, user: User = Depends(current_user), db: Session = Depends(get_db)):
    o = db.query(Otp).filter(Otp.user_id == user.id).first()
    if not o or o.attempts >= 5 or o.expires_at.replace(tzinfo=timezone.utc) < now():
        raise HTTPException(400, "Code expired or too many attempts; request a new one")
    o.attempts += 1
    if _h(str(body.get("code", ""))) != o.code_hash:
        db.commit()
        raise HTTPException(400, "Wrong code")
    user.verified = True
    db.delete(o)
    db.commit()
    return {"verified": True}


# ---------- admin ----------
@app.get("/admin/users")
def admin_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in db.query(User).order_by(User.id)]


@app.patch("/admin/users/{uid}")
def admin_set_role(uid: int, body: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    role = body.get("role")
    if role not in ("citizen", "authority", "admin"):
        raise HTTPException(400, "Unknown role")
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "User not found")
    if u.id == admin.id and role != "admin":
        raise HTTPException(400, "You cannot demote yourself")
    u.role = role
    db.commit()
    return {"id": u.id, "role": u.role}


@app.post("/admin/departments")
def admin_add_department(body: dict, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    name = (body.get("name") or "").strip()
    cats = [c for c in (body.get("categories") or "").split(",") if c in CATEGORIES]
    if not name:
        raise HTTPException(400, "Name required")
    if db.query(Department).filter(Department.name == name).first():
        raise HTTPException(409, "Department exists")
    d = Department(name=name, categories=",".join(cats))
    db.add(d)
    db.commit()
    return {"id": d.id, "name": d.name, "categories": d.categories}


@app.delete("/admin/departments/{did}")
def admin_del_department(did: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    d = db.get(Department, did)
    if not d:
        raise HTTPException(404, "Not found")
    if db.query(Assignment).filter(Assignment.department_id == did).first():
        raise HTTPException(409, "Department has assignments; cannot delete")
    db.delete(d)
    db.commit()
    return {"ok": True}


@app.get("/admin/config")
def admin_config(_: User = Depends(require_admin)):
    return {"confidence_threshold": CONFIDENCE_THRESHOLD, "model": classifier.model_version(), "categories": CATEGORIES}


# ---------- analytics ----------
@app.get("/analytics/summary")
def summary(_: User = Depends(require_staff), db: Session = Depends(get_db)):
    rows = db.query(Complaint).options(selectinload(Complaint.predictions)).all()
    resolved = [c for c in rows if c.status == "resolved"]
    hours = [(c.updated_at - c.created_at).total_seconds() / 3600 for c in resolved]
    corrected = sum(1 for c in rows if c.predictions and c.predictions[0].category != c.category)
    by_day = Counter(c.created_at.strftime("%Y-%m-%d") for c in rows)
    return {
        "total": len(rows),
        "open": sum(1 for c in rows if c.status not in ("resolved", "rejected")),
        "needs_review": sum(1 for c in rows if c.needs_review),
        "avg_resolution_hours": round(sum(hours) / len(hours), 1) if hours else None,
        "ai_agreement_pct": round(100 * (1 - corrected / len(rows)), 1) if rows else None,
        "by_category": dict(Counter(c.category for c in rows)),
        "by_status": dict(Counter(c.status for c in rows)),
        "by_priority": dict(Counter(c.priority for c in rows)),
        "by_day": dict(sorted(by_day.items())),
    }


@app.get("/analytics/hotspots")
def hotspots(_: User = Depends(require_staff), db: Session = Depends(get_db)):
    cells: dict[tuple, dict] = {}
    for c in db.query(Complaint).filter(Complaint.lat.isnot(None), Complaint.lng.isnot(None)).all():
        key = (round(c.lat, 3), round(c.lng, 3))  # ~100 m grid
        cell = cells.setdefault(key, {"lat": key[0], "lng": key[1], "count": 0, "categories": Counter()})
        cell["count"] += 1
        cell["categories"][c.category] += 1
    out = [{**v, "categories": dict(v["categories"])} for v in cells.values()]
    return sorted(out, key=lambda x: -x["count"])
