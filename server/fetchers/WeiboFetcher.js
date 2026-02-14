/**
 * 微博热搜抓取器
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const { Source } = require('../core/types');
const { logger } = require('../utils/logger');

class WeiboFetcher extends BaseFetcher {
  constructor() {
    super({
      name: Source.WEIBO,
      url: 'https://weibo.com/ajax/side/hotSearch',
      type: 'api',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });
  }

  /**
   * 抓取微博热搜数据
   * @returns {Promise<import('../core/types').HotTopic[]>}
   */
  async fetch() {
    const cacheKey = 'weibo-hot-topics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.url);

      if (!response.data || !response.data.data) {
        logger.warn(`[${this.name}] 响应数据格式异常`);
        return [];
      }

      const rawData = response.data.data.realtime || [];
      if (!Array.isArray(rawData)) {
        logger.warn(`[${this.name}] 数据不是数组格式`);
        return [];
      }

      const topics = rawData.slice(0, 20).map((topic, index) => {
        const title = topic.word || topic.query || '';
        const validated = this.validateTopic({ title, source: Source.WEIBO });

        if (!validated.valid) return null;

        return {
          title: title.trim(),
          description: topic.word_zh || topic.desc || title.trim(),
          category: this.categorizeTopic(title),
          heat: Math.max(1, 100 - index * 2),
          trend: this.getTrend(index),
          source: Source.WEIBO,
          sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
          keywords: this.extractKeywords(title),
          suitability: this.calculateSuitability(title),
          publishedAt: new Date()
        };
      }).filter(topic => topic !== null);

      if (topics.length > 0) {
        this.setCache(cacheKey, topics);
        logger.info(`[${this.name}] 成功获取 ${topics.length} 条数据`);
      }

      return topics;
    });
  }

  /**
   * 分类话题
   */
  categorizeTopic(title) {
    const categories = {
      '娱乐': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐'],
      '科技': ['AI', '人工智能', '科技', '互联网', '手机', '数码'],
      '财经': ['股市', '经济', '金融', '投资', '房价', '财经'],
      '体育': ['足球', '篮球', '奥运', '体育', '运动员'],
      '社会': ['社会', '民生', '政策', '教育', '医疗'],
      '国际': ['国际', '外交', '战争', '政治', '国家']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }

    return '其他';
  }

  /**
   * 获取趋势
   */
  getTrend(index) {
    if (index < 5) return 'up';
    if (index > 15) return 'down';
    return 'stable';
  }

  /**
   * 提取关键词
   */
  extractKeywords(title) {
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];

    const words = title.split(/[\s,，。！？；：""''（）()【】《》\[\]]/);
    return words
      .filter(word => word.length > 1 && !commonWords.includes(word))
      .slice(0, 5);
  }

  /**
   * 计算适配度
   */
  calculateSuitability(title) {
    let score = 50;

    if (title.length > 10 && title.length < 50) score += 20;
    if (title.includes('？') || title.includes('!')) score += 10;
    if (title.includes('最新') || title.includes('突发')) score += 15;

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = WeiboFetcher;
