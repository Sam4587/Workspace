# 🚀 快速启动指南

## 📋 项目标准端口

| 服务 | 端口 | 访问地址 |
|------|------|----------|
| 前端开发 | 5174 | http://localhost:5174 |
| 后端API | 5001 | http://localhost:5001 |
| 前端生产 | 3000 | http://localhost:3000 |

---

## 方案1：使用桌面启动器（推荐）

### 双击运行
```
AI-Content-Flow-Launcher.bat
```

启动器会自动：
1. 检查 Node.js 环境
2. 检查端口占用情况
3. 启动后端服务（端口 5001）
4. 启动前端服务（端口 5174）
5. 自动在浏览器中打开前端页面

### 启动器选项
```bash
# 只启动后端
AI-Content-Flow-Launcher.bat --backend-only

# 只启动前端
AI-Content-Flow-Launcher.bat --frontend-only

# 不自动打开浏览器
AI-Content-Flow-Launcher.bat --no-browser
```

---

## 方案2：手动启动

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
# 方式A：分别启动（推荐）
# 终端1：启动后端
cd server && npm run dev

# 终端2：启动前端
npm run dev

# 方式B：使用 Node 启动器
node scripts/project-launcher.cjs
```

### 4. 验证服务

```bash
# 检查后端
curl http://localhost:5001/api/health

# 检查前端（浏览器访问）
# http://localhost:5174
```

---

## 方案3：使用Docker部署

```bash
# 构建并启动
docker-compose up -d

# 访问服务
# 前端: http://localhost:3000
# 后端: http://localhost:5001
```

---

## 方案4：生产构建

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

### 2. 启动器无响应

- 确保 Node.js 已安装（版本 18+）
- 以管理员身份运行批处理文件
- 检查 scripts/project-launcher.cjs 是否存在

### 3. 依赖安装失败

```bash
# 清除缓存重试
rm -rf node_modules package-lock.json
npm install
```

### 4. 环境变量配置

参考 `server/.env.example` 文件，创建自己的 `.env` 文件。

---

## 📚 相关文档

- [标准端口配置](docs/STANDARD_PORT_CONFIGURATION.md)
- [环境变量标准](docs/ENVIRONMENT_VARIABLES_STANDARD.md)
- [开发工作流](docs/02-development/workflow.md)
- [项目启动器说明](scripts/project-launcher.cjs)
