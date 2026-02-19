/**
 * 统一多渠道推送服务
 * TR-005: 多渠道推送扩展
 * 
 * 支持9个主流推送平台：
 * - 企业微信、钉钉、飞书
 * - Telegram、Slack、Discord
 * - Email、Webhook、Bark
 */

const axios = require('axios');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

class UnifiedPushService {
  constructor() {
    this.httpClient = axios.create({
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.channelConfigs = this.loadChannelConfigs();
    this.messageQueue = [];
    this.rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });
    this.pushHistory = [];
    this.maxHistorySize = 500;

    this.channelAdapters = new Map();
    this.registerDefaultAdapters();
  }

  loadChannelConfigs() {
    return {
      wework: {
        enabled: !!process.env.WEWORK_WEBHOOK_URL,
        webhookUrl: process.env.WEWORK_WEBHOOK_URL,
        msgType: process.env.WEWORK_MSG_TYPE || 'markdown',
        rateLimit: 20
      },
      dingtalk: {
        enabled: !!process.env.DINGTALK_WEBHOOK_URL,
        webhookUrl: process.env.DINGTALK_WEBHOOK_URL,
        secret: process.env.DINGTALK_SECRET,
        rateLimit: 20
      },
      feishu: {
        enabled: !!process.env.FEISHU_WEBHOOK_URL,
        webhookUrl: process.env.FEISHU_WEBHOOK_URL,
        secret: process.env.FEISHU_SECRET,
        rateLimit: 20
      },
      telegram: {
        enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        rateLimit: 30
      },
      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#general',
        rateLimit: 60
      },
      discord: {
        enabled: !!process.env.DISCORD_WEBHOOK_URL,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        rateLimit: 30
      },
      email: {
        enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        rateLimit: 100
      },
      webhook: {
        enabled: !!process.env.PUSH_WEBHOOK_URL,
        url: process.env.PUSH_WEBHOOK_URL,
        method: process.env.PUSH_WEBHOOK_METHOD || 'POST',
        headers: {},
        rateLimit: 60
      },
      bark: {
        enabled: !!process.env.BARK_TOKEN,
        serverUrl: process.env.BARK_SERVER || 'https://api.day.app',
        token: process.env.BARK_TOKEN,
        rateLimit: 100
      }
    };
  }

  registerDefaultAdapters() {
    this.channelAdapters.set('wework', {
      name: '企业微信',
      send: async (config, message) => {
        const payload = this.buildWeWorkPayload(message, config.msgType);
        const response = await this.httpClient.post(config.webhookUrl, payload);
        return { success: response.data.errcode === 0, data: response.data };
      },
      test: async (config) => {
        const payload = { msgtype: 'text', text: { content: '🔔 测试消息：推送服务正常运行' } };
        const response = await this.httpClient.post(config.webhookUrl, payload);
        return { success: response.data.errcode === 0 };
      }
    });

    this.channelAdapters.set('dingtalk', {
      name: '钉钉',
      send: async (config, message) => {
        const payload = this.buildDingTalkPayload(message);
        let url = config.webhookUrl;
        if (config.secret) {
          const sign = this.generateDingTalkSign(config.secret);
          url += `&sign=${sign}`;
        }
        const response = await this.httpClient.post(url, payload);
        return { success: response.data.errcode === 0, data: response.data };
      },
      test: async (config) => {
        const payload = { msgtype: 'text', text: { content: '🔔 测试消息：推送服务正常运行' } };
        const response = await this.httpClient.post(config.webhookUrl, payload);
        return { success: response.data.errcode === 0 };
      }
    });

    this.channelAdapters.set('feishu', {
      name: '飞书',
      send: async (config, message) => {
        const payload = this.buildFeishuPayload(message);
        const response = await this.httpClient.post(config.webhookUrl, payload);
        return { success: response.data.code === 0, data: response.data };
      },
      test: async (config) => {
        const payload = { msg_type: 'text', content: { text: '🔔 测试消息：推送服务正常运行' } };
        const response = await this.httpClient.post(config.webhookUrl, payload);
        return { success: response.data.code === 0 };
      }
    });

    this.channelAdapters.set('telegram', {
      name: 'Telegram',
      send: async (config, message) => {
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const payload = {
          chat_id: config.chatId,
          text: this.formatTelegramMessage(message),
          parse_mode: 'HTML'
        };
        const response = await this.httpClient.post(url, payload);
        return { success: response.data.ok, data: response.data };
      },
      test: async (config) => {
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const response = await this.httpClient.post(url, {
          chat_id: config.chatId,
          text: '🔔 测试消息：推送服务正常运行'
        });
        return { success: response.data.ok };
      }
    });

    this.channelAdapters.set('slack', {
      name: 'Slack',
      send: async (config, message) => {
        const payload = this.buildSlackPayload(message, config.channel);
        const response = await this.httpClient.post(config.webhookUrl, payload);
        return { success: response.status === 200, data: response.data };
      },
      test: async (config) => {
        const response = await this.httpClient.post(config.webhookUrl, {
          text: '🔔 测试消息：推送服务正常运行'
        });
        return { success: response.status === 200 };
      }
    });

    this.channelAdapters.set('discord', {
      name: 'Discord',
      send: async (config, message) => {
        const payload = this.buildDiscordPayload(message);
        const response = await this.httpClient.post(config.webhookUrl, payload);
        return { success: response.status === 204 || response.status === 200, data: response.data };
      },
      test: async (config) => {
        const response = await this.httpClient.post(config.webhookUrl, {
          content: '🔔 测试消息：推送服务正常运行'
        });
        return { success: response.status === 204 || response.status === 200 };
      }
    });

    this.channelAdapters.set('email', {
      name: 'Email',
      send: async (config, message) => {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: { user: config.user, pass: config.pass }
        });
        
        const mailOptions = {
          from: config.from || config.user,
          to: config.to,
          subject: message.title || '通知',
          html: this.formatEmailHtml(message)
        };
        
        const info = await transporter.sendMail(mailOptions);
        return { success: info.accepted.length > 0, data: { messageId: info.messageId } };
      },
      test: async (config) => {
        return { success: true, note: 'Email测试需要实际发送' };
      }
    });

    this.channelAdapters.set('webhook', {
      name: '自定义Webhook',
      send: async (config, message) => {
        const response = await this.httpClient({
          method: config.method,
          url: config.url,
          data: message,
          headers: config.headers
        });
        return { success: response.status >= 200 && response.status < 300, data: response.data };
      },
      test: async (config) => {
        const response = await this.httpClient.get(config.url.replace(/\/send$/, '/health'));
        return { success: response.status === 200 };
      }
    });

    this.channelAdapters.set('bark', {
      name: 'Bark',
      send: async (config, message) => {
        const url = `${config.serverUrl}/${config.token}`;
        const payload = {
          title: message.title || '通知',
          body: message.content || message.body || '',
          sound: message.sound || 'default',
          group: message.group || 'default'
        };
        const response = await this.httpClient.post(url, payload);
        return { success: response.data.code === 200, data: response.data };
      },
      test: async (config) => {
        const url = `${config.serverUrl}/${config.token}`;
        const response = await this.httpClient.post(url, {
          title: '测试',
          body: '🔔 测试消息：推送服务正常运行'
        });
        return { success: response.data.code === 200 };
      }
    });
  }

  async send(channel, message, options = {}) {
    const config = this.channelConfigs[channel];
    const adapter = this.channelAdapters.get(channel);

    if (!config || !adapter) {
      return { success: false, error: `未知渠道: ${channel}` };
    }

    if (!config.enabled) {
      return { success: false, error: `渠道 ${channel} 未启用` };
    }

    if (!this.checkRateLimit(channel, config.rateLimit)) {
      return { success: false, error: `渠道 ${channel} 已达到速率限制` };
    }

    const startTime = Date.now();
    let result;

    try {
      result = await adapter.send(config, message);
      
      this.recordHistory({
        channel,
        success: result.success,
        duration: Date.now() - startTime,
        message: message.title || message.subject || '无标题'
      });

      logger.info(`[PushService] ${adapter.name}推送${result.success ? '成功' : '失败'}`, {
        channel,
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      this.recordHistory({
        channel,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      logger.error(`[PushService] ${adapter.name}推送异常`, {
        channel,
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  async sendToMultiple(channels, message, options = {}) {
    const results = {};
    const parallel = options.parallel !== false;

    if (parallel) {
      const promises = channels.map(async (channel) => {
        const result = await this.send(channel, message, options);
        return { channel, result };
      });

      const responses = await Promise.allSettled(promises);
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled') {
          results[response.value.channel] = response.value.result;
        } else {
          results[channels[index]] = { success: false, error: response.reason?.message };
        }
      });
    } else {
      for (const channel of channels) {
        results[channel] = await this.send(channel, message, options);
      }
    }

    return {
      success: Object.values(results).some(r => r.success),
      results,
      summary: {
        total: channels.length,
        success: Object.values(results).filter(r => r.success).length,
        failed: Object.values(results).filter(r => !r.success).length
      }
    };
  }

  async broadcast(message, options = {}) {
    const enabledChannels = this.getEnabledChannels();
    
    if (enabledChannels.length === 0) {
      return { success: false, error: '没有启用的推送渠道' };
    }

    return this.sendToMultiple(enabledChannels, message, options);
  }

  checkRateLimit(channel, limit) {
    const key = `rate_${channel}`;
    const current = this.rateLimitCache.get(key) || 0;
    
    if (current >= limit) {
      return false;
    }
    
    this.rateLimitCache.set(key, current + 1);
    return true;
  }

  getEnabledChannels() {
    return Object.entries(this.channelConfigs)
      .filter(([, config]) => config.enabled)
      .map(([channel]) => channel);
  }

  getChannelInfo(channel) {
    const config = this.channelConfigs[channel];
    const adapter = this.channelAdapters.get(channel);
    
    if (!config || !adapter) {
      return null;
    }

    return {
      id: channel,
      name: adapter.name,
      enabled: config.enabled,
      rateLimit: config.rateLimit
    };
  }

  getAllChannels() {
    return Object.keys(this.channelConfigs).map(channel => this.getChannelInfo(channel));
  }

  async testChannel(channel) {
    const config = this.channelConfigs[channel];
    const adapter = this.channelAdapters.get(channel);

    if (!config || !adapter) {
      return { channel, success: false, error: '未知渠道' };
    }

    if (!config.enabled) {
      return { channel, success: false, error: '渠道未启用' };
    }

    try {
      const result = await adapter.test(config);
      return { channel, ...result };
    } catch (error) {
      return { channel, success: false, error: error.message };
    }
  }

  async testAllChannels() {
    const enabledChannels = this.getEnabledChannels();
    const results = {};

    for (const channel of enabledChannels) {
      results[channel] = await this.testChannel(channel);
    }

    return results;
  }

  recordHistory(entry) {
    this.pushHistory.push({
      timestamp: new Date().toISOString(),
      ...entry
    });

    if (this.pushHistory.length > this.maxHistorySize) {
      this.pushHistory = this.pushHistory.slice(-this.maxHistorySize);
    }
  }

  getHistory(options = {}) {
    let history = [...this.pushHistory];

    if (options.channel) {
      history = history.filter(h => h.channel === options.channel);
    }

    if (options.success !== undefined) {
      history = history.filter(h => h.success === options.success);
    }

    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  getStats() {
    const total = this.pushHistory.length;
    const success = this.pushHistory.filter(h => h.success).length;
    const failed = total - success;

    const byChannel = {};
    this.pushHistory.forEach(h => {
      if (!byChannel[h.channel]) {
        byChannel[h.channel] = { total: 0, success: 0, failed: 0 };
      }
      byChannel[h.channel].total++;
      if (h.success) {
        byChannel[h.channel].success++;
      } else {
        byChannel[h.channel].failed++;
      }
    });

    return {
      total,
      success,
      failed,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
      byChannel
    };
  }

  buildWeWorkPayload(message, msgType = 'markdown') {
    if (msgType === 'markdown') {
      return {
        msgtype: 'markdown',
        markdown: {
          content: `## ${message.title || '通知'}\n\n${message.content || message.body || ''}`
        }
      };
    }
    return {
      msgtype: 'text',
      text: { content: `${message.title || '通知'}\n\n${message.content || message.body || ''}` }
    };
  }

  buildDingTalkPayload(message) {
    return {
      msgtype: 'markdown',
      markdown: {
        title: message.title || '通知',
        text: `### ${message.title || '通知'}\n\n${message.content || message.body || ''}`
      }
    };
  }

  buildFeishuPayload(message) {
    return {
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: message.title || '通知' }
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'plain_text', content: message.content || message.body || '' }
          }
        ]
      }
    };
  }

  formatTelegramMessage(message) {
    return `<b>${message.title || '通知'}</b>\n\n${message.content || message.body || ''}`;
  }

  buildSlackPayload(message, channel) {
    return {
      channel,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: message.title || '通知' }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: message.content || message.body || '' }
        }
      ]
    };
  }

  buildDiscordPayload(message) {
    return {
      content: `**${message.title || '通知'}**\n\n${message.content || message.body || ''}`
    };
  }

  formatEmailHtml(message) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${message.title || '通知'}</h2>
          <div style="color: #666; line-height: 1.6;">
            ${message.content || message.body || ''}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            此消息由 AI Content Flow 自动发送
          </p>
        </body>
      </html>
    `;
  }

  generateDingTalkSign(secret) {
    const crypto = require('crypto');
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${secret}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(stringToSign);
    const sign = encodeURIComponent(hmac.digest('base64'));
    return `${timestamp}&sign=${sign}`;
  }

  registerChannel(channelId, config, adapter) {
    this.channelConfigs[channelId] = { ...config, enabled: true };
    this.channelAdapters.set(channelId, adapter);
    logger.info(`[PushService] 注册新渠道: ${channelId}`);
  }

  enableChannel(channel) {
    if (this.channelConfigs[channel]) {
      this.channelConfigs[channel].enabled = true;
      logger.info(`[PushService] 启用渠道: ${channel}`);
    }
  }

  disableChannel(channel) {
    if (this.channelConfigs[channel]) {
      this.channelConfigs[channel].enabled = false;
      logger.info(`[PushService] 禁用渠道: ${channel}`);
    }
  }
}

const unifiedPushService = new UnifiedPushService();

module.exports = {
  UnifiedPushService,
  unifiedPushService
};
