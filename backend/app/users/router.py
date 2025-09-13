"""
Users router for user management endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import deps
from .. import schemas
from ..chat import crud as chat_crud
from . import crud

router = APIRouter()

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
    updated_user = crud.update_user(db, user_id=current_user.id, user_update=user_update)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Failed to update user")

    return updated_user

@router.get("/preferences", response_model=schemas.UserPreferences)
async def get_user_preferences(current_user: schemas.User = Depends(deps.get_current_active_user)):
    """Get user preferences"""
    return schemas.UserPreferences(**current_user.preferences)

@router.put("/preferences", response_model=schemas.UserPreferences)
async def update_user_preferences(
    preferences: schemas.UserPreferences,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Update user preferences"""
    user_update = schemas.UserUpdate(preferences=preferences.model_dump())
    updated_user = crud.update_user(db, user_id=current_user.id, user_update=user_update)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Failed to update preferences")

    return schemas.UserPreferences(**updated_user.preferences)

# API Key management endpoints
@router.post("/api-keys", response_model=schemas.APIKey)
async def create_api_key(
    api_key_data: schemas.APIKeyCreate,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Create a new API key for the user"""
    api_key = chat_crud.create_user_api_key(
        db=db,
        user_id=current_user.id,
        provider=api_key_data.provider,
        name=api_key_data.name,
        api_key=api_key_data.api_key
    )
    # Don't return the actual API key in response - just metadata
    return schemas.APIKey(
        id=api_key.id,
        provider=api_key.provider,
        name=api_key.name,
        user_id=current_user.id,
        is_active=api_key.is_active,
        created_at=api_key.created_at
    )

@router.get("/api-keys", response_model=List[schemas.APIKey])
async def get_api_keys(
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Get all API keys for the user"""
    api_keys = chat_crud.get_user_api_keys(db, user_id=current_user.id)
    return [
        schemas.APIKey(
            id=key.id,
            provider=key.provider,
            name=key.name,
            user_id=key.user_id,
            is_active=key.is_active,
            created_at=key.created_at
        )
        for key in api_keys
    ]

@router.delete("/api-keys/{api_key_id}")
async def delete_api_key(
    api_key_id: int,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Delete an API key"""
    api_key = chat_crud.get_user_api_key(db, user_id=current_user.id, api_key_id=api_key_id)
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    chat_crud.delete_api_key(db, api_key_id=api_key_id, user_id=current_user.id)
    return {"message": "API key deleted successfully"}

@router.get("/models")
async def get_available_models(current_user: schemas.User = Depends(deps.get_current_active_user)):
    """Get available AI models"""
    # This would typically fetch from the API providers
    # For now, return common OpenAI models
    return {
        "openai": [
            "gpt-4",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-16k"
        ],
        "anthropic": [
            "claude-3-opus",
            "claude-3-sonnet",
            "claude-3-haiku"
        ]
    }

# Admin endpoints (would require admin permissions in production)
@router.get("/", response_model=List[schemas.User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Get list of users (admin only)"""
    # In production, add admin permission check here
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.User)
async def read_user(
    user_id: int,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Get user by ID (admin only)"""
    # In production, add admin permission check here
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return db_user
