# API 文档

## 基础信息

- **Base URL**: `http://localhost:5001/api`
- **Content-Type**: `application/json`
- **认证**: Bearer Token (可选)

## 监控和健康检查

### 基础健康检查
```
GET /monitoring/health
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T11:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

### 详细健康检查
```
GET /monitoring/health/detailed
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T11:00:00.000Z",
  "system": {
    "platform": "win32",
    "arch": "x64",
    "memory": {
      "total": 34132516864,
      "used": 24922849280,
      "percentage": "73.02"
    },
    "cpu": {
      "cores": 8,
      "loadAverage": [0, 0, 0]
    }
  },
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### 系统资源信息
```
GET /monitoring/system
```

**响应**:
```json
{
  "timestamp": "2026-02-16T11:00:00.000Z",
  "cpu": {
    "usage": [0, 0, 0],
    "cores": 8,
    "arch": "x64"
  },
  "memory": {
    "total": 34132516864,
    "free": 9209667584,
    "used": 24922849280,
    "percentage": "73.02"
  },
  "uptime": 182453.14,
  "platform": "win32"
}
```

### 性能指标
```
GET /monitoring/metrics
```

**响应**:
```json
{
  "timestamp": "2026-02-16T11:00:00.000Z",
  "requests": {
    "total": 1234,
    "errors": 12,
    "successRate": "99.03%"
  },
  "performance": {
    "avgResponseTime": "45ms",
    "p95ResponseTime": "120ms",
    "p99ResponseTime": "300ms"
  },
  "resources": {
    "activeConnections": 23,
    "threadPool": {
      "used": 8,
      "available": 12
    }
  }
}
```

### 服务依赖检查
```
GET /monitoring/dependencies
```

**响应**:
```json
{
  "timestamp": "2026-02-16T11:00:00.000Z",
  "services": [
    {
      "name": "MongoDB",
      "status": "healthy",
      "endpoint": "localhost:27017",
      "responseTime": "15ms"
    },
    {
      "name": "Redis",
      "status": "healthy",
      "endpoint": "localhost:6379",
      "responseTime": "2ms"
    }
  ]
}
```

### 告警状态
```
GET /monitoring/alerts
```

**响应**:
```json
{
  "timestamp": "2026-02-16T11:00:00.000Z",
  "active": [
    {
      "id": "alert_001",
      "level": "warning",
      "message": "High memory usage detected",
      "service": "backend-api",
      "triggeredAt": "2026-02-16T10:55:00.000Z"
    }
  ],
  "recent": [
    {
      "id": "alert_002",
      "level": "info",
      "message": "Service restarted successfully",
      "service": "backend-api",
      "resolvedAt": "2026-02-16T10:00:00.000Z",
      "duration": "2m 30s"
    }
  ]
}
```

---

## 热点监控

### 获取热点列表
```
GET /hot-topics
```

**参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| source | string | all | 数据源 (weibo/zhihu/toutiao/bilibili/weibo/tieba等) |
| limit | number | 20 | 每页数量 |
| page | number | 1 | 页码 |
| sortBy | string | hotValue | 排序字段 (hotValue/time) |
| sortOrder | string | desc | 排序方式 (asc/desc) |

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "xxx",
      "title": "热点标题",
      "source": "weibo",
      "hotValue": 1000000,
      "url": "https://...",
      "publishedAt": "2025-02-16T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 获取热点数据源
```
GET /hot-topics/sources
```

**响应**:
```json
{
  "success": true,
  "data": [
    { "id": "weibo", "name": "微博热搜", "enabled": true },
    { "id": "zhihu", "name": "知乎热榜", "enabled": true },
    { "id": "toutiao", "name": "今日头条", "enabled": true },
    { "id": "rss", "name": "RSS订阅", "enabled": true }
  ]
}
```

---

## 内容生成

### 获取内容列表
```
GET /content
```

**参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | string | - | 内容类型 (article/micro/video) |
| status | string | - | 状态 (draft/published) |
| limit | number | 20 | 每页数量 |
| page | number | 1 | 页码 |

