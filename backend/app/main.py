"""
FastAPI Application Entrypoint.

Configures CORS, mounts all routers, and handles startup initialization
(database table creation, intent seeding, keyword index building).
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.seed_data import seed_intents
from app.chat.engine import build_keyword_index

# Import routers
from app.auth.routes import router as auth_router
from app.chat.routes import router as chat_router
from app.chat.websocket import router as ws_router
from app.admin.routes import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — runs on startup and shutdown."""
    # ── Startup ──────────────────────────────────────────────
    # Create all database tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")

    # Seed initial intents
    db = SessionLocal()
    try:
        count = seed_intents(db)
        if count > 0:
            print(f"✅ Seeded {count} intents into knowledge base")
        else:
            print("ℹ️  Intents already exist, skipping seed")

        # Build the keyword index for the chat engine
        index = build_keyword_index(db)
        print(f"✅ Built keyword index with {len(index)} entries")
    finally:
        db.close()

    yield  # Application runs here

    # ── Shutdown ─────────────────────────────────────────────
    print("👋 Application shutting down")


# ─── Create FastAPI App ──────────────────────────────────────

app = FastAPI(
    title="LogicFlow API",
    description=(
        "Rule-Based AI Chatbot API — LogicFlow AI Blueprint demonstration.\n\n"
        "A deterministic chatbot using a dictionary/hash-map knowledge base for O(1) intent matching.\n"
        "Follows the IPO (Input-Process-Output) model for all chat interactions."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ─── CORS Middleware ─────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Mount Routers ───────────────────────────────────────────

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(ws_router)
app.include_router(admin_router)


# ─── Root Endpoint ───────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "name": "LogicFlow API",
        "version": "1.0.0",
        "docs": "/docs",
    }
