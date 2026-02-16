/**
 * 趋势分析器
 * 负责热点趋势预测、生命周期分析、相关话题挖掘
 */

const logger = require('../utils/logger');

class TrendAnalyzer {
  constructor() {
    // 趋势阈值配置
    this.thresholds = {
      hotRising: 1.5,        // 快速上升阈值 (增长率)
      hotStable: 0.3,        // 稳定热点阈值
      declining: -0.3,       // 下降趋势阈值
      minDataPoints: 3,      // 最少数据点数
      lifecycleDays: 7       // 生命周期分析天数
    };

    // 趋势阶段定义
    this.stages = {
      EMERGING: 'emging',       // 新兴阶段
      RISING: 'rising',         // 上升阶段
      PEAK: 'peak',             // 巅峰阶段
      STABLE: 'stable',         // 稳定阶段
      DECLINING: 'declining',   // 下降阶段
      FADED: 'faded'           // 消退阶段
    };
  }

  /**
   * 分析趋势
   * @param {Array<{heat: number, timestamp: Date}>} historyData - 历史数据
   * @returns {{trend: string, growthRate: number, prediction: Object}}
   */
  analyzeTrend(historyData) {
    if (!historyData || historyData.length < this.thresholds.minDataPoints) {
      return {
        trend: 'unknown',
        growthRate: 0,
        prediction: null,
        confidence: 0
      };
    }

    // 按时间排序
    const sortedData = [...historyData].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const heats = sortedData.map(d => d.heat);
    const growthRate = this.calculateGrowthRate(heats);
    const trend = this.determineTrend(growthRate);
    const prediction = this.predictFuture(heats, trend);

    return {
      trend,
      growthRate,
      prediction,
      confidence: this.calculateConfidence(sortedData.length, growthRate)
    };
  }

  /**
   * 计算增长率
   * @param {number[]} heats - 热度数组
   * @returns {number}
   */
  calculateGrowthRate(heats) {
    if (heats.length < 2) return 0;

    // 使用最近的数据计算增长率
    const recentCount = Math.min(5, heats.length);
    const recentHeats = heats.slice(-recentCount);

    // 计算平均增长率
    let totalGrowth = 0;
    let validPairs = 0;

    for (let i = 1; i < recentHeats.length; i++) {
      if (recentHeats[i - 1] > 0) {
        const growth = (recentHeats[i] - recentHeats[i - 1]) / recentHeats[i - 1];
        totalGrowth += growth;
        validPairs++;
      }
    }

    return validPairs > 0 ? totalGrowth / validPairs : 0;
  }

  /**
   * 确定趋势方向
   * @param {number} growthRate - 增长率
   * @returns {string}
   */
  determineTrend(growthRate) {
    if (growthRate >= this.thresholds.hotRising) {
      return 'hot_rising';
    }
    if (growthRate >= this.thresholds.hotStable) {
      return 'rising';
    }
    if (growthRate >= -this.thresholds.declining) {
      return 'stable';
    }
    return 'declining';
  }

  /**
   * 预测未来趋势
   * @param {number[]} heats - 历史热度
   * @param {string} trend - 当前趋势
   * @returns {Object}
   */
  predictFuture(heats, trend) {
    const currentHeat = heats[heats.length - 1];
    const avgHeat = heats.reduce((a, b) => a + b, 0) / heats.length;

    // 简单预测模型
    let predictedHeat24h, predictedHeat72h;

    switch (trend) {
      case 'hot_rising':
        predictedHeat24h = currentHeat * 1.3;
        predictedHeat72h = currentHeat * 1.5;
        break;
      case 'rising':
        predictedHeat24h = currentHeat * 1.1;
        predictedHeat72h = currentHeat * 1.2;
        break;
      case 'stable':
        predictedHeat24h = currentHeat;
        predictedHeat72h = currentHeat * 0.95;
        break;
      case 'declining':
        predictedHeat24h = currentHeat * 0.85;
        predictedHeat72h = currentHeat * 0.7;
        break;
      default:
        predictedHeat24h = currentHeat;
        predictedHeat72h = currentHeat;
    }

    return {
      next24h: Math.round(predictedHeat24h),
      next72h: Math.round(predictedHeat72h),
      peakEstimate: this.estimatePeak(heats, trend),
      lifecycleStage: this.determineLifecycleStage(heats, trend)
    };
  }

