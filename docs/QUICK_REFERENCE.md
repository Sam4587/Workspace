---
title: 快速参考指南
category: 参考文档
tags: [快速参考, 开发指南, 常用命令]
updated: 2026-02-19
version: 1.0
author: AI开发团队
---

# 快速参考指南

> **AI Content Flow 项目快速参考** | **最后更新**: 2026-02-19

本文档提供项目开发中最常用的信息，帮助你快速找到所需内容。

---

## 🚀 快速启动

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 启动命令

```bash
# 安装依赖
npm install

# 启动后端服务
cd server
npm start

# 启动前端服务
cd client
npm run dev
```

### 端口配置
- 前端开发服务: `http://localhost:5174`
- 后端API服务: `http://localhost:5001`

---

## 📁 项目结构

```
ai-content-flow/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 服务
│   │   └── utils/         # 工具函数
│   └── package.json
├── server/                 # 后端项目
│   ├── routes/            # API 路由
│   ├── services/          # 业务逻辑
│   ├── utils/             # 工具函数
│   └── package.json
├── docs/                  # 文档
└── .env                   # 环境变量
```

---

## 🔑 环境变量配置

### 必需配置

```env
# 端口配置
PORT=5001
CLIENT_PORT=5174

# 认证配置
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### AI 服务配置

```env
# 默认提供商
AI_DEFAULT_PROVIDER=ollama

# Ollama（本地部署）
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# OpenRouter（多模型聚合）
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=deepseek/deepseek-chat-v3:free

# DeepSeek
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_MODEL=deepseek-chat

# Groq
GROQ_API_KEY=gsk_xxx
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## 📡 主要 API 端点

### 认证 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/refresh` | POST | 刷新令牌 |
| `/api/auth/logout` | POST | 用户登出 |

### 热点监控 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/hot-topics` | GET | 获取热点列表 |
| `/api/hot-topics/refresh` | POST | 刷新热点数据 |
| `/api/hot-topics/analysis` | GET | 获取 AI 分析结果 |
| `/api/hot-topics/analyze` | POST | 触发 AI 分析 |

### 内容创作 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/content/generate` | POST | 生成内容 |
| `/api/content/optimize-title` | POST | 优化标题 |
| `/api/content/adapt` | POST | 平台适配 |

### 发布中心 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/publish/platforms` | GET | 获取平台列表 |
| `/api/publish/publish` | POST | 发布内容 |
| `/api/publish/status/:id` | GET | 获取发布状态 |

---

## 🧩 核心模块

### 热点监控模块

**位置**: `server/services/hotTopicsService.js`

**功能**:
- 多平台数据抓取（11个平台）
- 热度分析与趋势预测
- 数据可视化
- 分类管理

**数据源**:
- 微博热搜、知乎热榜、今日头条
- 百度热搜、抖音热点、B站热门
- 贴吧热议、澎湃新闻、凤凰网
- 华尔街见闻、财联社

### 内容创作模块

**位置**: `server/services/contentCreationService.js`

**功能**:
- AI 内容生成
- 标题优化
- 多平台适配
- 质量评估

### 发布中心模块

**位置**: `server/services/publishCenterService.js`

**功能**:
- 多平台发布
- 发布队列管理
- 状态追踪

### AI 服务模块

**位置**: `server/services/aiProviderService.js`

**功能**:
- 多 AI 提供商集成
- 统一接口封装
- 智能路由和降级

**支持的提供商**:
- OpenRouter、Groq、Cerebras
- DeepSeek、Ollama、LiteLLM Gateway

---

## 🔧 开发工具

### 代码检查

```bash
# ESLint 检查
npm run lint

# 修复 ESLint 问题
npm run lint:fix
```

### 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --grep "test-name"
```

### 构建

```bash
# 构建前端
cd client
npm run build

# 构建后端
cd server
npm run build
```

---

## 📊 数据库

### MongoDB 连接

```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
```

### 主要数据模型

| 模型 | 说明 |
|------|------|
| User | 用户模型 |
| HotTopic | 热点话题模型 |
| Content | 内容模型 |
| PublishRecord | 发布记录模型 |

---

## 🔐 认证机制

### JWT 认证流程

1. 用户登录，获取 Access Token 和 Refresh Token
2. 使用 Access Token 访问受保护的 API
3. Access Token 过期后，使用 Refresh Token 刷新
4. Refresh Token 过期后，需要重新登录

### 认证中间件

```javascript
const authenticateToken = require('../middleware/auth');

app.get('/api/protected', authenticateToken, (req, res) => {
  // 受保护的路由
});
```

---

## 🤖 AI 服务配置

### Ollama 本地部署

1. 下载并安装 Ollama
2. 启动 Ollama 服务
3. 下载模型：`ollama pull llama3`
4. 配置环境变量

### OpenRouter 配置

1. 注册 OpenRouter 账号
2. 获取 API Key
3. 配置环境变量

### AI 分析使用

```javascript
const aiProviderService = require('./services/aiProviderService');

const analysis = await aiProviderService.analyzeTopics(topics, {
  includeTrends: true,
  includeSentiment: true,
  includeKeywords: true,
  includeSummary: true,
  maxTopics: 50
});
```

---

## 📝 日志系统

### 日志级别

| 级别 | 说明 |
|------|------|
| error | 错误信息 |
| warn | 警告信息 |
| info | 一般信息 |
| debug | 调试信息 |

### 日志使用

```javascript
const logger = require('./utils/logger');

logger.info('信息日志');
logger.warn('警告日志');
logger.error('错误日志');
logger.debug('调试日志');
```

---

## 🐛 故障排查

### 常见问题

#### 问题 1: 后端服务无法启动
**解决方案**:
- 检查端口 5001 是否被占用
- 检查环境变量是否正确配置
- 查看日志输出

#### 问题 2: AI 分析失败
**解决方案**:
- 检查 AI API Key 是否有效
- 检查网络连接
- 查看 AI 服务日志

#### 问题 3: 热点数据获取失败
**解决方案**:
- 检查网络连接
- 查看数据源是否可用
- 检查缓存设置

### 调试模式

```bash
# 启动调试模式
DEBUG=* npm start

# 查看特定模块日志
DEBUG=hot-topics:* npm start
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [文档中心](INDEX.md) | 文档总索引 |
| [快速开始](01-getting-started/quick-start.md) | 环境配置和启动指南 |
| [开发工作流](02-development/workflow.md) | 标准开发流程 |
| [API 参考](dev/API.md) | 完整 API 文档 |
| [架构设计](dev/ARCHITECTURE.md) | 系统架构说明 |
| [安全指南](security/QUICK_SECURITY_GUIDE.md) | 安全开发规范 |
| [环境变量](ENVIRONMENT_VARIABLES_STANDARD.md) | 环境配置标准 |

---

## 🔗 外部资源

### 官方文档
- [React 文档](https://react.dev)
- [Express 文档](https://expressjs.com)
- [MongoDB 文档](https://www.mongodb.com/docs)
- [Ollama 文档](https://ollama.com/docs)
- [OpenRouter 文档](https://openrouter.ai/docs)

### 工具
- [VS Code](https://code.visualstudio.com)
- [Postman](https://www.postman.com)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass)

---

**文档维护者**: AI 开发团队
**创建时间**: 2026-02-19
**最后更新**: 2026-02-19
