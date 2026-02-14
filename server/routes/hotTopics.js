const express = require('express');
const { z } = require('zod');
const HotTopic = require('../models/HotTopic');
const hotTopicService = require('../services/hotTopicService');
const { logger } = require('../utils/logger');

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

module.exports = router;
