/**
 * 快手视频下载器
 * 支持快手短视频链接解析和下载
 */

const Downloader = require('../Downloader');
const { logger } = require('../../utils/logger');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class KuaishouDownloader extends Downloader {
  constructor(storage, watermarkRemover) {
    super(storage, watermarkRemover);
    this.platform = 'kuaishou';
  }

  /**
   * 下载快手视频
   * @param {string} url - 快手视频链接
   * @param {Object} options - 下载选项
   * @returns {Promise<{ success: boolean, videoId?: string, error?: string }>}
   */
  async download(url, options = {}) {
    try {
      logger.info('[KuaishouDownloader] 开始下载快手视频', { url });

      // 1. 获取视频元数据
      const metadata = await this.getMetadata(url);
      if (!metadata) {
        return { success: false, error: '无法获取视频信息' };
      }

      // 2. 使用 yt-dlp 下载视频
      const videoId = this.generateVideoId();
      const outputDir = this.storage.getVideoDir();
      const outputPath = path.join(outputDir, `${videoId}.mp4`);

      const downloadResult = await this.downloadWithYtDlp(url, outputPath, options);

      if (!downloadResult.success) {
        return { success: false, error: downloadResult.error };
      }

      // 3. 如果需要去水印
      let finalPath = outputPath;
      if (options.removeWatermark) {
        const removeResult = await this.watermarkRemover.remove(outputPath, this.platform);
        if (removeResult.success) {
          finalPath = removeResult.outputPath;
        } else {
          logger.warn('[KuaishouDownloader] 去水印失败，保留原视频', { error: removeResult.error });
        }
      }

      // 4. 获取文件大小
      const stats = await fs.stat(finalPath);
      metadata.fileSize = stats.size;

      // 5. 保存视频信息
      const videoInfo = {
        videoId,
        platform: this.platform,
        title: metadata.title || '快手视频',
        author: metadata.uploader || '未知作者',
        duration: metadata.duration || 0,
        cover: metadata.thumbnail || '',
        originalUrl: url,
        localPath: finalPath,
        fileSize: stats.size,
        status: 'downloaded',
        removeWatermark: options.removeWatermark || false,
        createdAt: new Date().toISOString()
      };

      await this.storage.saveVideo(videoId, videoInfo);

      logger.info('[KuaishouDownloader] 视频下载完成', { videoId, title: videoInfo.title });

      return { success: true, videoId, metadata };
    } catch (error) {
      logger.error('[KuaishouDownloader] 下载失败', { url, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取快手视频元数据
   * @param {string} url - 视频链接
   * @returns {Promise<Object>}
   */
  async getMetadata(url) {
    try {
      const metadata = await this.retry(async () => {
        return new Promise((resolve, reject) => {
          const cmd = `yt-dlp --dump-json --no-download "${url}"`;
          exec(cmd, { timeout: 30000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
              reject(new Error(`获取元数据失败: ${error.message}`));
              return;
            }
            try {
              const data = JSON.parse(stdout);
              resolve({
                title: data.title || data.fulltitle || '快手视频',
                uploader: data.uploader || data.channel || '未知作者',
                duration: data.duration || 0,
                thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || '',
                description: data.description || '',
                viewCount: data.view_count || 0,
                likeCount: data.like_count || 0,
                url: url
              });
            } catch (parseError) {
              reject(new Error(`解析元数据失败: ${parseError.message}`));
            }
          });
        });
      }, 3, 2000);

      return metadata;
    } catch (error) {
      logger.error('[KuaishouDownloader] 获取元数据失败', { url, error: error.message });
      return null;
    }
  }

  /**
   * 使用 yt-dlp 下载视频
   * @param {string} url - 视频链接
   * @param {string} outputPath - 输出路径
   * @param {Object} options - 选项
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async downloadWithYtDlp(url, outputPath, options = {}) {
    return new Promise((resolve) => {
      const quality = options.quality || 'best';
      const timeout = options.timeout || 120000;

      // 构建 yt-dlp 命令
      let cmd = `yt-dlp -f "${quality}[ext=mp4]/best[ext=mp4]/best"`;
      cmd += ` -o "${outputPath}"`;
      cmd += ` --no-playlist`;
      cmd += ` --no-warnings`;
      cmd += ` --merge-output-format mp4`;
      cmd += ` "${url}"`;

      logger.debug('[KuaishouDownloader] 执行下载命令', { cmd: cmd.replace(url, '<URL>') });

      exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
        if (error) {
          logger.error('[KuaishouDownloader] yt-dlp 执行失败', { error: error.message });
          resolve({ success: false, error: error.message });
          return;
        }
        resolve({ success: true });
      });
    });
  }
}

module.exports = KuaishouDownloader;
