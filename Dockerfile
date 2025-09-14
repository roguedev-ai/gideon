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

# Debug runtime environment and find uvicorn
RUN echo "=== RUNTIME DEBUG ===" && \
    echo "Current PATH: $PATH" && \
    echo "Finding uvicorn..." && \
    find /usr -name "uvicorn*" -type f 2>/dev/null && \
    echo "Python packages location:" && \
    ls -la /usr/local/bin/uv* 2>/dev/null || echo "No uvicorn in /usr/local/bin"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command with multiple fallback strategies
CMD ["sh", "-c", "\
    echo '=== STARTING BACKEND ===' && \
    echo 'PATH: '\$PATH && \
    (which uvicorn && echo 'Found uvicorn with which' && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1) || \
    (/usr/local/bin/uvicorn --version && echo 'Using /usr/local/bin/uvicorn' && /usr/local/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1) || \
    (pip install uvicorn && echo 'Reinstalling uvicorn...' && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1) || \
    echo 'ERROR: Cannot find uvicorn, failing gracefully'"]
