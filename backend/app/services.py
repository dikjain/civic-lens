"""Duplicate detection (stretch goal) and notifications (email/SMS are simulated: logged to console)."""
import logging

from PIL import Image
from sqlalchemy.orm import Session

from .models import Complaint, Image as ImageRow, Notification, User

log = logging.getLogger("civiclens.notify")


def dhash(pil: Image.Image) -> str:
    g = pil.convert("L").resize((9, 8))
    px = list(g.tobytes())
    bits = 0
    for r in range(8):
        for c in range(8):
            bits = (bits << 1) | (px[r * 9 + c] > px[r * 9 + c + 1])
    return f"{bits:016x}"


def hamming(a: str, b: str) -> int:
    return bin(int(a, 16) ^ int(b, 16)).count("1")


def find_duplicate(db: Session, category: str, lat, lng, phash: str) -> str | None:
    """An open complaint of the same category within ~100 m whose photo looks near-identical, or within ~30 m."""
    if lat is None or lng is None:
        return None
    rows = db.query(Complaint).filter(
        Complaint.category == category, Complaint.status.notin_(["resolved", "rejected"]),
        Complaint.lat.between(lat - 0.001, lat + 0.001), Complaint.lng.between(lng - 0.001, lng + 0.001)).all()
    for c in rows:
        if abs(c.lat - lat) < 0.0003 and abs(c.lng - lng) < 0.0003:
            return c.ref  # very close: same spot
        for im in c.images:
            if im.phash and hamming(im.phash, phash) <= 8:
                return c.ref  # visually near-identical and nearby
    return None


def notify(db: Session, user_id: int, message: str, link: str | None = None):
    db.add(Notification(user_id=user_id, message=message, link=link))
    u = db.get(User, user_id)
    if u:
        log.warning("[SIMULATED EMAIL] to=%s | %s", u.email, message)
