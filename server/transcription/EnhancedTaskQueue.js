/**
 * 增强版转录任务队列管理器
 * 提供更完善的任务调度、监控和管理功能
 */

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const os = require('os');

// 任务优先级枚举
const TaskPriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  URGENT: 3
};

// 任务状态枚举
const TaskStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout'
};

/**
 * 任务队列事件发射器
 */
class TaskQueueEvents extends EventEmitter {}

/**
 * 增强版任务队列管理器
 */
class EnhancedTaskQueue {
  constructor(options = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 2,
      defaultTimeout: options.defaultTimeout || 300000, // 5分钟
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 5000,
      cleanupInterval: options.cleanupInterval || 3600000, // 1小时
      ...options
    };

    // 任务存储
    this.pendingTasks = new Map();      // 等待处理的任务
    this.processingTasks = new Map();   // 正在处理的任务
    this.completedTasks = new Map();    // 已完成的任务
    
    // 统计信息
    this.stats = {
      total: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      retried: 0
    };

    // 系统监控
    this.systemMonitor = {
      cpuUsage: 0,
      memoryUsage: 0,
      lastUpdate: Date.now()
    };

    // 事件发射器
    this.events = new TaskQueueEvents();

    // 定时器
    this.processTimer = null;
    this.monitorTimer = null;
    this.cleanupTimer = null;

