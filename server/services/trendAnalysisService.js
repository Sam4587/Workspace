/**
 * 热点趋势分析服务
 * 提供时间序列分析、热度预测、趋势识别等功能
 */

const logger = require('../utils/logger');

class TrendAnalysisService {
  constructor() {
    this.trendCache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 分析热点话题的时间趋势
   * @param {Array} topics - 热点话题数组
   * @param {Object} options - 分析选项
   * @returns {Object} 趋势分析结果
   */
  async analyzeTrends(topics, options = {}) {
    const {
      timeWindow = '24h',
      minSamples = 3,
      includePrediction = true
    } = options;

    if (!topics || topics.length === 0) {
      return this.getDefaultTrendResult();
    }

    // 按时间排序
    const sortedTopics = [...topics].sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    const trendData = {
      period: timeWindow,
      totalTopics: topics.length,
      timeSeries: this.buildTimeSeries(sortedTopics, timeWindow),
      trendMetrics: this.calculateTrendMetrics(sortedTopics),
      hotSpots: this.identifyHotSpots(sortedTopics),
      predictions: includePrediction ? await this.predictTrends(sortedTopics) : null
    };

    // 缓存结果
    const cacheKey = `trend_${timeWindow}_${topics.length}`;
    this.trendCache.set(cacheKey, {
      data: trendData,
      timestamp: Date.now()
    });

    return trendData;
  }

  /**
   * 构建时间序列数据
   */
  buildTimeSeries(topics, timeWindow) {
    const intervals = this.getTimeIntervals(timeWindow);
    const series = [];

    for (const interval of intervals) {
      const intervalTopics = topics.filter(topic => {
        const topicTime = new Date(topic.publishedAt);
        return topicTime >= interval.start && topicTime <= interval.end;
      });

      series.push({
        timestamp: interval.start.toISOString(),
        endTime: interval.end.toISOString(),
        count: intervalTopics.length,
        avgHeat: intervalTopics.reduce((sum, t) => sum + (t.heat || 0), 0) / Math.max(intervalTopics.length, 1),
        topics: intervalTopics.slice(0, 5).map(t => ({
          title: t.title,
          heat: t.heat,
          source: t.source
        }))
      });
    }

    return series;
  }

  /**
   * 获取时间间隔
   */
  getTimeIntervals(timeWindow) {
    const now = new Date();
    const intervals = [];
    let intervalCount, intervalDuration;

    switch (timeWindow) {
      case '1h':
        intervalCount = 12;
        intervalDuration = 5 * 60 * 1000; // 5分钟
        break;
      case '6h':
        intervalCount = 12;
        intervalDuration = 30 * 60 * 1000; // 30分钟
        break;
      case '12h':
        intervalCount = 12;
        intervalDuration = 60 * 60 * 1000; // 1小时
        break;
      case '24h':
        intervalCount = 12;
        intervalDuration = 2 * 60 * 60 * 1000; // 2小时
        break;
      case '7d':
        intervalCount = 7;
        intervalDuration = 24 * 60 * 60 * 1000; // 1天
        break;
      default:
        intervalCount = 12;
        intervalDuration = 2 * 60 * 60 * 1000;
    }

    for (let i = intervalCount - 1; i >= 0; i--) {
      const end = new Date(now.getTime() - i * intervalDuration);
      const start = new Date(end.getTime() - intervalDuration);
      intervals.push({ start, end });
    }

    return intervals;
  }

  /**
   * 计算趋势指标
   */
  calculateTrendMetrics(topics) {
    if (topics.length < 2) {
      return {
        overallTrend: 'stable',
        trendStrength: 0,
        volatility: 0,
        growthRate: 0
      };
    }

    // 按时间分组计算平均热度
    const hourlyData = {};
    topics.forEach(topic => {
      const hour = new Date(topic.publishedAt).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { count: 0, totalHeat: 0 };
      }
      hourlyData[hour].count++;
      hourlyData[hour].totalHeat += topic.heat || 0;
    });

    const hours = Object.keys(hourlyData).map(Number).sort();
    const avgHeats = hours.map(hour => hourlyData[hour].totalHeat / hourlyData[hour].count);

    // 计算趋势
    let trendSum = 0;
    for (let i = 1; i < avgHeats.length; i++) {
      trendSum += avgHeats[i] - avgHeats[i - 1];
    }

    const overallTrend = trendSum > 0 ? 'up' : trendSum < 0 ? 'down' : 'stable';
    const trendStrength = Math.abs(trendSum) / avgHeats.length;
    const volatility = this.calculateVolatility(avgHeats);
    const growthRate = avgHeats.length > 1 ? 
      ((avgHeats[avgHeats.length - 1] - avgHeats[0]) / avgHeats[0]) * 100 : 0;

    return {
      overallTrend,
      trendStrength: parseFloat(trendStrength.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(2)),
      growthRate: parseFloat(growthRate.toFixed(2)),
      peakHour: this.findPeakHour(hourlyData),
      quietHour: this.findQuietHour(hourlyData)
    };
  }

