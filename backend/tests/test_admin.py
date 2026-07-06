"""
Tests for Admin Panel endpoints.

Verifies:
- Intent CRUD operations
- Intent toggle active/inactive
- Analytics endpoint
- Unmatched queries endpoint
- Admin authorization
"""

import json
import pytest


class TestIntentCRUD:
    def test_list_intents(self, client, admin_headers):
        response = client.get("/api/admin/intents", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 15  # At least our seeded intents

    def test_create_intent(self, client, admin_headers):
        response = client.post("/api/admin/intents", headers=admin_headers, json={
            "name": "test_intent",
            "keywords": ["test", "testing"],
            "response": "This is a test response!",
            "category": "test",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "test_intent"
        assert data["keywords"] == ["test", "testing"]
        assert data["is_active"] is True

    def test_create_duplicate_intent(self, client, admin_headers):
        client.post("/api/admin/intents", headers=admin_headers, json={
            "name": "dup_intent",
            "keywords": ["dup"],
            "response": "Response 1",
        })
        response = client.post("/api/admin/intents", headers=admin_headers, json={
            "name": "dup_intent",
            "keywords": ["dup2"],
            "response": "Response 2",
        })
        assert response.status_code == 409

    def test_update_intent(self, client, admin_headers):
        # Create
        create_resp = client.post("/api/admin/intents", headers=admin_headers, json={
            "name": "update_me",
            "keywords": ["updateme"],
            "response": "Original response",
        })
        intent_id = create_resp.json()["id"]

        # Update
        response = client.put(
            f"/api/admin/intents/{intent_id}",
            headers=admin_headers,
            json={"response": "Updated response!"},
        )
        assert response.status_code == 200
        assert response.json()["response"] == "Updated response!"

    def test_delete_intent(self, client, admin_headers):
        create_resp = client.post("/api/admin/intents", headers=admin_headers, json={
            "name": "delete_me",
            "keywords": ["deleteme"],
            "response": "To be deleted",
        })
        intent_id = create_resp.json()["id"]

        response = client.delete(f"/api/admin/intents/{intent_id}", headers=admin_headers)
        assert response.status_code == 204

    def test_toggle_intent(self, client, admin_headers):
        create_resp = client.post("/api/admin/intents", headers=admin_headers, json={
            "name": "toggle_me",
            "keywords": ["toggleme"],
            "response": "Toggle test",
        })
        intent_id = create_resp.json()["id"]
        assert create_resp.json()["is_active"] is True

        # Toggle off
        response = client.patch(
            f"/api/admin/intents/{intent_id}/toggle",
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False

        # Toggle back on
        response = client.patch(
            f"/api/admin/intents/{intent_id}/toggle",
            headers=admin_headers,
        )
        assert response.json()["is_active"] is True


class TestIntentSearch:
    def test_search_by_name(self, client, admin_headers):
        response = client.get(
            "/api/admin/intents?search=pricing",
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert any(i["name"] == "pricing" for i in data)

    def test_filter_by_category(self, client, admin_headers):
        response = client.get(
            "/api/admin/intents?category=business",
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(i["category"] == "business" for i in data)


class TestAnalytics:
    def test_analytics_endpoint(self, client, admin_headers):
        response = client.get("/api/admin/analytics", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_messages" in data
        assert "total_sessions" in data
        assert "total_intents" in data
        assert "total_unmatched" in data
        assert "fallback_rate" in data
        assert "messages_per_day" in data
        assert "top_intents" in data
        assert "avg_session_length" in data


class TestUnmatched:
    def test_unmatched_endpoint(self, client, admin_headers):
        response = client.get("/api/admin/unmatched", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestAdminAuthorization:
    def test_non_admin_rejected(self, client):
        """Regular (non-admin) user should not access admin endpoints."""
        # Create admin first (first user)
        client.post("/api/auth/signup", json={
            "email": "admin@test.com",
            "password": "admin123",
            "username": "Admin",
        })
        # Create regular user (second user, NOT admin)
        response = client.post("/api/auth/signup", json={
            "email": "regular@test.com",
            "password": "regular123",
            "username": "Regular",
        })
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/admin/intents", headers=headers)
        assert response.status_code == 403

    def test_unauthenticated_rejected(self, client):
        response = client.get("/api/admin/intents")
        assert response.status_code == 401


class TestImportExport:
    def test_export_intents(self, client, admin_headers):
        response = client.get("/api/admin/intents/export", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 15

    def test_import_intents(self, client, admin_headers):
        import_data = json.dumps([
            {
                "name": "imported_intent",
                "keywords": ["imported", "new_keyword"],
                "response": "This was imported!",
                "category": "imported",
            }
        ])

        response = client.post(
            "/api/admin/intents/import",
            headers=admin_headers,
            files={"file": ("intents.json", import_data, "application/json")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["imported"] == 1
        assert data["skipped"] == 0
