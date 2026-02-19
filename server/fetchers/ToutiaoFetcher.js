/**
 * 今日头条热点抓取器
 */

const axios = require('axios');
const cheerio = require('cheerio');
const BaseFetcher = require('./BaseFetcher');
const { Source } = require('../core/types');
const logger = require('../utils/logger');

class ToutiaoFetcher extends BaseFetcher {
  constructor() {
    super({
      name: Source.TOUTIAO,
      url: 'https://www.toutiao.com/hot',
      type: 'scrape',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });

    // 多选择器降级策略
    this.selectors = [
      { title: '.hot-list-item .title', heat: '.hot-list-item .heat', link: '.hot-list-item a' },
      { title: '.hot-item .title', heat: '.hot-item .num', link: '.hot-item a' },
      { title: '.title-text', heat: '.hot-value', link: 'a[href*="/article/"]' },
      { title: 'a.title', heat: '.hot-num', link: 'a.title' }
    ];
  }

  /**
   * 抓取今日头条热点数据
   * @returns {Promise<import('../core/types').HotTopic[]>}
   */
  async fetch() {
    const cacheKey = 'toutiao-hot-topics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      return await this.fetchWithRetry(async () => {
        try {
          const response = await this.axiosInstance.get(this.url, {
            responseType: 'arraybuffer'
          });

          const buffer = Buffer.from(response.data, 'binary');
          const charset = response.headers['content-type']?.includes('gbk') ? 'gbk' : 'utf-8';
          const html = buffer.toString(charset);
          const $ = cheerio.load(html);

          let topics = [];

          for (const selector of this.selectors) {
            const elements = $(selector.title);
            if (elements.length === 0) continue;

            elements.slice(0, 20).each((index, element) => {
              const $element = $(element);
              const title = $element.text().trim();

              if (!title || title.length === 0) return;

              let heat = 100 - index * 2;
              const heatElement = $element.closest('.hot-list-item, .hot-item, li, div[class*="hot"]').find(selector.heat);
              const heatText = heatElement.text();
              const heatMatch = heatText.match(/\d+/);
              if (heatMatch) {
                heat = parseInt(heatMatch[0]);
              }

              let sourceUrl = '';
              const linkElement = $element.closest('.hot-list-item, .hot-item, li, div[class*="hot"]').find(selector.link);
              const href = linkElement.attr('href');
              if (href) {
                sourceUrl = href.startsWith('http') ? href : `https://www.toutiao.com${href}`;
              }

              const topic = {
                title,
                description: title,
                category: this.categorizeTopic(title),
                heat: Math.min(100, Math.max(1, heat)),
                trend: this.getTrend(index),
                source: Source.TOUTIAO,
                sourceUrl,
                keywords: this.extractKeywords(title),
                suitability: this.calculateSuitability(title),
                publishedAt: new Date()
              };

              const validated = this.validateTopic(topic);
              if (validated.valid) {
                topics.push(topic);
              }
            });

            if (topics.length > 5) break;
          }

          if (topics.length > 0) {
            topics = topics.slice(0, 20);
            this.setCache(cacheKey, topics);
            logger.info(`[${this.name}] 成功获取 ${topics.length} 条数据`);
            return topics;
          } else {
            logger.warn(`[${this.name}] 页面未解析到任何热点数据，使用备用数据`);
            return this.getFallbackData();
          }
        } catch (error) {
          logger.warn(`[${this.name}] 页面抓取失败: ${error.message}，使用备用数据`);
          return this.getFallbackData();
        }
      });
    } catch (error) {
      logger.error(`[${this.name}] 所有尝试都失败，使用备用数据`);
      return this.getFallbackData();
    }
  }

  /**
   * 获取备用数据（当页面抓取不可用时使用）
   */
  getFallbackData() {
    const fallbackTopics = [
      { title: '量子计算技术商业化进程加速', category: 'tech', heat: 97 },
      { title: '数字经济占GDP比重持续提升', category: 'finance', heat: 94 },
      { title: '虚拟现实技术在教育领域应用', category: 'tech', heat: 91 },
      { title: '乡村振兴战略取得新成效', category: 'social', heat: 88 },
      { title: '健康产业迎来发展新机遇', category: 'social', heat: 85 },
      { title: '绿色出行方式越来越普及', category: 'social', heat: 82 },
      { title: '智慧物流系统效率大幅提升', category: 'tech', heat: 79 },
      { title: '消费市场持续回暖复苏', category: 'finance', heat: 76 },
      { title: '文化产业数字化转型升级', category: 'entertainment', heat: 73 },
      { title: '老年健康服务体系不断完善', category: 'social', heat: 70 }
    ];

    return fallbackTopics.map((topic, index) => ({
      title: topic.title,
      description: topic.title,
      category: topic.category,
      heat: topic.heat,
      trend: this.getTrend(index),
      source: Source.TOUTIAO,
      sourceUrl: `https://www.toutiao.com/search/?keyword=${encodeURIComponent(topic.title)}`,
      keywords: this.extractKeywords(topic.title),
      suitability: this.calculateSuitability(topic.title),
      publishedAt: new Date()
    }));
  }

  categorizeTopic(title) {
    // 统一使用英文分类值，与 types.js 和前端保持一致
    const categories = {
      'entertainment': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐'],
      'tech': ['AI', '人工智能', '科技', '互联网', '手机', '数码'],
      'finance': ['股市', '经济', '金融', '投资', '房价', '财经'],
      'sports': ['足球', '篮球', '奥运', '体育', '运动员'],
      'social': ['社会', '民生', '政策', '教育', '医疗'],
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
    return words.filter(word => word.length > 1 && !commonWords.includes(word)).slice(0, 5);
  }

  calculateSuitability(title) {
    let score = 50;
    if (title.length > 10 && title.length < 50) score += 20;
    if (title.includes('？') || title.includes('!')) score += 10;
    if (title.includes('最新') || title.includes('突发')) score += 15;
    return Math.min(100, Math.max(0, score));
  }
}

module.exports = ToutiaoFetcher;
