"""
AI Lesson Generator endpoints.
POST /ai-lessons/generate  — Generate a full AI lesson
POST /ai-lessons/quiz      — Generate post-lesson quiz
GET  /ai-lessons/topics    — Get topic list per subject
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import get_current_user
from models.user import User
from services.ai_service import (
    generate_ai_lesson,
    generate_post_lesson_quiz,
    TOPICS_BY_SUBJECT,
)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class GenerateLessonRequest(BaseModel):
    subject: str = Field(..., description="MOTHER_TONGUE | MATHEMATICS | HISTORY")
    topic: str
    format_type: str = Field("text", description="text | visual | audio")
    difficulty: str = Field("medium", description="easy | medium | hard")
    language: str = Field("uz", description="uz | ru")
    length: str = Field("medium", description="short | medium | deep")


class VisualBlock(BaseModel):
    type: str
    heading: str | None = None
    body: str | None = None
    term: str | None = None
    definition: str | None = None
    emoji: str | None = None
    columns: list[str] | None = None
    rows: list[list[str]] | None = None
    formula: str | None = None
    explanation: str | None = None
    points: list[str] | None = None
    problem: str | None = None
    solution: str | None = None
    events: list[dict] | None = None
    items: list[dict] | None = None


class GenerateLessonResponse(BaseModel):
    title: str
    content_markdown: str
    visual_blocks: list[dict]
    reading_time_minutes: int
    tanga_reward: int
    format: str
    subject: str
    topic: str


class QuizRequest(BaseModel):
    lesson_content: str
    topic: str
    subject: str
    language: str = "uz"
    num_questions: int = Field(5, ge=3, le=10)


class QuizQuestion(BaseModel):
    question: str
    options: dict[str, str]
    correct: str
    explanation: str


class QuizResponse(BaseModel):
    questions: list[dict]
    topic: str


class TopicsResponse(BaseModel):
    subject: str
    topics: list[str]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateLessonResponse)
async def generate_lesson(
    req: GenerateLessonRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a full AI-powered lesson on any DTM topic."""
    valid_subjects = {"MOTHER_TONGUE", "MATHEMATICS", "HISTORY"}
    if req.subject not in valid_subjects:
        raise HTTPException(400, f"subject must be one of: {valid_subjects}")

    valid_formats = {"text", "visual", "audio"}
    if req.format_type not in valid_formats:
        raise HTTPException(400, f"format_type must be one of: {valid_formats}")

    valid_lengths = {"short", "medium", "deep"}
    if req.length not in valid_lengths:
        raise HTTPException(400, f"length must be one of: {valid_lengths}")

    try:
        result = await generate_ai_lesson(
            subject=req.subject,
            topic=req.topic,
            format_type=req.format_type,
            difficulty=req.difficulty,
            language=req.language,
            length=req.length,
        )
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    return GenerateLessonResponse(
        title=result["title"],
        content_markdown=result["content_markdown"],
        visual_blocks=result["visual_blocks"],
        reading_time_minutes=result["reading_time_minutes"],
        tanga_reward=result["tanga_reward"],
        format=result["format"],
        subject=req.subject,
        topic=req.topic,
    )


@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    req: QuizRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a post-lesson quiz based on lesson content."""
    try:
        questions = await generate_post_lesson_quiz(
            lesson_content=req.lesson_content,
            topic=req.topic,
            subject=req.subject,
            language=req.language,
            num_questions=req.num_questions,
        )
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    return QuizResponse(questions=questions, topic=req.topic)


@router.get("/topics/{subject}", response_model=TopicsResponse)
async def get_topics(
    subject: str,
    current_user: User = Depends(get_current_user),
):
    """Get the enhanced topic list for a subject."""
    subject_upper = subject.upper()
    topics = TOPICS_BY_SUBJECT.get(subject_upper)
    if not topics:
        raise HTTPException(404, f"Subject '{subject}' not found")
    return TopicsResponse(subject=subject_upper, topics=topics)


@router.get("/topics", response_model=dict)
async def get_all_topics(
    current_user: User = Depends(get_current_user),
):
    """Get all topics for all subjects."""
    return TOPICS_BY_SUBJECT
