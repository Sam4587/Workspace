/**
 * 增强版日志工具
 * 提供结构化日志、上下文追踪、性能监控等功能
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class EnhancedLogger {
  constructor() {
    this.logger = this.createLogger();
    this.contextStore = new Map();
    this.maxContextAge = 5 * 60 * 1000;
    this.maxContextSize = 1000;
    this.startContextCleanup();
  }

  startContextCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleContexts();
    }, 60000);
    this.cleanupInterval.unref();
  }

  cleanupStaleContexts() {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, context] of this.contextStore) {
      if (context._timestamp && (now - context._timestamp > this.maxContextAge)) {
        this.contextStore.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.debug('[EnhancedLogger] 清理过期上下文', { cleaned, remaining: this.contextStore.size });
    }
    if (this.contextStore.size > this.maxContextSize) {
      const entries = Array.from(this.contextStore.entries());
      const toDelete = entries.slice(0, this.contextStore.size - this.maxContextSize);
      for (const [id] of toDelete) {
        this.contextStore.delete(id);
      }
      this.debug('[EnhancedLogger] 清理超出限制的上下文', { deleted: toDelete.length });
    }
  }

  /**
   * 创建日志器实例
   */
  createLogger() {
    const logDir = path.join(__dirname, '../logs');
    
    // 确保日志目录存在
    const fs = require('fs');
    const logDirs = [
      logDir,
      path.join(logDir, 'access'),
      path.join(logDir, 'error'),
      path.join(logDir, 'application'),
      path.join(logDir, 'audit'),
      path.join(logDir, 'performance')
    ];
    
    logDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const transports = [
      // 控制台输出 - 使用安全的格式化方式
      new winston.transports.Console({
        level: this.getLogLevel(),
        format: winston.format.combine(
          winston.format.timestamp({ format: 'HH:mm:ss:ms' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            try {
              const levelColors = {
                error: '\x1b[31m',
                warn: '\x1b[33m',
                info: '\x1b[36m',
                http: '\x1b[35m',
                debug: '\x1b[90m'
              };
              const reset = '\x1b[0m';
              const color = levelColors[level] || '';
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `[${timestamp}] ${color}${level}${reset}: ${message}${metaStr}`;
            } catch (e) {
              return `[${timestamp}] ${level}: ${message}`;
            }
          })
        )
      }),

      // 访问日志 - 每日轮转，记录HTTP请求
      new DailyRotateFile({
        filename: path.join(logDir, 'access/access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxSize: '50m',
        maxFiles: '30d'
      }),

      // 错误日志 - 单独文件，保留90天
      new DailyRotateFile({
        filename: path.join(logDir, 'error/error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxSize: '50m',
        maxFiles: '90d'
      }),

      // 应用日志 - 业务逻辑日志
      new DailyRotateFile({
        filename: path.join(logDir, 'application/app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxSize: '50m',
        maxFiles: '30d'
      }),

      // 审计日志 - 安全相关操作
      new DailyRotateFile({
        filename: path.join(logDir, 'audit/audit-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxSize: '20m',
        maxFiles: '90d'
      }),

      // 性能日志 - 响应时间和资源使用
      new DailyRotateFile({
        filename: path.join(logDir, 'performance/performance-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'debug',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxSize: '30m',
        maxFiles: '15d'
      })
    ];

    return winston.createLogger({
      level: this.getLogLevel(),
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        audit: 4,
        perf: 5,
        debug: 6
      },
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.splat()
      ),
      transports
    });
  }

  /**
   * 获取日志级别
   */
  getLogLevel() {
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel) return envLevel;
    
    // 根据环境设置默认级别
    switch (process.env.NODE_ENV) {
      case 'production':
        return 'info';
      case 'test':
        return 'warn';
      default:
        return 'debug';
    }
  }

  /**
   * 设置请求上下文
   */
  setContext(requestId, context) {
    this.contextStore.set(requestId, {
      ...context,
      _timestamp: Date.now()
    });
  }

  /**
   * 获取请求上下文
   */
  getContext(requestId) {
    return this.contextStore.get(requestId);
  }

  /**
   * 清理请求上下文
   */
  clearContext(requestId) {
    this.contextStore.delete(requestId);
  }

  /**
   * 生成请求ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== 标准日志方法 ====================

  error(message, meta = {}) {
    this.logger.error(message, this.enrichMeta(meta));
  }

  warn(message, meta = {}) {
    this.logger.warn(message, this.enrichMeta(meta));
  }

  info(message, meta = {}) {
    this.logger.info(message, this.enrichMeta(meta));
  }

  debug(message, meta = {}) {
    this.logger.debug(message, this.enrichMeta(meta));
  }

  // ==================== 特殊日志方法 ====================

  /**
   * HTTP请求日志
   */
  http(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get?.('user-agent') || req.headers?.['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      requestId: req.requestId
    };
    
    this.logger.http('HTTP Request', this.enrichMeta(meta));
  }

  /**
   * 审计日志
   */
  audit(action, user = null, details = {}) {
    const meta = {
      action,
      userId: user?.id || 'anonymous',
      username: user?.username || 'anonymous',
      timestamp: new Date().toISOString(),
      ...details
    };
    
    this.logger.info('AUDIT', this.enrichMeta(meta));
  }

  /**
   * 性能日志
   */
  perf(operation, duration, details = {}) {
    const meta = {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    this.logger.perf('PERFORMANCE', this.enrichMeta(meta));
  }

  /**
   * 数据库操作日志
   */
  db(operation, collection, query = null, duration = null) {
    const meta = {
      operation,
      collection,
      query: query ? JSON.stringify(query) : undefined,
      duration: duration ? `${duration}ms` : undefined
    };
    
    this.info('DATABASE', meta);
  }

  /**
   * API调用日志
   */
  api(method, url, status, duration, details = {}) {
    const meta = {
      method,
      url,
      status,
      duration: `${duration}ms`,
      ...details
    };
    
    this.info('API_CALL', meta);
  }

  /**
   * 丰富元数据，添加上下文信息
   */
  enrichMeta(meta) {
    // 添加时间戳
    const enriched = {
      timestamp: new Date().toISOString(),
      ...meta
    };

    // 添加请求上下文（如果存在）
    if (meta.requestId) {
      const context = this.getContext(meta.requestId);
      if (context) {
        enriched.context = context;
      }
    }

    return enriched;
  }

  /**
   * 创建带上下文的日志方法
   */
  withContext(requestId) {
    const self = this;
    return {
      error: (message, meta = {}) => self.error(message, { ...meta, requestId }),
      warn: (message, meta = {}) => self.warn(message, { ...meta, requestId }),
      info: (message, meta = {}) => self.info(message, { ...meta, requestId }),
      debug: (message, meta = {}) => self.debug(message, { ...meta, requestId }),
      http: (req, res, time) => self.http(req, res, time),
      audit: (action, user, details) => self.audit(action, user, { ...details, requestId }),
      perf: (operation, duration, details) => self.perf(operation, duration, { ...details, requestId })
    };
  }

  /**
   * 记录异常
   */
  logError(error, context = {}) {
    const meta = {
      error: error.message,
      stack: error.stack,
      ...context
    };
    
    this.error('Unhandled Exception', meta);
  }

  /**
   * 记录警告
   */
  logWarning(warning, context = {}) {
    this.warn('Warning', { warning, ...context });
  }
}

// 创建单例实例
const enhancedLogger = new EnhancedLogger();

// 全局错误处理 - 优雅降级而非立即退出
let errorCount = 0;
const MAX_ERRORS_BEFORE_EXIT = 10;
const ERROR_WINDOW_MS = 60000;
let errorWindowStart = Date.now();

process.on('uncaughtException', (error) => {
  const now = Date.now();
  
  // 重置错误计数窗口
  if (now - errorWindowStart > ERROR_WINDOW_MS) {
    errorCount = 0;
    errorWindowStart = now;
  }
  
  errorCount++;
  
  enhancedLogger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    type: 'uncaughtException',
    errorCount,
    pid: process.pid
  });
  
  // 如果短时间内错误过多，才退出进程
  if (errorCount >= MAX_ERRORS_BEFORE_EXIT) {
    enhancedLogger.error('Too many errors, exiting process', {
      errorCount,
      windowMs: ERROR_WINDOW_MS
    });
    process.exit(1);
  }
  
  // 否则继续运行，实现优雅降级
  enhancedLogger.warn('Process continuing after error (graceful degradation)', {
    errorCount,
    remainingBeforeExit: MAX_ERRORS_BEFORE_EXIT - errorCount
  });
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  
  enhancedLogger.error('Unhandled Rejection', {
    error: error.message,
    stack: error.stack,
    type: 'unhandledRejection',
    promise: promise.constructor.name
  });
  
  // 不退出进程，仅记录错误
});

module.exports = enhancedLogger;