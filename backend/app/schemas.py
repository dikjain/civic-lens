import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class RegisterIn(BaseModel):
    name: str
    email: str
    password: str
    phone: str | None = None


class LoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    token: str
    role: str
    name: str


class HistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status: str
    comment: str
    updated_at: datetime


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ref: str
    title: str
    description: str
    lat: float | None
    lng: float | None
    category: str
    confidence: float
    needs_review: bool
    priority: str
    priority_reasons: str
    status: str
    created_at: datetime
    duplicate_of: str | None = None
    image_url: str | None = None
    department: str | None = None
    rating: int | None = None
    feedback: str | None = None
    probabilities: dict[str, float] | None = None
    sla_hours: int = 48
    sla_status: str = "on_track"
    sla_text: str = ""
    history: list[HistoryOut] = []

    @field_validator("probabilities", mode="before")
    @classmethod
    def parse_probs(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return None
        return v


class ComplaintUpdate(BaseModel):
    status: str | None = None
    category: str | None = None
    priority: str | None = None
    department_id: int | None = None
    comment: str = ""


class FeedbackIn(BaseModel):
    rating: int = 5
    comment: str = ""
    reopen: bool = False
