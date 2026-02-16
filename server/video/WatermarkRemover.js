/**
 * 去水印处理器
 * 对接第三方去水印服务
 */

const logger = require('../utils/logger');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class WatermarkRemover {
  constructor() {
    // 配置去水印服务端点
    this.services = {
      douyin: {
        // 可配置多个备用服务
        endpoints: [
          process.env.DOUYIN_WATERMARK_API || 'https://api.douyin.wtf/api',
        ],
        timeout: 30000
      },
      kuaishou: {
        endpoints: [
          process.env.KUAISHOU_WATERMARK_API || 'https://api.kuaishou.wtf/api',
        ],
        timeout: 30000
      }
    };

    // 请求计数
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * 移除视频水印
   * @param {string} videoPath - 视频文件路径
   * @param {string} platform - 平台类型
   * @returns {Promise<{ success: boolean, outputPath?: string, error?: string }>}
   */
  async remove(videoPath, platform) {
    try {
      logger.info('[WatermarkRemover] 开始去水印处理', { videoPath, platform });

      const service = this.services[platform];
      if (!service) {
        return { success: false, error: `不支持的平台: ${platform}` };
      }

      // 尝试多个服务端点
      for (const endpoint of service.endpoints) {
        try {
          const result = await this.callService(endpoint, videoPath, platform, service.timeout);
          if (result.success) {
            this.requestCount++;
            return result;
          }
        } catch (error) {
          logger.warn('[WatermarkRemover] 服务调用失败', { endpoint, error: error.message });
          this.errorCount++;
        }
      }

      // 所有服务都失败，返回原视频
      logger.warn('[WatermarkRemover] 所有去水印服务不可用，保留原视频');
      return { success: false, error: '去水印服务不可用' };
    } catch (error) {
      logger.error('[WatermarkRemover] 去水印失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 调用去水印服务
   * @param {string} endpoint - 服务端点
   * @param {string} videoPath - 视频路径
   * @param {string} platform - 平台
   * @param {number} timeout - 超时时间
   * @returns {Promise<{ success: boolean, outputPath?: string, error?: string }>}
   */
  async callService(endpoint, videoPath, platform, timeout) {
    // 读取视频文件
    const videoBuffer = await fs.readFile(videoPath);
    const videoHash = crypto.createHash('md5').update(videoBuffer).digest('hex');

    // 构建请求
    const response = await axios.post(endpoint, {
      platform,
      video_hash: videoHash,
      video_size: videoBuffer.length
    }, {
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.success) {
      // 下载处理后的视频
      const outputDir = path.dirname(videoPath);
      const ext = path.extname(videoPath);
      const baseName = path.basename(videoPath, ext);
      const outputPath = path.join(outputDir, `${baseName}_no_watermark${ext}`);

      // 下载无水印视频
      if (response.data.video_url) {
        const videoResponse = await axios.get(response.data.video_url, {
          responseType: 'arraybuffer',
          timeout: 60000
        });

        await fs.writeFile(outputPath, videoResponse.data);

        logger.info('[WatermarkRemover] 去水印完成', { outputPath });
        return { success: true, outputPath };
      }
    }

    return { success: false, error: response.data?.message || '服务返回失败' };
  }

  /**
   * 通过视频URL去水印（不需要本地文件）
   * @param {string} videoUrl - 视频URL
   * @param {string} platform - 平台类型
   * @returns {Promise<{ success: boolean, noWatermarkUrl?: string, error?: string }>}
   */
  async removeByUrl(videoUrl, platform) {
    try {
      const service = this.services[platform];
      if (!service) {
        return { success: false, error: `不支持的平台: ${platform}` };
      }

      for (const endpoint of service.endpoints) {
        try {
          const response = await axios.post(endpoint, {
            platform,
            video_url: videoUrl
          }, {
            timeout: service.timeout,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.data && response.data.success && response.data.no_watermark_url) {
            return {
              success: true,
              noWatermarkUrl: response.data.no_watermark_url
            };
          }
        } catch (error) {
          logger.warn('[WatermarkRemover] 服务调用失败', { endpoint, error: error.message });
        }
      }

      return { success: false, error: '去水印服务不可用' };
    } catch (error) {
      logger.error('[WatermarkRemover] URL去水印失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取服务状态
   * @returns {Object}
   */
  getStatus() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
      supportedPlatforms: Object.keys(this.services)
    };
  }
}

module.exports = WatermarkRemover;
