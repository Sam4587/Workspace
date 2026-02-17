# MCP 多平台发布工具

基于 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 的多平台发布工具，支持小红书、抖音、今日头条等内容平台的自动化发布。

## 📊 项目状态

| 平台 | 登录 | 图文发布 | 视频发布 | 内容管理 | MCP 支持 | 状态 |
|------|------|---------|---------|---------|----------|------|
| 小红书 | ✅ | ✅ | ✅ | ✅ | ✅ | 已完成 |
| 抖音 | 🔄 | 🔄 | 🔄 | 🔄 | 🔄 | 开发中 |
| 今日头条 | 🔄 | 🔄 | 🔄 | 🔄 | 🔄 | 开发中 |

## 🏗️ 架构设计

### 核心架构

```
┌─────────────────────────────────────┐
│        MCP 客户端/HTTP API           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         平台抽象层 (Platform)        │
│  - 登录认证                          │
│  - 内容发布                          │
│  - 内容管理                          │
│  - 互动功能                          │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌──▼───┐  ┌──▼────┐
│小红书  │  │ 抖音  │  │今日头条│
│Platform│  │Platform│  │Platform│
└───────┘  └──────┘  └───────┘
```

### 目录结构

```
mcp-publish-platform/
├── internal/
│   ├── platform/          # 平台抽象层
│   │   ├── platform.go    # 接口定义
│   │   ├── types.go       # 公共类型
│   │   └── registry.go    # 平台注册中心
│   │
│   ├── xiaohongshu/      # 小红书实现
│   ├── douyin/            # 抖音实现（开发中）
│   └── toutiao/           # 今日头条实现（开发中）
│
├── pkg/
│   ├── browser/          # 浏览器控制器
│   ├── auth/             # 认证管理
│   └── config/           # 配置管理
│
├── mcp/                  # MCP 协议
│   ├── server.go
│   └── handlers.go
│
└── api/                  # HTTP API
    ├── server.go
    └── handlers.go
```

## 🚀 快速开始

### 环境要求

- Go 1.24+
- Chrome/Chromium 浏览器
- 环境变量：`ROD_BROWSER_BIN`（浏览器路径）

### 安装依赖

```bash
go mod download
```

### 编译项目

```bash
go build -o bin/mcp-server .
```

### 运行服务

```bash
# 默认端口 18060
./bin/mcp-server

# 指定端口
./bin/mcp-server -port :8080

# 无头模式（默认）
./bin/mcp-server -headless=true

# 有头模式（调试用）
./bin/mcp-server -headless=false
```

## 📝 使用指南

### 小红书平台

#### 1. 登录

```bash
# 通过 MCP 客户端
调用 login 工具

# 通过 HTTP API
POST http://localhost:18060/api/xiaohongshu/login
```

#### 2. 发布图文

```bash
POST http://localhost:18060/api/xiaohongshu/publish
Content-Type: application/json

{
  "title": "标题",
  "content": "内容",
  "images": [
    "/path/to/image1.jpg",
    "/path/to/image2.png"
  ],
  "tags": ["标签1", "标签2"]
}
```

#### 3. 发布视频

```bash
POST http://localhost:18060/api/xiaohongshu/publish-video
Content-Type: application/json

{
  "title": "视频标题",
  "description": "视频描述",
  "video_path": "/path/to/video.mp4"
}
```

### 抖音平台（开发中）

> 敬请期待...

### 今日头条平台（开发中）

> 敬请期待...

## 🔧 MCP 协议支持

### 支持的工具列表

#### 小红书平台

- `xiaohongshu_login` - 登录小红书
- `xiaohongshu_check_login` - 检查登录状态
- `xiaohongshu_publish_note` - 发布图文笔记
- `xiaohongshu_publish_video` - 发布视频
- `xiaohongshu_get_feeds` - 获取作品列表
- `xiaohongshu_search_notes` - 搜索笔记
- `xiaohongshu_like_note` - 点赞笔记
- `xiaohongshu_comment_note` - 评论笔记

#### 抖音平台（开发中）

- `douyin_login`
- `douyin_publish_video`
- 更多功能开发中...

#### 今日头条平台（开发中）

- `toutiao_login`
- `toutiao_publish_article`
- 更多功能开发中...

### 连接 MCP 服务器

#### Cherry Studio

1. 打开 Cherry Studio
2. 添加 MCP 服务器
3. 服务器地址：`ws://localhost:18060/mcp`
4. 连接成功后即可使用工具

#### AnythingLLM

1. 配置 MCP 服务器端点
2. 端点地址：`http://localhost:18060/mcp`
3. 重启 AnythingLLM
4. 在对话中调用工具

## 🛠️ 开发指南

### 添加新平台

1. 在 `internal/` 下创建平台目录（如 `douyin/`）
2. 实现 `platform.Platform` 接口
3. 在 `main.go` 中注册平台

```go
package main

import (
    "github.com/yourname/mcp-publish-platform/internal/douyin"
    "github.com/yourname/mcp-publish-platform/internal/platform"
)

func main() {
    // 注册平台
    platform.RegisterPlatform(douyin.New())
    
    // 启动服务...
}
```

### 平台接口

```go
type Platform interface {
    // 基本信息
    ID() PlatformID
    Name() string
    BaseURL() string
    
    // 登录认证
    Login(ctx context.Context, page *rod.Page) error
    CheckLogin(ctx context.Context, page *rod.Page) (bool, error)
    
    // 内容发布
    PublishImageText(ctx context.Context, page *rod.Page, req *ImageTextRequest) (*PublishResponse, error)
    PublishVideo(ctx context.Context, page *rod.Page, req *VideoRequest) (*PublishResponse, error)
    
    // 内容管理
    GetFeeds(ctx context.Context, page *rod.Page, req *GetFeedsRequest) (*GetFeedsResponse, error)
    
    // 更多方法...
}
```

## 📚 技术文档

- [平台接口设计](./docs/platform-interface.md)
- [MCP 协议规范](./docs/mcp-protocol.md)
- [API 文档](./docs/api-documentation.md)
- [开发指南](./docs/development-guide.md)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于原 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 项目进行多平台扩展开发。

## 🙏 致谢

- 感谢 [xpzouying](https://github.com/xpzouying) 提供的优秀的小红书 MCP 项目
- 感谢所有贡献者的支持

## 📮 联系方式

- 项目地址：[GitHub](https://github.com/yourname/mcp-publish-platform)
- 问题反馈：[Issues](https://github.com/yourname/mcp-publish-platform/issues)
