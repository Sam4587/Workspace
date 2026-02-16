# AI Content Flow - AI内容创作系统

一个全链路 AI 创作平台，实现从热点发现到内容生成、平台发布、数据分析的全流程闭环。

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装

```bash
# 安装所有依赖
npm install
cd server && npm install
```

### 启动服务

```bash
# 终端 1 - 后端
cd server && node server.js

# 终端 2 - 前端
npm run dev
```

### 🚀 服务状态

| 服务 | 状态 | 地址 | 端口 | 说明 |
|------|------|------|------|------|
| 前端 | ✅ 运行中 | http://localhost:5174 | 5174 | React + Vite 开发服务器 |
| 后端 | ✅ 运行中 | http://localhost:5001/api | 5001 | Express API 服务 |
| 认证 | ✅ 已启用 | JWT双令牌机制 | - | 安全认证已配置 |
| 热点监控 | ✅ 运行中 | 自动更新机制 | - | 15分钟安全频率更新 |

## 功能模块

### 热点监控
- 微博热搜、知乎热榜、今日头条
- NewsNow API 多平台聚合
- 实时热点追踪

### AI 内容生成
- 多模型支持（OpenAI、Groq、Cerebras）
- 多平台内容适配
- 智能改写

### 视频处理
- 视频下载（抖音、快手等）
- AI 转录（Whisper、阿里云 ASR）
- 智能改写

### 数据分析
- 发布数据统计
- 内容效果分析
- 趋势报告

## 项目结构

```
ai-content-flow/
├── src/                    # 前端源码 (React + Vite)
│   ├── components/         # UI 组件
│   ├── pages/              # 页面
│   └── lib/                # API 客户端
│
├── server/                 # 后端源码 (Node.js + Express)
│   ├── routes/             # API 路由
│   ├── services/           # 业务服务
│   ├── fetchers/           # 数据获取器
│   └── server.js           # 主服务
│
└── docs/                   # 文档
    ├── dev/                # 开发文档
    ├── specs/              # 功能规格
    └── README.md           # 文档索引
```

## 文档

- [文档索引](./docs/README.md) - 所有文档的统一入口
- [快速开始](./docs/dev/QUICK_START.md) - 详细环境配置
- [AI 协作指南](./docs/dev/AI_COLLABORATION.md) - 如何与 AI 协作开发
- [AI 开发者准则](./docs/dev/AI_DEVELOPER_GUIDELINES.md) - 行为规范

## 环境变量

创建 `server/.env` 文件：

```env
# AI 服务
OPENAI_API_KEY=sk-xxx
OPENROUTER_API_KEY=sk-or-xxx

# 阿里云 ASR（可选）
ALIYUN_ASR_APP_KEY=xxx
ALIYUN_ASR_ACCESS_KEY=xxx
ALIYUN_ASR_SECRET_KEY=xxx

# 服务端口
PORT=5000
```

## 许可证

MIT License
