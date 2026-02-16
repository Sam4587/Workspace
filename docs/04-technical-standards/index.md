# 📊 技术标准规范

## 🌐 环境变量标准

### 配置文件层级
```
server/
├── .env                    # 基础配置（本地开发）
├── .env.development        # 开发环境配置
├── .env.production         # 生产环境配置
└── .env.example           # 配置模板（版本控制）
```

### 核心配置项

#### 基础服务配置
```env
# 服务端口
PORT=5001
NODE_ENV=development

# CORS配置
CORS_ORIGIN=http://localhost:5174

# 日志级别
LOG_LEVEL=debug
```

#### 安全配置
```env
# JWT密钥（必需，长度≥32字符）
JWT_SECRET=your-super-long-and-complex-secret-key-here

# 管理员账户
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# 加密盐值
CRYPTO_SALT=your-crypto-salt-value
```

#### AI服务配置
```env
# OpenAI配置
OPENAI_API_KEY=sk-your-openai-key
OPENAI_API_BASE=https://api.openai.com/v1

# 通义千问配置（默认）
QWEN_API_KEY=your-qwen-api-key
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# Groq配置
GROQ_API_KEY=gsk_your-groq-key

# Cerebras配置
CEREBRAS_API_KEY=your-cerebras-key
```

#### 数据存储配置
```env
# MongoDB配置
DB_HOST=localhost
DB_PORT=27017
DB_NAME=ai_content_dev
DB_USER=
DB_PASS=

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### 第三方服务配置
```env
# 阿里云ASR配置
ALIYUN_ASR_APP_KEY=your-app-key
ALIYUN_ASR_ACCESS_KEY=your-access-key
ALIYUN_ASR_SECRET_KEY=your-secret-key

# 邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Slack Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

### 配置管理原则
1. **敏感信息不入版本控制** - 除`.env.example`外的所有`.env`文件应加入`.gitignore`
2. **环境隔离** - 不同环境使用不同的配置文件
3. **默认值设置** - 为非敏感配置提供合理的默认值
4. **文档同步** - 配置项变更时及时更新文档

---

## 📝 日志系统标准

### 日志级别规范
```javascript
const LOG_LEVELS = {
  ERROR: 0,    // 系统错误、异常情况
  WARN: 1,     // 警告信息、潜在问题
  INFO: 2,     // 一般信息、操作记录
  DEBUG: 3     // 调试信息、详细过程
};
```

### 日志分类存储
```
server/logs/
├── application/           # 应用程序日志
│   ├── app-{date}.log    # 业务逻辑日志
│   └── service-{date}.log # 服务层日志
├── access/               # 访问日志
│   └── access-{date}.log # HTTP请求日志
├── error/                # 错误日志
│   └── error-{date}.log  # 系统错误日志
├── audit/                # 审计日志
│   └── audit-{date}.log  # 安全审计日志
└── performance/          # 性能日志
    └── perf-{date}.log   # 性能指标日志
```

### 日志格式标准
```javascript
// 结构化日志格式
{
  timestamp: '2026-02-16T10:30:00.000Z',
  level: 'INFO',
  service: 'UserService',
  action: 'user_login',
  userId: 'user_123',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  duration: 150,
  message: '用户登录成功'
}

// 错误日志格式
{
  timestamp: '2026-02-16T10:30:00.000Z',
  level: 'ERROR',
  service: 'DatabaseService',
  error: {
    code: 'DB_CONNECTION_FAILED',
    message: '无法连接到数据库',
    stack: 'Error stack trace...'
  },
  context: {
    host: 'localhost:27017',
    database: 'ai_content_dev'
  }
}
```

### 日志记录最佳实践
```javascript
// ✅ 推荐做法
logger.info('用户登录', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.get('User-Agent')
});

logger.error('数据库连接失败', {
  error: err.message,
  host: dbConfig.host,
  database: dbConfig.database
});

// ❌ 避免的做法
console.log('登录成功'); // 缺乏结构化信息
logger.info(`用户${userId}登录成功，IP:${ip}`); // 字符串拼接，不利于解析
```

### 敏感信息处理
```javascript
// 敏感字段脱敏
const maskSensitiveData = (data) => ({
  ...data,
  password: '***',
  apiKey: data.apiKey ? `${data.apiKey.substring(0, 5)}***` : undefined,
  email: data.email ? `${data.email.split('@')[0].substring(0, 3)}***@${data.email.split('@')[1]}` : undefined
});
```

---

## 📈 监控告警标准

### 核心监控指标

#### 系统指标
```javascript
const SYSTEM_METRICS = {
  // CPU使用率 (%)
  cpu_usage: 75,
  
  // 内存使用率 (%)
  memory_usage: 68,
  
  // 磁盘使用率 (%)
  disk_usage: 45,
  
  // 网络IO (bytes/sec)
  network_rx: 102400,
  network_tx: 51200
};
```

#### 应用指标
```javascript
const APP_METRICS = {
  // API响应时间 (ms)
  response_time_avg: 150,
  response_time_p95: 320,
  response_time_p99: 580,
  
  // 请求成功率 (%)
  success_rate: 99.2,
  
  // 并发请求数
  concurrent_requests: 45,
  
  // 数据库连接数
  db_connections: 12
};
```

