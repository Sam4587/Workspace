const express = require('express');
const Content = require('../models/Content');
const PublishRecord = require('../models/PublishRecord');
const toutiaoService = require('../services/toutiaoService');

const router = express.Router();

// 发布内容到今日头条
router.post('/toutiao', async (req, res) => {
  try {
    const { contentId, scheduledTime } = req.body;
    
    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: '缺少内容ID'
      });
    }

    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    // 创建发布记录
    const publishRecord = new PublishRecord({
      contentId: content._id,
      platform: 'toutiao',
      status: 'pending',
      scheduledTime: scheduledTime || new Date()
    });

    await publishRecord.save();

    // 调用今日头条API发布
    try {
      const result = await toutiaoService.publishContent(content);
      
      // 更新发布记录
      publishRecord.status = 'success';
      publishRecord.platformUrl = result.url;
      publishRecord.publishTime = new Date();
      await publishRecord.save();

      // 更新内容状态
      content.status = 'published';
      await content.save();

      res.json({
        success: true,
        message: '发布成功',
        data: {
          publishRecord,
          platformUrl: result.url
        }
      });
    } catch (error) {
      // 发布失败
      publishRecord.status = 'failed';
      publishRecord.failReason = error.message;
      await publishRecord.save();

      res.status(500).json({
        success: false,
        message: '发布失败: ' + error.message
      });
    }
  } catch (error) {
    console.error('发布内容失败:', error);
    res.status(500).json({
      success: false,
      message: '发布内容失败'
    });
  }
});

// 获取发布队列
router.get('/queue', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    
    const filter = {};
    if (status !== 'all') {
      filter.status = status;
    }

    const records = await PublishRecord.find(filter)
      .populate('contentId', 'title type')
      .sort({ scheduledTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await PublishRecord.countDocuments(filter);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取发布队列失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发布队列失败'
    });
  }
});

// 获取发布历史
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, platform = 'all' } = req.query;
    
    const filter = {};
    if (platform !== 'all') {
      filter.platform = platform;
    }

    const records = await PublishRecord.find(filter)
      .populate('contentId', 'title type')
      .sort({ publishTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await PublishRecord.countDocuments(filter);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取发布历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发布历史失败'
    });
  }
});

// 更新发布状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'success', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const record = await PublishRecord.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '发布记录不存在'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('更新发布状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新发布状态失败'
    });
  }
});

// 获取发布统计数据
router.get('/stats', async (req, res) => {
  try {
    const stats = await PublishRecord.aggregate([
      {
        $group: {
          _id: '$platform',
          total: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalViews: { $sum: '$metrics.views' },
          totalLikes: { $sum: '$metrics.likes' },
          totalComments: { $sum: '$metrics.comments' },
          totalShares: { $sum: '$metrics.shares' }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取发布统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发布统计失败'
    });
  }
});

module.exports = router;
