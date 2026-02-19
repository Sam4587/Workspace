const express = require('express');
const { z } = require('zod');
const HotTopic = require('../models/HotTopic');
const hotTopicService = require('../services/hotTopicService');
const logger = require('../utils/logger');
const rssService = require('../services/rssService');
const TrendAnalysisService = require('../services/trendAnalysisService');
const CrossPlatformAnalysisService = require('../services/crossPlatformAnalysisService');
const HotTopicReportService = require('../services/hotTopicReportService');
const PerformanceOptimizationService = require('../services/performanceOptimizationService');
const ExtendedDataSourceService = require('../services/extendedDataSourceService');
const keywordMatcher = require('../services/keywordMatcher');
const notificationService = require('../services/notificationService');
const aiProviderService = require('../services/aiProviderService');
const promptManagementService = require('../services/promptManagementService');
const { newsNowFetcher, NEWSNOW_SOURCE_MAP } = require('../fetchers/NewsNowFetcher');

const router = express.Router();

const validSortBy = ['heat', 'createdAt', 'publishedAt', 'suitability'];
const validSortOrder = ['asc', 'desc'];
// 统一使用英文分类值，与 types.js 和前端保持一致
const validCategories = ['all', 'entertainment', 'tech', 'finance', 'sports', 'social', 'international', 'other'];

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  category: z.enum(validCategories).default('all'),
  search: z.string().max(100).default(''),
  minHeat: z.coerce.number().min(0).max(100).default(0),
  maxHeat: z.coerce.number().min(0).max(100).default(100),
  sortBy: z.enum(validSortBy).default('heat'),
  sortOrder: z.enum(validSortOrder).default('desc')
});

router.get('/', async (req, res) => {
  try {
    const validated = querySchema.parse(req.query);

    const { page, limit, category, search, minHeat, maxHeat, sortBy, sortOrder } = validated;

    const filter = {};

    if (category !== 'all') {
      filter.category = category;
    }

    if (search.trim()) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { keywords: { $in: [new RegExp(escapedSearch, 'i')] } }
      ];
    }

    if (minHeat > 0 || maxHeat < 100) {
      filter.heat = { $gte: minHeat, $lte: maxHeat };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [topics, total] = await Promise.all([
      HotTopic.find(filter)
        .sort(sortOptions)
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      HotTopic.countDocuments(filter)
    ]);

    logger.info(`获取热点话题列表: 页码 ${page}, 返回 ${topics.length} 条`);

    res.json({
      success: true,
      data: topics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('热点话题查询参数验证失败', { errors: error.errors });
      return res.status(400).json({
        success: false,
        message: '请求参数错误',
        errors: error.errors
      });
    }

    logger.error('获取热点话题失败', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: '获取热点话题失败'
    });
  }
});

// =====================================================
// NewsNow 数据源 API (必须在 /:id 之前定义)
// =====================================================

/**
 * 获取 NewsNow 支持的数据源列表
 */
router.get('/newsnow/sources', async (req, res) => {
  try {
    const sources = newsNowFetcher.getSupportedSources();

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    logger.error('获取数据源列表失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取数据源列表失败'
    });
  }
});

/**
 * 从 NewsNow 获取热点数据
 */
router.post('/newsnow/fetch', async (req, res) => {
  try {
    const { sources, maxItems = 20 } = req.body;

    // 如果指定了数据源，创建新的 fetcher 实例
    let fetcher = newsNowFetcher;
    if (sources && Array.isArray(sources) && sources.length > 0) {
      const { NewsNowFetcher } = require('../fetchers/NewsNowFetcher');
      fetcher = new NewsNowFetcher({ sourceIds: sources, maxItems });
    }

    const topics = await fetcher.fetch();

    // 保存到数据库（如果连接了 MongoDB）
    const savedTopics = [];
    try {
      for (const topic of topics) {
        try {
          const saved = await HotTopic.findOneAndUpdate(
            { title: topic.title, source: topic.source },
            { ...topic, updatedAt: new Date() },
            { upsert: true, new: true }
          );
          savedTopics.push(saved);
        } catch (saveError) {
          logger.debug(`保存话题失败: ${topic.title}`, { error: saveError.message });
        }
      }
    } catch (dbError) {
      logger.warn('数据库保存失败，跳过保存', { error: dbError.message });
    }

    res.json({
      success: true,
      data: {
        fetched: topics.length,
        saved: savedTopics.length,
        topics: savedTopics.length > 0 ? savedTopics : topics
      }
    });
  } catch (error) {
    logger.error('获取 NewsNow 数据失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 NewsNow 数据失败'
    });
  }
});

/**
 * 从指定数据源获取热点（快捷接口）
 */
