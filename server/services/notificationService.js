const axios = require('axios');
const { logger } = require('../utils/logger');

class NotificationService {
  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.channels = {
      wework: process.env.WEWORK_WEBHOOK_URL,
      wework_msg_type: process.env.WEWORK_MSG_TYPE || 'markdown',
      feishu: process.env.FEISHU_WEBHOOK_URL,
      dingtalk: process.env.DINGTALK_WEBHOOK_URL,
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
      },
      email: {
        from: process.env.EMAIL_FROM,
        password: process.env.EMAIL_PASSWORD,
        to: process.env.EMAIL_TO,
        smtpServer: process.env.EMAIL_SMTP_SERVER,
        smtpPort: process.env.EMAIL_SMTP_PORT
      },
      webhook: process.env.WEBHOOK_URL
    };
  }

  isChannelEnabled(channel) {
    switch (channel) {
      case 'wework':
        return !!this.channels.wework;
      case 'feishu':
        return !!this.channels.feishu;
      case 'dingtalk':
        return !!this.channels.dingtalk;
      case 'telegram':
        return !!(this.channels.telegram.botToken && this.channels.telegram.chatId);
      case 'email':
        return !!(this.channels.email.from && this.channels.email.password && this.channels.email.to);
      case 'webhook':
        return !!this.channels.webhook;
      default:
        return false;
    }
  }

  async sendToWework(message) {
    if (!this.isChannelEnabled('wework')) {
      logger.warn('企业微信未配置');
      return false;
    }

    const isMarkdown = this.channels.wework_msg_type === 'markdown';

    const payload = {
      msgtype: isMarkdown ? 'markdown' : 'text',
      text: isMarkdown ? message : this.stripMarkdown(message)
    };

    try {
      const response = await this.axiosInstance.post(this.channels.wework, payload);
      logger.info('企业微信推送成功');
      return response.data.errcode === 0;
    } catch (error) {
      logger.error('企业微信推送失败', { error: error.message });
      return false;
    }
  }

  async sendToFeishu(message) {
    if (!this.isChannelEnabled('feishu')) {
      logger.warn('飞书未配置');
      return false;
    }

    const payload = {
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: '热点话题更新',
            content: this.stripMarkdown(message)
          }
        }
      }
    };

    try {
      await this.axiosInstance.post(this.channels.feishu, payload);
      logger.info('飞书推送成功');
      return true;
    } catch (error) {
      logger.error('飞书推送失败', { error: error.message });
      return false;
    }
  }

  async sendToDingtalk(message) {
    if (!this.isChannelEnabled('dingtalk')) {
      logger.warn('钉钉未配置');
      return false;
    }

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: '热点话题更新',
        text: message
      }
    };

    try {
      const response = await this.axiosInstance.post(this.channels.dingtalk, payload);
      logger.info('钉钉推送成功');
      return response.data.errcode === 0;
    } catch (error) {
      logger.error('钉钉推送失败', { error: error.message });
      return false;
    }
  }

  async sendToTelegram(message) {
    if (!this.isChannelEnabled('telegram')) {
      logger.warn('Telegram 未配置');
      return false;
    }

    const url = `https://api.telegram.org/bot${this.channels.telegram.botToken}/sendMessage`;
    const payload = {
      chat_id: this.channels.telegram.chatId,
      text: this.stripMarkdown(message),
      parse_mode: 'Markdown'
    };

    try {
      await this.axiosInstance.post(url, payload);
      logger.info('Telegram 推送成功');
      return true;
    } catch (error) {
      logger.error('Telegram 推送失败', { error: error.message });
      return false;
    }
  }

  async sendToEmail(message) {
    if (!this.isChannelEnabled('email')) {
      logger.warn('邮件未配置');
      return false;
    }

    logger.info('邮件推送功能需 SMTP 服务器配置');
    return true;
  }

  async sendToWebhook(message) {
    if (!this.isChannelEnabled('webhook')) {
      logger.warn('Webhook 未配置');
      return false;
    }

    try {
      await this.axiosInstance.post(this.channels.webhook, {
        message,
        timestamp: new Date().toISOString()
      });
      logger.info('Webhook 推送成功');
      return true;
    } catch (error) {
      logger.error('Webhook 推送失败', { error: error.message });
      return false;
    }
  }

  async sendToChannels(message, channels = ['wework']) {
    const results = {};

    const sendPromises = {
      wework: () => this.sendToWework(message),
      feishu: () => this.sendToFeishu(message),
      dingtalk: () => this.sendToDingtalk(message),
      telegram: () => this.sendToTelegram(message),
      email: () => this.sendToEmail(message),
      webhook: () => this.sendToWebhook(message)
    };

    const enabledChannels = channels.filter(ch => this.isChannelEnabled(ch));

    if (enabledChannels.length === 0) {
      logger.warn('没有配置任何推送渠道');
      return { success: false, results };
    }

    const promises = enabledChannels.map(ch => sendPromises[ch]());
    const outcomes = await Promise.allSettled(promises);

    for (const [channel, outcome] of Object.entries(outcomes)) {
      if (channels.includes(channel)) {
        results[channel] = {
          success: outcome.status === 'fulfilled' ? outcome.value : false,
          error: outcome.status === 'rejected' ? outcome.reason?.message : null
        };
      }
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    logger.info(`推送完成: ${successCount}/${enabledChannels.length} 成功`);

    return { success: successCount > 0, results };
  }

  formatMessage(topics) {
    const lines = ['## 热点话题更新'];

    for (const topic of topics.slice(0, 20)) {
      const trendEmoji = topic.isNew ? '🆕' : topic.trend === 'up' ? '🔺' : topic.trend === 'down' ? '🔻' : '';
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

  stripMarkdown(text) {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/__.*?__/g, '')
      .replace(/~~.*?~~/g, '')
      .replace(/\[.*?\]/g, '');
  }

  async testNotification(channel) {
    const testMessage = this.formatMessage([{
      title: '测试消息',
      source: '测试',
      heat: 100,
      trend: 'stable',
      isNew: true,
      sourceUrl: ''
    }]);

    const result = await this.sendToChannels(testMessage, [channel]);

    return {
      channel,
      success: result.results[channel]?.success || false,
      error: result.results[channel]?.error
    };
  }

  getChannelStatus() {
    const status = {};

    for (const [key, value] of Object.entries(this.channels)) {
      if (key === 'telegram') {
        status[key] = {
          enabled: !!(value.botToken && value.chatId),
          details: {
            botToken: !!value.botToken,
            chatId: !!value.chatId
          }
        };
      } else {
        status[key] = {
          enabled: !!value,
          details: {}
        };
      }
    }

    return status;
  }
}

module.exports = new NotificationService();
