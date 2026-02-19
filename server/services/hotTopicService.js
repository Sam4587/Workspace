const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class HotTopicService {
  constructor() {
    this.sources = [
      {
        name: '微博热搜',
        url: 'https://weibo.com/ajax/side/hotSearch',
        type: 'api'
      },
      {
        name: '今日头条',
        url: 'https://www.toutiao.com/hot',
        type: 'scrape'
      },
      {
        name: '百度热搜',
        url: 'https://top.baidu.com/board',
        type: 'scrape'
      }
    ];

    this.cache = new NodeCache({
      stdTTL: 1800,
      checkperiod: 600
    });

    this.isUpdating = false;

    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    this.toutiaoSelectors = [
      { title: '.hot-list-item .title', heat: '.hot-list-item .heat', link: '.hot-list-item a' },
      { title: '.hot-item .title', heat: '.hot-item .num', link: '.hot-item a' },
      { title: '.title-text', heat: '.hot-value', link: 'a[href*="/article/"]' },
      { title: 'a.title', heat: '.hot-num', link: 'a.title' }
    ];
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateTopic(topic) {
    if (!topic || typeof topic !== 'object') {
      return { valid: false, error: '话题数据格式错误' };
    }

    if (!topic.title || typeof topic.title !== 'string' || topic.title.trim().length === 0) {
      return { valid: false, error: '标题不能为空' };
    }

    if (!topic.source || typeof topic.source !== 'string') {
      return { valid: false, error: '来源不能为空' };
    }

    if (topic.heat !== undefined && (typeof topic.heat !== 'number' || topic.heat < 0 || topic.heat > 100)) {
      return { valid: false, error: '热度值必须在 0-100 之间' };
    }

    // 统一使用英文分类值
    const validCategories = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international', 'other'];
    if (!topic.category || !validCategories.includes(topic.category)) {
      topic.category = 'other';
    }

    return { valid: true };
  }

  async fetchWeiboHotSearch() {
    const cacheKey = 'weibo-hot-topics';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用微博热搜缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources[0].url);

      if (!response.data || !response.data.data) {
        logger.warn('微博热搜响应数据格式异常');
        return [];
      }

      const rawData = response.data.data.realtime || [];
      if (!Array.isArray(rawData)) {
        logger.warn('微博热搜数据不是数组格式');
        return [];
      }

      const topics = rawData.slice(0, 20).map((topic, index) => {
        const title = topic.word || topic.query || '';
        const validated = this.validateTopic({ title, source: '微博热搜' });

        return {
          title: title.trim(),
          description: topic.word_zh || topic.desc || title.trim(),
          category: this.categorizeTopic(title),
          heat: Math.max(1, 100 - index * 2),
          trend: this.getTrend(index),
          source: '微博热搜',
          sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
          keywords: this.extractKeywords(title),
          suitability: this.calculateSuitability(title),
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

  async fetchToutiaoHot() {
    const cacheKey = 'toutiao-hot-topics';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('使用今日头条热点缓存数据');
      return cached;
    }

    return await this.fetchWithRetry(async () => {
      const response = await this.axiosInstance.get(this.sources[1].url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const charset = response.headers['content-type']?.includes('gbk') ? 'gbk' : 'utf-8';
      const html = buffer.toString(charset);

      const $ = cheerio.load(html);

      let topics = [];

      for (const selector of this.toutiaoSelectors) {
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
            source: '今日头条',
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

      if (topics.length === 0) {
        logger.warn('今日头条页面未解析到任何热点数据，可能页面结构已变化');
        return [];
      }

      topics = topics.slice(0, 20);

      if (topics.length > 0) {
        this.cache.set(cacheKey, topics);
        logger.info(`成功获取 ${topics.length} 条今日头条热点数据`);
      }

      return topics;
    });
  }

  async updateHotTopics() {
    if (this.isUpdating) {
      logger.warn('热点数据更新正在进行中，跳过本次请求');
      return await this.getCachedTopics();
    }

    this.isUpdating = true;
    const startTime = Date.now();

    try {
      logger.info('开始更新热点话题数据...');

      const [weiboTopics, toutiaoTopics] = await Promise.allSettled([
        this.fetchWeiboHotSearch(),
        this.fetchToutiaoHot()
      ]);

      const topics = [];

      if (weiboTopics.status === 'fulfilled' && weiboTopics.value.length > 0) {
        topics.push(...weiboTopics.value);
        logger.debug(`微博热搜获取 ${weiboTopics.value.length} 条`);
      } else {
        logger.warn(`微博热搜获取失败: ${weiboTopics.reason?.message || '未知错误'}`);
      }

      if (toutiaoTopics.status === 'fulfilled' && toutiaoTopics.value.length > 0) {
        topics.push(...toutiaoTopics.value);
        logger.debug(`今日头条热点获取 ${toutiaoTopics.value.length} 条`);
      } else {
        logger.warn(`今日头条热点获取失败: ${toutiaoTopics.reason?.message || '未知错误'}`);
      }

      if (topics.length === 0) {
        logger.warn('所有数据源均未获取到数据');
        return await this.getCachedTopics();
      }

      const savedTopics = await this.saveTopics(topics);
      await this.cleanExpiredTopics();

      const duration = Date.now() - startTime;
      logger.info(`热点话题更新完成，耗时 ${duration}ms，共保存 ${savedTopics.length} 条`);

      return savedTopics;
    } catch (error) {
      logger.error('热点更新失败', {
        error: error.message,
        stack: error.stack
      });
      return await this.getCachedTopics();
    } finally {
      this.isUpdating = false;
    }
  }

  async saveTopics(topics) {
    const savedTopics = [];

    for (const topic of topics) {
      const validated = this.validateTopic(topic);
      if (!validated.valid) {
        logger.debug(`跳过无效话题: ${validated.error}`, { topic });
        continue;
      }

      try {
        const saved = await HotTopic.findOneAndUpdate(
          { title: topic.title, source: topic.source },
          {
            ...topic,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
        savedTopics.push(saved);
      } catch (error) {
        logger.error(`保存话题失败: ${topic.title}`, { error: error.message });
      }
    }

    return savedTopics;
  }

  async cleanExpiredTopics() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await HotTopic.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });

      if (result.deletedCount > 0) {
        logger.info(`清理过期话题数据 ${result.deletedCount} 条`);
      }
    } catch (error) {
      logger.error('清理过期话题数据失败', { error: error.message });
    }
  }

  async getCachedTopics() {
    try {
      const topics = await HotTopic.find({})
        .sort({ heat: -1, createdAt: -1 })
        .limit(50)
        .lean();
      return topics;
    } catch (error) {
      logger.error('获取缓存话题失败', { error: error.message });
      return [];
    }
  }

  async getTopicsBySource(source) {
    const cacheKey = `topics-${source}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const topics = await HotTopic.find({ source })
        .sort({ heat: -1 })
        .limit(30)
        .lean();

      this.cache.set(cacheKey, topics, 300);
      return topics;
    } catch (error) {
      logger.error(`获取 ${source} 话题失败`, { error: error.message });
      return [];
    }
  }

  invalidateCache(source = 'all') {
    if (source === 'all') {
      this.cache.flushAll();
      logger.info('清空所有热点话题缓存');
    } else {
      this.cache.del(`topics-${source}`);
      logger.info(`清空 ${source} 热点话题缓存`);
    }
  }

  categorizeTopic(title) {
    // 统一使用英文分类值，与 types.js 和前端保持一致
    const categories = {
      'entertainment': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐', '演员', '歌手', '票房'],
      'tech': ['AI', '人工智能', '科技', '互联网', '手机', '数码', '芯片', '软件', 'APP', '华为', '苹果', '小米'],
      'finance': ['股市', '经济', '金融', '投资', '房价', '财经', '股票', '基金', '银行', '利率'],
      'sports': ['足球', '篮球', '奥运', '体育', '运动员', 'NBA', '世界杯', '比赛', '联赛'],
      'social': ['社会', '民生', '政策', '教育', '医疗', '学校', '高考', '就业'],
      'international': ['国际', '外交', '战争', '政治', '国家', '美国', '俄罗斯', '欧盟']
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
    const keywords = [];
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    
    const words = title.split(/[\s,，。！？；：""''（）()【】《》\[\]]/);
    words.forEach(word => {
      if (word.length > 1 && !commonWords.includes(word)) {
        keywords.push(word);
      }
    });
    
    return keywords.slice(0, 5);
  }

  calculateSuitability(title) {
    let score = 50;
    
    // 根据标题特征调整适配度
    if (title.length > 10 && title.length < 50) score += 20;
    if (title.includes('？') || title.includes('!')) score += 10;
    if (title.includes('最新') || title.includes('突发')) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }
}

module.exports = new HotTopicService();
