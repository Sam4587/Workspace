/**
 * 转录器抽象基类
 */

const logger = require('../utils/logger');

class BaseTranscriber {
  constructor(config = {}) {
    this.name = config.name || 'base';
    this.enabled = config.enabled !== false;
    this.timeout = config.timeout || 300000; // 5分钟超时
    this.language = config.language || 'auto';
  }

  /**
   * 转录音频/视频 - 子类必须实现
   * @param {string} mediaPath - 媒体文件路径
   * @param {Object} options - 转录选项
   * @returns {Promise<TranscriptResult>}
   */
  async transcribe(mediaPath, options = {}) {
    throw new Error('transcribe() must be implemented by subclass');
  }

  /**
   * 获取支持的格式
   * @returns {string[]}
   */
  getSupportedFormats() {
    return ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.mkv', '.webm', '.avi', '.mov'];
  }

  /**
   * 获取引擎信息
   * @returns {Object}
   */
  getEngineInfo() {
    return {
      name: this.name,
      enabled: this.enabled,
      language: this.language,
      supportedFormats: this.getSupportedFormats()
    };
  }

  /**
   * 检查是否支持该格式
   * @param {string} filePath - 文件路径
   * @returns {boolean}
   */
  isFormatSupported(filePath) {
    const path = require('path');
    const ext = path.extname(filePath).toLowerCase();
    return this.getSupportedFormats().includes(ext);
  }

  /**
   * 验证文件是否存在
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>}
   */
  async validateFile(filePath) {
    const fs = require('fs').promises;
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 创建标准转录结果
   * @param {Object} params - 结果参数
   * @returns {TranscriptResult}
   */
  createResult(params) {
    return {
      success: params.success !== false,
      engine: this.name,
      duration: params.duration || 0,
      language: params.language || this.language,
      text: params.text || '',
      segments: params.segments || [],
      keywords: params.keywords || [],
      metadata: {
        modelSize: params.modelSize,
        processingTime: params.processingTime || 0,
        ...params.metadata
      },
      error: params.error || null
    };
  }

  /**
   * 记录转录日志
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  log(level, message, data = {}) {
    const logData = { engine: this.name, ...data };
    logger[level](`[${this.name}] ${message}`, logData);
  }
}

module.exports = BaseTranscriber;
