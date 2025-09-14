# Gideon AI Chat MCP Studio - Backend Dockerfile

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies (before creating user to ensure proper permissions)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables including proper PATH for Python bins
ENV PYTHONPATH=/app
ENV PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Create non-root user and set proper ownership
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Copy application code
COPY --chown=app:app backend/app ./app
COPY --chown=app:app alembic.ini ./alembic.ini

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
