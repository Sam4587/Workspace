# 全链路AI创作系统 - 技术预研报告

> 预研时间：2025-02-16
> 目标：为全链路AI创作系统选择合适的技术方案

---

## 一、技术选型总览

| 模块 | 推荐方案 | 备选方案 | 理由 |
|------|----------|----------|------|
| 工作流引擎 | 自研轻量级 + node-cron | BullMQ Flow | 项目已有 node-cron，更轻量 |
| 任务队列 | BullMQ | p-queue (已有) | BullMQ 支持持久化、分布式 |
| 发布集成 | HTTP API | gRPC | publisher-tools 已有 REST API |
| 缓存/状态 | Redis (已有依赖) | MongoDB | Redis 更适合队列和缓存 |
| 定时调度 | node-cron (已有) | BullMQ Repeat | 已集成，功能满足 |
| 数据闭环 | MongoDB + 定时任务 | 独立分析服务 | 复用现有架构 |

---

## 二、工作流引擎方案对比

### 方案一：BullMQ Flow（推荐度：⭐⭐⭐）

**优点**：
- 成熟的任务编排能力
- 支持子任务、依赖关系
- 内置重试、延迟、优先级
- 可视化监控（Bull Board）

**缺点**：
- 需要 Redis 持久化
- 学习成本较高
- 对于简单流程可能过重

**适用场景**：复杂的多步骤工作流

### 方案二：自研轻量级工作流（推荐度：⭐⭐⭐⭐⭐）

**优点**：
- 完全可控，贴合业务
- 无额外依赖
- 代码量可控（约200行核心代码）
- 与现有 node-cron 无缝集成

**缺点**：
- 需要自己实现重试、错误处理
- 无现成监控面板

**核心设计**：
```javascript
// 工作流定义
const workflow = {
  name: 'hotToPublish',
  steps: [
    { name: 'fetchHot', action: 'fetchHotTopics' },
    { name: 'analyze', action: 'analyzeTopics', depends: ['fetchHot'] },
    { name: 'generate', action: 'generateContent', depends: ['analyze'] },
    { name: 'review', action: 'reviewContent', depends: ['generate'] },
    { name: 'publish', action: 'publishContent', depends: ['review'] }
  ],
  triggers: [
    { type: 'schedule', cron: '0 * * * *' },  // 每小时
    { type: 'webhook', path: '/webhook/hot-detected' }
  ]
};
```

### 方案三：Temporal（推荐度：⭐⭐）

**优点**：
- 企业级工作流引擎
- 极强的可靠性保证
- 支持长时间运行的任务

**缺点**：
- 需要独立部署 Temporal Server
- 架构复杂度高
- 资源消耗大

**结论**：对于当前项目规模，不推荐。

### 📌 工作流引擎推荐

**推荐：方案二 - 自研轻量级工作流**

理由：
1. 项目已有 `node-cron` 和 `p-queue`
2. 工作流相对简单（线性为主）
3. 开发成本低，约2-3天可完成
4. 完全可控，便于调试和维护

---

## 三、任务队列方案对比

### 方案一：BullMQ（推荐度：⭐⭐⭐⭐⭐）

**优点**：
- Node.js 最成熟的队列库
- 支持优先级、延迟、重试
- 支持任务进度追踪
- 支持分布式处理
- 有 Bull Board 监控面板

**缺点**：
- 需要 Redis

**核心API**：
```javascript
const { Queue, Worker } = require('bullmq');

// 创建队列
const contentQueue = new Queue('content-generation', {
  connection: { host: 'localhost', port: 6379 }
});

// 添加任务
await contentQueue.add('generate', {
  topic: '热点话题',
  platforms: ['xiaohongshu', 'douyin']
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }
});

// 处理任务
const worker = new Worker('content-generation', async job => {
  const { topic, platforms } = job.data;
  // 处理逻辑...
});
```

### 方案二：p-queue（推荐度：⭐⭐⭐⭐）

**优点**：
- 项目已集成（v9.1.0）
- 无需 Redis
- API 简单
- 支持并发控制

**缺点**：
- 无持久化（重启丢失）
- 无分布式支持
- 无内置重试机制

**当前使用情况**：
```javascript
// 已在项目中使用
const { default: PQueue } = require('p-queue');
const queue = new PQueue({ concurrency: 3 });
```

### 方案三：RabbitMQ（推荐度：⭐⭐）

**优点**：
- 企业级消息队列
- 多语言支持
- 高可靠性

**缺点**：
- 需要独立部署
- 配置复杂
- 对于 Node.js 项目过重

### 📌 任务队列推荐

**推荐：BullMQ + Redis**

理由：
1. 项目已有 Redis 依赖
2. 支持持久化，重启不丢任务
3. 支持批量任务、进度追踪
4. 有现成监控面板

**但：对于开发阶段，可先用 p-queue（已集成）快速验证，后续再迁移到 BullMQ**

---

## 四、发布集成方案对比

### 方案一：HTTP API 集成（推荐度：⭐⭐⭐⭐⭐）

**架构**：
```
TrendRadar (master)  ──HTTP──▶  Publisher Tools (独立服务)
     :5000                              :8080
         │
         ├── POST /api/publish
         ├── GET /api/tasks/:id
         └── GET /api/platforms
```

**优点**：
- publisher-tools 已有 REST API
- 服务解耦，独立部署
- 可跨服务器调用
- 易于调试

**集成代码示例**：
```javascript
// server/integrations/publisherTools.js
class PublisherToolsClient {
  constructor() {
    this.baseURL = process.env.PUBLISHER_API_URL || 'http://localhost:8080';
  }

  async publish(platform, content) {
    return axios.post(`${this.baseURL}/api/v1/publish`, {
      platform,
      type: content.type,
      title: content.title,
      content: content.body,
      images: content.images
    });
  }

  async getStatus(taskId) {
    return axios.get(`${this.baseURL}/api/v1/tasks/${taskId}`);
  }
}
```

