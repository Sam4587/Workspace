# 小红书发布工具 - 项目总结

## 项目概述

这是一个基于 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 核心功能构建的简化版 CLI 发布工具,专注于图文和视频发布功能。

## 技术架构

### 核心依赖

- **xiaohongshu-mcp v1.2.2**: 复用其成熟的核心功能模块
  - browser: 浏览器自动化
  - xiaohongshu: 小红书平台特定操作
  - configs: 配置管理
- **Go 1.21+**: 主要开发语言
- **Rod**: Go 浏览器自动化库

### 项目结构

```
xiaohongshu-publisher-cli/
├── main.go              # 主程序入口
├── xiaohongshu-publisher  # 编译后的可执行文件
├── README.md           # 使用文档
├── DEPLOYMENT.md       # Docker 部署指南
└── go.mod             # Go 模块配置
```

## 核心功能

### 1. 登录状态检查

```bash
./xiaohongshu-publisher -check
```

### 2. 图文发布

支持本地图片路径和 HTTP 图片链接:

```bash
# 本地图片
./xiaohongshu-publisher \
  -title "测试标题" \
  -content "测试内容" \
  -images "/path/to/img1.jpg,/path/to/img2.jpg" \
  -tags "美食,生活"

# HTTP 图片
./xiaohongshu-publisher \
  -title "测试标题" \
  -content "测试内容" \
  -images "https://example.com/img1.jpg,https://example.com/img2.jpg" \
  -tags "美食,生活"
```

### 3. 视频发布

仅支持本地视频文件:

```bash
./xiaohongshu-publisher \
  -title "测试视频" \
  -content "视频描述" \
  -video "/path/to/video.mp4" \
  -tags "生活"
```

## 部署方式

### 方式 1: 直接使用官方 Docker 镜像 (推荐)

最简单的方式,直接使用 xiaohongshu-mcp 的 Docker 镜像:

```bash
docker pull xpzouying/xiaohongshu-mcp
docker run -d --name xiaohongshu-publisher \
  -v ~/xiaohongshu-data/cookies:/app/cookies \
  -v ~/xiaohongshu-data/images:/app/images \
  -p 18060:18060 \
  xpzouying/xiaohongshu-mcp
```

### 方式 2: 使用 CLI 工具

适合需要直接命令行操作的场景:

```bash
# 1. 先使用官方登录工具登录
./xiaohongshu-login-darwin-arm64

# 2. 使用 CLI 发布
./xiaohongshu-publisher -title "标题" -content "内容" -images "img.jpg"
```

## MCP 客户端集成

虽然这是 CLI 工具,但官方 xiaohongshu-mcp 支持 MCP 协议,可以集成到各种 MCP 客户端:

### 支持的客户端

1. **Cherry Studio**
2. **AnythingLLM**
3. **Cline**
4. **VS Code (MCP 插件)**
5. **Cursor**

### 配置示例

Cherry Studio:
- URL: `http://localhost:18060/mcp`
- 类型: `http`

## 使用流程

### 首次使用

1. 下载官方登录工具
2. 运行登录工具并扫码
3. Cookie 自动保存
4. 开始使用 CLI 发布

### 日常使用

1. 检查登录状态: `-check`
2. 发布图文/视频
3. 自动处理标题/正文长度限制

## 注意事项

1. **Cookie 管理**: Cookie 保存在 `~/.cache/xiaohongshu-mcp/cookies/cookies.json`
2. **长度限制**:
   - 标题: 最多 20 字
   - 正文: 最多 1000 字
3. **图片格式**: 推荐 JPEG/PNG
4. **视频格式**: 仅支持 MP4
5. **登录安全**: 不要在多个网页端同时登录同一账号

## 技术亮点

1. **零重写**: 完全复用 xiaohongshu-mcp 的成熟代码
2. **简洁设计**: 单文件主程序,易于理解和维护
3. **开箱即用**: 编译后的二进制文件直接运行
4. **灵活部署**: 支持 CLI 和 Docker 两种方式

## 开发说明

### 构建

```bash
cd xiaohongshu-publisher-cli
go build -o xiaohongshu-publisher .
```

### 交叉编译

```bash
# Linux
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o xiaohongshu-publisher-linux .

# macOS Apple Silicon
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o xiaohongshu-publisher-darwin-arm64 .

# Windows
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o xiaohongshu-publisher-windows.exe .
```

## 与官方项目的区别

| 特性 | 官方 xiaohongshu-mcp | 本工具 |
|------|----------------------|--------|
| 登录功能 | ✅ | ❌ (使用官方工具) |
| 图文发布 | ✅ | ✅ |
| 视频发布 | ✅ | ✅ |
| 搜索内容 | ✅ | ❌ |
| 评论互动 | ✅ | ❌ |
| MCP 协议 | ✅ | ❌ (使用官方镜像) |
| HTTP API | ✅ | ❌ (使用官方镜像) |
| CLI 界面 | ❌ | ✅ |

## 推荐使用场景

### 使用本 CLI 工具

- 需要批量发布脚本
- 集成到自动化流程
- 命令行偏好用户

### 使用官方 Docker 镜像

- 需要 MCP 协议集成
- 需要 HTTP API
- 需要 Web 界面管理
- Cherry Studio/AnythingLLM 等客户端集成

## 未来扩展

1. **批量发布**: 支持批量导入配置文件发布
2. **定时发布**: 支持定时任务
3. **模板管理**: 支持内容模板
4. **数据统计**: 发布数据统计和分析

## 参考资料

- [xiaohongshu-mcp GitHub](https://github.com/xpzouying/xiaohongshu-mcp)
- [xiaohongshu-mcp 文档](https://github.com/xpzouying/xiaohongshu-mcp#readme)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Rod 文档](https://github.com/go-rod/rod)
