/**
 * 扩展数据源服务
 * 支持RSS订阅、新闻API、社交媒体等多种数据源
 */

const axios = require('axios');
const Parser = require('rss-parser');
const logger = require('../utils/logger');
const PerformanceOptimizationService = require('./performanceOptimizationService');

class ExtendedDataSourceService {
  constructor() {
    this.rssParser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // 支持的数据源配置
    this.dataSources = {
      rss: this.setupRSSSources(),
      newsApi: this.setupNewsAPISources(),
      socialMedia: this.setupSocialMediaSources(),
      techPlatforms: this.setupTechPlatformSources()
    };
  }

  /**
   * RSS数据源配置
   */
  setupRSSSources() {
    return [
      {
        id: 'tech-crunch',
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: '科技',
        language: 'en',
        enabled: true
      },
      {
        id: '36kr',
        name: '36氪',
        url: 'https://36kr.com/feed',
        category: '科技',
        language: 'zh',
        enabled: true
      },
      {
        id: 'infoq',
        name: 'InfoQ',
        url: 'https://www.infoq.cn/feed',
        category: '技术',
        language: 'zh',
        enabled: true
      },
      {
        id: 'cnbeta',
        name: 'cnBeta',
        url: 'https://www.cnbeta.com/backend.php',
        category: '科技',
        language: 'zh',
        enabled: true
      },
      {
        id: 'hacker-news',
        name: 'Hacker News',
        url: 'https://news.ycombinator.com/rss',
        category: '技术',
        language: 'en',
        enabled: true
      }
    ];
  }

  /**
   * 新闻API数据源配置
   */
  setupNewsAPISources() {
    return [
      {
        id: 'newsapi-org',
        name: 'NewsAPI.org',
        baseUrl: 'https://newsapi.org/v2',
        apiKey: process.env.NEWSAPI_KEY,
        endpoints: {
          topHeadlines: '/top-headlines',
          everything: '/everything'
        },
        supportedCountries: ['us', 'cn', 'gb'],
        supportedCategories: ['business', 'technology', 'science', 'entertainment'],
        enabled: !!process.env.NEWSAPI_KEY
      },
      {
        id: 'guardian',
        name: 'The Guardian',
        baseUrl: 'https://content.guardianapis.com',
        apiKey: process.env.GUARDIAN_API_KEY,
        endpoints: {
          search: '/search'
        },
        supportedSections: ['technology', 'business', 'culture'],
        enabled: !!process.env.GUARDIAN_API_KEY
      }
    ];
  }

  /**
   * 社交媒体数据源配置
   */
  setupSocialMediaSources() {
    return [
      {
        id: 'reddit-tech',
        name: 'Reddit Technology',
        baseUrl: 'https://www.reddit.com/r/technology',
        type: 'scrape',
        enabled: true
      },
      {
        id: 'product-hunt',
        name: 'Product Hunt',
        baseUrl: 'https://www.producthunt.com',
        type: 'api',
        apiKey: process.env.PRODUCT_HUNT_TOKEN,
        enabled: !!process.env.PRODUCT_HUNT_TOKEN
      }
    ];
  }

  /**
   * 技术平台数据源配置
   */
  setupTechPlatformSources() {
    return [
      {
        id: 'github-trending',
        name: 'GitHub Trending',
        baseUrl: 'https://github.com/trending',
        type: 'scrape',
        enabled: true
      },
      {
        id: 'stackoverflow',
        name: 'Stack Overflow',
        baseUrl: 'https://stackoverflow.com/questions',
        type: 'api',
        apiKey: process.env.STACKOVERFLOW_API_KEY,
        enabled: !!process.env.STACKOVERFLOW_API_KEY
      }
    ];
  }

  /**
   * 获取所有启用的数据源
   */
  getEnabledSources() {
    const enabledSources = [];
    
    Object.entries(this.dataSources).forEach(([type, sources]) => {
      sources.forEach(source => {
        if (source.enabled) {
          enabledSources.push({ ...source, type });
        }
      });
    });
    
    return enabledSources;
  }

