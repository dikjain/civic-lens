from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
    history: list[HistoryOut] = []


class ComplaintUpdate(BaseModel):
    status: str | None = None
    category: str | None = None
    priority: str | None = None
    department_id: int | None = None
    comment: str = ""
