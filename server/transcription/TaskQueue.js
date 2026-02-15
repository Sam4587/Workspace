/**
 * 转录任务队列
 * 管理异步转录任务
 */

const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');

class TaskQueue {
  constructor() {
    // 任务缓存，保留 24 小时
    this.cache = new NodeCache({
      stdTTL: 86400,
      checkperiod: 3600
    });

    // 任务计数
    this.totalTasks = 0;
    this.completedTasks = 0;
    this.failedTasks = 0;
  }

  /**
   * 添加任务
   * @param {Object} task - 任务信息
   * @returns {string} 任务ID
   */
  addTask(task) {
    const taskId = `transcribe_${Date.now()}_${uuidv4().split('-')[0]}`;

    const taskInfo = {
      taskId,
      videoId: task.videoId,
      mediaPath: task.mediaPath,
      options: task.options || {},
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.cache.set(taskId, taskInfo);
    this.totalTasks++;

    logger.info('[TaskQueue] 添加转录任务', { taskId, videoId: task.videoId });

    return taskId;
  }

  /**
   * 获取任务
   * @param {string} taskId - 任务ID
   * @returns {Object|null}
   */
  getTask(taskId) {
    return this.cache.get(taskId) || null;
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} status - 状态
   * @param {Object} result - 结果
   */
  updateStatus(taskId, status, result = null) {
    const task = this.cache.get(taskId);
    if (!task) {
      logger.warn('[TaskQueue] 任务不存在', { taskId });
      return false;
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (status === 'processing') {
      task.progress = 50;
    } else if (status === 'completed') {
      task.progress = 100;
      task.result = result;
      this.completedTasks++;
    } else if (status === 'failed') {
      task.error = result?.error || '未知错误';
      this.failedTasks++;
    }

    this.cache.set(taskId, task);
    logger.debug('[TaskQueue] 更新任务状态', { taskId, status });

    return true;
  }

  /**
   * 更新任务进度
   * @param {string} taskId - 任务ID
   * @param {number} progress - 进度百分比
   */
  updateProgress(taskId, progress) {
    const task = this.cache.get(taskId);
    if (!task) {
      return false;
    }

    task.progress = Math.min(100, Math.max(0, progress));
    task.updatedAt = new Date().toISOString();

    this.cache.set(taskId, task);
    return true;
  }

  /**
   * 取消任务
   * @param {string} taskId - 任务ID
   * @returns {boolean}
   */
  cancel(taskId) {
    const task = this.cache.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status === 'pending') {
      task.status = 'cancelled';
      task.updatedAt = new Date().toISOString();
      this.cache.set(taskId, task);
      logger.info('[TaskQueue] 任务已取消', { taskId });
      return true;
    }

    return false;
  }

  /**
   * 获取队列状态
   * @returns {Object}
   */
  getStatus() {
    const tasks = this.getAllTasks();

    return {
      total: this.totalTasks,
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: this.completedTasks,
      failed: this.failedTasks,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };
  }

  /**
   * 获取所有任务
   * @returns {Array}
   */
  getAllTasks() {
    const keys = this.cache.keys();
    return keys.map(key => this.cache.get(key)).filter(Boolean);
  }

  /**
   * 清除已完成任务
   */
  clearCompleted() {
    const tasks = this.getAllTasks();
    let cleared = 0;

    for (const task of tasks) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.cache.del(task.taskId);
        cleared++;
      }
    }

    logger.info('[TaskQueue] 清除已完成任务', { cleared });
  }

  /**
   * 按 videoId 获取任务
   * @param {string} videoId - 视频ID
   * @returns {Array}
   */
  getTasksByVideoId(videoId) {
    const tasks = this.getAllTasks();
    return tasks.filter(t => t.videoId === videoId);
  }
}

module.exports = TaskQueue;
