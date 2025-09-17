"""
AI Chat MCP Studio Backend
FastAPI application for AI chat with MCP server integration and vector storage
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import structlog
import chromadb
import weaviate
import pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Import our security config
from .security import SecurityConfig, SecurityHeaders

# Import routers
from .auth import router as auth_router
from .chat import router as chat_router
from .mcp import router as mcp_router
from .users import router as users_router
from .vector import vector_manager

# Vector database clients
chroma_client = None
weaviate_client = None
pinecone_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Initialize on startup
    global chroma_client, weaviate_client, pinecone_client

    # Initialize ChromaDB (local)
    try:
        chroma_client = chromadb.PersistentClient(path="./data/chroma")
        print("✓ ChromaDB initialized")
    except Exception as e:
        print(f"✗ ChromaDB initialization failed: {e}")

    # Initialize Weaviate (optional)
    weaviate_url = os.getenv("WEAVIATE_URL")
    if weaviate_url:
        try:
            weaviate_client = weaviate.Client(url=weaviate_url)
            print("✓ Weaviate initialized")
        except Exception as e:
            print(f"✗ Weaviate initialization failed: {e}")

    # Initialize Pinecone (optional)
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    if pinecone_api_key:
        try:
            pinecone.init(api_key=pinecone_api_key)
            pinecone_client = pinecone
            print("✓ Pinecone initialized")
        except Exception as e:
            print(f"✗ Pinecone initialization failed: {e}")

    # Initialize vector manager with clients
    vector_manager.initialize(chroma_client, weaviate_client, pinecone_client)

    yield

    # Cleanup on shutdown
    print("Shutting down AI Chat MCP Studio...")

# Rate limiting

# Create FastAPI app
app = FastAPI(
    title="AI Chat MCP Studio API",
    description="Secure Backend API for AI chat with MCP server integration and vector storage",
    version="1.0.0",
    lifespan=lifespan
)

# Enhanced CORS middleware with security config
app.add_middleware(
    CORSMiddleware,
    allow_origins=SecurityConfig.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    max_age=86400,  # 24 hours
)

# Rate limiter setup (moved here after app creation)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "vector_db": {
            "chroma": chroma_client is not None,
            "weaviate": weaviate_client is not None,
            "pinecone": pinecone_client is not None,
        }
    }

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(mcp_router, prefix="/api/mcp", tags=["MCP Servers"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
