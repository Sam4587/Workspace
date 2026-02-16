# API 文档

## 基础信息

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **认证**: Bearer Token (可选)

---

## 热点监控

### 获取热点列表
```
GET /hot-topics
```

**参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| source | string | all | 数据源 (weibo/zhihu/toutiao/rss) |
| limit | number | 20 | 每页数量 |
| page | number | 1 | 页码 |

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
  "style": "轻松活泼"
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
  "platform": "douyin"
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

### 获取当前用户
```
GET /auth/me
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

所有错误响应格式：
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

## 开发模式 Mock 数据

开发模式下，部分 API 返回模拟数据：
- 热点数据：内存缓存
- 分析数据：固定数值
- 用户认证：默认 admin 用户

---

## 前端调用示例

```javascript
import api from '../lib/api';

// 获取热点
const result = await api.getHotTopics({ source: 'weibo', limit: 10 });

// 生成内容
const content = await api.generateContent({
  type: 'article',
  topic: '热点话题'
});

// 下载视频
const download = await api.downloadVideo({
  url: 'https://v.douyin.com/xxx'
});
```
