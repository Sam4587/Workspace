# AI内容创作系统运维手册

## 系统架构

### 整体架构
```
用户浏览器 → Nginx反向代理 → 前端应用 → 后端API → 数据库/Redis
                                    ↓
                            AI服务/热点抓取
```

### 组件说明

| 组件 | 端口 | 说明 |
|------|------|------|
| 前端应用 | 3000 | React应用，用户界面 |
| 后端API | 5000 | Express应用，业务逻辑 |
| MongoDB | 27017 | 主数据库，存储业务数据 |
| Redis | 6379 | 缓存和限流 |
| Nginx | 80/443 | 反向代理和负载均衡 |

## 日常运维

### 1. 系统监控

#### 1.1 服务状态检查

```bash
# 检查Docker容器状态
docker-compose ps

# 检查特定服务
docker-compose ps backend
docker-compose ps frontend
docker-compose ps mongodb
docker-compose ps redis

# 检查服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 1.2 健康检查

```bash
# 检查后端API健康状态
curl http://localhost:5000/api/health

# 检查前端应用
curl http://localhost:3000

# 检查数据库连接
docker exec ai-content-mongodb mongo --eval "db.stats()"

# 检查Redis连接
docker exec ai-content-redis redis-cli ping
```

#### 1.3 性能指标监控

```bash
# 查看系统资源使用
docker stats

# 查看容器资源限制
docker inspect ai-content-backend | grep -i memory
docker inspect ai-content-backend | grep -i cpu

# 查看磁盘使用
df -h
docker system df
```

### 2. 日志管理

#### 2.1 日志位置

```bash
# 后端日志
./logs/combined.log
./logs/error.log
./logs/access.log

# 前端日志
# 前端日志在浏览器控制台查看

# Docker容器日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 2.2 日志分析

```bash
# 查看错误日志
tail -f ./logs/error.log

# 统计错误数量
grep -c "ERROR" ./logs/error.log

# 查看最近的API请求
tail -f ./logs/access.log

# 分析慢查询
grep "duration" ./logs/access.log | sort -k6 -nr | head -10
```

#### 2.3 日志轮转

```bash
# 手动轮转日志
./scripts/rotate-logs.sh

# 查看日志轮转配置
cat /etc/logrotate.d/ai-content-system
```

### 3. 数据备份

#### 3.1 数据库备份

```bash
# MongoDB备份脚本
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 执行备份
docker exec ai-content-mongodb mongodump \
  --uri="mongodb://admin:admin123@localhost:27017/ai-content-system" \
  --out="$BACKUP_DIR/backup_$DATE"

# 压缩备份
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C $BACKUP_DIR backup_$DATE
rm -rf "$BACKUP_DIR/backup_$DATE"

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "MongoDB备份完成: $BACKUP_DIR/backup_$DATE.tar.gz"
```

#### 3.2 Redis备份

```bash
# Redis备份脚本
#!/bin/bash
BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 执行备份
docker exec ai-content-redis redis-cli SAVE
docker cp ai-content-redis:/data/dump.rdb "$BACKUP_DIR/dump_$DATE.rdb"

# 删除7天前的备份
find $BACKUP_DIR -name "dump_*.rdb" -mtime +7 -delete

echo "Redis备份完成: $BACKUP_DIR/dump_$DATE.rdb"
```

#### 3.3 配置文件备份

```bash
# 配置文件备份
#!/bin/bash
BACKUP_DIR="/backup/config"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份配置文件
cp .env "$BACKUP_DIR/.env_$DATE"
cp docker-compose.yml "$BACKUP_DIR/docker-compose.yml_$DATE"
cp -r nginx "$BACKUP_DIR/nginx_$DATE"

# 压缩备份
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" -C $BACKUP_DIR .env_$DATE docker-compose.yml_$DATE nginx_$DATE
rm -rf "$BACKUP_DIR/.env_$DATE" "$BACKUP_DIR/docker-compose.yml_$DATE" "$BACKUP_DIR/nginx_$DATE"

echo "配置文件备份完成: $BACKUP_DIR/config_$DATE.tar.gz"
```

### 4. 性能优化

#### 4.1 数据库优化

```bash
# MongoDB性能优化
docker exec ai-content-mongodb mongo ai-content-system --eval "
// 创建索引
db.hotTopics.createIndex({ heat: -1 })
db.hotTopics.createIndex({ category: 1, heat: -1 })
db.hotTopics.createIndex({ publishedAt: -1 })
db.contents.createIndex({ createdAt: -1 })
db.contents.createIndex({ status: 1 })
db.publishRecords.createIndex({ publishTime: -1 })

// 查看索引
db.hotTopics.getIndexes()
db.contents.getIndexes()
db.publishRecords.getIndexes()

// 分析慢查询
db.setProfilingLevel(1, { slowms: 100 })
"

# 查看数据库统计
docker exec ai-content-mongodb mongo ai-content-system --eval "
db.stats()
db.hotTopics.stats()
db.contents.stats()
db.publishRecords.stats()
"
```

