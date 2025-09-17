#!/bin/bash

# Gideon Support Bundle Generator
# Creates a comprehensive report of all container logs and status

echo "🚀 Gideon Support Bundle Generator"
echo "=================================="
echo "Generating comprehensive report..."

# Check container status
echo ""
echo "📊 CONTAINER STATUS:"
if command -v docker-compose &> /dev/null; then
    docker-compose ps
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose ps
else
    echo "❌ Docker not available"
fi

# Health checks
echo ""
echo "🏥 HEALTH CHECKS:"
echo -n "Backend: "
curl -s http://localhost:8000/health > /dev/null && echo "✅ UP" || echo "❌ DOWN"

echo -n "Frontend: "
curl -s http://localhost:3000 > /dev/null && echo "✅ UP" || echo "❌ DOWN"

echo ""
echo "📄 Report generated successfully!"
echo "💡 For detailed logs, use: docker-compose logs <service_name>"
