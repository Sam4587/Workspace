/**
 * 视频下载器抽象基类
 */

const logger = require('../utils/logger');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Downloader {
  /**
   * @param {VideoStorage} storage - 存储管理器
   * @param {WatermarkRemover} watermarkRemover - 去水印处理器
   */
  constructor(storage, watermarkRemover) {
    this.storage = storage;
    this.watermarkRemover = watermarkRemover;
    this.platform = 'unknown';
  }

  /**
   * 下载视频 - 子类必须实现
   * @param {string} url - 视频链接
   * @param {Object} options - 下载选项
   * @returns {Promise<{ success: boolean, videoId?: string, error?: string }>}
   */
  async download(url, options = {}) {
    throw new Error('download() must be implemented by subclass');
  }

  /**
   * 获取视频元数据 - 子类必须实现
   * @param {string} url - 视频链接
   * @returns {Promise<Object>}
   */
  async getMetadata(url) {
    throw new Error('getMetadata() must be implemented by subclass');
  }

  /**
   * 生成视频ID
   * @returns {string}
   */
  generateVideoId() {
    return `vid_${Date.now()}_${uuidv4().split('-')[0]}`;
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 带重试的执行
   * @param {Function} fn - 执行函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} delay - 重试间隔
   * @returns {Promise<any>}
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        logger.warn(`[${this.platform}] 重试 ${attempt}/${maxRetries}: ${error.message}`);
        await this.sleep(delay * attempt);
      }
    }
  }

  /**
   * 处理下载结果
   * @param {Object} metadata - 视频元数据
   * @param {string} videoPath - 视频文件路径
   * @param {Object} options - 选项
   * @returns {Promise<{ success: boolean, videoId?: string, error?: string }>}
   */
  async processResult(metadata, videoPath, options = {}) {
    try {
      const videoId = this.generateVideoId();

      // 保存视频信息
      const videoInfo = {
        videoId,
        platform: this.platform,
        title: metadata.title || '未知标题',
        author: metadata.author || '未知作者',
        duration: metadata.duration || 0,
        cover: metadata.cover || '',
        originalUrl: metadata.url || '',
        localPath: videoPath,
        fileSize: metadata.fileSize || 0,
        status: 'downloaded',
        removeWatermark: options.removeWatermark || false,
        createdAt: new Date().toISOString()
      };

      await this.storage.saveVideo(videoId, videoInfo);

      logger.info(`[${this.platform}] 视频下载完成`, { videoId, title: videoInfo.title });

      return { success: true, videoId };
    } catch (error) {
      logger.error(`[${this.platform}] 处理下载结果失败`, { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

module.exports = Downloader;