  /**
   * 识别热点爆发点
   */
  identifyHotSpots(topics) {
    const hotSpots = [];
    const threshold = this.calculateHeatThreshold(topics);

    topics.forEach(topic => {
      if (topic.heat >= threshold) {
        hotSpots.push({
          title: topic.title,
          heat: topic.heat,
          source: topic.source,
          publishedAt: topic.publishedAt,
          intensity: this.calculateIntensity(topic.heat, threshold)
        });
      }
    });

    return hotSpots.sort((a, b) => b.intensity - a.intensity).slice(0, 10);
  }

  /**
   * 计算热度阈值
   */
  calculateHeatThreshold(topics) {
    if (topics.length === 0) return 50;
    
    const heats = topics.map(t => t.heat || 0).sort((a, b) => a - b);
    const percentile75 = heats[Math.floor(heats.length * 0.75)];
    return Math.max(percentile75, 70);
  }

  /**
   * 计算爆发强度
   */
  calculateIntensity(heat, threshold) {
    return Math.max(0, (heat - threshold) / (100 - threshold));
  }

  /**
   * 计算波动率
   */
  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance) / mean * 100;
  }

  /**
   * 找到峰值时段
   */
  findPeakHour(hourlyData) {
    let peakHour = 0;
    let maxAvgHeat = 0;

    Object.entries(hourlyData).forEach(([hour, data]) => {
      const avgHeat = data.totalHeat / data.count;
      if (avgHeat > maxAvgHeat) {
        maxAvgHeat = avgHeat;
        peakHour = parseInt(hour);
      }
    });

    return peakHour;
  }

  /**
   * 找到平静时段
   */
  findQuietHour(hourlyData) {
    let quietHour = 0;
    let minAvgHeat = Infinity;

    Object.entries(hourlyData).forEach(([hour, data]) => {
      const avgHeat = data.totalHeat / data.count;
      if (avgHeat < minAvgHeat) {
        minAvgHeat = avgHeat;
        quietHour = parseInt(hour);
      }
    });

    return quietHour;
  }

  /**
   * 预测未来趋势
   */
  async predictTrends(topics) {
    if (topics.length < 5) {
      return {
        predictedHeat: 50,
        confidence: 0.3,
        nextPeakTime: null,
        recommendation: '数据不足，建议收集更多样本'
      };
    }

    // 简单的线性回归预测
    const recentTopics = topics.slice(0, 20);
    const heats = recentTopics.map(t => t.heat || 0);
    const times = recentTopics.map((_, index) => index);

    const { slope, intercept } = this.linearRegression(times, heats);
    const predictedHeat = Math.max(0, Math.min(100, slope * (times.length + 1) + intercept));

    // 计算置信度
    const avgHeat = heats.reduce((sum, h) => sum + h, 0) / heats.length;
    const variance = heats.reduce((sum, h) => sum + Math.pow(h - avgHeat, 2), 0) / heats.length;
    const confidence = Math.max(0.1, 1 - (variance / 10000));

    return {
      predictedHeat: parseFloat(predictedHeat.toFixed(1)),
      confidence: parseFloat(confidence.toFixed(2)),
      nextPeakTime: this.predictNextPeak(topics),
      recommendation: this.getRecommendation(predictedHeat, confidence)
    };
  }

  /**
   * 线性回归计算
   */
  linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * 预测下次峰值时间
   */
  predictNextPeak(topics) {
    const trendMetrics = this.calculateTrendMetrics(topics);
    if (trendMetrics.overallTrend === 'up') {
      const now = new Date();
      return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2小时后
    }
    return null;
  }

  /**
   * 获取推荐建议
   */
  getRecommendation(predictedHeat, confidence) {
    if (confidence < 0.5) {
      return '趋势不确定性较高，建议持续观察';
    }

    if (predictedHeat > 80) {
      return '热度持续上升，建议重点关注和及时跟进';
    } else if (predictedHeat < 30) {
      return '热度较低，可以考虑挖掘其他潜在热点';
    } else {
      return '热度稳定，维持当前关注度';
    }
  }

  /**
   * 获取默认趋势结果
   */
  getDefaultTrendResult() {
    return {
      period: '24h',
      totalTopics: 0,
      timeSeries: [],
      trendMetrics: {
        overallTrend: 'stable',
        trendStrength: 0,
        volatility: 0,
        growthRate: 0
      },
      hotSpots: [],
      predictions: null
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.trendCache.clear();
    logger.info('[TrendAnalysisService] 缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.trendCache.size,
      keys: Array.from(this.trendCache.keys())
    };
  }
}

module.exports = new TrendAnalysisService();