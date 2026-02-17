#!/bin/bash

# MCP 发布平台部署脚本
# 用于快速部署和启动服务

set -e

echo "======================================"
echo "  MCP 发布平台部署脚本"
echo "======================================"
echo ""

# 检查 Go 环境
echo "[1/6] 检查 Go 环境..."
if ! command -v go &> /dev/null; then
    echo "❌ Go 未安装"
    echo ""
    echo "请安装 Go 1.24+ 或更高版本:"
    echo "  macOS: brew install go"
    echo "  Linux: wget https://go.dev/dl/go1.24.0.linux-amd64.tar.gz"
    echo "  Windows: 访问 https://go.dev/dl/"
    exit 1
fi

GO_VERSION=$(go version | awk '{print $3}')
echo "✅ Go 版本: $GO_VERSION"

# 检查浏览器
echo ""
echo "[2/6] 检查浏览器环境..."
if [ -z "$ROD_BROWSER_BIN" ]; then
    echo "⚠️  ROD_BROWSER_BIN 环境变量未设置"
    echo ""
    echo "请设置浏览器路径:"
    echo "  macOS: export ROD_BROWSER_BIN=/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome"
    echo "  Linux: export ROD_BROWSER_BIN=/usr/bin/chromium-browser"
    echo "  Windows: set ROD_BROWSER_BIN=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    echo ""
    echo "或使用默认浏览器（可能会自动检测）"
else
    echo "✅ 浏览器路径: $ROD_BROWSER_BIN"
fi

# 进入项目目录
echo ""
echo "[3/6] 进入项目目录..."
cd "$(dirname "$0")"
echo "✅ 当前目录: $(pwd)"

# 下载依赖
echo ""
echo "[4/6] 下载 Go 依赖..."
if [ -f "go.mod" ]; then
    go mod download
    echo "✅ 依赖下载完成"
else
    echo "❌ go.mod 文件不存在"
    exit 1
fi

# 编译项目
echo ""
echo "[5/6] 编译项目..."
mkdir -p bin
if go build -o bin/mcp-server .; then
    echo "✅ 编译成功"
    echo "   可执行文件: bin/mcp-server"
else
    echo "❌ 编译失败"
    exit 1
fi

# 启动服务
echo ""
echo "[6/6] 启动服务..."
echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "启动服务:"
echo "  ./bin/mcp-server -port :18060"
echo ""
echo "测试 API:"
echo "  curl http://localhost:18060/api/health"
echo ""
echo "查看帮助:"
echo "  ./bin/mcp-server -h"
echo ""
