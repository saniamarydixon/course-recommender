"""Optional Redis client for caching recommendations and sessions."""

import redis

from app.config import get_settings

settings = get_settings()

_redis_client: redis.Redis | None = None


def get_redis_client() -> redis.Redis | None:
    global _redis_client
    if not settings.redis_enabled:
        return None
    if _redis_client is None:
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client
