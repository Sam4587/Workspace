# Auto Dev Server 使用指南

## 🎯 简介

Auto Dev Server 是一个自动化开发服务器启动工具，可以一键同时启动前端和后端服务，并提供完善的监控和管理功能。

## 🚀 快速开始

### 1. 基本使用

```bash
# 使用 npm script 启动（推荐）
npm run dev:auto

# 或直接运行 CLI
node scripts/auto-dev-server/src/cli.js start
```

### 2. 创建配置文件

```bash
# 创建默认配置文件
node scripts/auto-dev-server/src/cli.js --create-config
```

这会创建 `.auto-dev-server.json` 配置文件。

### 3. 查看服务状态

```bash
# 查看当前服务状态
node scripts/auto-dev-server/src/cli.js status
```

## 📋 可用命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `start` | 启动所有服务 | `npm run dev:auto` |
| `status` | 查看服务状态 | `node scripts/auto-dev-server/src/cli.js status` |
| `restart <service>` | 重启指定服务 | `node scripts/auto-dev-server/src/cli.js restart frontend` |
| `stop` | 停止所有服务 | `node scripts/auto-dev-server/src/cli.js stop` |
| `config` | 创建配置文件 | `node scripts/auto-dev-server/src/cli.js config` |

## ⚙️ 配置说明

### 默认配置

Auto Dev Server 使用以下默认配置：

```json
{
  "frontend": {
    "command": "npm run dev",
    "cwd": ".",
    "port": 5174,
    "checkUrl": "http://localhost:5174",
    "timeout": 30000
  },
  "backend": {
    "command": "node server/server.js",
    "cwd": "./server",
    "port": 5001,
    "checkUrl": "http://localhost:5001/api/monitoring/health",
    "timeout": 30000
  },
  "common": {
    "logLevel": "info",
    "autoRestart": true,
    "restartDelay": 2000,
    "maxRetries": 3
  }
}
```

### 配置项详解

#### Frontend/Backend 配置
- `command`: 启动服务的命令
- `cwd`: 工作目录（相对于项目根目录）
- `port`: 服务监听端口
- `checkUrl`: 健康检查URL
- `timeout`: 启动超时时间（毫秒）

#### Common 配置
- `logLevel`: 日志级别（debug/info/warn/error）
- `autoRestart`: 服务失败时是否自动重启
- `restartDelay`: 重启延迟时间（毫秒）
- `maxRetries`: 最大重试次数

## 🎯 使用场景

### 1. 日常开发

```bash
# 启动开发环境
npm run dev:auto
```

### 2. 自定义配置

```bash
# 使用自定义配置文件
node scripts/auto-dev-server/src/cli.js start --config=./my-config.json
```

### 3. 服务管理

```bash
# 重启前端服务
node scripts/auto-dev-server/src/cli.js restart frontend

# 重启后端服务
node scripts/auto-dev-server/src/cli.js restart backend
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :5174
   netstat -ano | findstr :5001
   
   # 终止占用进程
   taskkill /PID <进程ID> /F
   ```

2. **服务启动失败**
   - 检查配置文件命令是否正确
   - 确认依赖包已安装
   - 查看详细错误日志

3. **权限问题**
   - 确保有足够权限运行命令
   - Windows上可能需要管理员权限

### 日志级别

通过配置 `common.logLevel` 控制输出：
- `debug`: 详细调试信息
- `info`: 一般信息（默认）
- `warn`: 警告信息
- `error`: 错误信息

## 📊 状态监控

Auto Dev Server 提供实时状态监控：

```
==================================================
  服务状态
==================================================
前端服务: RUNNING (pid: 12345)
后端服务: RUNNING (pid: 67890)
==================================================
```

状态说明：
- `RUNNING`: 服务正常运行
- `STARTING`: 服务正在启动
- `STOPPED`: 服务已停止
- `ERROR`: 服务启动失败

## 🔄 自动化集成

### CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Start Dev Server
  run: |
    npm run dev:auto &
    sleep 30  # 等待服务启动
```

### 脚本集成

```javascript
// 在其他脚本中使用
const { AutoDevServer } = require('./scripts/auto-dev-server/src');

async function setupEnvironment() {
  const autoDev = new AutoDevServer();
  await autoDev.init();
  await autoDev.start();
  return autoDev;
}
```

## 🛡️ 安全提醒

1. **仅用于开发环境**
2. **不要在生产环境使用**
3. **定期清理临时文件**
4. **注意进程权限控制**

## 📞 支持

如遇到问题，请查看：
- [完整文档](./scripts/auto-dev-server/README.md)
- 错误日志输出
- 配置文件验证

---
*Auto Dev Server - 让开发更简单*