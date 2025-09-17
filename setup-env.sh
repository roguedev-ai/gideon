#!/bin/bash

# Gideon Environment Setup Script
# Handles complete environment setup: pull, rebuild, init db

echo "🚀 Gideon Environment Setup Script"
echo "=================================="

# Step 1: Pull latest changes
echo ""
echo "📥 Step 1: Pulling latest changes..."
if command -v git &> /dev/null && git status >/dev/null 2>&1; then
    git pull origin main
    echo "✅ Repository updated"
else
    echo "⚠️  Git not available or not a git repo"
fi

# Step 2: Stop containers
echo ""
echo "🛑 Step 2: Stopping existing containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose down
elif command -v docker &> /dev/null && docker compose version >/dev/null; then
    docker compose down
else
    echo "❌ Docker not available"
    exit 1
fi
echo "✅ Containers stopped"

# Step 3: Build and start
echo ""
echo "🏗️  Step 3: Building and starting containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
elif command -v docker &> /dev/null && docker compose version >/dev/null; then
    docker compose up --build -d
fi

echo ""
echo "⏳ Waiting 10 seconds for containers to start..."
sleep 10

# Step 4: Health checks
echo ""
echo "🏥 Step 4: Health checks..."
echo -n "Backend health: "
curl -s http://localhost:8000/health >/dev/null && echo "✅ OK" || echo "❌ FAILED"

# Step 5: Initialize database
echo ""
echo "🗄️  Step 5: Initializing database..."
if command -v docker-compose &> /dev/null; then
    docker-compose exec -T backend python -m app.init_db 2>/dev/null
elif command -v docker &> /dev/null && docker compose version >/dev/null; then
    docker compose exec -T backend python -m app.init_db 2>/dev/null
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🌐 Access your app:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
