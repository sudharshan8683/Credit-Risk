"""
CreditSense Authentication & User Management Routes
Provides registration, login, token verification, and demo accounts for testing.
"""

from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional, List
import re

from ..models.schemas import (
    UserRegisterRequest, UserLoginRequest, UserResponse, AuthResponse, DemoAccount
)
from ..models.database import (
    create_user, get_user_by_username_or_email, get_user_by_id
)
from ..services.auth_utils import (
    hash_password, verify_password, create_access_token, verify_access_token
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest):
    """Registers a new underwriting officer or risk analyst account."""
    clean_username = req.username.strip().lower()
    clean_email = req.email.strip().lower()
    
    # 1. Basic validation
    if not re.match(r"^[a-zA-Z0-9_\-\.]+$", clean_username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username may only contain letters, numbers, underscores, and dashes."
        )
        
    if not re.match(EMAIL_REGEX, clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid institutional email address."
        )
        
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )
        
    # 2. Check if username or email already taken
    existing_user = get_user_by_username_or_email(clean_username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{clean_username}' is already registered."
        )
        
    existing_email = get_user_by_username_or_email(clean_email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{clean_email}' is already associated with an account."
        )
        
    # 3. Hash password and insert user
    salt, pwd_hash = hash_password(req.password)
    user_id = create_user(
        username=clean_username,
        email=clean_email,
        full_name=req.full_name.strip(),
        role=req.role.strip() or "Senior Underwriter",
        salt=salt,
        password_hash=pwd_hash
    )
    
    token = create_access_token(user_id, clean_username)
    
    user_resp = UserResponse(
        id=user_id,
        username=clean_username,
        email=clean_email,
        full_name=req.full_name.strip(),
        role=req.role.strip() or "Senior Underwriter"
    )
    
    return AuthResponse(
        token=token,
        user=user_resp,
        message="Registration successful. Welcome to CreditSense."
    )

@router.post("/login", response_model=AuthResponse)
def login(req: UserLoginRequest):
    """Authenticates an underwriting officer via username or email."""
    user = get_user_by_username_or_email(req.username_or_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Check your username/email and password."
        )
        
    # Verify PBKDF2 hash
    if not verify_password(req.password, user["salt"], user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Check your username/email and password."
        )
        
    token = create_access_token(user["id"], user["username"])
    
    user_resp = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=str(user.get("created_at", ""))
    )
    
    return AuthResponse(
        token=token,
        user=user_resp,
        message=f"Welcome back, {user['full_name']}."
    )

@router.get("/me", response_model=UserResponse)
def get_current_user(authorization: Optional[str] = Header(None)):
    """Validates the Authorization bearer token and returns current user profile."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header."
        )
        
    token = authorization.replace("Bearer ", "").strip()
    user_id = verify_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again."
        )
        
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account no longer exists."
        )
        
    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=str(user.get("created_at", ""))
    )

@router.get("/demo-accounts", response_model=List[DemoAccount])
def get_demo_accounts():
    """Returns pre-configured demo risk officer accounts for instant 1-click evaluation."""
    return [
        DemoAccount(
            username="officer",
            email="sarah.jenkins@creditsense.bank",
            full_name="Sarah Jenkins",
            role="Senior Credit Officer",
            password="password123"
        ),
        DemoAccount(
            username="cro",
            email="marcus.vance@creditsense.bank",
            full_name="Marcus Vance",
            role="Chief Risk Officer",
            password="password123"
        ),
        DemoAccount(
            username="analyst",
            email="pooja.iyer@creditsense.bank",
            full_name="Pooja Iyer",
            role="Credit Risk Analyst",
            password="password123"
        )
    ]
