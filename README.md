<<<<<<< HEAD
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
=======
# Publisher Tools - 多平台内容发布工具集

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**一站式多平台内容发布自动化系统**

[功能特性](#功能特性) • [快速开始](#快速开始) • [部署](#部署) • [API文档](#api文档) • [开发指南](#开发指南)

</div>

---

## 📖 项目简介

Publisher Tools 是一个支持多平台内容发布的自动化系统，从 TrendRadar 项目分离而来，提供完整的**内容创作→发布→数据分析**闭环能力。

### 核心能力

- 🚀 **多平台发布** - 支持抖音、今日头条、小红书三大平台
- 🤖 **AI驱动** - 集成多种AI提供商，智能内容生成
- 📊 **数据分析** - 完整的数据采集和报告生成
- 🎬 **视频转录** - 视频内容AI转录，一键改写发布
- 🔥 **热点监控** - 实时热点抓取，趋势分析
- 💻 **Web管理** - 现代化React前端界面
>>>>>>> publisher-tools

---

## ✨ 功能特性

### 1. 平台发布
- ✅ 统一发布接口
- ✅ 同步/异步发布模式
- ✅ 任务队列管理
- ✅ 发布状态追踪
- ✅ Cookie自动管理

### 2. AI服务集成
- ✅ 多提供商支持（OpenRouter、DeepSeek、Ollama等）
- ✅ 内容生成与改写
- ✅ 内容审核
- ✅ 热点分析

### 3. 视频转录
- ✅ 多平台视频下载
- ✅ AI语音转录
- ✅ 关键词提取
- ✅ 内容改写优化
- ✅ 一键发布

### 4. 热点监控
- ✅ NewsNow聚合源
- ✅ 多数据源支持
- ✅ 热度趋势分析
- ✅ AI内容适配

### 5. 数据分析
- ✅ 三平台数据采集框架
- ✅ 智能报告生成
- ✅ JSON/Markdown导出
- ✅ 数据洞察分析

### 6. Web管理界面
- ✅ 仪表盘总览
- ✅ 账号管理
- ✅ 内容发布
- ✅ 任务历史
- ✅ 数据分析

---

## 🚀 快速开始

### 环境要求
<<<<<<< HEAD
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
=======

- **Go** 1.21+
- **Node.js** 18+
- **Chrome/Chromium** - 浏览器自动化

### 方式一：直接运行（推荐开发环境）

```bash
# 1. 克隆项目
git clone <repository-url>
cd publisher-tools

# 2. 编译项目
make build

# 3. 启动开发环境
make dev
```

访问：
- **前端**: http://localhost:5173
- **后端API**: http://localhost:8080

### 方式二：Docker部署（推荐生产环境）

```bash
# 使用 Docker Compose
docker-compose up -d

# 查看日志
docker-compose logs -f
```

访问：http://localhost:8080

### 方式三：手动启动

```bash
# 后端服务
./bin/publisher-server -port 8080

# 前端开发服务器
cd publisher-web
npm install
npm run dev
```

---

## 📦 部署

### Docker部署

```bash
# 构建镜像
docker build -t publisher-tools .

# 运行容器
docker run -d \
  --name publisher-server \
  -p 8080:8080 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/cookies:/app/cookies \
  -v $(pwd)/data:/app/data \
  publisher-tools
```

### Docker Compose部署

```bash
# 启动所有服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 生产环境配置

创建 `.env` 文件：

```bash
# 服务配置
PORT=8080
HEADLESS=true
DEBUG=false

# AI配置
OPENROUTER_API_KEY=your_key
DEEPSEEK_API_KEY=your_key

# 存储配置
STORAGE_DIR=/app/uploads
DATA_DIR=/app/data
```

---

## 📚 API文档

### 核心端点

#### 平台管理
```
GET    /api/v1/platforms                    # 平台列表
GET    /api/v1/platforms/{platform}/check   # 登录状态
POST   /api/v1/platforms/{platform}/login   # 登录平台
POST   /api/v1/platforms/{platform}/logout  # 登出平台
```

#### 内容发布
```
POST   /api/v1/publish                       # 同步发布
POST   /api/v1/publish/async                 # 异步发布
GET    /api/v1/tasks                         # 任务列表
GET    /api/v1/tasks/{taskId}                # 任务详情
POST   /api/v1/tasks/{taskId}/cancel         # 取消任务
```

#### 文件存储
```
POST   /api/v1/storage/upload                # 文件上传
GET    /api/v1/storage/download              # 文件下载
GET    /api/v1/storage/list                  # 文件列表
DELETE /api/v1/storage/delete                # 文件删除
```

#### 热点监控
```
GET    /api/hot-topics                       # 热点列表
GET    /api/hot-topics/{id}                  # 热点详情
POST   /api/hot-topics/newsnow/fetch         # 抓取热点
GET    /api/hot-topics/newsnow/sources       # 数据源列表
```

#### 数据分析
```
GET    /api/analytics/dashboard              # 仪表盘数据
GET    /api/analytics/trends                 # 趋势数据
GET    /api/analytics/report/weekly          # 周报
GET    /api/analytics/report/monthly         # 月报
GET    /api/analytics/report/export          # 导出报告
```

#### AI服务
```
GET    /api/v1/ai/providers                  # AI提供商列表
GET    /api/v1/ai/models                     # AI模型列表
POST   /api/v1/ai/generate                   # AI生成
POST   /api/v1/ai/analyze/hotspot            # 热点分析
POST   /api/v1/ai/content/generate           # 内容生成
POST   /api/v1/ai/content/rewrite            # 内容改写
```

### API使用示例

```bash
# 获取平台列表
curl http://localhost:8080/api/v1/platforms

# 登录平台
curl -X POST http://localhost:8080/api/v1/platforms/douyin/login

# 异步发布
curl -X POST http://localhost:8080/api/v1/publish/async \
  -H "Content-Type: application/json" \
  -d '{
    "platform":"douyin",
    "type":"images",
    "title":"标题",
    "content":"正文",
    "images":["uploads/test.jpg"]
  }'