### 生成内容
```
POST /content/generate
```

**请求体**:
```json
{
  "type": "article",
  "topic": "热点话题",
  "platform": "xiaohongshu",
  "style": "轻松活泼",
  "wordCount": 800,
  "tone": "professional", // casual/professional/humorous
  "includeImages": true,
  "imageCount": 3
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "content_xxx",
    "title": "生成的标题",
    "content": "生成的内容...",
    "status": "draft"
  }
}
```

### 内容改写
```
POST /content/video-rewrite
```

**请求体**:
```json
{
  "text": "原始文本内容",
  "platforms": ["xiaohongshu", "douyin", "toutiao"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "xiaohongshu": { "title": "...", "content": "..." },
    "douyin": { "title": "...", "content": "..." },
    "toutiao": { "title": "...", "content": "..." }
  }
}
```

### 获取支持的平台
```
GET /content/platforms
```

### 内容预览
```
POST /content/preview
```

**请求体**:
```json
{
  "content": "文章内容",
  "platform": "xiaohongshu",
  "type": "article"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "preview": "预览内容",
    "warnings": [],
    "suggestions": []
  }
}
```

### 内容质量评估
```
POST /content/quality-assess
```

**请求体**:
```json
{
  "content": "待评估内容",
  "criteria": ["readability", "engagement", "seo"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "scores": {
      "readability": 90,
      "engagement": 80,
      "seo": 85
    },
    "recommendations": [
      "建议增加更多关键词",
      "段落长度适中"
    ]
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": [
    { "id": "xiaohongshu", "name": "小红书", "maxTitle": 20, "maxContent": 1000 },
    { "id": "douyin", "name": "抖音", "maxTitle": 30, "maxContent": 2000 },
    { "id": "toutiao", "name": "今日头条", "maxTitle": 30, "maxContent": 2000 }
  ]
}
```

---

## 视频处理

### 下载视频
```
POST /video/download
```

**请求体**:
```json
{
  "url": "https://v.douyin.com/xxx",
  "platform": "douyin",
  "quality": "high", // high/medium/low
  "includeAudio": true,
  "watermarkRemoved": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "status": "pending"
  }
}
```

### 查询下载状态
```
GET /video/download/:taskId/status
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "progress": 100,
    "videoPath": "/videos/xxx.mp4",
    "thumbnail": "https://..."
  }
}
```

### 获取支持的平台
```
GET /video/platforms/list
```

**响应**:
```json
{
  "success": true,
  "data": [
    { "id": "douyin", "name": "抖音", "enabled": true },
    { "id": "kuaishou", "name": "快手", "enabled": true },
    { "id": "generic", "name": "其他平台", "enabled": true }
  ]
}
```

### 视频模板列表
```
GET /video/templates
```

### 提交渲染任务
```
POST /video/render
```

### 查询渲染状态
```
GET /video/render/:taskId
```

---

## 转录服务

### 提交转录任务
```
POST /transcription/submit
```

**请求体**:
```json
{
  "videoPath": "/videos/xxx.mp4",
  "engine": "whisper-local"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "trans_xxx",
    "status": "pending"
  }
}
```

### 查询转录结果
```
GET /transcription/:taskId
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "text": "转录文本内容...",
    "segments": [
      { "start": 0, "end": 5, "text": "段落1" }
    ]
  }
}
```

### 获取支持的引擎
```
GET /transcription/engines/list
```

**响应**:
```json
{
  "success": true,
  "data": [
    { "name": "whisper-local", "enabled": true },
    { "name": "aliyun-asr", "enabled": true }
  ]
}
```

---

## 数据分析

### 获取概览数据
```
GET /analytics/overview
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalViews": 12500,
    "totalLikes": 890,
    "totalComments": 234,
    "totalShares": 156,
    "avgEngagement": 72,
    "growthRate": 15,
    "todayTopics": 40,
    "generatedContent": 12,
    "publishedContent": 8,
    "successRate": 85
  }
}
```

### 获取趋势数据
```
GET /analytics/views-trend
```

