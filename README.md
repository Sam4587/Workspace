# Publisher Tools - 多平台内容发布工具集

一个支持多平台内容发布的工具系统，包含 Go 后端服务、React 前端管理界面和独立 CLI 工具。

> **项目来源**：从 TrendRadar 项目分离而来，详见 [PROJECT_SEPARATION.md](./PROJECT_SEPARATION.md)

## 项目概述

Publisher Tools 是一个多平台内容发布自动化系统，支持：
- 抖音图文/视频发布
- 今日头条发布
- 小红书发布
- REST API 服务
- Web 管理界面

## 工具列表

| 工具 | 平台 | 状态 | 说明 |
|------|------|------|------|
| `publisher-core` | 统一接口 | **推荐** | 统一架构，支持异步发布和 REST API |
| `publisher-web` | Web 管理界面 | **新增** | React + shadcn/ui 现代化管理界面 |
| `xiaohongshu-publisher` | 小红书 | 可用 | 独立 CLI 工具 |
| `douyin-toutiao` | 抖音/今日头条 | 可用 | 独立 CLI 工具 |

## 项目结构

```
.
├── publisher-core/        # 核心库（统一架构）
│   ├── interfaces/       # 接口定义
│   ├── adapters/         # 平台适配器
│   ├── browser/          # 浏览器自动化
│   ├── cookies/          # Cookie 管理
│   ├── task/             # 异步任务管理
│   ├── storage/          # 文件存储抽象
│   ├── api/              # REST API
│   └── cmd/
│       ├── server/       # API 服务入口
│       └── cli/          # 命令行入口
├── publisher-web/        # Web 管理界面
│   └── src/
│       ├── pages/        # 页面组件
│       ├── components/   # UI 组件
│       └── lib/          # API 工具函数
├── douyin-toutiao/       # 抖音/头条 CLI 工具
└── xiaohongshu-publisher/ # 小红书 CLI 工具
```

## 快速开始

### 环境要求

- Go 1.21+
- Node.js 18+
- Chrome/Chromium 浏览器（用于浏览器自动化）

### 方式一：Web 管理界面（推荐）

```bash
# 编译
make build

# 启动后端服务
./bin/publisher-server -port 8080 &

# 启动前端开发服务器
make serve-web

# 或启动所有开发服务
make dev
```

访问 http://localhost:5173 使用 Web 管理界面。

### 方式二：REST API 服务

```bash
# 编译
make build

# 启动 REST API 服务
./bin/publisher-server -port 8080
```

### 方式三：命令行工具

```bash
# 登录平台
./bin/publisher -platform douyin -login

# 发布内容
./bin/publisher -platform douyin -title "标题" -content "正文" -images "img.jpg" -async
```

## Web 管理界面功能

- **仪表盘**：查看平台状态、发布统计、快速操作
- **账号管理**：管理各平台登录状态、扫码登录
- **内容发布**：图文/视频发布、标签管理、平台选择
- **发布历史**：任务列表、状态查询、进度追踪

## REST API 文档

### 平台管理

```
GET  /api/v1/platforms           # 获取支持的平台列表
GET  /api/v1/accounts            # 获取账号列表
GET  /api/v1/accounts/:platform  # 获取指定平台的登录状态
POST /api/v1/login/:platform     # 登录指定平台
```

### 内容发布

```
POST /api/v1/publish             # 同步发布
POST /api/v1/publish/async       # 异步发布
GET  /api/v1/tasks               # 获取任务列表
GET  /api/v1/tasks/:taskId       # 查询任务状态
```

### 使用示例

```bash
# 获取平台列表
curl http://localhost:8080/api/v1/platforms

# 异步发布
curl -X POST http://localhost:8080/api/v1/publish/async \
  -H "Content-Type: application/json" \
  -d '{"platform":"douyin","type":"images","title":"标题","images":["img.jpg"]}'

# 查询任务状态
curl http://localhost:8080/api/v1/tasks/{taskId}
```

## 平台限制

| 平台 | 标题 | 正文 | 视频 |
|------|------|------|------|
| 抖音 | 最多 30 字 | 最多 2000 字 | <=2GB, MP4 |
| 今日头条 | 最多 30 字 | 最多 2000 字 | MP4 |
| 小红书 | 最多 20 字 | 最多 1000 字 | <=500MB, MP4 |

## Cookie 管理

### 存储位置
- 小红书：`./cookies/xiaohongshu_cookies.json`
- 抖音：`./cookies/douyin_cookies.json`
- 今日头条：`./cookies/toutiao_cookies.json`

### Cookie 字段

| 平台 | 关键字段 |
|------|----------|
| 小红书 | `web_session`, `webId` |
| 抖音 | `tt_webid`, `passport_auth`, `csrf_token`, `ttcid` |
| 今日头条 | `sessionid`, `passport_auth`, `tt_token`, `tt_webid` |

## 后续开发方向

### 短期目标

1. **完善核心库**
   - [ ] 完善平台适配器（抖音、头条、小红书、B站）
   - [ ] 实现异步任务队列
   - [ ] 添加重试机制和错误处理

2. **完善 Web 界面**
   - [ ] 仪表盘页面
   - [ ] 账号管理页面
   - [ ] 内容发布页面
   - [ ] 任务管理页面

3. **测试覆盖**
   - [ ] 单元测试
   - [ ] 集成测试
   - [ ] E2E 测试

### 中期目标

1. **扩展平台支持**
   - [ ] B站视频发布
   - [ ] 微博图文发布
   - [ ] 微信公众号发布

2. **高级功能**
   - [ ] 定时发布
   - [ ] 批量发布
   - [ ] 内容审核
   - [ ] 数据统计

### 长期目标

1. **微服务架构**
   - [ ] 拆分为独立服务
   - [ ] 消息队列集成
   - [ ] 分布式任务调度

2. **AI 增强**
   - [ ] 智能内容适配
   - [ ] 自动标签生成
   - [ ] 发布时间优化

## 注意事项

1. **首次使用**：必须先执行登录操作
2. **Cookie 过期**：需要定期重新登录
3. **发布间隔**：建议间隔 >=5 分钟
4. **内容规范**：遵守各平台社区规范
5. **风控风险**：高频操作可能触发限流

## 开源依赖

### 后端
- [go-rod/rod](https://github.com/go-rod/rod) - 浏览器自动化
- [gorilla/mux](https://github.com/gorilla/mux) - HTTP 路由
- [google/uuid](https://github.com/google/uuid) - UUID 生成
- [sirupsen/logrus](https://github.com/sirupsen/logrus) - 日志

### 前端
- [React](https://react.dev/) - UI 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [React Router](https://reactrouter.com/) - 路由

## 许可证

MIT License
