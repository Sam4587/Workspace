/**
 * 增强版日志系统
 * 支持结构化日志、多通道输出、日志轮转和分析功能
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
function ensureLogDirectories() {
  const logBaseDir = path.join(__dirname, '../logs');
  const directories = [
    logBaseDir,
    path.join(logBaseDir, 'access'),
    path.join(logBaseDir, 'error'),
    path.join(logBaseDir, 'application'),
    path.join(logBaseDir, 'audit'),
    path.join(logBaseDir, 'performance'),
    path.join(logBaseDir, 'security'),
    path.join(logBaseDir, 'business')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

ensureLogDirectories();

// 自定义日志格式
const customFormats = {
  // 结构化JSON格式
  json: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
  ),

  // 彩色控制台格式
  colorful: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let output = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        output += ` ${JSON.stringify(meta)}`;
      }
      return output;
    })
  ),

  // 详细文本格式
  detailed: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let output = `${timestamp} [${level.padEnd(7)}] ${message}`;
      if (Object.keys(meta).length > 0) {
        output += `\n${JSON.stringify(meta, null, 2)}`;
      }
      return output;
    })
  )
};

// 创建不同类型的日志器
class EnhancedLogger {
  constructor() {
    this.loggers = new Map();
    this.createLoggers();
  }

  createLoggers() {
    // 访问日志
    this.loggers.set('access', winston.createLogger({
      level: 'info',
      format: customFormats.json,
      transports: [
        new DailyRotateFile({
          filename: path.join(__dirname, '../logs/access/access-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info'
        })
      ]
    }));

    // 错误日志
    this.loggers.set('error', winston.createLogger({
      level: 'error',
      format: customFormats.detailed,
      transports: [
        new DailyRotateFile({
          filename: path.join(__dirname, '../logs/error/error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error'
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`;
            })
          )
        })
      ]
    }));

    // 应用程序日志
    this.loggers.set('application', winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormats.json,
      transports: [
        new DailyRotateFile({
          filename: path.join(__dirname, '../logs/application/app-%DATE%.log'),
          datePattern: 'YYYY-MM-DD-HH',
          maxSize: '50m',
          maxFiles: '7d'
        }),
        new winston.transports.Console({
          format: customFormats.colorful
        })
      ]
    }));

    // 审计日志
    this.loggers.set('audit', winston.createLogger({
      level: 'info',
      format: customFormats.json,
      transports: [
        new DailyRotateFile({
          filename: path.join(__dirname, '../logs/audit/audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '50m',
          maxFiles: '90d'
        })
      ]
    }));

    // 性能日志
    this.loggers.set('performance', winston.createLogger({
      level: 'info',
      format: customFormats.json,
      transports: [
        new DailyRotateFile({
          filename: path.join(__dirname, '../logs/performance/perf-%DATE%.log'),
          datePattern: 'YYYY-MM-DD-HH',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ]
    }));

    // 安全日志
    this.loggers.set('security', winston.createLogger({
      level: 'warn',
      format: customFormats.detailed,
      transports: [
        new DailyRotateFile({
          filename: path.join(__dirname, '../logs/security/security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d'
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message }) => {
              return `${timestamp} 🔒 [${level}]: ${message}`;
            })
          )
        })
      ]
    }));

    // 业务日志
    this.loggers.set('business', winston.createLogger({
      level: 'info',
      format: customFormats.json,
      transports: [
        new DailyRotateFile({
          filename: path.join(__dirname, '../logs/business/business-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '50m',
          maxFiles: '30d'
        })
      ]
    }));
  }

  // 获取指定类型的日志器
  getLogger(type) {
    return this.loggers.get(type) || this.loggers.get('application');
  }

  // 便捷方法
  access(message, meta = {}) {
    this.getLogger('access').info(message, { ...meta, type: 'access' });
  }

  error(message, error = null, meta = {}) {
    const logMeta = { ...meta, type: 'error' };
    if (error) {
      logMeta.error = error.message;
      if (error.stack) logMeta.stack = error.stack;
    }
    this.getLogger('error').error(message, logMeta);
  }

  warn(message, meta = {}) {
    this.getLogger('application').warn(message, { ...meta, type: 'warning' });
  }

  info(message, meta = {}) {
    this.getLogger('application').info(message, { ...meta, type: 'info' });
  }

  debug(message, meta = {}) {
    this.getLogger('application').debug(message, { ...meta, type: 'debug' });
  }

  audit(action, user, details = {}) {
    this.getLogger('audit').info('Audit Event', {
      action,
      user,
      timestamp: new Date().toISOString(),
      ...details,
      type: 'audit'
    });
  }

  perf(operation, duration, meta = {}) {
    this.getLogger('performance').info('Performance Metric', {
      operation,
      duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      ...meta,
      type: 'performance'
    });
  }

  security(event, severity, details = {}) {
    this.getLogger('security').warn('Security Event', {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details,
      type: 'security'
    });
  }

  business(operation, result, details = {}) {
    this.getLogger('business').info('Business Event', {
      operation,
      result,
      timestamp: new Date().toISOString(),
      ...details,
      type: 'business'
    });
  }

  // 批量日志记录
  batch(logEntries) {
    logEntries.forEach(entry => {
      const { type, level, message, ...meta } = entry;
      const logger = this.getLogger(type);
      
      switch (level) {
        case 'error':
          logger.error(message, meta);
          break;
        case 'warn':
          logger.warn(message, meta);
          break;
        case 'info':
          logger.info(message, meta);
          break;
        case 'debug':
          logger.debug(message, meta);
          break;
        default:
          logger.info(message, meta);
      }
    });
  }

  // 日志分析方法
  async getLogStats(type, hours = 24) {
    const logger = this.getLogger(type);
    // 这里可以实现日志统计分析功能
    return {
      type,
      hours,
      stats: {
        totalEntries: 0,
        errorCount: 0,
        warningCount: 0
      }
    };
  }

  // 日志搜索
  async searchLogs(type, query, options = {}) {
    const { startDate, endDate, level } = options;
    // 这里可以实现日志搜索功能
    return {
      type,
      query,
      results: []
    };
  }
}

// 创建全局实例
const enhancedLogger = new EnhancedLogger();

// 导出便捷函数
module.exports = enhancedLogger;

// 同时导出原始winston实例供需要的地方使用
module.exports.winston = winston;