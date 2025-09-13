"""
Chat router for handling AI conversations with OpenAI API integration
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import openai

from ..database import SessionLocal
from .. import deps, schemas
from ..chat import crud
from ..vector import vector_manager

router = APIRouter()

def get_openai_client(api_key: str) -> openai.OpenAI:
    """Get configured OpenAI client"""
    return openai.OpenAI(api_key=api_key)

def build_messages_for_openai(conversation_messages: List[schemas.Message]) -> List[Dict[str, str]]:
    """Convert database messages to OpenAI chat format"""
    return [
        {"role": msg.role, "content": msg.content}
        for msg in conversation_messages
    ]

def estimate_tokens(text: str) -> int:
    """Rough token estimation (1 token ≈ 4 characters for English)"""
    return len(text) // 4

@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_completion(
    request: schemas.ChatRequest,
    background_tasks: BackgroundTasks,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Send a chat message and get AI response"""
    try:
        # Get user's API key
        api_key_obj = crud.get_user_api_key(db, user_id=current_user.id, api_key_id=request.api_key_id)
        if not api_key_obj:
            raise HTTPException(status_code=404, detail="API key not found")

        # Decrypt API key (simplified - in production use proper encryption)
        api_key = api_key_obj.encrypted_key  # TODO: Decrypt properly

        # Initialize OpenAI client
        client = get_openai_client(api_key)

        # Get or create conversation
        if request.conversation_id:
            conversation = crud.get_conversation(db, conversation_id=request.conversation_id, user_id=current_user.id)
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            conversation = crud.create_conversation(db, title=f"Chat {len(request.message[:50])}...", user_id=current_user.id)

        # Add user message to conversation
        user_message = crud.create_message(
            db,
            conversation_id=conversation.id,
            role="user",
            content=request.message
        )

        # Get conversation history
        messages = crud.get_conversation_messages(db, conversation_id=conversation.id)

        # Build messages for OpenAI
        openai_messages = build_messages_for_openai(messages)

        # Add vector search results if enabled
        if request.use_vector_search:
            similar_docs = vector_manager.search_similar_messages(
                query=request.message,
                conversation_id=str(conversation.id)
            )
            # Format similar messages as context
            context = "\n\n".join([doc["content"] for doc in similar_docs[:3]])
            if context:
                system_message = f"You have access to previous conversation context:\n{context}\n\nUse this to provide relevant responses."
                openai_messages.insert(0, {"role": "system", "content": system_message})

        # Make OpenAI API call
        response = client.chat.completions.create(
            model=request.model or "gpt-3.5-turbo",
            messages=openai_messages,
            stream=False,  # Use non-streaming for now, can add streaming later
            temperature=0.7,
            max_tokens=2048
        )

        # Extract response
        ai_response = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else 0

        # Save AI response
        ai_message = crud.create_message(
            db,
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response,
            model=request.model or "gpt-3.5-turbo",
            tokens_used=tokens_used
        )

        # Update conversation metadata
        crud.update_conversation_message_count(db, conversation_id=conversation.id)

        return schemas.ChatResponse(
            message=ai_message,
            conversation_id=conversation.id,
            tool_calls_used=None  # TODO: Add MCP tool calling
        )

    except openai.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid API key")
    except openai.RateLimitError:
        raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.post("/chat/stream")
async def chat_completion_stream(
    request: schemas.ChatRequest,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Streaming chat completion endpoint"""
    try:
        # Get API key (same as above)
        api_key_obj = crud.get_user_api_key(db, user_id=current_user.id, api_key_id=request.api_key_id)
        if not api_key_obj:
            raise HTTPException(status_code=404, detail="API key not found")

        api_key = api_key_obj.encrypted_key  # TODO: Decrypt
        client = get_openai_client(api_key)

        # Get conversation
        if request.conversation_id:
            conversation = crud.get_conversation(db, conversation_id=request.conversation_id, user_id=current_user.id)
        else:
            conversation = crud.create_conversation(db, title=f"Chat {len(request.message[:50])}...", user_id=current_user.id)

        # Add user message
        crud.create_message(db, conversation_id=conversation.id, role="user", content=request.message)

        # Get history and build messages
        messages = crud.get_conversation_messages(db, conversation_id=conversation.id)
        openai_messages = build_messages_for_openai(messages)

        async def generate():
            """Streaming response generator"""
            try:
                stream = client.chat.completions.create(
                    model=request.model or "gpt-3.5-turbo",
                    messages=openai_messages,
                    stream=True,
                    temperature=0.7,
                    max_tokens=2048
                )

                full_response = ""
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield f"data: {content}\n\n"

                # Save the complete response
                ai_message = crud.create_message(
                    db,
                    conversation_id=conversation.id,
                    role="assistant",
                    content=full_response,
                    model=request.model or "gpt-3.5-turbo"
                )
                crud.update_conversation_message_count(db, conversation_id=conversation.id)

                yield f"data: [DONE]\n\n"

            except Exception as e:
                yield f"data: Error: {str(e)}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Streaming error: {str(e)}")

# Conversation management endpoints
@router.get("/conversations", response_model=List[schemas.Conversation])
async def get_conversations(
    skip: int = 0,
    limit: int = 50,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Get user's conversations"""
    conversations = crud.get_user_conversations(db, user_id=current_user.id, skip=skip, limit=limit)
    return conversations

@router.get("/conversations/{conversation_id}", response_model=schemas.Conversation)
async def get_conversation(
    conversation_id: int,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Get specific conversation"""
    conversation = crud.get_conversation(db, conversation_id=conversation_id, user_id=current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation

@router.get("/conversations/{conversation_id}/messages", response_model=List[schemas.Message])
async def get_conversation_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Get messages for a conversation"""
    conversation = crud.get_conversation(db, conversation_id=conversation_id, user_id=current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = crud.get_conversation_messages(db, conversation_id=conversation_id, skip=skip, limit=limit)
    return messages

@router.put("/conversations/{conversation_id}", response_model=schemas.Conversation)
async def update_conversation(
    conversation_id: int,
    conversation_update: schemas.ConversationUpdate,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Update conversation title"""
    conversation = crud.get_conversation(db, conversation_id=conversation_id, user_id=current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    updated = crud.update_conversation(db, conversation_id=conversation_id, updates=conversation_update)
    return updated

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: schemas.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """Delete a conversation"""
    conversation = crud.get_conversation(db, conversation_id=conversation_id, user_id=current_user.id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    crud.delete_conversation(db, conversation_id=conversation_id)
    return {"message": "Conversation deleted successfully"}
