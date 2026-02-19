/**
 * 增强版调度服务
 * TR-003: 智能调度系统优化
 * 
 * 新增功能：
 * - 时间窗口引擎（支持跨午夜）
 * - 智能去重策略
 * - 精确的下次执行时间计算
 * - 调度历史记录
 * - 动态并发控制
 */

const cron = require('node-cron');
const cronParser = require('cron-parser');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

const SchedulePresets = {
  always_on: {
    name: '全天候模式',
    description: '有新增即推送',
    intervals: [{ cron: '0 * * * *', action: 'fetch' }],
    analyzeEvery: true,
    pushOnNew: true,
    dedupWindow: 3600000
  },
  morning_evening: {
    name: '早晚模式',
    description: '全天推送 + 晚间当日汇总',
    intervals: [
      { cron: '0 8 * * *', action: 'fetch_and_push' },
      { cron: '0 12 * * *', action: 'fetch_and_push' },
      { cron: '0 20 * * *', action: 'fetch_and_summary' }
    ],
    analyzeEvery: false,
    pushOnNew: false,
    dedupWindow: 7200000
  },
  office_hours: {
    name: '工作时间模式',
    description: '工作日三段式（到岗->午间->收工）',
    intervals: [
      { cron: '0 9 * * 1-5', action: 'fetch_and_push' },
      { cron: '0 12 * * 1-5', action: 'fetch_and_push' },
      { cron: '0 18 * * 1-5', action: 'fetch_and_summary' },
      { cron: '0 10 * * 0,6', action: 'fetch_and_push' }
    ],
    analyzeEvery: false,
    pushOnNew: false,
    dedupWindow: 10800000
  },
  night_owl: {
    name: '夜猫子模式',
    description: '午后速览 + 深夜全天汇总',
    intervals: [
      { cron: '0 14 * * *', action: 'fetch_and_push' },
      { cron: '0 23 * * *', action: 'fetch_and_summary' }
    ],
    analyzeEvery: false,
    pushOnNew: false,
    dedupWindow: 21600000
  },
  custom: {
    name: '自定义模式',
    description: '完全自定义调度',
    intervals: [],
    analyzeEvery: false,
    pushOnNew: false,
    dedupWindow: 3600000
  }
};

class TimeWindowEngine {
  constructor() {
    this.windows = new Map();
  }

