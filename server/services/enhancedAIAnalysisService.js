/**
 * 增强版AI深度分析服务
 * TR-004: AI深度分析增强
 * 
 * 新增功能：
 * - 多维度情感分析（情感倾向、强度、演变）
 * - 趋势预测（基于历史数据）
 * - 跨平台关联分析
 * - 异动检测与预警
 * - 研判策略建议
 */

const logger = require('../utils/logger');
const llmGateway = require('./llm');

class EnhancedAIAnalysisService {
  constructor() {
    this.analysisCache = new Map();
    this.cacheDuration = 10 * 60 * 1000;
    this.historyData = [];
    this.maxHistorySize = 1000;
  }

  async analyzeCoreHotspotTrends(topics, options = {}) {
    const { language = 'zh' } = options;

    if (!topics || topics.length === 0) {
      return this.getDefaultCoreAnalysis();
    }

    const prompt = this.buildCoreAnalysisPrompt(topics);
    
    try {
      const response = await llmGateway.generate([
        { role: 'system', content: this.getSystemPrompt('core_analysis') },
        { role: 'user', content: prompt }
      ], {
        model: 'deepseek/deepseek-chat',
        temperature: 0.3,
        maxTokens: 2000
      });

      const analysis = this.parseAnalysisResponse(response.content, 'core');
      
      this.updateHistory('core_analysis', { topics: topics.length, result: analysis });
      
      return analysis;
    } catch (error) {
      logger.error('[EnhancedAI] 核心热点态势分析失败', { error: error.message });
      return this.getDefaultCoreAnalysis();
    }
  }

  async analyzeSentiment(topics, options = {}) {
    const { detailed = true, includeEvolution = true } = options;

    if (!topics || topics.length === 0) {
      return this.getDefaultSentimentAnalysis();
    }

    const prompt = this.buildSentimentPrompt(topics, { detailed, includeEvolution });
    
    try {
      const response = await llmGateway.generate([
        { role: 'system', content: this.getSystemPrompt('sentiment_analysis') },
        { role: 'user', content: prompt }
      ], {
        model: 'deepseek/deepseek-chat',
        temperature: 0.3,
        maxTokens: 2500
      });

      const analysis = this.parseAnalysisResponse(response.content, 'sentiment');
      
      this.updateHistory('sentiment_analysis', { topics: topics.length, result: analysis });
      
      return analysis;
    } catch (error) {
      logger.error('[EnhancedAI] 情感分析失败', { error: error.message });
      return this.getDefaultSentimentAnalysis();
    }
  }

  async detectAnomalies(topics, options = {}) {
    const { sensitivity = 'medium', includeWeakSignals = true } = options;

    if (!topics || topics.length === 0) {
      return this.getDefaultAnomalyDetection();
    }

    const historicalContext = this.getHistoricalContext(topics);
    const prompt = this.buildAnomalyPrompt(topics, historicalContext, { sensitivity, includeWeakSignals });
    
    try {
      const response = await llmGateway.generate([
        { role: 'system', content: this.getSystemPrompt('anomaly_detection') },
        { role: 'user', content: prompt }
      ], {
        model: 'deepseek/deepseek-chat',
        temperature: 0.4,
        maxTokens: 2000
      });

      const analysis = this.parseAnalysisResponse(response.content, 'anomaly');
      
      this.updateHistory('anomaly_detection', { topics: topics.length, result: analysis });
      
      return analysis;
    } catch (error) {
      logger.error('[EnhancedAI] 异动检测失败', { error: error.message });
      return this.getDefaultAnomalyDetection();
    }
  }

