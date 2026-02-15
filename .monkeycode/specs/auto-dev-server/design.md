# 自动化开发服务器启动 技术设计

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    自动化技能 (Skill)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │   配置管理器     │    │   进程管理器     │          │
│  │  ConfigManager   │    │  ProcessManager  │          │
│  └──────────────────┘    └──────────────────┘          │
│           │                       │                       │
│           └───────────┬───────────┘                       │
│                       ▼                                   │
│              ┌──────────────────┐                         │
│              │   主控制器        │                         │
│              │  AutoDevServer   │                         │
│              └──────────────────┘                         │
│                       │                                   │
│           ┌───────────┴───────────┐                       │
│           ▼                       ▼                       │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  前端服务进程    │    │  后端服务进程    │          │
│  │  FrontendProcess │    │  BackendProcess  │          │
│  └──────────────────┘    └──────────────────┘          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 模块划分

### 1. ConfigManager (配置管理器)

**职责**:
- 读取和解析配置文件
- 提供默认配置
- 验证配置合法性

**配置文件格式**:
```json
{
  "frontend": {
    "command": "npm run dev",
    "cwd": ".",
    "readyPattern": "Local:   http://localhost:",
    "env": {}
  },
  "backend": {
    "command": "npm run dev",
    "cwd": "./server",
    "readyPattern": "服务器启动成功",
    "env": {
      "PORT": "5000"
    }
  }
}
```

### 2. ProcessManager (进程管理器)

**职责**:
- 启动子进程
- 监控进程状态
- 处理进程输出
- 优雅终止进程

**API 设计**:
```javascript
class ProcessManager {
  constructor(options) {
    this.command = options.command;
    this.cwd = options.cwd;
    this.env = options.env;
    this.name = options.name;
  }
  
  async start() { /* 启动进程 */ }
  async stop() { /* 停止进程 */ }
  on(event, callback) { /* 监听事件 */ }
}
```

### 3. AutoDevServer (主控制器)

**职责**:
- 协调前后端服务启动
- 处理服务状态同步
- 管理生命周期

**启动流程**:
1. 读取配置
2. 启动前端服务
3. 等待前端就绪
4. 启动后端服务
5. 等待后端就绪
6. 显示就绪状态

**关闭流程**:
1. 接收终止信号
2. 停止后端服务
3. 停止前端服务
4. 清理资源
5. 退出

## 接口设计

### 命令行接口

**使用方式**:
```bash
# 使用默认配置
npx auto-dev-server

# 指定配置文件
npx auto-dev-server --config my-config.json

# 直接指定命令
npx auto-dev-server --frontend "npm run dev" --backend "cd server && npm start"
```

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `frontend.command` | string | `npm run dev` | 前端启动命令 |
| `frontend.cwd` | string | `.` | 前端工作目录 |
| `frontend.readyPattern` | string | `Local:   http://localhost:` | 前端就绪检测模式 |
| `frontend.env` | object | `{}` | 前端环境变量 |
| `backend.command` | string | `npm run dev` | 后端启动命令 |
| `backend.cwd` | string | `./server` | 后端工作目录 |
| `backend.readyPattern` | string | `服务器启动成功` | 后端就绪检测模式 |
| `backend.env` | object | `{}` | 后端环境变量 |

## 数据模型

### 服务状态

```javascript
const ServiceStatus = {
  IDLE: 'idle',
  STARTING: 'starting',
  READY: 'ready',
  ERROR: 'error',
  STOPPING: 'stopping',
  STOPPED: 'stopped'
};
```

### 进程信息

```javascript
interface ProcessInfo {
  pid: number;
  name: string;
  status: ServiceStatus;
  startTime: Date;
  readyTime?: Date;
  stdout: string[];
  stderr: string[];
}
```

## 错误处理

### 错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| `CONFIG_NOT_FOUND` | 配置文件不存在 | 创建配置文件或使用默认配置 |
| `INVALID_CONFIG` | 配置格式错误 | 检查配置文件语法 |
| `FRONTEND_START_FAILED` | 前端启动失败 | 检查前端依赖和命令 |
| `BACKEND_START_FAILED` | 后端启动失败 | 检查后端依赖和命令 |
| `PORT_IN_USE` | 端口被占用 | 更改端口或关闭占用进程 |
| `PROCESS_TIMEOUT` | 启动超时 | 增加超时时间或检查服务 |

### 错误通知

- 终端彩色输出
- 清晰的错误描述
- 具体的解决建议
- 相关文档链接

## 日志格式

### 输出格式

```
[时间] [服务名] [级别] 消息内容
```

### 示例

```
[12:34:56] [前端] [INFO] 正在启动...
[12:34:57] [前端] [INFO] Vite v5.4.11  ready in 1192 ms
[12:34:57] [前端] [SUCCESS] 前端服务就绪
[12:34:57] [后端] [INFO] 正在启动...
[12:34:58] [后端] [INFO] 服务器启动成功，端口: 5000
[12:34:58] [后端] [SUCCESS] 后端服务就绪
[12:34:58] [系统] [SUCCESS] ✅ 所有服务已就绪！
```

## 技术选型

| 技术 | 选型 | 理由 |
|------|------|------|
| 语言 | Node.js | 与项目技术栈一致 |
| 进程管理 | `child_process` | Node.js 内置，稳定可靠 |
| 日志颜色 | `chalk` | 终端彩色输出 |
| 配置解析 | `cosmiconfig` | 支持多种配置格式 |
| 信号处理 | 原生 `process.on()` | 处理 SIGINT/SIGTERM |

## 兼容性

### 操作系统
- ✅ Windows (PowerShell/CMD)
- ✅ macOS (Terminal/iTerm2)
- ✅ Linux (Bash/Zsh)

### 前端构建工具
- ✅ Vite
- ✅ Webpack (Create React App)
- ✅ Next.js
- ✅ Vue CLI

### 后端运行环境
- ✅ Node.js (Express/Koa/Nest.js)
- ✅ Python (Flask/Django/FastAPI)
- ✅ Go
- ✅ 其他任何可通过命令行启动的服务
