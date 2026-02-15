/**
 * 视频存储管理器
 * 管理视频文件的本地存储和元数据
 */

const { logger } = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const NodeCache = require('node-cache');

class VideoStorage {
  constructor() {
    // 视频存储目录
    this.baseDir = process.env.VIDEO_STORAGE_DIR || path.join(process.cwd(), 'storage', 'videos');
    // 视频元数据缓存
    this.cache = new NodeCache({
      stdTTL: 3600, // 1小时缓存
      checkperiod: 600
    });
    // 视频元数据映射
    this.metadataFile = path.join(this.baseDir, 'metadata.json');
    this.metadata = new Map();
  }

  /**
   * 初始化存储
   */
  async init() {
    try {
      // 确保存储目录存在
      await fs.mkdir(this.baseDir, { recursive: true });

      // 加载已有元数据
      try {
        const data = await fs.readFile(this.metadataFile, 'utf-8');
        const parsed = JSON.parse(data);
        for (const [key, value] of Object.entries(parsed)) {
          this.metadata.set(key, value);
        }
        logger.info('[VideoStorage] 加载元数据完成', { count: this.metadata.size });
      } catch (error) {
        // 元数据文件不存在，忽略
        logger.info('[VideoStorage] 元数据文件不存在，将创建新文件');
      }
    } catch (error) {
      logger.error('[VideoStorage] 初始化失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取视频存储目录
   * @returns {string}
   */
  getVideoDir() {
    return this.baseDir;
  }

  /**
   * 保存视频信息
   * @param {string} videoId - 视频ID
   * @param {Object} info - 视频信息
   */
  async saveVideo(videoId, info) {
    try {
      this.metadata.set(videoId, info);
      this.cache.set(videoId, info);

      // 持久化到文件
      await this.persistMetadata();

      logger.debug('[VideoStorage] 保存视频信息', { videoId });
    } catch (error) {
      logger.error('[VideoStorage] 保存视频信息失败', { videoId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取视频信息
   * @param {string} videoId - 视频ID
   * @returns {Object|null}
   */
  getVideoInfo(videoId) {
    // 先从缓存获取
    let info = this.cache.get(videoId);
    if (info) {
      return info;
    }

    // 从元数据获取
    info = this.metadata.get(videoId);
    if (info) {
      this.cache.set(videoId, info);
    }

    return info || null;
  }

  /**
   * 获取视频文件路径
   * @param {string} videoId - 视频ID
   * @returns {string|null}
   */
  getVideoPath(videoId) {
    const info = this.getVideoInfo(videoId);
    return info ? info.localPath : null;
  }

  /**
   * 列出视频
   * @param {Object} query - 查询条件
   * @returns {Array}
   */
  listVideos(query = {}) {
    const videos = Array.from(this.metadata.values());

    let filtered = videos;

    // 按平台筛选
    if (query.platform) {
      filtered = filtered.filter(v => v.platform === query.platform);
    }

    // 按状态筛选
    if (query.status) {
      filtered = filtered.filter(v => v.status === query.status);
    }

    // 按时间排序（最新的在前）
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      total: filtered.length,
      page,
      pageSize,
      data: filtered.slice(start, end)
    };
  }

  /**
   * 删除视频
   * @param {string} videoId - 视频ID
   * @returns {boolean}
   */
  async deleteVideo(videoId) {
    try {
      const info = this.metadata.get(videoId);
      if (!info) {
        return false;
      }

      // 删除视频文件
      if (info.localPath) {
        try {
          await fs.unlink(info.localPath);
        } catch (error) {
          logger.warn('[VideoStorage] 删除视频文件失败', { videoId, error: error.message });
        }
      }

      // 删除元数据
      this.metadata.delete(videoId);
      this.cache.del(videoId);

      // 持久化
      await this.persistMetadata();

      logger.info('[VideoStorage] 删除视频完成', { videoId });
      return true;
    } catch (error) {
      logger.error('[VideoStorage] 删除视频失败', { videoId, error: error.message });
      return false;
    }
  }

  /**
   * 更新视频状态
   * @param {string} videoId - 视频ID
   * @param {string} status - 新状态
   * @param {Object} extra - 额外信息
   */
  async updateStatus(videoId, status, extra = {}) {
    const info = this.metadata.get(videoId);
    if (!info) {
      return false;
    }

    info.status = status;
    info.updatedAt = new Date().toISOString();
    Object.assign(info, extra);

    this.metadata.set(videoId, info);
    this.cache.set(videoId, info);

    await this.persistMetadata();
    return true;
  }

  /**
   * 持久化元数据到文件
   */
  async persistMetadata() {
    try {
      const data = Object.fromEntries(this.metadata);
      await fs.writeFile(this.metadataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error('[VideoStorage] 持久化元数据失败', { error: error.message });
    }
  }

  /**
   * 获取存储统计
   * @returns {Object}
   */
  getStats() {
    const videos = Array.from(this.metadata.values());
    const totalSize = videos.reduce((sum, v) => sum + (v.fileSize || 0), 0);

    return {
      totalVideos: videos.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      byPlatform: this.groupBy(videos, 'platform'),
      byStatus: this.groupBy(videos, 'status')
    };
  }

  /**
   * 分组统计
   * @param {Array} arr - 数组
   * @param {string} key - 分组键
   * @returns {Object}
   */
  groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const value = item[key] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * 清理过期视频
   * @param {number} days - 过期天数
   * @returns {number} 清理数量
   */
  async cleanupExpired(days = 7) {
    const expireTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const videos = Array.from(this.metadata.values());
    let cleaned = 0;

    for (const video of videos) {
      const createdAt = new Date(video.createdAt).getTime();
      if (createdAt < expireTime) {
        await this.deleteVideo(video.videoId);
        cleaned++;
      }
    }

    logger.info('[VideoStorage] 清理过期视频完成', { cleaned, days });
    return cleaned;
  }
}

// 初始化
const videoStorage = new VideoStorage();
videoStorage.init().catch(err => {
  logger.error('[VideoStorage] 初始化失败', { error: err.message });
});

module.exports = videoStorage;
