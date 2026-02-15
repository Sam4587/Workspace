# 热点监控功能迁移分析文档

## 1. 项目背景

本文档旨在分析现有项目与 TrendRadar 开源项目在热点监控功能上的差异，为新版本热点监控功能的实现提供参考依据。

### 业务闭环

完整的 AI 内容创作业务闭环：

```
热点监控 -> 内容生成 -> 发布管理 -> 数据分析
```

## 2. 现有项目架构分析

### 2.1 前端项目对比

| 维度 | 旧前端 (/workspace/src/) | 新前端 (/workspace/tools/publisher-web/) |
|------|--------------------------|------------------------------------------|
| 框架 | React + JavaScript | React + TypeScript |
| 构建 | Vite | Vite |
| 组件库 | shadcn/ui + Tailwind | shadcn/ui + Tailwind |
| 状态管理 | React Query | React Query |
| 路由 | React Router | React Router |

### 2.2 旧前端页面功能

| 页面 | 功能描述 | 保留建议 |
|------|----------|----------|
| `HotTopics.jsx` | 热点监控页面，支持搜索、筛选、分类查看热点话题 | 核心功能，需迁移 |
| `ContentGeneration.jsx` | 内容生成页面，基于热点生成文章/微头条 | 已有新版，保留 |
| `Publishing.jsx` | 发布管理页面 | 已有新版，保留 |
| `Analytics.jsx` | 数据分析页面 | 已有新版，保留 |
| `VideoGeneration.jsx` | 视频生成页面 | 已有新版，保留 |
| `Index.jsx` | 总览页面 | 需重构整合 |

### 2.3 旧前端核心组件

| 组件 | 功能描述 | 迁移建议 |
|------|----------|----------|
| `TopicCard.jsx` | 热点卡片展示组件 | 需迁移 |
| `FilterPanel.jsx` | 筛选面板组件 | 需迁移 |
| `TrendTimeline.jsx` | 趋势时间轴组件 | 需迁移 |
| `AIAnalysisPanel.jsx` | AI 分析面板组件 | 需迁移 |
| `CrossPlatformAnalysis.jsx` | 跨平台分析组件 | 需迁移 |

### 2.4 现有后端服务

| 服务 | 文件路径 | 功能描述 |
|------|----------|----------|
| HotTopicService | `/server/services/hotTopicService.js` | 热点数据获取与存储 |
| TrendAnalysisService | `/server/services/trendAnalysisService.js` | 趋势分析服务 |
| AIAnalysisService | `/server/services/aiAnalysisService.js` | AI 分析服务 |
| RSSService | `/server/services/rssService.js` | RSS 订阅服务 |
| FetcherManager | `/server/fetchers/` | 多平台数据抓取器 |

### 2.5 现有数据抓取能力

| 平台 | 实现状态 | 文件 |
|------|----------|------|
| 微博热搜 | 已实现 | `WeiboFetcher.js` |
| 今日头条 | 已实现 | `ToutiaoFetcher.js` |
| 知乎热榜 | 已实现 | `ZhihuFetcher.js` |
| RSS 订阅 | 已实现 | `RSSFetcher.js` |

### 2.6 现有 AI 集成

项目已实现 `LiteLLMAdapter.js`，支持通过 LiteLLM Proxy 接入多种 AI 提供商。

## 3. TrendRadar 项目分析

### 3.1 项目概述

TrendRadar 是一个热点聚合与分析平台，核心功能：

- 多源数据聚合（百度、微博、知乎、头条等 12+ 平台）
- RSS 订阅支持
- AI 深度分析（基于 LiteLLM，支持 100+ AI 提供商）
- 多渠道推送通知
- 调度系统（支持多种预设模式）

### 3.2 数据源配置

TrendRadar 支持的平台（配置文件 `config.yaml`）：

```yaml
platforms:
  sources:
    - id: "toutiao"        # 今日头条
    - id: "baidu"          # 百度热搜
    - id: "wallstreetcn-hot"  # 华尔街见闻
    - id: "thepaper"       # 澎湃新闻
    - id: "bilibili-hot-search"  # B站热搜
    - id: "cls-hot"        # 财联社热门
    - id: "ifeng"          # 凤凰网
    - id: "tieba"          # 贴吧
    - id: "weibo"          # 微博
    - id: "douyin"         # 抖音
    - id: "zhihu"          # 知乎
```

### 3.3 数据获取方式

TrendRadar 使用 NewsNow API 进行数据聚合：

```python
# trendradar/crawler/fetcher.py
NEWSNOW_API = "https://newsnow.busiyi.world/api/s"
```

优势：
- 统一 API 入口，无需维护各平台爬虫
- 自动处理反爬、编码等问题
- 数据格式标准化

### 3.4 AI 分析配置

```yaml
ai:
  model: "deepseek/deepseek-chat"
  api_key: ""           # 支持环境变量 AI_API_KEY
  api_base: ""          # 支持自定义 API 端点
  timeout: 120
  temperature: 1.0
  max_tokens: 5000
  num_retries: 1
  fallback_models: []   # 备用模型列表
```

### 3.5 调度系统

TrendRadar 内置多种调度预设：

| 预设名称 | 说明 |
|----------|------|
| `always_on` | 全天候，有新增即推送 |
| `morning_evening` | 全天推送 + 晚间当日汇总（推荐）|
| `office_hours` | 工作日三段式（到岗->午间->收工）|
| `night_owl` | 午后速览 + 深夜全天汇总 |
| `custom` | 完全自定义 |

### 3.6 推送渠道

支持多种推送渠道：

- 飞书机器人
- 钉钉机器人
- 企业微信机器人
- Telegram Bot
- 邮件
- ntfy
- Bark
- Slack
- 通用 Webhook

## 4. 功能对比矩阵

