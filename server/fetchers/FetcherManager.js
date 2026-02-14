/**
 * 数据抓取器管理器
 * 统一管理所有数据源 Fetcher，借鉴 TrendRadar 模块化设计
 */

const { logger } = require('../utils/logger');
const { Source } = require('../core/types');

class FetcherManager {
  constructor() {
    this.fetchers = new Map();
    this.defaultSources = [];
  }

  /**
   * 注册 Fetcher
   * @param {string} name - 数据源名称
   * @param {BaseFetcher} fetcher - Fetcher 实例
   */
  register(name, fetcher) {
    this.fetchers.set(name, fetcher);
    logger.info(`[FetcherManager] 注册数据源: ${name}`);
  }

  /**
   * 注销 Fetcher
   * @param {string} name - 数据源名称
   */
  unregister(name) {
    if (this.fetchers.has(name)) {
      this.fetchers.delete(name);
      logger.info(`[FetcherManager] 注销数据源: ${name}`);
    }
  }

  /**
   * 获取 Fetcher
   * @param {string} name - 数据源名称
   * @returns {BaseFetcher|undefined}
   */
  getFetcher(name) {
    return this.fetchers.get(name);
  }

  /**
   * 获取所有已注册的数据源
   * @returns {string[]}
   */
  getRegisteredSources() {
    return Array.from(this.fetchers.keys());
  }

  /**
   * 从单个数据源抓取
   * @param {string} source - 数据源名称
   * @returns {Promise<import('../core/types').HotTopic[]>}
   */
  async fetchFromSource(source) {
    const fetcher = this.fetchers.get(source);
    if (!fetcher) {
      logger.warn(`[FetcherManager] 未找到数据源: ${source}`);
      return [];
    }

    try {
      return await fetcher.fetch();
    } catch (error) {
      logger.error(`[FetcherManager] 抓取失败: ${source}`, { error: error.message });
      return [];
    }
  }

  /**
   * 从多个数据源并发抓取
   * @param {string[]} sources - 数据源名称列表，默认使用所有已注册的数据源
   * @returns {Promise<{source: string, topics: import('../core/types').HotTopic[], error?: string}[]>}
   */
  async fetchFromSources(sources) {
    const targetSources = sources || this.getRegisteredSources();

    const results = await Promise.allSettled(
      targetSources.map(async source => {
        const topics = await this.fetchFromSource(source);
        return { source, topics };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          source: targetSources[index],
          topics: [],
          error: result.reason?.message || '未知错误'
        };
      }
    });
  }

  /**
   * 抓取所有数据源并合并结果
   * @param {string[]} sources - 可选，指定数据源
   * @returns {Promise<import('../core/types').HotTopic[]>}
   */
  async fetchAll(sources) {
    const results = await this.fetchFromSources(sources);
    const allTopics = [];

    for (const result of results) {
      if (result.topics.length > 0) {
        allTopics.push(...result.topics);
        logger.debug(`[FetcherManager] ${result.source}: ${result.topics.length} 条`);
      } else if (result.error) {
        logger.warn(`[FetcherManager] ${result.source}: ${result.error}`);
      }
    }

    // 按热度排序
    allTopics.sort((a, b) => b.heat - a.heat);

    logger.info(`[FetcherManager] 总计获取 ${allTopics.length} 条热点数据`);
    return allTopics;
  }

  /**
   * 清除所有 Fetcher 的缓存
   */
  clearAllCache() {
    for (const [name, fetcher] of this.fetchers) {
      fetcher.clearCache();
    }
    logger.info('[FetcherManager] 已清除所有缓存');
  }

  /**
   * 清除指定 Fetcher 的缓存
   * @param {string} source - 数据源名称
   */
  clearCache(source) {
    const fetcher = this.fetchers.get(source);
    if (fetcher) {
      fetcher.clearCache();
    }
  }

  /**
   * 获取所有 Fetcher 的状态
   * @returns {Object[]}
   */
  getStatus() {
    const status = [];
    for (const [name, fetcher] of this.fetchers) {
      status.push(fetcher.getStatus());
    }
    return status;
  }

  /**
   * 初始化默认数据源
   */
  initializeDefaultSources() {
    // 动态加载默认 Fetcher
    const WeiboFetcher = require('./WeiboFetcher');
    const ToutiaoFetcher = require('./ToutiaoFetcher');
    const ZhihuFetcher = require('./ZhihuFetcher');

    this.register(Source.WEIBO, new WeiboFetcher());
    this.register(Source.TOUTIAO, new ToutiaoFetcher());
    this.register(Source.ZHIHU, new ZhihuFetcher());

    this.defaultSources = [Source.WEIBO, Source.TOUTIAO, Source.ZHIHU];

    logger.info(`[FetcherManager] 已初始化 ${this.defaultSources.length} 个默认数据源`);
  }
}

// 单例模式
const fetcherManager = new FetcherManager();

module.exports = {
  FetcherManager,
  fetcherManager
};
