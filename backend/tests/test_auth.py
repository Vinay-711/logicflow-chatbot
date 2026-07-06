"""
Tests for Authentication endpoints.

Verifies:
- User signup (success + duplicate email rejection)
- User login (success + invalid credentials)
- JWT token validation
- Protected route access
"""

import pytest


class TestSignup:
    def test_signup_success(self, client):
        response = client.post("/api/auth/signup", json={
            "email": "newuser@example.com",
            "password": "securepassword123",
            "username": "NewUser",
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["username"] == "NewUser"

    def test_signup_duplicate_email(self, client):
        # First signup
        client.post("/api/auth/signup", json={
            "email": "dup@example.com",
            "password": "password123",
            "username": "User1",
        })
        # Duplicate
        response = client.post("/api/auth/signup", json={
            "email": "dup@example.com",
            "password": "password456",
            "username": "User2",
        })
        assert response.status_code == 409

    def test_signup_short_password(self, client):
        response = client.post("/api/auth/signup", json={
            "email": "short@example.com",
            "password": "abc",
            "username": "ShortPw",
        })
        assert response.status_code == 422  # Validation error

    def test_first_user_is_admin(self, client):
        response = client.post("/api/auth/signup", json={
            "email": "first@example.com",
            "password": "password123",
            "username": "FirstUser",
        })
        assert response.status_code == 201
        assert response.json()["user"]["is_admin"] is True


class TestLogin:
    def test_login_success(self, client):
        # Create user first
        client.post("/api/auth/signup", json={
            "email": "login@example.com",
            "password": "mypassword123",
            "username": "LoginUser",
        })
        # Login
        response = client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": "mypassword123",
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_wrong_password(self, client):
        client.post("/api/auth/signup", json={
            "email": "wrongpw@example.com",
            "password": "correctpassword",
            "username": "User",
        })
        response = client.post("/api/auth/login", json={
            "email": "wrongpw@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_login_nonexistent_email(self, client):
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123",
        })
        assert response.status_code == 401


class TestMe:
    def test_me_authenticated(self, client, auth_headers):
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "test@example.com"

    def test_me_unauthenticated(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_me_invalid_token(self, client):
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalidtoken123"
        })
        assert response.status_code == 401