  async generateStrategyRecommendations(topics, context = {}) {
    if (!topics || topics.length === 0) {
      return this.getDefaultRecommendations();
    }

    const historicalInsights = this.getHistoricalInsights();
    const prompt = this.buildRecommendationPrompt(topics, context, historicalInsights);
    
    try {
      const response = await llmGateway.generate([
        { role: 'system', content: this.getSystemPrompt('strategy_recommendation') },
        { role: 'user', content: prompt }
      ], {
        model: 'deepseek/deepseek-chat',
        temperature: 0.5,
        maxTokens: 2000
      });

      const recommendations = this.parseAnalysisResponse(response.content, 'recommendation');
      
      this.updateHistory('strategy_recommendation', { topics: topics.length, result: recommendations });
      
      return recommendations;
    } catch (error) {
      logger.error('[EnhancedAI] 策略建议生成失败', { error: error.message });
      return this.getDefaultRecommendations();
    }
  }

  async analyzeCrossPlatformCorrelation(topics, options = {}) {
    if (!topics || topics.length === 0) {
      return this.getDefaultCrossPlatformAnalysis();
    }

    const platformGroups = this.groupByPlatform(topics);
    const prompt = this.buildCrossPlatformPrompt(platformGroups, options);
    
    try {
      const response = await llmGateway.generate([
        { role: 'system', content: this.getSystemPrompt('cross_platform') },
        { role: 'user', content: prompt }
      ], {
        model: 'deepseek/deepseek-chat',
        temperature: 0.3,
        maxTokens: 2500
      });

      const analysis = this.parseAnalysisResponse(response.content, 'cross_platform');
      
      this.updateHistory('cross_platform', { platforms: Object.keys(platformGroups), result: analysis });
      
      return analysis;
    } catch (error) {
      logger.error('[EnhancedAI] 跨平台关联分析失败', { error: error.message });
      return this.getDefaultCrossPlatformAnalysis();
    }
  }

  async predictTrends(topics, options = {}) {
    const { predictionWindow = '24h', confidence = 0.8 } = options;

    if (!topics || topics.length === 0) {
      return this.getDefaultPrediction();
    }

    const historicalData = this.getHistoricalContext(topics);
    const prompt = this.buildPredictionPrompt(topics, historicalData, { predictionWindow, confidence });
    
    try {
      const response = await llmGateway.generate([
        { role: 'system', content: this.getSystemPrompt('trend_prediction') },
        { role: 'user', content: prompt }
      ], {
        model: 'deepseek/deepseek-chat',
        temperature: 0.4,
        maxTokens: 2000
      });

      const prediction = this.parseAnalysisResponse(response.content, 'prediction');
      
      this.updateHistory('trend_prediction', { topics: topics.length, window: predictionWindow, result: prediction });
      
      return prediction;
    } catch (error) {
      logger.error('[EnhancedAI] 趋势预测失败', { error: error.message });
      return this.getDefaultPrediction();
    }
  }

