/**
 * 转录引擎管理器
 * 管理多个转录引擎，支持引擎切换和降级
 */

const logger = require('../utils/logger');
const BaseTranscriber = require('./BaseTranscriber');
const WhisperLocalTranscriber = require('./WhisperLocalTranscriber');
const AliyunASRTranscriber = require('./AliyunASRTranscriber');
const TaskQueue = require('./TaskQueue');
const path = require('path');

class TranscriptionEngine {
  constructor() {
    this.engines = new Map();
    this.defaultEngine = null;
    this.fallbackOrder = [];
    this.taskQueue = new TaskQueue();
    this.config = null;

    // 初始化引擎
    this.initializeEngines();
  }

  /**
   * 初始化所有转录引擎
   */
  initializeEngines() {
    // 加载配置
    this.loadConfig();

    // 注册本地 Whisper
    if (this.config?.engines?.['whisper-local']?.enabled !== false) {
      const whisperConfig = this.config?.engines?.['whisper-local'] || {};
      const whisperTranscriber = new WhisperLocalTranscriber(whisperConfig);
      this.registerEngine('whisper-local', whisperTranscriber);
      if (!this.defaultEngine) {
        this.defaultEngine = 'whisper-local';
      }
    }

    // 注册阿里云 ASR
    if (this.config?.engines?.['aliyun-asr']?.enabled !== false) {
      const aliyunConfig = this.config?.engines?.['aliyun-asr'] || {};
      const aliyunTranscriber = new AliyunASRTranscriber(aliyunConfig);
      this.registerEngine('aliyun-asr', aliyunTranscriber);

      // 设置为备用引擎
      if (this.config?.fallback?.enabled !== false) {
        this.fallbackOrder.push('aliyun-asr');
      }
    }

    logger.info('[TranscriptionEngine] 引擎初始化完成', {
      engines: Array.from(this.engines.keys()),
      default: this.defaultEngine,
      fallback: this.fallbackOrder
    });
  }

  /**
   * 加载配置
   */
  loadConfig() {
    try {
      const configPath = path.join(__dirname, '../config/transcription.yaml');
      const fs = require('fs');

      if (fs.existsSync(configPath)) {
        const yaml = require('js-yaml');
        const content = fs.readFileSync(configPath, 'utf-8');
        this.config = yaml.load(content);
        logger.info('[TranscriptionEngine] 配置加载成功');
      } else {
        // 使用默认配置
        this.config = {
          default_engine: 'whisper-local',
          engines: {
            'whisper-local': {
              enabled: true,
              model: 'medium',
              device: 'cuda',
              language: 'auto'
            },
            'aliyun-asr': {
              enabled: true
            }
          },
          fallback: {
            enabled: true,
            order: ['aliyun-asr'],
            retry_count: 2
          }
        };
        logger.info('[TranscriptionEngine] 使用默认配置');
      }
    } catch (error) {
      logger.warn('[TranscriptionEngine] 配置加载失败，使用默认配置', { error: error.message });
      this.config = {};
    }
  }

  /**
   * 注册引擎
   * @param {string} name - 引擎名称
   * @param {BaseTranscriber} transcriber - 转录器实例
   */
  registerEngine(name, transcriber) {
    if (!(transcriber instanceof BaseTranscriber)) {
      throw new Error('Transcriber must be an instance of BaseTranscriber');
    }
    this.engines.set(name, transcriber);
    logger.info(`[TranscriptionEngine] 注册引擎: ${name}`);
  }

  /**
   * 获取引擎
   * @param {string} name - 引擎名称
   * @returns {BaseTranscriber|null}
   */
  getEngine(name) {
    return this.engines.get(name) || null;
  }

  /**
   * 获取默认引擎
   * @returns {BaseTranscriber|null}
   */
  getDefaultEngine() {
    return this.getEngine(this.defaultEngine);
  }

  /**
   * 列出所有引擎
   * @returns {Object[]}
   */
  listEngines() {
    const result = [];
    for (const [name, engine] of this.engines) {
      result.push({
        name,
        ...engine.getEngineInfo()
      });
    }
    return result;
  }