#### 4.2 Redis优化

```bash
# Redis配置优化
docker exec ai-content-redis redis-cli CONFIG SET maxmemory 512mb
docker exec ai-content-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 查看Redis信息
docker exec ai-content-redis redis-cli INFO

# 查看内存使用
docker exec ai-content-redis redis-cli INFO MEMORY

# 清理过期键
docker exec ai-content-redis redis-cli MEMORY PURGE
```

#### 4.3 应用优化

```javascript
// 后端性能优化配置
// server/index.js
app.use(compression()); // 启用压缩
app.use(helmet()); // 安全头

// 数据库连接池优化
mongoose.connect(process.env.MONGODB_URI, {
  poolSize: 10, // 连接池大小
  socketTimeoutMS: 45000, // 超时时间
  connectTimeoutMS: 30000,
});
```

## 故障排查

### 1. 常见故障及解决方案

#### 1.1 服务启动失败

**症状**：Docker容器无法启动

**排查步骤**：
```bash
# 检查端口冲突
lsof -i :3000
lsof -i :5000
lsof -i :27017
lsof -i :6379

# 检查Docker日志
docker-compose logs backend
docker-compose logs frontend

# 检查环境变量
cat .env
echo $MONGODB_URI

# 检查磁盘空间
df -h

# 重启服务
docker-compose down
docker-compose up -d
```

#### 1.2 数据库连接失败

**症状**：应用无法连接数据库

**排查步骤**：
```bash
# 检查MongoDB服务状态
docker-compose ps mongodb

# 测试数据库连接
docker exec ai-content-mongodb mongo --eval "db.stats()"

# 检查连接字符串
echo $MONGODB_URI

# 检查防火墙设置
sudo ufw status

# 重启MongoDB
docker-compose restart mongodb
```

#### 1.3 AI服务不可用

**症状**：内容生成失败

**排查步骤**：
```bash
# 检查API密钥
echo $OPENAI_API_KEY
echo $BAIDU_API_KEY
echo $XUNFEI_API_KEY

# 测试API连接
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# 检查AI服务日志
docker-compose logs backend | grep -i "ai\|openai\|baidu\|xunfei"

# 切换到备用模型
# 修改 .env 文件中的 DEFAULT_AI_MODEL
```

#### 1.4 热点抓取失败

**症状**：热点数据无法更新

**排查步骤**：
```bash
# 检查网络连接
ping weibo.com
ping toutiao.com

# 检查代理设置
# 如果使用代理，检查代理配置

# 查看抓取日志
docker-compose logs backend | grep -i "hot\|topic\|scrape"

# 手动触发抓取
curl -X POST http://localhost:5000/api/hot-topics/update

# 检查限流设置
docker exec ai-content-redis redis-cli KEYS "*limit*"
```

#### 1.5 发布失败

**症状**：内容无法发布到平台

**排查步骤**：
```bash
# 检查平台API密钥
echo $TOUTIAO_ACCESS_TOKEN

# 检查发布日志
docker-compose logs backend | grep -i "publish\|toutiao"

# 测试平台连接
# 根据平台API文档测试连接

# 检查内容格式
# 确保内容符合平台要求

# 查看发布队列
curl http://localhost:5000/api/publish/queue
```

### 2. 性能问题排查

#### 2.1 响应缓慢

**排查步骤**：
```bash
# 检查系统负载
top
htop

# 检查Docker容器资源使用
docker stats

# 分析慢查询
docker exec ai-content-mongodb mongo ai-content-system --eval "
db.system.profile.find().sort({ millis: -1 }).limit(10)
"

# 检查Redis性能
docker exec ai-content-redis redis-cli SLOWLOG GET 10

# 检查网络延迟
ping localhost
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health
```

#### 2.2 内存泄漏

**排查步骤**：
```bash
# 检查Node.js内存使用
docker exec ai-content-backend node -e "console.log(process.memoryUsage())"

# 生成内存快照
docker exec ai-content-backend node -e "
const heapdump = require('heapdump');
heapdump.writeSnapshot('/tmp/heapdump-' + Date.now() + '.heapsnapshot');
"

# 分析内存快照
# 下载快照文件并使用Chrome DevTools分析

# 检查内存泄漏
docker exec ai-content-backend node -e "
setInterval(() => {
  console.log(process.memoryUsage());
}, 5000);
"
```

### 3. 安全事件处理

#### 3.1 异常访问

