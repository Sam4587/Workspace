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

## 视频生成接口

### 获取视频模板列表

**接口**: `GET /api/video/templates`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "article-video",
      "name": "文章视频",
      "description": "将长文章转换为视频",
      "category": "article",
      "aspectRatio": "16:9",
      "duration": 30
    }
  ]
}
```

### 提交渲染任务

**接口**: `POST /api/video/render`

**请求参数**:
```json
{
  "templateId": "article-video",
  "props": { "title": "标题", "content": "内容" }
}
```

### 批量提交渲染任务

**接口**: `POST /api/video/render/batch`

### 生成 TTS 语音

**接口**: `POST /api/video/tts/generate`

## LLM 多提供商接口

### 获取所有提供商

**接口**: `GET /api/llm/providers`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "openrouter",
      "enabled": true,
      "type": "free",
      "models": ["google/gemma-3-12b-it:free", "deepseek/deepseek-r1-0528:free"]
    }
  ]
}
```

### 获取可用提供商

**接口**: `GET /api/llm/providers/available`

### 获取所有模型

**接口**: `GET /api/llm/models`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "deepseek/deepseek-r1-0528:free",
      "name": "DeepSeek R1",
      "type": "free",
      "provider": "openrouter",
      "available": true
    }
  ]
}
```

### 生成内容

**接口**: `POST /api/llm/generate`

**请求参数**:
```json
{
  "messages": [
    { "role": "system", "content": "你是一个专业作家" },
    { "role": "user", "content": "写一篇关于春天的文章" }
  ],
  "model": "deepseek/deepseek-r1-0528:free",
  "provider": "openrouter",
  "maxTokens": 2000,
  "temperature": 0.7
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "content": "春天是大自然苏醒的季节...",
    "model": "deepseek/deepseek-r1-0528:free",
    "provider": "openrouter",
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 200,
      "total_tokens": 250
    }
  }
}
```

### 健康检查

**接口**: `GET /api/llm/health`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "openrouter": {
      "status": "healthy",
      "name": "openrouter",
      "enabled": true,
      "type": "free"
    }
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
    "contentId": "60d5ec9f8b8c6c8d7d1e8e8b",
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

## 缓存管理接口

### 清除热点缓存

**接口**: `POST /hot-topics/invalidate-cache`

**请求参数**:
```json
{
  "source": "all"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| source | String | 否 | 数据源：all/weibo/toutiao/baidu，默认 all |

**响应示例**:
```json
{
  "success": true,
  "message": "缓存清除成功"
}
```

## 趋势分析接口

### 获取新增热点

**接口**: `GET /hot-topics/trends/new`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| hours | Integer | 否 | 时间范围（小时），默认 24 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec9f8b8c6d1e8c8d7e8a",
      "title": "新热点话题",
      "createdAt": "2024-02-14T12:00:00Z"
    }
  ]
}
```

### 获取热点趋势时间线

**接口**: `GET /hot-topics/trends/timeline/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 热点话题 ID |

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | Integer | 否 | 天数，默认 7 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "date": "2024-02-14", "heat": 85 },
    { "date": "2024-02-13", "heat": 72 }
  ]
}
```

### 获取跨平台分析

**接口**: `GET /hot-topics/trends/cross-platform/:title`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 话题标题（URL 编码） |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "title": "人工智能",
    "platforms": [
      { "source": "微博", "heat": 95, "rank": 1 },
      { "source": "头条", "heat": 88, "rank": 2 }
    ]
  }
}
```

### 记录趋势快照

**接口**: `POST /hot-topics/trends/snapshot`

**请求参数**:
```json
{
  "topics": [
    { "title": "话题1", "heat": 90 },
    { "title": "话题2", "heat": 85 }
  ]
}
```

## RSS 订阅源接口

### 获取 RSS 源列表

**接口**: `GET /hot-topics/rss/feeds`

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "url": "https://example.com/rss", "name": "示例源", "status": "active" }
  ]
}
```

### 获取 RSS 内容

**接口**: `POST /hot-topics/rss/fetch`

**请求参数**:
```json
{
  "url": "https://example.com/rss",
  "keywords": ["科技", "AI"]
}
```

## 推送通知接口

### 获取推送渠道

**接口**: `GET /hot-topics/notifications/channels`

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "channel": "wework", "enabled": true, "name": "企业微信" }
  ]
}
```

### 发送通知

**接口**: `POST /hot-topics/notifications/send`

**请求参数**:
```json
{
  "topics": ["热点话题1", "热点话题2"],
  "channels": ["wework"]
}
```

### 测试通知

**接口**: `POST /hot-topics/notifications/test`