router.get('/newsnow/fetch/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { maxItems = 20 } = req.query;

    // 验证数据源
    if (!NEWSNOW_SOURCE_MAP[sourceId]) {
      return res.status(400).json({
        success: false,
        message: `不支持的数据源: ${sourceId}`,
        availableSources: Object.keys(NEWSNOW_SOURCE_MAP)
      });
    }

    const { NewsNowFetcher } = require('../fetchers/NewsNowFetcher');
    const fetcher = new NewsNowFetcher({ sourceId, maxItems: parseInt(maxItems) });

    const topics = await fetcher.fetchSource(sourceId);

    res.json({
      success: true,
      data: {
        source: sourceId,
        sourceName: NEWSNOW_SOURCE_MAP[sourceId].name,
        count: topics.length,
        topics
      }
    });
  } catch (error) {
    logger.error('获取数据源热点失败', {
      error: error.message,
      sourceId: req.params.sourceId
    });
    res.status(500).json({
      success: false,
      message: '获取数据源热点失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn('无效的话题 ID 格式', { id });
      return res.status(400).json({
        success: false,
        message: '无效的话题 ID 格式'
      });
    }

    const topic = await HotTopic.findById(id).lean();

    if (!topic) {
      logger.info('热点话题不存在', { id });
      return res.status(404).json({
        success: false,
        message: '热点话题不存在'
      });
    }

    res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    logger.error('获取热点话题详情失败', {
      error: error.message,
      id: req.params.id
    });
    res.status(500).json({
      success: false,
      message: '获取热点话题详情失败'
    });
  }
});

router.post('/update', async (req, res) => {
  try {
    logger.info('收到手动更新热点数据请求');

    const topics = await hotTopicService.updateHotTopics();

    res.json({
      success: true,
      message: '热点数据更新成功',
      data: {
        count: topics.length,
        topics: topics.slice(0, 20)
      }
    });
  } catch (error) {
    logger.error('更新热点数据失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '更新热点数据失败'
    });
  }
});

router.post('/invalidate-cache', async (req, res) => {
  try {
    const { source } = req.body;

    hotTopicService.invalidateCache(source);

    res.json({
      success: true,
      message: source ? `${source} 缓存已清除` : '所有缓存已清除'
    });
  } catch (error) {
    logger.error('清除缓存失败', {
      error: error.message,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: '清除缓存失败'
    });
  }
});

router.get('/stats/categories', async (req, res) => {
  try {
    const cacheKey = 'category-stats';
    const cached = hotTopicService.cache.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    const stats = await HotTopic.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgHeat: { $avg: '$heat' },
          maxHeat: { $max: '$heat' },
          minHeat: { $min: '$heat' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    hotTopicService.cache.set(cacheKey, stats, 600);

    res.json({
      success: true,
      data: stats,
      cached: false
    });
  } catch (error) {
    logger.error('获取分类统计失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

router.get('/stats/trends', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = Math.min(Math.max(parseInt(days) || 7, 1), 30);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const stats = await HotTopic.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          avgHeat: { $avg: '$heat' },
          sources: { $push: '$source' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
      },
      {
        $limit: 30
      }
    ]);

    res.json({
      success: true,
      data: stats.map(stat => ({
        date: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}-${String(stat._id.day).padStart(2, '0')}`,
        count: stat.count,
        avgHeat: Math.round(stat.avgHeat || 0),
        sources: [...new Set(stat.sources)]
      }))
    });
  } catch (error) {
    logger.error('获取趋势统计失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取趋势统计失败'
    });
  }
});

router.get('/stats/trends', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = Math.min(Math.max(parseInt(days) || 7, 1), 30);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const stats = await HotTopic.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          avgHeat: { $avg: '$heat' },
          sources: { $push: '$source' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
      },
      {
        $limit: 30
      }
    ]);

    res.json({
      success: true,
      data: stats.map(stat => ({
        date: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}-${String(stat._id.day).padStart(2, '0')}`,
        count: stat.count,
        avgHeat: Math.round(stat.avgHeat || 0),
        sources: [...new Set(stat.sources)]
      }))
    });
  } catch (error) {
    logger.error('获取趋势统计失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取趋势统计失败'
    });
  }
});

router.get('/trends/new', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const hoursNum = Math.min(Math.max(parseInt(hours) || 24, 1), 168);

    const newTopics = await TrendAnalysisService.getNewTopics(hoursNum);

    res.json({
      success: true,
      data: newTopics
    });
  } catch (error) {
    logger.error('获取新增热点失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取新增热点失败'
    });
  }
});

// 热点趋势分析
router.get('/trends/analysis', async (req, res) => {
  try {
    const { 
      timeWindow = '24h', 
      minSamples = 3,
      includePrediction = true 
    } = req.query;

    // 获取最近的热点数据
    const recentTopics = await HotTopic.find({
      publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ publishedAt: -1 }).limit(100);

    if (recentTopics.length === 0) {
      return res.json({
        success: true,
        data: {
          message: '暂无足够的热点数据进行趋势分析',
          trendData: null
        }
      });
    }

    const trendData = await TrendAnalysisService.analyzeTrends(recentTopics, {
      timeWindow,
      minSamples: parseInt(minSamples),
      includePrediction: includePrediction === 'true'
    });

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    logger.error('热点趋势分析失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '热点趋势分析失败'
    });
  }
});

