/**
 * 发布队列管理服务
 * 支持定时发布、优先级队列、重试机制
 */

const logger = require('../utils/logger');
const cron = require('node-cron');
const { platformManager } = require('./publishing/PlatformManager');

class PublishQueueService {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.currentProcessing = 0;
    this.retryLimit = 3;
    this.retryDelay = 60000;
    
    this.statusCallbacks = new Map();
    this.scheduledJobs = new Map();
    
    this.startQueueProcessor();
  }

  addToQueue(content, platforms, options = {}) {
    const taskId = this.generateTaskId();
    
    const task = {
      id: taskId,
      content,
      platforms: Array.isArray(platforms) ? platforms : [platforms],
      options,
      priority: options.priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
      scheduledAt: options.scheduledAt ? new Date(options.scheduledAt) : null,
      retryCount: 0,
      results: {}
    };

    if (task.scheduledAt && task.scheduledAt > new Date()) {
      this.scheduleTask(task);
    } else {
      this.insertByPriority(task);
    }

    logger.info('[PublishQueue] 任务已添加', {
      taskId,
      platforms: task.platforms.join(','),
      scheduledAt: task.scheduledAt
    });

    return {
      taskId,
      status: task.status,
      scheduledAt: task.scheduledAt
    };
  }

  insertByPriority(task) {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const taskPriority = priorityOrder[task.priority] || 1;
    
    let insertIndex = this.queue.findIndex(t => {
      const tPriority = priorityOrder[t.priority] || 1;
      return tPriority > taskPriority;
    });
    
    if (insertIndex === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(insertIndex, 0, task);
    }
  }

  scheduleTask(task) {
    const cronExpression = this.dateToCron(task.scheduledAt);
    
    const job = cron.schedule(cronExpression, () => {
      this.insertByPriority(task);
      this.scheduledJobs.delete(task.id);
      task.status = 'pending';
      logger.info('[PublishQueue] 定时任务已加入队列', { taskId: task.id });
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    
    this.scheduledJobs.set(task.id, {
      task,
      job
    });
    
    task.status = 'scheduled';
    logger.info('[PublishQueue] 定时任务已创建', {
      taskId: task.id,
      scheduledAt: task.scheduledAt
    });
  }

  dateToCron(date) {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 5000);
    
    logger.info('[PublishQueue] 队列处理器已启动');
  }

  async processQueue() {
    if (this.processing || this.currentProcessing >= this.maxConcurrent) {
      return;
    }
    
    const pendingTasks = this.queue.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
      return;
    }
    
    this.processing = true;
    
    const task = pendingTasks[0];
    task.status = 'processing';
    this.currentProcessing++;
    
    try {
      await this.executeTask(task);
    } catch (error) {
      logger.error('[PublishQueue] 任务执行失败', {
        taskId: task.id,
        error: error.message
      });
      
      task.status = 'failed';
      task.error = error.message;
    }
    
    this.currentProcessing--;
    this.processing = false;
  }

  async executeTask(task) {
    logger.info('[PublishQueue] 开始执行任务', { taskId: task.id });
    
    for (const platformId of task.platforms) {
      try {
        const result = await platformManager.publish(platformId, task.content, task.options);
        task.results[platformId] = result;
        
        this.notifyStatus(task.id, {
          platform: platformId,
          status: result.success ? 'success' : 'failed',
          result
        });
      } catch (error) {
        task.results[platformId] = {
          success: false,
          platform: platformId,
          error: error.message
        };
        
        this.notifyStatus(task.id, {
          platform: platformId,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    const allSuccess = Object.values(task.results).every(r => r.success);
    const anySuccess = Object.values(task.results).some(r => r.success);
    
    if (allSuccess) {
      task.status = 'completed';
      this.removeFromQueue(task.id);
    } else if (anySuccess) {
      task.status = 'partial';
      this.handleRetry(task);
    } else {
      task.status = 'failed';
      this.handleRetry(task);
    }
    
    task.completedAt = new Date().toISOString();
    
    logger.info('[PublishQueue] 任务执行完成', {
      taskId: task.id,
      status: task.status,
      results: Object.keys(task.results).map(p => `${p}:${task.results[p].success ? '成功' : '失败'}`)
    });
  }

  handleRetry(task) {
    const failedPlatforms = Object.entries(task.results)
      .filter(([, result]) => !result.success)
      .map(([platform]) => platform);
    
    if (task.retryCount < this.retryLimit && failedPlatforms.length > 0) {
      task.retryCount++;
      
      setTimeout(() => {
        task.platforms = failedPlatforms;
        task.status = 'pending';
        logger.info('[PublishQueue] 任务重试', {
          taskId: task.id,
          retryCount: task.retryCount,
          platforms: failedPlatforms
        });
      }, this.retryDelay * task.retryCount);
    } else {
      this.removeFromQueue(task.id);
    }
  }

  removeFromQueue(taskId) {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  cancelTask(taskId) {
    const scheduledJob = this.scheduledJobs.get(taskId);
    if (scheduledJob) {
      scheduledJob.job.stop();
      this.scheduledJobs.delete(taskId);
      return { success: true, message: '定时任务已取消' };
    }
    
    const taskIndex = this.queue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = this.queue[taskIndex];
      if (task.status === 'pending') {
        this.queue.splice(taskIndex, 1);
        return { success: true, message: '任务已取消' };
      }
      return { success: false, message: '任务正在处理中，无法取消' };
    }
    
    return { success: false, message: '任务不存在' };
  }

  getTaskStatus(taskId) {
    const scheduledJob = this.scheduledJobs.get(taskId);
    if (scheduledJob) {
      return scheduledJob.task;
    }
    
    return this.queue.find(t => t.id === taskId) || null;
  }

  getQueueStats() {
    const stats = {
      total: this.queue.length + this.scheduledJobs.size,
      pending: this.queue.filter(t => t.status === 'pending').length,
      processing: this.queue.filter(t => t.status === 'processing').length,
      scheduled: this.scheduledJobs.size,
      byPlatform: {},
      byPriority: {
        high: 0,
        normal: 0,
        low: 0
      }
    };
    
    this.queue.forEach(task => {
      task.platforms.forEach(platform => {
        stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;
      });
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
    });
    
    return stats;
  }

  getQueueList(options = {}) {
    let tasks = [...this.queue];
    
    if (options.status) {
      tasks = tasks.filter(t => t.status === options.status);
    }
    
    if (options.priority) {
      tasks = tasks.filter(t => t.priority === options.priority);
    }
    
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (options.limit) {
      tasks = tasks.slice(0, options.limit);
    }
    
    return tasks;
  }

  onStatusChange(taskId, callback) {
    this.statusCallbacks.set(taskId, callback);
    return () => this.statusCallbacks.delete(taskId);
  }

  notifyStatus(taskId, status) {
    const callback = this.statusCallbacks.get(taskId);
    if (callback) {
      callback(status);
    }
  }

  generateTaskId() {
    return `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  pauseQueue() {
    this.processing = true;
    logger.info('[PublishQueue] 队列已暂停');
  }

  resumeQueue() {
    this.processing = false;
    logger.info('[PublishQueue] 队列已恢复');
  }

  clearQueue() {
    this.scheduledJobs.forEach(({ job }) => job.stop());
    this.scheduledJobs.clear();
    this.queue = [];
    logger.info('[PublishQueue] 队列已清空');
  }
}

const publishQueueService = new PublishQueueService();

module.exports = {
  PublishQueueService,
  publishQueueService
};
