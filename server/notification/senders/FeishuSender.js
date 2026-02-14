/**
 * 飞书通知发送器
 */

const axios = require('axios');
const BaseSender = require('../BaseSender');

class FeishuSender extends BaseSender {
  constructor(config) {
    super(config);
    this.webhookUrl = config.webhookUrl || process.env.FEISHU_WEBHOOK_URL;

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
      throw new Error('飞书 Webhook 未配置');
    }

    const payload = {
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: '热点话题更新' },
          template: 'blue'
        },
        elements: [
          {
            tag: 'markdown',
            content: this.stripMarkdown(message)
          }
        ]
      }
    };

    try {
      const response = await this.axiosInstance.post(this.webhookUrl, payload);
      if (response.data.StatusCode === 0 || response.data.code === 0) {
        this.recordSuccess();
        return true;
      } else {
        throw new Error(response.data.msg || '发送失败');
      }
    } catch (error) {
      this.recordError(error);
      throw error;
    }
  }
}

module.exports = FeishuSender;
