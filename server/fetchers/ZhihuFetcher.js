/**
 * 知乎热榜抓取器
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const { Source } = require('../core/types');
const { logger } = require('../utils/logger');

class ZhihuFetcher extends BaseFetcher {
  constructor() {
    super({
      name: Source.ZHIHU,
      url: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total',
      type: 'api',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: this.headers
    });
  }

  /**
   * 抓取知乎热榜数据
   * @returns {Promise<import('../core/types').HotTopic[]>}
   */
  async fetch() {
    const cacheKey = 'zhihu-hot-topics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return await this.fetchWithRetry(async () => {
      try {
        const response = await this.axiosInstance.get(this.url, {
          params: {
            limit: 50,
            desktop: true
          }
        });

        if (!response.data || !response.data.data) {
          logger.warn(`[${this.name}] 响应数据格式异常`);
          return [];
        }

        const rawData = response.data.data || [];
        if (!Array.isArray(rawData)) {
          logger.warn(`[${this.name}] 数据不是数组格式`);
          return [];
        }

        const topics = rawData.slice(0, 20).map((item, index) => {
          const target = item.target || {};
          const title = target.title || target.excerpt || '';
          const validated = this.validateTopic({ title, source: Source.ZHIHU });

          if (!validated.valid) return null;

          const detailText = target.excerpt || '';
          const hotValue = item.detail_text || '';
          const heatMatch = hotValue.match(/(\d+)/);
          let heat = 100 - index * 2;
          if (heatMatch) {
            // 知乎热度通常是大数字，归一化到 0-100
            const rawHeat = parseInt(heatMatch[1]);
            heat = Math.min(100, Math.max(1, Math.round(rawHeat / 10000)));
          }

          return {
            title: title.trim(),
            description: detailText.trim() || title.trim(),
            category: this.categorizeTopic(title),
            heat,
            trend: this.getTrend(index),
            source: Source.ZHIHU,
            sourceUrl: target.url || `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(title)}`,
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
      } catch (error) {
        // 知乎 API 可能需要登录，尝试备用方案
        logger.warn(`[${this.name}] API 调用失败，尝试备用抓取方案`);
        return await this.fetchFromPage();
      }
    });
  }

  /**
   * 备用方案：从页面抓取
   */
  async fetchFromPage() {
    try {
      const cheerio = require('cheerio');
      const response = await axios.get('https://www.zhihu.com/hot', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      const topics = [];

      $('.HotList-list .HotItem').slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('.HotItem-title').text().trim();
        const excerpt = $element.find('.HotItem-excerpt').text().trim();
        const heatText = $element.find('.HotItem-metrics').text();
        const link = $element.find('a').attr('href') || '';

        if (!title) return;

        let heat = 100 - index * 2;
        const heatMatch = heatText.match(/(\d+)/);
        if (heatMatch) {
          heat = Math.min(100, Math.max(1, parseInt(heatMatch[1])));
        }

        topics.push({
          title,
          description: excerpt || title,
          category: this.categorizeTopic(title),
          heat,
          trend: this.getTrend(index),
          source: Source.ZHIHU,
          sourceUrl: link,
          keywords: this.extractKeywords(title),
          suitability: this.calculateSuitability(title),
          publishedAt: new Date()
        });
      });

      if (topics.length > 0) {
        this.setCache('zhihu-hot-topics', topics);
        logger.info(`[${this.name}] 备用方案成功获取 ${topics.length} 条数据`);
      }

      return topics;
    } catch (error) {
      logger.error(`[${this.name}] 备用抓取方案也失败: ${error.message}`);
      return [];
    }
  }

  categorizeTopic(title) {
    const categories = {
      '娱乐': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐'],
      '科技': ['AI', '人工智能', '科技', '互联网', '手机', '数码', '编程', '代码'],
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
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '什么', '怎么', '如何'];
    const words = title.split(/[\s,，。！？；：""''（）()【】《》\[\]]/);
    return words.filter(word => word.length > 1 && !commonWords.includes(word)).slice(0, 5);
  }

  calculateSuitability(title) {
    let score = 50;
    if (title.length > 10 && title.length < 50) score += 20;
    if (title.includes('？') || title.includes('?') || title.includes('!')) score += 10;
    if (title.includes('最新') || title.includes('突发') || title.includes('如何评价')) score += 15;
    return Math.min(100, Math.max(0, score));
  }
}

module.exports = ZhihuFetcher;
