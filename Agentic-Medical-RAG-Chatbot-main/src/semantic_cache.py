# ============================================================================
# semantic_cache.py - كاش دلالي للاستعلامات
# ============================================================================

"""
MediScan - Semantic Cache Module
RAG Best Practices Implementation:
- Layer 1: Exact match cache (fast, simple)
- Layer 2: Semantic similarity cache (threshold 0.92)
- TTL-based expiration

Potential savings: 50-70% reduction in LLM calls
"""

import time
import hashlib
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from collections import OrderedDict
import threading

logger = logging.getLogger(__name__)


# ============================================================================
# CONFIGURATION
# ============================================================================

# Try to import from config
try:
    from config import (
        SEMANTIC_CACHE_ENABLED,
        SEMANTIC_CACHE_THRESHOLD,
        SEMANTIC_CACHE_TTL,
        SEMANTIC_CACHE_MAX_SIZE,
    )
except ImportError:
    SEMANTIC_CACHE_ENABLED = True
    SEMANTIC_CACHE_THRESHOLD = 0.92  # High threshold to avoid false positives
    SEMANTIC_CACHE_TTL = 3600  # 1 hour
    SEMANTIC_CACHE_MAX_SIZE = 1000  # Max entries


@dataclass
class CacheEntry:
    """Single cache entry with metadata."""
    query: str
    response: str
    embedding: Optional[List[float]] = None
    created_at: float = field(default_factory=time.time)
    hits: int = 0
    
    def is_expired(self, ttl: int) -> bool:
        return time.time() - self.created_at > ttl


