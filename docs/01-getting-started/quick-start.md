# 🚀 快速开始指南

## 项目概述

**AI Content Flow** 是一个全链路 AI 创作平台，实现从热点发现到内容生成、平台发布、数据分析的全流程闭环。

### 🎯 核心功能
- 🔥 **热点监控**：聚合微博、知乎、头条等多平台热点
- ✨ **AI 内容生成**：多模型支持的内容生成与改写
- 🎬 **视频处理**：视频下载、转录、智能改写
- 📊 **数据分析**：内容效果追踪与可视化
- 📤 **MCP发布平台**：多平台内容发布系统（待开发）

---

## 🛠️ 环境准备

### 系统要求
- Node.js 18+
- npm 或 pnpm
- Windows/Linux/macOS

### 依赖安装
```bash
# 安装所有依赖
npm install
cd server && npm install && cd ..
```

---

## 🚀 启动服务

### 方法一：一体化开发服务器（推荐）
```bash
npm run dev
```

### 方法二：分别启动
```bash
# 终端 1 - 后端服务
cd server && node server.js

# 终端 2 - 前端服务  
npm run dev
```

### 方法三：生产部署
```bash
npm run start:prod
```

### 📍 服务访问地址
| 服务 | 地址 | 端口 |
|------|------|------|
| 前端界面 | http://localhost:5174 | 5174 |
| 后端API | http://localhost:5001/api | 5001 |
| API文档 | http://localhost:5001/api/docs | 5001 |

---

## ⚙️ 环境配置

### 1. 复制配置模板
```bash
cp server/.env.example server/.env
```

### 2. 核心配置项
```env
# 必需配置
JWT_SECRET=your-strong-jwt-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# AI 服务配置
OPENAI_API_KEY=sk-xxx
QWEN_API_KEY=your-qwen-api-key

# 服务配置
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

### 3. 验证配置
```bash
# 检查后端健康状态
curl http://localhost:5001/api/monitoring/health

# 检查前端访问
curl http://localhost:5174/
```

---

## 📁 项目结构概览

```
ai-content-flow/
├── src/                    # 前端源码
│   ├── components/         # UI 组件
│   ├── pages/              # 页面组件
│   └── lib/                # 工具库
├── server/                 # 后端服务
│   ├── routes/             # API 路由
│   ├── services/           # 业务服务
│   └── utils/              # 工具函数
├── docs/                   # 文档中心
└── scripts/                # 脚本工具
```

---

## 🎯 开发工作流

### 1. 创建新功能分支
```bash
git checkout -b feature/your-feature-name
```

### 2. 开发和测试
```bash
# 启动开发环境
npm run dev

# 代码检查
npm run lint

# 运行测试
npm run test
```

### 3. 提交代码
```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

---

## 🔧 常用开发命令

```bash
# 服务管理
npm run dev          # 启动开发服务器
npm run server       # 仅启动后端
npm run client       # 仅启动前端
npm run start:prod   # 生产环境启动

# 构建和部署
npm run build        # 构建生产版本
npm run preview      # 预览构建结果

# 代码质量
npm run lint         # 代码检查
npm run lint:fix     # 自动修复问题
npm run test         # 运行测试
```

---

## 🐛 常见问题解决

### Q: 端口被占用？
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <进程ID> /F

# Linux/macOS
lsof -i :5001
kill -9 <进程ID>
```

### Q: 依赖安装失败？
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Q: 前端白屏或报错？
```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite
npm run dev
```

---

## 📚 进阶学习

### 核心文档
- [开发工作流](../02-development/workflow.md) - 完整开发流程
- [架构设计](../03-architecture/system-architecture.md) - 系统架构详解
- [API 参考](../05-api/api-reference.md) - 接口文档

### 技术标准
- [环境变量标准](../ENVIRONMENT_VARIABLES_STANDARD.md)
- [日志系统标准](../LOGGING_SYSTEM_STANDARD.md)
- [监控告警标准](../MONITORING_ALERT_SYSTEM.md)

---

## 🤝 获取帮助

- 💬 在项目 Issues 中提问
- 📧 联系开发团队：dev-team@example.com
- 📖 查阅完整文档中心

---
**文档版本**: v2.0  
**最后更新**: 2026年2月16日