### 方案二：Git Submodule（推荐度：⭐⭐）

**优点**：
- 代码在同一仓库
- 共享类型定义

**缺点**：
- 维护复杂
- 不适合独立部署

### 方案三：合并分支（推荐度：⭐）

**缺点**：
- 失去解耦优势
- 技术栈不同（Go vs Node.js）

### 📌 发布集成推荐

**推荐：方案一 - HTTP API 集成**

实施步骤：
1. 部署 publisher-tools 服务（Go 后端）
2. 创建 API 客户端封装
3. 在工作流中调用发布 API

---

## 五、定时调度方案对比

### 方案一：node-cron（推荐度：⭐⭐⭐⭐⭐，已集成）

**当前状态**：已在项目中使用
```javascript
// server/services/scheduleService.js
const cron = require('node-cron');
```

**优点**：
- 已集成，无额外成本
- API 简单直观
- 支持标准 cron 表达式

**功能验证**：
```javascript
// 每小时抓取热点
cron.schedule('0 * * * *', async () => {
  await fetchHotTopics();
});

// 每天 8:00 发布
cron.schedule('0 8 * * *', async () => {
  await publishScheduledContent();
});
```

### 方案二：BullMQ Repeat（推荐度：⭐⭐⭐⭐）

**优点**：
- 与任务队列统一
- 支持动态调整

**缺点**：
- 需要 Redis

### 方案三：node-schedule（推荐度：⭐⭐⭐）

**优点**：
- 支持更灵活的调度规则

**缺点**：
- 需要额外集成

### 📌 定时调度推荐

**推荐：继续使用 node-cron**

理由：
1. 已集成并使用
2. 功能满足需求
3. 无迁移成本

---

## 六、数据闭环方案对比

### 方案一：定时采集 + MongoDB（推荐度：⭐⭐⭐⭐⭐）

**架构**：
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 定时任务     │────▶│ 数据采集器   │────▶│ MongoDB     │
│ node-cron   │     │ 平台API     │     │ 分析数据    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**实现方式**：
```javascript
// server/services/dataCollector.js
class DataCollector {
  // 定时采集发布效果
  async collectPublishMetrics() {
    const records = await PublishRecord.find({ status: 'published' });
    for (const record of records) {
      const metrics = await this.fetchPlatformMetrics(record);
      await PublishRecord.findByIdAndUpdate(record._id, {
        metrics: {
          views: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          collectedAt: new Date()
        }
      });
    }
  }
}
```

### 方案二：Webhook 回调（推荐度：⭐⭐⭐）

**优点**：
- 实时性高

**缺点**：
- 平台支持有限
- 需要公网地址

### 方案三：独立分析服务（推荐度：⭐⭐）

**缺点**：
- 架构复杂
- 开发成本高

### 📌 数据闭环推荐

**推荐：方案一 - 定时采集 + MongoDB**

理由：
1. 复用现有架构
2. 开发成本低
3. 数据可控

---

## 七、缓存方案对比

### 方案一：Redis（推荐度：⭐⭐⭐⭐⭐）

**当前状态**：依赖已安装（v4.6.13）

**用途**：
- 任务队列持久化
- 热点数据缓存
- Session 存储
- API 限流

**配置示例**：
```javascript
// server/config/redis.js
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// 缓存热点数据
await redis.setex('hot-topics:weibo', 3600, JSON.stringify(topics));
```

### 方案二：node-cache（推荐度：⭐⭐⭐⭐，已集成）

**当前状态**：已在使用

**优点**：
- 无需外部服务
- 适合开发环境

**缺点**：
- 无持久化
- 不支持分布式

### 📌 缓存推荐

**生产环境：Redis**
**开发环境：node-cache（当前方案）**

---

## 八、最终技术选型

### 核心技术栈

| 层级 | 技术 | 版本 | 状态 |
|------|------|------|------|
| 工作流引擎 | 自研 + node-cron | 已有 | ✅ 已集成 |
| 任务队列 | p-queue → BullMQ | 9.1.0 | ⚠️ 开发用p-queue，生产迁移BullMQ |
| 发布集成 | HTTP API | - | 🆕 需开发 |
| 定时调度 | node-cron | 3.0.3 | ✅ 已集成 |
| 缓存 | node-cache / Redis | 5.1.2 / 4.6.13 | ✅ 已集成 |
| 数据库 | MongoDB | 8.8.0 | ✅ 已集成 |
| 日志 | Winston | 3.17.0 | ✅ 已集成 |

### 新增依赖

```json
{
  "bullmq": "^5.0.0",       // 任务队列（生产环境）
  "ioredis": "^5.3.0"       // Redis 客户端（如用 BullMQ）
}
```

---

## 九、风险与建议

### 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Redis 单点故障 | 高 | 使用 Redis Sentinel 或云服务 |
| 发布服务不可用 | 中 | 重试机制 + 降级策略 |
| 平台API变更 | 中 | 抽象层隔离 |

### 实施建议

1. **Phase 1**：先实现核心流程，使用 p-queue + node-cache
2. **Phase 2**：验证流程稳定后，迁移到 BullMQ + Redis
3. **Phase 3**：部署独立的 publisher-tools 服务

---

## 十、下一步行动

1. [ ] 创建工作流引擎模块 `server/workflows/`
2. [ ] 创建发布集成客户端 `server/integrations/publisherTools.js`
3. [ ] 实现热点→内容的自动化流程
4. [ ] 添加批量任务处理能力

