# MCP 发布平台部署指南

## 📋 环境要求

### 必需软件

| 软件 | 版本要求 | 用途 |
|------|---------|------|
| Go | ≥ 1.24 | 编译和运行 |
| Chrome/Chromium | 最新版 | 浏览器自动化 |
| Git | 最新版 | 代码管理 |

### 可选软件

| 软件 | 用途 |
|------|------|
| Docker | 容器化部署 |
| jq | JSON 格式化 |
| curl | API 测试 |

---

## 🚀 快速开始

### macOS

```bash
# 1. 安装 Go
brew install go

# 2. 安装 Chrome（如果未安装）
brew install --cask google-chrome

# 3. 配置环境变量
echo 'export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"' >> ~/.zshrc
source ~/.zshrc

# 4. 克隆项目（如果还没有）
git clone <repository-url>
cd mcp-publish-platform

# 5. 运行部署脚本
chmod +x deploy.sh
./deploy.sh

# 6. 启动服务
./bin/mcp-server -port :18060
```

### Linux (Ubuntu/Debian)

```bash
# 1. 安装 Go
wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz

echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 2. 安装 Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser

# 3. 配置环境变量
echo 'export ROD_BROWSER_BIN=/usr/bin/chromium-browser' >> ~/.bashrc
source ~/.bashrc

# 4. 克隆项目
git clone <repository-url>
cd mcp-publish-platform

# 5. 运行部署脚本
chmod +x deploy.sh
./deploy.sh

# 6. 启动服务
./bin/mcp-server -port :18060
```

### Windows

```powershell
# 1. 下载并安装 Go
# 访问 https://go.dev/dl/ 下载安装包

# 2. 下载并安装 Chrome
# 访问 https://www.google.com/chrome/

# 3. 设置环境变量（PowerShell）
$env:ROD_BROWSER_BIN = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# 4. 克隆项目
git clone <repository-url>
cd mcp-publish-platform

# 5. 编译项目
go build -o bin\mcp-server.exe .

# 6. 启动服务
.\bin\mcp-server.exe -port :18060
```

---

## 🐳 Docker 部署

### 构建镜像

```bash
# 构建镜像
docker build -t mcp-publish-platform:latest .

# 运行容器
docker run -d \
  --name mcp-server \
  -p 18060:18060 \
  -v $(pwd)/cookies:/app/cookies \
  mcp-publish-platform:latest
```

### Docker Compose

```bash
# 使用 docker-compose 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 📝 配置说明

### 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| ROD_BROWSER_BIN | 否 | 自动检测 | 浏览器可执行文件路径 |
| PORT | 否 | 18060 | 服务端口 |
| HEADLESS | 否 | true | 无头模式 |

### 配置文件

项目支持以下配置文件（可选）：

- `configs/config.yaml` - 主配置文件
- `configs/xiaohongshu.yaml` - 小红书平台配置
- `configs/douyin.yaml` - 抖音平台配置
- `configs/toutiao.yaml` - 今日头条平台配置

---

## ✅ 验证部署

### 1. 检查服务状态

```bash
# 健康检查
curl http://localhost:18060/api/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2026-02-17T10:00:00Z"
}
```

### 2. 测试登录功能

```bash
# 检查登录状态
curl http://localhost:18060/api/xiaohongshu/check_login

# 发起登录请求
curl -X POST http://localhost:18060/api/xiaohongshu/login
```

### 3. 使用 MCP 客户端

#### Cherry Studio

1. 打开 Cherry Studio
2. 添加 MCP 服务器
3. 服务器地址: `ws://localhost:18060/mcp`
4. 连接并测试工具

#### AnythingLLM

1. 打开 AnythingLLM
2. 配置 MCP 端点: `http://localhost:18060/mcp`
3. 重启 AnythingLLM
4. 在对话中测试工具调用

---

## 🔧 故障排查

### 问题 1: Go 版本过低

**错误信息**: `go: unsupported version`

**解决方案**: 升级 Go 到 1.24 或更高版本

```bash
# 检查当前版本
go version

# 升级 Go
# macOS
brew upgrade go

# Linux
wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz --overwrite
```

### 问题 2: 浏览器未找到

**错误信息**: `browser binary not found`

**解决方案**: 设置 ROD_BROWSER_BIN 环境变量

```bash
# macOS
export ROD_BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Linux
export ROD_BROWSER_BIN=/usr/bin/chromium-browser

# Windows (PowerShell)
$env:ROD_BROWSER_BIN = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### 问题 3: 端口被占用

**错误信息**: `bind: address already in use`

**解决方案**: 更换端口或关闭占用端口的进程

```bash
# 查找占用端口的进程
lsof -i :18060

# 关闭进程
kill -9 <PID>

# 或使用其他端口
./bin/mcp-server -port :18061
```

### 问题 4: 依赖下载失败

**错误信息**: `go: download failed`

**解决方案**: 使用国内镜像或配置代理

```bash
# 设置 Go 代理（中国大陆）
go env -w GOPROXY=https://goproxy.cn,direct

# 重新下载依赖
go mod download
```

---

## 📊 性能优化

### 1. 启用无头模式

```bash
# 默认启用无头模式（推荐）
./bin/mcp-server -headless=true
```

### 2. 调整超时时间

```bash
# 设置浏览器操作超时时间（秒）
export BROWSER_TIMEOUT=60
./bin/mcp-server
```

### 3. 资源限制

```bash
# 限制内存使用（Docker）
docker run -d \
  --memory="512m" \
  --cpus="1.0" \
  -p 18060:18060 \
  mcp-publish-platform:latest
```

---

## 🔐 安全建议

### 1. Cookie 存储

- Cookie 文件存储在 `cookies/` 目录
- 建议定期备份
- 不要提交到 Git（已在 .gitignore 中）

### 2. 访问控制

```bash
# 仅允许本地访问
./bin/mcp-server -host 127.0.0.1

# 使用防火墙限制访问
iptables -A INPUT -p tcp --dport 18060 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 18060 -j DROP
```

### 3. HTTPS 配置

```bash
# 使用反向代理（Nginx）
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:18060;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📚 相关文档

- [项目说明](./README_PLATFORM.md)
- [开发指南](./docs/development-guide.md)
- [API 文档](./docs/api-documentation.md)
- [故障排查](./docs/troubleshooting.md)

---

## 🆘 获取帮助

如果遇到问题，请尝试以下方式：

1. 查看本文档的故障排查部分
2. 查看项目 Issues: https://github.com/yourname/mcp-publish-platform/issues
3. 提交新的 Issue 并附上详细的错误信息

---

**最后更新**: 2026-02-17
