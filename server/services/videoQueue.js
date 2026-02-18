const { default: PQueue } = require('p-queue');
const videoRenderService = require('./videoRenderService');
const logger = require('../utils/logger');

class VideoQueue {
  constructor(concurrency = 2) {
    this.queue = new PQueue({ concurrency });
    this.tasks = new Map();
    this.maxTasks = 500;
    this.maxTaskAge = 2 * 60 * 60 * 1000;
    this.startAutoCleanup();
  }

  startAutoCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.autoCleanup();
    }, 30 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  autoCleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [taskId, task] of this.tasks) {
      const taskAge = task.completedAt 
        ? now - task.completedAt.getTime() 
        : task.createdAt 
          ? now - task.createdAt.getTime() 
          : 0;
      const isFinished = ['completed', 'failed', 'cancelled'].includes(task.status);
      if (isFinished && taskAge > this.maxTaskAge) {
        this.tasks.delete(taskId);
        cleaned++;
      }
    }
    if (this.tasks.size > this.maxTasks) {
      const entries = Array.from(this.tasks.entries())
        .filter(([_, task]) => ['completed', 'failed', 'cancelled'].includes(task.status))
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      const toDelete = entries.slice(0, this.tasks.size - this.maxTasks);
      for (const [taskId] of toDelete) {
        this.tasks.delete(taskId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.info('[VideoQueue] 自动清理完成', { cleaned, remaining: this.tasks.size });
    }
  }

  async addTask(task) {
    const taskId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const taskInfo = {
      id: taskId,
      batchId: task.batchId || null,
      compositionId: task.compositionId,
      props: task.props,
      options: task.options || {},
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
    };

    this.tasks.set(taskId, taskInfo);

    this.queue.add(async () => {
      await this.executeTask(taskId);
    });

    return taskId;
  }

  async executeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'rendering';
    task.startedAt = new Date();

    try {
      const result = await videoRenderService.renderVideo({
        compositionId: task.compositionId,
        props: task.props,
        ...task.options,
      });

      if (result.success) {
        task.status = 'completed';
        task.result = {
          outputUrl: result.outputUrl,
          outputPath: result.outputPath,
          duration: result.duration,
        };
      } else {
        task.status = 'failed';
        task.error = result.error;
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }

    task.completedAt = new Date();
    task.progress = 100;
  }

  getTaskStatus(taskId) {
    return this.tasks.get(taskId);
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  getQueueStatus() {
    return {
      pending: this.queue.size,
      rendering: this.queue.pending,
      completed: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
      failed: Array.from(this.tasks.values()).filter(t => t.status === 'failed').length,
      total: this.tasks.size,
      maxTasks: this.maxTasks,
    };
  }

  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'pending') {
      task.status = 'cancelled';
      task.completedAt = new Date();
      return true;
    }
    return false;
  }

  clearCompleted() {
    const completedTasks = Array.from(this.tasks.entries())
      .filter(([_, task]) => task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled');
    
    completedTasks.forEach(([id]) => this.tasks.delete(id));
  }
}

module.exports = new VideoQueue();