// 获取热点爆发点
router.get('/trends/hotspots', async (req, res) => {
  try {
    const { hours = 24, limit = 10 } = req.query;
    
    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
    
    const topics = await HotTopic.find({
      publishedAt: { $gte: since }
    }).sort({ heat: -1, publishedAt: -1 }).limit(parseInt(limit));

    const hotSpots = topics.map(topic => ({
      id: topic._id,
      title: topic.title,
      heat: topic.heat,
      source: topic.source,
      category: topic.category,
      publishedAt: topic.publishedAt,
      intensity: Math.max(0, (topic.heat - 70) / 30) // 相对于70热度基准的强度
    }));

    res.json({
      success: true,
      data: hotSpots
    });
  } catch (error) {
    logger.error('获取热点爆发点失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取热点爆发点失败'
    });
  }
});

// 跨平台热点对比分析
router.get('/analysis/cross-platform', async (req, res) => {
  try {
    const { 
      platforms = 'weibo,toutiao,zhihu',
      similarityThreshold = 0.6,
      includeSpreadAnalysis = true
    } = req.query;

    const platformList = platforms.split(',').map(p => p.trim());
    
    // 获取指定平台的热点数据
    const topics = await HotTopic.find({
      source: { $in: platformList },
      publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ publishedAt: -1 }).limit(100);

    if (topics.length === 0) {
      return res.json({
        success: true,
        data: {
          message: '指定平台暂无热点数据',
          analysis: null
        }
      });
    }

    const analysis = await CrossPlatformAnalysisService.analyzeCrossPlatform(topics, {
      platforms: platformList,
      similarityThreshold: parseFloat(similarityThreshold),
      includeSpreadAnalysis: includeSpreadAnalysis === 'true'
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('跨平台热点分析失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '跨平台热点分析失败'
    });
  }
});

// 热点传播路径分析
router.get('/analysis/spread-path/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const { days = 7 } = req.query;
    
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    // 模糊匹配相似标题
    const topics = await HotTopic.find({
      title: { $regex: title, $options: 'i' },
      publishedAt: { $gte: since }
    }).sort({ publishedAt: 1 });

    if (topics.length === 0) {
      return res.json({
        success: true,
        data: {
          message: '未找到相关传播路径',
          path: []
        }
      });
    }

    // 构建传播路径
    const spreadPath = topics.map((topic, index) => ({
      step: index + 1,
      platform: topic.source,
      title: topic.title,
      heat: topic.heat,
      publishedAt: topic.publishedAt,
      timeDiff: index > 0 ? 
        new Date(topic.publishedAt) - new Date(topics[index - 1].publishedAt) : 0
    }));

    res.json({
      success: true,
      data: {
        queryTitle: title,
        path: spreadPath,
        totalTime: spreadPath.length > 1 ? 
          new Date(spreadPath[spreadPath.length - 1].publishedAt) - 
          new Date(spreadPath[0].publishedAt) : 0,
        platformCount: new Set(spreadPath.map(p => p.platform)).size
      }
    });
  } catch (error) {
    logger.error('热点传播路径分析失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '热点传播路径分析失败'
    });
  }
});

// 热点报告生成
router.get('/reports/daily', async (req, res) => {
  try {
    const { 
      date = new Date().toISOString(),
      platforms = 'weibo,toutiao,zhihu',
      topN = 20,
      includeAnalysis = true,
      format = 'html'
    } = req.query;

    const platformList = platforms.split(',').map(p => p.trim());
    
    const report = await HotTopicReportService.generateDailyReport({
      date: new Date(date),
      platforms: platformList,
      topN: parseInt(topN),
      includeAnalysis: includeAnalysis === 'true',
      format
    });

    if (format === 'json') {
      res.json({
        success: true,
        data: report.content
      });
    } else {
      res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/markdown');
      res.send(report.content);
    }
  } catch (error) {
    logger.error('生成日报失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '生成日报失败: ' + error.message
    });
  }
});

router.get('/reports/weekly', async (req, res) => {
  try {
    const { 
      date = new Date().toISOString(),
      platforms = 'weibo,toutiao,zhihu',
      topN = 50,
      includeAnalysis = true,
      format = 'html'
    } = req.query;

    const platformList = platforms.split(',').map(p => p.trim());
    
    const report = await HotTopicReportService.generateWeeklyReport({
      date: new Date(date),
      platforms: platformList,
      topN: parseInt(topN),
      includeAnalysis: includeAnalysis === 'true',
      format
    });

    if (format === 'json') {
      res.json({
        success: true,
        data: report.content
      });
    } else {
      res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/markdown');
      res.send(report.content);
    }
  } catch (error) {
    logger.error('生成周报失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '生成周报失败: ' + error.message
    });
  }
});

