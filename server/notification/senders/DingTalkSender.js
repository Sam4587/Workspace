/**
 * 钉钉通知发送器
 */

const axios = require('axios');
const BaseSender = require('../BaseSender');

class DingTalkSender extends BaseSender {
  constructor(config) {
    super(config);
    this.webhookUrl = config.webhookUrl || process.env.DINGTALK_WEBHOOK_URL;

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
      throw new Error('钉钉 Webhook 未配置');
    }

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: '热点话题更新',
        text: message
      }
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

module.exports = DingTalkSender;
