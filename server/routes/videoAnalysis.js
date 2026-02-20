const express = require('express');
const router = express.Router();
const videoStructureAnalysisService = require('../services/videoStructureAnalysisService');
const logger = require('../utils/logger');

router.post('/structure', async (req, res) => {
  try {
    const { transcript, metadata } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的转录文本'
      });
    }

    if (transcript.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: '转录文本过短，至少需要10个字符'
      });
    }

    logger.info('收到视频结构分析请求', { 
      transcriptLength: transcript.length,
      metadata 
    });

    const result = await videoStructureAnalysisService.analyzeStructure(transcript, metadata || {});
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('视频结构分析失败', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      message: '分析失败: ' + error.message
    });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { videos } = req.body;
    
    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供视频数组'
      });
    }

    if (videos.length > 10) {
      return res.status(400).json({
        success: false,
        message: '单次最多分析10个视频'
      });
    }

    logger.info('收到批量视频分析请求', { count: videos.length });

    const results = await videoStructureAnalysisService.batchAnalyze(videos);
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      data: results,
      summary: {
        total: videos.length,
        successful: successCount,
        failed: videos.length - successCount
      }
    });
  } catch (error) {
    logger.error('批量视频分析失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '批量分析失败: ' + error.message
    });
  }
});

router.get('/structure-types', (req, res) => {
  res.json({
    success: true,
    data: {
      hook: {
        name: '开头钩子',
        description: '前3-5秒的吸引点，用于抓住观众注意力',
        icon: '🎣',
        tips: ['使用悬念开头', '提出问题', '展示惊人结果']
      },
      setup: {
        name: '铺垫内容',
        description: '背景介绍和情境铺垫，为高潮做准备',
        icon: '📖',
        tips: ['简洁明了', '埋下伏笔', '制造期待']
      },
      climax: {
        name: '核心包袱',
        description: '高潮或反转部分，视频的核心价值点',
        icon: '💥',
        tips: ['突出重点', '制造惊喜', '情感共鸣']
      },
      cta: {
        name: '结尾引导',
        description: '互动引导或关注引导，促进用户行为',
        icon: '📢',
        tips: ['明确引导', '提供价值', '制造紧迫感']
      }
    }
  });
});

module.exports = router;
