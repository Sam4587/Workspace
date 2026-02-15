/**
 * 发布集成服务
 * 对接现有 Go CLI 发布工具
 */

const { logger } = require('../../utils/logger');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises';

class PublishIntegration {
  constructor() {
    // 发布工具路径
    this.toolsPath = {
      xiaohongshu: process.env.XIAOHONGSHU_PUBLISHER_PATH ||
        path.join(__dirname, '../../../tools/xiaohongshu-publisher/xhs-publisher'),
      douyin: process.env.DOUYIN_PUBLISHER_PATH ||
        path.join(__dirname, '../../../tools/douyin-toutiao/publisher'),
      toutiao: process.env.TOUTIAO_PUBLISHER_PATH ||
        path.join(__dirname, '../../../tools/douyin-toutiao/publisher')
    };

    // Cookie 路径
    this.cookiePaths = {
      xiaohongshu: './cookies/xiaohongshu_cookies.json',
      douyin: './cookies/douyin_cookies.json',
      toutiao: './cookies/toutiao_cookies.json'
    };

    // 平台配置
    this.platformConfigs = {
      xiaohongshu: {
        name: '小红书',
        maxTitle: 20,
        maxContent: 1000
      },
      douyin: {
        name: '抖音',
        maxTitle: 30,
        maxContent: 2000
      },
      toutiao: {
        name: '今日头条',
        maxTitle: 30,
        maxContent: 2000
      }
    };
  }

  /**
   * 发布到小红书
   * @param {Object} content - 内容
   * @returns {Promise<Object>}
   */
  async publishToXiaohongshu(content) {
    try {
      logger.info('[PublishIntegration] 发布到小红书', { title: content.title });

      // 验证内容
      if (!content.title || !content.content) {
        return {
          success: false,
          error: '标题和内容不能为空'
        };
      }

      // 检查 Cookie
      const cookieExists = await this.checkCookie('xiaohongshu');
      if (!cookieExists) {
        return {
          success: false,
          error: '小红书登录状态失效，请重新登录'
        };
      }

      // 构建命令
      const toolPath = this.toolsPath.xiaohongshu;
      const title = this.escapeString(content.title.slice(0, 20));
      const contentText = this.escapeString(content.content.slice(0, 1000));

      let cmd = `${toolPath} -title "${title}" -content "${contentText}"`;

      // 添加图片
      if (content.images && content.images.length > 0) {
        cmd += ` -images "${content.images.join(',')}"`;
      }

      // 添加标签
      if (content.tags && content.tags.length > 0) {
        cmd += ` -tags "${content.tags.slice(0, 5).join(',')}"`;
      }

      const result = await this.execCommand(cmd);

      if (result.success) {
        logger.info('[PublishIntegration] 小红书发布成功');
      }

      return result;
    } catch (error) {
      logger.error('[PublishIntegration] 小红书发布失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发布到抖音
   * @param {Object} content - 内容
   * @returns {Promise<Object>}
   */
  async publishToDouyin(content) {
    try {
      logger.info('[PublishIntegration] 发布到抖音', { title: content.title });

      if (!content.mainContent && !content.content) {
        return {
          success: false,
          error: '内容不能为空'
        };
      }

      // 检查 Cookie
      const cookieExists = await this.checkCookie('douyin');
      if (!cookieExists) {
        return {
          success: false,
          error: '抖音登录状态失效，请重新登录'
        };
      }

      const toolPath = this.toolsPath.douyin;
      const title = this.escapeString((content.title || '').slice(0, 30));
      const contentText = this.escapeString((content.mainContent || content.content || '').slice(0, 2000));

      let cmd = `${toolPath} -platform douyin`;
      cmd += ` -title "${title}"`;
      cmd += ` -content "${contentText}"`;

      // 添加图片
      if (content.images && content.images.length > 0) {
        cmd += ` -images "${content.images.join(',')}"`;
      }

      // 添加视频
      if (content.video) {
        cmd += ` -video "${content.video}"`;
      }

      // 异步发布
      cmd += ' -async';

      const result = await this.execCommand(cmd);

      if (result.success) {
        logger.info('[PublishIntegration] 抖音发布任务已提交');
      }

      return result;
    } catch (error) {
      logger.error('[PublishIntegration] 抖音发布失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发布到今日头条
   * @param {Object} content - 内容
   * @returns {Promise<Object>}
   */
  async publishToToutiao(content) {
    try {
      logger.info('[PublishIntegration] 发布到今日头条', { title: content.title });

      if (!content.title || !content.content) {
        return {
          success: false,
          error: '标题和内容不能为空'
        };
      }

      // 检查 Cookie
      const cookieExists = await this.checkCookie('toutiao');
      if (!cookieExists) {
        return {
          success: false,
          error: '今日头条登录状态失效，请重新登录'
        };
      }

      const toolPath = this.toolsPath.toutiao;
      const title = this.escapeString(content.title.slice(0, 30));
      const contentText = this.escapeString(content.content.slice(0, 2000));

      let cmd = `${toolPath} -platform toutiao`;
      cmd += ` -title "${title}"`;
      cmd += ` -content "${contentText}"`;

      // 添加图片
      if (content.images && content.images.length > 0) {
        cmd += ` -images "${content.images.join(',')}"`;
      }

      // 异步发布
      cmd += ' -async';

      const result = await this.execCommand(cmd);

      if (result.success) {
        logger.info('[PublishIntegration] 今日头条发布任务已提交');
      }

      return result;
    } catch (error) {
      logger.error('[PublishIntegration] 今日头条发布失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 通用发布方法
   * @param {string} platform - 平台
   * @param {Object} content - 内容
   * @returns {Promise<Object>}
   */
  async publish(platform, content) {
    switch (platform) {
      case 'xiaohongshu':
        return this.publishToXiaohongshu(content);
      case 'douyin':
        return this.publishToDouyin(content);
      case 'toutiao':
        return this.publishToToutiao(content);
      default:
        return {
          success: false,
          error: `不支持的平台: ${platform}`
        };
    }
  }

  /**
   * 检查登录状态
   * @param {string} platform - 平台
   * @returns {Promise<boolean>}
   */
  async checkCookie(platform) {
    try {
      const cookiePath = this.cookiePaths[platform];
      await fs.access(cookiePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取登录状态
   * @returns {Promise<Object>}
   */
  async getLoginStatus() {
    const status = {};

    for (const [platform, path] of Object.entries(this.cookiePaths)) {
      status[platform] = await this.checkCookie(platform);
    }

    return status;
  }

  /**
   * 执行命令
   * @param {string} cmd - 命令
   * @returns {Promise<Object>}
   */
  async execCommand(cmd) {
    return new Promise((resolve) => {
      exec(cmd, { timeout: 60000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            stderr
          });
          return;
        }

        try {
          // 尝试解析 JSON 输出
          const result = JSON.parse(stdout);
          resolve(result);
        } catch {
          // 返回原始输出
          resolve({
            success: true,
            output: stdout
          });
        }
      });
    });
  }

  /**
   * 转义字符串
   * @param {string} str - 原始字符串
   * @returns {string}
   */
  escapeString(str) {
    if (!str) return '';
    return str
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  }

  /**
   * 获取支持的平台
   * @returns {Object[]}
   */
  getSupportedPlatforms() {
    return Object.entries(this.platformConfigs).map(([id, config]) => ({
      id,
      name: config.name,
      maxTitle: config.maxTitle,
      maxContent: config.maxContent
    }));
  }
}

module.exports = new PublishIntegration();