  isInWindow(windowName, date = new Date()) {
    const window = this.windows.get(windowName);
    if (!window) return true;

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = this.parseTime(window.start);
    const endMinutes = this.parseTime(window.end);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  addWindow(name, start, end, options = {}) {
    this.windows.set(name, {
      name,
      start,
      end,
      ...options
    });
  }

  removeWindow(name) {
    this.windows.delete(name);
  }

  getWindowStatus(name) {
    const window = this.windows.get(name);
    if (!window) return null;

    const now = new Date();
    const isActive = this.isInWindow(name, now);

    return {
      name: window.name,
      start: window.start,
      end: window.end,
      isActive,
      nextChange: this.getNextChange(name, now)
    };
  }

  getNextChange(name, from = new Date()) {
    const window = this.windows.get(name);
    if (!window) return null;

    const currentMinutes = from.getHours() * 60 + from.getMinutes();
    const startMinutes = this.parseTime(window.start);
    const endMinutes = this.parseTime(window.end);

    let nextStart = new Date(from);
    let nextEnd = new Date(from);

    nextStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    nextEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

    if (nextStart <= from) nextStart.setDate(nextStart.getDate() + 1);
    if (nextEnd <= from) nextEnd.setDate(nextEnd.getDate() + 1);

    const isInWindow = this.isInWindow(name, from);
    return isInWindow ? { type: 'end', time: nextEnd } : { type: 'start', time: nextStart };
  }
}

class DeduplicationEngine {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.defaultTTL || 3600,
      checkperiod: 600
    });
    this.strategies = new Map();
    this.registerDefaultStrategies();
  }

  registerDefaultStrategies() {
    this.strategies.set('content_hash', {
      name: '内容哈希去重',
      generateKey: (item) => {
        const content = typeof item === 'string' ? item : JSON.stringify(item);
        return `hash:${this.simpleHash(content)}`;
      },
      shouldSkip: (key, existing) => !!existing
    });

    this.strategies.set('title_similarity', {
      name: '标题相似度去重',
      generateKey: (item) => {
        const title = item.title || item;
        const normalized = title.toLowerCase().replace(/\s+/g, ' ').trim();
        return `title:${normalized.substring(0, 50)}`;
      },
      shouldSkip: (key, existing) => !!existing
    });

    this.strategies.set('time_window', {
      name: '时间窗口去重',
      generateKey: (item) => {
        const id = item.id || item._id || item.title;
        const hour = new Date().getHours();
        return `time:${hour}:${id}`;
      },
      shouldSkip: (key, existing) => !!existing
    });

    this.strategies.set('frequency_limit', {
      name: '频率限制去重',
      generateKey: (item, options = {}) => {
        const id = item.id || item._id || item.title;
        const period = options.period || 'hour';
        const periodKey = this.getPeriodKey(period);
        return `freq:${period}:${periodKey}:${id}`;
      },
      shouldSkip: (key, existing) => {
        if (!existing) return false;
        const count = existing.count || 0;
        const limit = existing.limit || 3;
        return count >= limit;
      }
    });
  }

  getPeriodKey(period) {
    const now = new Date();
    switch (period) {
      case 'hour':
        return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
      case 'day':
        return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      case 'week':
        const week = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
        return `${now.getFullYear()}-${now.getMonth()}-W${week}`;
      default:
        return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    }
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  check(item, strategies = ['content_hash'], options = {}) {
    const results = [];
    let shouldSkip = false;

    for (const strategyName of strategies) {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) continue;

      const key = strategy.generateKey(item, options);
      const existing = this.cache.get(key);

      if (strategy.shouldSkip(key, existing)) {
        shouldSkip = true;
        results.push({ strategy: strategyName, skipped: true, key });
      } else {
        const value = existing ? { ...existing, count: (existing.count || 0) + 1 } : { count: 1, firstSeen: Date.now() };
        this.cache.set(key, value, options.ttl);
        results.push({ strategy: strategyName, skipped: false, key });
      }
    }

    return { shouldSkip, results };
  }

  addStrategy(name, config) {
    this.strategies.set(name, config);
  }

  clear() {
    this.cache.flushAll();
  }

  getStats() {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats()
    };
  }
}

