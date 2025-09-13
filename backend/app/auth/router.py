"""
Authentication router for user login, registration, and token management
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import deps
from ..users import crud
from .. import schemas
from . import utils

router = APIRouter()

@router.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: Session = Depends(deps.get_db)):
    """Register a new user with security validation"""
    from ..security import validate_password_strength, SecurityHeaders

    # Validate password strength
    is_strong, password_msg = validate_password_strength(user.password)
    if not is_strong:
        raise HTTPException(status_code=400, detail=password_msg)

    # Check if user already exists
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with secure password
    hashed_password = utils.get_password_hash(user.password)
    db_user = crud.create_user(db=db, user=user, hashed_password=hashed_password)
    return db_user

@router.post("/login", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(deps.get_db)):
    """Authenticate user and return JWT token"""
    user = crud.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=deps.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/json", response_model=schemas.Token)
async def login_with_json(login_data: schemas.LoginRequest, db: Session = Depends(deps.get_db)):
    """Authenticate user with JSON request body (alternative to OAuth2)"""
    user = crud.authenticate_user(db, username=login_data.username, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token_expires = timedelta(minutes=deps.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(deps.get_current_active_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=schemas.User)
async def update_user_me(
    user_update: schemas.UserUpdate,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Update current user information"""
    if user_update.password:
        user_update.password = utils.get_password_hash(user_update.password)

    updated_user = crud.update_user(db, user_id=current_user.id, user_update=user_update)
    return updated_user

@router.post("/refresh-token", response_model=schemas.Token)
async def refresh_access_token(current_user: schemas.User = Depends(deps.get_current_user)):
    """Refresh access token for authenticated user"""
    access_token_expires = timedelta(minutes=deps.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": current_user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}
