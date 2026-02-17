/**
 * 多平台发布路由
 * 提供统一的多平台内容发布 API
 */

const express = require('express');
const router = express.Router();
const { platformManager } = require('../services/publishing/PlatformManager');
const XiaohongshuPlatform = require('../services/publishing/XiaohongshuPlatform');
const DouyinPlatform = require('../services/publishing/DouyinPlatform');
const ToutiaoPlatform = require('../services/publishing/ToutiaoPlatform');

// 注册所有平台
platformManager.registerPlatform('xiaohongshu', new XiaohongshuPlatform());
platformManager.registerPlatform('douyin', new DouyinPlatform());
platformManager.registerPlatform('toutiao', new ToutiaoPlatform());

/**
 * GET /api/publishing/platforms
 * 列出所有可用平台
 */
router.get('/platforms', (req, res) => {
  try {
    const platformIds = platformManager.listPlatforms();
    const platforms = platformIds.map(id => platformManager.getPlatformInfo(id));
    
    res.json({
      success: true,
      data: {
        platforms: platformIds,
        platformDetails: platforms,
        count: platformIds.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/publishing/platform/:platformId
 * 获取平台详细信息
 */
router.get('/platform/:platformId', (req, res) => {
  try {
    const { platformId } = req.params;
    const info = platformManager.getPlatformInfo(platformId);
    const platform = platformManager.getPlatform(platformId);
    const config = platform.getConfig();
    
    res.json({
      success: true,
      data: {
        ...info,
        config
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/publishing/platform/:platformId/login
 * 平台登录
 */
router.post('/platform/:platformId/login', async (req, res) => {
  try {
    const { platformId } = req.params;
    const result = await platformManager.login(platformId, req.body);
    
    res.json({
      success: true,
      platform: platformId,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      platform: req.params.platformId,
      error: error.message
    });
  }
});

/**
 * GET /api/publishing/platform/:platformId/check-login
 * 检查登录状态
 */
router.get('/platform/:platformId/check-login', async (req, res) => {
  try {
    const { platformId } = req.params;
    const result = await platformManager.checkLogin(platformId);
    
    res.json({
      success: true,
      platform: platformId,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      platform: req.params.platformId,
      error: error.message
    });
  }
});

/**
 * POST /api/publishing/platform/:platformId/publish
 * 发布内容到指定平台
 */
router.post('/platform/:platformId/publish', async (req, res) => {
  try {
    const { platformId } = req.params;
    const content = req.body;
    
    // 验证请求体
    if (!content.title || !content.content) {
      return res.status(400).json({
        success: false,
        error: '标题和内容不能为空'
      });
    }
    
    // 执行发布
    const result = await platformManager.publish(platformId, content, req.body.options || {});
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      platform: req.params.platformId,
      error: error.message
    });
  }
});

/**
 * POST /api/publishing/publish-many
 * 批量发布到多个平台
 */
router.post('/publish-many', async (req, res) => {
  try {
    const { platforms, content } = req.body;
    
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请指定要发布的平台'
      });
    }
    
    if (!content || !content.title || !content.content) {
      return res.status(400).json({
        success: false,
        error: '标题和内容不能为空'
      });
    }
    
    const results = await platformManager.publishToMany(platforms, content);
    
    res.json({
      success: true,
      data: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
