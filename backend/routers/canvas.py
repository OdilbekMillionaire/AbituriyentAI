"""
Abituriyent Canvas — AI-generated educational infographic.
POST /canvas/generate  — Generate canvas (Gemini content + Imagen 4 image)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from routers.auth import get_current_user
from models.user import User
from services.ai_service import generate_canvas

router = APIRouter()


class CanvasRequest(BaseModel):
    subject: str          # MOTHER_TONGUE | MATHEMATICS | HISTORY
    topic: str
    language: str = "uz"  # uz | ru | en | qq


class CanvasFact(BaseModel):
    label: str
    value: str


class CanvasTimelineEvent(BaseModel):
    year: str
    event: str


class CanvasResponse(BaseModel):
    title: str
    description: str
    facts: list[dict]
    timeline: list[dict]
    key_figures: list[str]
    image_base64: str
    image_mime_type: str
    subject: str
    topic: str


@router.post("/generate", response_model=CanvasResponse)
async def generate_canvas_endpoint(
    req: CanvasRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate an educational canvas with illustration and structured facts."""
    valid_subjects = {"MOTHER_TONGUE", "MATHEMATICS", "HISTORY"}
    if req.subject not in valid_subjects:
        raise HTTPException(400, f"subject must be one of: {valid_subjects}")
    if not req.topic.strip():
        raise HTTPException(400, "topic cannot be empty")

    try:
        result = await generate_canvas(
            subject=req.subject,
            topic=req.topic,
            language=req.language,
        )
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    return CanvasResponse(**result)
