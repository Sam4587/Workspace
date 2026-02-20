/**
 * 视频转录管道服务
 * VT-005: 实时进度与移动端适配
 * 
 * 功能：
 * - 整合视频下载、转录、优化流程
 * - 实时进度推送
 * - 管道任务管理
 * - 错误处理与重试
 */

const logger = require('../utils/logger');
const { videoDownloaderService } = require('./videoDownloaderService');
const { transcriptionService } = require('./transcriptionService');
const { textOptimizationService } = require('./textOptimizationService');
const { multilingualService } = require('./multilingualService');
const { progressNotifierService, ProgressEvents } = require('./progressNotifierService');
const NodeCache = require('node-cache');

class VideoTranscriptionPipeline {
  constructor() {
    this.pipelineCache = new NodeCache({ stdTTL: 7200, checkperiod: 600 });
    this.activePipelines = new Map();
    this.pipelineHistory = [];
    this.maxHistorySize = 200;

    this.config = {
      maxConcurrentPipelines: 3,
      defaultTimeout: 600000,
      retryAttempts: 2,
      retryDelay: 5000
    };
  }

  async execute(url, options = {}) {
    const pipelineId = this.generateId();

    if (this.activePipelines.size >= this.config.maxConcurrentPipelines) {
      return {
        success: false,
        error: '已达到最大并发管道数，请稍后重试',
        queuePosition: this.activePipelines.size
      };
    }

    const pipeline = {
      id: pipelineId,
      url,
      status: 'initialized',
      startTime: Date.now(),
      options,
      steps: [],
      result: null,
      error: null
    };

    this.activePipelines.set(pipelineId, pipeline);

    try {
      logger.info('[Pipeline] 开始执行视频转录管道', { pipelineId, url });

      progressNotifierService.emit(pipelineId, ProgressEvents.VIDEO_DOWNLOAD_START, {
        url,
        step: 1,
        totalSteps: 5
      });

      const downloadResult = await this.executeStep(
        pipelineId,
        'video_download',
        () => videoDownloaderService.downloadVideo(url, options.download),
        { step: 1, totalSteps: 5 }
      );

      if (!downloadResult.success) {
        throw new Error(`视频下载失败: ${downloadResult.error}`);
      }

      pipeline.steps.push({ name: 'download', result: downloadResult });

      const videoPath = downloadResult.outputPath;

      progressNotifierService.emit(pipelineId, ProgressEvents.AUDIO_EXTRACTION_START, {
        step: 2,
        totalSteps: 5
      });

      const audioPath = videoPath.replace(/\.[^.]+$/, '.mp3');
      const audioResult = await this.executeStep(
        pipelineId,
        'audio_extraction',
        () => videoDownloaderService.extractAudio(videoPath, audioPath, options.audio),
        { step: 2, totalSteps: 5 }
      );

      if (!audioResult.success) {
        throw new Error(`音频提取失败: ${audioResult.error}`);
      }

      pipeline.steps.push({ name: 'audio_extraction', result: audioResult });

      progressNotifierService.emit(pipelineId, ProgressEvents.TRANSCRIPTION_START, {
        step: 3,
        totalSteps: 5,
        audioPath
      });

      const transcriptionResult = await this.executeStep(
        pipelineId,
        'transcription',
        () => transcriptionService.transcribeWithTimestamps(audioPath, options.transcription),
        { step: 3, totalSteps: 5 }
      );

      if (!transcriptionResult.success) {
        throw new Error(`转录失败: ${transcriptionResult.error}`);
      }

      pipeline.steps.push({ name: 'transcription', result: transcriptionResult });

      progressNotifierService.emit(pipelineId, ProgressEvents.TEXT_OPTIMIZATION_START, {
        step: 4,
        totalSteps: 5
      });

      const textResult = await this.executeStep(
        pipelineId,
        'text_optimization',
        () => textOptimizationService.fullOptimization(transcriptionResult.fullText, options.optimization),
        { step: 4, totalSteps: 5 }
      );

      pipeline.steps.push({ name: 'optimization', result: textResult });

      if (options.translate || options.summarize) {
        progressNotifierService.emit(pipelineId, ProgressEvents.SUMMARY_GENERATION_START, {
          step: 5,
          totalSteps: 5
        });

        const language = options.targetLanguage || 'zh';

        const multilingualResult = await this.executeStep(
          pipelineId,
          'multilingual',
          () => {
            if (options.translate && options.summarize) {
              return multilingualService.translateAndSummarize(
                textResult.success ? textResult.optimizedText : transcriptionResult.fullText,
                { targetLanguage: language }
              );
            } else if (options.translate) {
              return multilingualService.translate(
                textResult.success ? textResult.optimizedText : transcriptionResult.fullText,
                { targetLanguage: language }
              );
            } else {
              return multilingualService.summarize(
                textResult.success ? textResult.optimizedText : transcriptionResult.fullText,
                { language }
              );
            }
          },
          { step: 5, totalSteps: 5 }
        );

        pipeline.steps.push({ name: 'multilingual', result: multilingualResult });
      }

      pipeline.status = 'completed';
      pipeline.endTime = Date.now();
      pipeline.duration = pipeline.endTime - pipeline.startTime;

      const result = {
        videoPath,
        audioPath,
        transcription: transcriptionResult,
        optimization: textResult.success ? textResult : null,
        originalText: transcriptionResult.fullText,
        optimizedText: textResult.success ? textResult.optimizedText : transcriptionResult.fullText,
        timestamps: transcriptionResult.timestamps,
        srt: transcriptionResult.srt,
        vtt: transcriptionResult.vtt,
        duration: pipeline.duration
      };

      if (pipeline.steps.find(s => s.name === 'multilingual')) {
        const multilingualStep = pipeline.steps.find(s => s.name === 'multilingual');
        result.multilingual = multilingualStep.result;
      }

      pipeline.result = result;

      progressNotifierService.emitComplete(pipelineId, result);

      this.addToHistory(pipeline);
      this.activePipelines.delete(pipelineId);

      return {
        success: true,
        pipelineId,
        ...result
      };
    } catch (error) {
      pipeline.status = 'failed';
      pipeline.error = error.message;
      pipeline.endTime = Date.now();

      progressNotifierService.emitError(pipelineId, error);

      this.addToHistory(pipeline);
      this.activePipelines.delete(pipelineId);

      logger.error('[Pipeline] 管道执行失败', { pipelineId, error: error.message });

      return {
        success: false,
        pipelineId,
        error: error.message
      };
    }
  }

