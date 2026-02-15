/**
 * 内存存储版热点路由
 * 不依赖 MongoDB，使用内存存储热点数据
 */

const express = require('express');
const router = express.Router();

// 导入 NewsNow Fetcher
const { newsNowFetcher, NEWSNOW_SOURCE_MAP } = require('../fetchers/NewsNowFetcher');
const { logger } = require('../utils/logger');

// 内存存储
const memoryStorage = {
  hotTopics: [],
  lastUpdate: null
};

// 更新内存热点数据
async function updateMemoryTopics(topics) {
  memoryStorage.hotTopics = topics.map((topic, index) => ({
    ...topic,
    _id: `mem-${Date.now()}-${index}`,
    createdAt: topic.createdAt || new Date(),
    updatedAt: new Date()
  }));
  memoryStorage.lastUpdate = new Date();
  return memoryStorage.hotTopics;
}

// 获取热点话题列表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category = 'all',
      search = '',
      minHeat = 0,
      maxHeat = 100,
      sortBy = 'heat',
      sortOrder = 'desc'
    } = req.query;

    let topics = [...memoryStorage.hotTopics];

    // 分类过滤
    if (category !== 'all') {
      topics = topics.filter(t => t.category === category);
    }

    // 搜索过滤
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      topics = topics.filter(t =>
        t.title?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }

    // 热度过滤
    topics = topics.filter(t => t.heat >= parseInt(minHeat) && t.heat <= parseInt(maxHeat));

    // 排序
    const sortField = sortBy === 'createdAt' ? 'createdAt' : 'heat';
    topics.sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // 分页
    const total = topics.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const pagedTopics = topics.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: pagedTopics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('获取热点话题失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取热点话题失败'
    });
  }
});

// 获取 NewsNow 支持的数据源列表
router.get('/newsnow/sources', async (req, res) => {
  try {
    const sources = newsNowFetcher.getSupportedSources();

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    logger.error('获取数据源列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取数据源列表失败'
    });
  }
});

// 从 NewsNow 获取热点数据
router.post('/newsnow/fetch', async (req, res) => {
  try {
    const { sources, maxItems = 20 } = req.body;

    // 创建 fetcher 实例
    let fetcher = newsNowFetcher;
    if (sources && Array.isArray(sources) && sources.length > 0) {
      const { NewsNowFetcher } = require('../fetchers/NewsNowFetcher');
      fetcher = new NewsNowFetcher({ sourceIds: sources, maxItems });
    }

    const topics = await fetcher.fetch();

    // 更新内存存储
    await updateMemoryTopics(topics);

    res.json({
      success: true,
      data: {
        fetched: topics.length,
        saved: topics.length,
        topics: topics
      }
    });
  } catch (error) {
    logger.error('获取 NewsNow 数据失败', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: '获取 NewsNow 数据失败: ' + error.message
    });
  }
});

// 从指定数据源获取热点
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
    logger.error('获取数据源热点失败', { error: error.message, sourceId: req.params.sourceId });
    res.status(500).json({
      success: false,
      message: '获取数据源热点失败'
    });
  }
});

// 获取新增热点趋势
router.get('/trends/new', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const hoursNum = Math.min(Math.max(parseInt(hours) || 24, 1), 168);

    const cutoffTime = new Date(Date.now() - hoursNum * 60 * 60 * 1000);
    const newTopics = memoryStorage.hotTopics.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= cutoffTime;
    });

    res.json({
      success: true,
      data: newTopics
    });
  } catch (error) {
    logger.error('获取新增热点失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取新增热点失败'
    });
  }
});

// 获取分类统计
router.get('/stats/categories', async (req, res) => {
  try {
    const categoryStats = {};

    for (const topic of memoryStorage.hotTopics) {
      const cat = topic.category || '其他';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { _id: cat, count: 0, avgHeat: 0, maxHeat: 0, minHeat: 100 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].avgHeat += topic.heat || 0;
      categoryStats[cat].maxHeat = Math.max(categoryStats[cat].maxHeat, topic.heat || 0);
      categoryStats[cat].minHeat = Math.min(categoryStats[cat].minHeat, topic.heat || 100);
    }

    const stats = Object.values(categoryStats).map(s => ({
      ...s,
      avgHeat: Math.round(s.avgHeat / s.count)
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取分类统计失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

// 获取数据源列表（兼容性接口）
router.get('/sources', async (req, res) => {
  try {
    const sources = newsNowFetcher.getSupportedSources();

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    logger.error('获取数据源列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取数据源列表失败'
    });
  }
});

// 手动刷新数据
router.post('/refresh', async (req, res) => {
  try {
    const { newsNowFetcher } = require('../fetchers/NewsNowFetcher');
    const topics = await newsNowFetcher.fetch();

    await updateMemoryTopics(topics);

    res.json({
      success: true,
      message: '热点数据刷新成功',
      data: {
        count: topics.length,
        lastUpdate: memoryStorage.lastUpdate
      }
    });
  } catch (error) {
    logger.error('刷新热点数据失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '刷新热点数据失败'
    });
  }
});

// 获取单个热点详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const topic = memoryStorage.hotTopics.find(t => t._id === id);

    if (!topic) {
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
    logger.error('获取热点详情失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取热点详情失败'
    });
  }
});

// 初始化数据（启动时调用）
async function initializeData() {
  try {
    logger.info('正在初始化热点数据...');
    const topics = await newsNowFetcher.fetch();
    await updateMemoryTopics(topics);
    logger.info(`热点数据初始化完成: ${topics.length} 条`);
  } catch (error) {
    logger.error('热点数据初始化失败', { error: error.message });
  }
}

// 启动时初始化
initializeData();

module.exports = router;
module.exports.memoryStorage = memoryStorage;
module.exports.initializeData = initializeData;
