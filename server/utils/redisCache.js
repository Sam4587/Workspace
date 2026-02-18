/**
 * Redis 缓存适配器
 * 用于多实例部署时的缓存共享
 */

let Redis = null;
try {
  Redis = require('ioredis');
} catch (e) {
  console.log('[RedisCache] ioredis not installed, using memory cache fallback');
}

class RedisCache {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.memoryFallback = new Map();
    
    if (Redis && process.env.REDIS_URL) {
      this.initRedis();
    }
  }

  initRedis() {
    try {
      this.client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true
      });
      
      this.client.on('connect', () => {
        console.log('[RedisCache] Connected to Redis');
        this.enabled = true;
      });
      
      this.client.on('error', (err) => {
        console.error('[RedisCache] Connection error:', err.message);
        this.enabled = false;
      });
      
      this.client.on('close', () => {
        console.log('[RedisCache] Connection closed');
        this.enabled = false;
      });
    } catch (error) {
      console.error('[RedisCache] Initialization failed:', error.message);
      this.enabled = false;
    }
  }

  async get(key) {
    if (this.enabled && this.client) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('[RedisCache] Get error:', error.message);
        return this.memoryFallback.get(key) || null;
      }
    }
    return this.memoryFallback.get(key) || null;
  }

  async set(key, value, ttl = 300) {
    if (this.enabled && this.client) {
      try {
        await this.client.setex(key, ttl, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('[RedisCache] Set error:', error.message);
      }
    }
    
    this.memoryFallback.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    });
    
    this.cleanupMemoryFallback();
    return true;
  }

  async del(key) {
    if (this.enabled && this.client) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error('[RedisCache] Del error:', error.message);
      }
    }
    this.memoryFallback.delete(key);
    return true;
  }

  async exists(key) {
    if (this.enabled && this.client) {
      try {
        return await this.client.exists(key) === 1;
      } catch (error) {
        console.error('[RedisCache] Exists error:', error.message);
      }
    }
    return this.memoryFallback.has(key);
  }

  async flush() {
    if (this.enabled && this.client) {
      try {
        await this.client.flushdb();
      } catch (error) {
        console.error('[RedisCache] Flush error:', error.message);
      }
    }
    this.memoryFallback.clear();
    return true;
  }

  cleanupMemoryFallback() {
    const now = Date.now();
    for (const [key, data] of this.memoryFallback.entries()) {
      if (data.expires && data.expires < now) {
        this.memoryFallback.delete(key);
      }
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      connected: this.client?.status === 'ready',
      fallbackSize: this.memoryFallback.size
    };
  }
}

module.exports = new RedisCache();
