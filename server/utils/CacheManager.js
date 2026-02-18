const NodeCache = require('node-cache');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.caches = new Map();
    this.defaultTTL = 1800;
    this.defaultCheckPeriod = 600;
    this.defaultMaxKeys = 1000;
  }

  register(name, options = {}) {
    if (this.caches.has(name)) {
      logger.warn(`[CacheManager] 缓存 "${name}" 已存在，将被覆盖`);
    }

    const cache = new NodeCache({
      stdTTL: options.ttl || this.defaultTTL,
      checkperiod: options.checkperiod || this.defaultCheckPeriod,
      maxKeys: options.maxKeys || this.defaultMaxKeys,
      useClones: options.useClones !== false,
      deleteOnExpire: true,
    });

    cache.on('expired', (key, value) => {
      logger.debug(`[CacheManager] 缓存过期`, { cache: name, key });
    });

    this.caches.set(name, {
      cache,
      options,
      createdAt: Date.now(),
    });

    logger.info(`[CacheManager] 注册缓存`, { 
      name, 
      ttl: options.ttl || this.defaultTTL,
      maxKeys: options.maxKeys || this.defaultMaxKeys 
    });

    return cache;
  }

  get(name) {
    const entry = this.caches.get(name);
    return entry ? entry.cache : null;
  }

  has(name) {
    return this.caches.has(name);
  }

  unregister(name) {
    const entry = this.caches.get(name);
    if (entry) {
      entry.cache.flushAll();
      this.caches.delete(name);
      logger.info(`[CacheManager] 注销缓存`, { name });
      return true;
    }
    return false;
  }

  set(name, key, value, ttl) {
    const cache = this.get(name);
    if (!cache) {
      logger.warn(`[CacheManager] 缓存 "${name}" 不存在`);
      return false;
    }
    if (ttl) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  }

  getFromCache(name, key) {
    const cache = this.get(name);
    if (!cache) {
      return undefined;
    }
    return cache.get(key);
  }

  del(name, key) {
    const cache = this.get(name);
    if (!cache) {
      return 0;
    }
    return cache.del(key);
  }

  flush(name) {
    const cache = this.get(name);
    if (cache) {
      cache.flushAll();
      logger.info(`[CacheManager] 清空缓存`, { name });
    }
  }

  flushAll() {
    for (const [name, entry] of this.caches) {
      entry.cache.flushAll();
    }
    logger.info(`[CacheManager] 清空所有缓存`, { count: this.caches.size });
  }

  getStats(name) {
    const cache = this.get(name);
    if (!cache) {
      return null;
    }
    return cache.getStats();
  }

  getAllStats() {
    const stats = {
      totalCaches: this.caches.size,
      caches: {},
      summary: {
        totalKeys: 0,
        totalHits: 0,
        totalMisses: 0,
        hitRate: 0,
      },
    };

    for (const [name, entry] of this.caches) {
      const cacheStats = entry.cache.getStats();
      stats.caches[name] = {
        ...cacheStats,
        maxKeys: entry.options.maxKeys || this.defaultMaxKeys,
        ttl: entry.options.ttl || this.defaultTTL,
        createdAt: entry.createdAt,
      };
      stats.summary.totalKeys += cacheStats.keys;
      stats.summary.totalHits += cacheStats.hits;
      stats.summary.totalMisses += cacheStats.misses;
    }

    const totalRequests = stats.summary.totalHits + stats.summary.totalMisses;
    stats.summary.hitRate = totalRequests > 0 
      ? ((stats.summary.totalHits / totalRequests) * 100).toFixed(2) + '%' 
      : '0%';

    return stats;
  }

  getMemoryUsage() {
    const usage = {
      caches: {},
      estimatedMemoryMB: 0,
    };

    for (const [name, entry] of this.caches) {
      const stats = entry.cache.getStats();
      const estimatedMB = (stats.ksize + stats.vsize) / (1024 * 1024);
      usage.caches[name] = {
        keys: stats.keys,
        estimatedMB: estimatedMB.toFixed(2),
      };
      usage.estimatedMemoryMB += estimatedMB;
    }

    usage.estimatedMemoryMB = usage.estimatedMemoryMB.toFixed(2);
    return usage;
  }

  healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      caches: {},
    };

    for (const [name, entry] of this.caches) {
      const stats = entry.cache.getStats();
      const maxKeys = entry.options.maxKeys || this.defaultMaxKeys;
      const usagePercent = (stats.keys / maxKeys) * 100;

      health.caches[name] = {
        keys: stats.keys,
        maxKeys,
        usagePercent: usagePercent.toFixed(2) + '%',
        status: usagePercent > 90 ? 'warning' : 'healthy',
      };

      if (usagePercent > 90) {
        health.status = 'warning';
      }
    }

    return health;
  }
}

const cacheManager = new CacheManager();

module.exports = cacheManager;