  /**
   * 转录媒体文件
   * @param {string} mediaPath - 媒体文件路径
   * @param {Object} options - 转录选项
   * @returns {Promise<TranscriptResult>}
   */
  async transcribe(mediaPath, options = {}) {
    const engineName = options.engine || this.defaultEngine;
    const engine = this.getEngine(engineName);

    if (!engine) {
      logger.error(`[TranscriptionEngine] 引擎不存在: ${engineName}`);
      return {
        success: false,
        engine: engineName,
        error: `引擎不存在: ${engineName}`,
        text: '',
        segments: []
      };
    }

    // 验证文件
    const fileExists = await engine.validateFile(mediaPath);
    if (!fileExists) {
      return {
        success: false,
        engine: engineName,
        error: '文件不存在',
        text: '',
        segments: []
      };
    }

    // 验证格式
    if (!engine.isFormatSupported(mediaPath)) {
      return {
        success: false,
        engine: engineName,
        error: '不支持的文件格式',
        text: '',
        segments: []
      };
    }

    const startTime = Date.now();

    try {
      logger.info(`[TranscriptionEngine] 开始转录`, { engine: engineName, mediaPath });

      const result = await engine.transcribe(mediaPath, options);
      result.metadata.processingTime = Date.now() - startTime;

      if (result.success) {
        logger.info(`[TranscriptionEngine] 转录成功`, {
          engine: engineName,
          duration: result.duration,
          textLength: result.text.length
        });
        return result;
      }

      // 转录失败，尝试备用引擎
      if (this.config?.fallback?.enabled) {
        return await this.tryFallback(mediaPath, options, result.error);
      }

      return result;
    } catch (error) {
      logger.error(`[TranscriptionEngine] 转录失败`, { error: error.message });

      // 尝试备用引擎
      if (this.config?.fallback?.enabled) {
        return await this.tryFallback(mediaPath, options, error.message);
      }

      return {
        success: false,
        engine: engineName,
        error: error.message,
        text: '',
        segments: [],
        metadata: { processingTime: Date.now() - startTime }
      };
    }
  }

  /**
   * 尝试备用引擎
   * @param {string} mediaPath - 媒体路径
   * @param {Object} options - 选项
   * @param {string} previousError - 之前的错误
   * @returns {Promise<TranscriptResult>}
   */
  async tryFallback(mediaPath, options, previousError) {
    const retryCount = this.config?.fallback?.retry_count || 2;

    for (const engineName of this.fallbackOrder) {
      const engine = this.getEngine(engineName);
      if (!engine || engineName === options.engine) {
        continue;
      }

      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          logger.info(`[TranscriptionEngine] 尝试备用引擎`, {
            engine: engineName,
            attempt
          });

          const result = await engine.transcribe(mediaPath, options);

          if (result.success) {
            logger.info(`[TranscriptionEngine] 备用引擎转录成功`, { engine: engineName });
            return result;
          }
        } catch (error) {
          logger.warn(`[TranscriptionEngine] 备用引擎失败`, {
            engine: engineName,
            attempt,
            error: error.message
          });
        }
      }
    }

    return {
      success: false,
      engine: 'fallback',
      error: `所有引擎转录失败: ${previousError}`,
      text: '',
      segments: []
    };
  }

  /**
   * 提交转录任务（异步）
   * @param {Object} task - 任务信息
   * @returns {string} 任务ID
   */
  async submitTask(task) {
    const taskId = this.taskQueue.addTask(task);
    logger.info(`[TranscriptionEngine] 提交转录任务`, { taskId, videoId: task.videoId });

    // 异步执行转录
    this.processTask(taskId, task).catch(error => {
      logger.error(`[TranscriptionEngine] 任务执行失败`, { taskId, error: error.message });
    });

    return taskId;
  }

  /**
   * 处理转录任务
   * @param {string} taskId - 任务ID
   * @param {Object} task - 任务信息
   */
  async processTask(taskId, task) {
    this.taskQueue.updateStatus(taskId, 'processing');

    try {
      const result = await this.transcribe(task.mediaPath, task.options);

      if (result.success) {
        this.taskQueue.updateStatus(taskId, 'completed', result);
      } else {
        this.taskQueue.updateStatus(taskId, 'failed', { error: result.error });
      }
    } catch (error) {
      this.taskQueue.updateStatus(taskId, 'failed', { error: error.message });
    }
  }

  /**
   * 查询任务状态
   * @param {string} taskId - 任务ID
   * @returns {Object|null}
   */
  getTaskStatus(taskId) {
    return this.taskQueue.getTask(taskId);
  }

  /**
   * 获取任务队列状态
   * @returns {Object}
   */
  getQueueStatus() {
    return this.taskQueue.getStatus();
  }

  /**
   * 取消任务
   * @param {string} taskId - 任务ID
   * @returns {boolean}
   */
  cancelTask(taskId) {
    return this.taskQueue.cancel(taskId);
  }
}

module.exports = TranscriptionEngine;
