"""
Pydantic schemas for request/response models
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    preferences: Optional[Dict[str, Any]] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    preferences: Dict[str, Any]

    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# API Key schemas
class APIKeyBase(BaseModel):
    provider: str
    name: str
    api_key: str

class APIKeyCreate(APIKeyBase):
    pass

class APIKey(APIKeyBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Conversation schemas
class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None

class Conversation(ConversationBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    tool_calls: Optional[Dict[str, Any]] = None
    vector_ids: Optional[List[str]] = None

    class Config:
        from_attributes = True

# Chat request/response schemas
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    api_key_id: int
    model: Optional[str] = "gpt-3.5-turbo"
    use_vector_search: Optional[bool] = True
    mcp_tools_enabled: Optional[bool] = False

class ChatResponse(BaseModel):
    message: Message
    conversation_id: int
    tool_calls_used: Optional[List[Dict[str, Any]]] = None

# MCP Server schemas
class MCPServerBase(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    connection_type: Optional[str] = "http"

class MCPServerCreate(MCPServerBase):
    configuration: Optional[Dict[str, Any]] = None

class MCPServerUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    connection_type: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None

class MCPServer(MCPServerBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    last_connected: Optional[datetime] = None
    connection_errors: int

    class Config:
        from_attributes = True

# Vector search schemas
class VectorSearchRequest(BaseModel):
    query: str
    collection_id: Optional[str] = None
    limit: Optional[int] = 5
    threshold: Optional[float] = 0.7

class VectorSearchResult(BaseModel):
    id: str
    content: str
    metadata: Dict[str, Any]
    score: float

class VectorSearchResponse(BaseModel):
    results: List[VectorSearchResult]
    total_found: int

# File upload schemas
class FileUploadResponse(BaseModel):
    filename: str
    file_type: str
    size: int
    vector_ids: List[str]
    collection_id: str

# MCP Tool usage schemas
class MCPToolUsage(BaseModel):
    tool_name: str
    mcp_server_id: int
    user_id: int
    success: bool
    error_message: Optional[str] = None

# User preferences
class UserPreferences(BaseModel):
    theme: Optional[str] = "dark"  # 'light', 'dark', 'custom'
    custom_theme: Optional[Dict[str, str]] = None
    logo_url: Optional[str] = None
    background_image_url: Optional[str] = None
    default_model: Optional[str] = "gpt-3.5-turbo"
    auto_save: Optional[bool] = True
    vector_search_enabled: Optional[bool] = True
    mcp_tools_enabled: Optional[bool] = False
