# 小红书发布工具 - Docker 部署

## 快速开始

### 1. 拉取镜像

```bash
docker pull xpzouying/xiaohongshu-mcp
```

### 2. 启动服务

```bash
mkdir -p ~/xiaohongshu-data/{cookies,images}

docker run -d \
  --name xiaohongshu-publisher \
  -v ~/xiaohongshu-data/cookies:/app/cookies \
  -v ~/xiaohongshu-data/images:/app/images \
  -p 18060:18060 \
  xpzouying/xiaohongshu-mcp
```

### 3. MCP 集成

服务端点: `http://localhost:18060/mcp`

使用 MCP Inspector 测试:
```bash
npx @modelcontextprotocol/inspector
```

配置服务器 URL: `http://localhost:18060/mcp`

## Cherry Studio 配置

添加 MCP 服务器:
- 名称: `xiaohongshu-mcp`
- URL: `http://localhost:18060/mcp`
- 类型: `http`

## Docker Compose

```yaml
version: '3.8'
services:
  xiaohongshu-publisher:
    image: xpzouying/xiaohongshu-mcp
    container_name: xiaohongshu-publisher
    ports:
      - "18060:18060"
    volumes:
      - ./data/cookies:/app/cookies
      - ./data/images:/app/images
    restart: unless-stopped
```

## 常见问题

### 登录
```bash
docker exec -it xiaohongshu-publisher /xiaohongshu-login
```

### 检查登录状态
```bash
curl http://localhost:18060/api/login/status
```

### 发布内容
```bash
curl -X POST http://localhost:18060/api/publish \
  -H "Content-Type: application/json" \
  -d '{"title":"测试","content":"内容","images":["/app/images/test.jpg"]}'
```
