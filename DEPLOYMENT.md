# AI内容创作系统部署文档

## 环境要求

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- Docker 20.10+
- Docker Compose 2.0+

## 快速部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-content-system
```

### 2. 配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env
cp server/.env.example server/.env
```

编辑 `.env` 文件，配置必要的参数：

```env
# OpenAI配置
OPENAI_API_KEY=your-openai-api-key

# 百度AI配置
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key

# 讯飞AI配置
XUNFEI_API_KEY=your-xunfei-api-key
XUNFEI_APP_ID=your-xunfei-app-id

# JWT配置
JWT_SECRET=your-jwt-secret

# 今日头条配置
TOUTIAO_ACCESS_TOKEN=your-toutiao-access-token
```

### 3. 使用Docker部署（推荐）

#### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 生产环境

```bash
# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. 手动部署

#### 后端部署

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 启动服务
npm run start:prod
```

#### 前端部署

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 启动服务
npm run preview
```

## 服务端口

- 前端应用: http://localhost:3000
- 后端API: http://localhost:5000
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

## 配置说明

### 数据库配置

系统使用MongoDB存储数据，支持以下配置：

```env
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
```

### Redis配置

Redis用于缓存和限流，支持以下配置：

```env
REDIS_URL=redis://:password@host:port
```

### AI服务配置

系统支持多种AI模型，需要配置相应的API密钥：

- OpenAI: 配置 `OPENAI_API_KEY`
- 百度AI: 配置 `BAIDU_API_KEY` 和 `BAIDU_SECRET_KEY`
- 讯飞AI: 配置 `XUNFEI_API_KEY` 和 `XUNFEI_APP_ID`

### 今日头条配置

配置今日头条API访问：

```env
TOUTIAO_ACCESS_TOKEN=your-access-token
```

## 监控和维护

### 健康检查

访问以下端点检查服务状态：

- 后端健康检查: http://localhost:5000/api/health
- 前端健康检查: http://localhost:3000/health

### 日志查看

```bash
# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend

# 查看MongoDB日志
docker-compose logs -f mongodb

# 查看Redis日志
docker-compose logs -f redis
```

### 数据备份

#### MongoDB备份

```bash
# 进入MongoDB容器
docker exec -it ai-content-mongodb mongodump --out /backup

# 复制备份文件到本地
docker cp ai-content-mongodb:/backup ./backup
```

#### Redis备份

Redis数据会自动保存到挂载的卷中，位于 `./data/redis` 目录。

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :5000
   
   # 修改端口配置
   # 编辑 docker-compose.yml 或 .env 文件
   ```

2. **数据库连接失败**
   ```bash
   # 检查MongoDB状态
   docker-compose ps mongodb
   
   # 检查连接字符串
   echo $MONGODB_URI
   ```

3. **AI服务不可用**
   ```bash
   # 检查API密钥配置
   echo $OPENAI_API_KEY
   
   # 测试API连接
   curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
   ```

### 性能优化

1. **调整Docker资源限制**
   ```yaml
   # docker-compose.prod.yml
   deploy:
     resources:
       limits:
         cpus: '2.0'
         memory: 2G
       reservations:
         cpus: '0.5'
         memory: 512M
   ```

2. **启用Redis缓存**
   ```env
   REDIS_URL=redis://:password@redis:6379
   ```

3. **配置负载均衡**
   ```yaml
   # docker-compose.prod.yml
   deploy:
     replicas: 2
     update_config:
       parallelism: 1
       delay: 10s
   ```

## 安全配置

### SSL证书

1. 将SSL证书放入 `nginx/ssl/` 目录
2. 确保证书文件权限正确
3. 重启Nginx服务

### 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
```

### 访问控制

配置Nginx访问限制：

```nginx
# nginx/nginx.conf
location /api/admin {
    allow 192.168.1.0/24;
    deny all;
}
```

## 更新和升级

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 重建Docker镜像
docker-compose build

# 重启服务
docker-compose up -d
```

### 数据库迁移

系统会自动处理数据库迁移，无需手动操作。

### 回滚操作

```bash
# 回滚到上一个版本
git checkout HEAD~1

# 重建并重启
docker-compose build
docker-compose up -d
```

## 联系和支持

如有问题，请联系系统管理员或查看日志文件获取详细信息。
