"""
WebSocket Handler for Real-Time Chat.

Handles the live chat connection, integrating with the rule-based engine.
Supports both authenticated and guest users.

Protocol:
    Client → Server: {"type": "message", "content": "user text"}
    Server → Client: {"type": "typing"}  (bot is thinking indicator)
    Server → Client: {"type": "message", "role": "bot", "content": "...", "matched_intent": "...", "timestamp": "..."}
    Server → Client: {"type": "farewell", "content": "..."} (session end)
    Server → Client: {"type": "error", "content": "..."} (error)
"""

import json
import asyncio
import datetime
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User, ChatSession
from app.auth.security import decode_access_token
from app.chat.engine import get_response

router = APIRouter(tags=["WebSocket Chat"])


def get_user_from_token(token: Optional[str], db: Session) -> Optional[User]:
    """Validate JWT token and return user, or None for guests."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()


@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(
    websocket: WebSocket,
    session_id: int,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time chat.

    Connection flow:
    1. Client connects with session_id and optional JWT token
    2. Server validates session exists (creates if needed for guests)
    3. Client sends messages, server responds via rule-based engine
    4. On farewell intent, server sends farewell type and can close

    Args:
        websocket: The WebSocket connection
        session_id: Chat session ID
        token: Optional JWT token for authentication
    """
    await websocket.accept()

    db = SessionLocal()
    try:
        # Authenticate user (optional — guest mode supported)
        user = get_user_from_token(token, db)

        # Verify session exists
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            # Auto-create session for guests
            session = ChatSession(
                id=session_id,
                user_id=user.id if user else None,
                title="New Chat",
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        # Send welcome message
        await websocket.send_json({
            "type": "message",
            "role": "bot",
            "content": (
                "👋 **Welcome to LogicFlow!**\n\n"
                "I'm a rule-based assistant powered by a knowledge base of intents. "
                "Try asking me about:\n"
                "- 💰 **Pricing** & Plans\n"
                "- 🕐 **Business Hours**\n"
                "- 📞 **Contact** Information\n"
                "- 🛠️ **Services** & Features\n"
                "- ❓ **Help** & Support\n\n"
                "Type anything to get started, or click a quick reply below! 🚀"
            ),
            "matched_intent": "welcome",
            "timestamp": datetime.datetime.utcnow().isoformat(),
        })

        # ─── Main message loop ───────────────────────────────
        while True:
            # Receive message from client
            raw_data = await websocket.receive_text()

            try:
                data = json.loads(raw_data)
                content = data.get("content", "").strip()
            except (json.JSONDecodeError, AttributeError):
                content = raw_data.strip()

            if not content:
                continue

            # Send "typing" indicator
            await websocket.send_json({"type": "typing"})

            # Simulate thinking delay (300-800ms) for realism
            import random
            delay = random.uniform(0.3, 0.8)
            await asyncio.sleep(delay)

            # ── IPO Pipeline: sanitize → match → respond ────
            # Run get_response in a worker thread to keep the websocket event loop unblocked
            response_text, is_farewell, matched_name, match_info = await asyncio.to_thread(
                get_response,
                content,
                session_id,
                db,
            )

            # Send response
            msg_type = "farewell" if is_farewell else "message"
            await websocket.send_json({
                "type": msg_type,
                "role": "bot",
                "content": response_text,
                "matched_intent": matched_name,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "match_info": match_info,
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "content": f"An error occurred: {str(e)}",
            })
        except Exception:
            pass
    finally:
        db.close()
