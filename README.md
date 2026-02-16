# AI Content Flow - AI内容创作系统

> 🎯 **项目状态**: 核心功能开发完成 (100%)  
> 📊 **最新更新**: 2026年2月16日 - 热点监控功能全面完成

一个全链路 AI 创作平台，实现从热点发现到内容生成、平台发布、数据分析的全流程闭环。

## 🚀 项目进度

✅ **已完成模块** (100%):
- Auto Dev Server - 开发环境一键启动
- 深色模式切换 - 用户界面主题管理
- Remotion视频生成 - AI视频内容创作
- 视频转录功能 - 语音转文字与智能改写
- LiteLLM集成 - 多AI提供商统一管理
- 热点监控 - 多平台内容发现与智能分析
- 内容生成 - AI驱动的内容创作
- 数据分析 - 数据可视化与趋势分析

❌ **待完成模块** (0%):
- MCP发布平台 - 多平台内容发布系统

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
# 方法1: 使用开发服务器（推荐）
npm run dev

# 方法2: 手动启动
# 终端 1 - 后端
cd server && node server.js

# 终端 2 - 前端
npm run dev

# 方法3: 使用PM2生产部署
npm run start:prod
```

### 🚀 服务状态

| 服务 | 状态 | 地址 | 端口 | 说明 |
|------|------|------|------|------|
| 前端 | ✅ 运行中 | http://localhost:5174 | 5174 | React + Vite 开发服务器 |
| 后端 | ✅ 运行中 | http://localhost:5001/api | 5001 | Express API 服务 |
| 认证 | ✅ 已启用 | JWT双令牌机制 | - | 安全认证已配置 |
| 热点监控 | ✅ 运行中 | 自动更新机制 | - | 15分钟安全频率更新 |
| 监控系统 | ✅ 已启用 | /api/monitoring | - | 健康检查和性能监控 |
| 日志系统 | ✅ 已启用 | 多级日志记录 | - | 结构化日志和审计 |
| 配置管理 | ✅ 已启用 | 环境变量标准化 | - | 统一配置管理 |

## 功能模块

### 热点监控
- 微博热搜、知乎热榜、今日头条
- NewsNow API 多平台聚合
- 实时热点追踪
- 智能趋势分析和预测
- 跨平台对比分析
- 自动报告生成

### AI 内容生成
- 多模型支持（OpenAI、Groq、Cerebras）
- 多平台内容适配
- 智能改写
- 内容质量评估

### 视频处理
- 视频下载（抖音、快手等）
- AI 转录（Whisper、阿里云 ASR）
- 智能改写
- 批量处理

### 数据分析
- 发布数据统计
- 内容效果分析
- 趋势报告
- 可视化展示

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
│   │   └── health.js       # 健康检查和监控
│   ├── services/           # 业务服务
│   │   └── alertService.js # 告警服务
│   ├── middleware/         # 中间件
│   │   ├── loggingMiddleware.js  # 日志中间件
│   │   └── metricsMiddleware.js  # 性能指标中间件
│   ├── utils/              # 工具类
│   │   ├── configLoader.js # 配置加载器
│   │   └── enhancedLogger.js     # 增强日志工具
│   ├── fetchers/           # 数据获取器
│   └── server.js           # 主服务
│
├── docs/                   # 文档中心
│   ├── dev/                # 开发文档
│   ├── specs/              # 功能规格
│   ├── analysis/           # 分析文档
│   ├── plans/              # 计划文档
│   ├── research/           # 技术研究
│   ├── roadmap/            # 路线图
│   ├── mcp/                # MCP相关
│   ├── ENVIRONMENT_VARIABLES_STANDARD.md  # 环境变量标准
│   ├── LOGGING_SYSTEM_STANDARD.md         # 日志系统标准
│   ├── MONITORING_ALERT_SYSTEM.md         # 监控告警标准
│   ├── STANDARD_PORT_CONFIGURATION.md     # 端口配置标准
│   ├── PROJECT_SUMMARY.md                 # 项目概述
│   ├── PROJECT_TASK_STATUS_OVERVIEW.md    # 任务状态汇总
│   └── DEVELOPMENT_PLAN.md                # 开发计划
│
├── scripts/                # 脚本工具
│   ├── dev-server.js       # 开发服务器
│   └── auto-dev-server.js  # 自动化开发服务器
│
└── nginx/                  # Nginx配置
    └── nginx.conf          # 反向代理配置
```

## 📚 文档中心

### 📖 入门文档
- [快速开始](./docs/01-getting-started/quick-start.md) - 从零开始的完整指南

### 🛠️ 开发文档
- [开发工作流](./docs/02-development/workflow.md) - 标准开发流程和规范
- [架构设计](./docs/dev/ARCHITECTURE.md) - 系统架构详解
- [API 文档](./docs/dev/API.md) - 接口规范说明

### 📊 项目管理
- [任务状态](./docs/PROJECT_TASK_STATUS_OVERVIEW.md) - 项目进度和任务完成情况
- [开发计划](./docs/DEVELOPMENT_PLAN.md) - 未来开发规划

### 🔧 技术标准
- [技术标准规范](./docs/04-technical-standards/index.md) - 环境变量、日志、监控等标准

