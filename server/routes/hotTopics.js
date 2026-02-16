const express = require('express');
const { z } = require('zod');
const HotTopic = require('../models/HotTopic');
const hotTopicService = require('../services/hotTopicService');
const logger = require('../utils/logger');
const rssService = require('../services/rssService');
const { TrendAnalysisService } = require('../services/trendAnalysisService');
const keywordMatcher = require('../services/keywordMatcher');
const notificationService = require('../services/notificationService');
const aiProviderService = require('../services/aiProviderService');
const promptManagementService = require('../services/promptManagementService');
const { newsNowFetcher, NEWSNOW_SOURCE_MAP } = require('../fetchers/NewsNowFetcher');

const router = express.Router();

const validSortBy = ['heat', 'createdAt', 'publishedAt', 'suitability'];
const validSortOrder = ['asc', 'desc'];
const validCategories = ['all', '娱乐', '科技', '财经', '体育', '社会', '国际', '其他'];

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

router.get('/trends/timeline/:id', async (req, res) => {
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

module.exports = router;
