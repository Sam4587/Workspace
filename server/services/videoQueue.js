const { default: PQueue } = require('p-queue');
const videoRenderService = require('./videoRenderService');

class VideoQueue {
  constructor(concurrency = 2) {
    this.queue = new PQueue({ concurrency });
    this.tasks = new Map();
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
