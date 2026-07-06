"""
Admin Panel API Routes.

Provides intent CRUD, analytics aggregation, import/export, and unmatched query log.
All routes require admin authentication.

Endpoints:
    GET    /api/admin/intents          - List all intents (paginated, searchable)
    POST   /api/admin/intents          - Create a new intent
    PUT    /api/admin/intents/{id}     - Update an intent
    DELETE /api/admin/intents/{id}     - Delete an intent
    PATCH  /api/admin/intents/{id}/toggle - Toggle active/inactive
    GET    /api/admin/intents/export   - Export intents as JSON
    POST   /api/admin/intents/import   - Import intents from JSON
    GET    /api/admin/analytics        - Get analytics dashboard data
    GET    /api/admin/unmatched        - Get unmatched query log
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from app.database import get_db
from app.models import Intent, Message, ChatSession, UnmatchedLog, User
from app.schemas import (
    IntentCreate, IntentUpdate, IntentOut,
    UnmatchedLogOut, AnalyticsOut, IntentAnalytics,
    DailyMessageCount, ImportResult,
)
from app.auth.security import require_admin
from app.chat.engine import build_keyword_index

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ═══════════════════════════════════════════════════════════════
# Intent CRUD
# ═══════════════════════════════════════════════════════════════

@router.get("/intents", response_model=List[IntentOut])
def list_intents(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all intents with optional search, category filter, and pagination."""
    query = db.query(Intent)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (Intent.name.ilike(search_term)) |
            (Intent.response.ilike(search_term))
        )

    if category:
        query = query.filter(Intent.category == category)

    query = query.order_by(Intent.created_at.desc())
    total = query.count()
    intents = query.offset((page - 1) * per_page).limit(per_page).all()

    return [IntentOut.model_validate(i) for i in intents]


