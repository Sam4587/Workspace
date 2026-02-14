/**
 * 通知模块入口
 */

const BaseSender = require('./BaseSender');
const { NotificationDispatcher, notificationDispatcher } = require('./NotificationDispatcher');

// 发送器
const WeWorkSender = require('./senders/WeWorkSender');
const DingTalkSender = require('./senders/DingTalkSender');
const FeishuSender = require('./senders/FeishuSender');

module.exports = {
  // 基类
  BaseSender,

  // 调度器
  NotificationDispatcher,
  notificationDispatcher,

  // 发送器
  senders: {
    WeWorkSender,
    DingTalkSender,
    FeishuSender
  }
};
