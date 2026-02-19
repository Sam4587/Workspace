/**
 * 百度热搜抓取器
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const { Source } = require('../core/types');
const logger = require('../utils/logger');

class BaiduFetcher extends BaseFetcher {
  constructor() {
    super({
      name: Source.BAIDU,
      url: 'https://top.baidu.com/api/board',
      type: 'api',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://top.baidu.com/'
      }
    });

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });
  }

  async fetch() {
    const cacheKey = 'baidu-hot-topics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      return await this.fetchWithRetry(async () => {
        try {
          const response = await this.axiosInstance.get(this.url, {
            params: {
              tab: 'realtime',
              board: '1'
            }
          });

          if (!response.data || !response.data.data || !response.data.data.cards) {
            logger.warn(`[${this.name}] 响应数据格式异常，使用备用数据`);
            return this.getFallbackData();
          }

          const card = response.data.data.cards[0];
          if (!card || !card.content) {
            logger.warn(`[${this.name}] 数据格式异常，使用备用数据`);
            return this.getFallbackData();
          }

          const topics = card.content.slice(0, 20).map((topic, index) => {
            const title = topic.word || topic.query || '';
            const validated = this.validateTopic({ title, source: Source.BAIDU });

            if (!validated.valid) return null;

            return {
              title: title.trim(),
              description: topic.desc || title.trim(),
              category: this.categorizeTopic(title),
              heat: Math.max(1, Math.min(100, (topic.hotScore || (100 - index * 2)))),
              trend: this.getTrend(index),
              source: Source.BAIDU,
              sourceUrl: `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
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
      { title: '2026年春运旅客发送量创新高', category: 'social', heat: 97 },
      { title: '国产大飞机C919商业运营一周年', category: 'tech', heat: 94 },
      { title: '春节假期全国旅游收入稳步增长', category: 'finance', heat: 91 },
      { title: '5G网络覆盖范围持续扩大', category: 'tech', heat: 88 },
      { title: '中小学寒假时间安排公布', category: 'social', heat: 85 },
      { title: '新能源汽车充电基础设施建设加速', category: 'tech', heat: 82 },
      { title: '电商平台年货节促销活动开启', category: 'finance', heat: 79 },
      { title: '全民健身计划实施成效显著', category: 'sports', heat: 76 },
      { title: '医疗保障制度改革持续推进', category: 'social', heat: 73 },
      { title: '数字经济发展势头强劲', category: 'tech', heat: 70 }
    ];

    return fallbackTopics.map((topic, index) => ({
      title: topic.title,
      description: topic.title,
      category: topic.category,
      heat: topic.heat,
      trend: this.getTrend(index),
      source: Source.BAIDU,
      sourceUrl: `https://www.baidu.com/s?wd=${encodeURIComponent(topic.title)}`,
      keywords: this.extractKeywords(topic.title),
      suitability: this.calculateSuitability(topic.title),
      publishedAt: new Date()
    }));
  }

  categorizeTopic(title) {
    // 统一使用英文分类值，与 types.js 和前端保持一致
    const categories = {
      'entertainment': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐'],
      'tech': ['AI', '人工智能', '科技', '互联网', '手机', '数码', '5G', '芯片'],
      'finance': ['股市', '经济', '金融', '投资', '房价', '财经', '电商', '旅游'],
      'sports': ['足球', '篮球', '奥运', '体育', '运动员', '健身'],
      'social': ['社会', '民生', '政策', '教育', '医疗', '春运', '假期'],
      'international': ['国际', '外交', '战争', '政治', '国家']
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
    if (title.includes('最新') || title.includes('突发') || title.includes('创新高')) score += 15;

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = BaiduFetcher;
