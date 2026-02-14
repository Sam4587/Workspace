# 接口文档

## 基础信息

- **基础 URL**: `http://localhost:5000/api`
- **API 版本**: v1
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用规范

### 请求头

```
Content-Type: application/json
Authorization: Bearer <token>
```

### 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

**失败响应**:
```json
{
  "success": false,
  "message": "错误信息",
  "error": {}
}
```

**分页响应**:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 认证接口

### 用户登录

**接口**: `POST /auth/login`

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

**接口**: `GET /auth/me`

**请求头**:
```
Authorization: Bearer <token>
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

**接口**: `GET /hot-topics`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| limit | Integer | 否 | 每页数量，默认 20 |
| category | String | 否 | 分类筛选，如"科技"、"娱乐" |
| search | String | 否 | 搜索关键词 |
| minHeat | Integer | 否 | 最小热度值 |
| maxHeat | Integer | 否 | 最大热度值 |
| sortBy | String | 否 | 排序字段，默认"heat" |
| sortOrder | String | 否 | 排序方式，"asc"或"desc"，默认"desc" |

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

**接口**: `GET /hot-topics/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 热点话题 ID |

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

**接口**: `POST /hot-topics/update`

**响应示例**:
```json
{
  "success": true,
  "message": "热点数据更新成功",
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8a",
      "title": "新热点话题",
      "description": "话题描述",
      "category": "科技",
      "heat": 90,
      "trend": "up",
      "source": "微博热搜",
      "sourceUrl": "https://s.weibo.com/weibo?q=新热点",
      "keywords": ["新", "热点"],
      "suitability": 85,
      "publishedAt": "2024-02-14T11:00:00Z",
      "createdAt": "2024-02-14T11:00:00Z",
      "updatedAt": "2024-02-14T11:00:00Z"
    }
  ]
}
```

## 内容接口

### 生成内容

**接口**: `POST /content/generate`

**请求参数**:
```json
{
  "type": "article",
  "title": "人工智能在医疗领域的应用",
  "topic": "人工智能在医疗领域的应用",
  "keywords": "人工智能,医疗,AI",
  "targetAudience": "医疗从业者",
  "tone": "professional",
  "length": "medium",
  "includeData": true,
  "includeCase": false,
  "includeExpert": false,
  "hotTopicId": "60d5ec9f8b8c6d1e8c8d7e8a"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 内容类型：article/micro/video/audio |
| title | String | 是 | 内容标题 |
| topic | String | 是 | 热点话题 |
| keywords | String | 否 | 关键词，逗号分隔 |
| targetAudience | String | 否 | 目标受众 |
| tone | String | 否 | 内容风格：professional/casual/emotional |
| length | String | 否 | 内容长度：short/medium/long |
| includeData | Boolean | 否 | 是否包含数据 |
| includeCase | Boolean | 否 | 是否包含案例 |
| includeExpert | Boolean | 否 | 是否包含专家观点 |
| hotTopicId | String | 否 | 关联的热点话题 ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
    "title": "人工智能在医疗领域的应用",
    "content": "随着人工智能技术的快速发展，AI在医疗领域的应用越来越广泛...",
    "type": "article",
    "hotTopicId": "60d5ec9f8b8c6d1e8c8d7e8a",
    "keywords": ["人工智能", "医疗", "AI"],
    "wordCount": 1200,
    "readingTime": 5,
    "quality": 85,
    "suggestions": ["可以增加具体案例", "建议补充数据支撑"],
    "status": "draft",
    "author": "AI生成",
    "metadata": {
      "targetAudience": "医疗从业者",
      "tone": "professional",
      "length": "medium",
      "includeData": true,
      "includeCase": false,
      "includeExpert": false
    },
    "createdAt": "2024-02-14T11:00:00Z",
    "updatedAt": "2024-02-14T11:00:00Z"
  }
}
```

### 获取内容列表

**接口**: `GET /content`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| limit | Integer | 否 | 每页数量，默认 20 |
| type | String | 否 | 内容类型筛选 |
| status | String | 否 | 状态筛选：draft/review/approved/rejected/published |
| hotTopicId | String | 否 | 关联热点话题 ID |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
      "title": "人工智能在医疗领域的应用",
      "content": "随着人工智能技术的快速发展...",
      "type": "article",
      "hotTopicId": "60d5ec9f8b8c6d1e8c8d7e8a",
      "keywords": ["人工智能", "医疗", "AI"],
      "wordCount": 1200,
      "readingTime": 5,
      "quality": 85,
      "status": "draft",
      "author": "AI生成",
      "createdAt": "2024-02-14T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### 获取单个内容

**接口**: `GET /content/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 内容 ID |

### 更新内容

**接口**: `PATCH /content/:id`

**请求参数**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
    "title": "更新后的标题",
    "content": "更新后的内容",
    "updatedAt": "2024-02-14T12:00:00Z"
  }
}
```

### 删除内容

**接口**: `DELETE /content/:id`

**响应示例**:
```json
{
  "success": true,
  "message": "内容删除成功"
}
```

## 发布接口

### 发布到今日头条

**接口**: `POST /publish/toutiao`

**请求参数**:
```json
{
  "contentId": "60d5ec9f8b8c6d1e8c8d7e8b",
  "scheduledTime": "2024-02-15T10:00:00Z"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| contentId | String | 是 | 内容 ID |
| scheduledTime | String | 否 | 定时发布时间，ISO 8601 格式 |

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
      "platformUrl": "https://www.toutiao.com/article/123456/",
      "publishTime": "2024-02-14T11:00:00Z"
    },
    "platformUrl": "https://www.toutiao.com/article/123456/"
  }
}
```

