/**
 * 数据抓取器抽象基类
 * 借鉴 TrendRadar DataFetcher 模块化设计
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const { SourceType } = require('../core/types');

class BaseFetcher {
  /**
   * @param {import('../core/types').FetcherConfig} config
   */
  constructor(config) {
    this.name = config.name;
    this.url = config.url;
    this.type = config.type || SourceType.API;
    this.headers = config.headers || {};
    this.timeout = config.timeout || 15000;
    this.cacheTTL = config.cacheTTL || 1800;

    // 初始化缓存
    this.cache = new NodeCache({
      stdTTL: this.cacheTTL,
      checkperiod: 600
    });

    // 请求计数
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * 抓取数据 - 子类必须实现
   * @returns {Promise<import('../core/types').HotTopic[]>}
   */
  async fetch() {
    throw new Error('fetch() must be implemented by subclass');
  }

  /**
   * 带重试的请求
   * @param {Function} requestFn - 请求函数
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<any>}
   */
  async fetchWithRetry(requestFn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.requestCount++;
        const result = await requestFn();
        return result;
      } catch (error) {
        this.errorCount++;
        const isLastAttempt = attempt === maxRetries;

        if (isLastAttempt) {
          logger.error(`[${this.name}] 请求失败 (重试 ${attempt}/${maxRetries}): ${error.message}`, {
            url: this.url,
            status: error.response?.status
          });
          throw error;
        }

        // 指数退避
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn(`[${this.name}] 请求失败，${delay}ms 后重试 (${attempt}/${maxRetries}): ${error.message}`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证话题数据
   * @param {Object} topic - 话题对象
   * @returns {{ valid: boolean, error?: string }}
   */
  validateTopic(topic) {
    if (!topic || typeof topic !== 'object') {
      return { valid: false, error: '话题数据格式错误' };
    }

    if (!topic.title || typeof topic.title !== 'string' || topic.title.trim().length === 0) {
      return { valid: false, error: '标题不能为空' };
    }

    if (!topic.source || typeof topic.source !== 'string') {
      return { valid: false, error: '来源不能为空' };
    }

    if (topic.heat !== undefined && (typeof topic.heat !== 'number' || topic.heat < 0 || topic.heat > 100)) {
      return { valid: false, error: '热度值必须在 0-100 之间' };
    }

    return { valid: true };
  }

  /**
   * 从缓存获取数据
   * @param {string} key - 缓存键
   * @returns {any|null}
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached) {
      logger.debug(`[${this.name}] 使用缓存数据`);
      return cached;
    }
    return null;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 数据
   * @param {number} [ttl] - 缓存时间
   */
  setCache(key, data, ttl) {
    if (ttl) {
      this.cache.set(key, data, ttl);
    } else {
      this.cache.set(key, data);
    }
  }

  /**
   * 清除缓存
   * @param {string} [key] - 缓存键，不传则清空所有
   */
  clearCache(key) {
    if (key) {
      this.cache.del(key);
    } else {
      this.cache.flushAll();
    }
    logger.debug(`[${this.name}] 缓存已清除`);
  }

  /**
   * 获取抓取器状态
   * @returns {Object}
   */
  getStatus() {
    return {
      name: this.name,
      type: this.type,
      url: this.url,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = BaseFetcher;
