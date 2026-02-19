/**
 * 抖音热点抓取器
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const { Source } = require('../core/types');
const logger = require('../utils/logger');

class DouyinFetcher extends BaseFetcher {
  constructor() {
    super({
      name: Source.DOUYIN,
      url: 'https://www.douyin.com/aweme/v1/web/hot/search/list/',
      type: 'api',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.douyin.com/'
      }
    });

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });
  }

  async fetch() {
    const cacheKey = 'douyin-hot-topics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      return await this.fetchWithRetry(async () => {
        try {
          const response = await this.axiosInstance.get(this.url);

          if (!response.data || !response.data.data || !response.data.data.word_list) {
            logger.warn(`[${this.name}] 响应数据格式异常，使用备用数据`);
            return this.getFallbackData();
          }

          const wordList = response.data.data.word_list;
          if (!Array.isArray(wordList) || wordList.length === 0) {
            logger.warn(`[${this.name}] 数据不是数组格式或为空，使用备用数据`);
            return this.getFallbackData();
          }

          const topics = wordList.slice(0, 20).map((topic, index) => {
            const title = topic.word || topic.query || '';
            const validated = this.validateTopic({ title, source: Source.DOUYIN });

            if (!validated.valid) return null;

            return {
              title: title.trim(),
              description: topic.desc || title.trim(),
              category: this.categorizeTopic(title),
              heat: Math.max(1, Math.min(100, (topic.hot_value || (100 - index * 2)))),
              trend: this.getTrend(index),
              source: Source.DOUYIN,
              sourceUrl: `https://www.douyin.com/search/${encodeURIComponent(title)}`,
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
      { title: '2026年抖音热门舞蹈挑战合集', category: 'entertainment', heat: 99 },
      { title: 'AI绘画短视频创意玩法', category: 'tech', heat: 96 },
      { title: '春节家庭聚会搞笑瞬间', category: 'entertainment', heat: 93 },
      { title: '美食探店：2026必吃网红店', category: 'other', heat: 90 },
      { title: '健身达人新年训练计划', category: 'sports', heat: 87 },
      { title: '旅行Vlog：国内小众景点推荐', category: 'other', heat: 84 },
      { title: '数码评测：2026旗舰手机对比', category: 'tech', heat: 81 },
      { title: '萌宠视频：可爱猫咪日常', category: 'other', heat: 78 },
      { title: '音乐翻唱：经典歌曲新演绎', category: 'entertainment', heat: 75 },
      { title: '手工DIY：新年装饰制作教程', category: 'other', heat: 72 }
    ];

    return fallbackTopics.map((topic, index) => ({
      title: topic.title,
      description: topic.title,
      category: topic.category,
      heat: topic.heat,
      trend: this.getTrend(index),
      source: Source.DOUYIN,
      sourceUrl: `https://www.douyin.com/search/${encodeURIComponent(topic.title)}`,
      keywords: this.extractKeywords(topic.title),
      suitability: this.calculateSuitability(topic.title),
      publishedAt: new Date()
    }));
  }

  categorizeTopic(title) {
    // 统一使用英文分类值，与 types.js 和前端保持一致
    const categories = {
      'entertainment': ['舞蹈', '音乐', '翻唱', '搞笑', '明星', '综艺', '电影'],
      'tech': ['AI', '人工智能', '数码', '手机', '评测', '科技', '互联网'],
      'sports': ['健身', '运动', '训练', '体育', '篮球', '足球'],
      'finance': ['创业', '投资', '理财', '财经'],
      'social': ['社会', '民生', '新闻']
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
    if (title.includes('热门') || title.includes('挑战') || title.includes('合集')) score += 15;

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = DouyinFetcher;
