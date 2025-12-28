"""
Cache service for The Local Guide application.
Supports both Redis and in-memory caching with automatic fallback.
"""

import os
import json
import hashlib
import logging
from typing import Optional, Dict, Any, Union
from datetime import datetime, timedelta
from abc import ABC, abstractmethod

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.config import settings

logger = logging.getLogger(__name__)


class CacheBackend(ABC):
    """Abstract base class for cache backends."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        pass
    
    @abstractmethod
    async def set(self, key: str, value: str, ttl_seconds: int = 3600) -> bool:
        """Set value in cache with TTL."""
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        pass
    
    @abstractmethod
    async def clear(self) -> bool:
        """Clear all cache entries."""
        pass
    
    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        pass
    
    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        pass


class RedisBackend(CacheBackend):
    """Redis cache backend."""
    
    def __init__(self, redis_url: str = None):
        """Initialize Redis backend."""
        if not REDIS_AVAILABLE:
            raise ImportError("Redis package not available")
        
        self.redis_url = redis_url or settings.redis_url
        self.client = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis."""
        try:
            self.client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            self.client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.client = None
            raise
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis cache."""
        if not self.client:
            return None
        
        try:
            return self.client.get(key)
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None
    
    async def set(self, key: str, value: str, ttl_seconds: int = 3600) -> bool:
        """Set value in Redis cache with TTL."""
        if not self.client:
            return False
        
        try:
            return self.client.setex(key, ttl_seconds, value)
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis cache."""
        if not self.client:
            return False
        
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False
    
    async def clear(self) -> bool:
        """Clear all Redis cache entries."""
        if not self.client:
            return False
        
        try:
            return self.client.flushdb()
        except Exception as e:
            logger.error(f"Redis CLEAR error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis cache."""
        if not self.client:
            return False
        
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get Redis cache statistics."""
        if not self.client:
            return {"backend": "redis", "status": "disconnected"}
        
        try:
            info = self.client.info()
            return {
                "backend": "redis",
                "status": "connected",
                "used_memory": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(
                    info.get("keyspace_hits", 0),
                    info.get("keyspace_misses", 0)
                )
            }
        except Exception as e:
            logger.error(f"Redis STATS error: {e}")
            return {"backend": "redis", "status": "error", "error": str(e)}
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate."""
        total = hits + misses
        return (hits / total) if total > 0 else 0.0
    
    def is_available(self) -> bool:
        """Check if Redis is available."""
        return self.client is not None


class InMemoryBackend(CacheBackend):
    """In-memory cache backend with TTL support."""
    
    def __init__(self, max_size: int = None):
        """Initialize in-memory backend."""
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._max_size = max_size or settings.max_cache_size
        self._stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "evictions": 0
        }
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from in-memory cache."""
        if key not in self._cache:
            self._stats["misses"] += 1
            return None
        
        entry = self._cache[key]
        
        # Check if expired
        if datetime.now() > entry["expires_at"]:
            del self._cache[key]
            self._stats["misses"] += 1
            return None
        
        self._stats["hits"] += 1
        return entry["value"]
    
    async def set(self, key: str, value: str, ttl_seconds: int = 3600) -> bool:
        """Set value in in-memory cache with TTL."""
        try:
            # Check if we need to evict entries to make room
            if len(self._cache) >= self._max_size:
                self._evict_oldest()
            
            expires_at = datetime.now() + timedelta(seconds=ttl_seconds)
            self._cache[key] = {
                "value": value,
                "expires_at": expires_at,
                "created_at": datetime.now()
            }
            self._stats["sets"] += 1
            return True
        except Exception as e:
            logger.error(f"In-memory SET error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from in-memory cache."""
        if key in self._cache:
            del self._cache[key]
            self._stats["deletes"] += 1
            return True
        return False
    
    async def clear(self) -> bool:
        """Clear all in-memory cache entries."""
        self._cache.clear()
        return True
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in in-memory cache."""
        if key not in self._cache:
            return False
        
        entry = self._cache[key]
        
        # Check if expired
        if datetime.now() > entry["expires_at"]:
            del self._cache[key]
            return False
        
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """Get in-memory cache statistics."""
        # Clean expired entries for accurate count
        self._cleanup_expired()
        
        total_requests = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total_requests) if total_requests > 0 else 0.0
        
        return {
            "backend": "in_memory",
            "status": "active",
            "total_entries": len(self._cache),
            "max_size": self._max_size,
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "sets": self._stats["sets"],
            "deletes": self._stats["deletes"],
            "evictions": self._stats["evictions"],
            "hit_rate": hit_rate
        }
    
    def _evict_oldest(self):
        """Evict the oldest entry from cache."""
        if not self._cache:
            return
        
        # Find the oldest entry
        oldest_key = min(
            self._cache.keys(),
            key=lambda k: self._cache[k]["created_at"]
        )
        
        del self._cache[oldest_key]
        self._stats["evictions"] += 1
        logger.debug(f"Evicted oldest cache entry: {oldest_key[:8]}...")
    
    def _cleanup_expired(self):
        """Remove expired entries from cache."""
        now = datetime.now()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now > entry["expires_at"]
        ]
        
        for key in expired_keys:
            del self._cache[key]
    
    def is_available(self) -> bool:
        """Check if in-memory cache is available."""
        return True


class CacheService:
    """
    Cache service with automatic Redis/in-memory fallback.
    Provides a unified interface for caching operations.
    """
    
    def __init__(self, prefer_redis: bool = True):
        """
        Initialize cache service.
        
        Args:
            prefer_redis: Whether to prefer Redis over in-memory cache
        """
        self.backend: CacheBackend = None
        self._initialize_backend(prefer_redis)
    
    def _initialize_backend(self, prefer_redis: bool):
        """Initialize cache backend with fallback."""
        if prefer_redis and REDIS_AVAILABLE and settings.is_redis_preferred():
            try:
                self.backend = RedisBackend()
                logger.info("Using Redis cache backend")
                return
            except Exception as e:
                logger.warning(f"Failed to initialize Redis backend: {e}")
        
        # Fallback to in-memory cache
        self.backend = InMemoryBackend()
        logger.info("Using in-memory cache backend")
    
    def generate_key(self, prefix: str, *args, **kwargs) -> str:
        """
        Generate a cache key from prefix and arguments.
        
        Args:
            prefix: Key prefix (e.g., 'translation', 'speech')
            *args: Positional arguments to include in key
            **kwargs: Keyword arguments to include in key
            
        Returns:
            Generated cache key
        """
        # Create a deterministic string from arguments
        key_parts = [prefix]
        
        # Add positional arguments
        for arg in args:
            if isinstance(arg, (str, int, float, bool)):
                key_parts.append(str(arg))
            else:
                key_parts.append(str(hash(str(arg))))
        
        # Add keyword arguments (sorted for consistency)
        for key, value in sorted(kwargs.items()):
            if isinstance(value, (str, int, float, bool)):
                key_parts.append(f"{key}:{value}")
            else:
                key_parts.append(f"{key}:{hash(str(value))}")
        
        # Create hash of the combined key for consistent length
        key_string = ":".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    async def get_json(self, key: str) -> Optional[Dict[str, Any]]:
        """Get JSON value from cache."""
        value = await self.backend.get(key)
        if value is None:
            return None
        
        try:
            return json.loads(value)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON from cache key {key}: {e}")
            # Remove corrupted entry
            await self.backend.delete(key)
            return None
    
    async def set_json(self, key: str, value: Dict[str, Any], ttl_seconds: int = 3600) -> bool:
        """Set JSON value in cache."""
        try:
            json_value = json.dumps(value, default=str)  # default=str handles datetime objects
            return await self.backend.set(key, json_value, ttl_seconds)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to encode JSON for cache key {key}: {e}")
            return False
    
    async def get(self, key: str) -> Optional[str]:
        """Get string value from cache."""
        return await self.backend.get(key)
    
    async def set(self, key: str, value: str, ttl_seconds: int = 3600) -> bool:
        """Set string value in cache."""
        return await self.backend.set(key, value, ttl_seconds)
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        return await self.backend.delete(key)
    
    async def clear(self) -> bool:
        """Clear all cache entries."""
        return await self.backend.clear()
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        return await self.backend.exists(key)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return self.backend.get_stats()
    
    def is_available(self) -> bool:
        """Check if cache service is available."""
        return self.backend is not None and self.backend.is_available()
    
    def get_backend_type(self) -> str:
        """Get the type of cache backend being used."""
        if isinstance(self.backend, RedisBackend):
            return "redis"
        elif isinstance(self.backend, InMemoryBackend):
            return "in_memory"
        else:
            return "unknown"


# Global cache service instance
cache_service = CacheService(prefer_redis=True)