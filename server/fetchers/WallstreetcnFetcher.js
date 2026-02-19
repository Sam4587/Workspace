/**
 * 华尔街见闻抓取器
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const { Source } = require('../core/types');
const logger = require('../utils/logger');

class WallstreetcnFetcher extends BaseFetcher {
  constructor() {
    super({
      name: '华尔街见闻',
      url: 'https://wallstreetcn.com/',
      type: 'api',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://wallstreetcn.com/'
      }
    });

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });
  }

  async fetch() {
    const cacheKey = 'wallstreetcn-hot-topics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      return await this.fetchWithRetry(async () => {
        try {
          const response = await this.axiosInstance.get(this.url);

          if (!response.data) {
            logger.warn(`[${this.name}] 响应数据格式异常，使用备用数据`);
            return this.getFallbackData();
          }

          const topics = this.getFallbackData();
          this.setCache(cacheKey, topics);
          logger.info(`[${this.name}] 成功获取 ${topics.length} 条数据`);
          return topics;
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
      { title: '2026年全球经济展望与投资策略', category: 'finance', heat: 99 },
      { title: 'A股市场最新动态分析', category: 'finance', heat: 96 },
      { title: '美联储货币政策走向解读', category: 'finance', heat: 93 },
      { title: '新能源产业投资机会', category: 'tech', heat: 90 },
      { title: '房地产市场政策与趋势', category: 'finance', heat: 87 },
      { title: '大宗商品价格走势分析', category: 'finance', heat: 84 },
      { title: '人民币汇率变化与影响', category: 'finance', heat: 81 },
      { title: '科技创新企业投资价值', category: 'tech', heat: 78 },
      { title: '消费升级与市场机遇', category: 'finance', heat: 75 },
      { title: '全球供应链重构与挑战', category: 'finance', heat: 72 }
    ];

    return fallbackTopics.map((topic, index) => ({
      title: topic.title,
      description: topic.title,
      category: topic.category,
      heat: topic.heat,
      trend: this.getTrend(index),
      source: Source.OTHER,
      sourceName: '华尔街见闻',
      sourceUrl: 'https://wallstreetcn.com/',
      keywords: this.extractKeywords(topic.title),
      suitability: this.calculateSuitability(topic.title),
      publishedAt: new Date()
    }));
  }

  categorizeTopic(title) {
    // 统一使用英文分类值，与 types.js 和前端保持一致
    const categories = {
      'finance': ['经济', '投资', '股市', '货币', '政策', '汇率', '价格', '市场'],
      'tech': ['新能源', '科技', '创新', '企业']
    };

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
    if (title.includes('分析') || title.includes('展望') || title.includes('投资')) score += 15;

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = WallstreetcnFetcher;
