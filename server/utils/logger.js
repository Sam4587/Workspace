const winston = require('winston');
const path = require('path');

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}] ${message}`;
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  if (Object.keys(metadata).length > 0) {
    log += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
  }
  
  return log;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    logFormat
  ),
  transports: [
    // 控制台输出
    new transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
      level: 'debug'
    }),
    // 错误日志文件
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    }),
    // 所有日志文件
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    }),
    // 访问日志
    new transports.File({
      filename: path.join(__dirname, '../../logs/access.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 7
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// 错误日志中间件
const errorLogger = (error, req, res, next) => {
  logger.error(`${req.method} ${req.url} - ${error.message}`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(error);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};