class ScheduleHistory {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.history = [];
  }

  record(entry) {
    const record = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.history.push(record);

    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
    }

    return record;
  }

  getRecent(count = 10) {
    return this.history.slice(-count);
  }

  getByDate(date) {
    const targetDate = new Date(date).toDateString();
    return this.history.filter(r => new Date(r.timestamp).toDateString() === targetDate);
  }

  getByAction(action) {
    return this.history.filter(r => r.action === action);
  }

  getStats() {
    const now = new Date();
    const today = this.getByDate(now);
    const last24h = this.history.filter(r => {
      const diff = now - new Date(r.timestamp);
      return diff <= 86400000;
    });

    return {
      total: this.history.length,
      today: today.length,
      last24h: last24h.length,
      byAction: this.groupBy('action'),
      successRate: this.calculateSuccessRate()
    };
  }

  groupBy(field) {
    return this.history.reduce((acc, r) => {
      const key = r[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  calculateSuccessRate() {
    if (this.history.length === 0) return 100;
    const success = this.history.filter(r => r.success !== false).length;
    return Math.round((success / this.history.length) * 100);
  }
}

class EnhancedScheduleService {
  constructor() {
    this.tasks = new Map();
    this.currentPreset = null;
    this.config = {
      enabled: false,
      preset: 'morning_evening',
      customIntervals: [],
      analyze: true,
      push: true,
      dedupStrategies: ['content_hash', 'time_window'],
      dedupWindow: 3600000
    };
    this.callbacks = {
      onFetch: null,
      onPush: null,
      onAnalyze: null,
      onSummary: null
    };

    this.timeWindowEngine = new TimeWindowEngine();
    this.dedupEngine = new DeduplicationEngine();
    this.history = new ScheduleHistory();

    this.setupDefaultTimeWindows();
  }

  setupDefaultTimeWindows() {
    this.timeWindowEngine.addWindow('business_hours', '09:00', '18:00', { description: '工作时间' });
    this.timeWindowEngine.addWindow('evening', '18:00', '23:00', { description: '晚间时段' });
    this.timeWindowEngine.addWindow('night', '23:00', '06:00', { description: '深夜时段（跨午夜）' });
    this.timeWindowEngine.addWindow('morning', '06:00', '09:00', { description: '早晨时段' });
  }

  initialize(config = {}, callbacks = {}) {
    this.config = { ...this.config, ...config };
    this.callbacks = callbacks;

    if (this.config.enabled) {
      this.start(this.config.preset);
    }

    logger.info(`[EnhancedScheduler] 初始化完成, 预设: ${this.config.preset}, 启用: ${this.config.enabled}`);
  }

  start(presetName = 'morning_evening') {
    this.stop();

    const preset = SchedulePresets[presetName];
    if (!preset) {
      logger.error(`[EnhancedScheduler] 未知的预设: ${presetName}`);
      return false;
    }

    this.currentPreset = presetName;

    for (const interval of preset.intervals) {
      const task = cron.schedule(interval.cron, async () => {
        await this.executeWithDedup(interval.action, interval);
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai'
      });

      this.tasks.set(interval.cron, task);
    }

    this.history.record({
      type: 'scheduler_start',
      preset: presetName,
      taskCount: preset.intervals.length
    });

    logger.info(`[EnhancedScheduler] 调度已启动, 预设: ${preset.name}, 任务数: ${preset.intervals.length}`);
    return true;
  }

  stop() {
    for (const [key, task] of this.tasks) {
      task.stop();
      this.tasks.delete(key);
    }

    if (this.currentPreset) {
      this.history.record({
        type: 'scheduler_stop',
        preset: this.currentPreset
      });
    }

    this.currentPreset = null;
    logger.info('[EnhancedScheduler] 调度已停止');
  }

  async executeWithDedup(action, interval) {
    const dedupKey = `action:${action}:${new Date().toISOString().split('T')[0]}:${new Date().getHours()}`;
    const dedupResult = this.dedupEngine.check(
      { id: dedupKey },
      this.config.dedupStrategies,
      { ttl: this.config.dedupWindow / 1000 }
    );

    if (dedupResult.shouldSkip) {
      logger.info(`[EnhancedScheduler] 跳过重复执行: ${action}`);
      return { skipped: true, reason: 'dedup' };
    }

    const startTime = Date.now();
    let success = true;
    let error = null;

    try {
      logger.info(`[EnhancedScheduler] 执行定时任务: ${action}`);
      await this.executeAction(action);
    } catch (err) {
      success = false;
      error = err.message;
      logger.error(`[EnhancedScheduler] 执行失败: ${error}`, { action });
    }

    this.history.record({
      type: 'action',
      action,
      cron: interval?.cron,
      success,
      error,
      duration: Date.now() - startTime
    });

    return { success, error };
  }

  async executeAction(action) {
    switch (action) {
      case 'fetch':
        if (this.callbacks.onFetch) await this.callbacks.onFetch();
        break;

      case 'fetch_and_push':
        if (this.callbacks.onFetch) await this.callbacks.onFetch();
        if (this.callbacks.onPush) await this.callbacks.onPush();
        break;

      case 'fetch_and_summary':
        if (this.callbacks.onFetch) await this.callbacks.onFetch();
        if (this.callbacks.onAnalyze && this.config.analyze) await this.callbacks.onAnalyze();
        if (this.callbacks.onSummary) await this.callbacks.onSummary();
        break;

      case 'analyze':
        if (this.callbacks.onAnalyze) await this.callbacks.onAnalyze();
        break;

      default:
        logger.warn(`[EnhancedScheduler] 未知动作: ${action}`);
    }
  }

  getStatus() {
    return {
      enabled: this.tasks.size > 0,
      preset: this.currentPreset,
      presetName: this.currentPreset ? SchedulePresets[this.currentPreset]?.name : null,
      taskCount: this.tasks.size,
      config: this.config,
      history: this.history.getStats(),
      dedup: this.dedupEngine.getStats()
    };
  }

  getPresets() {
    return Object.entries(SchedulePresets).map(([key, preset]) => ({
      id: key,
      name: preset.name,
      description: preset.description,
      intervals: preset.intervals.map(i => i.cron),
      dedupWindow: preset.dedupWindow
    }));
  }

  getNextRunTimes() {
    if (this.tasks.size === 0) return [];

    const preset = SchedulePresets[this.currentPreset];
    if (!preset) return [];

    return preset.intervals.map(interval => {
      const nextDate = this.getNextCronTime(interval.cron);
      return {
        cron: interval.cron,
        action: interval.action,
        nextRun: nextDate?.toISOString() || null,
        humanReadable: nextDate ? this.formatTimeLeft(nextDate) : null
      };
    });
  }

  getNextCronTime(cronExpr) {
    try {
      const interval = cronParser.parseExpression(cronExpr, {
        tz: 'Asia/Shanghai'
      });
      return interval.next().toDate();
    } catch {
      return null;
    }
  }

  formatTimeLeft(targetDate) {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) return '即将执行';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟后`;
    }
    return `${minutes}分钟后`;
  }

  updateConfig(newConfig) {
    const wasRunning = this.tasks.size > 0;
    this.config = { ...this.config, ...newConfig };

    if (wasRunning && !this.config.enabled) {
      this.stop();
    } else if (!wasRunning && this.config.enabled) {
      this.start(this.config.preset);
    } else if (wasRunning && this.config.enabled && newConfig.preset) {
      this.start(this.config.preset);
    }

    logger.info('[EnhancedScheduler] 配置已更新', { config: this.config });
    return this.getStatus();
  }

  addTimeWindow(name, start, end, options = {}) {
    this.timeWindowEngine.addWindow(name, start, end, options);
    logger.info(`[EnhancedScheduler] 时间窗口已添加: ${name} (${start}-${end})`);
  }

  getTimeWindowStatus(name) {
    return this.timeWindowEngine.getWindowStatus(name);
  }

  addDedupStrategy(name, config) {
    this.dedupEngine.addStrategy(name, config);
    logger.info(`[EnhancedScheduler] 去重策略已添加: ${name}`);
  }

  clearDedupCache() {
    this.dedupEngine.clear();
    logger.info('[EnhancedScheduler] 去重缓存已清空');
  }

  getHistory(count = 10) {
    return this.history.getRecent(count);
  }

  async triggerFetch() {
    logger.info('[EnhancedScheduler] 手动触发抓取');
    return this.executeWithDedup('fetch', null);
  }

  async triggerPush() {
    logger.info('[EnhancedScheduler] 手动触发推送');
    return this.executeWithDedup('fetch_and_push', null);
  }

  async triggerAnalyze() {
    logger.info('[EnhancedScheduler] 手动触发分析');
    return this.executeWithDedup('analyze', null);
  }
}

const enhancedScheduleService = new EnhancedScheduleService();

module.exports = {
  EnhancedScheduleService,
  enhancedScheduleService,
  SchedulePresets,
  TimeWindowEngine,
  DeduplicationEngine,
  ScheduleHistory
};
