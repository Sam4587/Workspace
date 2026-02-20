/**
 * 进度通知服务
 * VT-005: 实时进度与移动端适配
 * 
 * 功能：
 * - WebSocket实时进度推送
 * - 进度事件管理
 * - 任务状态追踪
 * - 移动端适配支持
 */

const logger = require('../utils/logger');
const WebSocket = require('ws');
const NodeCache = require('node-cache');

const ProgressEvents = {
  VIDEO_DOWNLOAD_START: 'video_download_start',
  VIDEO_DOWNLOAD_PROGRESS: 'video_download_progress',
  VIDEO_DOWNLOAD_COMPLETE: 'video_download_complete',
  AUDIO_EXTRACTION_START: 'audio_extraction_start',
  AUDIO_EXTRACTION_COMPLETE: 'audio_extraction_complete',
  TRANSCRIPTION_START: 'transcription_start',
  TRANSCRIPTION_PROGRESS: 'transcription_progress',
  TRANSCRIPTION_COMPLETE: 'transcription_complete',
  TEXT_OPTIMIZATION_START: 'text_optimization_start',
  TEXT_OPTIMIZATION_COMPLETE: 'text_optimization_complete',
  SUMMARY_GENERATION_START: 'summary_generation_start',
  SUMMARY_GENERATION_COMPLETE: 'summary_generation_complete',
  TRANSLATION_START: 'translation_start',
  TRANSLATION_COMPLETE: 'translation_complete',
  TASK_COMPLETE: 'task_complete',
  TASK_ERROR: 'task_error'
};

