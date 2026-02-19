/**
 * InfiniteTalk 服务接口
 * IT-001: 服务接口设计与适配层
 * 
 * 功能：
 * - 视频配音生成
 * - 音频特征提取
 * - 说话视频合成
 */

const axios = require('axios');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class InfiniteTalkService {
  constructor() {
    this.config = {
      baseUrl: process.env.INFINITETALK_API_URL || 'http://localhost:8000',
      apiKey: process.env.INFINITETALK_API_KEY,
      timeout: parseInt(process.env.INFINITETALK_TIMEOUT) || 120000,
      modelPath: process.env.INFINITETALK_MODEL_PATH,
      wanModelPath: process.env.WAN_MODEL_PATH,
      wav2vecModelPath: process.env.WAV2VEC_MODEL_PATH
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });

    this.taskCache = new Map();
    this.maxCacheSize = 100;
  }

  async checkHealth() {
    try {
      const response = await this.httpClient.get('/health');
      return {
        healthy: true,
        status: response.data.status,
        models: response.data.models || {},
        gpu: response.data.gpu || {}
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 健康检查失败', { error: error.message });
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  async generateTalkingVideo(options) {
    const {
      sourceImage,
      audioFile,
      audioText,
      outputFormat = 'mp4',
      fps = 25,
      resolution = '480p',
      enhanceAudio = true,
      smoothVideo = true
    } = options;

    const taskId = this.generateTaskId();

    try {
      logger.info('[InfiniteTalk] 开始生成说话视频', { taskId });

      const payload = {
        task_id: taskId,
        source_image: sourceImage,
        audio_file: audioFile,
        audio_text: audioText,
        output_format: outputFormat,
        fps,
        resolution,
        enhance_audio: enhanceAudio,
        smooth_video: smoothVideo
      };

      const response = await this.httpClient.post('/api/generate', payload);

      const task = {
        id: taskId,
        status: 'processing',
        createdAt: new Date().toISOString(),
        options,
        result: null
      };

      this.taskCache.set(taskId, task);

      return {
        success: true,
        taskId,
        status: 'processing',
        estimatedTime: response.data.estimated_time || 60
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 生成说话视频失败', {
        taskId,
        error: error.message
      });

      return {
        success: false,
        taskId,
        error: error.message
      };
    }
  }

  async getTaskStatus(taskId) {
    const cachedTask = this.taskCache.get(taskId);
    
    try {
      const response = await this.httpClient.get(`/api/task/${taskId}`);
      
      const task = {
        id: taskId,
        status: response.data.status,
        progress: response.data.progress || 0,
        result: response.data.result,
        error: response.data.error,
        createdAt: response.data.created_at,
        completedAt: response.data.completed_at
      };

      if (cachedTask) {
        Object.assign(cachedTask, task);
      } else {
        this.taskCache.set(taskId, task);
      }

      return task;
    } catch (error) {
      if (cachedTask) {
        return cachedTask;
      }
      
      return {
        id: taskId,
        status: 'unknown',
        error: error.message
      };
    }
  }

  async cancelTask(taskId) {
    try {
      await this.httpClient.post(`/api/task/${taskId}/cancel`);
      
      const task = this.taskCache.get(taskId);
      if (task) {
        task.status = 'cancelled';
      }
      
      logger.info('[InfiniteTalk] 任务已取消', { taskId });
      
      return { success: true, taskId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async extractAudioFeatures(audioFile, options = {}) {
    try {
      logger.info('[InfiniteTalk] 提取音频特征', { audioFile });

      const response = await this.httpClient.post('/api/audio/extract-features', {
        audio_file: audioFile,
        extract_mel_spectrogram: options.melSpectrogram !== false,
        extract_wav2vec: options.wav2vec !== false,
        sample_rate: options.sampleRate || 16000
      });

      return {
        success: true,
        features: {
          melSpectrogram: response.data.mel_spectrogram,
          wav2vecFeatures: response.data.wav2vec_features,
          duration: response.data.duration,
          sampleRate: response.data.sample_rate
        }
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 音频特征提取失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async analyzeSpeech(audioFile) {
    try {
      logger.info('[InfiniteTalk] 分析语音内容', { audioFile });

      const response = await this.httpClient.post('/api/audio/analyze-speech', {
        audio_file: audioFile
      });

      return {
        success: true,
        analysis: {
          transcription: response.data.transcription,
          language: response.data.language,
          duration: response.data.duration,
          wordCount: response.data.word_count,
          speakingRate: response.data.speaking_rate,
          emotion: response.data.emotion,
          confidence: response.data.confidence
        }
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 语音分析失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async generateFromText(options) {
    const {
      sourceImage,
      text,
      voiceId = 'default',
      language = 'zh-CN',
      speed = 1.0,
      pitch = 1.0,
      ...videoOptions
    } = options;

    const taskId = this.generateTaskId();

    try {
      logger.info('[InfiniteTalk] 从文本生成说话视频', { taskId, text: text.substring(0, 50) });

      const payload = {
        task_id: taskId,
        source_image: sourceImage,
        text,
        voice_id: voiceId,
        language,
        speed,
        pitch,
        ...videoOptions
      };

      const response = await this.httpClient.post('/api/generate-from-text', payload);

      this.taskCache.set(taskId, {
        id: taskId,
        status: 'processing',
        createdAt: new Date().toISOString(),
        options: payload
      });

      return {
        success: true,
        taskId,
        status: 'processing',
        estimatedTime: response.data.estimated_time || 90
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 从文本生成失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getAvailableVoices() {
    try {
      const response = await this.httpClient.get('/api/voices');
      return {
        success: true,
        voices: response.data.voices || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        voices: []
      };
    }
  }

  async getModels() {
    try {
      const response = await this.httpClient.get('/api/models');
      return {
        success: true,
        models: {
          wan: response.data.wan_model,
          wav2vec: response.data.wav2vec_model,
          infiniteTalk: response.data.infinite_talk_model
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async uploadImage(imagePath) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('image', require('fs').createReadStream(imagePath));

      const response = await this.httpClient.post('/api/upload/image', form, {
        headers: form.getHeaders()
      });

      return {
        success: true,
        imageId: response.data.image_id,
        url: response.data.url
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 图片上传失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async uploadAudio(audioPath) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('audio', require('fs').createReadStream(audioPath));

      const response = await this.httpClient.post('/api/upload/audio', form, {
        headers: form.getHeaders()
      });

      return {
        success: true,
        audioId: response.data.audio_id,
        url: response.data.url,
        duration: response.data.duration
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 音频上传失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async downloadResult(taskId, outputPath) {
    try {
      const response = await this.httpClient.get(`/api/task/${taskId}/download`, {
        responseType: 'arraybuffer'
      });

      await fs.writeFile(outputPath, response.data);

      return {
        success: true,
        path: outputPath,
        size: response.data.length
      };
    } catch (error) {
      logger.error('[InfiniteTalk] 下载结果失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  getTaskHistory(limit = 20) {
    const tasks = Array.from(this.taskCache.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return tasks;
  }

  clearTaskCache() {
    this.taskCache.clear();
    logger.info('[InfiniteTalk] 任务缓存已清空');
  }

  generateTaskId() {
    return `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      configured: !!(this.config.baseUrl && this.config.apiKey)
    };
  }
}

const infiniteTalkService = new InfiniteTalkService();

module.exports = {
  InfiniteTalkService,
  infiniteTalkService
};
