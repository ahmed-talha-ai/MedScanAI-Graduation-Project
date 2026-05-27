"""
MediScan - Response Cache Module
================================
In-memory caching for API responses with TTL support.

Features:
- LRU Cache for chat responses
- Image hash-based caching for analysis results
- Configurable TTL (time-to-live)
- Thread-safe operations
"""

import hashlib
import threading
import time
from typing import Optional, Any, Dict
from functools import lru_cache
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# CACHE CONFIGURATION
# ============================================================================

CACHE_CONFIG = {
    "chat_ttl_seconds": 3600,        # 1 hour for chat responses
    "image_ttl_seconds": 7200,       # 2 hours for image analysis
    "max_chat_entries": 500,         # Max cached chat responses
    "max_image_entries": 100,        # Max cached image analyses
    "enabled": True,                 # Enable/disable caching
}

# ============================================================================
# TTL CACHE IMPLEMENTATION
# ============================================================================

class TTLCache:
    """Thread-safe cache with TTL (Time-To-Live) support."""
    
    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.lock = threading.RLock()
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate a unique cache key from arguments."""
        key_data = str(args) + str(sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if a cache entry has expired."""
        return time.time() - entry["timestamp"] > self.ttl_seconds
    
    def _cleanup_expired(self):
        """Remove expired entries."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if current_time - entry["timestamp"] > self.ttl_seconds
        ]
        for key in expired_keys:
            del self.cache[key]
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                if not self._is_expired(entry):
                    # Move to end (most recently used)
                    self.cache.move_to_end(key)
                    self.hits += 1
                    logger.debug(f"Cache HIT: {key[:16]}...")
                    return entry["value"]
                else:
                    # Remove expired entry
                    del self.cache[key]
            
            self.misses += 1
            logger.debug(f"Cache MISS: {key[:16]}...")
            return None
    
    def set(self, key: str, value: Any) -> None:
        """Set a value in cache."""
        with self.lock:
            # Remove oldest if at capacity
            while len(self.cache) >= self.max_size:
                self.cache.popitem(last=False)
            
            self.cache[key] = {
                "value": value,
                "timestamp": time.time()
            }
            logger.debug(f"Cache SET: {key[:16]}...")
    
    def invalidate(self, key: str) -> bool:
        """Remove a specific key from cache."""
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                return True
            return False
    
    def clear(self) -> int:
        """Clear all cache entries. Returns number of entries cleared."""
        with self.lock:
            count = len(self.cache)
            self.cache.clear()
            self.hits = 0
            self.misses = 0
            logger.info(f"Cache cleared: {count} entries removed")
            return count
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self.lock:
            total = self.hits + self.misses
            hit_rate = (self.hits / total * 100) if total > 0 else 0
            return {
                "entries": len(self.cache),
                "max_size": self.max_size,
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate": f"{hit_rate:.1f}%",
                "ttl_seconds": self.ttl_seconds
            }

# ============================================================================
# CACHE INSTANCES
# ============================================================================

# Chat response cache
chat_cache = TTLCache(
    max_size=CACHE_CONFIG["max_chat_entries"],
    ttl_seconds=CACHE_CONFIG["chat_ttl_seconds"]
)

# Image analysis cache
image_cache = TTLCache(
    max_size=CACHE_CONFIG["max_image_entries"],
    ttl_seconds=CACHE_CONFIG["image_ttl_seconds"]
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_chat_cache_key(message: str, session_id: Optional[str] = None) -> str:
    """Generate cache key for chat messages."""
    # Normalize message (lowercase, strip whitespace)
    normalized = message.lower().strip()
    key_data = f"chat:{normalized}"
    return hashlib.md5(key_data.encode()).hexdigest()

def get_image_cache_key(image_path: str) -> str:
    """Generate cache key based on image file hash."""
    try:
        with open(image_path, "rb") as f:
            # Read first 1MB for large files
            file_hash = hashlib.md5(f.read(1024 * 1024)).hexdigest()
        return f"img:{file_hash}"
    except Exception as e:
        logger.warning(f"Could not hash image: {e}")
        return f"img:{hashlib.md5(image_path.encode()).hexdigest()}"

def cache_chat_response(message: str, response: str) -> None:
    """Cache a chat response."""
    if not CACHE_CONFIG["enabled"]:
        return
    key = get_chat_cache_key(message)
    chat_cache.set(key, response)

def get_cached_chat_response(message: str) -> Optional[str]:
    """Get cached chat response if available."""
    if not CACHE_CONFIG["enabled"]:
        return None
    key = get_chat_cache_key(message)
    return chat_cache.get(key)

def cache_image_analysis(image_path: str, analysis: str) -> None:
    """Cache an image analysis result."""
    if not CACHE_CONFIG["enabled"]:
        return
    key = get_image_cache_key(image_path)
    image_cache.set(key, analysis)

def get_cached_image_analysis(image_path: str) -> Optional[str]:
    """Get cached image analysis if available."""
    if not CACHE_CONFIG["enabled"]:
        return None
    key = get_image_cache_key(image_path)
    return image_cache.get(key)

def get_all_cache_stats() -> Dict[str, Any]:
    """Get statistics for all caches."""
    return {
        "chat_cache": chat_cache.stats(),
        "image_cache": image_cache.stats(),
        "enabled": CACHE_CONFIG["enabled"]
    }

def clear_all_caches() -> Dict[str, int]:
    """Clear all caches."""
    return {
        "chat_cleared": chat_cache.clear(),
        "image_cleared": image_cache.clear()
    }

# ============================================================================
# DECORATOR FOR EASY CACHING
# ============================================================================

def cached_response(cache_type: str = "chat", ttl: Optional[int] = None):
    """
    Decorator to cache function responses.
    
    Usage:
        @cached_response(cache_type="chat")
        def get_response(message: str) -> str:
            ...
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            if not CACHE_CONFIG["enabled"]:
                return func(*args, **kwargs)
            
            # Generate cache key from arguments
            key_data = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            cache_key = hashlib.md5(key_data.encode()).hexdigest()
            
            # Select cache
            cache = chat_cache if cache_type == "chat" else image_cache
            
            # Check cache
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result)
            return result
        
        return wrapper
    return decorator

logger.info("✅ Cache module loaded")
