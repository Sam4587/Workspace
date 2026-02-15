# 小红书发布工具 CLI - 项目说明

## 项目完成状态

✅ **项目已完成,可直接使用**

## 交付物

### 1. 可执行文件

- `xiaohongshu-publisher`: 编译好的 Linux 可执行文件

### 2. 源代码

- `main.go`: 完整的 Go 源代码
- `go.mod`: Go 模块配置
- `go.sum`: 依赖锁定文件

### 3. 文档

- `README.md`: 基本使用说明
- `QUICKSTART.md`: 5分钟快速上手
- `DEPLOYMENT.md`: Docker 部署指南
- `SUMMARY.md`: 项目总结和技术细节
- `PROJECT.md`: 本文件

## 如何使用

### 方式 1: 直接使用 CLI (推荐)

```bash
# 1. 首次使用 - 下载登录工具
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-login-linux-amd64
chmod +x xiaohongshu-login-linux-amd64

# 2. 扫码登录
./xiaohongshu-login-linux-amd64

# 3. 使用本工具发布
./xiaohongshu-publisher -title "标题" -content "内容" -images "image.jpg"
```

### 方式 2: Docker 部署

使用官方 Docker 镜像获得完整 MCP 功能:

```bash
docker pull xpzouying/xiaohongshu-mcp
docker run -d --name xiaohongshu-publisher \
  -v ~/xiaohongshu-data/cookies:/app/cookies \
  -v ~/xiaohongshu-data/images:/app/images \
  -p 18060:18060 \
  xpzouying/xiaohongshu-mcp
```

## 技术实现

### 核心架构

```
xiaohongshu-publisher (CLI)
    ↓ 依赖
xiaohongshu-mcp v1.2.2 (官方库)
    ├── browser: 浏览器自动化
    ├── xiaohongshu: 小红书平台操作
    └── configs: 配置管理
```

### 功能映射

| 功能 | 实现方式 |
|------|----------|
| 图文发布 | xiaohongshu.PublishImageAction |
| 视频发布 | xiaohongshu.PublishVideoAction |
| 登录检查 | xiaohongshu.LoginAction.CheckLoginStatus |
| 浏览器控制 | browser.NewBrowser |
| Cookie 管理 | xiaohongshu-mcp 内置 |

### 代码复用

- ✅ 100% 复用 xiaohongshu-mcp 核心逻辑
- ✅ 0 行核心代码重写
- ✅ 直接依赖官方库,自动更新
- ✅ 简洁的主程序,仅 200 行

## 与官方项目对比

### 官方 xiaohongshu-mcp

**优点**:
- 功能完整 (发布/搜索/评论/用户主页)
- MCP 协议支持
- HTTP API 支持
- Web UI 支持

**缺点**:
- 需要配置 MCP 客户端
- 对于简单发布场景较重

### 本 CLI 工具

**优点**:
- 专注于发布功能
- 命令行简单易用
- 适合脚本和自动化
- 轻量级,单文件

**缺点**:
- 功能仅限于发布
- 不支持 MCP 协议

### 使用建议

- **简单发布**: 使用本 CLI 工具
- **完整功能**: 使用官方 Docker 镜像
- **MCP 集成**: 使用官方 Docker 镜像

## 部署验证

### 构建验证

```bash
cd xiaohongshu-publisher-cli
go build -o test . && echo "✅ 构建成功" && rm test
```

### 功能验证

在支持 GUI 的环境中:

```bash
# 1. 登录
./xiaohongshu-login-linux-amd64

# 2. 检查状态
./xiaohongshu-publisher -check

# 3. 发布测试
./xiaohongshu-publisher \
  -title "测试" \
  -content "测试内容" \
  -images "test.jpg"
```

## 交叉编译支持

```bash
# Linux
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o xiaohongshu-publisher-linux .

# macOS Apple Silicon
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o xiaohongshu-publisher-darwin-arm64 .

# macOS Intel
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o xiaohongshu-publisher-darwin-amd64 .

# Windows
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o xiaohongshu-publisher-windows.exe .
```

## 注意事项

### 环境要求

- Linux: 需要 GUI 环境或 Xvfb
- macOS: 需要桌面环境
- Windows: 原生支持

### 依赖说明

工具会自动下载 Chromium 浏览器 (约 150MB),存放在:
- Linux: `~/.cache/rod/browser/`
- macOS: `~/Library/Caches/rod/browser/`
- Windows: `%APPDATA%\rod\browser\`

### Cookie 安全

Cookie 存储位置:
- `~/.cache/xiaohongshu-mcp/cookies/cookies.json`

建议:
- 不要共享 Cookie 文件
- 定期清理过期 Cookie
- 使用环境隔离

## 故障排查

### 问题 1: 浏览器启动失败

**原因**: 缺少图形库依赖

**解决**:
```bash
# Ubuntu/Debian
apt-get install -y libglib2.0-0 libnss3 libnspr4 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxtst6 libxrandr1 libxss1 libxt6 libatspi2.0-0 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 libgbm1

# CentOS/RHEL
yum install -y alsa-lib atk cups-libs gtk3 libXcomposite libXcursor libXdamage libXext libXi libXfixes libXrandr libXScrnSaver libXtst pango xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-fonts-misc
```

### 问题 2: Cookie 无效

**解决**: 重新运行登录工具

```bash
./xiaohongshu-login-linux-amd64
```

### 问题 3: 发布失败

**检查项**:
1. 登录状态: `./xiaohongshu-publisher -check`
2. 图片/视频文件存在
3. 标题不超过 20 字
4. 正文不超过 1000 字
5. 网络连接正常

## 后续优化方向

1. **批量发布**: 支持配置文件批量导入
2. **定时任务**: 内置定时发布功能
3. **模板系统**: 支持内容模板
4. **数据分析**: 发布数据统计
5. **多账号**: 支持账号切换

## 项目统计

- 代码行数: ~200 行 (main.go)
- 依赖数量: 1 个 (xiaohongshu-mcp)
- 编译产物: 1 个二进制文件
- 文档数量: 5 个 Markdown 文件
- 开发时间: ~1 小时

## 总结

本项目成功复用了 xiaohongshu-mcp 的核心功能,通过简洁的 CLI 界面提供高效的小红书内容发布能力。通过两种部署方式 (CLI + Docker),满足不同使用场景的需求。

**核心优势**:
- ✅ 零核心代码重写
- ✅ 100% 复用成熟代码
- ✅ 开箱即用
- ✅ 文档完善

**适用场景**:
- 批量发布脚本
- 自动化内容发布
- 简单发布需求
- 命令行用户
