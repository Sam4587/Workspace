/**
 * 视频下载模块入口
 * 提供视频下载、去水印、存储管理等核心功能
 */

const Downloader = require('./Downloader');
const DouyinDownloader = require('./downloaders/DouyinDownloader');
const KuaishouDownloader = require('./downloaders/KuaishouDownloader');
const GenericDownloader = require('./downloaders/GenericDownloader');
const WatermarkRemover = require('./WatermarkRemover');
const videoStorage = require('./VideoStorage');
const logger = require('../utils/logger');

/**
 * 视频模块管理器
 */
class VideoManager {
  constructor() {
    this.storage = videoStorage;
    this.watermarkRemover = new WatermarkRemover();
    this.downloaders = new Map();

    // 注册下载器
    this.registerDownloaders();
  }

  /**
   * 注册所有下载器
   */
  registerDownloaders() {
    this.downloaders.set('douyin', new DouyinDownloader(this.storage, this.watermarkRemover));
    this.downloaders.set('kuaishou', new KuaishouDownloader(this.storage, this.watermarkRemover));
    this.downloaders.set('generic', new GenericDownloader(this.storage, this.watermarkRemover));

    logger.info('[VideoManager] 下载器注册完成', {
      platforms: Array.from(this.downloaders.keys())
    });
  }

  /**
   * 识别视频平台
   * @param {string} url - 视频链接
   * @returns {{ platform: string, videoId: string } | null}
   */
  identifyPlatform(url) {
    // 抖音链接格式
    const douyinPatterns = [
      /v\.douyin\.com\/([A-Za-z0-9]+)/,
      /www\.douyin\.com\/video\/(\d+)/,
      /www\.douyin\.com\/note\/(\d+)/
    ];

    // 快手链接格式
    const kuaishouPatterns = [
      /v\.kuaishou\.com\/([A-Za-z0-9]+)/,
      /www\.kuaishou\.com\/short-video\/([A-Za-z0-9]+)/,
      /www\.kuaishou\.com\/photo\/([A-Za-z0-9]+)/
    ];

    // 匹配抖音
    for (const pattern of douyinPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform: 'douyin', videoId: match[1] };
      }
    }

    // 匹配快手
    for (const pattern of kuaishouPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform: 'kuaishou', videoId: match[1] };
      }
    }

    return null;
  }

  /**
   * 下载视频
   * @param {string} url - 视频链接
   * @param {Object} options - 下载选项
   * @returns {Promise<{ success: boolean, videoId?: string, error?: string }>}
   */
  async download(url, options = {}) {
    try {
      const platformInfo = this.identifyPlatform(url);

      if (!platformInfo) {
        logger.warn('[VideoManager] 无法识别的平台，使用通用下载器', { url });
        const genericDownloader = this.downloaders.get('generic');
        return await genericDownloader.download(url, options);
      }

      const { platform } = platformInfo;
      const downloader = this.downloaders.get(platform);

      if (!downloader) {
        logger.error('[VideoManager] 未找到对应下载器', { platform });
        return { success: false, error: `不支持的平台: ${platform}` };
      }

      logger.info('[VideoManager] 开始下载视频', { url, platform });
      const result = await downloader.download(url, options);

      return result;
    } catch (error) {
      logger.error('[VideoManager] 下载失败', { url, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取下载状态
   * @param {string} videoId - 视频ID
   * @returns {Object}
   */
  getStatus(videoId) {
    return this.storage.getVideoInfo(videoId);
  }

  /**
   * 获取视频列表
   * @param {Object} query - 查询条件
   * @returns {Array}
   */
  listVideos(query = {}) {
    return this.storage.listVideos(query);
  }

  /**
   * 删除视频
   * @param {string} videoId - 视频ID
   * @returns {boolean}
   */
  deleteVideo(videoId) {
    return this.storage.deleteVideo(videoId);
  }
}

// 导出单例和管理器类
const videoManager = new VideoManager();

module.exports = {
  VideoManager,
  videoManager,
  Downloader,
  DouyinDownloader,
  KuaishouDownloader,
  GenericDownloader,
  WatermarkRemover,
  VideoStorage: videoStorage
};
