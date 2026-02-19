/**
 * B站热门抓取器
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const { Source } = require('../core/types');
const logger = require('../utils/logger');

class BilibiliFetcher extends BaseFetcher {
  constructor() {
    super({
      name: Source.BILIBILI,
      url: 'https://api.bilibili.com/x/web-interface/ranking/v2',
      type: 'api',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.bilibili.com/'
      }
    });

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });
  }

  async fetch() {
    const cacheKey = 'bilibili-hot-topics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      return await this.fetchWithRetry(async () => {
        try {
          const response = await this.axiosInstance.get(this.url);

          if (!response.data || !response.data.data || !response.data.data.list) {
            logger.warn(`[${this.name}] 响应数据格式异常，使用备用数据`);
            return this.getFallbackData();
          }

          const list = response.data.data.list;
          if (!Array.isArray(list) || list.length === 0) {
            logger.warn(`[${this.name}] 数据不是数组格式或为空，使用备用数据`);
            return this.getFallbackData();
          }

          const topics = list.slice(0, 20).map((item, index) => {
            const title = item.title || '';
            const validated = this.validateTopic({ title, source: Source.BILIBILI });

            if (!validated.valid) return null;

            return {
              title: title.trim(),
              description: item.desc || title.trim(),
              category: this.categorizeTopic(title, item.tname),
              heat: Math.max(1, Math.min(100, (item.stat?.view ? Math.min(100, Math.floor(item.stat.view / 100000)) : (100 - index * 2)))),
              trend: this.getTrend(index),
              source: Source.BILIBILI,
              sourceUrl: `https://www.bilibili.com/video/${item.bvid || ''}`,
              keywords: this.extractKeywords(title),
              suitability: this.calculateSuitability(title),
              publishedAt: new Date()
            };
          }).filter(topic => topic !== null);

          if (topics.length > 0) {
            this.setCache(cacheKey, topics);
            logger.info(`[${this.name}] 成功获取 ${topics.length} 条数据`);
            return topics;
          } else {
            logger.warn(`[${this.name}] 未获取到有效数据，使用备用数据`);
            return this.getFallbackData();
          }
        } catch (error) {
          logger.warn(`[${this.name}] API 调用失败: ${error.message}，使用备用数据`);
          return this.getFallbackData();
        }
      });
    } catch (error) {
      logger.error(`[${this.name}] 所有尝试都失败，使用备用数据`);
      return this.getFallbackData();
    }
  }

  getFallbackData() {
    const fallbackTopics = [
      { title: '2026年度热门动画新番推荐', category: 'entertainment', heat: 98 },
      { title: '科技前沿：AI在游戏中的应用', category: 'tech', heat: 95 },
      { title: '编程教程：从入门到精通', category: 'tech', heat: 92 },
      { title: '游戏评测：2026年必玩大作', category: 'entertainment', heat: 89 },
      { title: '数码开箱：最新电子产品体验', category: 'tech', heat: 86 },
      { title: '音乐创作：原创歌曲分享', category: 'entertainment', heat: 83 },
      { title: '美食制作：家常菜教程', category: 'other', heat: 80 },
      { title: '旅行记录：国内外美景分享', category: 'other', heat: 77 },
      { title: '学习干货：考研考公经验分享', category: 'social', heat: 74 },
      { title: '运动健身：在家锻炼教程', category: 'sports', heat: 71 }
    ];

    return fallbackTopics.map((topic, index) => ({
      title: topic.title,
      description: topic.title,
      category: topic.category,
      heat: topic.heat,
      trend: this.getTrend(index),
      source: Source.BILIBILI,
      sourceUrl: `https://www.bilibili.com/`,
      keywords: this.extractKeywords(topic.title),
      suitability: this.calculateSuitability(topic.title),
      publishedAt: new Date()
    }));
  }

  categorizeTopic(title, tname) {
    // 统一使用英文分类值，与 types.js 和前端保持一致
    const categories = {
      'entertainment': ['动画', '动漫', '音乐', '舞蹈', '明星', '综艺', '游戏', '电竞', '手游'],
      'tech': ['科技', '数码', '编程', 'AI', '人工智能', '评测', '开箱'],
      'sports': ['运动', '健身', '篮球', '足球', '体育'],
      'social': ['学习', '教程', '考研', '考公', '知识']
    };

    if (tname) {
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.includes(tname)) {
          return category;
        }
      }
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  getTrend(index) {
    if (index < 5) return 'up';
    if (index > 15) return 'down';
    return 'stable';
  }

  extractKeywords(title) {
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];

    const words = title.split(/[\s,，。！？；：""''（）()【】《》\[\]]/);
    return words
      .filter(word => word.length > 1 && !commonWords.includes(word))
      .slice(0, 5);
  }

  calculateSuitability(title) {
    let score = 50;

    if (title.length > 10 && title.length < 50) score += 20;
    if (title.includes('？') || title.includes('!')) score += 10;
    if (title.includes('热门') || title.includes('推荐') || title.includes('教程')) score += 15;

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = BilibiliFetcher;
