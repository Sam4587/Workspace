const express = require('express');
const router = express.Router();
const { enhancedAIAnalysisService } = require('../services/enhancedAIAnalysisService');
const logger = require('../utils/logger');

router.post('/analyze-topic', async (req, res) => {
  try {
    const { title, content, source, heat } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: '请提供话题标题'
      });
    }

    const heatValue = parseInt(heat) || 50;
    
    let trend = 'stable';
    let score = 75;
    let timing = 'watch';
    let timingReason = '基于趋势分析';
    let suggestions = [];

    if (heatValue > 80) {
      trend = 'rising';
      score = Math.min(95, heatValue + 10);
      timing = 'immediate';
      timingReason = '热度高涨，建议立即介入';
      suggestions = [
        '快速创作相关内容抢占流量',
        '结合当下热点设计互动话题',
        '多平台同步发布扩大影响力'
      ];
    } else if (heatValue > 60) {
      trend = 'rising';
      score = heatValue + 5;
      timing = 'immediate';
      timingReason = '热度正在上升，建议尽快介入';
      suggestions = [
        '创作高质量内容参与话题讨论',
        '添加相关关键词提高搜索曝光',
        '结合用户痛点设计内容角度'
      ];
    } else if (heatValue > 40) {
      trend = 'stable';
      score = heatValue;
      timing = 'watch';
      timingReason = '热度平稳，可持续观察';
      suggestions = [
        '观察话题后续发展趋势',
        '准备相关素材待热度上升时发布',
        '从独特角度切入避免同质化'
      ];
    } else {
      trend = 'declining';
      score = Math.max(40, heatValue - 10);
      timing = 'passed';
      timingReason = '热度已过，不建议投入过多资源';
      suggestions = [
        '寻找新的热点话题',
        '将内容存档供后续参考',
        '分析话题传播规律用于未来参考'
      ];
    }

    const analysis = {
      trend,
      score,
      timing,
      timingReason,
      suggestions,
      title,
      source,
      heat: heatValue
    };
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 话题分析失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/core-trends', async (req, res) => {
  try {
    const { topics, options } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的话题数组'
      });
    }

    const analysis = await enhancedAIAnalysisService.analyzeCoreHotspotTrends(topics, options);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 核心趋势分析失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/sentiment', async (req, res) => {
  try {
    const { topics, options } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的话题数组'
      });
    }

    const analysis = await enhancedAIAnalysisService.analyzeSentiment(topics, options);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 情感分析失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/anomalies', async (req, res) => {
  try {
    const { topics, options } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的话题数组'
      });
    }

    const analysis = await enhancedAIAnalysisService.detectAnomalies(topics, options);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 异动检测失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/recommendations', async (req, res) => {
  try {
    const { topics, context } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的话题数组'
      });
    }

    const recommendations = await enhancedAIAnalysisService.generateStrategyRecommendations(topics, context);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 策略建议生成失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/cross-platform', async (req, res) => {
  try {
    const { topics, options } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的话题数组'
      });
    }

    const analysis = await enhancedAIAnalysisService.analyzeCrossPlatformCorrelation(topics, options);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 跨平台分析失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const { topics, options } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的话题数组'
      });
    }

    const prediction = await enhancedAIAnalysisService.predictTrends(topics, options);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 趋势预测失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/full-report', async (req, res) => {
  try {
    const { topics, options } = req.body;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的话题数组'
      });
    }

    const report = await enhancedAIAnalysisService.generateFullReport(topics, options);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('[AIAnalysisAPI] 完整报告生成失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/analysis-types', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'core_trends',
        name: '核心热点态势',
        description: '分析热点话题的整体趋势、热度分布和关键时间节点',
        endpoint: '/api/ai-analysis/core-trends'
      },
      {
        id: 'sentiment',
        name: '情感分析',
        description: '多维度情感分析，包括情感倾向、强度、演变和风险预警',
        endpoint: '/api/ai-analysis/sentiment'
      },
      {
        id: 'anomalies',
        name: '异动检测',
        description: '识别突发热点、异常话题和潜在弱信号',
        endpoint: '/api/ai-analysis/anomalies'
      },
      {
        id: 'recommendations',
        name: '策略建议',
        description: '基于热点分析的内容创作和发布策略建议',
        endpoint: '/api/ai-analysis/recommendations'
      },
      {
        id: 'cross_platform',
        name: '跨平台关联',
        description: '分析不同平台间的话题传播和关联',
        endpoint: '/api/ai-analysis/cross-platform'
      },
      {
        id: 'predict',
        name: '趋势预测',
        description: '基于历史数据的短期趋势预测',
        endpoint: '/api/ai-analysis/predict'
      },
      {
        id: 'full_report',
        name: '完整报告',
        description: '生成包含所有分析维度的完整报告',
        endpoint: '/api/ai-analysis/full-report'
      }
    ]
  });
});

module.exports = router;