  async generateFullReport(topics, options = {}) {
    const startTime = Date.now();
    
    try {
      const [
        coreAnalysis,
        sentimentAnalysis,
        anomalyDetection,
        recommendations,
        crossPlatform,
        prediction
      ] = await Promise.all([
        this.analyzeCoreHotspotTrends(topics, options),
        this.analyzeSentiment(topics, options),
        this.detectAnomalies(topics, options),
        this.generateStrategyRecommendations(topics, options),
        this.analyzeCrossPlatformCorrelation(topics, options),
        this.predictTrends(topics, options)
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        topicsAnalyzed: topics.length,
        processingTime: Date.now() - startTime,
        sections: {
          coreHotspotTrends: coreAnalysis,
          sentimentAnalysis: sentimentAnalysis,
          anomalyDetection: anomalyDetection,
          strategyRecommendations: recommendations,
          crossPlatformAnalysis: crossPlatform,
          trendPrediction: prediction
        },
        summary: this.generateReportSummary({
          coreAnalysis,
          sentimentAnalysis,
          anomalyDetection,
          recommendations,
          crossPlatform,
          prediction
        })
      };

      logger.info('[EnhancedAI] 完整分析报告生成完成', { 
        topicsCount: topics.length,
        processingTime: report.processingTime 
      });

      return report;
    } catch (error) {
      logger.error('[EnhancedAI] 完整报告生成失败', { error: error.message });
      throw error;
    }
  }

  getSystemPrompt(type) {
    const prompts = {
      core_analysis: `你是一个专业的热点分析专家。请分析热点话题的核心态势，包括：
1. 整体趋势概述（简洁明了，50字内）
2. 热度分布特征
3. 主要话题分类
4. 关键时间节点

输出必须是纯JSON格式，不包含任何Markdown标记。`,

      sentiment_analysis: `你是一个情感分析专家。请对热点话题进行多维度情感分析：
1. 整体情感倾向（正面/负面/中性比例）
2. 情感强度评估（强/中/弱）
3. 情感演变趋势
4. 争议焦点识别
5. 情感风险预警

输出必须是纯JSON格式。`,

      anomaly_detection: `你是一个异常检测专家。请识别热点数据中的异常和弱信号：
1. 突发热点（短时间内热度急剧上升）
2. 异动话题（与历史数据相比异常）
3. 弱信号（潜在趋势，尚未爆发）
4. 风险预警（可能引发争议的话题）

输出必须是纯JSON格式。`,

      strategy_recommendation: `你是一个内容策略专家。基于热点分析，提供可执行的策略建议：
1. 内容创作建议（选题方向、角度）
2. 发布时机建议
3. 平台选择建议
4. 风险规避建议
5. 互动策略建议

输出必须是纯JSON格式。`,

      cross_platform: `你是一个跨平台分析专家。分析不同平台间的话题关联：
1. 平台差异分析
2. 话题传播路径
3. 平台用户偏好
4. 跨平台联动机会

输出必须是纯JSON格式。`,

      trend_prediction: `你是一个趋势预测专家。基于当前和历史数据预测未来趋势：
1. 短期趋势预测（24小时内）
2. 热度变化预测
3. 潜在爆发点
4. 预测置信度

输出必须是纯JSON格式。`
    };

    return prompts[type] || prompts.core_analysis;
  }

  buildCoreAnalysisPrompt(topics) {
    const topicsData = topics.slice(0, 30).map(t => ({
      title: t.title,
      source: t.source,
      heat: t.heat,
      category: t.category,
      publishedAt: t.publishedAt
    }));

    return `请分析以下${topicsData.length}条热点话题的核心态势：

${JSON.stringify(topicsData, null, 2)}

请返回以下JSON格式：
{
  "overview": "整体趋势概述（50字内）",
  "heatDistribution": {
    "high": ["高热度话题标题"],
    "medium": ["中热度话题标题"],
    "low": ["低热度话题标题"]
  },
  "categoryBreakdown": {
    "科技": 5,
    "娱乐": 3
  },
  "keyMoments": [
    {"time": "时间点", "event": "事件描述"}
  ],
  "topKeywords": ["关键词1", "关键词2"]
}`;
  }

  buildSentimentPrompt(topics, options) {
    const topicsData = topics.slice(0, 25).map(t => ({
      title: t.title,
      description: t.description || '',
      source: t.source
    }));

    return `请对以下${topicsData.length}条热点话题进行情感分析：

${JSON.stringify(topicsData, null, 2)}

请返回以下JSON格式：
{
  "overallSentiment": {
    "positive": 40,
    "negative": 20,
    "neutral": 40
  },
  "intensity": {
    "level": "medium",
    "description": "情感强度描述"
  },
  "evolution": {
    "trend": "rising|falling|stable",
    "description": "情感演变描述"
  },
  "controversialTopics": [
    {"title": "话题标题", "reason": "争议原因", "risk": "high|medium|low"}
  ],
  "riskAlerts": [
    {"topic": "话题", "risk": "风险描述", "suggestion": "建议"}
  ]
}`;
  }

  buildAnomalyPrompt(topics, historicalContext, options) {
    const topicsData = topics.slice(0, 30).map(t => ({
      title: t.title,
      heat: t.heat,
      source: t.source,
      publishedAt: t.publishedAt
    }));

    return `请检测以下热点数据中的异常和弱信号：

当前数据：
${JSON.stringify(topicsData, null, 2)}

历史参考：
${JSON.stringify(historicalContext, null, 2)}

请返回以下JSON格式：
{
  "suddenHotspots": [
    {"title": "话题", "heatRise": "上升幅度", "reason": "原因分析"}
  ],
  "anomalies": [
    {"title": "话题", "type": "异常类型", "description": "描述"}
  ],
  "weakSignals": [
    {"title": "话题", "potential": "high|medium|low", "reason": "潜在原因"}
  ],
  "riskWarnings": [
    {"title": "话题", "riskLevel": "high|medium|low", "description": "风险描述"}
  ]
}`;
  }

  buildRecommendationPrompt(topics, context, historicalInsights) {
    const topTopics = topics.slice(0, 15).map(t => ({
      title: t.title,
      heat: t.heat,
      category: t.category,
      source: t.source
    }));

    return `基于以下热点数据，生成内容策略建议：

热点话题：
${JSON.stringify(topTopics, null, 2)}

上下文：
${JSON.stringify(context, null, 2)}

请返回以下JSON格式：
{
  "contentSuggestions": [
    {"topic": "选题", "angle": "切入角度", "priority": "high|medium|low"}
  ],
  "timingSuggestions": {
    "bestTime": "建议发布时间",
    "reason": "原因"
  },
  "platformSuggestions": [
    {"platform": "平台", "suitability": "适合度", "reason": "原因"}
  ],
  "riskAvoidance": [
    {"risk": "风险点", "mitigation": "规避方法"}
  ],
  "engagementStrategy": [
    {"strategy": "策略", "expectedEffect": "预期效果"}
  ]
}`;
  }

  buildCrossPlatformPrompt(platformGroups, options) {
    return `分析以下平台间的话题关联：

${JSON.stringify(platformGroups, null, 2)}

请返回以下JSON格式：
{
  "platformDifferences": [
    {"platform": "平台名", "characteristics": "特点", "topTopics": ["话题"]}
  ],
  "propagationPaths": [
    {"source": "来源平台", "target": "目标平台", "topics": ["传播话题"]}
  ],
  "userPreferences": {
    "platform": {"preferredCategories": ["类别"], "engagementPattern": "模式"}
  },
  "crossPlatformOpportunities": [
    {"opportunity": "联动机会", "platforms": ["平台"], "potential": "high|medium|low"}
  ]
}`;
  }

  buildPredictionPrompt(topics, historicalData, options) {
    const topicsData = topics.slice(0, 20).map(t => ({
      title: t.title,
      heat: t.heat,
      trend: t.trend || 'stable',
      source: t.source
    }));

    return `基于以下数据预测未来${options.predictionWindow}的趋势：

当前热点：
${JSON.stringify(topicsData, null, 2)}

历史趋势：
${JSON.stringify(historicalData, null, 2)}

请返回以下JSON格式：
{
  "shortTermPrediction": {
    "rising": ["预计上升话题"],
    "falling": ["预计下降话题"],
    "stable": ["预计稳定话题"]
  },
  "heatChangePrediction": [
    {"topic": "话题", "currentHeat": 100, "predictedHeat": 150, "changePercent": 50}
  ],
  "potentialOutbreaks": [
    {"topic": "话题", "probability": 0.8, "trigger": "触发因素"}
  ],
  "confidence": {
    "overall": 0.75,
    "factors": ["影响预测置信度的因素"]
  }
}`;
  }

  parseAnalysisResponse(content, type) {
    try {
      let jsonStr = content;
      
      if (content.includes('```json')) {
        jsonStr = content.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || content;
      } else if (content.includes('```')) {
        jsonStr = content.match(/```\s*([\s\S]*?)\s*```/)?.[1] || content;
      }
      
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      logger.warn('[EnhancedAI] 解析响应失败，返回默认值', { type, error: error.message });
      return this.getDefaultByType(type);
    }
  }

  getDefaultByType(type) {
    const defaults = {
      core: this.getDefaultCoreAnalysis(),
      sentiment: this.getDefaultSentimentAnalysis(),
      anomaly: this.getDefaultAnomalyDetection(),
      recommendation: this.getDefaultRecommendations(),
      cross_platform: this.getDefaultCrossPlatformAnalysis(),
      prediction: this.getDefaultPrediction()
    };
    return defaults[type] || {};
  }

  getDefaultCoreAnalysis() {
    return {
      overview: '暂无足够数据进行分析',
      heatDistribution: { high: [], medium: [], low: [] },
      categoryBreakdown: {},
      keyMoments: [],
      topKeywords: []
    };
  }

  getDefaultSentimentAnalysis() {
    return {
      overallSentiment: { positive: 33, negative: 33, neutral: 34 },
      intensity: { level: 'medium', description: '情感强度适中' },
      evolution: { trend: 'stable', description: '情感趋势稳定' },
      controversialTopics: [],
      riskAlerts: []
    };
  }

  getDefaultAnomalyDetection() {
    return {
      suddenHotspots: [],
      anomalies: [],
      weakSignals: [],
      riskWarnings: []
    };
  }

  getDefaultRecommendations() {
    return {
      contentSuggestions: [],
      timingSuggestions: { bestTime: '工作时间', reason: '用户活跃度高' },
      platformSuggestions: [],
      riskAvoidance: [],
      engagementStrategy: []
    };
  }

  getDefaultCrossPlatformAnalysis() {
    return {
      platformDifferences: [],
      propagationPaths: [],
      userPreferences: {},
      crossPlatformOpportunities: []
    };
  }

  getDefaultPrediction() {
    return {
      shortTermPrediction: { rising: [], falling: [], stable: [] },
      heatChangePrediction: [],
      potentialOutbreaks: [],
      confidence: { overall: 0.5, factors: ['数据不足'] }
    };
  }

  groupByPlatform(topics) {
    return topics.reduce((acc, topic) => {
      const platform = topic.source || 'unknown';
      if (!acc[platform]) acc[platform] = [];
      acc[platform].push({
        title: topic.title,
        heat: topic.heat,
        category: topic.category
      });
      return acc;
    }, {});
  }

  updateHistory(type, data) {
    this.historyData.push({
      type,
      timestamp: Date.now(),
      ...data
    });

    if (this.historyData.length > this.maxHistorySize) {
      this.historyData = this.historyData.slice(-this.maxHistorySize);
    }
  }

  getHistoricalContext(topics) {
    const recentHistory = this.historyData
      .filter(h => Date.now() - h.timestamp < 24 * 60 * 60 * 1000)
      .slice(-10);

    return {
      analysisCount: recentHistory.length,
      recentTypes: [...new Set(recentHistory.map(h => h.type))],
      avgTopicsAnalyzed: recentHistory.length > 0 
        ? Math.round(recentHistory.reduce((sum, h) => sum + (h.topics || 0), 0) / recentHistory.length)
        : 0
    };
  }

  getHistoricalInsights() {
    const recentAnalyses = this.historyData
      .filter(h => h.type === 'core_analysis' && Date.now() - h.timestamp < 7 * 24 * 60 * 60 * 1000);

    if (recentAnalyses.length === 0) return {};

    return {
      totalAnalyses: recentAnalyses.length,
      commonPatterns: '基于历史数据的常见模式分析'
    };
  }

  generateReportSummary(sections) {
    return {
      keyFindings: [
        sections.coreAnalysis?.overview || '无核心发现',
        `情感倾向：${sections.sentimentAnalysis?.overallSentiment?.positive || 0}%正面`,
        `检测到${sections.anomalyDetection?.anomalies?.length || 0}个异常信号`
      ],
      priority: 'high',
      recommendedActions: sections.recommendations?.contentSuggestions?.slice(0, 3) || []
    };
  }

  getCacheKey(type, topics) {
    const topicHash = topics.slice(0, 5).map(t => t.title).join('|');
    return `${type}_${topicHash}`;
  }
}

const enhancedAIAnalysisService = new EnhancedAIAnalysisService();

module.exports = {
  EnhancedAIAnalysisService,
  enhancedAIAnalysisService
};
