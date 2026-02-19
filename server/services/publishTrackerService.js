/**
 * 发布状态追踪服务
 * 实时追踪发布状态、统计数据、历史记录
 */

const logger = require('../utils/logger');
const NodeCache = require('node-cache');

class PublishTrackerService {
  constructor() {
    this.history = [];
    this.maxHistorySize = 1000;
    this.statsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    
    this.statusSubscribers = new Map();
    this.platformStats = new Map();
    
    this.initializePlatformStats();
  }

  initializePlatformStats() {
    const platforms = ['toutiao', 'douyin', 'xiaohongshu', 'wechat', 'weibo', 'zhihu', 'bilibili'];
    
    platforms.forEach(platform => {
      this.platformStats.set(platform, {
        total: 0,
        success: 0,
        failed: 0,
        pending: 0,
        lastPublish: null,
        avgProcessingTime: 0,
        processingTimes: []
      });
    });
  }

  trackStart(taskId, platform, content) {
    const record = {
      taskId,
      platform,
      contentTitle: content.title || '无标题',
      status: 'processing',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      error: null,
      result: null
    };
    
    this.history.unshift(record);
    this.trimHistory();
    
    this.notifySubscribers(taskId, {
      type: 'start',
      platform,
      status: 'processing'
    });
    
    logger.info('[PublishTracker] 开始追踪', { taskId, platform });
    return record;
  }

  trackSuccess(taskId, platform, result) {
    const record = this.findRecord(taskId, platform);
    if (!record) return;
    
    record.status = 'success';
    record.endTime = new Date().toISOString();
    record.duration = new Date(record.endTime) - new Date(record.startTime);
    record.result = result;
    
    this.updatePlatformStats(platform, true, record.duration);
    this.invalidateStatsCache();
    
    this.notifySubscribers(taskId, {
      type: 'success',
      platform,
      status: 'success',
      result,
      duration: record.duration
    });
    
    logger.info('[PublishTracker] 发布成功', {
      taskId,
      platform,
      duration: record.duration
    });
    
    return record;
  }

  trackFailure(taskId, platform, error) {
    const record = this.findRecord(taskId, platform);
    if (!record) return;
    
    record.status = 'failed';
    record.endTime = new Date().toISOString();
    record.duration = new Date(record.endTime) - new Date(record.startTime);
    record.error = error.message || error;
    
    this.updatePlatformStats(platform, false, record.duration);
    this.invalidateStatsCache();
    
    this.notifySubscribers(taskId, {
      type: 'failure',
      platform,
      status: 'failed',
      error: record.error,
      duration: record.duration
    });
    
    logger.error('[PublishTracker] 发布失败', {
      taskId,
      platform,
      error: record.error
    });
    
    return record;
  }

  trackRetry(taskId, platform, retryCount) {
    const record = this.findRecord(taskId, platform);
    if (!record) return;
    
    record.status = 'retrying';
    record.retryCount = retryCount;
    
    this.notifySubscribers(taskId, {
      type: 'retry',
      platform,
      status: 'retrying',
      retryCount
    });
    
    logger.info('[PublishTracker] 任务重试', { taskId, platform, retryCount });
    return record;
  }

  findRecord(taskId, platform) {
    return this.history.find(r => r.taskId === taskId && r.platform === platform);
  }

  updatePlatformStats(platform, success, duration) {
    const stats = this.platformStats.get(platform) || {
      total: 0,
      success: 0,
      failed: 0,
      pending: 0,
      lastPublish: null,
      avgProcessingTime: 0,
      processingTimes: []
    };
    
    stats.total++;
    if (success) {
      stats.success++;
    } else {
      stats.failed++;
    }
    stats.lastPublish = new Date().toISOString();
    
    if (duration) {
      stats.processingTimes.push(duration);
      if (stats.processingTimes.length > 50) {
        stats.processingTimes.shift();
      }
      stats.avgProcessingTime = Math.round(
        stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length
      );
    }
    
    this.platformStats.set(platform, stats);
  }

  getHistory(options = {}) {
    let records = [...this.history];
    
    if (options.platform) {
      records = records.filter(r => r.platform === options.platform);
    }
    
    if (options.status) {
      records = records.filter(r => r.status === options.status);
    }
    
    if (options.startDate) {
      const start = new Date(options.startDate);
      records = records.filter(r => new Date(r.startTime) >= start);
    }
    
    if (options.endDate) {
      const end = new Date(options.endDate);
      records = records.filter(r => new Date(r.startTime) <= end);
    }
    
    if (options.limit) {
      records = records.slice(0, options.limit);
    }
    
    return records;
  }

