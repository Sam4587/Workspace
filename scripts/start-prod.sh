#!/bin/bash

# 生产环境启动脚本

echo "=== AI内容创作系统生产环境启动 ==="

# 检查环境变量
if [ ! -f .env ]; then
    echo "错误: .env文件不存在"
    exit 1
fi

# 检查Docker服务
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker服务未运行"
    exit 1
fi

# 检查端口占用
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "警告: 端口5001已被占用"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 创建必要的目录
mkdir -p logs
mkdir -p data/mongodb
mkdir -p data/redis

# 启动Docker容器
echo "启动Docker容器..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 查看日志
echo "查看启动日志..."
docker-compose -f docker-compose.prod.yml logs --tail=50

echo "=== 系统启动完成 ==="
echo "前端地址: http://localhost:3000"
echo "后端API: http://localhost:5001"
echo "MongoDB: mongodb://localhost:27017"
echo "Redis: redis://localhost:6379"

# 显示系统信息
echo ""
echo "=== 系统信息 ==="
echo "Node.js版本: $(node --version)"
echo "NPM版本: $(npm --version)"
echo "Docker版本: $(docker --version)"
echo "系统时间: $(date)"

exit 0
