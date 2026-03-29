"""
Abituriyent Canvas — AI-generated educational infographic.
POST /canvas/generate  — Generate canvas, returns image_key instead of base64
GET  /canvas/image/{key} — Serve the raw image bytes
"""
from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from routers.auth import get_current_user
from models.user import User
from services.ai_service import generate_canvas

router = APIRouter()

# In-memory image store: {key: (bytes, mime_type)}
_image_store: dict[str, tuple[bytes, str]] = {}


class CanvasRequest(BaseModel):
    subject: str          # MOTHER_TONGUE | MATHEMATICS | HISTORY
    topic: str
    language: str = "uz"  # uz | ru | en | qq


class CanvasResponse(BaseModel):
    title: str
    description: str
    facts: list[dict]
    timeline: list[dict]
    key_figures: list[str]
    image_url: str        # /canvas/image/{key} — served as real HTTP image
    subject: str
    topic: str


@router.post("/generate", response_model=CanvasResponse)
async def generate_canvas_endpoint(
    req: CanvasRequest,
    current_user: User = Depends(get_current_user),
):
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

    # Store image bytes and return a URL key instead of base64
    image_b64: str = result.get("image_base64", "")
    image_mime: str = result.get("image_mime_type", "image/jpeg")
    image_url = ""
    if image_b64:
        import base64
        raw_bytes = base64.b64decode(image_b64)
        key = str(uuid.uuid4())
        _image_store[key] = (raw_bytes, image_mime)
        # Keep store bounded — drop oldest if over 50 entries
        if len(_image_store) > 50:
            oldest = next(iter(_image_store))
            del _image_store[oldest]
        image_url = f"/canvas/image/{key}"

    return CanvasResponse(
        title=result["title"],
        description=result["description"],
        facts=result["facts"],
        timeline=result["timeline"],
        key_figures=result["key_figures"],
        image_url=image_url,
        subject=result["subject"],
        topic=result["topic"],
    )


@router.get("/image/{key}")
async def get_canvas_image(key: str):
    """Serve a previously generated canvas image by key."""
    entry = _image_store.get(key)
    if not entry:
        raise HTTPException(404, "Image not found or expired")
    raw_bytes, mime_type = entry
    return Response(content=raw_bytes, media_type=mime_type)