  /**
   * 从RSS源获取数据
   */
  async fetchFromRSS(source) {
    const cacheKey = `rss-${source.id}`;
    
    return await PerformanceOptimizationService.withCache(
      cacheKey,
      async () => {
        try {
          logger.info(`[ExtendedDataSource] 获取RSS数据: ${source.name}`);
          
          const feed = await this.rssParser.parseURL(source.url);
          
          const topics = feed.items.slice(0, 20).map((item, index) => ({
            title: item.title,
            description: item.contentSnippet || item.summary || '',
            source: source.name,
            sourceUrl: item.link,
            publishedAt: new Date(item.pubDate || item.isoDate || Date.now()),
            category: source.category,
            heat: Math.max(50, 100 - index * 3), // 基于排名计算热度
            keywords: this.extractKeywordsFromText(item.title + ' ' + (item.contentSnippet || '')),
            language: source.language
          }));

          logger.info(`[ExtendedDataSource] RSS获取完成: ${source.name} (${topics.length}条)`);
          return topics;
        } catch (error) {
          logger.error(`[ExtendedDataSource] RSS获取失败: ${source.name}`, { 
            error: error.message,
            url: source.url
          });
          return [];
        }
      },
      {
        cacheLevel: 'warm',
        ttl: 900 // 15分钟缓存
      }
    );
  }

  /**
   * 从新闻API获取数据
   */
  async fetchFromNewsAPI(source, options = {}) {
    const {
      country = 'us',
      category = 'technology',
      pageSize = 20
    } = options;

    const cacheKey = `newsapi-${source.id}-${country}-${category}`;
    
    return await PerformanceOptimizationService.withCache(
      cacheKey,
      async () => {
        try {
          logger.info(`[ExtendedDataSource] 获取新闻API数据: ${source.name}`);
          
          let apiUrl;
          let params;

          if (source.id === 'newsapi-org') {
            apiUrl = `${source.baseUrl}${source.endpoints.topHeadlines}`;
            params = {
              country,
              category,
              pageSize,
              apiKey: source.apiKey
            };
          } else if (source.id === 'guardian') {
            apiUrl = `${source.baseUrl}${source.endpoints.search}`;
            params = {
              'api-key': source.apiKey,
              section: category,
              'page-size': pageSize,
              'order-by': 'newest'
            };
          }

          const response = await this.axiosInstance.get(apiUrl, { params });
          
          let articles = [];
          if (source.id === 'newsapi-org') {
            articles = response.data.articles;
          } else if (source.id === 'guardian') {
            articles = response.data.response.results;
          }

          const topics = articles.map((article, index) => {
            const title = source.id === 'newsapi-org' ? article.title : article.webTitle;
            const description = source.id === 'newsapi-org' ? article.description : article.fields?.trailText || '';
            const url = source.id === 'newsapi-org' ? article.url : article.webUrl;
            const publishedAt = source.id === 'newsapi-org' ? article.publishedAt : article.webPublicationDate;

            return {
              title,
              description,
              source: source.name,
              sourceUrl: url,
              publishedAt: new Date(publishedAt),
              category: this.mapCategory(category),
              heat: Math.max(60, 100 - index * 2),
              keywords: this.extractKeywordsFromText(title + ' ' + description),
              language: source.id === 'newsapi-org' ? 'en' : 'en'
            };
          });

          logger.info(`[ExtendedDataSource] 新闻API获取完成: ${source.name} (${topics.length}条)`);
          return topics;
        } catch (error) {
          logger.error(`[ExtendedDataSource] 新闻API获取失败: ${source.name}`, { 
            error: error.message,
            status: error.response?.status
          });
          return [];
        }
      },
      {
        cacheLevel: 'warm',
        ttl: 1800 // 30分钟缓存
      }
    );
  }

  /**
   * 从技术平台获取数据
   */
  async fetchFromTechPlatform(source) {
    const cacheKey = `tech-${source.id}`;
    
    return await PerformanceOptimizationService.withCache(
      cacheKey,
      async () => {
        try {
          logger.info(`[ExtendedDataSource] 获取技术平台数据: ${source.name}`);
          
          let topics = [];
          
          if (source.id === 'github-trending') {
            topics = await this.scrapeGitHubTrending();
          } else if (source.id === 'stackoverflow') {
            topics = await this.fetchStackOverflowData(source);
          }

          logger.info(`[ExtendedDataSource] 技术平台获取完成: ${source.name} (${topics.length}条)`);
          return topics;
        } catch (error) {
          logger.error(`[ExtendedDataSource] 技术平台获取失败: ${source.name}`, { 
            error: error.message 
          });
          return [];
        }
      },
      {
        cacheLevel: 'warm',
        ttl: 3600 // 1小时缓存
      }
    );
  }

  /**
   * 爬取GitHub Trending
   */
  async scrapeGitHubTrending() {
    try {
      const response = await this.axiosInstance.get('https://github.com/trending');
      
      // 这里需要实现具体的爬取逻辑
      // 由于GitHub页面结构复杂，这里返回模拟数据
      return [
        {
          title: 'Sample Repository 1',
          description: 'A sample trending repository',
          source: 'GitHub Trending',
          sourceUrl: 'https://github.com/sample/repo1',
          publishedAt: new Date(),
          category: '开源',
          heat: 95,
          keywords: ['github', 'trending', 'repository'],
          language: 'en'
        }
      ];
    } catch (error) {
      logger.error('[ExtendedDataSource] GitHub Trending爬取失败', { error: error.message });
      return [];
    }
  }