  async executeStep(pipelineId, stepName, stepFn, progress) {
    try {
      progressNotifierService.emitProgress(pipelineId, stepName, 0, progress);

      const result = await stepFn();

      progressNotifierService.emitProgress(pipelineId, stepName, 100, progress);

      return result;
    } catch (error) {
      logger.error('[Pipeline] 步骤执行失败', { pipelineId, stepName, error: error.message });
      throw error;
    }
  }

  async executeWithRetry(pipelineId, stepName, stepFn, progress, attempts = this.config.retryAttempts) {
    let lastError;

    for (let i = 0; i < attempts; i++) {
      try {
        return await this.executeStep(pipelineId, stepName, stepFn, progress);
      } catch (error) {
        lastError = error;
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          logger.warn('[Pipeline] 重试步骤', { pipelineId, stepName, attempt: i + 1 });
        }
      }
    }

    throw lastError;
  }

  async quickTranscribe(url, options = {}) {
    const pipelineId = this.generateId();

    try {
      progressNotifierService.emit(pipelineId, ProgressEvents.VIDEO_DOWNLOAD_START, {
        url,
        step: 1,
        totalSteps: 2
      });

      const audioResult = await videoDownloaderService.downloadAudio(url, options.download);

      if (!audioResult.success) {
        throw new Error(audioResult.error);
      }

      progressNotifierService.emit(pipelineId, ProgressEvents.TRANSCRIPTION_START, {
        step: 2,
        totalSteps: 2
      });

      const transcriptionResult = await transcriptionService.transcribe(audioResult.outputPath, options.transcription);

      if (!transcriptionResult.success) {
        throw new Error(transcriptionResult.error);
      }

      progressNotifierService.emitComplete(pipelineId, transcriptionResult);

      return {
        success: true,
        pipelineId,
        ...transcriptionResult
      };
    } catch (error) {
      progressNotifierService.emitError(pipelineId, error);
      return { success: false, pipelineId, error: error.message };
    }
  }

  async batchExecute(urls, options = {}) {
    const results = [];

    for (const url of urls) {
      const result = await this.execute(url, options);
      results.push({
        url,
        ...result
      });
    }

    return {
      total: urls.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  getPipelineStatus(pipelineId) {
    const active = this.activePipelines.get(pipelineId);
    if (active) {
      return {
        active: true,
        ...active,
        elapsed: Date.now() - active.startTime
      };
    }

    const historyItem = this.pipelineHistory.find(p => p.id === pipelineId);
    if (historyItem) {
      return {
        active: false,
        ...historyItem
      };
    }

    return null;
  }

  cancelPipeline(pipelineId) {
    const pipeline = this.activePipelines.get(pipelineId);
    if (!pipeline) {
      return { success: false, error: '管道不存在或已完成' };
    }

    pipeline.status = 'cancelled';
    pipeline.endTime = Date.now();

    progressNotifierService.emit(pipelineId, ProgressEvents.TASK_ERROR, {
      status: 'cancelled',
      message: '用户取消'
    });

    this.addToHistory(pipeline);
    this.activePipelines.delete(pipelineId);

    return { success: true, message: '管道已取消' };
  }

  addToHistory(pipeline) {
    const historyEntry = {
      id: pipeline.id,
      url: pipeline.url,
      status: pipeline.status,
      startTime: pipeline.startTime,
      endTime: pipeline.endTime,
      duration: pipeline.duration,
      error: pipeline.error
    };

    this.pipelineHistory.unshift(historyEntry);

    if (this.pipelineHistory.length > this.maxHistorySize) {
      this.pipelineHistory = this.pipelineHistory.slice(0, this.maxHistorySize);
    }
  }

  getHistory(options = {}) {
    let history = [...this.pipelineHistory];

    if (options.status) {
      history = history.filter(p => p.status === options.status);
    }

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  getStats() {
    const total = this.pipelineHistory.length;
    const completed = this.pipelineHistory.filter(p => p.status === 'completed').length;
    const failed = this.pipelineHistory.filter(p => p.status === 'failed').length;
    const cancelled = this.pipelineHistory.filter(p => p.status === 'cancelled').length;

    const avgDuration = completed > 0
      ? this.pipelineHistory
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.duration || 0), 0) / completed
      : 0;

    return {
      total,
      completed,
      failed,
      cancelled,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgDuration: Math.round(avgDuration),
      activePipelines: this.activePipelines.size
    };
  }

  generateId() {
    return `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return { ...this.config };
  }
}

const videoTranscriptionPipeline = new VideoTranscriptionPipeline();

module.exports = {
  VideoTranscriptionPipeline,
  videoTranscriptionPipeline
};