### 获取发布队列

**接口**: `GET /publish/queue`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| limit | Integer | 否 | 每页数量，默认 20 |
| status | String | 否 | 状态筛选：pending/success/failed |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8c",
      "contentId": {
        "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
        "title": "人工智能在医疗领域的应用",
        "type": "article"
      },
      "platform": "toutiao",
      "status": "pending",
      "scheduledTime": "2024-02-15T10:00:00Z",
      "publishTime": null,
      "createdAt": "2024-02-14T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "pages": 2
  }
}
```

### 获取发布历史

**接口**: `GET /publish/history`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| limit | Integer | 否 | 每页数量，默认 20 |
| platform | String | 否 | 平台筛选：toutiao/weibo/weixin |

### 更新发布状态

**接口**: `PATCH /publish/:id/status`

**请求参数**:
```json
{
  "status": "success"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 是 | 状态：pending/success/failed |

### 获取发布统计

**接口**: `GET /publish/stats`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "toutiao",
      "total": 50,
      "success": 45,
      "failed": 5,
      "totalViews": 100000,
      "totalLikes": 5000,
      "totalComments": 500,
      "totalShares": 200
    }
  ]
}
```

## 数据分析接口

### 获取总览数据

**接口**: `GET /analytics/overview`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalHotTopics": 156,
    "totalContents": 89,
    "totalPublished": 45,
    "totalViews": 100000,
    "totalLikes": 5000,
    "todayHotTopics": 12,
    "todayGenerated": 8,
    "todayPublished": 5,
    "platformDistribution": [
      { "platform": "toutiao", "count": 30, "percentage": 67 },
      { "platform": "weibo", "count": 15, "percentage": 33 }
    ],
    "contentTypeDistribution": [
      { "type": "article", "count": 40, "percentage": 45 },
      { "type": "micro", "count": 30, "percentage": 34 },
      { "type": "video", "count": 19, "percentage": 21 }
    ],
    "categoryTrends": [
      { "category": "科技", "count": 25, "trend": "up" },
      { "category": "娱乐", "count": 20, "trend": "stable" }
    ]
  }
}
```

### 获取内容统计

**接口**: `GET /analytics/content`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | String | 否 | 开始日期，YYYY-MM-DD |
| endDate | String | 否 | 结束日期，YYYY-MM-DD |
| groupBy | String | 否 | 分组方式：day/week/month |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-02-14",
      "generated": 10,
      "published": 5,
      "views": 2000,
      "likes": 100
    }
  ]
}
```

### 获取平台表现

**接口**: `GET /analytics/platforms`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "platform": "toutiao",
      "totalPublished": 30,
      "totalViews": 80000,
      "avgViews": 2667,
      "totalLikes": 4000,
      "avgLikes": 133,
      "totalComments": 400,
      "avgComments": 13,
      "totalShares": 150,
      "avgShares": 5
    }
  ]
}
```

### 获取热门内容

**接口**: `GET /analytics/top-content`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | Integer | 否 | 返回数量，默认 10 |
| sortBy | String | 否 | 排序字段：views/likes/comments/shares |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8b",
      "title": "人工智能在医疗领域的应用",
      "type": "article",
      "platform": "toutiao",
      "views": 5000,
      "likes": 300,
      "comments": 50,
      "shares": 20,
      "publishTime": "2024-02-14T11:00:00Z"
    }
  ]
}
```

## 健康检查

### 系统健康检查

**接口**: `GET /health`

**响应示例**:
```json
{
  "success": true,
  "timestamp": "2024-02-14T11:00:00Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "mongodb": "healthy",
    "redis": "healthy",
    "ai": "healthy"
  }
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| AUTH_001 | 用户名或密码错误 |
| AUTH_002 | Token 无效或已过期 |
| AUTH_003 | 权限不足 |
| CONTENT_001 | 内容不存在 |
| CONTENT_002 | 生成失败，请稍后重试 |
| PUBLISH_001 | 发布失败 |
| PUBLISH_002 | 平台 API 错误 |
| RATE_LIMIT_001 | 请求频率超限 |
| SERVER_001 | 服务器内部错误 |

## 限流规则

| 接口类型 | 限制 | 时间窗口 |
|----------|------|----------|
| 未认证请求 | 60 次 | 1 分钟 |
| 已认证请求 | 300 次 | 1 分钟 |
| AI 生成接口 | 10 次 | 1 小时 |
| 发布接口 | 20 次 | 1 小时 |

## Webhook

### 发布状态通知

当内容发布成功或失败时，系统会向配置的 Webhook URL 发送通知。

**请求格式**:
```json
{
  "event": "publish.success",
  "data": {
    "contentId": "60d5ec9f8b8c6d1e8c8d7e8b",
    "platform": "toutiao",
    "status": "success",
    "platformUrl": "https://www.toutiao.com/article/123456/",
    "publishTime": "2024-02-14T11:00:00Z"
  }
}
```

### 数据指标更新通知

当内容数据指标更新时，系统会发送通知。

**请求格式**:
```json
{
  "event": "metrics.update",
  "data": {
    "contentId": "60d5ec9f8b8c6d1e8c8d7e8b",
    "platform": "toutiao",
    "metrics": {
      "views": 5000,
      "likes": 300,
      "comments": 50,
      "shares": 20
    },
    "updateTime": "2024-02-14T12:00:00Z"
  }
}
```
