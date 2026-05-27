"""
Rate Limiter & Quota Manager for LLM APIs
Handles 429 errors, exponential backoff, and smart fallback.
"""

import time
import logging
from typing import Dict, Optional, Callable, Any
from functools import wraps
from datetime import datetime, timedelta
import threading

logger = logging.getLogger(__name__)

# ============================================================================
# RATE LIMIT CONFIGURATION
# ============================================================================

RATE_LIMITS = {
    "gemini": {
        "requests_per_minute": 5,   # Conservative for free tier
        "tokens_per_minute": 30000,
        "cooldown_seconds": 60,
        "max_retries": 1
    },
    "groq": {
        "requests_per_minute": 15,
        "tokens_per_day": 14000,
        "cooldown_seconds": 60,
        "max_retries": 1
    },
    "openrouter": {
        "requests_per_minute": 20,
        "cooldown_seconds": 30,
        "max_retries": 2
    },
    "huggingface": {
        "requests_per_minute": 10,
        "cooldown_seconds": 30,
        "max_retries": 2
    }
}

# ============================================================================
# QUOTA TRACKER
# ============================================================================

class QuotaTracker:
    """Tracks API usage and enforces rate limits."""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self.usage: Dict[str, Dict] = {
            "gemini": {"requests": 0, "tokens": 0, "last_reset": datetime.now(), "errors_429": 0, "blocked_until": None},
            "groq": {"requests": 0, "tokens": 0, "last_reset": datetime.now(), "errors_429": 0, "blocked_until": None},
            "openrouter": {"requests": 0, "tokens": 0, "last_reset": datetime.now(), "errors_429": 0, "blocked_until": None},
            "huggingface": {"requests": 0, "tokens": 0, "last_reset": datetime.now(), "errors_429": 0, "blocked_until": None}
        }
        self._lock = threading.Lock()
        logger.info("📊 QuotaTracker initialized")
    
    def reset_if_needed(self, provider: str):
        """Reset counters if time window has passed."""
        with self._lock:
            data = self.usage.get(provider, {})
            now = datetime.now()
            last_reset = data.get("last_reset", now)
            
            # Reset every minute
            if (now - last_reset) > timedelta(minutes=1):
                data["requests"] = 0
                data["tokens"] = 0
                data["last_reset"] = now
                self.usage[provider] = data
    
    def can_make_request(self, provider: str) -> bool:
        """Check if we can make a request to this provider."""
        self.reset_if_needed(provider)
        
        with self._lock:
            data = self.usage.get(provider, {})
            limits = RATE_LIMITS.get(provider, {})
            
            # Check if blocked
            blocked_until = data.get("blocked_until")
            if blocked_until and datetime.now() < blocked_until:
                remaining = (blocked_until - datetime.now()).seconds
                logger.warning(f"⏳ {provider} blocked for {remaining}s more")
                return False
            
            # Check request limit
            max_requests = limits.get("requests_per_minute", 100)
            if data.get("requests", 0) >= max_requests:
                logger.warning(f"🚫 {provider} hit request limit ({max_requests}/min)")
                return False
            
            return True
    
    def record_request(self, provider: str, tokens: int = 0):
        """Record a successful request."""
        with self._lock:
            if provider not in self.usage:
                self.usage[provider] = {"requests": 0, "tokens": 0, "last_reset": datetime.now(), "errors_429": 0}
            
            self.usage[provider]["requests"] += 1
            self.usage[provider]["tokens"] += tokens
    
    def record_error_429(self, provider: str):
        """Record a 429 error and set cooldown."""
        with self._lock:
            if provider not in self.usage:
                self.usage[provider] = {"requests": 0, "tokens": 0, "last_reset": datetime.now(), "errors_429": 0}
            
            self.usage[provider]["errors_429"] += 1
            error_count = self.usage[provider]["errors_429"]
            
            # Exponential cooldown: 1min, 2min, 5min, 10min
            cooldown_minutes = min(10, 2 ** (error_count - 1))
            self.usage[provider]["blocked_until"] = datetime.now() + timedelta(minutes=cooldown_minutes)
            
            logger.error(f"⛔ {provider} 429 ERROR #{error_count}. Blocked for {cooldown_minutes} min")
    
    def get_status(self) -> Dict:
        """Get current quota status for all providers."""
        status = {}
        for provider, data in self.usage.items():
            limits = RATE_LIMITS.get(provider, {})
            status[provider] = {
                "requests_used": data.get("requests", 0),
                "requests_limit": limits.get("requests_per_minute", "N/A"),
                "tokens_used": data.get("tokens", 0),
                "errors_429": data.get("errors_429", 0),
                "is_blocked": data.get("blocked_until") and datetime.now() < data["blocked_until"]
            }
        return status
    
    def log_status(self):
        """Log current status."""
        status = self.get_status()
        logger.info("📊 API Quota Status:")
        for provider, info in status.items():
            blocked = "🔴 BLOCKED" if info["is_blocked"] else "🟢 OK"
            logger.info(f"  {provider}: {info['requests_used']}/{info['requests_limit']} req | {blocked}")