| 功能 | 现有项目 | TrendRadar | 建议 |
|------|----------|------------|------|
| **数据源** |
| 微博热搜 | 自己爬虫 | NewsNow API | 参考 TrendRadar 使用统一 API |
| 今日头条 | 自己爬虫 | NewsNow API | 同上 |
| 百度热搜 | 未实现 | NewsNow API | 新增 |
| 知乎热榜 | 已实现 | NewsNow API | 保留或切换 API |
| 抖音热榜 | 未实现 | NewsNow API | 新增 |
| B站热搜 | 未实现 | NewsNow API | 新增 |
| 财经类 | 未实现 | 华尔街见闻、财联社 | 新增 |
| RSS 订阅 | 已实现 | 已实现 | 保留现有 |
| **AI 分析** |
| LiteLLM 集成 | 已实现 | 已实现 | 保留现有 |
| 多模型支持 | 已实现 | 已实现 | 保留现有 |
| 流式输出 | 已实现 | 未实现 | 保留现有 |
| **调度系统** |
| 定时任务 | 未实现 | 多种预设 | 参考 TrendRadar 实现 |
| 推送控制 | 未实现 | 完整调度 | 新增 |
| **推送通知** |
| 飞书 | 已实现 | 已实现 | 保留现有 |
| 钉钉 | 已实现 | 已实现 | 保留现有 |
| 企业微信 | 已实现 | 已实现 | 保留现有 |
| 邮件 | 未实现 | 已实现 | 新增 |
| Telegram | 未实现 | 已实现 | 新增（可选）|
| **报告模式** |
| 当日汇总 | 未实现 | daily | 新增 |
| 当前榜单 | 部分实现 | current | 完善 |
| 增量监控 | 未实现 | incremental | 新增 |
| **存储** |
| MongoDB | 已实现 | 未实现 | 保留现有 |
| SQLite | 未实现 | 已实现 | 可选 |
| 远程存储 | 未实现 | S3 兼容 | 新增（可选）|

## 5. 迁移建议

### 5.1 数据源迁移策略

**推荐方案：使用 NewsNow API**

优势：
1. 减少维护成本 - 无需维护各平台爬虫
2. 稳定性更高 - 专业聚合服务，反爬处理更完善
3. 扩展性强 - 轻松支持 12+ 平台

实施步骤：
1. 创建 `NewsNowFetcher` 类，对接 NewsNow API
2. 保留现有 Fetcher 作为备用（API 故障时切换）
3. 统一数据格式，确保与现有系统兼容

### 5.2 调度系统实现

参考 TrendRadar 的调度预设，实现灵活的任务调度：

```javascript
// 调度预设配置
const schedulePresets = {
  always_on: { interval: 60 * 60 * 1000, analyzeEvery: true },
  morning_evening: { times: ['08:00', '20:00'], summary: true },
  office_hours: { times: ['09:00', '12:00', '18:00'], weekdays: true },
  night_owl: { times: ['14:00', '23:00'], summary: true }
};
```

### 5.3 前端组件迁移

以新前端为基础，迁移热点监控相关组件：

| 组件 | 迁移方式 |
|------|----------|
| 热点列表 | 新建 `HotTopics.tsx`，参考旧版 `HotTopics.jsx` |
| 筛选面板 | 新建 `FilterPanel.tsx`，使用 shadcn/ui 组件 |
| 趋势时间轴 | 新建 `TrendTimeline.tsx`，使用 Recharts 图表库 |
| AI 分析面板 | 新建 `AIAnalysisPanel.tsx`，集成 AI 服务 |

### 5.4 页面结构规划

新版热点监控页面结构：

```
/pages/HotTopics.tsx          # 热点监控主页面
/components/
  ├── TopicCard.tsx           # 热点卡片
  ├── FilterPanel.tsx         # 筛选面板
  ├── TrendTimeline.tsx       # 趋势时间轴
  ├── CrossPlatformChart.tsx  # 跨平台分析图表
  └── AIAnalysisPanel.tsx     # AI 分析面板
```

## 6. 实施计划

### 第一阶段：数据源升级

1. 创建 `NewsNowFetcher` 类
2. 配置多平台数据源
3. 实现数据格式转换
4. 添加缓存机制

### 第二阶段：前端迁移

1. 创建热点监控页面结构
2. 迁移核心组件
3. 集成 API 服务
4. 实现筛选与搜索功能

### 第三阶段：高级功能

1. 实现调度系统
2. 添加趋势分析图表
3. 集成 AI 分析面板
4. 实现推送通知功能

### 第四阶段：优化与测试

1. 性能优化
2. 错误处理完善
3. 用户体验优化
4. 单元测试与集成测试

## 7. API 对接规范

### NewsNow API 接口

```
GET https://newsnow.busiyi.world/api/s?source={source_id}
```

响应格式：
```json
{
  "code": 200,
  "data": [
    {
      "title": "热点标题",
      "url": "原文链接",
      "source": "来源平台",
      "pub_date": "发布时间",
      "hot": "热度值"
    }
  ]
}
```

### 平台 ID 映射

| 平台 | source_id |
|------|-----------|
| 今日头条 | toutiao |
| 百度热搜 | baidu |
| 微博 | weibo |
| 知乎 | zhihu |
| 抖音 | douyin |
| B站 | bilibili-hot-search |

## 8. 总结

通过分析 TrendRadar 项目，我们可以借鉴以下核心设计：

1. **统一数据源 API** - NewsNow API 降低维护成本
2. **灵活调度系统** - 多种预设满足不同使用场景
3. **模块化配置** - YAML 配置文件便于管理
4. **多渠道推送** - 完善的通知机制

建议以现有新前端项目为基础，逐步迁移热点监控功能，形成完整的 AI 内容创作业务闭环。