class SemanticCache:
    """
    Two-layer semantic cache for LLM responses.
    
    Layer 1: Exact match (hash-based, O(1))
    Layer 2: Semantic similarity (vector-based, O(n))
    
    Thread-safe implementation.
    """
    
    def __init__(
        self,
        threshold: float = SEMANTIC_CACHE_THRESHOLD,
        ttl: int = SEMANTIC_CACHE_TTL,
        max_size: int = SEMANTIC_CACHE_MAX_SIZE,
        enabled: bool = SEMANTIC_CACHE_ENABLED
    ):
        self.threshold = threshold
        self.ttl = ttl
        self.max_size = max_size
        self.enabled = enabled
        
        # Layer 1: Hash -> CacheEntry
        self._exact_cache: Dict[str, CacheEntry] = {}
        
        # Layer 2: Ordered dict for LRU eviction
        self._semantic_cache: OrderedDict[str, CacheEntry] = OrderedDict()
        
        # Statistics
        self._stats = {
            'exact_hits': 0,
            'semantic_hits': 0,
            'misses': 0,
            'total_queries': 0,
        }
        
        # Thread lock
        self._lock = threading.RLock()
        
        # Embedding model (lazy loaded)
        self._embedder = None
        
        logger.info(f"🧠 Semantic cache initialized (threshold={threshold}, ttl={ttl}s)")
    
    def _get_hash(self, query: str) -> str:
        """Generate hash for exact matching."""
        normalized = query.lower().strip()
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _get_embedding(self, text: str) -> Optional[List[float]]:
        """Get embedding for text (lazy load embedder)."""
        if self._embedder is None:
            try:
                from config import company_embeddings
                self._embedder = company_embeddings
                logger.info("✅ Embedder loaded for semantic cache")
            except Exception as e:
                logger.warning(f"⚠️ Could not load embedder: {e}")
                return None
        
        try:
            embedding = self._embedder.embed_query(text)
            return embedding
        except Exception as e:
            logger.warning(f"⚠️ Embedding failed: {e}")
            return None
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not a or not b or len(a) != len(b):
            return 0.0
        
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot_product / (norm_a * norm_b)
    
    def _evict_expired(self):
        """Remove expired entries."""
        current_time = time.time()
        
        # Clean exact cache
        expired_exact = [
            k for k, v in self._exact_cache.items()
            if current_time - v.created_at > self.ttl
        ]
        for k in expired_exact:
            del self._exact_cache[k]
        
        # Clean semantic cache
        expired_semantic = [
            k for k, v in self._semantic_cache.items()
            if current_time - v.created_at > self.ttl
        ]
        for k in expired_semantic:
            del self._semantic_cache[k]
    
    def _evict_lru(self):
        """Evict least recently used if over max size."""
        while len(self._semantic_cache) > self.max_size:
            self._semantic_cache.popitem(last=False)
    
    def get(self, query: str) -> Optional[str]:
        """
        Try to get cached response for query.
        
        Args:
            query: User query
            
        Returns:
            Cached response if found, None otherwise
        """
        if not self.enabled:
            return None
        
        with self._lock:
            self._stats['total_queries'] += 1
            
            # Clean expired entries periodically
            if self._stats['total_queries'] % 100 == 0:
                self._evict_expired()
            
            # Layer 1: Exact match
            query_hash = self._get_hash(query)
            if query_hash in self._exact_cache:
                entry = self._exact_cache[query_hash]
                if not entry.is_expired(self.ttl):
                    entry.hits += 1
                    self._stats['exact_hits'] += 1
                    logger.debug(f"🎯 Exact cache hit for: {query[:30]}...")
                    return entry.response
            
            # Layer 2: Semantic similarity
            query_embedding = self._get_embedding(query)
            if query_embedding:
                best_match: Optional[Tuple[str, CacheEntry, float]] = None
                
                for key, entry in self._semantic_cache.items():
                    if entry.is_expired(self.ttl):
                        continue
                    if entry.embedding:
                        similarity = self._cosine_similarity(query_embedding, entry.embedding)
                        if similarity >= self.threshold:
                            if best_match is None or similarity > best_match[2]:
                                best_match = (key, entry, similarity)
                
                if best_match:
                    _, entry, sim = best_match
                    entry.hits += 1
                    self._stats['semantic_hits'] += 1
                    
                    # Move to end (most recently used)
                    self._semantic_cache.move_to_end(best_match[0])
                    
                    logger.info(f"🧠 Semantic cache hit ({sim:.2%}) for: {query[:30]}...")
                    return entry.response
            
            self._stats['misses'] += 1
            return None
    
    def set(self, query: str, response: str):
        """
        Store query-response pair in cache.
        
        Args:
            query: User query
            response: LLM response
        """
        if not self.enabled:
            return
        
        with self._lock:
            query_hash = self._get_hash(query)
            embedding = self._get_embedding(query)
            
            entry = CacheEntry(
                query=query,
                response=response,
                embedding=embedding,
            )
            
            # Store in exact cache
            self._exact_cache[query_hash] = entry
            
            # Store in semantic cache if embedding available
            if embedding:
                self._semantic_cache[query_hash] = entry
                self._evict_lru()
            
            logger.debug(f"💾 Cached response for: {query[:30]}...")
    
    def clear(self):
        """Clear all cache entries."""
        with self._lock:
            self._exact_cache.clear()
            self._semantic_cache.clear()
            logger.info("🗑️ Cache cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            total = self._stats['total_queries']
            hits = self._stats['exact_hits'] + self._stats['semantic_hits']
            hit_rate = hits / total if total > 0 else 0
            
            return {
                'total_queries': total,
                'exact_hits': self._stats['exact_hits'],
                'semantic_hits': self._stats['semantic_hits'],
                'misses': self._stats['misses'],
                'hit_rate': f"{hit_rate:.1%}",
                'exact_cache_size': len(self._exact_cache),
                'semantic_cache_size': len(self._semantic_cache),
                'enabled': self.enabled,
            }


# ============================================================================
# GLOBAL INSTANCE
# ============================================================================

_semantic_cache: Optional[SemanticCache] = None


def get_semantic_cache() -> SemanticCache:
    """Get or create global semantic cache instance."""
    global _semantic_cache
    if _semantic_cache is None:
        _semantic_cache = SemanticCache()
    return _semantic_cache


# Convenience functions
def cache_get(query: str) -> Optional[str]:
    """Get cached response."""
    return get_semantic_cache().get(query)


def cache_set(query: str, response: str):
    """Store response in cache."""
    get_semantic_cache().set(query, response)


def cache_clear():
    """Clear cache."""
    get_semantic_cache().clear()


def cache_stats() -> Dict[str, Any]:
    """Get cache stats."""
    return get_semantic_cache().get_stats()


# Quick test
if __name__ == "__main__":
    cache = SemanticCache(enabled=True)
    
    # Test exact match
    cache.set("ما هو علاج السكر", "العلاج يتضمن...")
    result = cache.get("ما هو علاج السكر")
    print(f"Exact match: {result[:30]}..." if result else "No match")
    
    # Stats
    print(f"\nStats: {cache.get_stats()}")
