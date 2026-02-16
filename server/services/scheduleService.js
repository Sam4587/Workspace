/**
 * 调度服务
 * 参考 TrendRadar 调度系统实现
 * 支持多种预设模式和自定义调度
 */

const cron = require('node-cron');
const logger = require('../utils/logger');

// 调度预设配置
const SchedulePresets = {
  always_on: {
    name: '全天候模式',
    description: '有新增即推送',
    intervals: [{ cron: '0 * * * *', action: 'fetch' }], // 每小时
    analyzeEvery: true,
    pushOnNew: true
  },
  morning_evening: {
    name: '早晚模式',
    description: '全天推送 + 晚间当日汇总',
    intervals: [
      { cron: '0 8 * * *', action: 'fetch_and_push' },   // 早上 8 点
      { cron: '0 12 * * *', action: 'fetch_and_push' },  // 中午 12 点
      { cron: '0 20 * * *', action: 'fetch_and_summary' } // 晚上 8 点汇总
    ],
    analyzeEvery: false,
    pushOnNew: false
  },
  office_hours: {
    name: '工作时间模式',
    description: '工作日三段式（到岗->午间->收工）',
    intervals: [
      { cron: '0 9 * * 1-5', action: 'fetch_and_push' },   // 工作日 9 点
      { cron: '0 12 * * 1-5', action: 'fetch_and_push' },  // 工作日 12 点
      { cron: '0 18 * * 1-5', action: 'fetch_and_summary' }, // 工作日 18 点
      { cron: '0 10 * * 0,6', action: 'fetch_and_push' }   // 周末 10 点
    ],
    analyzeEvery: false,
    pushOnNew: false
  },
  night_owl: {
    name: '夜猫子模式',
    description: '午后速览 + 深夜全天汇总',
    intervals: [
      { cron: '0 14 * * *', action: 'fetch_and_push' },   // 下午 2 点
      { cron: '0 23 * * *', action: 'fetch_and_summary' } // 晚上 11 点汇总
    ],
    analyzeEvery: false,
    pushOnNew: false
  },
  custom: {
    name: '自定义模式',
    description: '完全自定义调度',
    intervals: [],
    analyzeEvery: false,
    pushOnNew: false
  }
};

class ScheduleService {
  constructor() {
    this.tasks = new Map();
    this.currentPreset = null;
    this.config = {
      enabled: false,
      preset: 'morning_evening',
      customIntervals: [],
      analyze: true,
      push: true
    };
    this.callbacks = {
      onFetch: null,
      onPush: null,
      onAnalyze: null,
      onSummary: null
    };
  }

  /**
   * 初始化调度服务
   * @param {Object} config - 配置项
   * @param {Object} callbacks - 回调函数
   */
  initialize(config = {}, callbacks = {}) {
    this.config = { ...this.config, ...config };
    this.callbacks = callbacks;

    if (this.config.enabled) {
      this.start(this.config.preset);
    }

    logger.info(`[Scheduler] 调度服务初始化完成, 预设: ${this.config.preset}, 启用: ${this.config.enabled}`);
  }

  /**
   * 启动调度
   * @param {string} presetName - 预设名称
   */
  start(presetName = 'morning_evening') {
    this.stop(); // 先停止现有任务

    const preset = SchedulePresets[presetName];
    if (!preset) {
      logger.error(`[Scheduler] 未知的预设: ${presetName}`);
      return false;
    }

    this.currentPreset = presetName;

    // 创建定时任务
    for (const interval of preset.intervals) {
      const task = cron.schedule(interval.cron, async () => {
        logger.info(`[Scheduler] 执行定时任务: ${interval.action}`);
        await this.executeAction(interval.action);
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai'
      });

      this.tasks.set(interval.cron, task);
    }

    logger.info(`[Scheduler] 调度已启动, 预设: ${preset.name}, 任务数: ${preset.intervals.length}`);
    return true;
  }

  /**
   * 停止调度
   */
  stop() {
    for (const [key, task] of this.tasks) {
      task.stop();
      this.tasks.delete(key);
    }
    this.currentPreset = null;
    logger.info('[Scheduler] 调度已停止');
  }

