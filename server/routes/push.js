const express = require('express');
const router = express.Router();
const { unifiedPushService } = require('../services/unifiedPushService');
const logger = require('../utils/logger');

router.get('/channels', (req, res) => {
  try {
    const channels = unifiedPushService.getAllChannels();
    res.json({
      success: true,
      data: {
        channels,
        enabledCount: channels.filter(c => c.enabled).length,
        totalCount: channels.length
      }
    });
  } catch (error) {
    logger.error('[PushAPI] 获取渠道列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/channels/:channel', (req, res) => {
  try {
    const { channel } = req.params;
    const info = unifiedPushService.getChannelInfo(channel);
    
    if (!info) {
      return res.status(404).json({
        success: false,
        error: `渠道 ${channel} 不存在`
      });
    }
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    logger.error('[PushAPI] 获取渠道信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { channel, message, options } = req.body;
    
    if (!channel) {
      return res.status(400).json({
        success: false,
        error: '请指定推送渠道'
      });
    }
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: '请提供推送消息'
      });
    }

    const result = await unifiedPushService.send(channel, message, options);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('[PushAPI] 推送失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/send-multiple', async (req, res) => {
  try {
    const { channels, message, options } = req.body;
    
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的渠道列表'
      });
    }
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: '请提供推送消息'
      });
    }

    const result = await unifiedPushService.sendToMultiple(channels, message, options);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('[PushAPI] 多渠道推送失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/broadcast', async (req, res) => {
  try {
    const { message, options } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: '请提供推送消息'
      });
    }

    const result = await unifiedPushService.broadcast(message, options);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('[PushAPI] 广播推送失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/test/:channel', async (req, res) => {
  try {
    const { channel } = req.params;
    const result = await unifiedPushService.testChannel(channel);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('[PushAPI] 测试渠道失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/test-all', async (req, res) => {
  try {
    const results = await unifiedPushService.testAllChannels();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('[PushAPI] 测试所有渠道失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/history', (req, res) => {
  try {
    const { channel, success, limit } = req.query;
    const history = unifiedPushService.getHistory({
      channel,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('[PushAPI] 获取历史记录失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = unifiedPushService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('[PushAPI] 获取统计信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/channels/:channel/enable', (req, res) => {
  try {
    const { channel } = req.params;
    unifiedPushService.enableChannel(channel);
    
    res.json({
      success: true,
      message: `渠道 ${channel} 已启用`
    });
  } catch (error) {
    logger.error('[PushAPI] 启用渠道失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/channels/:channel/disable', (req, res) => {
  try {
    const { channel } = req.params;
    unifiedPushService.disableChannel(channel);
    
    res.json({
      success: true,
      message: `渠道 ${channel} 已禁用`
    });
  } catch (error) {
    logger.error('[PushAPI] 禁用渠道失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/channels', (req, res) => {
  try {
    const { channelId, config, adapter } = req.body;
    
    if (!channelId || !config || !adapter) {
      return res.status(400).json({
        success: false,
        error: '请提供完整的渠道配置'
      });
    }

    unifiedPushService.registerChannel(channelId, config, adapter);
    
    res.json({
      success: true,
      message: `渠道 ${channelId} 注册成功`
    });
  } catch (error) {
    logger.error('[PushAPI] 注册渠道失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
