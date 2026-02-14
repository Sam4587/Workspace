/**
 * 企业微信通知发送器
 */

const axios = require('axios');
const BaseSender = require('../BaseSender');
const { NotificationChannel } = require('../../core/types');

class WeWorkSender extends BaseSender {
  constructor(config) {
    super(config);
    this.webhookUrl = config.webhookUrl || process.env.WEWORK_WEBHOOK_URL;
    this.msgType = config.msgType || process.env.WEWORK_MSG_TYPE || 'markdown';

    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  isConfigured() {
    return !!this.webhookUrl;
  }

  async send(message) {
    if (!this.isConfigured()) {
      throw new Error('企业微信 Webhook 未配置');
    }

    const isMarkdown = this.msgType === 'markdown';
    const payload = {
      msgtype: isMarkdown ? 'markdown' : 'text',
      markdown: isMarkdown ? { content: message } : undefined,
      text: isMarkdown ? undefined : { content: this.stripMarkdown(message) }
    };

    try {
      const response = await this.axiosInstance.post(this.webhookUrl, payload);
      if (response.data.errcode === 0) {
        this.recordSuccess();
        return true;
      } else {
        throw new Error(response.data.errmsg || '发送失败');
      }
    } catch (error) {
      this.recordError(error);
      throw error;
    }
  }
}

module.exports = WeWorkSender;