  getStats(options = {}) {
    const cacheKey = `stats_${options.platform || 'all'}`;
    const cached = this.statsCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    let stats;
    
    if (options.platform) {
      stats = this.platformStats.get(options.platform) || this.getEmptyStats();
    } else {
      stats = this.aggregateAllStats();
    }
    
    this.statsCache.set(cacheKey, stats);
    return stats;
  }

  aggregateAllStats() {
    const aggregated = {
      total: 0,
      success: 0,
      failed: 0,
      pending: 0,
      successRate: 0,
      avgProcessingTime: 0,
      byPlatform: {},
      recentTrend: this.calculateRecentTrend()
    };
    
    let totalProcessingTime = 0;
    let processingCount = 0;
    
    this.platformStats.forEach((stats, platform) => {
      aggregated.total += stats.total;
      aggregated.success += stats.success;
      aggregated.failed += stats.failed;
      aggregated.pending += stats.pending;
      
      aggregated.byPlatform[platform] = {
        total: stats.total,
        success: stats.success,
        failed: stats.failed,
        successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
      };
      
      if (stats.avgProcessingTime > 0) {
        totalProcessingTime += stats.avgProcessingTime * stats.processingTimes.length;
        processingCount += stats.processingTimes.length;
      }
    });
    
    aggregated.successRate = aggregated.total > 0 
      ? Math.round((aggregated.success / aggregated.total) * 100) 
      : 0;
    
    aggregated.avgProcessingTime = processingCount > 0 
      ? Math.round(totalProcessingTime / processingCount) 
      : 0;
    
    return aggregated;
  }

  calculateRecentTrend() {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
    
    const lastHour = this.history.filter(r => new Date(r.startTime) >= oneHourAgo);
    const previousHour = this.history.filter(r => {
      const time = new Date(r.startTime);
      return time >= twoHoursAgo && time < oneHourAgo;
    });
    
    const lastHourSuccess = lastHour.filter(r => r.status === 'success').length;
    const previousHourSuccess = previousHour.filter(r => r.status === 'success').length;
    
    let trend = 'stable';
    if (lastHourSuccess > previousHourSuccess * 1.2) {
      trend = 'increasing';
    } else if (lastHourSuccess < previousHourSuccess * 0.8) {
      trend = 'decreasing';
    }
    
    return {
      lastHour: {
        total: lastHour.length,
        success: lastHourSuccess
      },
      previousHour: {
        total: previousHour.length,
        success: previousHourSuccess
      },
      trend
    };
  }

  getEmptyStats() {
    return {
      total: 0,
      success: 0,
      failed: 0,
      pending: 0,
      successRate: 0,
      avgProcessingTime: 0
    };
  }

  subscribe(taskId, callback) {
    if (!this.statusSubscribers.has(taskId)) {
      this.statusSubscribers.set(taskId, new Set());
    }
    this.statusSubscribers.get(taskId).add(callback);
    
    return () => {
      const subscribers = this.statusSubscribers.get(taskId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.statusSubscribers.delete(taskId);
        }
      }
    };
  }

  notifySubscribers(taskId, update) {
    const subscribers = this.statusSubscribers.get(taskId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          logger.error('[PublishTracker] 订阅回调错误', { error: error.message });
        }
      });
    }
  }

  invalidateStatsCache() {
    this.statsCache.flushAll();
  }

  trimHistory() {
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  getRecentErrors(limit = 10) {
    return this.history
      .filter(r => r.status === 'failed')
      .slice(0, limit)
      .map(r => ({
        taskId: r.taskId,
        platform: r.platform,
        contentTitle: r.contentTitle,
        error: r.error,
        time: r.endTime
      }));
  }

  getSuccessRateByTimeRange(startDate, endDate) {
    const records = this.history.filter(r => {
      const time = new Date(r.startTime);
      return time >= new Date(startDate) && time <= new Date(endDate);
    });
    
    if (records.length === 0) {
      return { rate: 0, total: 0, success: 0 };
    }
    
    const success = records.filter(r => r.status === 'success').length;
    
    return {
      rate: Math.round((success / records.length) * 100),
      total: records.length,
      success
    };
  }

  exportHistory(format = 'json') {
    if (format === 'csv') {
      const headers = ['taskId', 'platform', 'contentTitle', 'status', 'startTime', 'endTime', 'duration', 'error'];
      const rows = this.history.map(r => [
        r.taskId,
        r.platform,
        `"${r.contentTitle.replace(/"/g, '""')}"`,
        r.status,
        r.startTime,
        r.endTime || '',
        r.duration || '',
        r.error || ''
      ]);
      
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    
    return JSON.stringify(this.history, null, 2);
  }
}

const publishTrackerService = new PublishTrackerService();

module.exports = {
  PublishTrackerService,
  publishTrackerService
};
