from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import init_db
from routers import auth, exams, lessons, gamification, appeals
from routers import ai_tutor, ai_lessons, drill, bookmarks, study_plan, canvas, games, parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AbituriyentAI — O'zbekiston abituriyentlari uchun AI-powered tayyorgarlik platformasi. "
        "BMBA 2026 standartlari asosida."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/auth",         tags=["Authentication"])
app.include_router(exams.router,        prefix="/exams",        tags=["Exams"])
app.include_router(lessons.router,      prefix="/lessons",      tags=["Lessons"])
app.include_router(gamification.router, prefix="/user",         tags=["Gamification"])
app.include_router(appeals.router,      prefix="/appeals",      tags=["Appeals"])
app.include_router(ai_tutor.router,     prefix="/ai",           tags=["AI Tutor (Gemini)"])
app.include_router(ai_lessons.router,  prefix="/ai-lessons",   tags=["AI Lesson Generator"])
app.include_router(drill.router,       prefix="/drill",         tags=["Spaced Repetition Drill"])
app.include_router(bookmarks.router,   prefix="/bookmarks",     tags=["Bookmarks"])
app.include_router(study_plan.router,  prefix="/study-plan",    tags=["Study Plan"])
app.include_router(canvas.router,      prefix="/canvas",         tags=["Abituriyent Canvas"])
app.include_router(games.router,       prefix="/games",          tags=["Educational Games"])
app.include_router(parent.router,      prefix="/parent",         tags=["Parent / Teacher Access"])


@app.get("/", tags=["Health"])
async def root() -> JSONResponse:
    return JSONResponse(
        {
            "app": settings.app_name,
            "version": settings.app_version,
            "status": "running",
            "message": "AbituriyentAI API — Universitetga kirish imtihoniga tayyorlaning!",
        }
    )


@app.get("/health", tags=["Health"])
async def health_check() -> JSONResponse:
    return JSONResponse({"status": "healthy", "environment": settings.environment})
