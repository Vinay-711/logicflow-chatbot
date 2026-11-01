"""
Rule-Based Chat Engine — IPO Model Implementation.

This module is the CORE of the academic submission. It implements a deterministic,
rule-based chatbot using a dictionary/hash-map knowledge base for O(1) intent lookup.

Architecture follows the IPO (Input-Process-Output) model:

    ┌─────────────────────────────────────────────────────────────┐
    │  INPUT:    sanitize_input(raw_message)                      │
    │            → lowercase, strip whitespace, normalize text    │
    │                                                             │
    │  PROCESS:  match_intent(sanitized_text, keyword_index)      │
    │            → O(1) dict.get() lookup against keyword index   │
    │            → NO if-elif chains (academic anti-pattern)      │
    │                                                             │
    │  OUTPUT:   build_response() + log to DB                     │
    │            → formatted reply + intent hit tracking          │
    │            → unmatched queries logged for feedback loop     │
    └─────────────────────────────────────────────────────────────┘

The "feedback loop" is closed by:
    1. Logging unmatched queries to UnmatchedLog table
    2. Admin panel surfaces these gaps
    3. Admin adds new intents via CRUD UI
    4. Keyword index is rebuilt → new intents immediately available

Key Design Decision:
    Using dict.get(key, default) instead of if-elif chains provides:
    - O(1) average-case lookup vs O(n) sequential comparison
    - Dynamic extensibility (add intents at runtime, not in source code)
    - Clean separation of data (intents in DB) from logic (matching algorithm)
"""

import re
import datetime
import os
import httpx
import time
from typing import Optional, Dict, Tuple, Any
from dotenv import load_dotenv

from sqlalchemy.orm import Session

from app.models import Intent, Message, UnmatchedLog, ChatSession

# Load environment variables from .env file
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ─── Module-level keyword index (rebuilt from DB) ────────────
# Maps: keyword (str) → Intent object
# This is the O(1) lookup dictionary described in the project spec.
_keyword_index: Dict[str, Intent] = {}


# ─── Exit commands set ───────────────────────────────────────
EXIT_COMMANDS = frozenset({
    "bye", "goodbye", "exit", "quit", "leave",
    "see you", "see ya", "farewell", "end", "close",
    "stop", "done", "end chat"
})

# ─── Stopwords for token matching ────────────────────────────
# Stopwords that should be ignored for token-level matching (Strategy 3)
# to avoid false positives (e.g. "tell me about Bengaluru" matching "about").
STOPWORDS_FOR_TOKENS = frozenset({
    "about", "who", "what", "how", "where", "why", "when",
    "you", "your", "me", "our", "to", "in", "on", "at", "it",
    "is", "are", "do", "can", "will", "should", "tell", "something"
})

# Default fallback response when no intent matches
FALLBACK_RESPONSE = (
    "🤔 I'm not sure I understand that. Could you try rephrasing?\n\n"
    "**Tip:** Try asking about our *pricing*, *hours*, *services*, "
    "or type **help** to see what I can do!"
)

FAREWELL_RESPONSE = (
    "👋 Goodbye! It was great chatting with you.\n\n"
    "Feel free to come back anytime. Have a wonderful day! ✨"
)


# ═══════════════════════════════════════════════════════════════
# INPUT STAGE: Sanitization
# ═══════════════════════════════════════════════════════════════

def sanitize_input(raw_text: str) -> str:
    """
    INPUT stage of IPO model.

    Sanitizes user input for consistent matching:
    1. Convert to lowercase
    2. Strip leading/trailing whitespace
    3. Collapse multiple spaces into one
    4. Remove special characters (keep alphanumeric, spaces, basic punctuation)

    Args:
        raw_text: Raw user input string

    Returns:
        Sanitized, lowercase string ready for intent matching

    Examples:
        >>> sanitize_input("  HELLO  World!  ")
        'hello world!'
        >>> sanitize_input("What's YOUR pricing???")
        "what's your pricing?"
    """
    # Step 1 & 2: lowercase + strip
    text = raw_text.lower().strip()

    # Step 3: collapse multiple spaces
    text = re.sub(r'\s+', ' ', text)

    # Step 4: remove excessive punctuation (keep single instances)
    text = re.sub(r'([!?.]){2,}', r'\1', text)

    return text


# ═══════════════════════════════════════════════════════════════
# PROCESS STAGE: Intent Matching
# ═══════════════════════════════════════════════════════════════