### 获取内容类型分布
```
GET /analytics/content-types
```

### 获取热门内容
```
GET /analytics/top-content
```

### 获取优化建议
```
GET /analytics/optimization-suggestions
```

---

## 认证

### 登录
```
POST /auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "password"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "admin",
      "role": "administrator"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 刷新令牌
```
POST /auth/refresh
```

**请求头**:
```
Authorization: Bearer <refresh_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token"
  }
}
```

### 注销
```
POST /auth/logout
```

**请求头**:
```
Authorization: Bearer <access_token>
```

### 获取当前用户
```
GET /auth/me
```

**请求头**:
```
Authorization: Bearer <access_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "admin",
    "role": "administrator",
    "permissions": ["admin", "content:create", "content:publish"]
  }
}
```

---

## LLM 集成

### 获取可用模型
```
GET /llm/models
```

### 生成内容
```
POST /llm/generate
```

---

## 错误响应

### 标准错误格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-16T11:00:00.000Z"
}
```

### HTTP状态码说明

| 状态码 | 说明 | 场景 |
|--------|------|------|
| 200 | 成功 | 请求成功处理 |
| 201 | 已创建 | 资源创建成功 |
| 400 | 请求错误 | 参数缺失或格式错误 |
| 401 | 未授权 | 缺少或无效的认证令牌 |
| 403 | 禁止访问 | 权限不足 |
| 404 | 未找到 | 资源不存在 |
| 422 | 验证失败 | 数据验证错误 |
| 429 | 请求过多 | 超过速率限制 |
| 500 | 服务器错误 | 内部系统错误 |
| 503 | 服务不可用 | 服务暂时不可用 |

### 常见错误代码

| 错误代码 | 说明 | 解决方案 |
|----------|------|----------|
| VALIDATION_ERROR | 数据验证失败 | 检查请求参数格式 |
| AUTHENTICATION_FAILED | 认证失败 | 检查用户名密码或令牌 |
| PERMISSION_DENIED | 权限不足 | 确认用户权限 |
| RESOURCE_NOT_FOUND | 资源不存在 | 确认资源ID是否正确 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 | 降低请求频率 |
| SERVICE_UNAVAILABLE | 服务不可用 | 稍后重试 |
| INTERNAL_ERROR | 内部错误 | 联系技术支持 |

## 开发模式 Mock 数据

开发模式下，部分 API 返回模拟数据：
- 热点数据：内存缓存
- 分析数据：固定数值
- 用户认证：默认 admin 用户

---

## 前端调用示例

### 基础API调用
```javascript
import api from '../lib/api';

// 获取热点
const result = await api.getHotTopics({ 
  source: 'weibo', 
  limit: 10,
  sortBy: 'hotValue'
});

// 生成内容
const content = await api.generateContent({
  type: 'article',
  topic: '热点话题',
  platform: 'xiaohongshu',
  tone: 'professional'
});

// 下载视频
const download = await api.downloadVideo({
  url: 'https://v.douyin.com/xxx',
  quality: 'high'
});
```

### 认证相关调用
```javascript
// 登录
const loginResult = await api.login({
  username: 'admin',
  password: 'password'
});

// 设置认证令牌
api.setAuthToken(loginResult.data.tokens.accessToken);

// 获取当前用户信息
const user = await api.getCurrentUser();

// 刷新令牌
const refreshed = await api.refreshToken();
api.setAuthToken(refreshed.data.accessToken);
```

### 监控API调用
```javascript
// 健康检查
const health = await api.getHealth();

// 系统信息
const systemInfo = await api.getSystemInfo();

// 性能指标
const metrics = await api.getMetrics();

// 告警状态
const alerts = await api.getAlerts();
```

### 错误处理
```javascript
try {
  const result = await api.someApiCall();
  console.log('Success:', result);
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    console.error('参数验证失败:', error.message);
  } else if (error.code === 'AUTHENTICATION_FAILED') {
    console.error('认证失败，请重新登录');
    // 跳转到登录页面
  } else {
    console.error('未知错误:', error.message);
  }
}
```
