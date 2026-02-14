const express = require('express');
const HotTopic = require('../models/HotTopic');
const hotTopicService = require('../services/hotTopicService');

const router = express.Router();

// 获取热点话题列表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category = 'all',
      search = '',
      minHeat = 0,
      maxHeat = 100,
      sortBy = 'heat',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    filter.heat = { $gte: parseInt(minHeat), $lte: parseInt(maxHeat) };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const topics = await HotTopic.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await HotTopic.countDocuments(filter);

    res.json({
      success: true,
      data: topics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取热点话题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点话题失败'
    });
  }
});

// 获取单个热点话题详情
router.get('/:id', async (req, res) => {
  try {
    const topic = await HotTopic.findById(req.params.id);
    
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
    console.error('获取热点话题详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点话题详情失败'
    });
  }
});

// 手动更新热点数据
router.post('/update', async (req, res) => {
  try {
    const topics = await hotTopicService.updateHotTopics();
    
    res.json({
      success: true,
      message: '热点数据更新成功',
      data: topics
    });
  } catch (error) {
    console.error('更新热点数据失败:', error);
    res.status(500).json({
      success: false,
      message: '更新热点数据失败'
    });
  }
});

// 获取热点分类统计
router.get('/stats/categories', async (req, res) => {
  try {
    const stats = await HotTopic.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgHeat: { $avg: '$heat' },
          maxHeat: { $max: '$heat' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败'
    });
  }
});

module.exports = router;