router.get('/reports/monthly', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      platforms = 'weibo,toutiao,zhihu',
      topN = 100,
      includeAnalysis = true,
      format = 'html'
    } = req.query;

    const platformList = platforms.split(',').map(p => p.trim());
    
    const report = await HotTopicReportService.generateMonthlyReport({
      year: parseInt(year),
      month: parseInt(month),
      platforms: platformList,
      topN: parseInt(topN),
      includeAnalysis: includeAnalysis === 'true',
      format
    });

    if (format === 'json') {
      res.json({
        success: true,
        data: report.content
      });
    } else {
      res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/markdown');
      res.send(report.content);
    }
  } catch (error) {
    logger.error('生成月报失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '生成月报失败: ' + error.message
    });
  }
});

// 报告推送功能
router.post('/reports/push', async (req, res) => {
  try {
    const { 
      type = 'daily',
      channels = ['email'],
      recipients = [],
      customMessage = ''
    } = req.body;

    // 生成报告
    let report;
    switch (type) {
      case 'daily':
        report = await HotTopicReportService.generateDailyReport();
        break;
      case 'weekly':
        report = await HotTopicReportService.generateWeeklyReport();
        break;
      case 'monthly':
        report = await HotTopicReportService.generateMonthlyReport();
        break;
      default:
        throw new Error('不支持的报告类型');
    }

    // 推送报告
    const pushResults = [];
    for (const channel of channels) {
      try {
        let result;
        switch (channel) {
          case 'email':
            result = await notificationService.sendEmail({
              to: recipients,
              subject: `热点${type === 'daily' ? '日报' : type === 'weekly' ? '周报' : '月报'}`,
              html: report.content
            });
            break;
          case 'dingtalk':
            result = await notificationService.sendDingTalkMessage({
              content: `热点${type}报告已生成，请查收。${customMessage}`
            });
            break;
          case 'wechat':
            result = await notificationService.sendWeChatMessage({
              content: `热点${type}报告已生成，请查收。${customMessage}`
            });
            break;
          default:
            result = { success: false, message: `不支持的推送渠道: ${channel}` };
        }
        pushResults.push({ channel, result });
      } catch (error) {
        pushResults.push({ channel, result: { success: false, message: error.message } });
      }
    }

    res.json({
      success: true,
      data: {
        reportGenerated: true,
        pushResults,
        reportType: type
      }
    });
  } catch (error) {
    logger.error('报告推送失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '报告推送失败: ' + error.message
    });
  }
});

// 性能监控和缓存管理
router.get('/performance/metrics', async (req, res) => {
  try {
    const metrics = PerformanceOptimizationService.getPerformanceMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('获取性能指标失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取性能指标失败'
    });
  }
});

router.get('/performance/cache-stats', async (req, res) => {
  try {
    const cacheStats = PerformanceOptimizationService.getCacheStats();
    
    res.json({
      success: true,
      data: cacheStats
    });
  } catch (error) {
    logger.error('获取缓存统计失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取缓存统计失败'
    });
  }
});

router.post('/performance/cleanup', async (req, res) => {
  try {
    const cleanedCount = PerformanceOptimizationService.cleanupExpired();
    const memoryOptimized = PerformanceOptimizationService.optimizeMemory();
    
    res.json({
      success: true,
      data: {
        cleanedItems: cleanedCount,
        memoryOptimized,
        message: `清理完成，优化了 ${cleanedCount} 个缓存项` + 
                (memoryOptimized ? '，执行了内存优化' : '')
      }
    });
  } catch (error) {
    logger.error('执行清理失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '执行清理失败'
    });
  }
});

router.post('/performance/warmup', async (req, res) => {
  try {
    const { patterns } = req.body;
    
    await PerformanceOptimizationService.warmUpCache(patterns);
    
    res.json({
      success: true,
      message: '缓存预热完成'
    });
  } catch (error) {
    logger.error('缓存预热失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '缓存预热失败'
    });
  }
});

router.post('/performance/flush-all', async (req, res) => {
  try {
    PerformanceOptimizationService.flushAll();
    
    res.json({
      success: true,
      message: '所有缓存已清空'
    });
  } catch (error) {
    logger.error('清空缓存失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '清空缓存失败'
    });
  }
});

// 扩展数据源管理
router.get('/sources/extended', async (req, res) => {
  try {
    const status = ExtendedDataSourceService.getDataSourceStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('获取扩展数据源状态失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取扩展数据源状态失败'
    });
  }
});

router.post('/sources/extended/toggle', async (req, res) => {
  try {
    const { sourceId, enabled } = req.body;
    
    ExtendedDataSourceService.toggleDataSource(sourceId, enabled);
    
    res.json({
      success: true,
      message: `${enabled ? '启用' : '禁用'}数据源成功`
    });
  } catch (error) {
    logger.error('切换数据源状态失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '切换数据源状态失败'
    });
  }
});