  /**
   * 估算峰值
   * @param {number[]} heats - 热度数组
   * @param {string} trend - 趋势
   * @returns {Object}
   */
  estimatePeak(heats, trend) {
    const maxHeat = Math.max(...heats);
    const currentHeat = heats[heats.length - 1];

    if (trend === 'declining' || currentHeat >= maxHeat * 0.9) {
      return {
        reached: true,
        value: maxHeat,
        timeToPeak: 0
      };
    }

    // 估算到达峰值的时间
    const growthRate = this.calculateGrowthRate(heats);
    if (growthRate <= 0) {
      return {
        reached: false,
        value: maxHeat,
        timeToPeak: -1 // 无法预测
      };
    }

    const timeToPeak = Math.ceil(Math.log(maxHeat / currentHeat) / Math.log(1 + growthRate));

    return {
      reached: false,
      value: maxHeat,
      timeToPeak: Math.min(timeToPeak, 72) // 最多预测72小时
    };
  }

  /**
   * 确定生命周期阶段
   * @param {number[]} heats - 热度数组
   * @param {string} trend - 趋势
   * @returns {string}
   */
  determineLifecycleStage(heats, trend) {
    const maxHeat = Math.max(...heats);
    const currentHeat = heats[heats.length - 1];
    const heatRatio = currentHeat / maxHeat;

    // 根据趋势和热度比例判断阶段
    if (heats.length <= 2 && trend === 'rising') {
      return this.stages.EMERGING;
    }
    if (trend === 'hot_rising') {
      return this.stages.RISING;
    }
    if (heatRatio >= 0.9) {
      return this.stages.PEAK;
    }
    if (trend === 'stable' && heatRatio >= 0.7) {
      return this.stages.STABLE;
    }
    if (trend === 'declining' && heatRatio >= 0.5) {
      return this.stages.DECLINING;
    }
    return this.stages.FADED;
  }

  /**
   * 计算预测置信度
   * @param {number} dataPoints - 数据点数
   * @param {number} growthRate - 增长率
   * @returns {number}
   */
  calculateConfidence(dataPoints, growthRate) {
    // 数据点越多，置信度越高
    const dataConfidence = Math.min(dataPoints / 10, 1) * 0.5;

    // 增长率越稳定，置信度越高
    const stabilityConfidence = Math.max(0, 1 - Math.abs(growthRate)) * 0.5;

    return Math.round((dataConfidence + stabilityConfidence) * 100) / 100;
  }

  /**
   * 分析话题生命周期
   * @param {string} topicId - 话题 ID
   * @param {Array<{heat: number, timestamp: Date}>} historyData - 历史数据
   * @returns {Object}
   */
  analyzeLifecycle(topicId, historyData) {
    if (!historyData || historyData.length === 0) {
      return {
        topicId,
        stage: 'unknown',
        age: 0,
        peakHeat: 0,
        avgHeat: 0,
        totalDuration: 0
      };
    }

    const sortedData = [...historyData].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const heats = sortedData.map(d => d.heat);
    const timestamps = sortedData.map(d => new Date(d.timestamp));

    const firstSeen = timestamps[0];
    const lastSeen = timestamps[timestamps.length - 1];
    const age = Math.ceil((lastSeen - firstSeen) / (1000 * 60 * 60)); // 小时

    const trend = this.analyzeTrend(historyData);

    return {
      topicId,
      stage: trend.prediction?.lifecycleStage || 'unknown',
      age,
      peakHeat: Math.max(...heats),
      avgHeat: Math.round(heats.reduce((a, b) => a + b, 0) / heats.length),
      totalDuration: age,
      dataPoints: historyData.length,
      trend: trend.trend,
      growthRate: trend.growthRate
    };
  }

