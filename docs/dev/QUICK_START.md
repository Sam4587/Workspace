# AI 开发者快速上手指南

## 项目概述

**TrendRadar** 是一个热点内容监控与 AI 内容生成系统。

### 核心功能
- 🔥 **热点监控**：聚合微博、知乎、头条等多平台热点
- ✨ **AI 内容生成**：多模型支持的内容生成与改写
- 🎬 **视频处理**：视频下载、转录、智能改写
- 📊 **数据分析**：内容效果追踪与可视化

### 技术栈
| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS + shadcn/ui |
| 后端 | Node.js + Express |
| 数据库 | MongoDB (生产) / 内存存储 (开发) |
| AI | OpenAI / Groq / Cerebras / 阿里云 ASR |

---

## 快速启动

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 一键启动（推荐）

```bash
# 安装依赖
npm run setup

# 启动所有服务
npm run dev:all
```

### 分别启动

```bash
# 终端 1：启动后端
npm run dev:server

# 终端 2：启动前端
npm run dev:frontend
```

### 访问地址
| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5174 |
| 后端 | http://localhost:5000 |
| API 文档 | http://localhost:5000/api/docs |

---

## 项目结构

```
TrendRadar/
├── src/                        # 前端源码
│   ├── components/             # UI 组件
│   │   ├── ui/                # shadcn/ui 基础组件
│   │   └── video/             # 视频相关组件
│   ├── pages/                  # 页面
│   │   ├── Index.jsx          # 总览仪表盘
│   │   ├── HotTopics.jsx      # 热点监控
│   │   ├── ContentGeneration.jsx # 内容生成
│   │   ├── Analytics.jsx      # 数据分析
│   │   └── VideoGeneration.jsx # 视频生成
│   ├── lib/                    # API 客户端、工具
│   ├── contexts/               # React Context
│   └── providers/              # Provider
│
├── server/                     # 后端源码
│   ├── routes/                 # API 路由
│   ├── services/               # 业务服务
│   ├── video/                  # 视频下载模块
│   ├── transcription/          # 转录模块
│   └── simple-server.js        # 开发服务器
│
├── docs/                       # 文档
│   ├── dev/                   # 开发文档
│   ├── plans/                 # 设计文档
│   └── mcp/                   # MCP 集成文档
│
└── scripts/                    # 脚本
```

---

## 开发工作流

### 1. 创建新功能

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature

# 2. 开发...
npm run dev:all

# 3. 测试
npm run lint

# 4. 提交
git add .
git commit -m "feat: 描述"
git push origin feature/your-feature
```

### 2. 添加新页面

1. 在 `src/pages/` 创建组件
2. 在 `src/nav-items.jsx` 注册路由
3. 在 `src/App.jsx` 添加路由（如需要）

### 3. 添加新 API

1. 在 `server/routes/` 创建路由文件
2. 在 `server/services/` 创建服务
3. 在 `server/simple-server.js` 或 `server/index.js` 注册路由

---

## 常见问题

### Q: 前端启动报错？
```bash
# 清除缓存
rm -rf node_modules/.vite
npm run dev:frontend
```

### Q: 后端启动报错？
```bash
# 检查端口
lsof -i :5000

# 重新安装依赖
cd server && npm install
```

### Q: 热点数据不显示？
开发模式使用内存存储，需要手动触发数据加载：
```bash
curl http://localhost:5000/api/hot-topics/refresh
```

---

## 环境变量

创建 `.env` 文件（可选）：

```env
# AI 服务
OPENAI_API_KEY=sk-xxx
GROQ_API_KEY=gsk_xxx

# 阿里云 ASR
ALIYUN_ASR_APP_KEY=xxx
ALIYUN_ASR_ACCESS_KEY=xxx
ALIYUN_ASR_SECRET_KEY=xxx

# MongoDB（生产环境）
MONGODB_URI=mongodb://localhost:27017/trendradar
```

---

## 关键文件说明

| 文件 | 用途 |
|------|------|
| `src/lib/api.js` | API 客户端，所有后端请求 |
| `src/nav-items.jsx` | 导航配置 |
| `server/simple-server.js` | 开发服务器入口 |
| `server/index.js` | 生产服务器入口 |
| `vite.config.js` | Vite 配置 |

---

## 分支说明

| 分支 | 说明 |
|------|------|
| `master` | TrendRadar 主分支 |
| `publisher-tools` | 发布工具独立项目 |

---

## 联系方式

如有问题，请在项目 Issue 中反馈。