def build_keyword_index(db: Session) -> Dict[str, Intent]:
    """
    Build the keyword → Intent lookup dictionary from the database.

    This creates the O(1) hash-map that replaces traditional if-elif chains.
    Called on startup and after any intent CRUD operation to keep the index fresh.

    Args:
        db: SQLAlchemy database session

    Returns:
        Dictionary mapping each keyword to its parent Intent object
    """
    global _keyword_index
    _keyword_index = {}

    # Fetch only active intents
    active_intents = db.query(Intent).filter(Intent.is_active == True).all()

    for intent in active_intents:
        for keyword in intent.keywords:
            # Normalize keyword and add to index
            normalized = sanitize_input(keyword)
            if normalized:
                _keyword_index[normalized] = intent

    return _keyword_index


def match_intent(sanitized_text: str, db: Session) -> Tuple[Optional[Intent], Optional[str], Optional[str]]:
    """
    PROCESS stage of IPO model.

    Attempts to match sanitized user input against the keyword index
    using dictionary .get() for O(1) average-case lookup.

    Matching strategy (ordered by specificity):
    1. Exact full-text match against keywords
    2. Multi-word keyword phrase match (check if any multi-word keyword is a substring)
    3. Single-word token match against keywords

    This avoids the if-elif anti-pattern by using hash-map lookups.

    Args:
        sanitized_text: Pre-sanitized user input
        db: Database session (for potential index rebuild)

    Returns:
        Tuple of (Matched Intent object or None, strategy name, matched keyword)
    """
    global _keyword_index

    # Rebuild index if empty (first call or after clear)
    if not _keyword_index:
        build_keyword_index(db)

    # Strategy 1: Exact full-text match (highest priority)
    matched = _keyword_index.get(sanitized_text, None)
    if matched:
        return (matched, "exact", sanitized_text)

    # Strategy 2: Multi-word keyword phrase matching
    for keyword, intent in _keyword_index.items():
        if ' ' in keyword and _contains_whole_phrase(sanitized_text, keyword):
            return (intent, "phrase", keyword)

    # Strategy 3: Token-level matching
    # Punctuation separates tokens without becoming part of the lookup key.
    tokens = re.findall(r"\w+(?:'\w+)*", sanitized_text)
    for token in tokens:
        if token in STOPWORDS_FOR_TOKENS:
            continue
        matched = _keyword_index.get(token, None)
        if matched:
            return (matched, "token", token)

    # No match found
    return (None, None, None)


def _contains_whole_phrase(text: str, phrase: str) -> bool:
    """Match complete words, preserving punctuation around a phrase."""
    return re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text) is not None


def is_exit_command(sanitized_text: str) -> bool:
    """
    Check if the sanitized input is an exit/farewell command.

    Uses set membership test — O(1) average case.

    Args:
        sanitized_text: Pre-sanitized user input

    Returns:
        True if the input matches an exit command
    """
    # Direct set membership — O(1)
    if sanitized_text in EXIT_COMMANDS:
        return True

    # Check if any exit phrase is contained in the input
    for cmd in EXIT_COMMANDS:
        if _contains_whole_phrase(sanitized_text, cmd):
            return True

    return False


# ═══════════════════════════════════════════════════════════════
# OUTPUT STAGE: Response Generation + Feedback Loop
# ═══════════════════════════════════════════════════════════════

