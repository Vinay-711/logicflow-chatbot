# API Reference — LogicFlow

Full interactive documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

*Note: Since the login system is disabled, authentication checks are bypassed on the backend, and all endpoints are openly accessible.*

---

## Chat Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat/sessions` | List all sessions |
| `POST` | `/api/chat/sessions` | Create new session |
| `GET` | `/api/chat/sessions/{id}` | Get session with messages |
| `PUT` | `/api/chat/sessions/{id}` | Rename session |
| `DELETE` | `/api/chat/sessions/{id}` | Delete session |
| `GET` | `/api/chat/sessions/{id}/messages` | Get paginated messages |

---

## WebSocket Chat

### `WS /ws/chat/{session_id}`

Real-time chat connection.

**Client → Server:**
```json
{ "type": "message", "content": "hello" }
```

**Server → Client:**
```json
// Typing indicator
{ "type": "typing" }

// Bot response
{ "type": "message", "role": "bot", "content": "...", "matched_intent": "greeting", "timestamp": "..." }

// Farewell (session end)
{ "type": "farewell", "content": "Goodbye!" }
```

---

## Admin — Intent Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/intents` | List intents (paginated, searchable) |
| `POST` | `/api/admin/intents` | Create new intent |
| `PUT` | `/api/admin/intents/{id}` | Update intent |
| `DELETE` | `/api/admin/intents/{id}` | Delete intent |
| `PATCH` | `/api/admin/intents/{id}/toggle` | Toggle active/inactive |
| `GET` | `/api/admin/intents/export` | Export all intents as JSON |
| `POST` | `/api/admin/intents/import` | Import intents from JSON file |

---

## Admin — Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/analytics` | Aggregated analytics data |
| `GET` | `/api/admin/unmatched` | Unmatched query log |
| `DELETE` | `/api/admin/unmatched/{id}` | Delete single unmatched log |
| `DELETE` | `/api/admin/unmatched` | Clear all unmatched logs |

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API health check |