class ProgressNotifierService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.taskSubscriptions = new Map();
    this.progressCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
    this.eventHistory = [];
    this.maxHistorySize = 1000;

    this.config = {
      heartbeatInterval: 30000,
      connectionTimeout: 60000,
      maxConnections: 100,
      enableHistory: true
    };
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/progress',
      maxClients: this.config.maxConnections
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.startHeartbeat();

    logger.info('[ProgressNotifier] WebSocket服务已初始化');

    return this;
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
      isMobile: this.detectMobile(req.headers['user-agent']),
      connectedAt: new Date().toISOString(),
      lastPing: Date.now(),
      subscriptions: new Set()
    };

    this.clients.set(clientId, { ws, info: clientInfo });

    ws.clientId = clientId;
    ws.isAlive = true;

    ws.on('message', (message) => {
      this.handleMessage(ws, message);
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    ws.on('error', (error) => {
      logger.error('[ProgressNotifier] WebSocket错误', { clientId, error: error.message });
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.ws.isAlive = true;
        client.info.lastPing = Date.now();
      }
    });

    this.sendToClient(ws, {
      event: 'connected',
      data: {
        clientId,
        message: '已连接到进度服务'
      }
    });

    logger.info('[ProgressNotifier] 新客户端连接', { clientId, isMobile: clientInfo.isMobile });
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case 'subscribe':
          this.subscribeToTask(ws.clientId, payload.taskId);
          break;
        case 'unsubscribe':
          this.unsubscribeFromTask(ws.clientId, payload.taskId);
          break;
        case 'ping':
          this.sendToClient(ws, { event: 'pong', data: { timestamp: Date.now() } });
          break;
        case 'get_history':
          this.sendHistory(ws, payload.taskId);
          break;
        default:
          logger.warn('[ProgressNotifier] 未知消息类型', { type });
      }
    } catch (error) {
      logger.error('[ProgressNotifier] 消息处理失败', { error: error.message });
    }
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.info.subscriptions.forEach(taskId => {
        const subs = this.taskSubscriptions.get(taskId);
        if (subs) {
          subs.delete(clientId);
        }
      });

      this.clients.delete(clientId);
      logger.info('[ProgressNotifier] 客户端断开', { clientId });
    }
  }

  subscribeToTask(clientId, taskId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.info.subscriptions.add(taskId);

    if (!this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.set(taskId, new Set());
    }
    this.taskSubscriptions.get(taskId).add(clientId);

    const cachedProgress = this.progressCache.get(taskId);
    if (cachedProgress) {
      this.sendToClient(client.ws, {
        event: 'progress_restore',
        data: cachedProgress
      });
    }

    this.sendToClient(client.ws, {
      event: 'subscribed',
      data: { taskId, message: `已订阅任务 ${taskId}` }
    });

    logger.debug('[ProgressNotifier] 订阅任务', { clientId, taskId });
  }

  unsubscribeFromTask(clientId, taskId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.info.subscriptions.delete(taskId);

    const subs = this.taskSubscriptions.get(taskId);
    if (subs) {
      subs.delete(clientId);
    }

    this.sendToClient(client.ws, {
      event: 'unsubscribed',
      data: { taskId }
    });
  }

  emit(taskId, event, data = {}) {
    const progressData = {
      taskId,
      event,
      data,
      timestamp: Date.now()
    };

    this.progressCache.set(taskId, progressData);

    if (this.config.enableHistory) {
      this.addToHistory(progressData);
    }

    const subscribers = this.taskSubscriptions.get(taskId);
    if (!subscribers || subscribers.size === 0) return;

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(client.ws, progressData);
      }
    });

    logger.debug('[ProgressNotifier] 发送进度事件', { taskId, event, subscribers: subscribers.size });
  }

  emitProgress(taskId, step, progress, details = {}) {
    this.emit(taskId, ProgressEvents.VIDEO_DOWNLOAD_PROGRESS, {
      step,
      progress,
      ...details
    });
  }

  emitComplete(taskId, result = {}) {
    this.emit(taskId, ProgressEvents.TASK_COMPLETE, {
      status: 'completed',
      result,
      completedAt: new Date().toISOString()
    });
  }

  emitError(taskId, error, details = {}) {
    this.emit(taskId, ProgressEvents.TASK_ERROR, {
      status: 'error',
      error: error.message || error,
      ...details,
      failedAt: new Date().toISOString()
    });
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendHistory(ws, taskId) {
    const history = this.eventHistory.filter(e => e.taskId === taskId);
    this.sendToClient(ws, {
      event: 'history',
      data: { taskId, events: history.slice(-50) }
    });
  }

  broadcast(event, data) {
    const message = JSON.stringify({ event, data, timestamp: Date.now() });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.ws.isAlive) {
          client.ws.terminate();
          this.handleDisconnect(clientId);
          return;
        }

        client.ws.isAlive = false;
        client.ws.ping();
      });
    }, this.config.heartbeatInterval);
  }

  detectMobile(userAgent) {
    if (!userAgent) return false;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent);
  }

  addToHistory(event) {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  getStats() {
    let mobileCount = 0;
    this.clients.forEach(client => {
      if (client.info.isMobile) mobileCount++;
    });

    return {
      totalConnections: this.clients.size,
      mobileConnections: mobileCount,
      desktopConnections: this.clients.size - mobileCount,
      activeTasks: this.taskSubscriptions.size,
      historySize: this.eventHistory.length
    };
  }

  getClientInfo(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return null;

    return {
      id: clientId,
      ...client.info,
      subscriptions: Array.from(client.info.subscriptions)
    };
  }

  listClients() {
    const clients = [];
    this.clients.forEach((client, clientId) => {
      clients.push({
        id: clientId,
        ip: client.info.ip,
        isMobile: client.info.isMobile,
        connectedAt: client.info.connectedAt,
        subscriptions: client.info.subscriptions.size
      });
    });
    return clients;
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getProgressEvents() {
    return ProgressEvents;
  }

  shutdown() {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.ws.close(1001, '服务器关闭');
      });

      this.wss.close(() => {
        logger.info('[ProgressNotifier] WebSocket服务已关闭');
      });
    }
  }
}

const progressNotifierService = new ProgressNotifierService();

module.exports = {
  ProgressNotifierService,
  progressNotifierService,
  ProgressEvents
};