# Global tracker instance
quota_tracker = QuotaTracker()

# ============================================================================
# EXPONENTIAL BACKOFF DECORATOR
# ============================================================================

def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    provider: str = "unknown"
):
    """
    Decorator for automatic retry with exponential backoff.
    Handles 429, timeout, and network errors.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    # Check quota before making request
                    if not quota_tracker.can_make_request(provider):
                        raise RateLimitError(f"{provider} is rate limited")
                    
                    # Make the request
                    result = func(*args, **kwargs)
                    
                    # Record successful request
                    quota_tracker.record_request(provider)
                    return result
                    
                except Exception as e:
                    last_exception = e
                    error_str = str(e).lower()
                    
                    # Check for 429 errors
                    if "429" in str(e) or "rate" in error_str or "quota" in error_str or "limit" in error_str:
                        quota_tracker.record_error_429(provider)
                        
                        if attempt < max_retries:
                            delay = min(base_delay * (2 ** attempt), max_delay)
                            logger.warning(f"⏳ {provider} retry {attempt+1}/{max_retries} in {delay:.1f}s...")
                            time.sleep(delay)
                            continue
                    
                    # Check for timeout errors
                    elif "timeout" in error_str or "timed out" in error_str:
                        if attempt < max_retries:
                            delay = min(base_delay * (2 ** attempt), max_delay)
                            logger.warning(f"⏳ {provider} timeout, retry {attempt+1}/{max_retries} in {delay:.1f}s...")
                            time.sleep(delay)
                            continue
                    
                    # Other errors - don't retry
                    else:
                        raise
            
            # All retries exhausted
            raise last_exception or Exception(f"{provider} failed after {max_retries} retries")
        
        return wrapper
    return decorator


class RateLimitError(Exception):
    """Custom exception for rate limit errors."""
    pass


# ============================================================================
# REQUEST THROTTLER
# ============================================================================

class RequestThrottler:
    """Throttles requests to stay under rate limits."""
    
    def __init__(self, requests_per_minute: int = 10):
        self.rpm = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request = 0
        self._lock = threading.Lock()
    
    def wait(self):
        """Wait if needed to respect rate limit."""
        with self._lock:
            now = time.time()
            elapsed = now - self.last_request
            
            if elapsed < self.interval:
                sleep_time = self.interval - elapsed
                logger.debug(f"Throttling: sleeping {sleep_time:.2f}s")
                time.sleep(sleep_time)
            
            self.last_request = time.time()


# Throttlers for each provider
throttlers = {
    "gemini": RequestThrottler(RATE_LIMITS["gemini"]["requests_per_minute"]),
    "groq": RequestThrottler(RATE_LIMITS["groq"]["requests_per_minute"]),
    "openrouter": RequestThrottler(RATE_LIMITS["openrouter"]["requests_per_minute"]),
    "huggingface": RequestThrottler(RATE_LIMITS["huggingface"]["requests_per_minute"])
}

def throttle_request(provider: str):
    """Apply throttling for a provider."""
    if provider in throttlers:
        throttlers[provider].wait()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def is_rate_limit_error(exception: Exception) -> bool:
    """Check if exception is a rate limit error."""
    error_str = str(exception).lower()
    keywords = ["429", "rate", "quota", "limit", "exceeded", "too many"]
    return any(kw in error_str for kw in keywords)


def get_best_available_provider() -> Optional[str]:
    """Get the best provider that's not rate limited."""
    priority = ["gemini", "groq", "openrouter", "huggingface"]
    
    for provider in priority:
        if quota_tracker.can_make_request(provider):
            return provider
    
    return None


def estimate_tokens(text: str) -> int:
    """Rough token estimation (4 chars ≈ 1 token)."""
    return len(text) // 4
