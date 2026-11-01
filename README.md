# LogicFlow — Rule-Based AI Chatbot

A full-stack demonstration application implementing a deterministic, rule-based chatbot with dictionary-based O(1) intent matching, real-time WebSocket chat, an admin-managed knowledge base, and an analytics dashboard. Bypasses the login system for frictionless open access.

## 🌐 Live Deployments
- 🚀 **Interactive Live Web App**: [https://vinay-711.github.io/logicflow-chatbot/](https://vinay-711.github.io/logicflow-chatbot/)
- ⚡ **Deploy Full-Stack with Python Backend to Render**: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Vinay-711/logicflow-chatbot)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                   │
│  ┌──────────┐                 ┌───────────┐  ┌──────────────────┐  │
│  │ Landing  │                 │ Chat UI   │  │ Admin Dashboard  │  │
│  │ Page     │                 │ WebSocket │  │ + Analytics      │  │
│  └──────────┘                 └───────────┘  └──────────────────┘  │
│        │                            │                │              │
└────────┼────────────────────────────┼────────────────┼──────────────┘
         │                            │                │
    ─────┼────────────────────────────┼────────────────┼──────────────
         │                            │                │
┌────────┼────────────────────────────┼────────────────┼──────────────┐
│        ▼                            ▼                ▼              │
│  ┌──────────┐                 ┌───────────┐  ┌──────────────────┐  │
│  │ Static   │                 │ WebSocket │  │ Admin API        │  │
│  │ Files    │                 │ Handler   │  │ CRUD/Analytics   │  │
│  └──────────┘                 └───────────┘  └──────────────────┘  │
│                                     │                │              │
│                                     ▼                ▼              │
│                            ┌─────────────────────────────────┐      │
│                            │     CHAT ENGINE (IPO Model)     │      │
│                            │  INPUT:   sanitize_input()      │      │
│                            │  PROCESS: match_intent()        │      │
│                            │  OUTPUT:  respond & feedback    │      │
│                            └─────────────────────────────────┘      │
│                                             │                       │
│                                             ▼                       │
│                                   ┌───────────────────┐             │
│                                   │   SQLite Database  │             │
│                                   │  Sessions,        │             │
│                                   │  Messages, Intents │             │
│                                   │  UnmatchedLogs     │             │
│                                   └───────────────────┘             │
│                          BACKEND (FastAPI)                          │
└────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm

### Backend Setup

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

On first run, the database is automatically created with 20 seeded intents.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## IPO Model — How the Chat Engine Works

The chat engine strictly follows the **Input → Process → Output** model:

### Input (Sanitization)

```python
def sanitize_input(raw_text: str) -> str:
    text = raw_text.lower().strip()          # Lowercase + strip
    text = re.sub(r'\s+', ' ', text)         # Collapse whitespace
    text = re.sub(r'([!?.]){2,}', r'\1', text)  # Normalize punctuation
    return text
```

Every single message passes through this function before any processing.

### Process (Intent Matching)

```python
# The keyword index: a dictionary mapping keyword → Intent object
_keyword_index: Dict[str, Intent] = {}

def match_intent(sanitized_text, db):
    # Strategy 1: Exact full-text match — dict.get() O(1)
    matched = _keyword_index.get(sanitized_text, None)
    if matched: return matched

    # Strategy 2: Multi-word keyword phrase matching
    for keyword, intent in _keyword_index.items():
        if ' ' in keyword and keyword in sanitized_text:
            return intent

    # Strategy 3: Token-level matching — O(k) where k = token count
    for token in sanitized_text.split():
        matched = _keyword_index.get(token, None)
        if matched: return matched

    return None  # Triggers fallback
```

**Why dict.get() instead of if-elif?**
- O(1) average-case vs O(n) sequential comparison
- Intents live in the database, not the source code
- New intents added via admin panel are immediately available

### Output (Response + Feedback Loop)

```python
if intent is not None:
    intent.hit_count += 1              # Track analytics
    return intent.response             # Matched response
else:
    db.add(UnmatchedLog(query=...))    # FEEDBACK LOOP
    return FALLBACK_RESPONSE           # Default fallback
```

The **feedback loop** is closed by:
1. Unmatched queries are logged to `UnmatchedLog` table
2. Admin panel surfaces these as actionable items
3. Admin creates new intents → keyword index rebuilt automatically
4. Previously-unmatched queries now get matched

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 (Vite), Tailwind CSS v4, Zustand, Recharts, Lucide Icons |
| **Backend** | FastAPI, SQLAlchemy, Pydantic v2 |
| **Database** | SQLite (file-based, zero-config) |
| **Real-time** | WebSocket (native FastAPI support) |
| **Testing** | pytest (backend), Vitest (frontend) |

---

## Features

### Chat Experience
- Real-time WebSocket messaging with typing indicators
- Markdown-lite rendering (bold, italic, line breaks, emoji)
- Quick-reply suggestion chips
- Auto-scrolling message list with timestamps
- Dark/light theme toggle

### Multi-Session History
- Create, rename, delete chat sessions
- ChatGPT-style sidebar with session list
- Full message persistence per session

### Admin Panel
- Searchable, paginated intent table
- Add/edit/delete intents via modal form
- Toggle intents active/inactive
- Export intents as JSON
- Import intents with duplicate detection
- Unmatched query log with "Create Intent" action

### Analytics Dashboard
- Messages per day (line chart)
- Top 10 matched intents (bar chart)
- Category distribution (pie chart)
- Fallback rate tracking
- Stat cards with key metrics

---

## Running Tests

### Backend

```bash
cd backend
.venv/bin/pytest tests/ -v
```

### Frontend

```bash
cd frontend
npx vitest run
```

---

## API Documentation

FastAPI auto-generates interactive API docs:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Key Skills Demonstrated

| Skill | Implementation |
|---|---|
| **Control Flow** | IPO model pipeline, exit command handling, middleware chains |
| **Decision-Making Logic** | Multi-strategy intent matching (exact → phrase → token) with graceful fallback |
| **Dictionary/Hash-Map Optimization** | `dict.get()` O(1) lookup replacing if-elif O(n) chains |
| **REST API Design** | 15+ typed endpoints with Pydantic validation, proper HTTP status codes |
| **WebSocket API** | Real-time bidirectional chat with typing indicators |
| **Relational Data Modeling** | Normalized tables with foreign keys and cascading deletes |
| **Full-Stack Integration** | React ↔ FastAPI with proxy, real-time sync |
| **Testing** | pytest suite covering engine, auth, admin; unit + integration |
| **State Management** | Zustand stores for chat and theme |

## Development boundaries

[Frontend setup](frontend/README.md) explains the client separately from the Python service. GitHub Pages serves the static frontend; persisted sessions, admin operations and WebSocket responses require a reachable backend. The open-access demonstration configuration is not suitable for public administrative access without authorization controls.

The dictionary lookup is constant-time on average for exact keys; phrase matching and token scanning have different costs. Verify claims against the [chat engine](backend/app/chat/engine.py) rather than treating the entire pipeline as O(1).

## Matching regression checks

The chat engine matches exit commands and multi-word keywords at word boundaries,
so `weekend` does not trigger `end`. Token matching tolerates surrounding
punctuation, and stored keywords use the same whitespace normalization as input.

From `backend`, after installing `requirements.txt`, run:

```sh
PYTHONPATH=. python -m pytest tests regression_tests -q
```

The focused suite uses real in-memory SQLite records and disables external AI
calls. CI runs the focused regressions and existing backend tests on Python 3.12.
These checks do not validate an external provider or a production deployment.
