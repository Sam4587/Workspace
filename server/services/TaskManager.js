/**
 * 任务管理服务
 * 负责任务的创建、执行、状态跟踪和清理
 */

const Task = require('../models/Task');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class TaskManager {
  constructor() {
    this.runningTasks = new Map();
    this.taskWorkers = new Map();
    this.maxRunningTasks = 100;
    this.maxTaskAge = 30 * 60 * 1000;
    this.initializeWorkers();
    this.startCleanupJob();
    this.startMemoryCleanup();
  }

  /**
   * 初始化任务处理器
   */
  initializeWorkers() {
    // 注册不同类型任务的处理器
    this.taskWorkers.set('content_generation', require('./workers/ContentGenerationWorker'));
    this.taskWorkers.set('video_transcription', require('./workers/VideoTranscriptionWorker'));
    this.taskWorkers.set('content_rewrite', require('./workers/ContentRewriteWorker'));
    this.taskWorkers.set('analysis', require('./workers/AnalysisWorker'));
  }

  /**
   * 创建新任务
   */
  async createTask(type, resourceId, parameters, userId) {
    try {
      const taskId = `task_${uuidv4().replace(/-/g, '')}`;
      
      const task = new Task({
        taskId,
        type,
        resourceId,
        parameters,
        userId,
        status: 'pending'
      });

      await task.save();
      logger.info('[TaskManager] 任务创建成功', { taskId, type, userId });
      
      // 异步启动任务处理
      setImmediate(() => this.processTask(taskId));
      
      return task;
    } catch (error) {
      logger.error('[TaskManager] 创建任务失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 处理任务
   */
  async processTask(taskId) {
    const task = await Task.findByTaskId(taskId);
    if (!task) {
      logger.warn('[TaskManager] 任务不存在', { taskId });
      return;
    }

    // 检查任务状态
    if (task.status !== 'pending') {
      logger.warn('[TaskManager] 任务状态不正确', { taskId, status: task.status });
      return;
    }

    try {
      await task.markAsProcessing();
      this.runningTasks.set(taskId, { ...task, _startTime: Date.now() });

      // 获取对应的任务处理器
      const WorkerClass = this.taskWorkers.get(task.type);
      if (!WorkerClass) {
        throw new Error(`不支持的任务类型: ${task.type}`);
      }

      const worker = new WorkerClass();
      
      // 执行任务
      const result = await worker.execute(task, this.updateTaskProgress.bind(this, taskId));
      
      // 标记为完成
      await task.markAsCompleted(result);
      logger.info('[TaskManager] 任务执行完成', { taskId, type: task.type });

    } catch (error) {
      logger.error('[TaskManager] 任务执行失败', { 
        taskId, 
        error: error.message,
        stack: error.stack 
      });

      // 标记为失败
      await task.markAsFailed(error);

      // 检查是否可以重试
      if (task.canRetry()) {
        logger.info('[TaskManager] 任务将自动重试', { taskId, retryCount: task.retryCount + 1 });
        setTimeout(() => {
          task.incrementRetry().then(() => {
            this.processTask(taskId);
          });
        }, Math.pow(2, task.retryCount) * 1000); // 指数退避重试
      }
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId, percentage, message, currentStep) {
    try {
      const task = await Task.findByTaskId(taskId);
      if (task) {
        await task.updateProgress(percentage, message, currentStep);
        logger.debug('[TaskManager] 任务进度更新', { taskId, percentage, message });
      }
    } catch (error) {
      logger.error('[TaskManager] 更新任务进度失败', { taskId, error: error.message });
    }
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId, userId) {
    const task = await Task.findByTaskId(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    // 验证权限
    if (task.userId !== userId) {
      throw new Error('无权访问此任务');
    }

    return task;
  }

  /**
   * 获取用户任务列表
   */
  async getUserTasks(userId, options = {}) {
    return await Task.findByUser(userId, options);
  }

  /**
   * 获取活跃任务
   */
  async getActiveTasks(userId) {
    return await Task.getActiveTasks(userId);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId, userId) {
    const task = await Task.findByTaskId(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    if (task.userId !== userId) {
      throw new Error('无权操作此任务');
    }

    if (task.status === 'completed' || task.status === 'failed') {
      throw new Error('任务已完成，无法取消');
    }

    task.status = 'cancelled';
    task.completedAt = new Date();
    await task.save();

    // 如果任务正在运行，尝试中断
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.cancelled = true;
      this.runningTasks.delete(taskId);
    }

    logger.info('[TaskManager] 任务已取消', { taskId });
    return task;
  }

  /**
   * 启动清理作业
   */
  startCleanupJob() {
    setInterval(async () => {
      try {
        const result = await Task.cleanupOldTasks(7);
        if (result.deletedCount > 0) {
          logger.info('[TaskManager] 清理旧任务', { deletedCount: result.deletedCount });
        }
      } catch (error) {
        logger.error('[TaskManager] 清理任务失败', { error: error.message });
      }
    }, 60 * 60 * 1000);
  }

  startMemoryCleanup() {
    this.memoryCleanupInterval = setInterval(() => {
      this.cleanupStaleTasks();
    }, 5 * 60 * 1000);
    this.memoryCleanupInterval.unref();
  }

  cleanupStaleTasks() {
    const now = Date.now();
    let cleaned = 0;
    for (const [taskId, task] of this.runningTasks) {
      if (task._startTime && (now - task._startTime > this.maxTaskAge)) {
        this.runningTasks.delete(taskId);
        cleaned++;
        logger.warn('[TaskManager] 清理超时任务', { taskId, age: Math.round((now - task._startTime) / 1000) + 's' });
      }
    }
    if (this.runningTasks.size > this.maxRunningTasks) {
      const entries = Array.from(this.runningTasks.entries());
      const toDelete = entries.slice(0, this.runningTasks.size - this.maxRunningTasks);
      for (const [taskId] of toDelete) {
        this.runningTasks.delete(taskId);
        cleaned++;
      }
      logger.warn('[TaskManager] 清理超出限制的任务', { deleted: toDelete.length });
    }
    if (cleaned > 0) {
      logger.info('[TaskManager] 内存清理完成', { cleaned, remaining: this.runningTasks.size });
    }
  }

  /**
   * 获取系统统计信息
   */
  getStats() {
    return {
      runningTasks: this.runningTasks.size,
      registeredWorkers: this.taskWorkers.size,
      activeTaskIds: Array.from(this.runningTasks.keys())
    };
  }
}

// 创建单例
const taskManager = new TaskManager();

module.exports = {
  TaskManager,
  taskManager
};