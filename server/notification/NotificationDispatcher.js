/**
 * 通知调度器
 * 统一管理多渠道消息分发，借鉴 TrendRadar Notification Dispatcher 设计
 */

const logger = require('../utils/logger');
const { NotificationChannel } = require('../core/types');

// 动态导入发送器
const WeWorkSender = require('./senders/WeWorkSender');
const DingTalkSender = require('./senders/DingTalkSender');
const FeishuSender = require('./senders/FeishuSender');

class NotificationDispatcher {
  constructor() {
    this.senders = new Map();
    this.defaultChannels = [];
  }

  /**
   * 注册发送器
   * @param {string} channel - 渠道名称
   * @param {BaseSender} sender - 发送器实例
   */
  register(channel, sender) {
    this.senders.set(channel, sender);
    logger.info(`[NotificationDispatcher] 注册通知渠道: ${channel}`);
  }

  /**
   * 注销发送器
   * @param {string} channel - 渠道名称
   */
  unregister(channel) {
    if (this.senders.has(channel)) {
      this.senders.delete(channel);
      logger.info(`[NotificationDispatcher] 注销通知渠道: ${channel}`);
    }
  }

  /**
   * 获取已注册的渠道
   * @returns {string[]}
   */
  getRegisteredChannels() {
    return Array.from(this.senders.keys());
  }

  /**
   * 获取已配置的渠道
   * @returns {string[]}
   */
  getConfiguredChannels() {
    const configured = [];
    for (const [channel, sender] of this.senders) {
      if (sender.isConfigured()) {
        configured.push(channel);
      }
    }
    return configured;
  }

  /**
   * 发送消息到指定渠道
   * @param {string} message - 消息内容
   * @param {string} channel - 渠道名称
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendToChannel(message, channel) {
    const sender = this.senders.get(channel);
    if (!sender) {
      return { success: false, error: `未找到渠道: ${channel}` };
    }

    if (!sender.isConfigured()) {
      return { success: false, error: `渠道未配置: ${channel}` };
    }

    try {
      await sender.send(message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送消息到多个渠道
   * @param {string} message - 消息内容
   * @param {string[]} channels - 渠道列表，默认使用所有已配置渠道
   * @returns {Promise<{success: boolean, results: Object}>}
   */
  async dispatch(message, channels) {
    const targetChannels = channels || this.getConfiguredChannels();

    if (targetChannels.length === 0) {
      logger.warn('[NotificationDispatcher] 没有可用的通知渠道');
      return { success: false, results: {} };
    }

    const results = {};

    // 并行发送到所有渠道
    const promises = targetChannels.map(async channel => {
      const result = await this.sendToChannel(message, channel);
      results[channel] = result;
      return { channel, result };
    });

    await Promise.allSettled(promises);

    const successCount = Object.values(results).filter(r => r.success).length;
    logger.info(`[NotificationDispatcher] 推送完成: ${successCount}/${targetChannels.length} 成功`);

    return {
      success: successCount > 0,
      results
    };
  }

  /**
   * 广播热点消息
   * @param {import('../core/types').HotTopic[]} topics - 热点列表
   * @param {string[]} channels - 渠道列表
   * @returns {Promise<{success: boolean, results: Object}>}
   */
  async broadcast(topics, channels) {
    const message = this.formatMessage(topics);
    return await this.dispatch(message, channels);
  }

  /**
   * 格式化热点消息
   * @param {import('../core/types').HotTopic[]} topics
   * @returns {string}
   */
  formatMessage(topics) {
    const lines = ['## 热点话题更新'];

    for (const topic of topics.slice(0, 20)) {
      const trendEmoji = topic.trend === 'new' ? '🆕' :
                         topic.trend === 'up' ? '🔺' :
                         topic.trend === 'down' ? '🔻' : '';
      lines.push(`\n**${trendEmoji} ${topic.title}**`);
      lines.push(`> 来源: ${topic.source} | 热度: ${topic.heat}`);
      if (topic.sourceUrl) {
        lines.push(`> [查看详情](${topic.sourceUrl})`);
      }
    }

    lines.push('\n---');
    lines.push(`更新时间: ${new Date().toLocaleString('zh-CN')}`);

    return lines.join('\n');
  }

  /**
   * 测试指定渠道
   * @param {string} channel - 渠道名称
   * @returns {Promise<{channel: string, success: boolean, error?: string}>}
   */
  async testChannel(channel) {
    const sender = this.senders.get(channel);
    if (!sender) {
      return { channel, success: false, error: '未找到渠道' };
    }

    const result = await sender.test();
    return { channel, ...result };
  }

  /**
   * 获取所有渠道状态
   * @returns {Object}
   */
  getStatus() {
    const status = {};
    for (const [channel, sender] of this.senders) {
      status[channel] = sender.getStatus();
    }
    return status;
  }

  /**
   * 初始化默认渠道
   */
  initializeDefaultChannels() {
    this.register(NotificationChannel.WEWORK, new WeWorkSender({}));
    this.register(NotificationChannel.DINGTALK, new DingTalkSender({}));
    this.register(NotificationChannel.FEISHU, new FeishuSender({}));

    // 设置默认渠道
    this.defaultChannels = this.getConfiguredChannels();

    logger.info(`[NotificationDispatcher] 已初始化 ${this.senders.size} 个通知渠道，${this.defaultChannels.length} 个已配置`);
  }
}

// 单例模式
const notificationDispatcher = new NotificationDispatcher();

module.exports = {
  NotificationDispatcher,
  notificationDispatcher
};
