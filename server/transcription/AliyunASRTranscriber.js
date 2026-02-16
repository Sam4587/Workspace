/**
 * 阿里云 ASR 转录器
 * 使用阿里云智能语音服务进行语音识别
 */

const BaseTranscriber = require('./BaseTranscriber');
const logger = require('../utils/logger');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AliyunASRTranscriber extends BaseTranscriber {
  constructor(config = {}) {
    super(config);
    this.name = 'aliyun-asr';

    // 阿里云配置
    this.appKey = config.app_key || process.env.ALIYUN_ASR_APP_KEY || '';
    this.accessKeyId = config.access_key_id || process.env.ALIYUN_ACCESS_KEY_ID || '';
    this.accessKeySecret = config.access_key_secret || process.env.ALIYUN_ACCESS_KEY_SECRET || '';
    this.region = config.region || 'cn-shanghai';

    // API 端点
    this.endpoint = `https://nls-gateway.${this.region}.aliyuncs.com`;

    // 任务状态缓存
    this.taskCache = new Map();
  }

  /**
   * 转录媒体文件
   * @param {string} mediaPath - 媒体文件路径
   * @param {Object} options - 转录选项
   * @returns {Promise<TranscriptResult>}
   */
  async transcribe(mediaPath, options = {}) {
    const startTime = Date.now();

    try {
      this.log('info', '开始阿里云 ASR 转录', { mediaPath });

      // 检查配置
      if (!this.appKey || !this.accessKeyId || !this.accessKeySecret) {
        return this.createResult({
          success: false,
          error: '阿里云 ASR 配置不完整',
          processingTime: Date.now() - startTime
        });
      }

      // 上传文件并创建转录任务
      const taskResult = await this.createTranscriptionTask(mediaPath, options);

      if (!taskResult.success) {
        return this.createResult({
          success: false,
          error: taskResult.error || '创建转录任务失败',
          processingTime: Date.now() - startTime
        });
      }

      // 轮询获取结果
      const result = await this.pollTaskResult(taskResult.taskId, options.timeout || this.timeout);

      if (!result.success) {
        return this.createResult({
          success: false,
          error: result.error || '转录失败',
          processingTime: Date.now() - startTime
        });
      }

      this.log('info', '阿里云 ASR 转录完成', {
        duration: result.duration,
        textLength: result.text.length
      });

      return this.createResult({
        success: true,
        duration: result.duration,
        language: result.language || 'zh-CN',
        text: result.text,
        segments: result.segments || [],
        processingTime: Date.now() - startTime,
        metadata: {
          taskId: taskResult.taskId,
          provider: 'aliyun-asr'
        }
      });
    } catch (error) {
      this.log('error', '阿里云 ASR 转录失败', { error: error.message });
      return this.createResult({
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 创建转录任务
   * @param {string} mediaPath - 媒体路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async createTranscriptionTask(mediaPath, options = {}) {
    try {
      // 读取文件内容
      const fileBuffer = await fs.readFile(mediaPath);
      const fileUrl = await this.uploadFile(fileBuffer, mediaPath);

      // 构建请求
      const url = `${this.endpoint}/stream/v1/FlashRecognizer`;
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomBytes(16).toString('hex');

      const params = {
        appkey: this.appKey,
        file_link: fileUrl,
        version: '4.0',
        enable_words: true,
        enable_punctuation_prediction: true,
        enable_inverse_text_normalization: true
      };

      // 生成签名
      const signature = this.generateSignature(params, timestamp, nonce);

      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/json',
          'X-NLS-Token': this.generateToken(),
          'Date': new Date().toUTCString()
        },
        timeout: 30000
      });

      if (response.data && response.data.task_id) {
        return {
          success: true,
          taskId: response.data.task_id
        };
      }

      return {
        success: false,
        error: response.data?.message || '创建任务失败'
      };
    } catch (error) {
      this.log('error', '创建转录任务失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 上传文件到 OSS（简化版本）
   * 实际使用时需要配置 OSS
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} filePath - 原始路径
   * @returns {Promise<string>} 文件 URL
   */
  async uploadFile(fileBuffer, filePath) {
    // 如果配置了 OSS，上传到 OSS
    // 这里简化处理，返回本地路径
    // 实际生产环境需要上传到 OSS 或其他存储
    const fileName = path.basename(filePath);
    return `file://${filePath}`;
  }

  /**
   * 轮询获取任务结果
   * @param {string} taskId - 任务ID
   * @param {number} timeout - 超时时间
   * @returns {Promise<Object>}
   */
  async pollTaskResult(taskId, timeout = 300000) {
    const startTime = Date.now();
    const pollInterval = 3000; // 3秒轮询一次

    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.queryTaskResult(taskId);

        if (result.status === 'completed') {
          return {
            success: true,
            text: result.text,
            segments: result.segments,
            duration: result.duration,
            language: result.language
          };
        }

        if (result.status === 'failed') {
          return {
            success: false,
            error: result.error || '转录失败'
          };
        }

        // 等待后继续轮询
        await this.sleep(pollInterval);
      } catch (error) {
        this.log('warn', '查询任务结果失败', { taskId, error: error.message });
        await this.sleep(pollInterval);
      }
    }

    return {
      success: false,
      error: '转录超时'
    };
  }

  /**
   * 查询任务结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>}
   */
  async queryTaskResult(taskId) {
    const url = `${this.endpoint}/stream/v1/FlashRecognizer/Result`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const params = {
      appkey: this.appKey,
      task_id: taskId
    };

    const response = await axios.get(url, {
      params,
      headers: {
        'X-NLS-Token': this.generateToken(),
        'Date': new Date().toUTCString()
      },
      timeout: 10000
    });

    const data = response.data;

    if (data.status === 'SUCCESS') {
      // 解析转录结果
      const sentences = data.flash_result?.sentences || [];
      const text = sentences.map(s => s.text).join('');
      const segments = sentences.map((s, idx) => ({
        index: idx,
        start: s.begin_time / 1000,
        end: s.end_time / 1000,
        text: s.text,
        confidence: s.confidence || 0.9
      }));

      const lastSentence = sentences[sentences.length - 1];
      const duration = lastSentence ? lastSentence.end_time / 1000 : 0;

      return {
        status: 'completed',
        text,
        segments,
        duration,
        language: 'zh-CN'
      };
    }

    if (data.status === 'FAILED') {
      return {
        status: 'failed',
        error: data.message || '转录失败'
      };
    }

    return {
      status: 'processing'
    };
  }

  /**
   * 生成签名
   * @param {Object} params - 参数
   * @param {string} timestamp - 时间戳
   * @param {string} nonce - 随机数
   * @returns {string}
   */
  generateSignature(params, timestamp, nonce) {
    const sortedKeys = Object.keys(params).sort();
    const canonicalizedQueryString = sortedKeys
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const stringToSign = `POST\n${this.endpoint}\n\n${canonicalizedQueryString}`;

    const hmac = crypto.createHmac('sha256', this.accessKeySecret);
    hmac.update(stringToSign);
    return hmac.digest('base64');
  }

  /**
   * 生成 Token（简化版本）
   * 实际使用时需要使用阿里云 SDK 生成
   * @returns {string}
   */
  generateToken() {
    // 这里简化处理，实际需要使用阿里云 SDK 生成有效 Token
    return this.accessKeyId;
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AliyunASRTranscriber;