router.get('/sources/extended/fetch', async (req, res) => {
  try {
    const topics = await ExtendedDataSourceService.fetchAllSources();
    
    res.json({
      success: true,
      data: {
        count: topics.length,
        topics: topics.slice(0, 50)
      }
    });
  } catch (error) {
    logger.error('获取扩展数据源内容失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取扩展数据源内容失败'
    });
  }
});

router.get('/sources/extended/:sourceType/:sourceId', async (req, res) => {
  try {
    const { sourceType, sourceId } = req.params;
    const { ...options } = req.query;
    
    const sources = ExtendedDataSourceService.dataSources[sourceType] || [];
    const source = sources.find(s => s.id === sourceId);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        message: '数据源不存在'
      });
    }
    
    let topics = [];
    switch (sourceType) {
      case 'rss':
        topics = await ExtendedDataSourceService.fetchFromRSS(source);
        break;
      case 'newsApi':
        topics = await ExtendedDataSourceService.fetchFromNewsAPI(source, options);
        break;
      case 'techPlatforms':
        topics = await ExtendedDataSourceService.fetchFromTechPlatform(source);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的数据源类型'
        });
    }
    
    res.json({
      success: true,
      data: {
        source: source.name,
        count: topics.length,
        topics
      }
    });
  } catch (error) {
    logger.error('获取特定数据源内容失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取特定数据源内容失败'
    });
  }
});
router.get('/optimized', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category = 'all',
      search = '',
      sortBy = 'heat',
      sortOrder = 'desc'
    } = req.query;

    const cacheKey = `hot-topics-${page}-${limit}-${category}-${search}-${sortBy}-${sortOrder}`;

    const topics = await PerformanceOptimizationService.withCache(
      cacheKey,
      async () => {
        let query = {};
        
        if (category !== 'all') {
          query.category = category;
        }
        
        if (search.trim()) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }
        
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        return await HotTopic.find(query)
          .sort(sortObj)
          .skip((parseInt(page) - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean();
      },
      {
        cacheLevel: 'warm',
        ttl: 300 // 5分钟缓存
      }
    );

    const total = await PerformanceOptimizationService.withCache(
      `hot-topics-count-${category}-${search}`,
      async () => {
        let query = {};
        if (category !== 'all') query.category = category;
        if (search.trim()) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }
        return await HotTopic.countDocuments(query);
      },
      {
        cacheLevel: 'warm',
        ttl: 300
      }
    );

    res.json({
      success: true,
      data: topics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('获取优化热点失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取优化热点失败'
    });
  }
});
router.get('/reports/history', async (req, res) => {
  try {
    const { type = 'daily', limit = 10 } = req.query;
    
    // 这里应该从数据库或文件系统获取历史报告记录
    // 暂时返回模拟数据
    const history = [
      {
        id: '1',
        type: 'daily',
        date: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        status: 'completed'
      }
    ];

    res.json({
      success: true,
      data: history.slice(0, parseInt(limit))
    });
  } catch (error) {
    logger.error('获取报告历史失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取报告历史失败'
    });
  }
});
router.get('/analysis/platform-influence', async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;
    
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const topics = await HotTopic.find({
      publishedAt: { $gte: since }
    }).sort({ heat: -1, publishedAt: -1 }).limit(parseInt(limit) * 5); // 获取更多数据用于分析

    if (topics.length === 0) {
      return res.json({
        success: true,
        data: {
          message: '暂无数据进行平台影响力分析',
          influence: {}
        }
      });
    }

    // 按平台分组统计
    const platformInfluence = {};
    topics.forEach(topic => {
      const source = topic.source || 'unknown';
      if (!platformInfluence[source]) {
        platformInfluence[source] = {
          topicCount: 0,
          totalHeat: 0,
          avgHeat: 0,
          maxHeat: 0,
          viralCount: 0, // 病毒式传播数量(热度>90)
          recentCount: 0 // 近期热点数量
        };
      }
      
      const influence = platformInfluence[source];
      influence.topicCount++;
      influence.totalHeat += topic.heat || 0;
      influence.maxHeat = Math.max(influence.maxHeat, topic.heat || 0);
      
      if ((topic.heat || 0) >= 90) influence.viralCount++;
      if (new Date(topic.publishedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        influence.recentCount++;
      }
    });

    // 计算平均值和综合得分
    Object.entries(platformInfluence).forEach(([source, stats]) => {
      stats.avgHeat = stats.totalHeat / stats.topicCount;
      // 综合影响力得分 (热度权重0.4 + 病毒传播权重0.3 + 近期活跃权重0.3)
      stats.influenceScore = 
        (stats.avgHeat / 100 * 0.4) + 
        (stats.viralCount / stats.topicCount * 0.3) + 
        (stats.recentCount / stats.topicCount * 0.3);
    });

    // 排序并返回前N个平台
    const sortedPlatforms = Object.entries(platformInfluence)
      .sort(([,a], [,b]) => b.influenceScore - a.influenceScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        platforms: sortedPlatforms.map(([source, stats]) => ({
          source,
          ...stats,
          influenceScore: parseFloat(stats.influenceScore.toFixed(3))
        })),
        period: `${days}天`
      }
    });
  } catch (error) {
    logger.error('平台影响力分析失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '平台影响力分析失败'
    });
  }
});
router.get('/trends/correlation', async (req, res) => {
  try {
    const { category, source, days = 7 } = req.query;
    
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const query = { publishedAt: { $gte: since } };
    if (category && category !== 'all') query.category = category;
    if (source && source !== 'all') query.source = source;
    
    const topics = await HotTopic.find(query)
      .sort({ publishedAt: -1 })
      .limit(50);

    if (topics.length === 0) {
      return res.json({
        success: true,
        data: {
          correlation: 0,
          sampleSize: 0,
          message: '无足够数据进行相关性分析'
        }
      });
    }

    // 计算不同维度的相关性
    const correlationData = {
      byTime: calculateTimeCorrelation(topics),
      bySource: await calculateSourceCorrelation(topics),
      byCategory: calculateCategoryCorrelation(topics),
      sampleSize: topics.length
    };

    res.json({
      success: true,
      data: correlationData
    });
  } catch (error) {
    logger.error('热点相关性分析失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '热点相关性分析失败'
    });
  }
});
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;
    const daysNum = Math.min(Math.max(parseInt(days) || 7, 1), 30);

    const topic = await HotTopic.findById(id);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '热点话题不存在'
      });
    }

    const trend = await TrendAnalysisService.getTopicTrend(id, daysNum);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    logger.error('获取热点趋势失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取热点趋势失败'
    });
  }
});

