# AI内容创作系统 API文档

## 基础信息

- **基础URL**: `http://localhost:5000/api`
- **API版本**: v1
- **认证方式**: Bearer Token
- **数据格式**: JSON

## 认证接口

### 用户登录

```http
POST /auth/login
```

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### 获取用户信息

```http
GET /auth/me
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "admin",
    "username": "admin",
    "role": "admin"
  }
}
```

## 热点话题接口

### 获取热点话题列表

```http
GET /hot-topics
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认20
- `category` (可选): 分类筛选，如"科技"、"娱乐"
- `search` (可选): 搜索关键词
- `minHeat` (可选): 最小热度值
- `maxHeat` (可选): 最大热度值
- `sortBy` (可选): 排序字段，默认"heat"
- `sortOrder` (可选): 排序方式，"asc"或"desc"，默认"desc"

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8a",
      "title": "人工智能在医疗领域的应用",
      "description": "AI技术在医疗诊断中的应用越来越广泛",
      "category": "科技",
      "heat": 95,
      "trend": "up",
      "source": "微博热搜",
      "sourceUrl": "https://s.weibo.com/weibo?q=人工智能",
      "keywords": ["人工智能", "医疗", "AI"],
      "suitability": 88,
      "publishedAt": "2024-02-14T10:30:00Z",
      "createdAt": "2024-02-14T10:30:00Z",
      "updatedAt": "2024-02-14T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### 获取单个热点话题

```http
GET /hot-topics/{id}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8a",
    "title": "人工智能在医疗领域的应用",
    "description": "AI技术在医疗诊断中的应用越来越广泛",
    "category": "科技",
    "heat": 95,
    "trend": "up",
    "source": "微博热搜",
    "sourceUrl": "https://s.weibo.com/weibo?q=人工智能",
    "keywords": ["人工智能", "医疗", "AI"],
    "suitability": 88,
    "publishedAt": "2024-02-14T10:30:00Z",
    "createdAt": "2024-02-14T10:30:00Z",
    "updatedAt": "2024-02-14T10:30:00Z"
  }
}
```

### 更新热点数据

```http
POST /hot-topics/update
```

**响应示例**:
```json
{
  "success": true,
  "message": "热点数据更新成功",
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8a",
      "title": "新热点话题",
      "category": "科技",
      "heat": 90
    }
  ]
}
```

### 获取热点分类统计

```http
GET /hot-topics/stats/categories
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "科技",
      "count": 45,
      "avgHeat": 85.6,
      "maxHeat": 98
    },
    {
      "_id": "娱乐",
      "count": 32,
      "avgHeat": 78.2,
      "maxHeat": 95
    }
  ]
}
```

## 内容生成接口

### 生成内容

```http
POST /content/generate
```

**请求参数**:
```json
{
  "formData": {
    "topic": "人工智能在医疗领域的应用",
    "title": "AI医疗：技术革新与未来展望",
    "keywords": "人工智能,医疗,AI,诊断",
    "targetAudience": "医疗从业者",
    "tone": "professional",
    "length": "medium",
    "includeData": true,
    "includeCase": true,
    "includeExpert": false,
    "hotTopicId": "60d5ec9f8b8c6d1e8c8d7e8a"
  },
  "type": "article"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
    "title": "AI医疗：技术革新与未来展望",
    "content": "随着人工智能技术的快速发展...",
    "type": "article",
    "wordCount": 1250,
    "readingTime": 5,
    "quality": 85,
    "suggestions": ["建议添加更多实际案例"],
    "aiProvider": "openai",
    "aiModel": "gpt-3.5-turbo",
    "status": "draft",
    "author": "AI生成",
    "createdAt": "2024-02-14T10:30:00Z",
    "updatedAt": "2024-02-14T10:30:00Z"
  }
}
```

### 获取内容列表

```http
GET /content
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认20
- `type` (可选): 内容类型，"article"、"micro"、"video"、"audio"
- `status` (可选): 状态，"draft"、"review"、"approved"、"rejected"、"published"
- `search` (可选): 搜索关键词

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
      "title": "AI医疗：技术革新与未来展望",
      "type": "article",
      "status": "draft",
      "wordCount": 1250,
      "quality": 85,
      "author": "AI生成",
      "createdAt": "2024-02-14T10:30:00Z",
      "hotTopicId": {
        "_id": "60d5ec9f8b8c6d1e8c8d7e8a",
        "title": "人工智能在医疗领域的应用",
        "category": "科技",
        "heat": 95
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

### 获取单个内容

```http
GET /content/{id}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
    "title": "AI医疗：技术革新与未来展望",
    "content": "随着人工智能技术的快速发展...",
    "type": "article",
    "status": "draft",
    "wordCount": 1250,
    "readingTime": 5,
    "quality": 85,
    "suggestions": ["建议添加更多实际案例"],
    "author": "AI生成",
    "createdAt": "2024-02-14T10:30:00Z",
    "updatedAt": "2024-02-14T10:30:00Z",
    "hotTopicId": {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8a",
      "title": "人工智能在医疗领域的应用",
      "category": "科技",
      "heat": 95
    }
  }
}
```

### 更新内容

```http
PUT /content/{id}
```

**请求参数**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容...",
  "status": "review"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
    "title": "更新后的标题",
    "content": "更新后的内容...",
    "status": "review",
    "updatedAt": "2024-02-14T11:00:00Z"
  }
}
```

### 删除内容

```http
DELETE /content/{id}
```

**响应示例**:
```json
{
  "success": true,
  "message": "内容删除成功"
}
```

### 更新内容状态

```http
PATCH /content/{id}/status
```

**请求参数**:
```json
{
  "status": "approved"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
    "status": "approved",
    "updatedAt": "2024-02-14T11:00:00Z"
  }
}
```

## 发布接口

### 发布到今日头条

```http
POST /publish/toutiao
```

**请求参数**:
```json
{
  "contentId": "60d5ec9f8b8c6d1e8c8d7e8b",
  "scheduledTime": "2024-02-15T10:00:00Z"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "发布成功",
  "data": {
    "publishRecord": {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8c",
      "contentId": "60d5ec9f8b8c6d1e8c8d7e8b",
      "platform": "toutiao",
      "status": "success",
      "publishTime": "2024-02-15T10:00:00Z"
    },
    "platformUrl": "https://www.toutiao.com/article/1234567890/"
  }
}
```

### 获取发布队列

```http
GET /publish/queue
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认20
- `status` (可选): 状态，"pending"、"success"、"failed"

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8c",
      "contentId": {
        "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
        "title": "AI医疗：技术革新与未来展望",
        "type": "article"
      },
      "platform": "toutiao",
      "status": "pending",
      "scheduledTime": "2024-02-15T10:00:00Z",
      "createdAt": "2024-02-14T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### 获取发布历史

