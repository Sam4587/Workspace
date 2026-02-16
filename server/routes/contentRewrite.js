/**
 * 内容改写 API 路由
 */

const express = require('express');
const router = express.Router();
const videoAnalysisService = require('../services/VideoAnalysisService');
const contentRewriteService = require('../services/ContentRewriteService');
const publishIntegration = require('../services/PublishIntegration');
const logger = require('../utils/logger');

/**
 * POST /api/content/video-rewrite
 * 视频内容改写
 */
router.post('/video-rewrite', async (req, res) => {
  try {
    const { text, platforms } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'text 参数是必需的'
      });
    }

    logger.info('[ContentAPI] 开始视频内容改写', {
      textLength: text.length,
      platforms
    });

    // 先生成摘要
    const analysisResult = await videoAnalysisService.analyze(text);

    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        message: '内容分析失败: ' + analysisResult.error
      });
    }

    const summary = analysisResult.summary || text.slice(0, 500);

    // 批量改写
    const targetPlatforms = platforms || ['xiaohongshu', 'douyin', 'toutiao'];
    const rewriteResult = await contentRewriteService.rewriteMulti(summary, targetPlatforms);

    if (!rewriteResult.success) {
      return res.status(500).json({
        success: false,
        message: '内容改写失败: ' + rewriteResult.error
      });
    }

    res.json({
      success: true,
      data: {
        summary,
        keyPoints: analysisResult.keyPoints,
        results: rewriteResult.results
      }
    });
  } catch (error) {
    logger.error('[ContentAPI] 视频内容改写失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/content/analyze
 * 分析内容
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, options } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'text 参数是必需的'
      });
    }

    const result = await videoAnalysisService.fullAnalysis(text, options);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 内容分析失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/content/rewrite
 * 改写内容（指定平台）
 */
router.post('/rewrite', async (req, res) => {
  try {
    const { summary, platform, options } = req.body;

    if (!summary) {
      return res.status(400).json({
        success: false,
        message: 'summary 参数是必需的'
      });
    }

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'platform 参数是必需的'
      });
    }

    const result = await contentRewriteService.rewrite(summary, platform, options);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 内容改写失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/content/publish
 * 发布内容
 */
router.post('/publish', async (req, res) => {
  try {
    const { platform, content } = req.body;

    if (!platform || !content) {
      return res.status(400).json({
        success: false,
        message: 'platform 和 content 参数是必需的'
      });
    }

    logger.info('[ContentAPI] 发布内容', { platform });

    const result = await publishIntegration.publish(platform, content);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 发布失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/content/platforms
 * 获取支持的平台列表
 */
router.get('/platforms', (req, res) => {
  const platforms = contentRewriteService.getSupportedPlatforms();

  res.json({
    success: true,
    data: platforms
  });
});

/**
 * GET /api/content/publish/status
 * 获取发布登录状态
 */
router.get('/publish/status', async (req, res) => {
  const status = await publishIntegration.getLoginStatus();

  res.json({
    success: true,
    data: status
  });
});

module.exports = router;