router.get('/rss/feeds', async (req, res) => {
  try {
    const stats = await rssService.getRSSStats([
      { name: '示例科技', url: 'https://example.com/rss', category: '科技', enabled: true }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取 RSS 源状态失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 RSS 源状态失败'
    });
  }
});

router.post('/rss/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    const { keywords = [] } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少 RSS 源 URL'
      });
    }

    const items = await rssService.fetchRSSFeed(url);
    const filtered = keywords.length > 0
      ? rssService.filterItemsByKeywords(items, keywords)
      : items;

    res.json({
      success: true,
      data: filtered
    });
  } catch (error) {
    logger.error('获取 RSS 内容失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 RSS 内容失败'
    });
  }
});

router.get('/notifications/channels', async (req, res) => {
  try {
    const status = notificationService.getChannelStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('获取推送渠道状态失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取推送渠道状态失败'
    });
  }
});

router.post('/notifications/send', async (req, res) => {
  try {
    const { topics, channels = ['wework'] } = req.body;

    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少推送内容'
      });
    }

    const message = notificationService.formatMessage(topics);
    const result = await notificationService.sendToChannels(message, channels);

    res.json({
      success: result.success,
      data: result.results
    });
  } catch (error) {
    logger.error('发送通知失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '发送通知失败'
    });
  }
});

router.post('/notifications/test', async (req, res) => {
  try {
    const { channel } = req.body;

    if (!channel) {
      return res.status(400).json({
        success: false,
        message: '缺少渠道参数'
      });
    }

    const result = await notificationService.testNotification(channel);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('测试通知失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '测试通知失败'
    });
  }
});

router.post('/ai/analyze', async (req, res) => {
  try {
    const { topics, options = {}, provider } = req.body;

    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少分析话题'
      });
    }

    const analysis = await aiProviderService.analyzeTopics(topics, { ...options, provider });

    if (!analysis) {
      return res.status(500).json({
        success: false,
        message: 'AI 分析失败'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('AI 分析失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'AI 分析失败'
    });
  }
});

router.post('/ai/briefing', async (req, res) => {
  try {
    const { topics, maxLength = 300, focus = 'important', provider } = req.body;

    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少生成简报话题'
      });
    }

    const brief = await aiProviderService.generateBrief(topics, { maxLength, focus, provider });

    res.json({
      success: true,
      data: { brief }
    });
  } catch (error) {
    logger.error('生成简报失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '生成简报失败'
    });
  }
});

router.get('/ai/health', async (req, res) => {
  try {
    const { provider } = req.query;
    const health = await aiProviderService.checkServiceHealth(provider);

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('AI 健康检查失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'AI 健康检查失败'
    });
  }
});

router.get('/ai/providers', async (req, res) => {
  try {
    const providers = aiProviderService.getProviderList();

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    logger.error('获取 AI 提供商列表失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 AI 提供商列表失败'
    });
  }
});

router.post('/ai/providers/default', async (req, res) => {
  try {
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: '缺少提供商 ID'
      });
    }

    aiProviderService.setDefaultProvider(providerId);

    res.json({
      success: true,
      message: '默认提供商已更新'
    });
  } catch (error) {
    logger.error('设置默认提供商失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message || '设置默认提供商失败'
    });
  }
});