**排查步骤**：
```bash
# 检查访问日志
tail -f ./logs/access.log

# 分析异常IP
grep -c "ERROR" ./logs/access.log | sort -nr

# 检查登录日志
grep "login" ./logs/access.log

# 封禁异常IP
sudo ufw deny from <IP_ADDRESS>

# 检查系统用户
docker exec ai-content-backend cat /etc/passwd
```

#### 3.2 数据泄露

**处理步骤**：
```bash
# 立即更改所有密码
# 更新 .env 文件中的敏感信息

# 检查数据库访问
docker exec ai-content-mongodb mongo ai-content-system --eval "
db.getUsers()
db.getRoles()
"

# 检查文件权限
ls -la .env
chmod 600 .env

# 启用审计日志
docker exec ai-content-mongodb mongo ai-content-system --eval "
db.setProfilingLevel(2)
"
```

## 系统升级

### 1. 代码更新

```bash
# 拉取最新代码
git pull origin main

# 构建新镜像
docker-compose build

# 重启服务
docker-compose down
docker-compose up -d

# 验证更新
curl http://localhost:5000/api/health
```

### 2. 数据库迁移

```bash
# 备份数据库
./scripts/backup-mongodb.sh

# 执行迁移脚本
docker exec ai-content-mongodb mongo ai-content-system --eval "
// 执行数据库迁移
db.version.insertOne({
  version: '2.0.0',
  date: new Date(),
  description: '系统升级'
})
"

# 验证迁移
docker exec ai-content-mongodb mongo ai-content-system --eval "
db.version.find().sort({ date: -1 }).limit(1)
"
```

### 3. 配置更新

```bash
# 备份当前配置
cp .env .env.backup

# 更新配置文件
vim .env

# 重启服务
docker-compose restart backend

# 验证配置
docker-compose logs backend | tail -20
```

## 灾难恢复

### 1. 数据恢复

```bash
# MongoDB恢复
docker exec -i ai-content-mongodb mongorestore \
  --uri="mongodb://admin:admin123@localhost:27017/ai-content-system" \
  --drop \
  < backup_file.tar.gz

# Redis恢复
docker cp backup_file.rdb ai-content-redis:/data/dump.rdb
docker-compose restart redis
```

### 2. 系统恢复

```bash
# 恢复配置文件
cp backup/.env .env
cp backup/docker-compose.yml docker-compose.yml

# 重建系统
docker-compose down
docker-compose up -d

# 验证恢复
curl http://localhost:5000/api/health
```

## 监控告警

### 1. 监控指标

```bash
# 系统监控脚本
#!/bin/bash
# monitor.sh

# 检查服务状态
check_service() {
  if ! docker-compose ps $1 | grep -q "Up"; then
    echo "ERROR: $1 service is down"
    send_alert "$1 service is down"
  fi
}

# 检查磁盘空间
check_disk() {
  usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
  if [ $usage -gt 80 ]; then
    echo "WARNING: Disk usage is $usage%"
    send_alert "Disk usage is $usage%"
  fi
}

# 检查内存使用
check_memory() {
  usage=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
  if (( $(echo "$usage > 80" | bc -l) )); then
    echo "WARNING: Memory usage is $usage%"
    send_alert "Memory usage is $usage%"
  fi
}

# 发送告警
send_alert() {
  message=$1
  # 发送邮件、短信或其他告警方式
  echo "$(date): $message" >> /var/log/ai-content-alerts.log
}

# 执行检查
check_service backend
check_service frontend
check_service mongodb
check_service redis
check_disk
check_memory
```

### 2. 告警配置

```bash
# 设置定时任务
crontab -e

# 添加监控任务
*/5 * * * * /path/to/monitor.sh
0 2 * * * /path/to/backup-mongodb.sh
0 3 * * * /path/to/backup-redis.sh
```

## 维护计划

### 1. 日常维护

- **每小时**：检查服务状态
- **每天**：查看日志，清理临时文件
- **每周**：执行数据库优化，检查性能指标
- **每月**：完整备份，系统安全检查

### 2. 维护脚本

```bash
# 日常维护脚本
#!/bin/bash
# daily-maintenance.sh

echo "开始日常维护 $(date)"

# 清理Docker
docker system prune -f

# 清理日志
find ./logs -name "*.log" -mtime +30 -delete

# 优化数据库
docker exec ai-content-mongodb mongo ai-content-system --eval "
db.runCommand({ compact: 'hotTopics' })
db.runCommand({ compact: 'contents' })
db.runCommand({ compact: 'publishRecords' })
"

# 清理Redis
docker exec ai-content-redis redis-cli FLUSHALL

# 检查磁盘空间
df -h

echo "日常维护完成 $(date)"
```

## 联系信息

### 紧急联系

- **系统管理员**：admin@example.com
- **技术支持**：support@example.com
- **紧急电话**：400-123-4567

### 文档更新

- **最后更新**：2024-02-14
- **版本**：v2.0.0
- **维护团队**：AI内容系统运维团队