  /**
   * 批量分析趋势
   * @param {Array<{id: string, history: Array}>} topicsData - 话题数据
   * @returns {Object[]}
   */
  analyzeBatch(topicsData) {
    return topicsData.map(item => ({
      id: item.id,
      ...this.analyzeTrend(item.history)
    }));
  }

  /**
   * 发现相关话题
   * @param {string[]} keywords - 关键词
   * @param {Array<{id: string, title: string, keywords: string[]}>} topics - 话题池
   * @param {number} limit - 返回数量
   * @returns {Array<{id: string, relevance: number}>}
   */
  findRelatedTopics(keywords, topics, limit = 10) {
    const relatedTopics = [];

    for (const topic of topics) {
      if (!topic.keywords) continue;

      // 计算关键词重叠度
      const overlap = keywords.filter(k => topic.keywords.includes(k));
      const relevance = overlap.length / Math.max(keywords.length, topic.keywords.length);

      if (relevance > 0) {
        relatedTopics.push({
          id: topic.id,
          title: topic.title,
          relevance: Math.round(relevance * 100) / 100,
          overlappingKeywords: overlap
        });
      }
    }

    return relatedTopics
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * 预测热点爆发
   * @param {Array<{id: string, trend: string, growthRate: number}>} topics - 话题列表
   * @returns {Object[]}
   */
  predictViralTopics(topics) {
    const viralCandidates = [];

    for (const topic of topics) {
      // 判断是否可能爆发
      const score = this.calculateViralScore(topic);

      if (score >= 60) {
        viralCandidates.push({
          id: topic.id,
          viralScore: score,
          probability: this.scoreToProbability(score),
          factors: this.identifyViralFactors(topic)
        });
      }
    }

    return viralCandidates.sort((a, b) => b.viralScore - a.viralScore);
  }

  /**
   * 计算爆发潜力分数
   * @param {Object} topic - 话题
   * @returns {number}
   */
  calculateViralScore(topic) {
    let score = 50; // 基础分

    // 趋势因素
    if (topic.trend === 'hot_rising') score += 25;
    else if (topic.trend === 'rising') score += 15;
    else if (topic.trend === 'stable') score += 5;
    else if (topic.trend === 'declining') score -= 15;

    // 增长率因素
    if (topic.growthRate > 1) score += 20;
    else if (topic.growthRate > 0.5) score += 10;
    else if (topic.growthRate < 0) score -= 10;

    // 多平台因素
    if (topic.sourceCount >= 3) score += 15;
    else if (topic.sourceCount >= 2) score += 8;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 分数转概率
   * @param {number} score - 分数
   * @returns {string}
   */
  scoreToProbability(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * 识别爆发因素
   * @param {Object} topic - 话题
   * @returns {string[]}
   */
  identifyViralFactors(topic) {
    const factors = [];

    if (topic.trend === 'hot_rising' || topic.trend === 'rising') {
      factors.push('trend_rising');
    }
    if (topic.growthRate > 0.5) {
      factors.push('high_growth');
    }
    if (topic.sourceCount >= 3) {
      factors.push('multi_platform');
    }
    if (topic.heat > 1000000) {
      factors.push('high_heat');
    }
    if (topic.keywords?.length >= 3) {
      factors.push('keyword_rich');
    }

    return factors;
  }

  /**
   * 获取趋势统计
   * @param {Array<{trend: string}>} topics - 话题列表
   * @returns {Object}
   */
  getTrendStats(topics) {
    const stats = {
      total: topics.length,
      hot_rising: 0,
      rising: 0,
      stable: 0,
      declining: 0,
      unknown: 0
    };

    for (const topic of topics) {
      const trend = topic.trend || 'unknown';
      if (stats.hasOwnProperty(trend)) {
        stats[trend]++;
      } else {
        stats.unknown++;
      }
    }

    return stats;
  }
}

// 单例模式
const trendAnalyzer = new TrendAnalyzer();

module.exports = {
  TrendAnalyzer,
  trendAnalyzer
};
