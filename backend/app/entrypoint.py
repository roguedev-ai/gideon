#!/usr/bin/env python3
"""
Gideon Backend Entrypoint Script
Comprehensive diagnostics and startup for Docker container
"""
import os
import sys
import subprocess
from pathlib import Path

def log_info(message):
    print(f"ℹ️ {message}", flush=True)

def log_success(message):
    print(f"✅ {message}", flush=True)

def log_error(message):
    print(f"❌ {message}", flush=True)

def run_command(command, check=False):
    """Run command and return (success, output)"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
        return True, result.stdout.strip() + result.stderr.strip()
    except subprocess.CalledProcessError as e:
        return False, e.stderr.strip() + e.stdout.strip()

def main():
    print("🚀 === Gideon Backend Container Diagnostics ===")
    print(f"Current user: {os.getlogin() if hasattr(os, 'getlogin') else 'unknown'}")
    print(f"Current directory: {os.getcwd()}")
    print(f"PATH: {os.environ.get('PATH', 'Not set')}")
    print(f"Python executable: {sys.executable}")
    print()

    # Check for required executables
    print("🔍 Checking required executables...")
    python_ok, _ = run_command("which python")
    pip_ok, _ = run_command("which pip")

    if python_ok:
        log_success("Python found")
    else:
        log_error("Python not found")

    if pip_ok:
        log_success("Pip found")
    else:
        log_error("Pip not found")

    print()

    # Check uvicorn installation
    print("🔍 Checking uvicorn installation...")
    try:
        import uvicorn
        log_success("uvicorn module found and importable")
        print(f"uvicorn version: {uvicorn.__version__}")
    except ImportError as e:
        log_error(f"uvicorn import failed: {e}")
        return 1

    print()

    # Check app structure
    print("🔍 Checking application structure...")
    main_py_path = Path("/app/app/main.py")
    if main_py_path.exists():
        log_success(f"main.py found at {main_py_path}")
        try:
            with open(main_py_path, 'r') as f:
                first_few_lines = '\n'.join(f.readlines()[:5])
            print("First few lines of main.py:")
            print(first_few_lines)
        except Exception as e:
            log_error(f"Could not read main.py: {e}")
    else:
        log_error("main.py not found at /app/app/main.py")
        print("Scanning for Python files...")
        for py_file in Path("/app").rglob("*.py"):
            print(f"Found: {py_file}")
        return 1

    print()

    # Try direct uvicorn run
    print("🚀 Starting Gideon Backend...")
    print("✅ Application setup verified - starting uvicorn directly")
    print()

    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            workers=1,
            log_level="info"
        )
    except Exception as e:
        log_error(f"Direct uvicorn run failed: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
