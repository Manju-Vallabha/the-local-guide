"""
Tests for cache service functionality.
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock
from app.services.cache_service import CacheService, InMemoryBackend, RedisBackend


class TestInMemoryBackend:
    """Test in-memory cache backend."""
    
    @pytest.fixture
    def backend(self):
        """Create in-memory backend for testing."""
        return InMemoryBackend(max_size=3)
    
    @pytest.mark.asyncio
    async def test_basic_operations(self, backend):
        """Test basic cache operations."""
        # Test set and get
        assert await backend.set("key1", "value1", 60)
        assert await backend.get("key1") == "value1"
        
        # Test exists
        assert await backend.exists("key1")
        assert not await backend.exists("nonexistent")
        
        # Test delete
        assert await backend.delete("key1")
        assert await backend.get("key1") is None
        assert not await backend.exists("key1")
    
    @pytest.mark.asyncio
    async def test_ttl_expiration(self, backend):
        """Test TTL expiration."""
        # Set with very short TTL
        assert await backend.set("key1", "value1", 1)
        assert await backend.get("key1") == "value1"
        
        # Wait for expiration
        await asyncio.sleep(1.1)
        
        # Should be expired
        assert await backend.get("key1") is None
        assert not await backend.exists("key1")
    
    @pytest.mark.asyncio
    async def test_cache_eviction(self, backend):
        """Test cache eviction when max size is reached."""
        # Fill cache to max size
        assert await backend.set("key1", "value1", 60)
        assert await backend.set("key2", "value2", 60)
        assert await backend.set("key3", "value3", 60)
        
        # Add one more - should evict oldest
        assert await backend.set("key4", "value4", 60)
        
        # key1 should be evicted (oldest)
        assert await backend.get("key1") is None
        assert await backend.get("key2") == "value2"
        assert await backend.get("key3") == "value3"
        assert await backend.get("key4") == "value4"
    
    @pytest.mark.asyncio
    async def test_clear_cache(self, backend):
        """Test clearing all cache entries."""
        await backend.set("key1", "value1", 60)
        await backend.set("key2", "value2", 60)
        
        assert await backend.clear()
        
        assert await backend.get("key1") is None
        assert await backend.get("key2") is None
    
    def test_stats(self, backend):
        """Test cache statistics."""
        stats = backend.get_stats()
        
        assert stats["backend"] == "in_memory"
        assert stats["status"] == "active"
        assert "total_entries" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate" in stats


class TestCacheService:
    """Test cache service functionality."""
    
    @pytest.fixture
    def cache_service(self):
        """Create cache service for testing."""
        return CacheService(prefer_redis=False)  # Force in-memory for testing
    
    def test_generate_key(self, cache_service):
        """Test cache key generation."""
        key1 = cache_service.generate_key("translation", "hello", target_language="en")
        key2 = cache_service.generate_key("translation", "hello", target_language="en")
        key3 = cache_service.generate_key("translation", "hello", target_language="hi")
        
        # Same inputs should generate same key
        assert key1 == key2
        
        # Different inputs should generate different keys
        assert key1 != key3
        
        # Keys should be consistent length (MD5 hash)
        assert len(key1) == 32
    
    @pytest.mark.asyncio
    async def test_json_operations(self, cache_service):
        """Test JSON cache operations."""
        test_data = {
            "original_text": "hello",
            "translated_text": "नमस्ते",
            "confidence": 0.95,
            "cached": False
        }
        
        key = "test_json_key"
        
        # Set JSON data
        assert await cache_service.set_json(key, test_data, 60)
        
        # Get JSON data
        retrieved_data = await cache_service.get_json(key)
        assert retrieved_data == test_data
        
        # Test non-existent key
        assert await cache_service.get_json("nonexistent") is None
    
    @pytest.mark.asyncio
    async def test_string_operations(self, cache_service):
        """Test string cache operations."""
        key = "test_string_key"
        value = "test_value"
        
        # Set string data
        assert await cache_service.set(key, value, 60)
        
        # Get string data
        retrieved_value = await cache_service.get(key)
        assert retrieved_value == value
        
        # Test exists
        assert await cache_service.exists(key)
        
        # Test delete
        assert await cache_service.delete(key)
        assert await cache_service.get(key) is None
    
    def test_backend_type(self, cache_service):
        """Test backend type detection."""
        backend_type = cache_service.get_backend_type()
        assert backend_type in ["redis", "in_memory"]
    
    def test_availability(self, cache_service):
        """Test cache service availability."""
        assert cache_service.is_available()
    
    def test_stats(self, cache_service):
        """Test cache statistics."""
        stats = cache_service.get_stats()
        
        assert "backend" in stats
        assert "status" in stats
        assert stats["status"] in ["active", "connected", "disconnected", "error"]


@pytest.mark.skipif(
    not hasattr(RedisBackend, '__init__'),
    reason="Redis not available"
)
class TestRedisBackend:
    """Test Redis cache backend (requires Redis server)."""
    
    @pytest.fixture
    def backend(self):
        """Create Redis backend for testing."""
        try:
            return RedisBackend("redis://localhost:6379/15")  # Use test database
        except Exception:
            pytest.skip("Redis server not available")
    
    @pytest.mark.asyncio
    async def test_redis_operations(self, backend):
        """Test basic Redis operations."""
        # Clear test database first
        await backend.clear()
        
        # Test set and get
        assert await backend.set("test_key", "test_value", 60)
        assert await backend.get("test_key") == "test_value"
        
        # Test exists
        assert await backend.exists("test_key")
        
        # Test delete
        assert await backend.delete("test_key")
        assert await backend.get("test_key") is None
    
    def test_redis_stats(self, backend):
        """Test Redis statistics."""
        stats = backend.get_stats()
        
        assert stats["backend"] == "redis"
        assert "status" in stats
        
        if stats["status"] == "connected":
            assert "used_memory" in stats
            assert "connected_clients" in stats
            assert "hit_rate" in stats


if __name__ == "__main__":
    pytest.main([__file__])