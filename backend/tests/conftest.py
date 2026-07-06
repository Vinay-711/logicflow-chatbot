"""
Shared test fixtures and configuration.

Sets up an in-memory SQLite database for isolated testing.
"""

import os
os.environ["BYPASS_AUTH"] = "false"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.seed_data import seed_intents
import app.chat.engine as chat_engine
chat_engine.GEMINI_API_KEY = None
from app.chat.engine import build_keyword_index


# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test_chatbot.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=test_engine)
    # Seed intents for tests
    db = TestSessionLocal()
    seed_intents(db)
    build_keyword_index(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """Test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Direct database session for tests."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def auth_headers(client):
    """Create a test user and return auth headers."""
    # Signup
    response = client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "testpassword123",
        "username": "TestUser",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client):
    """Create an admin user and return auth headers.
    First user is automatically admin."""
    response = client.post("/api/auth/signup", json={
        "email": "testadmin@logicflow.ai",
        "password": "admin123",
        "username": "Admin",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
