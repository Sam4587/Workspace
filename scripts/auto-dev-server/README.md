# Auto Dev Server

自动化开发服务器启动工具，一键同时启动前后端服务。

## 🚀 功能特性

- ✅ **自动启动** - 一键启动前后端服务
- ✅ **智能监控** - 自动检测服务状态和健康检查
- ✅ **联动控制** - 前端停止时自动停止后端
- ✅ **灵活配置** - 支持自定义配置文件
- ✅ **优雅关闭** - 支持 Ctrl+C 优雅关闭所有服务
- ✅ **实时日志** - 清晰区分前后端日志输出
- ✅ **错误处理** - 完善的错误提示和恢复机制

## 📦 安装

```bash
# 在项目根目录安装依赖
cd scripts/auto-dev-server
npm install
```

## 🚀 快速开始

### 1. 基本使用

```bash
# 启动开发服务器（默认命令）
node src/cli.js

# 或者使用 npm script
npm start
```

### 2. 查看服务状态

```bash
node src/cli.js status
```

### 3. 重启特定服务

```bash
# 重启前端服务
node src/cli.js restart frontend

# 重启后端服务
node src/cli.js restart backend
```

### 4. 停止所有服务

```bash
node src/cli.js stop

# 或使用 Ctrl+C
```

## ⚙️ 配置

### 创建配置文件

```bash
# 创建默认配置文件
node src/cli.js --create-config
# 或
node src/cli.js config
```

这会在项目根目录创建 `.auto-dev-server.json` 文件。

### 配置文件格式

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

### 配置项说明

#### frontend/backend 配置
- `command`: 启动命令
- `cwd`: 工作目录
- `port`: 服务端口
- `checkUrl`: 健康检查URL
- `timeout`: 启动超时时间（毫秒）

#### common 配置
- `logLevel`: 日志级别（debug/info/warn/error）
- `autoRestart`: 是否自动重启失败的服务
- `restartDelay`: 重启延迟（毫秒）
- `maxRetries`: 最大重试次数

## 🛠️ 命令行选项

```bash
# 显示帮助信息
node src/cli.js --help
node src/cli.js -h

# 显示版本信息
node src/cli.js --version
node src/cli.js -v

# 使用自定义配置文件
node src/cli.js --config=./my-config.json

# 创建配置文件
node src/cli.js --create-config
```

## 📁 项目结构

```
auto-dev-server/
├── src/
│   ├── AutoDevServer.js    # 主控制器
│   ├── ConfigManager.js    # 配置管理器
│   ├── ProcessManager.js   # 进程管理器
│   ├── Logger.js           # 日志系统
│   ├── cli.js             # CLI入口
│   └── index.js           # 程序化使用入口
├── config/
│   └── default-config.json # 默认配置模板
├── test/                  # 测试文件
├── package.json          # 项目配置
└── README.md             # 本文档
```

## 🧪 程序化使用

```javascript
const { AutoDevServer } = require('./src');

async function main() {
  const autoDev = new AutoDevServer();
  
  // 初始化
  await autoDev.init();
  
  // 启动服务
  await autoDev.start();
  
  // 查看状态
  console.log(autoDev.getStatus());
  
  // 重启前端服务
  await autoDev.restart('frontend');
  
  // 停止所有服务
  await autoDev.stop();
}

main().catch(console.error);
```

## 🎯 使用场景

### 1. 日常开发
```bash
# 启动开发环境
node src/cli.js
```

### 2. CI/CD 集成
```bash
# 在自动化脚本中使用
node src/cli.js start --config=./ci-config.json
```

### 3. 多环境配置
```bash
# 开发环境
node src/cli.js --config=./config/dev.json

# 测试环境
node src/cli.js --config=./config/test.json
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
   - 检查配置文件中的命令是否正确
   - 确认依赖包已安装
   - 查看详细错误日志

3. **权限问题**
   - 确保有足够的权限运行命令
   - 在Windows上可能需要管理员权限

### 日志级别

通过配置 `common.logLevel` 控制日志输出：
- `debug`: 详细调试信息
- `info`: 一般信息（默认）
- `warn`: 警告信息
- `error`: 错误信息

## 📝 开发指南

### 运行测试
```bash
npm test
```

### 本地开发
```bash
# 监听模式运行
npm run dev
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！