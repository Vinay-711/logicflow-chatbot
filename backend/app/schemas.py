"""
Pydantic v2 schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth Schemas ─────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    username: str = Field(..., min_length=2, max_length=100)


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Intent Schemas ───────────────────────────────────────────

class IntentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    keywords: List[str] = Field(..., min_length=1)
    response: str = Field(..., min_length=1)
    category: str = Field(default="general", max_length=50)


class IntentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    keywords: Optional[List[str]] = None
    response: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class IntentOut(BaseModel):
    id: int
    name: str
    keywords: List[str]
    response: str
    category: str
    hit_count: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Chat Session Schemas ────────────────────────────────────

class SessionCreate(BaseModel):
    title: Optional[str] = "New Chat"


class SessionUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class MessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    matched_intent_id: Optional[int] = None
    matched_intent_name: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    message_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class SessionWithMessages(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: List[MessageOut] = []

    model_config = {"from_attributes": True}


# ─── Chat Message Schemas ────────────────────────────────────

class ChatMessage(BaseModel):
    """WebSocket incoming message format."""
    content: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    """WebSocket outgoing message format."""
    type: str  # "message", "typing", "error", "farewell"
    role: Optional[str] = None
    content: Optional[str] = None
    matched_intent: Optional[str] = None
    timestamp: Optional[str] = None


# ─── Admin / Analytics Schemas ────────────────────────────────

class UnmatchedLogOut(BaseModel):
    id: int
    query: str
    session_id: Optional[int] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class IntentAnalytics(BaseModel):
    intent_name: str
    hit_count: int
    category: str


class DailyMessageCount(BaseModel):
    date: str
    count: int


class AnalyticsOut(BaseModel):
    total_messages: int
    total_sessions: int
    total_intents: int
    total_unmatched: int
    fallback_rate: float
    messages_per_day: List[DailyMessageCount]
    top_intents: List[IntentAnalytics]
    avg_session_length: float


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]
