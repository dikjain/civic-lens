"""Explainable priority rule: returns (level, reasons)."""
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config import CONFIDENCE_THRESHOLD
from .models import Complaint

BASE = {"pothole": 2, "water_leak": 3, "garbage": 1, "other": 1}
URGENT_WORDS = ["accident", "school", "hospital", "children", "flood", "burst", "injur", "danger", "highway"]


def compute_priority(db: Session, category: str, confidence: float, description: str,
                     lat: float | None, lng: float | None) -> tuple[str, list[str]]:
    score = BASE.get(category, 1)
    reasons = [f"Base score {score} for category '{category}'"]

    hits = [w for w in URGENT_WORDS if w in description.lower()]
    if hits:
        score += 2
        reasons.append(f"Urgent keywords in description: {', '.join(hits)} (+2)")

    if lat is not None and lng is not None:
        nearby = db.query(func.count(Complaint.id)).filter(
            Complaint.category == category,
            Complaint.status.notin_(["resolved", "rejected"]),
            Complaint.lat.between(lat - 0.001, lat + 0.001),
            Complaint.lng.between(lng - 0.001, lng + 0.001),
        ).scalar()
        if nearby:
            score += 1
            reasons.append(f"{nearby} open report(s) of the same type within ~100 m (+1)")

    if confidence < CONFIDENCE_THRESHOLD:
        reasons.append("Low model confidence: flagged for human review")

    level = "high" if score >= 4 else "medium" if score >= 2 else "low"
    return level, reasons
