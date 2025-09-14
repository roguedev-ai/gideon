#!/bin/bash
set -e

echo "=== Gideon Backend Container Diagnostics ==="
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"
echo "PATH: $PATH"

# Ensure core binaries exist
echo "Checking for required executables..."
which python && echo "✅ Python found" || echo "❌ Python not found"
which pip && echo "✅ Pip found" || echo "❌ Pip not found"

# Check uvicorn installation
echo "Checking uvicorn installation..."
python -c "import uvicorn; print('✅ uvicorn import successful')" && echo "✅ uvicorn module found" || echo "❌ uvicorn module not found"

# Check FASTAPI app
echo "Checking FASTAPI app structure..."
if [ -f "/app/app/main.py" ]; then
    echo "✅ main.py found at /app/app/main.py"
    head -5 /app/app/main.py
else
    echo "❌ main.py not found at /app/app/main.py"
    find /app -name "*.py" | head -10
fi

# Launch the application with maximum flexibility
echo ""
echo "=== Starting Gideon Backend ==="

# Try multiple startup methods
echo "Attempt 1: python -m uvicorn (recommended)"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 && exit 0

echo "Attempt 2: Direct uvicorn module call"
python -c "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=8000, workers=1)" && exit 0

echo "Attempt 3: Find uvicorn binary and use it"
UVICORN_PATH=$(which uvicorn 2>/dev/null || find /usr -name "uvicorn" -type f 2>/dev/null | head -1)
if [ -n "$UVICORN_PATH" ]; then
    echo "Found uvicorn at: $UVICORN_PATH"
    "$UVICORN_PATH" app.main:app --host 0.0.0.0 --port 8000 --workers 1 && exit 0
else
    echo "❌ No uvicorn executable found in PATH or system"
fi

echo ""
echo "❌ ALL STARTUP METHODS FAILED - DIAGNOSTIC INFO ABOVE"
echo "Core files detected:"
ls -la /app/
echo ""
echo "Python site packages:"
python -c "import site; print(site.getsitepackages())"
echo ""
out "Exiting with failure - check diagnostic information above"
exit 1
