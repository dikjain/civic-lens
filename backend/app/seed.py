"""Seed departments, demo users and (SIMULATED) demo complaints on first run."""
import io
import os
import random
from datetime import timedelta

from PIL import Image as PILImage

from . import classifier
from .config import UPLOAD_DIR
from .models import Assignment, Complaint, Department, Image, Prediction, StatusHistory, User, now
from .priority import compute_priority
from .security import hash_password

DEPTS = [("Roads & Works", "pothole"), ("Sanitation", "garbage"),
         ("Water Supply", "water_leak"), ("General Administration", "other")]
COLORS = {"pothole": (50, 50, 55), "garbage": (70, 140, 60), "water_leak": (60, 100, 200), "other": (190, 190, 180)}
TITLES = {"pothole": "Large pothole on road", "garbage": "Garbage pile not collected",
          "water_leak": "Pipe leaking water", "other": "Broken street furniture"}
BASE_LAT, BASE_LNG = 28.6139, 77.2090  # demo city centre (Delhi)


def seed(db):
    if db.query(User).count():
        return
    for n, cats in DEPTS:
        db.add(Department(name=n, categories=cats))
    db.add(User(name="Demo Citizen", email="citizen@demo.com", role="citizen", password_hash=hash_password("citizen123")))
    db.add(User(name="Officer Sharma", email="officer@demo.com", role="authority", password_hash=hash_password("officer123")))
    db.add(User(name="Admin", email="admin@demo.com", role="admin", password_hash=hash_password("admin123")))
    db.commit()

    citizen = db.query(User).filter_by(email="citizen@demo.com").one()
    officer = db.query(User).filter_by(email="officer@demo.com").one()
    depts = {d.categories: d for d in db.query(Department).all()}
    rnd = random.Random(7)
    descs = ["Near the school gate, very dangerous", "Has been here for weeks", "Smells bad, blocking the lane",
             "Water flooding the street", "Cars are swerving, risk of accident", ""]
    for i in range(24):
        cat = rnd.choice(list(COLORS))
        lat = BASE_LAT + rnd.uniform(-0.01, 0.01)
        lng = BASE_LNG + rnd.uniform(-0.01, 0.01)
        desc = rnd.choice(descs)
        buf = io.BytesIO()
        PILImage.new("RGB", (224, 224), COLORS[cat]).save(buf, "JPEG")
        fname = f"seed_{i}.jpg"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(os.path.join(UPLOAD_DIR, fname), "wb") as f:
            f.write(buf.getvalue())
        conf = round(rnd.uniform(0.45, 0.97), 2)
        level, reasons = compute_priority(db, cat, conf, desc, lat, lng)
        created = now() - timedelta(days=rnd.randint(0, 20), hours=rnd.randint(0, 20))
        status = rnd.choice(["submitted", "submitted", "under_review", "assigned", "in_progress", "resolved"])
        c = Complaint(ref="TMP", user_id=citizen.id, title=TITLES[cat], description=desc, lat=lat, lng=lng,
                      category=cat, confidence=conf, needs_review=conf < 0.6, priority=level,
                      priority_reasons=" | ".join(reasons), status=status, created_at=created,
                      updated_at=created + timedelta(hours=rnd.randint(6, 90)))
        c.images.append(Image(filename=fname))
        c.predictions.append(Prediction(category=cat, confidence=conf, model_version="seed-simulated"))
        c.history.append(StatusHistory(status="submitted", comment="Complaint submitted", updated_by=citizen.id,
                                       updated_at=created))
        if status != "submitted":
            c.assignments.append(Assignment(authority_id=officer.id, department_id=depts[cat].id))
            c.history.append(StatusHistory(status=status, comment=f"status -> {status}", updated_by=officer.id,
                                           updated_at=c.updated_at))
        db.add(c)
        db.flush()
        c.ref = f"CL-{created.year}-{c.id:06d}"
        c.updated_at = created + timedelta(hours=rnd.randint(6, 90))  # reset: onupdate fired on ref assignment
    db.commit()
