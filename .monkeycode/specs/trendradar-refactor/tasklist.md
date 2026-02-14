# 架构重构实施计划 - 借鉴 TrendRadar 模块化设计

## 重构目标

借鉴 TrendRadar 的模块化架构设计，对 AI 内容创作系统进行架构重构：
1. 数据来源层模块化 - 可插拔的 Fetcher 架构
2. AI 智能层升级 - LiteLLM 统一接口支持 100+ AI 提供商
3. 通知层统一调度 - Notification Dispatcher 模式
4. MCP 服务器层 - FastMCP 标准化工具和资源暴露
5. 报告生成组件 - HTML/PDF/Markdown 多格式报告

---

## 实施任务列表

- [ ] 1. 设置项目结构和核心接口
  - 创建 `server/fetchers/`、`server/ai/`、`server/notification/`、`server/reports/`、`server/core/`、`server/mcp/` 目录
  - 定义 BaseFetcher、BaseSender 核心抽象接口
  - 创建 `server/core/types.js` 定义通用类型

- [ ] 2. 数据来源层模块化
  - [ ] 2.1 创建 BaseFetcher 抽象基类
    - 实现 `fetch()`、`validateTopic()`、`fetchWithRetry()` 核心方法
    - 实现通用缓存和错误处理机制

  - [ ] 2.2 迁移现有数据源到 Fetcher 架构
    - 创建 `WeiboFetcher.js` 迁移微博热搜逻辑
    - 创建 `ToutiaoFetcher.js` 迁移今日头条逻辑
    - 创建 `FetcherManager.js` 统一管理所有 Fetcher

  - [ ] 2.3 扩展新数据源
    - 创建 `ZhihuFetcher.js` 实现知乎热榜
    - 创建 `RSSFetcher.js` 实现 RSS 订阅源

  - [ ] 2.4 重构 hotTopicService
    - 使用 FetcherManager 替代硬编码数据源
    - 保持 API 接口向后兼容

  - [ ] 2.5 编写 Fetcher 模块测试
    - 测试各 Fetcher 数据解析正确性
    - 测试 FetcherManager 并发抓取

- [ ] 3. AI 智能层 LiteLLM 集成
  - [ ] 3.1 创建 LiteLLM 适配器
    - 创建 `server/ai/LiteLLMAdapter.js`
    - 实现 OpenAI 兼容的 API 接口
    - 配置多提供商映射 (OpenAI/Claude/DeepSeek/通义千问/智谱等)

  - [ ] 3.2 重构 multiAIService
    - 优先使用 LiteLLMAdapter，保留原生 SDK 降级
    - 实现 AI 提供商健康检查

  - [ ] 3.3 配置 LiteLLM Docker 服务
    - 创建 `docker/litellm/config.yaml`
    - 更新 docker-compose.yml 添加 LiteLLM 容器

  - [ ] 3.4 编写 AI 模块测试
    - 测试 LiteLLM 适配器请求构建
    - 测试降级机制和错误处理

- [ ] 4. 通知层统一调度重构
  - [ ] 4.1 创建 BaseSender 抽象基类
    - 定义 `send()`、`test()`、`isConfigured()` 抽象方法

  - [ ] 4.2 迁移现有通知渠道到 Sender 架构
    - 创建 `WeWorkSender.js`、`DingTalkSender.js`、`FeishuSender.js`

  - [ ] 4.3 创建 NotificationDispatcher
    - 实现多渠道并行发送和结果聚合
    - 重构 notificationService 使用新架构

  - [ ] 4.4 编写通知模块测试
    - 测试各 Sender 消息发送
    - 测试 Dispatcher 多渠道调度

- [ ] 5. 报告生成组件开发
  - [ ] 5.1 创建报告生成器基础结构
    - 创建 `server/reports/ReportGenerator.js`
    - 创建 `server/reports/templates/` 目录

  - [ ] 5.2 实现报告模板和导出
    - 创建日报/周报 EJS 模板
    - 实现 PDF 和 Markdown 导出功能

  - [ ] 5.3 添加报告 API 接口
    - 在 `analytics.js` 添加 `/api/analytics/reports/*` 接口

  - [ ] 5.4 编写报告模块测试
    - 测试报告数据聚合和格式导出

- [ ] 6. MCP 服务器层开发
  - [ ] 6.1 创建 Python MCP 服务器基础结构
    - 创建 `server/mcp/main.py` 入口
    - 配置 Python 依赖 (mcp, httpx)

  - [ ] 6.2 实现 MCP 工具
    - 热点工具: `get_hot_topics`、`analyze_topic`
    - 内容工具: `generate_content`、`publish_to_platform`

  - [ ] 6.3 实现 MCP 资源
    - 定义 `analytics://overview`、`trends://daily` 资源

  - [ ] 6.4 编写 MCP 集成测试
    - 测试工具调用和资源访问

- [ ] 7. 核心处理层重构
  - [ ] 7.1 提取核心分析器
    - 创建 `TopicAnalyzer.js` (分类、关键词提取)
    - 创建 `TrendAnalyzer.js` (趋势预测)

  - [ ] 7.2 创建 StorageManager
    - 封装 MongoDB 和 Redis 操作
    - 实现数据清理策略

  - [ ] 7.3 编写核心模块测试
    - 测试话题分类和趋势分析逻辑

- [ ] 8. 集成验证和文档更新
  - [ ] 8.1 编写集成测试
    - 测试热点 -> 分析 -> 存储 -> 推送完整流程
    - 测试内容生成 -> 发布完整流程

  - [ ] 8.2 更新文档
    - 更新 `ARCHITECTURE.md` 架构说明
    - 创建 `MCP_INTEGRATION.md` 集成指南
    - 创建 `LITELLM_CONFIG.md` 配置指南

---

## 预计工作量

| 阶段 | 预计工作量 |
|------|------------|
| 数据来源层 | 2-3 天 |
| AI 智能层 | 1-2 天 |
| 通知层 | 1 天 |
| 报告生成 | 1-2 天 |
| MCP 服务器 | 2 天 |
| 核心处理层 | 1 天 |
| 集成验证 | 1 天 |
| **总计** | **9-12 天** |
