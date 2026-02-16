/**
 * 日志中间件
 * 为每个请求添加唯一ID并记录请求/响应信息
 */

const enhancedLogger = require('../utils/enhancedLogger');

function loggingMiddleware(req, res, next) {
  // 生成请求ID
  const requestId = enhancedLogger.generateRequestId();
  req.requestId = requestId;
  
  // 设置请求上下文
  const context = {
    requestId,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection?.remoteAddress,
    method: req.method,
    url: req.url
  };
  
  enhancedLogger.setContext(requestId, context);
  
  // 记录请求开始
  enhancedLogger.withContext(requestId).debug('Request started', {
    headers: req.headers,
    query: req.query,
    params: req.params
  });
  
  // 记录请求体（仅限开发环境且为小数据量）
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length < 10) {
    enhancedLogger.withContext(requestId).debug('Request body', { body: req.body });
  }
  
  // 监听响应结束
  const startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body) {
    res.responseBody = body;
    return originalSend.call(this, body);
  };
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 记录响应信息
    enhancedLogger.http(req, res, duration);
    
    // 记录性能信息
    if (duration > 1000) { // 超过1秒的请求记录性能日志
      enhancedLogger.withContext(requestId).perf('Slow Request', duration, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode
      });
    }
    
    // 清理上下文
    enhancedLogger.clearContext(requestId);
  });
  
  // 监听错误
  res.on('error', (error) => {
    enhancedLogger.withContext(requestId).error('Response error', {
      error: error.message,
      stack: error.stack
    });
  });
  
  next();
}

/**
 * 错误日志中间件
 */
function errorLoggingMiddleware(err, req, res, next) {
  const requestId = req.requestId;
  
  // 记录错误
  enhancedLogger.withContext(requestId).error('Request error', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500
  });
  
  // 继续错误处理流程
  next(err);
}

/**
 * 审计日志中间件
 * 记录认证和授权相关操作
 */
function auditLoggingMiddleware(req, res, next) {
  // 记录登录尝试
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    enhancedLogger.audit('USER_LOGIN_ATTEMPT', null, {
      username: req.body?.username,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  }
  
  // 记录登出操作
  if (req.path === '/api/auth/logout' && req.method === 'POST') {
    const user = req.user;
    enhancedLogger.audit('USER_LOGOUT', user, {
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  }
  
  next();
}

module.exports = {
  loggingMiddleware,
  errorLoggingMiddleware,
  auditLoggingMiddleware
};