router.post('/ai/translate', async (req, res) => {
  try {
    const { content, targetLanguage = 'English', provider } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '缺少待翻译内容'
      });
    }

    const translated = await aiProviderService.translateMessage(content, targetLanguage, provider);

    res.json({
      success: true,
      data: {
        original: content,
        translated,
        targetLanguage
      }
    });
  } catch (error) {
    logger.error('AI 翻译失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'AI 翻译失败'
    });
  }
});

router.get('/keywords/validate', async (req, res) => {
  try {
    const { keywords } = req.body;

    if (!keywords) {
      return res.status(400).json({
        success: false,
        message: '缺少关键词配置'
      });
    }

    const parsed = keywordMatcher.parseKeywordConfig(keywords);
    const validation = keywordMatcher.validateKeywordConfig(parsed);

    res.json({
      success: validation.valid,
      data: validation,
      parsed: parsed
    });
  } catch (error) {
    logger.error('关键词验证失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '关键词验证失败'
    });
  }
});

router.get('/trends/cross-platform/:title', async (req, res) => {
  try {
    const { title } = req.params;

    const analysis = await TrendAnalysisService.getCrossPlatformAnalysis(title);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('获取跨平台分析失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取跨平台分析失败'
    });
  }
});

router.post('/trends/snapshot', async (req, res) => {
  try {
    const { topics } = req.body;

    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少快照话题'
      });
    }

    const records = await TrendAnalysisService.recordTopicSnapshot(topics);

    res.json({
      success: true,
      data: {
        count: records.length,
        records
      }
    });
  } catch (error) {
    logger.error('记录趋势快照失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '记录趋势快照失败'
    });
  }
});

// Prompt 模板管理 API
router.get('/prompts/templates', async (req, res) => {
  try {
    const { category, isActive, isSystem, tags, language, search } = req.query;

    await promptManagementService.initialize();

    const templates = await promptManagementService.listTemplates({
      category,
      isActive: isActive !== 'false',
      isSystem: isSystem === 'true',
      tags: tags ? tags.split(',') : undefined,
      language,
      search
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('获取 Prompt 模板列表失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 Prompt 模板列表失败'
    });
  }
});

router.get('/prompts/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await promptManagementService.initialize();

    const template = await promptManagementService.getTemplate(id);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('获取 Prompt 模板失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(error.message.includes('不存在') ? 404 : 500).json({
      success: false,
      message: error.message || '获取 Prompt 模板失败'
    });
  }
});

router.post('/prompts/templates', async (req, res) => {
  try {
    await promptManagementService.initialize();

    const template = await promptManagementService.createTemplate(req.body);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('创建 Prompt 模板失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message || '创建 Prompt 模板失败'
    });
  }
});

router.put('/prompts/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await promptManagementService.initialize();

    const template = await promptManagementService.updateTemplate(id, req.body);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('更新 Prompt 模板失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(error.message.includes('不允许') ? 403 : error.message.includes('不存在') ? 404 : 500).json({
      success: false,
      message: error.message || '更新 Prompt 模板失败'
    });
  }
});

router.delete('/prompts/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await promptManagementService.initialize();

    await promptManagementService.deleteTemplate(id);

    res.json({
      success: true,
      message: '模板已删除'
    });
  } catch (error) {
    logger.error('删除 Prompt 模板失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(error.message.includes('不允许') ? 403 : error.message.includes('不存在') ? 404 : 500).json({
      success: false,
      message: error.message || '删除 Prompt 模板失败'
    });
  }
});

router.post('/prompts/templates/:id/render', async (req, res) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    await promptManagementService.initialize();

    const rendered = await promptManagementService.renderTemplate(id, variables);

    res.json({
      success: true,
      data: {
        templateId: id,
        rendered
      }
    });
  } catch (error) {
    logger.error('渲染 Prompt 模板失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message || '渲染 Prompt 模板失败'
    });
  }
});

router.get('/prompts/templates/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    await promptManagementService.initialize();

    const history = await promptManagementService.getUsageHistory(id, parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('获取 Prompt 使用历史失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 Prompt 使用历史失败'
    });
  }
});

router.get('/prompts/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    await promptManagementService.initialize();

    const stats = await promptManagementService.getUsageStats(parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取 Prompt 使用统计失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 Prompt 使用统计失败'
    });
  }
});

router.get('/prompts/tags', async (req, res) => {
  try {
    await promptManagementService.initialize();

    const tags = await promptManagementService.getTags();

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    logger.error('获取 Prompt 标签列表失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 Prompt 标签列表失败'
    });
  }
});

router.get('/prompts/categories', async (req, res) => {
  try {
    await promptManagementService.initialize();

    const categories = await promptManagementService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('获取 Prompt 分类列表失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 Prompt 分类列表失败'
    });
  }
});

// =====================================================
// NewsNow 数据源 API
// =====================================================

