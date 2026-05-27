"""
MediScan - API Security Module
==============================
Authentication, Rate Limiting, and Input Validation.

Features:
- API Key authentication
- Rate limiting per IP/API key
- Input sanitization
"""

import os
import time
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Callable
from functools import wraps
from collections import defaultdict
import threading
import re

from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader, APIKeyQuery

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

# API Keys - In production, load from database or secure vault
# Format: {"key_hash": {"name": "...", "permissions": [...], "rate_limit": N}}
API_KEYS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "api_keys.json")

# Default rate limits
DEFAULT_RATE_LIMIT = 60  # requests per minute
DEFAULT_RATE_WINDOW = 60  # seconds

# Sensitive endpoints that always require authentication
PROTECTED_ENDPOINTS = [
    "/patient/",
    "/analyze-with-history",
    "/clear-session",
    "/cache/clear"
]

# Public endpoints (no auth required)
PUBLIC_ENDPOINTS = [
    "/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json"
]

# ============================================================================
# API KEY MANAGEMENT
# ============================================================================

class APIKeyManager:
    """Manage API keys for authentication."""
    
    def __init__(self):
        self.keys: Dict[str, Dict] = {}
        self._load_keys()
    
    def _load_keys(self):
        """Load API keys from file or environment."""
        import json
        
        # Try loading from file
        try:
            if os.path.exists(API_KEYS_FILE):
                with open(API_KEYS_FILE, 'r') as f:
                    self.keys = json.load(f)
                logger.info(f"✅ Loaded {len(self.keys)} API keys from file")
                return
        except Exception as e:
            logger.warning(f"Could not load API keys file: {e}")
        
        # Load from environment
        env_key = os.getenv("MEDISCAN_API_KEY")
        if env_key:
            key_hash = self._hash_key(env_key)
            self.keys[key_hash] = {
                "name": "env_default",
                "permissions": ["all"],
                "rate_limit": 120,  # higher limit for main key
                "created_at": datetime.now().isoformat()
            }
            logger.info("✅ Loaded API key from environment")
        
        # Default development key (should be removed in production!)
        if not self.keys:
            dev_key = "mediscan-dev-key-2024"
            key_hash = self._hash_key(dev_key)
            self.keys[key_hash] = {
                "name": "development",
                "permissions": ["all"],
                "rate_limit": 100,
                "created_at": datetime.now().isoformat()
            }
            logger.warning(f"⚠️ Using development API key: {dev_key}")
    
    def _hash_key(self, key: str) -> str:
        """Hash an API key for secure storage."""
        return hashlib.sha256(key.encode()).hexdigest()
    
    def validate_key(self, api_key: str) -> Optional[Dict]:
        """
        Validate an API key.
        Returns key info if valid, None if invalid.
        """
        if not api_key:
            return None
        
        key_hash = self._hash_key(api_key)
        return self.keys.get(key_hash)
    
    def create_key(self, name: str, permissions: List[str] = None, rate_limit: int = None) -> str:
        """Create a new API key."""
        import secrets
        
        # Generate random key
        new_key = f"msk_{secrets.token_urlsafe(32)}"
        key_hash = self._hash_key(new_key)
        
        self.keys[key_hash] = {
            "name": name,
            "permissions": permissions or ["read"],
            "rate_limit": rate_limit or DEFAULT_RATE_LIMIT,
            "created_at": datetime.now().isoformat()
        }
        
        self._save_keys()
        logger.info(f"✅ Created API key for: {name}")
        
        return new_key
    
    def revoke_key(self, key_hash: str) -> bool:
        """Revoke an API key."""
        if key_hash in self.keys:
            del self.keys[key_hash]
            self._save_keys()
            logger.info(f"🗑️ Revoked API key: {key_hash[:16]}...")
            return True
        return False
    
    def _save_keys(self):
        """Save API keys to file."""
        import json
        try:
            os.makedirs(os.path.dirname(API_KEYS_FILE), exist_ok=True)
            with open(API_KEYS_FILE, 'w') as f:
                json.dump(self.keys, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save API keys: {e}")


# ============================================================================
# RATE LIMITER
# ============================================================================

class RateLimiter:
    """Rate limiter using sliding window algorithm."""
    
    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.lock = threading.RLock()
    
    def _clean_old_requests(self, key: str, window: int):
        """Remove requests outside the current window."""
        cutoff = time.time() - window
        self.requests[key] = [t for t in self.requests[key] if t > cutoff]
    
    def is_allowed(self, key: str, limit: int = DEFAULT_RATE_LIMIT, 
                   window: int = DEFAULT_RATE_WINDOW) -> tuple[bool, Dict]:
        """
        Check if a request is allowed.
        
        Returns:
            (allowed: bool, info: dict with remaining, reset_at, etc.)
        """
        with self.lock:
            current_time = time.time()
            self._clean_old_requests(key, window)
            
            request_count = len(self.requests[key])
            
            if request_count >= limit:
                reset_at = self.requests[key][0] + window
                return False, {
                    "limit": limit,
                    "remaining": 0,
                    "reset_at": datetime.fromtimestamp(reset_at).isoformat(),
                    "retry_after": int(reset_at - current_time)
                }
            
            # Allow request and record it
            self.requests[key].append(current_time)
            
            return True, {
                "limit": limit,
                "remaining": limit - request_count - 1,
                "reset_at": datetime.fromtimestamp(current_time + window).isoformat()
            }
    
    def get_usage(self, key: str, window: int = DEFAULT_RATE_WINDOW) -> Dict:
        """Get current usage for a key."""
        with self.lock:
            self._clean_old_requests(key, window)
            return {
                "requests": len(self.requests[key]),
                "window": window
            }


# ============================================================================
# INPUT SANITIZATION
# ============================================================================

class InputSanitizer:
    """Sanitize and validate user inputs."""
    
    # Dangerous patterns
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe',
        r'<object',
        r'<embed',
    ]
    
    SQL_PATTERNS = [
        r'\bUNION\b.*\bSELECT\b',
        r'\bDROP\b.*\bTABLE\b',
        r'\bDELETE\b.*\bFROM\b',
        r'--',
        r'/\*.*\*/',
    ]
    
    @classmethod
    def sanitize_text(cls, text: str, max_length: int = 10000) -> str:
        """
        Sanitize text input.
        
        - Removes script tags and XSS attempts
        - Truncates to max length
        - Strips dangerous characters
        """
        if not text:
            return ""
        
        # Truncate
        text = text[:max_length]
        
        # Remove XSS patterns
        for pattern in cls.XSS_PATTERNS:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        return text.strip()
    
    @classmethod
    def sanitize_patient_id(cls, patient_id: str) -> str:
        """Sanitize patient ID - alphanumeric and dashes only."""
        if not patient_id:
            return ""
        # Allow only alphanumeric, dash, underscore
        return re.sub(r'[^\w\-]', '', patient_id)[:64]
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename."""
        if not filename:
            return "unknown"
        # Remove path traversal attempts
        filename = os.path.basename(filename)
        # Allow only safe characters
        filename = re.sub(r'[^\w\.\-]', '_', filename)
        return filename[:255]
    
    @classmethod
    def is_safe_input(cls, text: str) -> tuple[bool, Optional[str]]:
        """
        Check if input is safe.
        Returns (is_safe, reason_if_unsafe)
        """
        if not text:
            return True, None
        
        # Check for SQL injection
        for pattern in cls.SQL_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return False, "Potential SQL injection detected"
        
        # Check for XSS
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return False, "Potential XSS attack detected"
        
        return True, None


# ============================================================================
# FASTAPI DEPENDENCIES
# ============================================================================

# Instances
api_key_manager = APIKeyManager()
rate_limiter = RateLimiter()
input_sanitizer = InputSanitizer()

# API Key header/query parameter
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)

async def get_api_key(
    request: Request,
    api_key_header: str = Security(api_key_header),
    api_key_query: str = Security(api_key_query)
) -> Optional[Dict]:
    """
    Dependency to validate API key from header or query.
    """
    # Get path
    path = request.url.path
    
    # Check if endpoint is public
    for public in PUBLIC_ENDPOINTS:
        if path == public or path.startswith(public):
            return {"name": "public", "permissions": ["read"]}
    
    # Get API key from header or query
    api_key = api_key_header or api_key_query
    
    # Check if endpoint requires authentication
    requires_auth = any(path.startswith(p) for p in PROTECTED_ENDPOINTS)
    
    if not api_key:
        if requires_auth:
            raise HTTPException(
                status_code=401,
                detail="API Key مطلوب. أضف X-API-Key في الـ header",
                headers={"WWW-Authenticate": "ApiKey"}
            )
        # Allow unauthenticated for non-protected endpoints (with lower rate limit)
        return {"name": "anonymous", "permissions": ["read"], "rate_limit": 30}
    
    # Validate key
    key_info = api_key_manager.validate_key(api_key)
    
    if not key_info:
        raise HTTPException(
            status_code=401,
            detail="API Key غير صالح",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    return key_info

async def check_rate_limit(request: Request, api_key_info: Dict = Depends(get_api_key)):
    """
    Dependency to check rate limits.
    """
    # Get client identifier (API key name or IP)
    client_id = api_key_info.get("name", "anonymous")
    if client_id == "anonymous":
        client_id = f"ip:{request.client.host}" if request.client else "unknown"
    
    # Get rate limit for this client
    limit = api_key_info.get("rate_limit", DEFAULT_RATE_LIMIT)
    
    # Check rate limit
    allowed, info = rate_limiter.is_allowed(client_id, limit)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"تجاوزت الحد المسموح ({limit} طلب/دقيقة). جرب بعد {info['retry_after']} ثانية",
            headers={
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": info["reset_at"],
                "Retry-After": str(info["retry_after"])
            }
        )
    
    # Add rate limit headers to response
    request.state.rate_limit_info = info
    
    return api_key_info


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def require_permission(permission: str):
    """Decorator to require specific permission."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, api_key_info: Dict = Depends(check_rate_limit), **kwargs):
            permissions = api_key_info.get("permissions", [])
            
            if "all" not in permissions and permission not in permissions:
                raise HTTPException(
                    status_code=403,
                    detail=f"صلاحية غير كافية. تحتاج صلاحية: {permission}"
                )
            
            return await func(*args, api_key_info=api_key_info, **kwargs)
        return wrapper
    return decorator


logger.info("✅ API Security module loaded")