# 获取周报
curl http://localhost:8080/api/analytics/report/weekly

# 导出Markdown报告
curl "http://localhost:8080/api/analytics/report/export?format=markdown"
```

---

## 👨‍💻 开发指南

### 项目结构

```
publisher-tools/
├── publisher-core/           # Go后端核心
│   ├── adapters/            # 平台适配器
│   ├── analytics/           # 数据分析
│   │   └── collectors/     # 数据采集器
│   ├── api/                 # REST API
│   ├── ai/                  # AI服务
│   ├── browser/             # 浏览器自动化
│   ├── cookies/             # Cookie管理
│   ├── hotspot/             # 热点监控
│   ├── interfaces/          # 接口定义
│   ├── storage/             # 文件存储
│   ├── task/                # 任务管理
│   │   └── handlers/       # 任务处理器
│   └── cmd/server/          # 服务入口
│
├── publisher-web/           # React前端
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # UI组件
│   │   ├── lib/            # API工具
│   │   └── types/          # 类型定义
│   └── package.json
│
├── Makefile                 # 构建脚本
├── dev.sh                   # 开发脚本
├── Dockerfile               # Docker配置
└── docker-compose.yml       # Docker编排
```

### 开发命令

```bash
# 查看 Makefile 帮助
make help

# 编译项目
make build

# 启动开发环境
make dev

# 运行测试
make test

# 查看服务状态
make status

# 查看日志
make logs

# 停止服务
make stop
```

### 代码规范

#### Go代码
- 使用 `logrus` 进行日志记录
- 错误使用 `github.com/pkg/errors` 包装
- 接口定义在 `interfaces/` 包
- 单元测试覆盖率 > 70%

#### 前端代码
- 使用 TypeScript
- 函数式组件 + Hooks
- UI组件使用 shadcn/ui
- API调用封装在 `lib/api.ts`

---

## 🔧 配置说明

### 平台限制

| 平台 | 标题 | 正文 | 图片 | 视频 |
|------|------|------|------|------|
| 抖音 | 30字 | 2000字 | 12张 | 2GB, MP4 |
| 今日头条 | 30字 | 2000字 | 9张 | MP4 |
| 小红书 | 20字 | 1000字 | 18张 | 500MB, MP4 |

### Cookie存储

- 小红书：`./cookies/xiaohongshu_cookies.json`
- 抖音：`./cookies/douyin_cookies.json`
- 今日头条：`./cookies/toutiao_cookies.json`

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | API服务端口 | 8080 |
| HEADLESS | 浏览器无头模式 | true |
| DEBUG | 调试模式 | false |
| COOKIE_DIR | Cookie存储目录 | ./cookies |
| STORAGE_DIR | 文件存储目录 | ./uploads |
| DATA_DIR | 数据存储目录 | ./data |

---

## 📈 性能优化

### 并发控制
- 任务队列最大并发：10
- API请求限流：100 req/min
- 浏览器实例池：5个实例

### 缓存策略
- Cookie缓存：内存 + 文件
- 热点数据：5分钟过期
- 报告数据：1小时缓存

---

## 🔒 安全说明

### 注意事项

1. **首次使用**：必须先执行登录操作
2. **Cookie过期**：需要定期重新登录
3. **发布间隔**：建议间隔 >=5 分钟
4. **内容规范**：遵守各平台社区规范
5. **风控风险**：高频操作可能触发限流

### 安全建议

- 不要在公网暴露服务端口
- 定期更换Cookie
- 使用环境变量管理敏感信息
- 启用HTTPS加密传输

---

## 🛠️ 故障排查

### 常见问题

**Q: 浏览器自动化失败**
```bash
# 检查 Chrome 是否安装
which chromium || which google-chrome

# 安装 Chrome
apt-get install chromium-browser  # Ubuntu/Debian
yum install chromium               # CentOS/RHEL
```

**Q: Cookie失效**
```bash
# 重新登录
curl -X POST http://localhost:8080/api/v1/platforms/douyin/login
```

**Q: 任务执行失败**
```bash
# 查看任务状态
curl http://localhost:8080/api/v1/tasks/{taskId}

# 查看日志
make logs
```

**Q: AI服务不可用**
```bash
# 配置 AI API Key
export OPENROUTER_API_KEY=your_key
export DEEPSEEK_API_KEY=your_key

# 重启服务
make restart
```

---

## 🗺️ 路线图

### v1.1 (计划中)
- [ ] 更多平台支持（B站、微博、微信公众号）
- [ ] 定时发布功能
- [ ] 批量发布优化
- [ ] 内容审核增强

### v1.2 (规划中)
- [ ] 微服务架构
- [ ] 消息队列集成
- [ ] 分布式任务调度
- [ ] AI增强功能

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

### 开源依赖

**后端**
- [go-rod/rod](https://github.com/go-rod/rod) - 浏览器自动化
- [gorilla/mux](https://github.com/gorilla/mux) - HTTP路由
- [sirupsen/logrus](https://github.com/sirupsen/logrus) - 日志

**前端**
- [React](https://react.dev/) - UI框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Vite](https://vitejs.dev/) - 构建工具

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star ⭐**

Made with ❤️ by MonkeyCode Team

</div>
>>>>>>> publisher-tools