#### 业务指标
```javascript
const BUSINESS_METRICS = {
  // 用户活跃度
  active_users: 1250,
  new_users_today: 45,
  
  // 内容生产量
  contents_created: 156,
  videos_generated: 23,
  
  // 系统处理量
  api_requests_per_minute: 1250,
  data_processed_mb: 256
};
```

### 告警阈值设置

#### 紧急级别 (Critical)
```javascript
const CRITICAL_THRESHOLDS = {
  cpu_usage: 90,
  memory_usage: 85,
  disk_usage: 90,
  response_time_p99: 1000,
  error_rate: 5,
  db_connections: 80
};
```

#### 警告级别 (Warning)
```javascript
const WARNING_THRESHOLDS = {
  cpu_usage: 75,
  memory_usage: 70,
  disk_usage: 75,
  response_time_p95: 500,
  error_rate: 1,
  db_connections: 60
};
```

### 告警通知渠道

#### 邮件通知
```javascript
const emailAlert = {
  to: ['admin@company.com', 'ops@company.com'],
  subject: '[紧急] 系统CPU使用率过高',
  template: 'alert-template',
  data: {
    metric: 'cpu_usage',
    currentValue: 92,
    threshold: 90,
    timestamp: new Date()
  }
};
```

#### Slack通知
```javascript
const slackAlert = {
  webhook: process.env.SLACK_WEBHOOK_URL,
  channel: '#system-alerts',
  message: {
    text: '🚨 系统告警',
    attachments: [{
      color: 'danger',
      fields: [
        { title: '指标', value: 'CPU使用率', short: true },
        { title: '当前值', value: '92%', short: true },
        { title: '阈值', value: '90%', short: true },
        { title: '时间', value: new Date().toISOString(), short: true }
      ]
    }]
  }
};
```

#### Webhook通知
```javascript
const webhookAlert = {
  url: 'https://your-monitoring-system.com/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: {
    alert: {
      level: 'critical',
      title: '系统资源告警',
      message: 'CPU使用率达到92%',
      timestamp: new Date().toISOString(),
      metrics: { cpu_usage: 92 }
    }
  }
};
```

### 告警抑制和去重
```javascript
const alertDeduplication = {
  // 相同告警在5分钟内只发送一次
  dedup_interval: 300000,
  
  // 告警恢复通知
  recovery_notification: true,
  
  // 告警升级机制
  escalation_policy: {
    level1: { delay: 0, channels: ['slack'] },
    level2: { delay: 300000, channels: ['email'] },
    level3: { delay: 600000, channels: ['sms'] }
  }
};
```

---

## 🔒 安全标准

### 认证授权标准

#### JWT令牌配置
```javascript
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',           // 访问令牌有效期
  refreshExpiresIn: '7d',     // 刷新令牌有效期
  issuer: 'ai-content-flow',
  audience: 'web-client'
};
```

#### 权限控制矩阵
```javascript
const PERMISSIONS = {
  USER: ['read_own_profile', 'create_content'],
  ADMIN: ['*', 'manage_users', 'system_config'],
  MODERATOR: ['moderate_content', 'view_analytics']
};
```

### 输入验证标准
```javascript
const validationSchema = {
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254
  },
  
  password: {
    type: 'string',
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  },
  
  phone: {
    type: 'string',
    pattern: /^1[3-9]\d{9}$/
  }
};
```

### 安全头设置
```javascript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

---

## 📋 API设计标准

### RESTful API规范
```javascript
// 资源命名
GET    /api/users           // 获取用户列表
GET    /api/users/{id}      // 获取单个用户
POST   /api/users           // 创建用户
PUT    /api/users/{id}      // 更新用户
DELETE /api/users/{id}      // 删除用户

// 查询参数
GET /api/users?page=1&limit=20&sort=name&order=asc

// 响应格式
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2026-02-16T10:30:00Z"
}
```

### 错误响应标准
```javascript
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      { "field": "email", "message": "邮箱格式不正确" }
    ]
  }
}

// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未授权访问"
  }
}

// 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "服务器内部错误",
    "reference": "ERR_20260216_001"
  }
}
```

---

## 🎯 性能优化标准

### 前端性能指标
```javascript
const PERFORMANCE_TARGETS = {
  // 首次内容绘制 (FCP)
  fcp: '< 1.8s',
  
  // 最大内容绘制 (LCP)
  lcp: '< 2.5s',
  
  // 首次输入延迟 (FID)
  fid: '< 100ms',
  
  // 累积布局偏移 (CLS)
  cls: '< 0.1',
  
  // Bundle大小
  bundle_size: '< 2MB'
};
```

### 后端性能指标
```javascript
const BACKEND_PERFORMANCE = {
  // API响应时间
  response_time_p50: '< 100ms',
  response_time_p95: '< 500ms',
  response_time_p99: '< 1000ms',
  
  // 数据库查询
  query_time_avg: '< 50ms',
  connection_pool_utilization: '< 80%',
  
  // 缓存命中率
  cache_hit_rate: '> 90%'
};
```

### 缓存策略
```javascript
const CACHE_STRATEGY = {
  // 用户数据 - 短期缓存
  user_data: { ttl: 300, strategy: 'cache-first' },
  
  // 配置数据 - 长期缓存
  config_data: { ttl: 3600, strategy: 'stale-while-revalidate' },
  
  // 热点内容 - 分布式缓存
  hot_content: { ttl: 1800, strategy: 'cache-aside' }
};
```

---
**标准维护**: 定期评审和更新技术标准，确保与最佳实践保持同步