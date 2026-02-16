# TrendRadar - 热点内容监控与AI内容生成系统

一个集成热点监控、AI 内容生成、数据分析的内容运营平台。

> **注意**：多平台发布功能已独立为单独项目，详见 [PROJECT_SEPARATION.md](./PROJECT_SEPARATION.md)

## 项目概述

TrendRadar 是一个全栈内容运营系统，支持：
- 热点话题自动监控与抓取
- AI 驱动的内容生成
- 视频下载与智能转录
- 数据分析与报告生成

## 技术栈

### 前端
- **React 18** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** 数据请求
- **Recharts** 数据可视化

### 后端
- **Node.js** + **Express**
- **MongoDB** + **Mongoose** (生产环境)
- **Winston** 日志管理
- **PM2** 进程管理

**开发环境**: 使用 `simple-server.js`，无需数据库依赖

## 目录结构

```
project-root/
├── src/                    # 前端源码
│   ├── components/         # UI 组件
│   ├── pages/              # 页面
│   │   ├── Index.jsx       # 总览
│   │   ├── HotTopics.jsx   # 热点监控
│   │   ├── ContentGeneration.jsx  # 内容生成
│   │   ├── Analytics.jsx   # 数据分析
│   │   └── VideoGeneration.jsx  # 视频生成
│   ├── lib/                # 工具库
│   ├── contexts/           # React Context
│   └── providers/          # Provider
│
├── server/                 # 后端服务
│   ├── routes/             # API 路由
│   ├── services/           # 业务逻辑
│   ├── fetchers/           # 数据抓取
│   ├── models/             # 数据模型
│   ├── core/               # 核心模块
│   ├── ai/                 # AI 模块
│   ├── video/              # 视频下载模块
│   ├── transcription/      # 转录引擎模块
│   ├── notification/       # 通知服务
│   ├── simple-server.js    # 开发用简单服务器（无需 MongoDB）
│   └── utils/              # 工具函数
│
├── docs/                   # 项目文档
├── scripts/                # 脚本
├── nginx/                  # Nginx 配置
├── .monkeycode/            # 项目规格文档
└── .trae/                  # AI 辅助配置
```

## 快速开始

### 环境要求
- Node.js 18+

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
```

### 开发模式（推荐）

**重要说明：当前开发环境使用 simple-server.js，无需 MongoDB 依赖。**

```bash
# 启动后端（简单服务器，无需 MongoDB）
cd server && node simple-server.js

# 启动前端（另一个终端）
npm run dev
```

- **后端地址**: http://localhost:5000
- **前端地址**: http://localhost:5173

### 生产构建

```bash
npm run build
```

### 生产环境配置（需要 MongoDB）

生产环境需要 MongoDB 支持：

```bash
# 确保 MongoDB 运行
mongod --dbpath /path/to/data

# 启动完整后端服务
cd server && npm start
```

## 功能模块

### 1. 热点监控
- 微博热搜
- 知乎热榜
- 今日头条
- RSS 订阅源

### 2. 视频转录与智能创作
- **视频下载**: 支持抖音、快手等平台视频下载
- **AI 转录**: Whisper 本地模型 + 阿里云 ASR 备选
- **智能改写**: 多平台风格内容改写（小红书、抖音、今日头条）

### 3. AI 内容生成
- 多模型支持（OpenAI、Groq、Cerebras）
- LiteLLM 集成
- 内容质量评估

### 4. 数据分析
- 发布数据统计
- 内容表现分析
- 趋势报告生成

### 5. 视频生成
- Remotion 视频生成
- 模板系统
- 批量渲染

## API 接口

### 视频转录 API

```bash
# 下载视频
POST /api/video/download
{
  "url": "https://v.douyin.com/xxx"
}

# 查询下载状态
GET /api/video/download/:taskId/status

# 提交转录任务
POST /api/transcription/submit
{
  "videoPath": "/path/to/video.mp4"
}

# 查询转录结果
GET /api/transcription/:taskId

# 内容改写
POST /api/content/video-rewrite
{
  "text": "转录文本",
  "platforms": ["xiaohongshu", "douyin", "toutiao"]
}
```

### 热点监控 API

```bash
# 获取热点数据
GET /api/hot-topics?source=weibo&limit=20
```

## 部署

项目支持 Docker 部署：

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 项目分离说明

**多平台发布功能已独立为单独项目 `Publisher Tools`**

| 功能 | 状态 |
|------|------|
| 热点监控 | ✅ 保留 |
| AI 内容生成 | ✅ 保留 |
| 视频转录 | ✅ 保留 |
| 数据分析 | ✅ 保留 |
| 视频生成 | ✅ 保留 |
| 多平台发布 | ❌ 已独立 |

详见 [PROJECT_SEPARATION.md](./PROJECT_SEPARATION.md)

## 文档

- [项目分离说明](./PROJECT_SEPARATION.md)
- [项目总结](./docs/PROJECT_SUMMARY.md)
- [视频转录功能设计](./docs/plans/2026-02-15-video-transcription-design.md)
- [MCP 集成文档](./docs/mcp/)

## 开发注意事项

### 使用简单服务器进行开发

当前开发阶段使用 `server/simple-server.js` 作为后端服务，该服务器：
- 不需要 MongoDB 数据库连接
- 提供 Mock API 用于前端开发测试
- 运行在端口 5000

### 后端架构说明

| 文件/目录 | 用途 |
|----------|------|
| `simple-server.js` | 开发用简单服务器，无需数据库 |
| `index.js` | 完整后端服务，需要 MongoDB |
| `video/` | 视频下载模块（抖音、快手等） |
| `transcription/` | 转录引擎模块（Whisper、阿里云 ASR） |
| `services/` | 业务逻辑（内容分析、改写等） |

## 许可证

MIT License