@router.post("/intents", response_model=IntentOut, status_code=status.HTTP_201_CREATED)
def create_intent(
    data: IntentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new intent in the knowledge base.

    After creation, the keyword index is rebuilt so the new intent
    is immediately available in chat — no restart required.
    """
    # Check for duplicate name
    existing = db.query(Intent).filter(Intent.name == data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Intent with name '{data.name}' already exists",
        )

    intent = Intent(
        name=data.name,
        keywords=[k.lower().strip() for k in data.keywords],
        response=data.response,
        category=data.category,
    )
    db.add(intent)
    db.commit()
    db.refresh(intent)

    # Rebuild keyword index so new intent is immediately usable
    build_keyword_index(db)

    return IntentOut.model_validate(intent)


@router.put("/intents/{intent_id}", response_model=IntentOut)
def update_intent(
    intent_id: int,
    data: IntentUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update an existing intent. Rebuilds keyword index after update."""
    intent = db.query(Intent).filter(Intent.id == intent_id).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    if data.name is not None:
        # Check uniqueness
        existing = db.query(Intent).filter(Intent.name == data.name, Intent.id != intent_id).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Intent name '{data.name}' already taken")
        intent.name = data.name

    if data.keywords is not None:
        intent.keywords = [k.lower().strip() for k in data.keywords]

    if data.response is not None:
        intent.response = data.response

    if data.category is not None:
        intent.category = data.category

    if data.is_active is not None:
        intent.is_active = data.is_active

    db.commit()
    db.refresh(intent)

    # Rebuild keyword index
    build_keyword_index(db)

    return IntentOut.model_validate(intent)


@router.delete("/intents/{intent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_intent(
    intent_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete an intent from the knowledge base."""
    intent = db.query(Intent).filter(Intent.id == intent_id).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    db.delete(intent)
    db.commit()

    # Rebuild keyword index
    build_keyword_index(db)


@router.patch("/intents/{intent_id}/toggle", response_model=IntentOut)
def toggle_intent(
    intent_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Toggle an intent's active/inactive status."""
    intent = db.query(Intent).filter(Intent.id == intent_id).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    intent.is_active = not intent.is_active
    db.commit()
    db.refresh(intent)

    # Rebuild keyword index
    build_keyword_index(db)

    return IntentOut.model_validate(intent)


# ═══════════════════════════════════════════════════════════════
# Import / Export
# ═══════════════════════════════════════════════════════════════

@router.get("/intents/export")
def export_intents(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Export all intents as a JSON array."""
    intents = db.query(Intent).all()
    return [
        {
            "name": i.name,
            "keywords": i.keywords,
            "response": i.response,
            "category": i.category,
            "is_active": i.is_active,
        }
        for i in intents
    ]


@router.post("/intents/import", response_model=ImportResult)
async def import_intents(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Import intents from a JSON file.

    Expected format: array of objects with name, keywords, response, category.
    Duplicates (by name) are skipped. Validation errors are reported.
    """
    try:
        content = await file.read()
        data = json.loads(content)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Expected a JSON array of intents")

    imported = 0
    skipped = 0
    errors = []

    for idx, item in enumerate(data):
        try:
            name = item.get("name", "").strip()
            keywords = item.get("keywords", [])
            response = item.get("response", "").strip()
            category = item.get("category", "general").strip()

            if not name or not keywords or not response:
                errors.append(f"Item {idx}: missing required fields (name, keywords, response)")
                continue

            # Check for duplicate
            existing = db.query(Intent).filter(Intent.name == name).first()
            if existing:
                skipped += 1
                continue

            intent = Intent(
                name=name,
                keywords=[k.lower().strip() for k in keywords],
                response=response,
                category=category,
                is_active=item.get("is_active", True),
            )
            db.add(intent)
            imported += 1

        except Exception as e:
            errors.append(f"Item {idx}: {str(e)}")

    db.commit()
    build_keyword_index(db)

    return ImportResult(imported=imported, skipped=skipped, errors=errors)


# ═══════════════════════════════════════════════════════════════
# Analytics
# ═══════════════════════════════════════════════════════════════

@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get aggregated analytics data for the admin dashboard.

    Returns:
        - Total message count
        - Total session count
        - Total intent count
        - Unmatched query count and fallback rate
        - Messages per day (last 30 days)
        - Top 10 intents by hit count
        - Average session length
    """
    total_messages = db.query(func.count(Message.id)).scalar() or 0
    total_sessions = db.query(func.count(ChatSession.id)).scalar() or 0
    total_intents = db.query(func.count(Intent.id)).scalar() or 0
    total_unmatched = db.query(func.count(UnmatchedLog.id)).scalar() or 0

    # Fallback rate
    user_messages = db.query(func.count(Message.id)).filter(Message.role == "user").scalar() or 0
    fallback_rate = (total_unmatched / user_messages * 100) if user_messages > 0 else 0.0

    # Messages per day (last 30 days)
    messages_per_day_raw = (
        db.query(
            func.date(Message.timestamp).label("date"),
            func.count(Message.id).label("count"),
        )
        .group_by(func.date(Message.timestamp))
        .order_by(func.date(Message.timestamp).desc())
        .limit(30)
        .all()
    )
    messages_per_day = [
        DailyMessageCount(date=str(row.date), count=row.count)
        for row in reversed(messages_per_day_raw)
    ]

    # Top 10 intents by hit count
    top_intents_raw = (
        db.query(Intent)
        .filter(Intent.hit_count > 0)
        .order_by(Intent.hit_count.desc())
        .limit(10)
        .all()
    )
    top_intents = [
        IntentAnalytics(
            intent_name=i.name,
            hit_count=i.hit_count,
            category=i.category,
        )
        for i in top_intents_raw
    ]

    # Average session length (messages per session)
    if total_sessions > 0:
        avg_session_length = total_messages / total_sessions
    else:
        avg_session_length = 0.0

    return AnalyticsOut(
        total_messages=total_messages,
        total_sessions=total_sessions,
        total_intents=total_intents,
        total_unmatched=total_unmatched,
        fallback_rate=round(fallback_rate, 2),
        messages_per_day=messages_per_day,
        top_intents=top_intents,
        avg_session_length=round(avg_session_length, 1),
    )


# ═══════════════════════════════════════════════════════════════
# Unmatched Queries (Feedback Loop)
# ═══════════════════════════════════════════════════════════════

@router.get("/unmatched", response_model=List[UnmatchedLogOut])
def get_unmatched_queries(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get the log of unmatched queries (fallback hits).

    This is the feedback loop endpoint — admins can review queries
    that didn't match any intent and create new intents to fill gaps.
    """
    logs = (
        db.query(UnmatchedLog)
        .order_by(UnmatchedLog.timestamp.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return [UnmatchedLogOut.model_validate(log) for log in logs]


@router.delete("/unmatched/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unmatched(
    log_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a specific unmatched query log entry."""
    log = db.query(UnmatchedLog).filter(UnmatchedLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(log)
    db.commit()


@router.delete("/unmatched", status_code=status.HTTP_204_NO_CONTENT)
def clear_unmatched(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Clear all unmatched query logs."""
    db.query(UnmatchedLog).delete()
    db.commit()