```http
GET /publish/history
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认20
- `platform` (可选): 平台，"toutiao"、"weibo"、"weixin"

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8c",
      "contentId": {
        "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
        "title": "AI医疗：技术革新与未来展望",
        "type": "article"
      },
      "platform": "toutiao",
      "status": "success",
      "publishTime": "2024-02-15T10:00:00Z",
      "platformUrl": "https://www.toutiao.com/article/1234567890/",
      "metrics": {
        "views": 15420,
        "likes": 892,
        "comments": 156,
        "shares": 78
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

### 更新发布状态

```http
PATCH /publish/{id}/status
```

**请求参数**:
```json
{
  "status": "success"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8c",
    "status": "success",
    "updatedAt": "2024-02-15T10:00:00Z"
  }
}
```

### 获取发布统计

```http
GET /publish/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "toutiao",
      "total": 25,
      "success": 20,
      "failed": 5,
      "totalViews": 45678,
      "totalLikes": 2341,
      "totalComments": 567,
      "totalShares": 234
    }
  ]
}
```

## 数据分析接口

### 获取总体统计

```http
GET /analytics/overview
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalViews": 45678,
    "totalLikes": 2341,
    "totalComments": 567,
    "totalShares": 234,
    "avgEngagement": 8.5,
    "growthRate": 15.8,
    "todayTopics": 156,
    "generatedContent": 23,
    "publishedContent": 18,
    "successRate": 92
  }
}
```

### 获取浏览量趋势

```http
GET /analytics/views-trend?days=7
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "02-08",
      "views": 1250,
      "likes": 89,
      "comments": 23
    },
    {
      "_id": "02-09",
      "views": 1456,
      "likes": 102,
      "comments": 31
    }
  ]
}
```

### 获取内容类型分布

```http
GET /analytics/content-types
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "长文章",
      "value": 45,
      "color": "#3B82F6"
    },
    {
      "name": "微头条",
      "value": 32,
      "color": "#10B981"
    },
    {
      "name": "视频脚本",
      "value": 18,
      "color": "#8B5CF6"
    },
    {
      "name": "音频脚本",
      "value": 5,
      "color": "#F59E0B"
    }
  ]
}
```

### 获取热门内容

```http
GET /analytics/top-content?limit=10
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "title": "人工智能在医疗领域的应用",
      "views": 15420,
      "likes": 892,
      "comments": 156,
      "shares": 78,
      "publishDate": "2024-02-14"
    },
    {
      "title": "春节假期出行攻略",
      "views": 8760,
      "likes": 445,
      "comments": 89,
      "shares": 34,
      "publishDate": "2024-02-14"
    }
  ]
}
```

### 获取热点话题统计

```http
GET /analytics/hot-topics?days=7
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "科技",
      "count": 45,
      "avgHeat": 85.6,
      "maxHeat": 98
    },
    {
      "_id": "娱乐",
      "count": 32,
      "avgHeat": 78.2,
      "maxHeat": 95
    }
  ]
}
```

## 健康检查接口

### 健康检查

```http
GET /api/health
```

**响应示例**:
```json
{
  "success": true,
  "timestamp": "2024-02-14T10:30:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

## 数据模型

### 热点话题 (HotTopic)

```javascript
{
  _id: ObjectId,
  title: String,           // 标题
  description: String,     // 描述
  category: String,        // 分类
  heat: Number,           // 热度值
  trend: String,          // 趋势: up/down/stable
  source: String,         // 来源
  sourceUrl: String,      // 来源URL
  keywords: [String],     // 关键词
  suitability: Number,    // 适配度
  publishedAt: Date,      // 发布时间
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

### 内容 (Content)

```javascript
{
  _id: ObjectId,
  title: String,           // 标题
  content: String,         // 内容
  type: String,           // 类型: article/micro/video/audio
  hotTopicId: ObjectId,   // 关联热点ID
  keywords: [String],     // 关键词
  wordCount: Number,      // 字数
  readingTime: Number,    // 阅读时间
  quality: Number,        // 质量评分
  suggestions: [String],  // 建议
  status: String,         // 状态
  author: String,         // 作者
  metadata: Object,       // 元数据
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

### 发布记录 (PublishRecord)

```javascript
{
  _id: ObjectId,
  contentId: ObjectId,    // 内容ID
  platform: String,       // 平台
  status: String,         // 状态
  publishTime: Date,      // 发布时间
  scheduledTime: Date,    // 计划发布时间
  platformUrl: String,    // 平台URL
  failReason: String,     // 失败原因
  metrics: {              // 指标
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number
  },
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```