/**
 * 获取 NewsNow 支持的数据源列表
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = newsNowFetcher.getSupportedSources();

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    logger.error('获取数据源列表失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取数据源列表失败'
    });
  }
});

/**
 * 从 NewsNow 获取热点数据
 */
router.post('/fetch', async (req, res) => {
  try {
    const { sources, maxItems = 20 } = req.body;

    // 如果指定了数据源，创建新的 fetcher 实例
    let fetcher = newsNowFetcher;
    if (sources && Array.isArray(sources) && sources.length > 0) {
      const { NewsNowFetcher } = require('../fetchers/NewsNowFetcher');
      fetcher = new NewsNowFetcher({ sourceIds: sources, maxItems });
    }

    const topics = await fetcher.fetch();

    // 保存到数据库
    const savedTopics = [];
    for (const topic of topics) {
      try {
        const saved = await HotTopic.findOneAndUpdate(
          { title: topic.title, source: topic.source },
          { ...topic, updatedAt: new Date() },
          { upsert: true, new: true }
        );
        savedTopics.push(saved);
      } catch (saveError) {
        logger.debug(`保存话题失败: ${topic.title}`, { error: saveError.message });
      }
    }

    res.json({
      success: true,
      data: {
        fetched: topics.length,
        saved: savedTopics.length,
        topics: savedTopics
      }
    });
  } catch (error) {
    logger.error('获取 NewsNow 数据失败', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取 NewsNow 数据失败'
    });
  }
});

/**
 * 从指定数据源获取热点（快捷接口）
 */
router.get('/fetch/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { maxItems = 20 } = req.query;

    // 验证数据源
    if (!NEWSNOW_SOURCE_MAP[sourceId]) {
      return res.status(400).json({
        success: false,
        message: `不支持的数据源: ${sourceId}`,
        availableSources: Object.keys(NEWSNOW_SOURCE_MAP)
      });
    }

    const { NewsNowFetcher } = require('../fetchers/NewsNowFetcher');
    const fetcher = new NewsNowFetcher({ sourceId, maxItems: parseInt(maxItems) });

    const topics = await fetcher.fetchSource(sourceId);

    res.json({
      success: true,
      data: {
        source: sourceId,
        sourceName: NEWSNOW_SOURCE_MAP[sourceId].name,
        count: topics.length,
        topics
      }
    });
  } catch (error) {
    logger.error('获取数据源热点失败', {
      error: error.message,
      sourceId: req.params.sourceId
    });
    res.status(500).json({
      success: false,
      message: '获取数据源热点失败'
    });
  }
});

// 辅助函数：计算时间相关性
function calculateTimeCorrelation(topics) {
  if (topics.length < 2) return { correlation: 0, pattern: 'insufficient_data' };
  
  // 按小时分组
  const hourlyData = {};
  topics.forEach(topic => {
    const hour = new Date(topic.publishedAt).getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { count: 0, totalHeat: 0 };
    }
    hourlyData[hour].count++;
    hourlyData[hour].totalHeat += topic.heat || 0;
  });
  
  const hours = Object.keys(hourlyData).map(Number).sort();
  if (hours.length < 2) return { correlation: 0, pattern: 'insufficient_data' };
  
  // 简单的峰值检测
  let peakHour = 0;
  let maxCount = 0;
  hours.forEach(hour => {
    if (hourlyData[hour].count > maxCount) {
      maxCount = hourlyData[hour].count;
      peakHour = hour;
    }
  });
  
  return {
    correlation: maxCount / topics.length,
    peakHour,
    pattern: peakHour >= 8 && peakHour <= 22 ? 'business_hours' : 'off_hours'
  };
}

// 辅助函数：计算来源相关性
async function calculateSourceCorrelation(topics) {
  const sourceCounts = {};
  topics.forEach(topic => {
    const source = topic.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  const total = topics.length;
  const correlations = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: (count / total * 100).toFixed(1),
      dominance: count / Math.max(...Object.values(sourceCounts))
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    distributions: correlations,
    dominantSource: correlations[0]?.source || 'none',
    diversity: Object.keys(sourceCounts).length
  };
}

// 辅助函数：计算分类相关性
function calculateCategoryCorrelation(topics) {
  const categoryCounts = {};
  topics.forEach(topic => {
    const category = topic.category || 'other';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  const total = topics.length;
  const correlations = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: (count / total * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    distributions: correlations,
    dominantCategory: correlations[0]?.category || 'other',
    balanceScore: this.calculateBalanceScore(correlations.map(c => c.count))
  };
}

// 辅助函数：计算平衡分数
function calculateBalanceScore(counts) {
  if (counts.length === 0) return 0;
  if (counts.length === 1) return 1;
  
  const total = counts.reduce((sum, count) => sum + count, 0);
  const proportions = counts.map(count => count / total);
  
  // 计算熵作为多样性指标
  const entropy = -proportions.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);
  const maxEntropy = Math.log(counts.length);
  
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

module.exports = router;
