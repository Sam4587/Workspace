# TrendRadar - 热点内容监控与多平台发布系统

一个集成热点监控、AI 内容生成、多平台发布的内容运营平台。

## 项目概述

TrendRadar 是一个全栈内容运营系统，支持：
- 热点话题自动监控与抓取
- AI 驱动的内容生成
- 多平台（抖音、今日头条、小红书）内容发布
- 数据分析与报告生成

## 技术栈

### 前端
- **React 18** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** 数据请求
- **Recharts** 数据可视化

### 后端
- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **Winston** 日志管理
- **PM2** 进程管理

### CLI 工具
- **Go 1.21+** + **Rod** 浏览器自动化

## 目录结构

```
project-root/
├── src/                    # 前端源码
│   ├── components/         # UI 组件
│   ├── pages/              # 页面
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
│   ├── notification/       # 通知服务
│   └── utils/              # 工具函数
│
├── tools/                  # CLI 工具
│   ├── douyin-toutiao/     # 抖音/头条发布工具
│   └── xiaohongshu-publisher/  # 小红书发布工具
│
├── docs/                   # 项目文档
│   ├── PROJECT_SUMMARY.md  # 项目总结
│   ├── mcp/                # MCP 相关文档
│   └── tools/              # 工具文档
│
├── scripts/                # 脚本
├── nginx/                  # Nginx 配置
├── .monkeycode/            # 项目规格文档
└── .trae/                  # AI 辅助配置
```

## 快速开始

### 环境要求
- Node.js 18+
- Go 1.21+ (用于 CLI 工具)
- MongoDB 6+

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
```

### 开发模式

```bash
# 同时启动前端和后端
npm run dev:all

# 或分别启动
npm run dev          # 前端 (http://localhost:5173)
cd server && npm start  # 后端 (http://localhost:3000)
```

### 生产构建

```bash
npm run build
```

## 功能模块

### 1. 热点监控
- 微博热搜
- 知乎热榜
- 今日头条
- RSS 订阅源

### 2. AI 内容生成
- 多模型支持（OpenAI、Groq、Cerebras）
- LiteLLM 集成
- 内容质量评估

### 3. 多平台发布
- 抖音图文/视频发布
- 今日头条发布
- 小红书发布

### 4. 数据分析
- 发布数据统计
- 内容表现分析
- 趋势报告生成

## CLI 工具使用

### 抖音/头条发布工具

```bash
cd tools/douyin-toutiao

# 编译
go build -o publisher .

# 登录
./publisher -platform douyin -login

# 发布内容
./publisher -platform douyin -title "标题" -content "内容" -images "img1.jpg"
```

详细文档请参考 [docs/tools/](./docs/tools/)

## 部署

项目支持 Docker 部署：

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 文档

- [项目总结](./docs/PROJECT_SUMMARY.md)
- [抖音/头条工具架构](./docs/tools/douyin-toutiao-architecture.md)
- [小红书工具文档](./docs/tools/xiaohongshu-project.md)
- [MCP 集成文档](./docs/mcp/)

## 许可证

MIT License
