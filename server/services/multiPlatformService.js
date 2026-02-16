const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class MultiPlatformService {
  constructor() {
    this.sources = {
      weibo: {
        name: '微博热搜',
        url: 'https://weibo.com/ajax/side/hotSearch',
        type: 'api',
        enabled: true
      },
      toutiao: {
        name: '今日头条',
        url: 'https://top.baidu.com/board',
        type: 'scrape',
        enabled: true
      },
      zhihu: {
        name: '知乎热榜',
        url: 'https://www.zhihu.com/hot',
        type: 'scrape',
        enabled: true
      },
      baidu: {
        name: '百度热搜',
        url: 'https://top.baidu.com/board?tab=realtime',
        type: 'scrape',
        enabled: true
      },
      douyin: {
        name: '抖音热榜',
        url: 'https://www.douyin.com/hot',
        type: 'scrape',
        enabled: true
      },
      bilibili: {
        name: 'B站热搜',
        url: 'https://www.bilibili.com/v/popular/rank/all',
        type: 'scrape',
        enabled: true
      },
      xiaohongshu: {
        name: '小红书热搜',
        url: 'https://www.xiaohongshu.com/web_api/sns/v1/search/notes',
        type: 'api',
        enabled: true
      },
      wangyi: {
        name: '网易新闻',
        url: 'https://news.163.com/special/000138JP/000138J6P/all.html',
        type: 'scrape',
        enabled: true
      },
      sohu: {
        name: '搜狐新闻',
        url: 'https://news.sohu.com/',
        type: 'scrape',
        enabled: true
      },
      tencent: {
        name: '腾讯新闻',
        url: 'https://news.qq.com/',
        type: 'scrape',
        enabled: true
      }
    };

    this.cache = new NodeCache({
      stdTTL: 1800,
      checkperiod: 600
    });

    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(requestFn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt) {
          logger.error(`请求失败 (重试 ${attempt}/${maxRetries}): ${error.message}`, {
            url: error.config?.url,
            status: error.response?.status
          });
          throw error;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn(`请求失败，${delay}ms 后重试 (${attempt}/${maxRetries}): ${error.message}`);
        await this.sleep(delay);
      }
    }
  }

  async fetchWeiboHot() {
    const cacheKey = 'weibo-hot';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用微博热搜缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.weibo.url);

      if (!response.data || !response.data.data) {
        logger.warn('微博热搜响应数据格式异常');
        return [];
      }

      const rawData = response.data.data.realtime || [];
      if (!Array.isArray(rawData)) {
        logger.warn('微博热搜数据不是数组格式');
        return [];
      }

      const topics = rawData.slice(0, 30).map((topic, index) => {
        const title = topic.word || topic.query || '';
        return {
          title: title.trim(),
          description: topic.word_zh || topic.desc || title.trim(),
          category: this.categorizeTopic(title),
          heat: Math.max(1, 100 - index * 2),
          trend: this.getTrend(index),
          source: '微博热搜',
          sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
          keywords: this.extractKeywords(title),
          isNew: index < 5,
          publishedAt: new Date()
        };
      }).filter(topic => topic.title.length > 0);

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条微博热搜数据`);
      }

      return topics;
    });
  }

  async fetchZhihuHot() {
    const cacheKey = 'zhihu-hot';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用知乎热榜缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.zhihu.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const hotItems = $('.HotItem-list .HotItem');

      hotItems.slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('.HotItem-title').text().trim();
        const heat = 100 - index * 4;
        const excerpt = $element.find('.HotItem-excerpt').text().trim();
        const link = $element.find('a').attr('href');

        if (title) {
          topics.push({
            title,
            description: excerpt || title,
            category: this.categorizeTopic(title),
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: '知乎热榜',
            sourceUrl: link ? `https://www.zhihu.com${link}` : '',
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条知乎热榜数据`);
      }

      return topics;
    });
  }

  async fetchBaiduHot() {
    const cacheKey = 'baidu-hot';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用百度热搜缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.baidu.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const hotItems = $('#sanRoot .category-wrap_iQLList .item-wrap_2EQ5s');

      hotItems.slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('.title_2VpmI').text().trim();
        const hotValue = $element.find('.hot-index_1Bl1a').text().trim();
        const heatMatch = hotValue.match(/\d+/);
        const heat = heatMatch ? parseInt(hotMatch[0]) : 100 - index * 4;
        const link = $element.find('a').attr('href');

        if (title) {
          topics.push({
            title,
            description: title,
            category: this.categorizeTopic(title),
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: '百度热搜',
            sourceUrl: link || `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条百度热搜数据`);
      }

      return topics;
    });
  }

  async fetchDouyinHot() {
    const cacheKey = 'douyin-hot';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用抖音热榜缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.douyin.url, {
        responseType: 'arraybuffer',
        headers: {
          'Referer': 'https://www.douyin.com/'
        }
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const hotItems = $('.list-card .video-card');

      hotItems.slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('.title').text().trim();
        const heat = 100 - index * 4;
        const link = $element.find('a').attr('href');

        if (title) {
          topics.push({
            title,
            description: title,
            category: '娱乐',
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: '抖音热榜',
            sourceUrl: link ? `https://www.douyin.com${link}` : '',
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条抖音热榜数据`);
      }

      return topics;
    });
  }

  async fetchBilibiliHot() {
    const cacheKey = 'bilibili-hot';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用B站热搜缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.bilibili.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const hotItems = $('.rank-list .video-item');

      hotItems.slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('.video-title').text().trim();
        const heat = 100 - index * 4;
        const link = $element.find('a').attr('href');

        if (title) {
          topics.push({
            title,
            description: title,
            category: this.categorizeTopic(title),
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: 'B站热搜',
            sourceUrl: link ? `https://www.bilibili.com${link}` : '',
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条B站热搜数据`);
      }

      return topics;
    });
  }

  async fetchXiaohongshuHot() {
    const cacheKey = 'xiaohongshu-hot';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用小红书热搜缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.xiaohongshu.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const hotItems = $('article');

      hotItems.slice(0, 15).each((index, element) => {
        const $element = $(element);
        const title = $element.find('.title').text().trim();
        const heat = 100 - index * 5;
        const link = $element.find('.cover').parent().attr('xg-data-link');

        if (title) {
          topics.push({
            title,
            description: title,
            category: '生活',
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: '小红书热搜',
            sourceUrl: link || `https://www.xiaohongshu.com/discovery/item/${title}`,
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条小红书热搜数据`);
      }

      return topics;
    });
  }

  async fetchWangyiNews() {
    const cacheKey = 'wangyi-news';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用网易新闻缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.wangyi.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const newsItems = $('.ns-third .js_news');

      newsItems.slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('a.js-news-title').text().trim();
        const heat = 100 - index * 4;
        const link = $element.find('a').attr('href');
        const time = $element.find('.js-time').text().trim();

        if (title) {
          topics.push({
            title,
            description: title,
            category: '社会',
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: '网易新闻',
            sourceUrl: link ? `https://news.163.com${link}` : '',
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: time ? this.parseNewsTime(time) : new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条网易新闻数据`);
      }

      return topics;
    });
  }

  async fetchSohuNews() {
    const cacheKey = 'sohu-news';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用搜狐新闻缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.sohu.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const newsItems = $('.news-list .news-item');

      newsItems.slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('h3 a').text().trim();
        const heat = 100 - index * 4;
        const link = $element.find('a').attr('href');
        const time = $element.find('.time').text().trim();

        if (title) {
          topics.push({
            title,
            description: title,
            category: '社会',
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: '搜狐新闻',
            sourceUrl: link || '',
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: time ? this.parseNewsTime(time) : new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条搜狐新闻数据`);
      }

      return topics;
    });
  }

  async fetchTencentNews() {
    const cacheKey = 'tencent-news';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用腾讯新闻缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources.tencent.url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);

      const topics = [];
      const newsItems = $('.list .item');

      newsItems.slice(0, 20).each((index, element) => {
        const $element = $(element);
        const title = $element.find('.title a').text().trim();
        const heat = 100 - index * 4;
        const link = $element.find('a').attr('href');

        if (title) {
          topics.push({
            title,
            description: title,
            category: '社会',
            heat: Math.max(1, heat),
            trend: this.getTrend(index),
            source: '腾讯新闻',
            sourceUrl: link || '',
            keywords: this.extractKeywords(title),
            isNew: index < 5,
            publishedAt: new Date()
          });
        }
      });

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条腾讯新闻数据`);
      }

      return topics;
    });
  }

  async fetchAllSources() {
    const enabledSources = Object.entries(this.sources)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({ key, ...config }));

    const results = await Promise.allSettled(
      enabledSources.map(async ({ key }) => {
        try {
          let topics = [];
          switch (key) {
            case 'weibo':
              topics = await this.fetchWeiboHot();
              break;
            case 'zhihu':
              topics = await this.fetchZhihuHot();
              break;
            case 'baidu':
              topics = await this.fetchBaiduHot();
              break;
            case 'douyin':
              topics = await this.fetchDouyinHot();
              break;
            case 'bilibili':
              topics = await this.fetchBilibiliHot();
              break;
            case 'xiaohongshu':
              topics = await this.fetchXiaohongshuHot();
              break;
            case 'wangyi':
              topics = await this.fetchWangyiNews();
              break;
            case 'sohu':
              topics = await this.fetchSohuNews();
              break;
            case 'tencent':
              topics = await this.fetchTencentNews();
              break;
          }

          return { key, topics, success: true };
        } catch (error) {
          logger.error(`${key} 数据源获取失败`, { error: error.message });
          return { key, topics: [], success: false, error: error.message };
        }
      })
    );

    const allTopics = [];
    const summary = {};

    results.forEach(({ key, topics, success, error }) => {
      summary[key] = {
        name: this.sources[key].name,
        count: topics.length,
        success,
        error: error || null
      };
      allTopics.push(...topics);
    });

    logger.info(`多平台数据抓取完成，共获取 ${allTopics.length} 条数据`);

    return {
      topics: allTopics,
      summary
    };
  }

  getTrend(index) {
    if (index < 3) return 'up';
    if (index < 7) return 'stable';
    return 'down';
  }

  categorizeTopic(title) {
    const categories = {
      '娱乐': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐', '搞笑', '段子', '网红'],
      '科技': ['AI', '人工智能', '科技', '互联网', '手机', '数码', '华为', '苹果', '小米'],
      '财经': ['股市', '经济', '金融', '投资', '房价', '财经', '基金', '股票', 'A股'],
      '体育': ['足球', '篮球', '奥运', '体育', '运动员', '世界杯', 'NBA'],
      '社会': ['社会', '民生', '政策', '教育', '医疗', '突发', '案件'],
      '国际': ['国际', '外交', '战争', '政治', '国家', '美国', '俄罗斯']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }

    return '其他';
  }

  extractKeywords(title) {
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    const cleanText = title
      .replace(/[^\u4e00-\u9fa5]/g, '')
      .replace(/[^\u4e00-\u9fa5\s\w]/g, '')
      .toLowerCase();

    const words = cleanText.split(/[\s,，。！？；：""''（）【】《》]/)
      .filter(word => word.length > 1 && !commonWords.includes(word))
      .slice(0, 5);

    return [...new Set(words)];
  }

  parseNewsTime(timeStr) {
    const now = new Date();
    const match = timeStr.match(/(\d+)小时前/);
    if (match) {
      return new Date(now - parseInt(match[1]) * 60 * 60 * 1000);
    }
    return now;
  }

  getSourceStatus() {
    const status = {};
    for (const [key, config] of Object.entries(this.sources)) {
      status[key] = {
        name: config.name,
        enabled: config.enabled,
        url: config.url,
        type: config.type
      };
    }
    return status;
  }

  setSourceEnabled(sourceKey, enabled) {
    if (this.sources[sourceKey]) {
      this.sources[sourceKey].enabled = enabled;
      logger.info(`${this.sources[sourceKey].name} 已${enabled ? '启用' : '禁用'}`);
    }
  }

  invalidateCache(source = 'all') {
    if (source === 'all') {
      this.cache.flushAll();
      logger.info('清空所有平台缓存');
    } else {
      const cacheKeys = {
        weibo: 'weibo-hot',
        zhihu: 'zhihu-hot',
        baidu: 'baidu-hot',
        douyin: 'douyin-hot',
        bilibili: 'bilibili-hot',
        xiaohongshu: 'xiaohongshu-hot',
        wangyi: 'wangyi-news',
        sohu: 'sohu-news',
        tencent: 'tencent-news'
      };
      if (cacheKeys[source]) {
        this.cache.del(cacheKeys[source]);
        logger.info(`清空 ${this.sources[source]?.name || source} 缓存`);
      }
    }
  }
}

module.exports = new MultiPlatformService();