    // 初始化
    this.initialize();
  }

  /**
   * 初始化队列管理器
   */
  initialize() {
    // 启动处理循环
    this.startProcessingLoop();
    
    // 启动系统监控
    this.startSystemMonitoring();
    
    // 启动定期清理
    this.startCleanupRoutine();

    logger.info('[EnhancedTaskQueue] 队列管理器已初始化', {
      maxConcurrent: this.options.maxConcurrent,
      defaultTimeout: this.options.defaultTimeout
    });
  }

  /**
   * 添加任务到队列
   * @param {Object} taskData - 任务数据
   * @param {Object} options - 任务选项
   * @returns {string} 任务ID
   */
  addTask(taskData, options = {}) {
    const taskId = `task_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    const task = {
      id: taskId,
      ...taskData,
      priority: options.priority || TaskPriority.NORMAL,
      timeout: options.timeout || this.options.defaultTimeout,
      maxRetries: options.maxRetries || this.options.retryAttempts,
      retryCount: 0,
      status: TaskStatus.PENDING,
      progress: 0,
      result: null,
      error: null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      estimatedCompletion: null,
      dependencies: options.dependencies || [],
      metadata: options.metadata || {}
    };

    // 检查依赖任务
    if (task.dependencies.length > 0) {
      task.status = TaskStatus.QUEUED;
    }

    this.pendingTasks.set(taskId, task);
    this.stats.total++;

    // 计算预估完成时间
    this.calculateEstimatedCompletion(task);

    logger.info('[EnhancedTaskQueue] 任务已添加', {
      taskId,
      priority: task.priority,
      dependencies: task.dependencies.length
    });

    // 触发任务添加事件
    this.events.emit('taskAdded', task);

    return taskId;
  }

  /**
   * 获取任务信息
   * @param {string} taskId - 任务ID
   * @returns {Object|null}
   */
  getTask(taskId) {
    // 按优先级搜索
    return (
      this.processingTasks.get(taskId) ||
      this.pendingTasks.get(taskId) ||
      this.completedTasks.get(taskId) ||
      null
    );
  }

  /**
   * 获取所有任务
   * @param {string} status - 筛选状态
   * @returns {Array}
   */
  getAllTasks(status = null) {
    let tasks = [
      ...Array.from(this.pendingTasks.values()),
      ...Array.from(this.processingTasks.values()),
      ...Array.from(this.completedTasks.values())
    ];

    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    return tasks.sort((a, b) => {
      // 按优先级排序
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // 按创建时间排序
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} status - 新状态
   * @param {Object} data - 附加数据
   */
  updateTaskStatus(taskId, status, data = {}) {
    const task = this.getTask(taskId);
    if (!task) {
      logger.warn('[EnhancedTaskQueue] 任务不存在', { taskId });
      return false;
    }

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    // 根据状态更新其他字段
    switch (status) {
      case TaskStatus.PROCESSING:
        task.startedAt = new Date();
        task.progress = data.progress || 0;
        this.moveToProcessing(taskId);
        break;

      case TaskStatus.COMPLETED:
        task.completedAt = new Date();
        task.progress = 100;
        task.result = data.result;
        this.moveToCompleted(taskId);
        this.stats.completed++;
        break;

      case TaskStatus.FAILED:
        task.error = data.error || 'Unknown error';
        task.completedAt = new Date();
        this.handleTaskFailure(taskId, data.error);
        this.stats.failed++;
        break;

      case TaskStatus.CANCELLED:
        task.completedAt = new Date();
        this.removeTask(taskId);
        this.stats.cancelled++;
        break;

      case TaskStatus.PAUSED:
        task.progress = data.progress || task.progress;
        break;

      default:
        task.progress = data.progress || task.progress;
    }

    logger.debug('[EnhancedTaskQueue] 任务状态更新', {
      taskId,
      oldStatus,
      newStatus: status
    });

    // 触发状态变更事件
    this.events.emit('taskStatusChanged', { task, oldStatus, newStatus: status });

    return true;
  }

  /**
   * 更新任务进度
   * @param {string} taskId - 任务ID
   * @param {number} progress - 进度百分比
   * @param {Object} metadata - 附加元数据
   */
  updateTaskProgress(taskId, progress, metadata = {}) {
    const task = this.getTask(taskId);
    if (!task) return false;

    task.progress = Math.min(100, Math.max(0, progress));
    task.updatedAt = new Date();
    
    if (metadata) {
      Object.assign(task.metadata, metadata);
    }

    // 更新预估完成时间
    if (progress > 0 && progress < 100) {
      this.updateEstimatedCompletion(task);
    }

    logger.debug('[EnhancedTaskQueue] 任务进度更新', {
      taskId,
      progress: task.progress
    });

    this.events.emit('taskProgress', { task, progress });

    return true;
  }

  /**
   * 取消任务
   * @param {string} taskId - 任务ID
   * @param {string} reason - 取消原因
   */
  cancelTask(taskId, reason = 'User cancelled') {
    const task = this.getTask(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
      return false; // 不能取消已完成的任务
    }

    task.cancelReason = reason;
    this.updateTaskStatus(taskId, TaskStatus.CANCELLED);

    logger.info('[EnhancedTaskQueue] 任务已取消', { taskId, reason });

    this.events.emit('taskCancelled', { task, reason });

    return true;
  }

  /**
   * 重试失败的任务
   * @param {string} taskId - 任务ID
   */
  retryTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) return false;

    if (task.status !== TaskStatus.FAILED && task.status !== TaskStatus.TIMEOUT) {
      return false; // 只能重试失败的任务
    }

    if (task.retryCount >= task.maxRetries) {
      logger.warn('[EnhancedTaskQueue] 达到最大重试次数', { taskId });
      return false;
    }

    task.retryCount++;
    task.error = null;
    this.stats.retried++;

    // 重新加入待处理队列
    this.pendingTasks.set(taskId, task);
    this.completedTasks.delete(taskId);

    logger.info('[EnhancedTaskQueue] 任务重试', {
      taskId,
      retryCount: task.retryCount
    });

    this.events.emit('taskRetry', { task, retryCount: task.retryCount });

    return true;
  }

  /**
   * 获取队列状态
   * @returns {Object}
   */
  getQueueStatus() {
    const pendingTasks = Array.from(this.pendingTasks.values());
    const processingTasks = Array.from(this.processingTasks.values());
    const completedTasks = Array.from(this.completedTasks.values());

    return {
      stats: { ...this.stats },
      system: { ...this.systemMonitor },
      queues: {
        pending: {
          count: pendingTasks.length,
          highPriority: pendingTasks.filter(t => t.priority >= TaskPriority.HIGH).length
        },
        processing: {
          count: processingTasks.length,
          maxConcurrent: this.options.maxConcurrent
        },
        completed: {
          count: completedTasks.length,
          recent: completedTasks
            .filter(t => Date.now() - t.completedAt < 3600000) // 1小时内
            .length
        }
      },
      tasks: {
        pending: pendingTasks.slice(0, 10), // 只显示前10个等待任务
        processing: processingTasks,
        recentCompleted: completedTasks
          .sort((a, b) => b.completedAt - a.completedAt)
          .slice(0, 10)
      }
    };
  }

  /**
   * 获取任务统计
   * @param {Object} options - 统计选项
   * @returns {Object}
   */
  getStatistics(options = {}) {
    const { timeRange = '24h', groupBy = 'status' } = options;
    
    const tasks = this.getAllTasks();
    const now = Date.now();
    const timeRanges = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000
    };
    
    const timeThreshold = now - (timeRanges[timeRange] || timeRanges['24h']);
    const recentTasks = tasks.filter(task => task.createdAt > timeThreshold);

    const stats = {
      total: tasks.length,
      recent: recentTasks.length,
      byStatus: this.groupByStatus(tasks),
      byPriority: this.groupByPriority(tasks),
      averageProcessingTime: this.calculateAverageProcessingTime(recentTasks),
      successRate: this.calculateSuccessRate(recentTasks)
    };

    if (groupBy === 'priority') {
      stats.detailed = this.groupByPriority(recentTasks);
    } else if (groupBy === 'hour') {
      stats.timeline = this.createTimeline(recentTasks);
    }

    return stats;
  }

  // ==================== 私有方法 ====================

  /**
   * 启动处理循环
   */
  startProcessingLoop() {
    this.processTimer = setInterval(() => {
      this.processPendingTasks();
    }, 1000); // 每秒检查一次
  }

  /**
   * 启动系统监控
   */
  startSystemMonitoring() {
    this.monitorTimer = setInterval(() => {
      const cpuUsage = os.loadavg()[0]; // 1分钟平均负载
      const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem();

      this.systemMonitor = {
        cpuUsage: parseFloat(cpuUsage.toFixed(2)),
        memoryUsage: parseFloat((memoryUsage * 100).toFixed(2)),
        lastUpdate: Date.now()
      };

      // 根据系统负载调整并发数
      this.adjustConcurrency();

    }, 5000); // 每5秒监控一次
  }

  /**
   * 启动定期清理
   */
  startCleanupRoutine() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldTasks();
    }, this.options.cleanupInterval);
  }

  /**
   * 处理待处理任务
   */
  processPendingTasks() {
    // 检查并发限制
    if (this.processingTasks.size >= this.options.maxConcurrent) {
      return;
    }

    // 获取可处理的任务（按优先级排序）
    const availableTasks = Array.from(this.pendingTasks.values())
      .filter(task => task.status === TaskStatus.PENDING || task.status === TaskStatus.QUEUED)
      .filter(task => this.checkDependencies(task))
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt - b.createdAt;
      });

    // 处理任务直到达到并发限制
    while (this.processingTasks.size < this.options.maxConcurrent && availableTasks.length > 0) {
      const task = availableTasks.shift();
      this.executeTask(task);
    }
  }

  /**
   * 检查任务依赖
   * @param {Object} task - 任务对象
   * @returns {boolean}
   */
  checkDependencies(task) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(depId => {
      const depTask = this.getTask(depId);
      return depTask && depTask.status === TaskStatus.COMPLETED;
    });
  }

  /**
   * 执行任务
   * @param {Object} task - 任务对象
   */
  executeTask(task) {
    this.updateTaskStatus(task.id, TaskStatus.PROCESSING);

    // 模拟异步任务执行
    setTimeout(() => {
      // 这里应该调用实际的转录逻辑
      const success = Math.random() > 0.1; // 90% 成功率
      
      if (success) {
        this.updateTaskStatus(task.id, TaskStatus.COMPLETED, {
          result: {
            text: '转录完成的文本内容',
            duration: 120,
            segments: []
          }
        });
      } else {
        this.updateTaskStatus(task.id, TaskStatus.FAILED, {
          error: '转录失败：网络超时'
        });
      }
    }, 2000 + Math.random() * 3000); // 2-5秒随机延迟

    logger.info('[EnhancedTaskQueue] 任务开始执行', {
      taskId: task.id,
      priority: task.priority
    });
  }

  /**
   * 将任务移到处理中队列
   * @param {string} taskId - 任务ID
   */
  moveToProcessing(taskId) {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.processingTasks.set(taskId, task);
      this.pendingTasks.delete(taskId);
      this.stats.processing++;
    }
  }

  /**
   * 将任务移到完成队列
   * @param {string} taskId - 任务ID
   */
  moveToCompleted(taskId) {
    const task = this.processingTasks.get(taskId);
    if (task) {
      this.completedTasks.set(taskId, task);
      this.processingTasks.delete(taskId);
      this.stats.processing--;
    }
  }

  /**
   * 处理任务失败
   * @param {string} taskId - 任务ID
   * @param {string} error - 错误信息
   */
  handleTaskFailure(taskId, error) {
    const task = this.processingTasks.get(taskId);
    if (task) {
      // 检查是否可以重试
      if (task.retryCount < task.maxRetries) {
        setTimeout(() => {
          this.retryTask(taskId);
        }, this.options.retryDelay);
      } else {
        this.moveToCompleted(taskId);
        this.processingTasks.delete(taskId);
        this.stats.processing--;
      }
    }
  }

  /**
   * 移除任务
   * @param {string} taskId - 任务ID
   */
  removeTask(taskId) {
    this.pendingTasks.delete(taskId);
    this.processingTasks.delete(taskId);
    this.completedTasks.delete(taskId);
  }

  /**
   * 计算预估完成时间
   * @param {Object} task - 任务对象
   */
  calculateEstimatedCompletion(task) {
    const baseTime = 120000; // 基础处理时间 2分钟
    const priorityMultiplier = [1.5, 1.0, 0.8, 0.5][task.priority]; // 优先级系数
    const systemLoadFactor = 1 + (this.systemMonitor.cpuUsage / 100); // 系统负载系数
    
    const estimatedTime = baseTime * priorityMultiplier * systemLoadFactor;
    task.estimatedCompletion = new Date(Date.now() + estimatedTime);
  }

  /**
   * 更新预估完成时间
   * @param {Object} task - 任务对象
   */
  updateEstimatedCompletion(task) {
    if (task.progress > 0 && task.progress < 100) {
      const elapsed = Date.now() - task.startedAt.getTime();
      const totalTime = elapsed / (task.progress / 100);
      task.estimatedCompletion = new Date(task.startedAt.getTime() + totalTime);
    }
  }

  /**
   * 调整并发数
   */
  adjustConcurrency() {
    const cpuUsage = this.systemMonitor.cpuUsage;
    const memoryUsage = this.systemMonitor.memoryUsage;

    let newMaxConcurrent = this.options.maxConcurrent;

    // CPU负载过高时减少并发
    if (cpuUsage > 80) {
      newMaxConcurrent = Math.max(1, Math.floor(this.options.maxConcurrent * 0.5));
    } else if (cpuUsage > 60) {
      newMaxConcurrent = Math.max(1, Math.floor(this.options.maxConcurrent * 0.7));
    }

    // 内存使用过高时减少并发
    if (memoryUsage > 85) {
      newMaxConcurrent = Math.min(newMaxConcurrent, 1);
    } else if (memoryUsage > 70) {
      newMaxConcurrent = Math.min(newMaxConcurrent, Math.floor(this.options.maxConcurrent * 0.8));
    }

    if (newMaxConcurrent !== this.options.maxConcurrent) {
      logger.info('[EnhancedTaskQueue] 调整并发数', {
        old: this.options.maxConcurrent,
        new: newMaxConcurrent,
        cpu: cpuUsage,
        memory: memoryUsage
      });
      this.options.maxConcurrent = newMaxConcurrent;
    }
  }

  /**
   * 清理旧任务
   */
  cleanupOldTasks() {
    const oneDayAgo = Date.now() - 86400000; // 24小时前
    let cleaned = 0;

    // 清理完成队列中的旧任务
    for (const [taskId, task] of this.completedTasks) {
      if (task.completedAt && task.completedAt < oneDayAgo) {
        this.completedTasks.delete(taskId);
        cleaned++;
      }
    }

    logger.info('[EnhancedTaskQueue] 定期清理完成', { cleaned });
  }

  /**
   * 按状态分组
   * @param {Array} tasks - 任务数组
   * @returns {Object}
   */
  groupByStatus(tasks) {
    const groups = {};
    Object.values(TaskStatus).forEach(status => {
      groups[status] = tasks.filter(t => t.status === status).length;
    });
    return groups;
  }

  /**
   * 按优先级分组
   * @param {Array} tasks - 任务数组
   * @returns {Object}
   */
  groupByPriority(tasks) {
    const groups = {};
    Object.entries(TaskPriority).forEach(([name, value]) => {
      groups[name] = tasks.filter(t => t.priority === value).length;
    });
    return groups;
  }

  /**
   * 计算平均处理时间
   * @param {Array} tasks - 任务数组
   * @returns {number}
   */
  calculateAverageProcessingTime(tasks) {
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED && t.startedAt && t.completedAt);
    if (completedTasks.length === 0) return 0;

    const total = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt - task.startedAt);
    }, 0);

    return Math.round(total / completedTasks.length);
  }

  /**
   * 计算成功率
   * @param {Array} tasks - 任务数组
   * @returns {number}
   */
  calculateSuccessRate(tasks) {
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / tasks.length) * 100);
  }

  /**
   * 创建时间线统计
   * @param {Array} tasks - 任务数组
   * @returns {Object}
   */
  createTimeline(tasks) {
    const timeline = {};
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now - i * 3600000);
      const hourEnd = new Date(now - (i - 1) * 3600000);
      const hourKey = hourStart.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      
      timeline[hourKey] = {
        total: tasks.filter(t => t.createdAt >= hourStart && t.createdAt < hourEnd).length,
        completed: tasks.filter(t => 
          t.status === TaskStatus.COMPLETED && 
          t.completedAt >= hourStart && 
          t.completedAt < hourEnd
        ).length
      };
    }
    
    return timeline;
  }

  /**
   * 关闭队列管理器
   */
  shutdown() {
    if (this.processTimer) clearInterval(this.processTimer);
    if (this.monitorTimer) clearInterval(this.monitorTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    logger.info('[EnhancedTaskQueue] 队列管理器已关闭');
  }
}

module.exports = {
  EnhancedTaskQueue,
  TaskPriority,
  TaskStatus
};