  /**
   * 获取Stack Overflow数据
   */
  async fetchStackOverflowData(source) {
    try {
      const response = await this.axiosInstance.get(
        `${source.baseUrl}/questions?order=desc&sort=votes&site=stackoverflow&key=${source.apiKey}&pagesize=20`
      );
      
      return response.data.items.map((item, index) => ({
        title: item.title,
        description: item.body_markdown?.substring(0, 200) || '',
        source: 'Stack Overflow',
        sourceUrl: `https://stackoverflow.com/questions/${item.question_id}`,
        publishedAt: new Date(item.creation_date * 1000),
        category: '技术问答',
        heat: Math.max(70, 100 - index * 2),
        keywords: [...(item.tags || []), ...this.extractKeywordsFromText(item.title)],
        language: 'en'
      }));
    } catch (error) {
      logger.error('[ExtendedDataSource] Stack Overflow数据获取失败', { error: error.message });
      return [];
    }
  }

  /**
   * 批量获取所有数据源
   */
  async fetchAllSources() {
    const enabledSources = this.getEnabledSources();
    const allTopics = [];

    logger.info(`[ExtendedDataSource] 开始获取 ${enabledSources.length} 个数据源的数据`);

    const fetchPromises = enabledSources.map(async (source) => {
      try {
        let topics = [];
        
        switch (source.type) {
          case 'rss':
            topics = await this.fetchFromRSS(source);
            break;
          case 'newsApi':
            topics = await this.fetchFromNewsAPI(source);
            break;
          case 'techPlatforms':
            topics = await this.fetchFromTechPlatform(source);
            break;
          default:
            logger.warn(`[ExtendedDataSource] 不支持的数据源类型: ${source.type}`);
        }

        return topics;
      } catch (error) {
        logger.error(`[ExtendedDataSource] 数据源获取失败: ${source.name}`, { 
          error: error.message 
        });
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // 合并所有结果
    results.forEach(topics => {
      allTopics.push(...topics);
    });

    // 按热度排序并去重
    const uniqueTopics = this.deduplicateTopics(allTopics);
    const sortedTopics = uniqueTopics.sort((a, b) => b.heat - a.heat);

    logger.info(`[ExtendedDataSource] 数据获取完成，共获得 ${sortedTopics.length} 条唯一话题`);

    return sortedTopics;
  }

  /**
   * 话题去重
   */
  deduplicateTopics(topics) {
    const seenTitles = new Set();
    const uniqueTopics = [];

    for (const topic of topics) {
      const normalizedTitle = this.normalizeTitle(topic.title);
      
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueTopics.push(topic);
      }
    }

    return uniqueTopics;
  }

  /**
   * 标准化标题用于去重
   */
  normalizeTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 从文本中提取关键词
   */
  extractKeywordsFromText(text) {
    if (!text) return [];
    
    // 简单的关键词提取（实际应用中可以使用更复杂的NLP技术）
    const words = text
      .toLowerCase()
      .split(/[\s\-_,.!?;:()[\]{}"'<>]+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'too', 'use', '这些', '他们', '这个', '那个', '什么', '如何', '为什么']);
    
    // 统计词频
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // 返回频率最高的前5个词
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * 映射分类
   */
  mapCategory(category) {
    const categoryMap = {
      'technology': '科技',
      'business': '商业',
      'science': '科学',
      'entertainment': '娱乐',
      'sports': '体育',
      'health': '健康'
    };
    
    return categoryMap[category] || '其他';
  }

  /**
   * 获取数据源状态
   */
  getDataSourceStatus() {
    const status = {};
    
    Object.entries(this.dataSources).forEach(([type, sources]) => {
      status[type] = sources.map(source => ({
        id: source.id,
        name: source.name,
        enabled: source.enabled,
        type: source.type || type,
        hasApiKey: !!source.apiKey
      }));
    });
    
    return status;
  }

  /**
   * 启用/禁用数据源
   */
  toggleDataSource(sourceId, enabled) {
    Object.values(this.dataSources).forEach(sources => {
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        source.enabled = enabled;
        logger.info(`[ExtendedDataSource] ${enabled ? '启用' : '禁用'}数据源: ${source.name}`);
      }
    });
  }
}

module.exports = new ExtendedDataSourceService();