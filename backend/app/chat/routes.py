"""
Chat Session REST API Routes.

Provides CRUD operations for chat sessions and message retrieval.
Supports both authenticated users and guest mode.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import ChatSession, Message, User
from app.schemas import SessionCreate, SessionUpdate, SessionOut, SessionWithMessages, MessageOut
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all chat sessions for the current user (or guest sessions)."""
    if user:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user.id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )
    else:
        # Guest users shouldn't see other sessions
        return []

    result = []
    for s in sessions:
        msg_count = db.query(func.count(Message.id)).filter(Message.session_id == s.id).scalar()
        out = SessionOut.model_validate(s)
        out.message_count = msg_count
        result.append(out)

    return result


@router.post("/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    data: SessionCreate,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat session."""
    session = ChatSession(
        user_id=user.id if user else None,
        title=data.title or "New Chat",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    out = SessionOut.model_validate(session)
    out.message_count = 0
    return out


@router.get("/sessions/{session_id}", response_model=SessionWithMessages)
def get_session(
    session_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a chat session with all its messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Authorization check
    if user and session.user_id and session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return SessionWithMessages.model_validate(session)


@router.put("/sessions/{session_id}", response_model=SessionOut)
def rename_session(
    session_id: int,
    data: SessionUpdate,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename a chat session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if user and session.user_id and session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    session.title = data.title
    db.commit()
    db.refresh(session)

    msg_count = db.query(func.count(Message.id)).filter(Message.session_id == session.id).scalar()
    out = SessionOut.model_validate(session)
    out.message_count = msg_count
    return out


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a chat session and all its messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if user and session.user_id and session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(session)
    db.commit()


@router.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def get_messages(
    session_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get paginated messages for a chat session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if user and session.user_id and session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.timestamp.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [MessageOut.model_validate(m) for m in messages]
