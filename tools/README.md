# MCP 发布工具集

本目录包含多平台内容发布工具，支持小红书、抖音、今日头条等平台。

## 工具列表

| 工具 | 平台 | 状态 | 说明 |
|------|------|------|------|
| `publisher-core` | 统一接口 | **推荐** | 统一架构，支持异步发布和 REST API |
| `publisher-web` | Web 管理界面 | **新增** | React + shadcn/ui 现代化管理界面 |
| `xiaohongshu-publisher` | 小红书 | 可用 | 独立 CLI 工具 |
| `douyin-toutiao` | 抖音/今日头条 | 可用 | 独立 CLI 工具 |

## 快速开始

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

## Publisher Core 新特性

### 统一接口

所有平台使用统一的 `Publisher` 接口：

```go
pub, _ := factory.Create("douyin")
pub.Login(ctx)
pub.Publish(ctx, content)
```

### 异步发布

耗时操作支持异步执行：

```go
taskID, _ := pub.PublishAsync(ctx, content)
result, _ := pub.QueryStatus(ctx, taskID)
```

### REST API

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

## 抖音/今日头条发布工具

### 功能
- 二维码登录
- Cookie 管理
- 图文发布
- 视频发布
- 登录状态检查

### 使用方法

```bash
# 抖音登录
./bin/publisher -platform douyin -login

# 今日头条登录
./bin/publisher -platform toutiao -login

# 检查登录状态
./bin/publisher -platform douyin -check

# 发布抖音图文
./bin/publisher -platform douyin -title "标题" -content "正文" -images "img1.jpg,img2.jpg" -tags "美食"

# 发布抖音视频
./bin/publisher -platform douyin -title "标题" -content "正文" -video "video.mp4" -tags "生活"
```

### 限制

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
|------|---------|
| 小红书 | `web_session`, `webId` |
| 抖音 | `tt_webid`, `passport_auth`, `csrf_token`, `ttcid` |
| 今日头条 | `sessionid`, `passport_auth`, `tt_token`, `tt_webid` |

## 反爬虫策略

所有工具都实现了以下反爬虫策略：
1. 随机延迟（0.3-2 秒）
2. DOM 稳定等待
3. 无头/有头模式切换
4. 模拟人工操作

## 注意事项

1. **首次使用**：必须先执行登录操作
2. **Cookie 过期**：需要定期重新登录
3. **发布间隔**：建议间隔 >=5 分钟
4. **内容规范**：遵守各平台社区规范
5. **风控风险**：高频操作可能触发限流

## 技术架构

```
工具架构
├── publisher-core/           # 统一核心库（推荐）
│   ├── interfaces/           # 接口定义
│   ├── adapters/             # 平台适配器
│   ├── browser/              # 浏览器自动化
│   ├── cookies/              # Cookie 管理
│   ├── task/                 # 异步任务管理
│   ├── storage/              # 文件存储抽象
│   ├── api/                  # REST API
│   └── cmd/
│       ├── server/           # API 服务入口
│       └── cli/              # 命令行入口
├── publisher-web/            # Web 管理界面（新增）
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # UI 组件
│   │   ├── lib/              # API 和工具函数
│   │   └── types/            # TypeScript 类型定义
│   └── package.json
├── xiaohongshu-publisher/    # 小红书独立工具
│   ├── main.go
│   └── go.mod
└── douyin-toutiao/           # 抖音/头条独立工具
    ├── main.go
    ├── douyin/
    ├── toutiao/
    └── go.mod
```

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
