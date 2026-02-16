# 标准化端口配置规范

## 📅 文档版本
**版本**: 1.0  
**最后更新**: 2026年2月16日  
**作者**: AI开发团队

## 🎯 标准化目标
统一项目端口配置，避免端口冲突，提高开发和部署的一致性。

## 📋 标准端口分配

### 开发环境标准端口

| 服务类型 | 标准端口 | 用途 | 访问地址 |
|---------|---------|------|----------|
| 前端开发服务器 | 5174 | React + Vite 开发环境 | http://localhost:5174 |
| 后端API服务 | 5001 | Express REST API 服务 | http://localhost:5001 |
| 数据库(MongoDB) | 27017 | MongoDB 数据库 | mongodb://localhost:27017 |
| 缓存服务(Redis) | 6379 | Redis 缓存服务 | redis://localhost:6379 |
| 生产前端服务 | 3000 | 生产环境前端服务 | http://localhost:3000 |

### 生产环境标准端口

| 服务类型 | 标准端口 | 用途 | 访问地址 |
|---------|---------|------|----------|
| 后端API服务 | 5001 | 生产环境API服务 | http://your-domain.com:5001 |
| 前端Web服务 | 80/443 | 用户访问入口 | https://your-domain.com |
| 管理后台 | 3000 | 管理界面 | http://admin.your-domain.com:3000 |

## 🔧 配置文件标准化清单

### 必须更新的配置文件

#### 1. 环境变量文件
**文件**: `server/.env`
```bash
# 服务端口配置
PORT=5001
CORS_ORIGIN=http://localhost:5174
```

#### 2. Vite配置文件
**文件**: `vite.config.js`
```javascript
export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',  // 标准后端端口
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

#### 3. 后端服务配置
**文件**: `server/server.js`
```javascript
const PORT = process.env.PORT || 5001;  // 标准端口
```

#### 4. Docker配置
**文件**: `docker-compose.yml`
```yaml
services:
  backend:
    ports:
      - "5001:5001"  # 映射到标准端口
```

#### 5. PM2部署配置
**文件**: `server/ecosystem.config.js`
```javascript
env: {
  PORT: 5001  // 标准端口
}
```

#### 6. 开发脚本
**文件**: `scripts/dev-server.js`
```javascript
const backendPortFree = await checkPort(5001);
const frontendPortFree = await checkPort(5174);
```

## 🚀 实施步骤

### 1. 环境准备
```bash
# 检查端口占用情况
netstat -ano | findstr :5001
netstat -ano | findstr :5174

# 如有占用，终止相关进程
taskkill /PID <进程ID> /F
```

### 2. 配置更新
```bash
# 更新环境变量
echo "PORT=5001" >> server/.env

# 更新Vite配置
# 编辑 vite.config.js 确保代理指向5001端口

# 更新Docker配置
# 编辑 docker-compose.yml 确保端口映射正确
```

### 3. 服务重启
```bash
# 重启后端服务
cd server && npm run dev

# 重启前端服务
npm run dev

# 验证服务状态
curl http://localhost:5001/api/health
curl http://localhost:5174/api/health
```

## ✅ 验证清单

### 功能验证
- [ ] 前端服务正常启动在5174端口
- [ ] 后端服务正常启动在5001端口
- [ ] API代理正常工作
- [ ] 热点数据可以正常获取
- [ ] JWT认证功能正常
- [ ] 所有API端点响应正常

### 配置验证
- [ ] `.env`文件中PORT=5001
- [ ] `vite.config.js`中proxy.target指向5001
- [ ] `server/server.js`中默认端口为5001
- [ ] `docker-compose.yml`中端口映射为5001:5001
- [ ] 所有开发脚本使用标准端口

## ⚠️ 注意事项

### 迁移注意事项
1. **备份现有配置**: 迁移前备份所有配置文件
2. **逐步迁移**: 建议分阶段实施，先开发环境后生产环境
3. **通知相关人员**: 及时通知团队成员端口变更
4. **更新文档**: 同步更新所有相关文档

### 故障排除
1. **端口占用**: 使用`netstat`检查端口占用情况
2. **代理失效**: 确认Vite配置中的代理目标地址正确
3. **服务无法启动**: 检查环境变量和依赖配置
4. **API调用失败**: 验证CORS配置和跨域设置

## 📚 相关文档

- [端口配置更新日志](PORT_CONFIGURATION_UPDATE.md)
- [服务状态更新](SERVICE_STATUS_UPDATE.md)
- [开发工作流指南](dev/DEV_WORKFLOW.md)
- [快速开始指南](dev/QUICK_START.md)

---
**维护者**: AI开发团队  
**联系方式**: dev-team@example.com