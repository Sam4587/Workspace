/**
 * 热点监控性能优化和缓存管理服务
 * 提供统一的缓存策略、性能监控、资源优化等功能
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class PerformanceOptimizationService {
  constructor() {
    // 多级缓存配置
    this.caches = {
      // 热数据缓存 (1-2分钟)
      hot: new NodeCache({ stdTTL: 120, checkperiod: 60 }),
      
      // 温数据缓存 (5-10分钟) 
      warm: new NodeCache({ stdTTL: 600, checkperiod: 120 }),
      
      // 冷数据缓存 (30分钟-1小时)
      cold: new NodeCache({ stdTTL: 3600, checkperiod: 300 }),
      
      // 持久化缓存 (24小时)
      persistent: new NodeCache({ stdTTL: 86400, checkperiod: 3600 })
    };

    // 性能监控指标
    this.metrics = {
      cacheHits: new Map(),
      responseTimes: [],
      memoryUsage: [],
      requestCounts: new Map()
    };

    // 资源限制配置
    this.limits = {
      maxCacheEntries: 10000,
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      maxConcurrentRequests: 50,
      requestTimeout: 30000 // 30秒
    };

    // 当前并发请求数
    this.concurrentRequests = 0;

    // 启动定时监控任务
    this.startMonitoring();
  }

  /**
   * 根据数据特征选择合适的缓存级别
   */
  selectCacheLevel(data, options = {}) {
    const { 
      isHot = false,      // 是否为热点数据
      frequency = 1,      // 访问频率 (次/分钟)
      importance = 1,     // 重要性系数 (1-10)
      ttl = null          // 自定义TTL
    } = options;

    // 如果有自定义TTL，使用持久化缓存
    if (ttl) {
      return { cache: this.caches.persistent, ttl };
    }

    // 根据特征选择缓存级别
    if (isHot || frequency > 10 || importance > 8) {
      return { cache: this.caches.hot, ttl: 120 };
    } else if (frequency > 3 || importance > 5) {
      return { cache: this.caches.warm, ttl: 600 };
    } else {
      return { cache: this.caches.cold, ttl: 3600 };
    }
  }

  /**
   * 智能缓存获取
   */
  getCached(key, cacheLevel = 'warm') {
    const cache = this.caches[cacheLevel];
    if (!cache) return null;

    const value = cache.get(key);
    if (value !== undefined) {
      // 记录缓存命中
      this.recordCacheHit(cacheLevel);
      logger.debug(`[Performance] 缓存命中: ${key} (${cacheLevel})`);
    }
    
    return value;
  }

  /**
   * 智能缓存设置
   */
  setCached(key, value, options = {}) {
    const { cacheLevel = 'warm', ttl = null } = options;
    const cache = this.caches[cacheLevel];
    
    if (!cache) return false;

    try {
      const setResult = cache.set(key, value, ttl);
      if (setResult) {
        logger.debug(`[Performance] 缓存设置: ${key} (${cacheLevel})`);
      }
      return setResult;
    } catch (error) {
      logger.warn(`[Performance] 缓存设置失败: ${key}`, { error: error.message });
      return false;
    }
  }

  /**
   * 带缓存的异步操作包装器
   */
  async withCache(key, operation, options = {}) {
    const { 
      cacheLevel = 'warm',
      bypassCache = false,
      forceRefresh = false,
      ttl = null
    } = options;

    // 检查缓存（除非强制刷新或绕过缓存）
    if (!bypassCache && !forceRefresh) {
      const cached = this.getCached(key, cacheLevel);
      if (cached !== undefined) {
        return cached;
      }
    }

    // 执行操作并缓存结果
    try {
      const startTime = Date.now();
      
      // 控制并发请求数
      await this.acquireRequestSlot();
      
      const result = await operation();
      
      this.releaseRequestSlot();
      
      const duration = Date.now() - startTime;
      this.recordResponseTime(duration);
      
      // 缓存结果
      if (result !== undefined) {
        this.setCached(key, result, { cacheLevel, ttl });
      }
      
      return result;
    } catch (error) {
      this.releaseRequestSlot();
      logger.error(`[Performance] 操作执行失败: ${key}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 批量缓存操作
   */
  async batchWithCache(operations, options = {}) {
    const { 
      batchSize = 10,
      maxConcurrency = 5,
      cacheLevel = 'warm'
    } = options;

    const results = [];
    const batches = this.chunkArray(operations, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(async (op, index) => {
        try {
          return await this.withCache(op.key, op.operation, { 
            cacheLevel,
            ...op.options 
          });
        } catch (error) {
          logger.error(`[Performance] 批量操作失败: ${op.key}`, { error: error.message });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 缓存预热
   */
  async warmUpCache(patterns = []) {
    const defaultPatterns = [
      { key: 'hot-topics-recent', ttl: 120 },
      { key: 'platform-stats-daily', ttl: 600 },
      { key: 'category-distribution', ttl: 3600 }
    ];

    const allPatterns = [...defaultPatterns, ...patterns];

    logger.info(`[Performance] 开始缓存预热，共 ${allPatterns.length} 个模式`);

    const warmUpPromises = allPatterns.map(async (pattern) => {
      try {
        // 这里应该调用实际的数据获取方法
        const data = await this.simulateDataFetch(pattern.key);
        this.setCached(pattern.key, data, { 
          cacheLevel: this.getCacheLevelFromTTL(pattern.ttl),
          ttl: pattern.ttl
        });
        logger.debug(`[Performance] 预热完成: ${pattern.key}`);
      } catch (error) {
        logger.warn(`[Performance] 预热失败: ${pattern.key}`, { error: error.message });
      }
    });

    await Promise.all(warmUpPromises);
    logger.info('[Performance] 缓存预热完成');
  }

  /**
   * 内存优化
   */
  optimizeMemory() {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed;
    
    this.recordMemoryUsage(heapUsed);

    // 如果内存使用过高，执行清理
    if (heapUsed > this.limits.maxMemoryUsage * 0.8) {
      logger.warn(`[Performance] 内存使用过高 (${(heapUsed / 1024 / 1024).toFixed(2)}MB)，执行优化`);
      
      // 清理冷数据缓存
      this.caches.cold.flushAll();
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * 性能监控
   */
  getPerformanceMetrics() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // 计算缓存命中率
    const cacheHitRates = {};
    for (const [level, cache] of Object.entries(this.caches)) {
      const hits = this.metrics.cacheHits.get(level) || 0;
      const total = cache.getStats().keys + hits;
      cacheHitRates[level] = total > 0 ? (hits / total * 100).toFixed(2) : '0.00';
    }

    // 计算平均响应时间
    const recentResponseTimes = this.metrics.responseTimes
      .filter(time => time.timestamp > oneHourAgo)
      .map(item => item.duration);
    
    const avgResponseTime = recentResponseTimes.length > 0 
      ? (recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length).toFixed(2)
      : 0;

    // 计算内存使用趋势
    const recentMemoryUsage = this.metrics.memoryUsage
      .filter(record => record.timestamp > oneHourAgo)
      .map(record => record.usage);

    const avgMemoryUsage = recentMemoryUsage.length > 0
      ? (recentMemoryUsage.reduce((sum, usage) => sum + usage, 0) / recentMemoryUsage.length / 1024 / 1024).toFixed(2)
      : 0;

    return {
      cacheHitRates,
      avgResponseTime: `${avgResponseTime}ms`,
      avgMemoryUsage: `${avgMemoryUsage}MB`,
      concurrentRequests: this.concurrentRequests,
      cacheStats: this.getCacheStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 缓存统计信息
   */
  getCacheStats() {
    const stats = {};
    for (const [level, cache] of Object.entries(this.caches)) {
      const cacheStats = cache.getStats();
      stats[level] = {
        keys: cacheStats.keys,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.keys > 0 ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) : '0.00'
      };
    }
    return stats;
  }

  /**
   * 清理过期缓存
   */
  cleanupExpired() {
    let totalCleaned = 0;
    
    for (const [level, cache] of Object.entries(this.caches)) {
      const beforeKeys = cache.getStats().keys;
      cache.flushStats(); // 清理统计信息
      const afterKeys = cache.getStats().keys;
      const cleaned = beforeKeys - afterKeys;
      totalCleaned += cleaned;
      
      if (cleaned > 0) {
        logger.info(`[Performance] 清理 ${level} 缓存: ${cleaned} 个过期项`);
      }
    }
    
    return totalCleaned;
  }

  /**
   * 重置所有缓存
   */
  flushAll() {
    for (const [level, cache] of Object.entries(this.caches)) {
      cache.flushAll();
      logger.info(`[Performance] 已清空 ${level} 缓存`);
    }
    
    // 重置统计信息
    this.metrics.cacheHits.clear();
    this.metrics.responseTimes = [];
    this.metrics.memoryUsage = [];
    this.metrics.requestCounts.clear();
  }

  /**
   * 内部辅助方法
   */
  
  // 记录缓存命中
  recordCacheHit(cacheLevel) {
    const current = this.metrics.cacheHits.get(cacheLevel) || 0;
    this.metrics.cacheHits.set(cacheLevel, current + 1);
  }

  // 记录响应时间
  recordResponseTime(duration) {
    this.metrics.responseTimes.push({
      timestamp: Date.now(),
      duration
    });
    
    // 保持最近1000条记录
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
  }

  // 记录内存使用
  recordMemoryUsage(usage) {
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      usage
    });
    
    // 保持最近100条记录
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  // 获取请求槽位
  async acquireRequestSlot() {
    while (this.concurrentRequests >= this.limits.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.concurrentRequests++;
  }

  // 释放请求槽位
  releaseRequestSlot() {
    this.concurrentRequests = Math.max(0, this.concurrentRequests - 1);
  }

  // 数组分块
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // 根据TTL获取缓存级别
  getCacheLevelFromTTL(ttl) {
    if (ttl <= 120) return 'hot';
    if (ttl <= 600) return 'warm';
    if (ttl <= 3600) return 'cold';
    return 'persistent';
  }

  // 模拟数据获取（用于预热）
  async simulateDataFetch(key) {
    // 模拟异步数据获取延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    return { 
      key, 
      data: `mock-data-for-${key}`, 
      timestamp: Date.now() 
    };
  }

  // 启动监控任务
  startMonitoring() {
    // 每5分钟执行一次内存优化
    setInterval(() => {
      this.optimizeMemory();
    }, 5 * 60 * 1000);

    // 每小时清理过期缓存
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 60 * 1000);

    // 每30秒输出性能指标
    setInterval(() => {
      const metrics = this.getPerformanceMetrics();
      logger.debug('[Performance] 系统性能指标', metrics);
    }, 30 * 1000);
  }
}

module.exports = new PerformanceOptimizationService();