### 🔒 安全相关
- [安全加固计划](./docs/security/SECURITY_HARDENING_PLAN.md) - 安全措施和实施
- [JWT 实施报告](./docs/security/JWT_REFRESH_TOKEN_IMPLEMENTATION_REPORT.md) - 认证机制说明

### 🛠️ 开发指南
- [快速开始](./docs/01-getting-started/quick-start.md) - 环境配置和启动指南
- [开发工作流](./docs/02-development/workflow.md) - 标准开发流程
- [架构设计](./docs/dev/ARCHITECTURE.md) - 系统架构说明
- [API 文档](./docs/dev/API.md) - 接口规范
- [数据存储](./docs/dev/DATA_STORAGE.md) - 存储方案

### 🤖 AI协作
- [AI 协作指南](./docs/dev/AI_COLLABORATION.md) - 如何与 AI 协作开发
- [AI 开发者准则](./docs/dev/AI_DEVELOPER_GUIDELINES.md) - 行为规范
- [规格文档标准](./docs/dev/SPEC_STANDARDS.md) - 文档编写规范

### 🔧 技术标准
- [技术标准规范](./docs/04-technical-standards/index.md) - 统一的技术标准文档

### 🔒 安全相关
- [安全加固计划](./docs/security/SECURITY_HARDENING_PLAN.md) - 安全措施
- [JWT 实施报告](./docs/security/JWT_REFRESH_TOKEN_IMPLEMENTATION_REPORT.md) - 认证机制

## 环境变量

### 基础配置
复制模板文件并配置：

```bash
cp server/.env.example server/.env
```

### 核心配置项

```env
# ===== 必需配置 =====
JWT_SECRET=your-strong-jwt-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password

# ===== AI 提供商配置 =====
# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_API_BASE=https://api.openai.com/v1

# 通义千问（默认）
QWEN_API_KEY=your-qwen-api-key
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# ===== 服务配置 =====
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174

# ===== 日志配置 =====
LOG_LEVEL=debug

# ===== 数据库配置 =====
# MongoDB
DB_HOST=localhost
DB_PORT=27017
DB_NAME=ai_content_dev

# Redis（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 环境配置文件
- `server/.env` - 基础配置
- `server/.env.development` - 开发环境
- `server/.env.production` - 生产环境
- `server/.env.example` - 配置模板

详细配置说明请参考 [环境变量标准文档](./docs/ENVIRONMENT_VARIABLES_STANDARD.md)

## 开发指南

### 🛠️ 开发环境设置

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-content-flow
```

2. **安装依赖**
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
```

3. **配置环境变量**
```bash
# 复制配置模板
cp server/.env.example server/.env

# 编辑配置文件
nano server/.env
```

4. **启动开发服务器**
```bash
# 推荐方式：使用一体化开发服务器
npm run dev

# 或分别启动前后端
# 终端1：后端
npm run server
# 终端2：前端
npm run client
```

### 📊 监控和调试

**健康检查端点**
- 基础健康: `http://localhost:5001/api/monitoring/health`
- 系统信息: `http://localhost:5001/api/monitoring/system`
- 性能指标: `http://localhost:5001/api/monitoring/metrics`

**日志查看**
```bash
# 查看实时日志
tail -f server/logs/application/app-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f server/logs/error/error-$(date +%Y-%m-%d).log
```

### 🔧 常用开发命令

```bash
# 开发相关
npm run dev          # 启动开发服务器
npm run server       # 仅启动后端
npm run client       # 仅启动前端

# 构建相关
npm run build        # 构建生产版本
npm run preview      # 预览生产构建

# 部署相关
npm run start:prod   # 生产环境启动
npm run stop:prod    # 停止生产服务

# 测试相关
npm run test         # 运行测试
npm run test:watch   # 监听模式运行测试
```

### 📁 代码规范

- 使用ESLint进行代码检查
- 遵循Airbnb JavaScript编码规范
- 组件采用函数式组件和Hooks
- API调用统一使用Axios
- 日志记录使用增强日志工具

### 🤖 AI协作开发

1. **任务分解**: 将复杂功能拆分为小任务
2. **渐进式实现**: 先完成功能骨架，再逐步完善
3. **测试驱动**: 编写测试用例验证功能
4. **文档同步**: 代码变更同时更新相关文档

详细指南请参考 [AI协作开发指南](./docs/dev/AI_COLLABORATION.md)

## 常见问题

### Q: 如何启动项目？

```bash
# 推荐方式：使用一体化开发服务器
npm run dev

# 或分别启动
# 终端1 - 后端
cd server && node server.js
# 终端2 - 前端
npm run dev
```

### Q: 如何添加新功能？

1. 在 `docs/specs/` 创建规格文档
2. 按照 `DEV_WORKFLOW.md` 的 7 步流程开发
3. 更新相关文档

### Q: 遇到问题怎么办？

1. 查看 `docs/dev/ISSUE_*.md` 是否有类似问题记录
2. 检查后端服务是否正常运行
3. 查看浏览器控制台和后端日志

## 贡献指南

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
refactor: 重构
test: 测试
chore: 构建/工具
```

## 许可证

MIT License

---

**最后更新**: 2026年2月16日  
**维护者**: AI Developer Team  
**版本**: 2.0 - 全功能完成版