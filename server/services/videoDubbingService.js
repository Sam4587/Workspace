/**
 * 视频配音服务
 * IT-002: 视频配音服务实现
 * 
 * 功能：
 * - 视频配音生成
 * - 多角色配音
 * - 批量处理
 * - 结果管理
 */

const logger = require('../utils/logger');
const { infiniteTalkService } = require('./infiniteTalkService');
const path = require('path');
const fs = require('fs').promises;

class VideoDubbingService {
  constructor() {
    this.outputDir = process.env.VIDEO_OUTPUT_DIR || './outputs/videos';
    this.tempDir = process.env.VIDEO_TEMP_DIR || './temp/videos';
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_DUBBING) || 3;
    this.currentProcessing = 0;
    this.dubbingQueue = [];
    this.dubbingHistory = [];
    this.maxHistorySize = 200;
  }

  async init() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info('[VideoDubbing] 服务初始化完成');
    } catch (error) {
      logger.error('[VideoDubbing] 初始化失败', { error: error.message });
    }
  }

  async createDubbing(options) {
    const {
      sourceImage,
      audioSource,
      text,
      voiceId = 'default',
      language = 'zh-CN',
      outputFormat = 'mp4',
      resolution = '480p',
      fps = 25,
      enhanceAudio = true,
      smoothVideo = true,
      callback
    } = options;

    const dubbingId = this.generateDubbingId();

    const dubbingTask = {
      id: dubbingId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      options: {
        sourceImage,
        audioSource,
        text,
        voiceId,
        language,
        outputFormat,
        resolution,
        fps,
        enhanceAudio,
        smoothVideo
      },
      callback,
      result: null,
      error: null
    };

    this.dubbingQueue.push(dubbingTask);
    this.processQueue();

    logger.info('[VideoDubbing] 配音任务已创建', { dubbingId });

    return {
      dubbingId,
      status: 'pending',
      message: '任务已加入队列'
    };
  }

  async processQueue() {
    if (this.currentProcessing >= this.maxConcurrent) {
      return;
    }

    const pendingTasks = this.dubbingQueue.filter(t => t.status === 'pending');
    if (pendingTasks.length === 0) {
      return;
    }

    const task = pendingTasks[0];
    task.status = 'processing';
    this.currentProcessing++;

    try {
      const result = await this.executeDubbing(task);
      task.result = result;
      task.status = 'completed';
      task.completedAt = new Date().toISOString();

      if (task.callback) {
        task.callback({ success: true, result });
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date().toISOString();

      if (task.callback) {
        task.callback({ success: false, error: error.message });
      }

      logger.error('[VideoDubbing] 配音任务失败', {
        dubbingId: task.id,
        error: error.message
      });
    }

    this.currentProcessing++;
    this.currentProcessing--;
    this.addToHistory(task);
    this.dubbingQueue = this.dubbingQueue.filter(t => t.id !== task.id);

    if (this.dubbingQueue.some(t => t.status === 'pending')) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  async executeDubbing(task) {
    const { options } = task;
    let result;

    if (options.text) {
      result = await infiniteTalkService.generateFromText({
        sourceImage: options.sourceImage,
        text: options.text,
        voiceId: options.voiceId,
        language: options.language,
        outputFormat: options.outputFormat,
        resolution: options.resolution,
        fps: options.fps,
        enhanceAudio: options.enhanceAudio,
        smoothVideo: options.smoothVideo
      });
    } else if (options.audioSource) {
      result = await infiniteTalkService.generateTalkingVideo({
        sourceImage: options.sourceImage,
        audioFile: options.audioSource,
        outputFormat: options.outputFormat,
        resolution: options.resolution,
        fps: options.fps,
        enhanceAudio: options.enhanceAudio,
        smoothVideo: options.smoothVideo
      });
    } else {
      throw new Error('请提供文本或音频源');
    }

    if (!result.success) {
      throw new Error(result.error || '配音生成失败');
    }

    return {
      taskId: result.taskId,
      estimatedTime: result.estimatedTime,
      status: 'processing'
    };
  }

  async getDubbingStatus(dubbingId) {
    const queueTask = this.dubbingQueue.find(t => t.id === dubbingId);
    if (queueTask) {
      return {
        dubbingId,
        status: queueTask.status,
        result: queueTask.result,
        error: queueTask.error
      };
    }

    const historyTask = this.dubbingHistory.find(t => t.id === dubbingId);
    if (historyTask) {
      return {
        dubbingId,
        status: historyTask.status,
        result: historyTask.result,
        error: historyTask.error,
        completedAt: historyTask.completedAt
      };
    }

    return {
      dubbingId,
      status: 'not_found',
      error: '任务不存在'
    };
  }

  async cancelDubbing(dubbingId) {
    const task = this.dubbingQueue.find(t => t.id === dubbingId);
    
    if (!task) {
      return { success: false, error: '任务不存在' };
    }

    if (task.status === 'processing') {
      if (task.result?.taskId) {
        await infiniteTalkService.cancelTask(task.result.taskId);
      }
    }

    task.status = 'cancelled';
    task.completedAt = new Date().toISOString();
    
    this.addToHistory(task);
    this.dubbingQueue = this.dubbingQueue.filter(t => t.id !== dubbingId);

    return { success: true, message: '任务已取消' };
  }

  async createMultiCharacterDubbing(characters) {
    const dubbingId = this.generateDubbingId();
    const characterTasks = [];

    for (const character of characters) {
      const task = await this.createDubbing({
        sourceImage: character.image,
        text: character.text,
        voiceId: character.voiceId || 'default',
        language: character.language || 'zh-CN'
      });
      characterTasks.push(task);
    }

    return {
      dubbingId,
      status: 'multi_processing',
      characterCount: characters.length,
      characterTasks
    };
  }

  async batchDubbing(items, options = {}) {
    const batchId = `batch_${Date.now()}`;
    const results = [];

    for (const item of items) {
      try {
        const result = await this.createDubbing({
          ...options,
          sourceImage: item.sourceImage,
          text: item.text,
          audioSource: item.audioSource
        });
        results.push({
          itemId: item.id,
          success: true,
          dubbingId: result.dubbingId
        });
      } catch (error) {
        results.push({
          itemId: item.id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      batchId,
      total: items.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async downloadResult(dubbingId, outputPath) {
    const task = this.dubbingHistory.find(t => t.id === dubbingId);
    
    if (!task || !task.result?.taskId) {
      return { success: false, error: '任务不存在或未完成' };
    }

    return infiniteTalkService.downloadResult(task.result.taskId, outputPath);
  }

  getQueueStats() {
    return {
      total: this.dubbingQueue.length,
      pending: this.dubbingQueue.filter(t => t.status === 'pending').length,
      processing: this.dubbingQueue.filter(t => t.status === 'processing').length,
      maxConcurrent: this.maxConcurrent,
      currentProcessing: this.currentProcessing
    };
  }

  getHistory(options = {}) {
    let history = [...this.dubbingHistory];

    if (options.status) {
      history = history.filter(t => t.status === options.status);
    }

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  addToHistory(task) {
    this.dubbingHistory.unshift({
      id: task.id,
      status: task.status,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      options: task.options,
      result: task.result,
      error: task.error
    });

    if (this.dubbingHistory.length > this.maxHistorySize) {
      this.dubbingHistory = this.dubbingHistory.slice(0, this.maxHistorySize);
    }
  }

  generateDubbingId() {
    return `dub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAvailableVoices() {
    return infiniteTalkService.getAvailableVoices();
  }

  async checkServiceHealth() {
    return infiniteTalkService.checkHealth();
  }

  clearHistory() {
    this.dubbingHistory = [];
    logger.info('[VideoDubbing] 历史记录已清空');
  }
}

const videoDubbingService = new VideoDubbingService();
videoDubbingService.init();

module.exports = {
  VideoDubbingService,
  videoDubbingService
};
