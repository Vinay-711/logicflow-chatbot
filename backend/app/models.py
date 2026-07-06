"""
SQLAlchemy ORM models for the Rule-Based AI Chatbot.

Models:
    - User: Authentication and authorization
    - ChatSession: Groups messages into conversations
    - Message: Individual chat messages (user or bot)
    - Intent: Knowledge base entries (keyword → response mappings)
    - UnmatchedLog: Tracks queries that didn't match any intent (feedback loop)
"""

import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    username = Column(String(100), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for guest mode
    title = Column(String(255), default="New Chat")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan",
                            order_by="Message.timestamp")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(10), nullable=False)  # "user" or "bot"
    content = Column(Text, nullable=False)
    matched_intent_id = Column(Integer, ForeignKey("intents.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
    matched_intent = relationship("Intent", back_populates="messages")

    @property
    def matched_intent_name(self):
        return self.matched_intent.name if self.matched_intent else None


class Intent(Base):
    __tablename__ = "intents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    keywords = Column(JSON, nullable=False)  # List of trigger keywords
    response = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    hit_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("Message", back_populates="matched_intent")


class UnmatchedLog(Base):
    __tablename__ = "unmatched_logs"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
