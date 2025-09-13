"""
AI Chat MCP Studio Backend
FastAPI application for AI chat with MCP server integration and vector storage
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import chromadb
import weaviate
from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
            pinecone_client = Pinecone(api_key=pinecone_api_key)
            print("✓ Pinecone initialized")
        except Exception as e:
            print(f"✗ Pinecone initialization failed: {e}")

    # Initialize vector manager with clients
    vector_manager.initialize(chroma_client, weaviate_client, pinecone_client)

    yield

    # Cleanup on shutdown
    print("Shutting down AI Chat MCP Studio...")

# Create FastAPI app
app = FastAPI(
    title="AI Chat MCP Studio API",
    description="Backend API for AI chat with MCP server integration and vector storage",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
