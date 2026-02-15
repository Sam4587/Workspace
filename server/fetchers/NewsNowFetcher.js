/**
 * NewsNow API 数据抓取器
 * 使用 NewsNow 统一 API 获取多平台热点数据
 * 参考 TrendRadar 数据源配置
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const { logger } = require('../utils/logger');
const { SourceType, Source, Category, Trend } = require('../core/types');

// NewsNow API 基础地址
const NEWSNOW_API_BASE = 'https://newsnow.busiyi.world/api/s';

// NewsNow 平台 ID 映射
const NEWSNOW_SOURCE_MAP = {
  // 社交媒体
  weibo: { name: '微博热搜', source: Source.WEIBO },
  zhihu: { name: '知乎热榜', source: Source.ZHIHU },
  tieba: { name: '贴吧热议', source: Source.OTHER },

  // 新闻资讯
  toutiao: { name: '今日头条', source: Source.TOUTIAO },
  baidu: { name: '百度热搜', source: Source.BAIDU },
  thepaper: { name: '澎湃新闻', source: Source.OTHER },
  ifeng: { name: '凤凰网', source: Source.OTHER },

  // 视频平台
  douyin: { name: '抖音热搜', source: Source.DOUYIN },
  'bilibili-hot-search': { name: 'B站热搜', source: Source.BILIBILI },

  // 财经类
  'wallstreetcn-hot': { name: '华尔街见闻', source: Source.OTHER },
  'cls-hot': { name: '财联社热门', source: Source.OTHER }
};

class NewsNowFetcher extends BaseFetcher {
  /**
   * @param {Object} options
   * @param {string} [options.sourceId] - 单个数据源 ID
   * @param {string[]} [options.sourceIds] - 多个数据源 ID 列表
   * @param {number} [options.maxItems] - 每个源最大条数
   */
  constructor(options = {}) {
    super({
      name: 'NewsNowFetcher',
      url: NEWSNOW_API_BASE,
      type: SourceType.API,
      timeout: 20000,
      cacheTTL: 1800 // 30 分钟缓存
    });

    this.maxItems = options.maxItems || 20;
    this.axiosInstance = axios.create({
      baseURL: NEWSNOW_API_BASE,
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    // 确定要抓取的数据源
    if (options.sourceId) {
      this.sourceIds = [options.sourceId];
    } else if (options.sourceIds && options.sourceIds.length > 0) {
      this.sourceIds = options.sourceIds;
    } else {
      // 默认抓取所有支持的数据源
      this.sourceIds = Object.keys(NEWSNOW_SOURCE_MAP);
    }
  }

  /**
   * 从 NewsNow API 获取单个数据源的热点
   * @param {string} sourceId - 数据源 ID
   * @returns {Promise<Object[]>}
   */
  async fetchFromSource(sourceId) {
    const cacheKey = `newsnow-${sourceId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchWithRetry(async () => {
        return await this.axiosInstance.get('', {
          params: { source: sourceId }
        });
      });

      if (!response.data || response.data.code !== 200) {
        logger.warn(`[NewsNow] 数据源 ${sourceId} 返回异常: ${response.data?.message || '未知错误'}`);
        return [];
      }

      const items = response.data.data || [];
      this.setCache(cacheKey, items);
      logger.info(`[NewsNow] 数据源 ${sourceId} 获取 ${items.length} 条数据`);

      return items;
    } catch (error) {
      logger.error(`[NewsNow] 数据源 ${sourceId} 获取失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 将 NewsNow 数据转换为标准 HotTopic 格式
   * @param {Object} item - NewsNow 数据项
   * @param {string} sourceId - 数据源 ID
   * @param {number} index - 排序索引
   * @returns {Object}
   */
  transformItem(item, sourceId, index) {
    const sourceInfo = NEWSNOW_SOURCE_MAP[sourceId] || { name: '未知来源', source: Source.OTHER };

    return {
      title: item.title?.trim() || '',
      description: item.title || '',
      category: this.categorizeTopic(item.title || ''),
      heat: this.calculateHeat(item, index),
      trend: this.getTrend(index),
      source: sourceInfo.name,
      sourceId: sourceId,
      sourceUrl: item.url || '',
      originalUrl: item.url || '',
      keywords: this.extractKeywords(item.title || ''),
      suitability: this.calculateSuitability(item.title || ''),
      publishedAt: item.pub_date ? new Date(item.pub_date) : new Date(),
      extra: {
        hotValue: item.hot || null,
        originTitle: item.origin_title || null
      }
    };
  }

  /**
   * 计算热度值 (0-100)
   */
  calculateHeat(item, index) {
    // 如果有热度值，尝试转换为 0-100 范围
    if (item.hot) {
      const hotValue = parseInt(item.hot) || 0;
      if (hotValue > 0) {
        // 对数缩放
        return Math.min(100, Math.max(1, Math.floor(10 + Math.log10(hotValue) * 15)));
      }
    }
    // 默认按排名计算
    return Math.max(1, 100 - index * 3);
  }

  /**
   * 分类话题
   */
  categorizeTopic(title) {
    const categories = {
      [Category.ENTERTAINMENT]: ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐', '演员', '歌手', '票房'],
      [Category.TECH]: ['AI', '人工智能', '科技', '互联网', '手机', '数码', '芯片', '软件', 'APP', '华为', '苹果', '小米'],
      [Category.FINANCE]: ['股市', '经济', '金融', '投资', '房价', '财经', '股票', '基金', '银行', '利率'],
      [Category.SPORTS]: ['足球', '篮球', '奥运', '体育', '运动员', 'NBA', '世界杯', '比赛', '联赛'],
      [Category.SOCIETY]: ['社会', '民生', '政策', '教育', '医疗', '学校', '高考', '就业'],
      [Category.INTERNATIONAL]: ['国际', '外交', '战争', '政治', '国家', '美国', '俄罗斯', '欧盟']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }

    return Category.OTHER;
  }

  /**
   * 获取趋势
   */
  getTrend(index) {
    if (index < 5) return Trend.UP;
    if (index > 15) return Trend.DOWN;
    return Trend.STABLE;
  }

  /**
   * 提取关键词
   */
  extractKeywords(title) {
    const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那']);

    const words = title.split(/[\s,，。！？；：""''（）()【】《》\[\]\/\\]/);
    return words
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 5);
  }

  /**
   * 计算适配度
   */
  calculateSuitability(title) {
    let score = 50;

    // 标题长度适中
    if (title.length >= 10 && title.length <= 50) score += 20;

    // 包含疑问或感叹
    if (title.includes('？') || title.includes('!')) score += 10;

    // 包含时效性词汇
    if (title.includes('最新') || title.includes('突发') || title.includes('刚刚')) score += 15;

    // 包含数字
    if (/\d+/.test(title)) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 抓取所有配置的数据源
   * @returns {Promise<Object[]>}
   */
  async fetch() {
    const allTopics = [];

    // 并行抓取所有数据源
    const fetchPromises = this.sourceIds.map(async (sourceId) => {
      const items = await this.fetchFromSource(sourceId);
      return items
        .slice(0, this.maxItems)
        .map((item, index) => this.transformItem(item, sourceId, index));
    });

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allTopics.push(...result.value);
      }
    }

    // 验证并过滤无效数据
    const validTopics = allTopics.filter(topic => {
      const validated = this.validateTopic(topic);
      if (!validated.valid) {
        logger.debug(`[NewsNow] 跳过无效话题: ${validated.error}`);
        return false;
      }
      return true;
    });

    logger.info(`[NewsNow] 共获取 ${validTopics.length} 条有效热点数据`);

    return validTopics;
  }

  /**
   * 获取单个数据源的热点（便捷方法）
   * @param {string} sourceId - 数据源 ID
   * @returns {Promise<Object[]>}
   */
  async fetchSource(sourceId) {
    const items = await this.fetchFromSource(sourceId);
    return items
      .slice(0, this.maxItems)
      .map((item, index) => this.transformItem(item, sourceId, index));
  }

  /**
   * 获取支持的数据源列表
   * @returns {Object[]}
   */
  getSupportedSources() {
    return Object.entries(NEWSNOW_SOURCE_MAP).map(([id, info]) => ({
      id,
      name: info.name,
      enabled: this.sourceIds.includes(id)
    }));
  }
}

// 创建默认实例（获取所有数据源）
const newsNowFetcher = new NewsNowFetcher();

module.exports = {
  NewsNowFetcher,
  newsNowFetcher,
  NEWSNOW_SOURCE_MAP
};
