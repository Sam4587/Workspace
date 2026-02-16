# TrendRadar 项目上下文

> 此文件专为 AI 开发者设计，帮助快速理解项目并开始开发

## 项目一句话描述

TrendRadar 是一个热点内容监控与 AI 内容生成系统，支持多平台热点聚合、AI 内容生成、视频下载转录和数据分析。

## 当前状态

- ✅ 前后端服务正常运行
- ✅ 代码已清理（移除了发布功能相关代码）
- ✅ 开发文档已完善
- ⚠️ 热点数据需要手动刷新或使用 Mock 数据

## 快速启动命令

```bash
npm run dev:all      # 一键启动前后端
npm run dev:frontend # 仅前端 (5174)
npm run dev:server   # 仅后端 (5000)
```

## 核心文件速览

| 文件 | 作用 | 关键点 |
|------|------|--------|
| `src/lib/api.js` | API 客户端 | 所有后端请求入口 |
| `src/nav-items.jsx` | 导航配置 | 添加页面在这里注册 |
| `src/App.jsx` | 根组件 | 路由和 Provider |
| `server/simple-server.js` | 开发服务器 | 所有 Mock 数据和路由 |
| `server/index.js` | 生产服务器 | 需要 MongoDB |

## 页面功能

| 页面 | 文件 | 功能 |
|------|------|------|
| 总览 | `Index.jsx` | 仪表盘、快捷操作 |
| 热点监控 | `HotTopics.jsx` | 多平台热点聚合 |
| 内容生成 | `ContentGeneration.jsx` | AI 内容生成 |
| 数据分析 | `Analytics.jsx` | 数据可视化 |
| 视频生成 | `VideoGeneration.jsx` | 视频模板渲染 |

## API 端点速览

```
GET  /api/hot-topics          # 热点列表
GET  /api/hot-topics/sources  # 数据源列表
POST /api/content/generate    # 生成内容
POST /api/content/video-rewrite # 视频改写
GET  /api/video/platforms/list # 视频平台
POST /api/video/download       # 下载视频
POST /api/transcription/submit # 转录任务
GET  /api/analytics/overview   # 分析概览
GET  /api/health              # 健康检查
```

## 开发注意事项

1. **开发模式**使用 `simple-server.js`，无需 MongoDB
2. **生产模式**使用 `index.js`，需要 MongoDB
3. 前端使用 **TanStack Query** 管理状态
4. UI 组件使用 **shadcn/ui**

## 常见问题

### 前端白屏？
检查控制台错误，通常是 API 响应问题

### 热点数据不显示？
开发模式使用 Mock 数据，或调用 `/api/hot-topics` 手动加载

### API 返回 500？
检查后端日志，确认路由是否正确注册

## 已移除的功能

以下功能已迁移到 `publisher-tools` 分支：
- 多平台发布
- 账号管理
- 发布队列

详见 [PROJECT_SEPARATION.md](../PROJECT_SEPARATION.md)

## 最近更改

- 2025-02-16: 项目分离，发布功能独立
- 2025-02-16: 修复语法错误
- 2025-02-16: 完善开发文档
