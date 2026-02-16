# 🚀 开发快速参考卡

## 📋 日常开发命令

### 启动服务
```bash
# 一体化开发服务器（推荐）
npm run dev

# 分别启动
npm run server    # 后端: http://localhost:5001
npm run client    # 前端: http://localhost:5174

# 生产部署
npm run start:prod
npm run stop:prod
```

### 开发工具
```bash
# 代码质量检查
npm run lint
npm run lint:fix

# 测试
npm run test
npm run test:watch

# 构建
npm run build
npm run preview
```

## 📊 监控端点

### 健康检查
```
GET http://localhost:5001/api/monitoring/health
GET http://localhost:5001/api/monitoring/system
GET http://localhost:5001/api/monitoring/metrics
GET http://localhost:5001/api/monitoring/alerts
```

### API测试
```bash
# 健康检查
curl http://localhost:5001/api/monitoring/health

# 系统信息
curl http://localhost:5001/api/monitoring/system

# 性能指标
curl http://localhost:5001/api/monitoring/metrics
```

## 📁 重要文件路径

### 配置文件
```
server/.env              # 基础环境变量
server/.env.example      # 配置模板
server/.env.development  # 开发环境配置
server/.env.production   # 生产环境配置
```

### 日志文件
```
server/logs/
├── access/     # 访问日志
├── error/      # 错误日志
├── application/ # 应用日志
├── audit/      # 审计日志
└── performance/ # 性能日志
```

### 核心代码
```
server/server.js          # 主服务入口
server/utils/configLoader.js    # 配置加载器
server/utils/enhancedLogger.js  # 增强日志
server/middleware/       # 中间件
server/routes/health.js  # 健康检查路由
server/services/alertService.js # 告警服务
```

## 🔧 环境变量关键配置

```env
# 必需配置
JWT_SECRET=your-jwt-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password

# AI配置
OPENAI_API_KEY=sk-xxx
QWEN_API_KEY=your-key

# 服务配置
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174

# 日志配置
LOG_LEVEL=debug
```

## 🐛 常见问题排查

### 端口占用
```bash
# 查找占用端口的进程
netstat -ano | findstr :5001
netstat -ano | findstr :5174

# 终止进程
taskkill /PID <进程ID> /F
```

### 服务启动失败
```bash
# 检查Node.js版本
node --version  # 需要18+

# 检查依赖安装
npm list
cd server && npm list

# 查看详细错误日志
tail -f server/logs/error/error-$(date +%Y-%m-%d).log
```

### 数据库连接问题
```bash
# 检查MongoDB服务
mongod --version
# 或检查Docker中的MongoDB
docker ps | grep mongo

# 检查Redis服务
redis-cli ping  # 应该返回 PONG
```

## 📚 标准化文档

### 技术标准
- [环境变量标准](../ENVIRONMENT_VARIABLES_STANDARD.md)
- [日志系统标准](../LOGGING_SYSTEM_STANDARD.md)
- [监控告警标准](../MONITORING_ALERT_SYSTEM.md)
- [端口配置标准](../STANDARD_PORT_CONFIGURATION.md)

### 开发规范
- [开发工作流](DEV_WORKFLOW.md)
- [AI协作指南](AI_COLLABORATION.md)
- [开发者准则](AI_DEVELOPER_GUIDELINES.md)

## 🔐 安全检查清单

- [ ] JWT密钥已配置且强度足够
- [ ] 管理员密码已修改
- [ ] CORS配置正确
- [ ] 生产环境禁用调试模式
- [ ] 敏感信息不在版本控制中
- [ ] 日志级别在生产环境中设为info/warn

## 🎯 开发最佳实践

### 代码规范
- 使用ESLint检查代码质量
- 遵循函数式编程原则
- 组件保持单一职责
- API调用统一错误处理

### 日志记录
- 使用适当的日志级别
- 记录关键业务操作
- 包含足够的上下文信息
- 避免记录敏感数据

### 监控告警
- 设置合理的阈值
- 定期检查监控指标
- 及时处理告警信息
- 持续优化监控策略

---

📌 **提示**: 此卡片适合打印或保存为书签，方便日常开发查阅。