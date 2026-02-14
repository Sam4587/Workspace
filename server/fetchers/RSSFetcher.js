/**
 * RSS 订阅源抓取器
 */

const axios = require('axios');
const cheerio = require('cheerio');
const BaseFetcher = require('./BaseFetcher');
const { Source, SourceType } = require('../core/types');
const { logger } = require('../utils/logger');

class RSSFetcher extends BaseFetcher {
  /**
   * @param {Object} config
   * @param {string} config.name - 订阅源名称
   * @param {string} config.url - RSS 地址
   * @param {string[]} [config.keywords] - 过滤关键词
   * @param {number} [config.limit] - 返回条数限制
   */
  constructor(config) {
    super({
      name: config.name || 'RSS订阅',
      url: config.url,
      type: SourceType.RSS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    this.keywords = config.keywords || [];
    this.limit = config.limit || 20;
    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });
  }

  /**
   * 抓取 RSS 数据
   * @returns {Promise<import('../core/types').HotTopic[]>}
   */
  async fetch() {
    const cacheKey = `rss-${this.name}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const xml = buffer.toString('utf-8');
      const items = this.parseRSS(xml);

      // 应用关键词过滤
      let filteredItems = items;
      if (this.keywords.length > 0) {
        filteredItems = items.filter(item =>
          this.keywords.some(keyword =>
            item.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(keyword.toLowerCase()))
          )
        );
      }

      const topics = filteredItems.slice(0, this.limit).map((item, index) => {
        return {
          title: item.title.trim(),
          description: (item.description || item.title).trim(),
          category: this.categorizeTopic(item.title),
          heat: Math.max(1, 100 - index * 2),
          trend: this.getTrend(index),
          source: this.name,
          sourceUrl: item.link || '',
          keywords: this.extractKeywords(item.title),
          suitability: this.calculateSuitability(item.title),
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date()
        };
      });

      if (topics.length > 0) {
        this.setCache(cacheKey, topics);
        logger.info(`[${this.name}] 成功获取 ${topics.length} 条 RSS 数据`);
      }

      return topics;
    });
  }

  /**
   * 解析 RSS/Atom 格式
   * @param {string} xml
   * @returns {Array}
   */
  parseRSS(xml) {
    const $ = cheerio.load(xml, { xmlMode: true });
    const items = [];

    // 尝试解析 RSS 2.0 格式
    $('item').each((_, element) => {
      const $item = $(element);
      items.push({
        title: $item.find('title').text(),
        description: $item.find('description').text(),
        link: $item.find('link').text(),
        pubDate: $item.find('pubDate').text() || $item.find('dc\\:date').text()
      });
    });

    // 如果 RSS 格式解析失败，尝试 Atom 格式
    if (items.length === 0) {
      $('entry').each((_, element) => {
        const $entry = $(element);
        const link = $entry.find('link').attr('href') || $entry.find('link').text();
        items.push({
          title: $entry.find('title').text(),
          description: $entry.find('summary').text() || $entry.find('content').text(),
          link,
          pubDate: $entry.find('published').text() || $entry.find('updated').text()
        });
      });
    }

    return items;
  }

  categorizeTopic(title) {
    const categories = {
      '娱乐': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐'],
      '科技': ['AI', '人工智能', '科技', '互联网', '手机', '数码', '编程', '代码', '开发'],
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
    if (title.includes('？') || title.includes('?') || title.includes('!')) score += 10;
    if (title.includes('最新') || title.includes('突发')) score += 15;
    return Math.min(100, Math.max(0, score));
  }
}

module.exports = RSSFetcher;
