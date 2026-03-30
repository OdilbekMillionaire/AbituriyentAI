"""
Abituriyent Canvas — AI-generated educational infographic.
POST /canvas/generate  — Generate canvas, stores image in DB, returns image_url
GET  /canvas/image/{key} — Serve image bytes directly from DB
"""
from __future__ import annotations

import base64
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import text

from database import AsyncSessionLocal
from routers.auth import get_current_user
from models.user import User
from services.ai_service import generate_canvas

router = APIRouter()


class CanvasRequest(BaseModel):
    subject: str
    topic: str
    language: str = "uz"


class CanvasResponse(BaseModel):
    title: str
    description: str
    facts: list[dict]
    timeline: list[dict]
    key_figures: list[str]
    image_url: str
    subject: str
    topic: str


async def _ensure_table() -> None:
    async with AsyncSessionLocal() as s:
        await s.execute(text("""
            CREATE TABLE IF NOT EXISTS canvas_images (
                id TEXT PRIMARY KEY,
                image_b64 TEXT NOT NULL,
                mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
                created_at TIMESTAMPTZ DEFAULT now()
            )
        """))
        await s.commit()


async def _save_image(key: str, raw_bytes: bytes, mime: str) -> None:
    b64 = base64.b64encode(raw_bytes).decode()
    async with AsyncSessionLocal() as s:
        await s.execute(
            text("INSERT INTO canvas_images(id, image_b64, mime_type) VALUES(:id, :b64, :mime)"),
            {"id": key, "b64": b64, "mime": mime},
        )
        await s.commit()
        # Clean up images older than 24h
        await s.execute(text("DELETE FROM canvas_images WHERE created_at < now() - interval '24 hours'"))
        await s.commit()


async def _load_image(key: str) -> tuple[bytes, str] | None:
    async with AsyncSessionLocal() as s:
        row = (await s.execute(
            text("SELECT image_b64, mime_type FROM canvas_images WHERE id = :id"),
            {"id": key},
        )).fetchone()
    if not row:
        return None
    return base64.b64decode(row[0]), row[1]


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
        result = await generate_canvas(subject=req.subject, topic=req.topic, language=req.language)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    raw_bytes: bytes = result.get("image_bytes", b"")
    image_mime: str = result.get("image_mime_type", "image/jpeg")
    image_url = ""

    if raw_bytes:
        key = str(uuid.uuid4())
        await _ensure_table()
        await _save_image(key, raw_bytes, image_mime)
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
    await _ensure_table()
    entry = await _load_image(key)
    if not entry:
        raise HTTPException(404, "Image not found or expired")
    raw_bytes, mime_type = entry
    return Response(
        content=raw_bytes,
        media_type=mime_type,
        headers={
            "Content-Length": str(len(raw_bytes)),
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    )
