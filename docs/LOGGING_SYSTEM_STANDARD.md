# 日志系统标准化规范

## 📅 文档版本
**版本**: 1.0  
**最后更新**: 2026年2月16日  
**作者**: AI开发团队

## 🎯 目标
建立统一、结构化的日志管理系统，提供完善的日志收集、存储、分析和监控能力。

## 📋 日志级别标准

### 标准日志级别
```
error  (0) - 错误信息，需要立即关注
warn   (1) - 警告信息，需要注意但不紧急
info   (2) - 一般信息，记录重要事件
http   (3) - HTTP请求信息
debug  (4) - 调试信息，开发环境使用
```

### 日志使用场景
```javascript
// 错误日志 - 系统异常、API失败等
logger.error('数据库连接失败', { 
  error: err.message, 
  stack: err.stack,
  host: dbHost,
  port: dbPort
});

// 警告日志 - 潜在问题、非关键错误
logger.warn('API响应超时', { 
  url: requestUrl, 
  timeout: 5000,
  retryCount: 3
});

// 信息日志 - 重要业务事件
logger.info('用户登录成功', { 
  userId: user.id, 
  ip: clientIP,
  userAgent: userAgent
});

// HTTP日志 - 请求响应记录
logger.http('API请求', { 
  method: req.method,
  url: req.url,
  statusCode: res.statusCode,
  responseTime: Date.now() - startTime
});

// 调试日志 - 开发调试信息
logger.debug('变量状态', { 
  variable1: value1,
  variable2: value2
});
```

## 📁 日志文件结构

### 文件组织
```
server/logs/
├── access/                 # 访问日志
│   ├── access-2026-02-16.log
│   └── access-2026-02-17.log
├── error/                  # 错误日志
│   ├── error-2026-02-16.log
│   └── error-2026-02-17.log
├── application/            # 应用日志
│   ├── app-2026-02-16.log
│   └── app-2026-02-17.log
├── audit/                  # 审计日志
│   ├── audit-2026-02-16.log
│   └── audit-2026-02-17.log
└── archive/                # 归档日志
    ├── 2026-01/
    └── 2026-02/
```

### 日志轮转策略
- **大小限制**: 单文件最大50MB
- **时间轮转**: 每天生成新文件
- **保留期限**: 错误日志保留90天，其他日志保留30天
- **压缩归档**: 超过保留期的日志自动压缩

## 🔧 增强版日志工具

### 核心功能特性
1. **结构化日志**: JSON格式便于解析分析
2. **上下文追踪**: 自动关联请求ID和用户信息
3. **性能监控**: 记录响应时间和资源消耗
4. **安全审计**: 记录敏感操作和权限变更
5. **多输出通道**: 控制台、文件、远程日志服务

### 配置示例
```javascript
// server/config/logging.js
module.exports = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    trace: 5
  },
  
  transports: {
    console: {
      enabled: true,
      level: 'debug',
      colorize: true
    },
    
    file: {
      enabled: true,
      level: 'info',
      maxSize: '50m',
      maxFiles: '30d',
      dirname: './logs'
    },
    
    remote: {
      enabled: false,
      host: 'log-server.example.com',
      port: 514,
      protocol: 'tcp'
    }
  },
  
  format: {
    timestamp: 'YYYY-MM-DD HH:mm:ss.SSS',
    json: true,
    prettyPrint: process.env.NODE_ENV === 'development'
  }
};
```

## 🚀 实施步骤

### 1. 升级日志工具
```bash
# 安装增强依赖
npm install winston-daily-rotate-file winston-transport

# 创建日志目录
mkdir -p server/logs/{access,error,application,audit,archive}
```

### 2. 增强日志配置
```javascript
// server/utils/enhancedLogger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class EnhancedLogger {
  constructor() {
    this.logger = this.createLogger();
  }
  
  createLogger() {
    const logDir = path.join(__dirname, '../logs');
    
    const transports = [
      // 控制台输出
      new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          })
        )
      }),
      
      // 访问日志 - 每日轮转
      new DailyRotateFile({
        filename: path.join(logDir, 'access/access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        format: winston.format.json()
      }),
      
      // 错误日志 - 单独文件
      new DailyRotateFile({
        filename: path.join(logDir, 'error/error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: winston.format.json()
      }),
      
      // 应用日志
      new DailyRotateFile({
        filename: path.join(logDir, 'application/app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: winston.format.json()
      })
    ];
    
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.splat()
      ),
      transports
    });
  }
  
  // 便捷方法
  http(req, res, responseTime) {
    this.logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  }
  
  audit(action, user, details) {
    this.logger.info('AUDIT', {
      action,
      userId: user?.id || 'anonymous',
      username: user?.username || 'anonymous',
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

module.exports = new EnhancedLogger();
```

### 3. 集成到应用
```javascript
// server/middleware/loggingMiddleware.js
const logger = require('../utils/enhancedLogger');

function loggingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.debug('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // 监听响应结束
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.http(req, res, responseTime);
  });
  
  next();
}

module.exports = loggingMiddleware;
```

## ✅ 验证清单

### 功能验证
- [ ] 不同级别日志正确输出
- [ ] 日志文件按日期轮转
- [ ] 错误堆栈信息完整记录
- [ ] HTTP请求日志包含完整信息
- [ ] 审计日志记录敏感操作

### 性能验证
- [ ] 日志写入不影响主业务性能
- [ ] 大量日志情况下系统稳定
- [ ] 日志文件大小控制有效
- [ ] 磁盘空间使用合理

### 安全验证
- [ ] 敏感信息不记录到日志
- [ ] 日志文件权限设置正确
- [ ] 日志传输加密（如使用远程日志）
- [ ] 日志访问控制到位

## 📚 相关文档

- [环境变量标准化](ENVIRONMENT_VARIABLES_STANDARD.md)
- [标准化端口配置](STANDARD_PORT_CONFIGURATION.md)
- [开发工作流指南](dev/DEV_WORKFLOW.md)

---
**维护者**: AI开发团队  
**联系方式**: dev-team@example.com