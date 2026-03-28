from datetime import datetime, timedelta, timezone
import re
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt as _bcrypt
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserOut, UserProfile, Token, TokenData, FirebaseAuthRequest
from services.firebase_auth import verify_firebase_token

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kirish huquqi yo'q — iltimos qayta kiring.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=int(user_id))
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Yangi foydalanuvchi ro'yxatdan o'tishi",
)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> Token:
    # Check username uniqueness
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"'{payload.username}' foydalanuvchi nomi allaqachon band.",
        )

    # Check email uniqueness
    existing_email = await db.execute(select(User).where(User.email == payload.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu email allaqachon ro'yxatdan o'tgan.",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    return Token(access_token=access_token, user=UserOut.model_validate(user))


@router.post(
    "/login",
    response_model=Token,
    summary="Foydalanuvchi tizimga kirishi (JWT token olish)",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi nomi yoki parol noto'g'ri.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    return Token(access_token=access_token, user=UserOut.model_validate(user))


def _make_username(display_name: str | None, email: str) -> str:
    """Generate a valid username from a Firebase display name or email."""
    base = display_name or email.split("@")[0]
    # Keep only alphanumeric + underscores, replace spaces/dashes with _
    clean = re.sub(r"[^a-zA-Z0-9_]", "", base.replace(" ", "_").replace("-", "_"))
    clean = clean[:40] or "user"
    suffix = "".join(random.choices(string.digits, k=4))
    return f"{clean}_{suffix}"


@router.post(
    "/firebase",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Firebase ID token → platform JWT (Google / Email sign-in)",
)
async def firebase_auth(
    payload: FirebaseAuthRequest,
    db: AsyncSession = Depends(get_db),
) -> Token:
    # ── 1. Verify the Firebase ID token ──────────────────────────────────────
    try:
        claims = await verify_firebase_token(payload.id_token, settings.firebase_project_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase token invalid: {exc}",
        )

    firebase_uid: str = claims["sub"]
    email: str = claims.get("email", "")
    display_name: str | None = payload.display_name or claims.get("name")

    # ── 2. Find existing user by firebase_uid OR email ────────────────────────
    result = await db.execute(
        select(User).where(
            or_(User.firebase_uid == firebase_uid, User.email == email)
        )
    )
    user = result.scalar_one_or_none()

    if user:
        # Link Firebase UID if this is an existing email/password account
        if not user.firebase_uid:
            user.firebase_uid = firebase_uid
            await db.flush()
    else:
        # ── 3. Create new user ────────────────────────────────────────────────
        # Try up to 5 times to get a unique username
        username = None
        for _ in range(5):
            candidate = _make_username(display_name, email)
            existing = await db.execute(select(User).where(User.username == candidate))
            if not existing.scalar_one_or_none():
                username = candidate
                break
        if not username:
            username = f"user_{firebase_uid[:8]}"

        user = User(
            username=username,
            email=email,
            hashed_password=None,        # Firebase users have no local password
            firebase_uid=firebase_uid,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    # ── 4. Issue our local JWT ────────────────────────────────────────────────
    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    return Token(access_token=access_token, user=UserOut.model_validate(user))


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Joriy foydalanuvchi ma'lumotlari",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfile:
    xp_in_level = current_user.xp % settings.xp_per_level
    xp_to_next = settings.xp_per_level - xp_in_level
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        xp=current_user.xp,
        level=current_user.level,
        streak_days=current_user.streak_days,
        coins=current_user.coins,
        last_active_date=current_user.last_active_date,
        created_at=current_user.created_at,
        xp_to_next_level=xp_to_next,
        xp_in_current_level=xp_in_level,
    )
