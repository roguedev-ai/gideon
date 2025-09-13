"""
Database configuration and models for AI Chat MCP Studio
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/ai_chat_mcp")

# Create engine
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # User preferences
    preferences = Column(JSON, default=dict)

    # Relationships
    conversations = relationship("Conversation", back_populates="user")
    mcp_servers = relationship("MCPServer", back_populates="user")
    api_keys = relationship("UserAPIKey", back_populates="user")

# API Key model for user-stored keys (encrypted)
class UserAPIKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False)  # 'openai', 'anthropic', etc.
    name = Column(String(100), nullable=False)  # User-given name for the key
    encrypted_key = Column(Text, nullable=False)  # Encrypted API key
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="api_keys")

# Conversation model
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Metadata
    vector_collection_id = Column(String(255))  # Reference to vector collection
    message_count = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

# Message model
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Optional metadata
    model = Column(String(100))  # AI model used
    tokens_used = Column(Integer)
    tool_calls = Column(JSON)  # MCP tool calls used in this message
    vector_ids = Column(JSON)  # Related vector document IDs

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

# MCP Server model
class MCPServer(Base):
    __tablename__ = "mcp_servers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Connection details
    connection_type = Column(String(50), default="http")  # 'http', 'websocket', 'stdio'
    configuration = Column(JSON, default=dict)  # Additional config

    # Status
    last_connected = Column(DateTime)
    connection_errors = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="mcp_servers")

# MCP Tool Usage model (for analytics)
class MCPToolUsage(Base):
    __tablename__ = "mcp_tool_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mcp_server_id = Column(Integer, ForeignKey("mcp_servers.id"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    frequency = Column(Integer, default=1)
    last_used = Column(DateTime, default=datetime.utcnow)

    # Statistics
    success_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