  /**
   * 执行动作
   * @param {string} action - 动作类型
   */
  async executeAction(action) {
    try {
      switch (action) {
        case 'fetch':
          if (this.callbacks.onFetch) {
            await this.callbacks.onFetch();
          }
          break;

        case 'fetch_and_push':
          if (this.callbacks.onFetch) {
            await this.callbacks.onFetch();
          }
          if (this.callbacks.onPush) {
            await this.callbacks.onPush();
          }
          break;

        case 'fetch_and_summary':
          if (this.callbacks.onFetch) {
            await this.callbacks.onFetch();
          }
          if (this.callbacks.onAnalyze && this.config.analyze) {
            await this.callbacks.onAnalyze();
          }
          if (this.callbacks.onSummary) {
            await this.callbacks.onSummary();
          }
          break;

        case 'analyze':
          if (this.callbacks.onAnalyze) {
            await this.callbacks.onAnalyze();
          }
          break;

        default:
          logger.warn(`[Scheduler] 未知动作: ${action}`);
      }
    } catch (error) {
      logger.error(`[Scheduler] 执行动作失败: ${error.message}`, { action });
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      enabled: this.tasks.size > 0,
      preset: this.currentPreset,
      presetName: this.currentPreset ? SchedulePresets[this.currentPreset]?.name : null,
      taskCount: this.tasks.size,
      config: this.config
    };
  }

  /**
   * 获取所有预设
   */
  getPresets() {
    return Object.entries(SchedulePresets).map(([key, preset]) => ({
      id: key,
      name: preset.name,
      description: preset.description,
      intervals: preset.intervals.map(i => i.cron)
    }));
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    const wasRunning = this.tasks.size > 0;
    this.config = { ...this.config, ...newConfig };

    // 如果调度状态改变，重新启动
    if (wasRunning && !this.config.enabled) {
      this.stop();
    } else if (!wasRunning && this.config.enabled) {
      this.start(this.config.preset);
    } else if (wasRunning && this.config.enabled && newConfig.preset) {
      this.start(this.config.preset);
    }

    logger.info('[Scheduler] 配置已更新', { config: this.config });
    return this.getStatus();
  }

  /**
   * 手动触发抓取
   */
  async triggerFetch() {
    logger.info('[Scheduler] 手动触发抓取');
    await this.executeAction('fetch');
  }

  /**
   * 手动触发推送
   */
  async triggerPush() {
    logger.info('[Scheduler] 手动触发推送');
    await this.executeAction('fetch_and_push');
  }

  /**
   * 手动触发分析
   */
  async triggerAnalyze() {
    logger.info('[Scheduler] 手动触发分析');
    await this.executeAction('analyze');
  }

  /**
   * 获取下一次执行时间
   */
  getNextRunTimes() {
    if (this.tasks.size === 0) return [];

    const preset = SchedulePresets[this.currentPreset];
    if (!preset) return [];

    const now = new Date();
    return preset.intervals.map(interval => {
      const nextDate = this.getNextCronTime(interval.cron, now);
      return {
        cron: interval.cron,
        action: interval.action,
        nextRun: nextDate?.toISOString() || null
      };
    });
  }

  /**
   * 计算下一次 cron 执行时间（简化版）
   */
  getNextCronTime(cronExpr, fromDate) {
    // 简化实现，仅支持标准 cron 表达式
    // 实际项目中建议使用 cron-parser 库
    try {
      const parts = cronExpr.split(' ');
      if (parts.length !== 5) return null;

      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      const next = new Date(fromDate);

      // 设置小时和分钟
      if (hour !== '*') {
        next.setHours(parseInt(hour), parseInt(minute), 0, 0);
        if (next <= fromDate) {
          next.setDate(next.getDate() + 1);
        }
      } else {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      }

      return next;
    } catch {
      return null;
    }
  }
}

// 单例模式
const scheduleService = new ScheduleService();

module.exports = {
  ScheduleService,
  scheduleService,
  SchedulePresets
};
