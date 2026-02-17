# 🚀 快速启动指南

## 📋 项目标准端口

| 服务 | 端口 | 访问地址 |
|------|------|----------|
| 前端开发 | 5174 | http://localhost:5174 |
| 后端API | 5001 | http://localhost:5001 |
| 前端生产 | 3000 | http://localhost:3000 |

---

## 方案1：本地开发启动（推荐）

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑 server/.env，填入必要的配置
# 主要是 MONGODB_URI 和 AI API Keys
```

### 3. 启动开发服务器

```bash
# 方式A：使用自动开发服务器（同时启动前后端）
npm run dev:all

# 方式B：分别启动
# 终端1：启动后端
cd server && npm run dev

# 终端2：启动前端
npm run dev
```

### 4. 验证服务

```bash
# 检查后端
curl http://localhost:5001/api/health

# 检查前端（浏览器访问）
# http://localhost:5174
```

---

## 方案2：使用Docker部署

```bash
# 构建并启动
docker-compose up -d

# 访问服务
# 前端: http://localhost:3000
# 后端: http://localhost:5001
```

---

## 方案3：生产构建

```bash
# 构建前端
npm run build

# 预览生产构建
npm run preview
```

---

## 🔧 常见问题

### 1. 端口被占用

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :5001
netstat -ano | findstr :5174

# 终止进程
taskkill /PID <进程ID> /F
```

### 2. 依赖安装失败

```bash
# 清除缓存重试
rm -rf node_modules package-lock.json
npm install
```

### 3. 环境变量配置

参考 `server/.env.example` 文件，创建自己的 `.env` 文件。

---

## 📚 相关文档

- [标准端口配置](docs/STANDARD_PORT_CONFIGURATION.md)
- [环境变量标准](docs/ENVIRONMENT_VARIABLES_STANDARD.md)
- [开发工作流](docs/02-development/workflow.md)
