/**
 * 增强版通知服务
 * 支持多种通知渠道：邮件、Webhook、Slack、钉钉等
 */

const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.channels = {
      email: this.sendEmail.bind(this),
      webhook: this.sendWebhook.bind(this),
      slack: this.sendSlack.bind(this),
      dingtalk: this.sendDingTalk.bind(this),
      console: this.sendConsole.bind(this)
    };
    
    this.config = {
      email: {
        enabled: process.env.EMAIL_ENABLED === 'true',
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: process.env.EMAIL_FROM || 'noreply@example.com'
      },
      webhook: {
        enabled: process.env.WEBHOOK_ENABLED === 'true',
        urls: process.env.WEBHOOK_URLS ? process.env.WEBHOOK_URLS.split(',') : []
      },
      slack: {
        enabled: process.env.SLACK_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL
      },
      dingtalk: {
        enabled: process.env.DINGTALK_ENABLED === 'true',
        webhookUrl: process.env.DINGTALK_WEBHOOK_URL
      }
    };
    
    this.transporter = this.config.email.enabled ? 
      nodemailer.createTransporter(this.config.email.smtp) : null;
  }

  /**
   * 发送通知
   * @param {string} level - 告警级别: critical, high, medium, low
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Object} options - 额外选项
   */
  async sendNotification(level, title, message, options = {}) {
    const notification = {
      level,
      title,
      message,
      timestamp: new Date().toISOString(),
      ...options
    };

    const channels = options.channels || ['console'];
    
    const results = [];
    for (const channel of channels) {
      if (this.channels[channel] && this.isChannelEnabled(channel)) {
        try {
          const result = await this.channels[channel](notification);
          results.push({ channel, success: true, result });
        } catch (error) {
          results.push({ channel, success: false, error: error.message });
        }
      }
    }
    
    return results;
  }

  /**
   * 检查渠道是否启用
   */
  isChannelEnabled(channel) {
    switch (channel) {
      case 'email':
        return this.config.email.enabled && this.transporter;
      case 'webhook':
        return this.config.webhook.enabled && this.config.webhook.urls.length > 0;
      case 'slack':
        return this.config.slack.enabled && this.config.slack.webhookUrl;
      case 'dingtalk':
        return this.config.dingtalk.enabled && this.config.dingtalk.webhookUrl;
      case 'console':
        return true;
      default:
        return false;
    }
  }

  /**
   * 发送邮件通知
   */
  async sendEmail(notification) {
    if (!this.transporter) {
      throw new Error('邮件服务未配置');
    }

    const mailOptions = {
      from: this.config.email.from,
      to: notification.recipients || process.env.ALERT_EMAIL_RECIPIENTS || 'admin@example.com',
      subject: `[${notification.level.toUpperCase()}] ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #d32f2f;">${notification.title}</h2>
          <p><strong>级别:</strong> ${notification.level}</p>
          <p><strong>时间:</strong> ${notification.timestamp}</p>
          <hr>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p>${notification.message}</p>
          </div>
          ${notification.details ? `
            <details style="margin-top: 15px;">
              <summary>详细信息</summary>
              <pre style="background: #f0f0f0; padding: 10px; overflow-x: auto;">${JSON.stringify(notification.details, null, 2)}</pre>
            </details>
          ` : ''}
        </div>
      `
    };

    return await this.transporter.sendMail(mailOptions);
  }

  /**
   * 发送Webhook通知
   */
  async sendWebhook(notification) {
    const results = [];
    
    for (const url of this.config.webhook.urls) {
      try {
        const response = await axios.post(url, {
          ...notification,
          event: 'alert'
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Content-Flow-Alert-System/1.0'
          }
        });
        
        results.push({
          url,
          status: response.status,
          data: response.data
        });
      } catch (error) {
        results.push({
          url,
          error: error.message,
          status: error.response?.status
        });
      }
    }
    
    return results;
  }

  /**
   * 发送Slack通知
   */
  async sendSlack(notification) {
    if (!this.config.slack.webhookUrl) {
      throw new Error('Slack webhook URL未配置');
    }

    const colorMap = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#ffeb3b',
      low: '#4caf50'
    };

    const payload = {
      attachments: [{
        color: colorMap[notification.level] || '#cccccc',
        title: notification.title,
        text: notification.message,
        fields: [
          {
            title: '级别',
            value: notification.level.toUpperCase(),
            short: true
          },
          {
            title: '时间',
            value: notification.timestamp,
            short: true
          }
        ],
        footer: 'AI Content Flow 监控系统',
        ts: Math.floor(new Date(notification.timestamp).getTime() / 1000)
      }]
    };

    if (notification.details) {
      payload.attachments[0].fields.push({
        title: '详细信息',
        value: `\`\`\`${JSON.stringify(notification.details, null, 2)}\`\`\``,
        short: false
      });
    }

    const response = await axios.post(this.config.slack.webhookUrl, payload, {
      timeout: 5000
    });

    return response.data;
  }

  /**
   * 发送钉钉通知
   */
  async sendDingTalk(notification) {
    if (!this.config.dingtalk.webhookUrl) {
      throw new Error('钉钉 webhook URL未配置');
    }

    const levelEmojis = {
      critical: '🚨',
      high: '⚠️',
      medium: 'ℹ️',
      low: '✅'
    };

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: notification.title,
        text: `## ${levelEmojis[notification.level] || ''} ${notification.title}\n\n` +
              `**级别**: ${notification.level.toUpperCase()}\n\n` +
              `**时间**: ${notification.timestamp}\n\n` +
              `---\n\n` +
              `${notification.message}\n\n` +
              (notification.details ? 
                `**详细信息**:\n\`\`\`json\n${JSON.stringify(notification.details, null, 2)}\n\`\`\`` : '')
      }
    };

    const response = await axios.post(this.config.dingtalk.webhookUrl, payload, {
      timeout: 5000
    });

    return response.data;
  }

  /**
   * 控制台通知（主要用于开发调试）
   */
  sendConsole(notification) {
    const levelColors = {
      critical: '\x1b[31m',  // 红色
      high: '\x1b[33m',     // 黄色
      medium: '\x1b[36m',   // 青色
      low: '\x1b[32m'       // 绿色
    };

    const resetColor = '\x1b[0m';
    const color = levelColors[notification.level] || '\x1b[37m';

    console.log(`${color}[${notification.level.toUpperCase()} ALERT]${resetColor}`);
    console.log(`Title: ${notification.title}`);
    console.log(`Message: ${notification.message}`);
    console.log(`Time: ${notification.timestamp}`);
    if (notification.details) {
      console.log(`Details: ${JSON.stringify(notification.details, null, 2)}`);
    }
    console.log('---');

    return { success: true, method: 'console' };
  }

  /**
   * 发送紧急告警
   */
  async sendCriticalAlert(title, message, details = {}) {
    return await this.sendNotification('critical', title, message, {
      details,
      channels: ['email', 'webhook', 'slack', 'dingtalk']
    });
  }

  /**
   * 发送高优先级告警
   */
  async sendHighAlert(title, message, details = {}) {
    return await this.sendNotification('high', title, message, {
      details,
      channels: ['email', 'webhook', 'console']
    });
  }

  /**
   * 发送中等优先级告警
   */
  async sendMediumAlert(title, message, details = {}) {
    return await this.sendNotification('medium', title, message, {
      details,
      channels: ['webhook', 'console']
    });
  }

  /**
   * 发送低优先级告警
   */
  async sendLowAlert(title, message, details = {}) {
    return await this.sendNotification('low', title, message, {
      details,
      channels: ['console']
    });
  }

  /**
   * 测试通知渠道
   */
  async testChannels() {
    const testResults = {};
    
    for (const [channel, isEnabled] of Object.entries(this.config)) {
      if (isEnabled && this.isChannelEnabled(channel)) {
        try {
          const result = await this.sendNotification('low', '测试通知', '这是一个测试消息', {
            channels: [channel]
          });
          testResults[channel] = { success: true, result };
        } catch (error) {
          testResults[channel] = { success: false, error: error.message };
        }
      } else {
        testResults[channel] = { success: false, reason: '渠道未启用' };
      }
    }
    
    return testResults;
  }
}

module.exports = new NotificationService();