**请求参数**:
```json
{
  "channel": "wework"
}
```

## AI 分析接口

### AI 分析话题

**接口**: `POST /hot-topics/ai/analyze`

**请求参数**:
```json
{
  "topics": ["话题1", "话题2"],
  "options": { "depth": "deep" }
}
```

### 生成简报

**接口**: `POST /hot-topics/ai/briefing`

**请求参数**:
```json
{
  "topics": ["话题1", "话题2"],
  "maxLength": 300,
  "focus": "important"
}
```

### AI 健康检查

**接口**: `GET /hot-topics/ai/health`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| provider | String | 否 | AI 提供商 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "openai": "healthy",
    "baidu": "healthy",
    "xfyun": "healthy"
  }
}
```

### 获取 AI 提供商列表

**接口**: `GET /hot-topics/ai/providers`

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "id": "openai", "name": "OpenAI", "status": "active", "isDefault": true }
  ]
}
```

### 设置默认 AI 提供商

**接口**: `POST /hot-topics/ai/providers/default`

**请求参数**:
```json
{
  "providerId": "openai"
}
```

### AI 翻译

**接口**: `POST /hot-topics/ai/translate`

**请求参数**:
```json
{
  "content": "要翻译的内容",
  "targetLanguage": "English",
  "provider": "openai"
}
```

## Prompt 模板接口

### 获取模板列表

**接口**: `GET /hot-topics/prompts/templates`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | String | 否 | 分类筛选 |
| tag | String | 否 | 标签筛选 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "xxx",
      "name": "文章生成模板",
      "category": "content",
      "tags": ["article"],
      "variables": ["title", "keywords"]
    }
  ]
}
```

### 获取单个模板

**接口**: `GET /hot-topics/prompts/templates/:id`

### 创建模板

**接口**: `POST /hot-topics/prompts参数**:
```json
{
 /templates`

**请求 "name": "模板名称",
  "content": "模板内容",
  "category": "content",
  "tags": ["tag1"],
  "variables": ["var1"]
}
```

### 更新模板

**接口**: `PUT /hot-topics/prompts/templates/:id`

### 删除模板

**接口**: `DELETE /hot-topics/prompts/templates/:id`

### 渲染模板

**接口**: `POST /hot-topics/prompts/templates/:id/render`

**请求参数**:
```json
{
  "variables": { "title": "值1", "keywords": "值2" }
}
```

### 获取模板使用历史

**接口**: `GET /hot-topics/prompts/templates/:id/history`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | Integer | 否 | 返回数量，默认 50 |

### 获取模板使用统计

**接口**: `GET /hot-topics/prompts/stats`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | Integer | 否 | 统计天数，默认 7 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalUsage": 100,
    "byTemplate": [{ "name": "模板1", "count": 50 }]
  }
}
```

### 获取模板标签列表

**接口**: `GET /hot-topics/prompts/tags`

### 获取模板分类列表

**接口**: `GET /hot-topics/prompts/categories`

## 关键词接口

### 验证关键词

**接口**: `POST /hot-topics/keywords/validate`

**请求参数**:
```json
{
  "keywords": ["关键词1", "关键词2"]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "keyword": "关键词1", "valid": true },
    { "keyword": "关键词2", "valid": false, "reason": "包含敏感词" }
  ]
}
```

## 增强数据分析接口

### 获取浏览量趋势

**接口**: `GET /analytics/views-trend`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | Integer | 否 | 天数，默认 7 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "date": "2024-02-14", "views": 5000 },
    { "date": "2024-02-13", "views": 4500 }
  ]
}
```

### 获取内容类型分布

**接口**: `GET /analytics/content-types`

**响应示例**:
```json
{
  "success": true,
  "data": [
    { "type": "article", "count": 40, "percentage": 45 },
    { "type": "micro", "count": 30, "percentage": 34 }
  ]
}
```

### 获取推荐洞察

**接口**: `GET /analytics/recommendation-insights`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| contentId | String | 是 | 内容 ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "coldStartPerformance": 75,
    "userEngagement": 80,
    "contentQuality": 85,
    "recommendationScore": 82,
    "insights": ["建议优化标题", "增加互动元素"]
  }
}
```

### 获取优化建议

**接口**: `GET /analytics/optimization-suggestions`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| contentId | String | 是 | 内容 ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "titleOptimization": ["建议使用数字", "添加关键词"],
    "contentOptimization": ["增加案例", "精简开头"],
    "timingOptimization": ["建议发布时间: 20:00-22:00"],
    "audienceOptimization": ["目标受众: 科技爱好者"]
  }
}
```
