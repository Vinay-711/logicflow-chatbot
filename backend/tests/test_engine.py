"""
Tests for the Rule-Based Chat Engine.

Verifies:
- Input sanitization (lowercase, strip, normalize)
- Intent matching via dictionary lookup
- Fallback handling when no intent matches
- Exit command detection
- IPO pipeline end-to-end
"""

import pytest
from app.chat.engine import (
    sanitize_input,
    match_intent,
    is_exit_command,
    get_response,
    build_keyword_index,
    FALLBACK_RESPONSE,
    FAREWELL_RESPONSE,
)


class TestSanitizeInput:
    """Tests for the INPUT stage of the IPO model."""

    def test_lowercase(self):
        assert sanitize_input("HELLO WORLD") == "hello world"

    def test_strip_whitespace(self):
        assert sanitize_input("  hello  ") == "hello"

    def test_collapse_spaces(self):
        assert sanitize_input("hello    world") == "hello world"

    def test_normalize_punctuation(self):
        assert sanitize_input("hello!!!") == "hello!"

    def test_mixed_case_and_spaces(self):
        assert sanitize_input("  WHAT Is YOUR   Pricing???  ") == "what is your pricing?"

    def test_empty_string(self):
        assert sanitize_input("") == ""

    def test_only_whitespace(self):
        assert sanitize_input("   ") == ""

    def test_preserves_single_punctuation(self):
        result = sanitize_input("What's your pricing?")
        assert "what's your pricing?" == result


class TestMatchIntent:
    """Tests for the PROCESS stage — dictionary-based intent matching."""

    def test_exact_keyword_match(self, db_session):
        build_keyword_index(db_session)
        intent, _, _ = match_intent("hello", db_session)
        assert intent is not None
        assert intent.name == "greeting"

    def test_token_match_in_sentence(self, db_session):
        build_keyword_index(db_session)
        intent, _, _ = match_intent("tell me the pricing", db_session)
        assert intent is not None
        assert intent.name == "pricing"

    def test_no_match_returns_none(self, db_session):
        build_keyword_index(db_session)
        intent, _, _ = match_intent("xyzzy quantum flux", db_session)
        assert intent is None

    def test_multi_word_keyword(self, db_session):
        build_keyword_index(db_session)
        intent, _, _ = match_intent("how are you doing today", db_session)
        assert intent is not None
        assert intent.name == "how_are_you"

    def test_matches_active_only(self, db_session):
        """Inactive intents should not be in the keyword index."""
        from app.models import Intent
        intent = db_session.query(Intent).filter(Intent.name == "joke").first()
        intent.is_active = False
        db_session.commit()
        build_keyword_index(db_session)

        result, _, _ = match_intent("joke", db_session)
        # Should not match the deactivated intent
        assert result is None or result.name != "joke"


class TestExitCommand:
    """Tests for exit/farewell detection."""

    def test_bye(self):
        assert is_exit_command("bye") is True

    def test_goodbye(self):
        assert is_exit_command("goodbye") is True

    def test_exit(self):
        assert is_exit_command("exit") is True

    def test_quit(self):
        assert is_exit_command("quit") is True

    def test_not_exit(self):
        assert is_exit_command("hello") is False

    def test_exit_in_sentence(self):
        assert is_exit_command("i want to exit") is True


class TestGetResponse:
    """Tests for the full IPO pipeline (OUTPUT stage)."""

    def test_matched_response(self, db_session):
        from app.models import ChatSession
        session = ChatSession(title="Test")
        db_session.add(session)
        db_session.commit()

        response, is_farewell, intent_name, _ = get_response("hello", session.id, db_session)
        assert intent_name == "greeting"
        assert is_farewell is False
        assert "Hello" in response or "hello" in response.lower()

    def test_fallback_response(self, db_session):
        from app.models import ChatSession, UnmatchedLog
        session = ChatSession(title="Test")
        db_session.add(session)
        db_session.commit()

        response, is_farewell, intent_name, _ = get_response(
            "xyzzy quantum nonsense", session.id, db_session
        )
        assert intent_name is None
        assert is_farewell is False
        assert response == FALLBACK_RESPONSE

        # Verify unmatched query was logged (feedback loop)
        logs = db_session.query(UnmatchedLog).all()
        assert len(logs) >= 1

    def test_farewell_response(self, db_session):
        from app.models import ChatSession
        session = ChatSession(title="Test")
        db_session.add(session)
        db_session.commit()

        response, is_farewell, intent_name, _ = get_response("bye", session.id, db_session)
        assert is_farewell is True
        assert intent_name == "farewell"

    def test_empty_message(self, db_session):
        from app.models import ChatSession
        session = ChatSession(title="Test")
        db_session.add(session)
        db_session.commit()

        response, is_farewell, intent_name, _ = get_response("   ", session.id, db_session)
        assert "type a message" in response.lower()

    def test_hit_count_increments(self, db_session):
        from app.models import ChatSession, Intent
        session = ChatSession(title="Test")
        db_session.add(session)
        db_session.commit()

        intent_before = db_session.query(Intent).filter(Intent.name == "pricing").first()
        initial_hits = intent_before.hit_count

        get_response("pricing", session.id, db_session)

        db_session.refresh(intent_before)
        assert intent_before.hit_count == initial_hits + 1
