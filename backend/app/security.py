"""
Security utilities for Gideon AI Chat Studio
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Callable
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Security configuration
class SecurityConfig:
    # JWT settings
    SECRET_KEY = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set!")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # Encryption settings
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
    if not ENCRYPTION_KEY:
        # Generate a key if not provided (but warn this is not secure)
        print("⚠️  WARNING: ENCRYPTION_KEY not set! Generating temporary key.")
        print("   Set ENCRYPTION_KEY environment variable in production.")
        ENCRYPTION_KEY = base64.b64encode(os.urandom(32)).decode()

    # Password security
    MIN_PASSWORD_LENGTH = 8
    MAX_LOGIN_ATTEMPTS = 5
    ACCOUNT_LOCK_TIME_MINUTES = 15

    # Rate limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW", "900"))  # 15 minutes

    # CORS settings
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

def generate_secure_key() -> str:
    """Generate a secure random key for encryption"""
    return base64.b64encode(secrets.token_bytes(32)).decode()

def get_fernet_instance(encryption_key: str = None) -> Fernet:
    """Get Fernet instance for encryption"""
    key = encryption_key or SecurityConfig.ENCRYPTION_KEY
    # Ensure key is properly formatted for Fernet
    if len(base64.b64decode(key)) != 32:
        raise ValueError("ENCRYPTION_KEY must be a 32-byte base64 encoded string")
    return Fernet(key.encode())

def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for storage"""
    fernet = get_fernet_instance()
    encrypted = fernet.encrypt(api_key.encode())
    return encrypted.decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key for use"""
    fernet = get_fernet_instance()
    decrypted = fernet.decrypt(encrypted_key.encode())
    return decrypted.decode()

def hash_api_key_preview(api_key: str) -> str:
    """Create a preview hash of API key for display (first/last 4 chars)"""
    if len(api_key) <= 8:
        return "****"
    return f"{api_key[:4]}****{api_key[-4:]}"

def generate_secure_token() -> str:
    """Generate a secure random token"""
    return secrets.token_hex(32)

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength requirements"""
    if len(password) < SecurityConfig.MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {SecurityConfig.MIN_PASSWORD_LENGTH} characters"

    # Check for at least one uppercase, lowercase, and number
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)

    if not (has_upper and has_lower and has_digit):
        return False, "Password must contain uppercase, lowercase, and numeric characters"

    return True, "Password meets requirements"

def sanitize_input(text: str, max_length: int = 5000) -> str:
    """Sanitize user input to prevent common attacks"""
    if not text:
        return ""

    # Limit length to prevent DoS
    if len(text) > max_length:
        text = text[:max_length] + "...(truncated)"

    # Remove potential script injection patterns
    dangerous_patterns = [
        "<script", "</script>", "javascript:", "data:",
        "vbscript:", "onload=", "onerror=", "onclick="
    ]

    for pattern in dangerous_patterns:
        if pattern.lower() in text.lower():
            # Log security incident
            print(f"⚠️  SECURITY: Dangerous pattern detected in user input: {pattern}")
            # Replace with safe version
            text = text.replace(pattern, "[BLOCKED]")

    return text.strip()

def rate_limit_identifier(request, key_func: Optional[Callable] = None):
    """Generate rate limit identifier from request"""
    if key_func:
        return key_func(request)

    # Default: rate limit by IP
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        # Take first IP if there are multiple
        ip = forwarded.split(",")[0].strip()
    else:
        ip = getattr(request.client, 'host', 'unknown') if hasattr(request, 'client') and request.client else 'unknown'

    return f"ip:{ip}"

def generate_password_reset_token() -> str:
    """Generate a secure password reset token"""
    return secrets.token_urlsafe(32)

class SecurityHeaders:
    """Security headers for HTTP responses"""

    @staticmethod
    def get_headers():
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        }
