# TrendRadar 项目总结

## 项目概述

TrendRadar 是一个热点内容监控与AI内容生成系统，帮助内容创作者追踪热点、生成高质量内容、分析数据趋势。

> **更新说明**：多平台发布功能已于 2025-02-16 独立为单独项目 Publisher Tools。
> 详见 [PROJECT_SEPARATION.md](../PROJECT_SEPARATION.md)

## 核心功能

### 1. 热点监控
- **多平台数据源**
  - 微博热搜
  - 知乎热榜
  - 今日头条
  - RSS 订阅源
- **智能分析**
  - 热度趋势追踪
  - 关键词提取
  - 情感分析

### 2. AI 内容生成
- **多模型支持**
  - OpenAI GPT 系列
  - Groq
  - Cerebras
  - LiteLLM 集成
- **内容优化**
  - 多平台风格适配
  - 内容质量评估
  - 智能改写

### 3. 视频转录与创作
- **视频下载**
  - 抖音视频下载
  - 快手视频下载
  - 多平台支持
- **AI 转录**
  - Whisper 本地模型
  - 阿里云 ASR 备选
  - 多语言支持
- **智能改写**
  - 小红书风格
  - 抖音风格
  - 今日头条风格

### 4. 数据分析
- 发布数据统计
- 内容表现分析
- 趋势报告生成
- 可视化图表

### 5. 视频生成
- Remotion 视频渲染
- 模板系统
- 批量渲染
- 自定义样式

## 技术架构

### 前端
```
React 18 + Vite + Tailwind CSS + shadcn/ui
├── 页面组件
│   ├── Index.jsx         # 总览仪表盘
│   ├── HotTopics.jsx     # 热点监控
│   ├── ContentGeneration.jsx  # 内容生成
│   ├── Analytics.jsx     # 数据分析
│   └── VideoGeneration.jsx    # 视频生成
├── 状态管理
│   └── TanStack Query
└── 路由
    └── React Router v6
```

### 后端
```
Node.js + Express + MongoDB
├── 路由层
│   ├── hotTopicsMemory.js  # 热点数据（内存模式）
│   ├── contentRewrite.js   # 内容改写
│   ├── video.js            # 视频处理
│   ├── transcription.js    # 转录服务
│   └── analytics.js        # 数据分析
├── 服务层
│   ├── hotTopicService.js  # 热点业务逻辑
│   ├── aiService.js        # AI 服务
│   ├── ContentRewriteService.js  # 改写服务
│   └── multiAIService.js   # 多模型集成
└── 数据层
    ├── models/             # MongoDB 模型
    └── 内存存储（开发模式）
```

## 项目分离说明

### 分离原因
1. **业务独立**：发布功能与内容创作功能属于不同业务域
2. **技术独立**：发布工具使用 Go 语言，与 Node.js 后端不同
3. **部署独立**：发布服务需要独立部署和扩展

### 已独立功能
| 功能 | 新项目 | 分支 |
|------|--------|------|
| 多平台发布 | Publisher Tools | publisher-tools |
| 账号管理 | Publisher Tools | publisher-tools |
| 发布任务管理 | Publisher Tools | publisher-tools |

### 保留功能
| 功能 | 状态 |
|------|------|
| 热点监控 | ✅ |
| AI 内容生成 | ✅ |
| 视频转录 | ✅ |
| 数据分析 | ✅ |
| 视频生成 | ✅ |

## 后续规划

### Phase 1: 功能增强
- [ ] 增加热点数据源
- [ ] 优化 AI 生成质量
- [ ] 完善数据可视化

### Phase 2: 架构优化
- [ ] 微服务拆分
- [ ] API Gateway 集成
- [ ] 消息队列引入

### Phase 3: 功能集成
- [ ] 与 Publisher Tools API 集成
- [ ] 工作流自动化
- [ ] 定时任务系统

## 开发指南

### 本地开发
```bash
# 安装依赖
npm install
cd server && npm install

# 启动后端（开发模式，无需 MongoDB）
cd server && node simple-server.js

# 启动前端
npm run dev
```

### 生产部署
```bash
# 构建
npm run build

# Docker 部署
docker-compose -f docker-compose.prod.yml up -d
```

## 相关文档

- [项目分离说明](../PROJECT_SEPARATION.md)
- [视频转录设计](./plans/2026-02-15-video-transcription-design.md)
- [MCP 集成](./mcp/)

## 许可证

MIT License
