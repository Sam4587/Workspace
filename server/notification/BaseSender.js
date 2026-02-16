/**
 * 通知发送器抽象基类
 * 借鉴 TrendRadar Notification Dispatcher 模块化设计
 */

const logger = require('../utils/logger');

class BaseSender {
  /**
   * @param {Object} config - 发送器配置
   */
  constructor(config) {
    this.config = config;
    this.sendCount = 0;
    this.errorCount = 0;
  }

  /**
   * 发送消息 - 子类必须实现
   * @param {string} message - 消息内容
   * @returns {Promise<boolean>}
   */
  async send(message) {
    throw new Error('send() must be implemented by subclass');
  }

  /**
   * 测试发送器配置
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async test() {
    if (!this.isConfigured()) {
      return { success: false, error: '配置不完整' };
    }

    try {
      const testMessage = '这是一条测试消息，用于验证通知配置是否正确。';
      const result = await this.send(testMessage);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查配置是否完整 - 子类可覆盖
   * @returns {boolean}
   */
  isConfigured() {
    return Object.keys(this.config).length > 0;
  }

  /**
   * 获取发送器名称
   * @returns {string}
   */
  getName() {
    return this.constructor.name.replace('Sender', '').toLowerCase();
  }

  /**
   * 记录发送成功
   */
  recordSuccess() {
    this.sendCount++;
    logger.debug(`[${this.getName()}] 发送成功`);
  }

  /**
   * 记录发送失败
   * @param {Error} error
   */
  recordError(error) {
    this.errorCount++;
    logger.error(`[${this.getName()}] 发送失败: ${error.message}`);
  }

  /**
   * 获取发送器状态
   * @returns {Object}
   */
  getStatus() {
    return {
      name: this.getName(),
      configured: this.isConfigured(),
      sendCount: this.sendCount,
      errorCount: this.errorCount,
      errorRate: this.sendCount > 0 ? (this.errorCount / this.sendCount * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 去除 Markdown 格式
   * @param {string} text
   * @returns {string}
   */
  stripMarkdown(text) {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/__.*?__/g, '')
      .replace(/~~.*?~~/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '$1');
  }

  /**
   * 截断消息
   * @param {string} message
   * @param {number} maxLength
   * @returns {string}
   */
  truncateMessage(message, maxLength = 4096) {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }
}

module.exports = BaseSender;
