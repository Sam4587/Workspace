# AI Content Flow - 智能内容创作平台

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/Node-18+-339933?logo=node.js)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**全链路 AI 内容创作平台**

[功能特性](#功能特性) • [快速开始](#快速开始) • [服务端口](#服务端口) • [部署](#部署) • [开发指南](#开发指南)

</div>

---

## 📖 项目简介

AI Content Flow 是一个全链路 AI 创作平台，实现从**热点发现 → 内容生成 → 平台发布 → 数据分析**的全流程闭环。

### 核心能力

- 🔥 **热点监控** - 聚合微博、知乎、头条等多平台热点
- ✨ **AI 内容生成** - 多模型支持的内容生成与改写
- 🎬 **视频处理** - 视频下载、转录、智能改写
- 📊 **数据分析** - 内容效果追踪与可视化
- 📤 **多平台发布** - 支持抖音、今日头条等内容发布

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm
- MongoDB (本地或 Atlas)
- Redis (可选)

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
```

### 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑 server/.env，填入必要的配置
# 主要是 MONGODB_URI 和 AI API Keys
```

### 启动服务

```bash
# 方式一：使用自动开发服务器（同时启动前后端）
npm run dev:all

# 方式二：分别启动
# 终端1：启动后端
cd server && npm run dev

# 终端2：启动前端
npm run dev
```

---

## 🔌 服务端口配置

项目使用以下标准端口，请确保这些端口未被占用：

| 服务 | 端口 | 用途 | 访问地址 |
|------|------|------|----------|
| **前端开发服务器** | 5174 | Vite 开发环境 | http://localhost:5174 |
| **后端 API 服务** | 5001 | Express REST API | http://localhost:5001 |
| **前端生产服务** | 3000 | 生产构建服务 | http://localhost:3000 |
| **Publisher Tools** | 8080 | Go 发布服务 | http://localhost:8080 |
| **MongoDB** | 27017 | 数据库服务 | mongodb://localhost:27017 |
| **Redis** | 6379 | 缓存服务 | redis://localhost:6379 |

### 端口冲突解决

如果端口被占用，可以使用以下命令查找并终止进程：

```bash
# Windows
netstat -ano | findstr :5001
netstat -ano | findstr :5174
taskkill /PID <进程ID> /F

# 或使用脚本
node scripts/check-ports.js
```

---

## 🏗️ 项目结构

```
.
├── src/                    # 前端源码 (React + Vite)
│   ├── components/         # UI 组件
│   ├── pages/             # 页面组件
│   └── lib/               # 工具函数
├── server/                 # 后端服务 (Express)
│   ├── routes/            # API 路由
│   ├── services/          # 业务逻辑
│   ├── models/            # 数据模型
│   └── .env.example       # 环境变量模板
├── scripts/               # 开发脚本
├── docs/                  # 项目文档
└── docker-compose.yml     # Docker 部署配置
```

---

## 📝 相关文档

- [快速启动指南](QUICK_START.md)
- [标准端口配置](docs/STANDARD_PORT_CONFIGURATION.md)
- [环境变量标准](docs/ENVIRONMENT_VARIABLES_STANDARD.md)
- [开发工作流](docs/02-development/workflow.md)
- [API 文档](docs/dev/API.md)

---

## 🔧 开发指南

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循项目文档中的命名规范
- 提交前运行测试

### 提交规范

```bash
# 功能开发
git commit -m "feat: 添加新功能"

# Bug 修复
git commit -m "fix: 修复某个问题"

# 文档更新
git commit -m "docs: 更新文档"

# 代码重构
git commit -m "refactor: 重构代码"
```

---

## 🐳 Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 访问服务
# 前端: http://localhost:3000
# 后端: http://localhost:5001
```

---

## 📄 许可证

MIT License © 2026 AI Content Flow Team
