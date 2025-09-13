"""
CRUD operations for chat functionality
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import Conversation, Message, UserAPIKey
from .. import schemas

# Conversation CRUD
def create_conversation(db: Session, title: str, user_id: int) -> Conversation:
    """Create a new conversation"""
    db_conversation = Conversation(title=title, user_id=user_id)
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def get_conversation(db: Session, conversation_id: int, user_id: int) -> Conversation:
    """Get a conversation by ID and user ID"""
    return db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()

def get_user_conversations(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[Conversation]:
    """Get all conversations for a user"""
    return db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).order_by(desc(Conversation.updated_at)).offset(skip).limit(limit).all()

def update_conversation(db: Session, conversation_id: int, updates: schemas.ConversationUpdate) -> Conversation:
    """Update a conversation"""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        update_data = updates.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(conversation, key, value)
        db.commit()
        db.refresh(conversation)
    return conversation

def update_conversation_message_count(db: Session, conversation_id: int):
    """Update the message count for a conversation"""
    count = db.query(Message).filter(Message.conversation_id == conversation_id).count()
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.message_count = count
        db.commit()

def delete_conversation(db: Session, conversation_id: int):
    """Delete a conversation and all its messages"""
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.query(Conversation).filter(Conversation.id == conversation_id).delete()
    db.commit()

# Message CRUD
def create_message(
    db: Session,
    conversation_id: int,
    role: str,
    content: str,
    model: str = None,
    tokens_used: int = None
) -> Message:
    """Create a new message"""
    db_message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        model=model,
        tokens_used=tokens_used
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_conversation_messages(
    db: Session,
    conversation_id: int,
    skip: int = 0,
    limit: int = 1000
) -> list[Message]:
    """Get messages for a conversation"""
    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).offset(skip).limit(limit).all()

def get_message(db: Session, message_id: int) -> Message:
    """Get a message by ID"""
    return db.query(Message).filter(Message.id == message_id).first()

# API Key CRUD
def create_user_api_key(
    db: Session,
    user_id: int,
    provider: str,
    name: str,
    api_key: str
) -> UserAPIKey:
    """Create a new API key for a user with proper encryption"""
    from ..security import encrypt_api_key, sanitize_input

    # Sanitize inputs to prevent injection
    provider = sanitize_input(provider, 50)
    name = sanitize_input(name, 100)

    # Encrypt API key using Fernet
    try:
        encrypted_key = encrypt_api_key(api_key)
    except Exception as e:
        print(f"⚠️  SECURITY: Failed to encrypt API key: {e}")
        raise ValueError("Failed to encrypt API key")

    db_api_key = UserAPIKey(
        user_id=user_id,
        provider=provider,
        name=name,
        encrypted_key=encrypted_key
    )
    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)
    return db_api_key

def get_user_api_keys(db: Session, user_id: int) -> list[UserAPIKey]:
    """Get all API keys for a user"""
    return db.query(UserAPIKey).filter(
        UserAPIKey.user_id == user_id,
        UserAPIKey.is_active == True
    ).all()

def get_user_api_key(db: Session, user_id: int, api_key_id: int) -> UserAPIKey:
    """Get a specific API key for a user"""
    return db.query(UserAPIKey).filter(
        UserAPIKey.id == api_key_id,
        UserAPIKey.user_id == user_id,
        UserAPIKey.is_active == True
    ).first()

def update_api_key(db: Session, api_key_id: int, user_id: int, updates: dict) -> UserAPIKey:
    """Update an API key"""
    api_key = get_user_api_key(db, user_id=user_id, api_key_id=api_key_id)
    if api_key:
        for key, value in updates.items():
            setattr(api_key, key, value)
        db.commit()
        db.refresh(api_key)
    return api_key

def delete_api_key(db: Session, api_key_id: int, user_id: int):
    """Delete an API key (soft delete)"""
    api_key = get_user_api_key(db, user_id=user_id, api_key_id=api_key_id)
    if api_key:
        api_key.is_active = False
        db.commit()
