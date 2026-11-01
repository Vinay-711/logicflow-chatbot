"""Real engine/SQLite regression tests, independent of optional API providers."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.chat.engine as engine
from app.database import Base
from app.models import ChatSession, Intent, Message


@pytest.fixture
def db(monkeypatch):
    database = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(database)
    monkeypatch.setattr(engine, "GEMINI_API_KEY", None)
    monkeypatch.setattr(engine, "_keyword_index", {})
    with Session(database) as session:
        session.add_all([
            Intent(name="pricing", keywords=["pricing"], response="Our prices"),
            Intent(name="greeting", keywords=["how are you"], response="Doing well"),
            Intent(name="normalized", keywords=["  customer   SUPPORT  "], response="Support team"),
        ])
        session.commit()
        engine.build_keyword_index(session)
        yield session
    database.dispose()


@pytest.mark.parametrize("text", [
    "weekend hours", "unstoppable", "donegal", "endless options", "leaves",
    "endpoint documentation", "closest store", "exiting process", "quitting time",
])
def test_exit_substrings_do_not_end_chat(text):
    assert engine.is_exit_command(text) is False


@pytest.mark.parametrize("text", ["bye", "goodbye!", "please exit", "end chat.",
    "see you tomorrow", "quit?", "stop, please", "i am done"])
def test_whole_exit_commands_still_work(text):
    assert engine.is_exit_command(text) is True


def test_all_declared_exit_commands_work():
    for command in engine.EXIT_COMMANDS:
        assert engine.is_exit_command(command) is True


def test_phrase_does_not_match_inside_a_longer_word(db):
    assert engine.match_intent("how are young people", db) == (None, None, None)


def test_phrase_still_matches_with_punctuation(db):
    intent, strategy, keyword = engine.match_intent("hello, how are you?", db)
    assert intent.name == "greeting"
    assert strategy == "phrase"
    assert keyword == "how are you"


def test_punctuated_token_matches(db):
    intent, strategy, keyword = engine.match_intent("please explain pricing?", db)
    assert intent.name == "pricing"
    assert strategy == "token"
    assert keyword == "pricing"


def test_index_normalizes_keyword_whitespace_like_input(db):
    intent, strategy, keyword = engine.match_intent("customer support", db)
    assert intent.name == "normalized"
    assert strategy == "exact"
    assert keyword == "customer support"


def test_full_pipeline_keeps_weekend_question_open_and_persists_reply(db):
    chat = ChatSession(title="Boundary regression")
    db.add(chat)
    db.commit()
    reply, farewell, name, info = engine.get_response("Weekend pricing?", chat.id, db)
    assert reply == "Our prices"
    assert farewell is False
    assert name == "pricing"
    assert info["strategy"] == "token"
    assert db.query(Message).filter_by(session_id=chat.id).count() == 2
    assert db.query(Intent).filter_by(name="pricing").one().hit_count == 1
