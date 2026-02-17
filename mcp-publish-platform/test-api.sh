#!/bin/bash

# MCP 发布平台 API 测试脚本

set -e

BASE_URL="http://localhost:18060"

echo "======================================"
echo "  MCP 发布平台 API 测试"
echo "======================================"
echo ""

# 测试健康检查
echo "[1] 测试健康检查端点..."
if curl -s "$BASE_URL/api/health" | jq .; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
fi

echo ""

# 测试登录状态
echo "[2] 测试登录状态检查..."
if curl -s "$BASE_URL/api/xiaohongshu/check_login" | jq .; then
    echo "✅ 登录状态检查通过"
else
    echo "⚠️  可能需要先登录"
fi

echo ""

# 测试登录
echo "[3] 测试登录功能..."
echo "提示：登录会显示二维码，需要扫码登录"
read -p "是否测试登录？(y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    curl -X POST "$BASE_URL/api/xiaohongshu/login" | jq .
fi

echo ""
echo "======================================"
echo "  测试完成"
echo "======================================"
