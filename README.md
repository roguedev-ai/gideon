# Gideon - AI Chat MCP Studio

## Overview
A self-hosted AI chat interface with MCP server integration and vector database storage, similar to Ollama/OpenWebUI but with MCP capabilities and custom themes.

## Features

### ✅ **Current Implementation**
- **User Authentication**: JWT-based login/registration system
- **AI Chat**: OpenAI API integration with streaming responses
- **Conversation Management**: Create, view, rename, delete chat conversations
- **API Key Management**: Secure storage of user API keys
- **Database**: PostgreSQL with SQLAlchemy models
- **Vector Storage**: ChromaDB (local) + cloud providers ready
- **MCP Server Support**: Framework ready for MCP server integration
- **Theming**: Custom themes, logos, backgrounds support
- **API Documentation**: Full FastAPI auto-generated docs

### 🔄 **Next Phase Ready**
- React frontend foundation
- MCP server discovery and tools
- File upload vectorization
- Advanced chat features

## Quick Start

### 🚀 **Docker Deployment (Recommended - 3 minutes)**
The easiest way to get Gideon running:

```bash
# Clone and start everything
git clone <your-repo-url> gideon
cd gideon

# Start all services (database, vector DB, API)
docker-compose up -d

# Run health check
python3 test-backend.py

# Access the application
# API: http://localhost:8000/docs
# Frontend: Coming in Phase 2
```

### 🐧 **Native Installation (Advanced)**
If you prefer native installation:

#### 1. Environment Setup
```bash
# Install system dependencies
sudo apt update
sudo apt install python3.11 postgresql postgresql-contrib

# Install Python dependencies
cd projects/gideon/backend
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your database URL
```

#### 2. Database Setup
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb gideon_db
sudo -u postgres psql -c "CREATE USER gideon WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gideon_db TO gideon;"

# Run migrations
alembic upgrade head
```

#### 3. Start the Server
```bash
cd projects/gideon/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Access the Application
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Test Script**: `python3 test-backend.py`

## API Usage Examples

### Authentication
```bash
# Register
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'

# Login
curl -X POST "http://localhost:8000/api/auth/login/json" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Chat with OpenAI
```bash
# First, add an API key
curl -X POST "http://localhost:8000/api/users/api-keys" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "name": "My OpenAI Key", "api_key": "sk-YOUR_API_KEY"}'

# Chat
curl -X POST "http://localhost:8000/api/chat/chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "api_key_id": 1,
    "conversation_id": null,
    "model": "gpt-3.5-turbo"
  }'
```

### Conversation Management
```bash
# Get conversations
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/chat/conversations?limit=10"

# Get messages for a conversation
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/chat/conversations/1/messages"
```

## Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gideon_db

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Vector Databases (optional)
CHROMA_PATH=./data/chroma
WEAVIATE_URL=https://your-weaviate-instance.com
PINECONE_API_KEY=your-pinecone-key

# Server
PORT=8000
DEBUG=True
```

### Database Setup
```bash
# Create PostgreSQL database
createdb gideon_db

# Or use existing database, just update DATABASE_URL
```

## Project Structure

```
projects/gideon/
├── README.md                    # This file
├── backend/
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example            # Environment template
│   ├── alembic.ini             # Database migrations config
│   └── app/
│       ├── main.py             # FastAPI application
│       ├── database.py         # SQLAlchemy models
│       ├── schemas.py          # Pydantic schemas
│       ├── deps.py             # Dependencies/utilities
│       ├── auth/               # Authentication system
│       ├── users/              # User management
│       ├── chat/               # Chat functionality
│       ├── mcp/                # MCP server integration (ready)
│       └── vector/             # Vector database manager (ready)
└── frontend/                    # React app (next phase)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - JWT login
- `GET /api/auth/me` - Get current user

### Users & API Keys
- `GET /api/users/me` - User profile
- `PUT /api/users/me` - Update profile
- `GET/PUT /api/users/preferences` - User preferences/themes
- `POST /api/users/api-keys` - Add API key
- `GET /api/users/api-keys` - List API keys
- `DELETE /api/users/api-keys/{id}` - Delete API key

### Chat
- `POST /api/chat/chat` - Send chat message
- `POST /api/chat/chat/stream` - Streaming chat
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/conversations/{id}` - Get conversation
- `GET /api/chat/conversations/{id}/messages` - Get messages
- `PUT /api/chat/conversations/{id}` - Update conversation
- `DELETE /api/chat/conversations/{id}` - Delete conversation

### Vector Search (Ready for frontend)
- Conversation history search
- File vectorization support
- Multi-provider vector database

### MCP Servers (Framework Ready)
- Server registration
- Tool discovery
- Secure integration

## Security Features
- JWT authentication with refresh tokens
- Bcrypt password hashing
- API key encryption (framework implemented)
- User-specific data isolation
- Rate limiting ready for implementation

## Development Status

### Phase 1: Database + Chat ✅ COMPLETE
- Backend foundation with FastAPI
- PostgreSQL database with models
- OpenAI API integration
- User authentication
- Conversation management
- API key storage

### Phase 2: Frontend UI (Next)
- React application
- Chat interface
- Settings panels
- Theme customization

### Phase 3: MCP Integration (Ready)
- MCP server management
- Tool calling in chat
- Server discovery

### Phase 4: Advanced Features (Ready)
- File uploads + vectorization
- Cloud vector databases
- Multi-provider AI support

## Next Steps

1. **Test the Backend**: Follow the Quick Start above
2. **Add Frontend**: React app for the web interface
3. **MCP Integration**: Connect MCP servers for tool-enhanced conversations
4. **Vector Features**: File uploads and conversation search

## 🚀 Production Deployment

### **Docker Compose (Remote Server)**
```bash
# On your remote server
git clone <your-repo-url> gideon
cd gideon

# Edit docker-compose.yml for production settings
# Change passwords, enable SSL, etc.

# Start in production mode
docker-compose --profile production up -d

# Check status
docker-compose ps
docker-compose logs -f backend

# Run tests
python3 test-backend.py
```

### **Nginx + SSL (Production Setup)**
Create `nginx/nginx.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # API backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (when built)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API docs
    location /docs {
        proxy_pass http://backend:8000/docs;
    }
}
```

### **Security Checklist**
- ✅ Change default PostgreSQL passwords
- ✅ Use strong JWT secret key
- ✅ Enable SSL/HTTPS
- ✅ Configure firewall (only ports 80, 443, 22)
- ✅ Regular database backups
- ✅ Monitor logs and metrics

### **Scaling Considerations**
- **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **Vector DB**: Pinecone/Weaviate for better performance
- **API**: Add Redis for rate limiting and caching
- **Monitoring**: Add Prometheus + Grafana

The foundation is solid and production-ready. Each phase builds naturally on the previous one. Ready to continue with frontend development or MCP integration whenever you're prepared!
