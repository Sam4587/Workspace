const express = require('express');
const router = express.Router();
const { platformManager } = require('../services/publishing/PlatformManager');
const { publishQueueService } = require('../services/publishQueueService');
const { publishTrackerService } = require('../services/publishTrackerService');
const WechatPlatform = require('../services/publishing/WechatPlatform');
const XiaohongshuPlatform = require('../services/publishing/XiaohongshuPlatform');
const DouyinPlatform = require('../services/publishing/DouyinPlatform');
const ToutiaoPlatform = require('../services/publishing/ToutiaoPlatform');
const logger = require('../utils/logger');

platformManager.registerPlatform('wechat', new WechatPlatform());
platformManager.registerPlatform('xiaohongshu', new XiaohongshuPlatform());
platformManager.registerPlatform('douyin', new DouyinPlatform());
platformManager.registerPlatform('toutiao', new ToutiaoPlatform());

router.get('/platforms', (req, res) => {
  try {
    const platformIds = platformManager.listPlatforms();
    const platforms = platformIds.map(id => platformManager.getPlatformInfo(id));
    
    res.json({
      success: true,
      data: {
        platforms,
        count: platformIds.length
      }
    });
  } catch (error) {
    logger.error('[PublishAPI] 获取平台列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/platform/:platformId', (req, res) => {
  try {
    const { platformId } = req.params;
    const info = platformManager.getPlatformInfo(platformId);
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/login/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const { options } = req.body;
    
    const result = await platformManager.login(platformId, options);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('[PublishAPI] 登录失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/check-login/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const result = await platformManager.checkLogin(platformId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/publish', async (req, res) => {
  try {
    const { content, platforms, options } = req.body;
    
    if (!content || !platforms) {
      return res.status(400).json({
        success: false,
        error: '请提供内容和目标平台'
      });
    }
    
    const result = publishQueueService.addToQueue(content, platforms, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[PublishAPI] 发布失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/publish/immediate', async (req, res) => {
  try {
    const { content, platforms, options } = req.body;
    
    if (!content || !platforms) {
      return res.status(400).json({
        success: false,
        error: '请提供内容和目标平台'
      });
    }
    
    const results = await platformManager.publishToMany(
      Array.isArray(platforms) ? platforms : [platforms],
      content,
      options
    );
    
    results.forEach(result => {
      const taskId = `immediate_${Date.now()}_${result.platform}`;
      publishTrackerService.trackStart(taskId, result.platform, content);
      
      if (result.success) {
        publishTrackerService.trackSuccess(taskId, result.platform, result.data);
      } else {
        publishTrackerService.trackFailure(taskId, result.platform, new Error(result.error));
      }
    });
    
    res.json({
      success: results.some(r => r.success),
      data: {
        results,
        summary: {
          total: results.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }
    });
  } catch (error) {
    logger.error('[PublishAPI] 立即发布失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/queue', (req, res) => {
  try {
    const { status, priority, limit } = req.query;
    const tasks = publishQueueService.getQueueList({
      status,
      priority,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/queue/stats', (req, res) => {
  try {
    const stats = publishQueueService.getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/task/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = publishQueueService.getTaskStatus(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/task/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const result = publishQueueService.cancelTask(taskId);
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/history', (req, res) => {
  try {
    const { platform, status, startDate, endDate, limit } = req.query;
    const history = publishTrackerService.getHistory({
      platform,
      status,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const { platform } = req.query;
    const stats = publishTrackerService.getStats({ platform });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats/errors', (req, res) => {
  try {
    const { limit } = req.query;
    const errors = publishTrackerService.getRecentErrors(limit ? parseInt(limit) : 10);
    
    res.json({
      success: true,
      data: errors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats/trend', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const rate = publishTrackerService.getSuccessRateByTimeRange(startDate, endDate);
    
    res.json({
      success: true,
      data: rate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/export', (req, res) => {
  try {
    const { format } = req.query;
    const data = publishTrackerService.exportHistory(format || 'json');
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=publish_history.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    
    res.send(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/queue/pause', (req, res) => {
  try {
    publishQueueService.pauseQueue();
    res.json({
      success: true,
      message: '发布队列已暂停'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/queue/resume', (req, res) => {
  try {
    publishQueueService.resumeQueue();
    res.json({
      success: true,
      message: '发布队列已恢复'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/queue/clear', (req, res) => {
  try {
    publishQueueService.clearQueue();
    res.json({
      success: true,
      message: '发布队列已清空'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