def call_gemini_api(prompt: str, session_id: int, db: Session) -> Optional[str]:
    """Call Gemini API as a fallback when no rule matches, passing conversation history."""
    if not GEMINI_API_KEY:
        print("ℹ️ Gemini API key not found, skipping AI fallback")
        return None
    try:
        # Fetch conversation history from database
        history_msgs = (
            db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.timestamp.asc())
            .limit(20)  # limit to last 20 messages for context window efficiency
            .all()
        )

        # Build contents payload for Gemini API
        contents = []
        for msg in history_msgs:
            role = "model" if msg.role == "bot" else "user"
            contents.append({
                "role": role,
                "parts": [{"text": msg.content}]
            })

        # Append current user message
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

        # System instruction to enable image generation capability
        system_instruction = (
            "You are a helpful AI assistant. "
            "You have the capability to generate images for the user. "
            "When the user asks you to generate, draw, create, or show an image, picture, or painting, "
            "you MUST output a markdown image tag in the format: "
            "![descriptive alt text](https://image.pollinations.ai/prompt/URL_ENCODED_PROMPT?width=1024&height=1024&nologo=true) "
            "where URL_ENCODED_PROMPT is a detailed, descriptive, URL-encoded prompt optimized for stable diffusion. "
            "For example, if the user asks for a cute cat, output: "
            "![A cute sleeping kitten](https://image.pollinations.ai/prompt/a%20cute%20sleeping%20kitten%20soft%20lighting?width=1024&height=1024&nologo=true) "
            "Ensure that you replace all spaces with '%20' in the URL prompt. "
            "Do not write any other explanation or code blocks, just reply with the markdown image tag and optionally a short, friendly description of what you generated."
        )

        print(f"🚀 Calling Gemini API fallback with {len(contents)} messages in history...")
        start_time = datetime.datetime.now()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents
        }
        with httpx.Client(timeout=25.0) as client:
            response = client.post(url, headers=headers, json=payload)
            duration = (datetime.datetime.now() - start_time).total_seconds()
            print(f"✅ Gemini API response received in {duration:.2f}s with status {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"⚠️ Gemini API returned status code {response.status_code}: {response.text}")
    except Exception as e:
        print(f"⚠️ Error calling Gemini API: {e}")
    return None


def get_response(
    raw_message: str,
    session_id: int,
    db: Session,
) -> Tuple[str, bool, Optional[str], dict]:
    """
    OUTPUT stage of IPO model — Full pipeline execution.

    Orchestrates the complete IPO cycle:
    1. INPUT:   Sanitize the raw user message
    2. PROCESS: Match against keyword index (dict.get)
    3. OUTPUT:  Generate response, log to DB, track analytics

    Args:
        raw_message: Raw user input (unsanitized)
        session_id: Current chat session ID
        db: Database session

    Returns:
        Tuple of (response_text, is_farewell, matched_intent_name, match_info)
    """
    start_time = time.perf_counter()

    # ── INPUT: Sanitize ──────────────────────────────────────
    sanitized = sanitize_input(raw_message)

    if not sanitized:
        match_info = {
            "raw_input": raw_message,
            "sanitized_input": "",
            "strategy": "empty",
            "matched_keyword": None,
            "hit_count_incremented": False,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }
        return ("Please type a message! 😊", False, None, match_info)

    # ── PROCESS: Check exit commands first ───────────────────
    if is_exit_command(sanitized):
        # Log the farewell message
        _save_message(db, session_id, "user", raw_message, None)
        _save_message(db, session_id, "bot", FAREWELL_RESPONSE, None)
        match_info = {
            "raw_input": raw_message,
            "sanitized_input": sanitized,
            "strategy": "exit_command",
            "matched_keyword": sanitized,
            "hit_count_incremented": False,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }
        return (FAREWELL_RESPONSE, True, "farewell", match_info)

    # ── PROCESS: Match intent via dict.get() ─────────────────
    intent, strategy, matched_keyword = match_intent(sanitized, db)

    if intent is not None:
        # ── OUTPUT: Matched — respond + track ────────────────
        response = intent.response

        # Increment hit counter (analytics tracking)
        db_intent = db.query(Intent).filter(Intent.id == intent.id).first()
        if db_intent:
            db_intent.hit_count += 1
            db.commit()

        # Persist messages to DB
        _save_message(db, session_id, "user", raw_message, intent.id)
        _save_message(db, session_id, "bot", response, intent.id)

        match_info = {
            "raw_input": raw_message,
            "sanitized_input": sanitized,
            "strategy": strategy,
            "matched_keyword": matched_keyword,
            "hit_count_incremented": True,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }
        return (response, False, intent.name, match_info)
    else:
        # ── OUTPUT: No match — fallback + feedback loop ──────
        # Log the unmatched query for admin review (feedback loop)
        unmatched = UnmatchedLog(
            query=sanitized,
            session_id=session_id,
        )
        db.add(unmatched)
        db.commit()

        # Try Gemini API fallback first if configured
        ai_response = call_gemini_api(raw_message, session_id, db)
        if ai_response:
            # Persist messages
            _save_message(db, session_id, "user", raw_message, None)
            _save_message(db, session_id, "bot", ai_response, None)
            match_info = {
                "raw_input": raw_message,
                "sanitized_input": sanitized,
                "strategy": "gemini_fallback",
                "matched_keyword": None,
                "hit_count_incremented": False,
                "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            }
            return (ai_response, False, "gemini_fallback", match_info)

        # Standard static fallback
        _save_message(db, session_id, "user", raw_message, None)
        _save_message(db, session_id, "bot", FALLBACK_RESPONSE, None)
        match_info = {
            "raw_input": raw_message,
            "sanitized_input": sanitized,
            "strategy": "default_fallback",
            "matched_keyword": None,
            "hit_count_incremented": False,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
        }
        return (FALLBACK_RESPONSE, False, None, match_info)


def _save_message(
    db: Session,
    session_id: int,
    role: str,
    content: str,
    intent_id: Optional[int],
) -> Message:
    """Helper to persist a chat message to the database."""
    msg = Message(
        session_id=session_id,
        role=role,
        content=content,
        matched_intent_id=intent_id,
        timestamp=datetime.datetime.utcnow(),
    )
    db.add(msg)
    db.commit()

    # Update session's updated_at timestamp
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        session.updated_at = datetime.datetime.utcnow()
        db.commit()

    return msg
