# AI 内容流项目开发规则

本文件定义了 AI 内容流项目的全局开发规则，所有 Agent 在执行任务时必须遵循。

## 项目架构

### 技术栈
- **前端**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **后端**: Node.js + Express + MongoDB
- **AI 服务**: LiteLLM + 多模型支持
- **视频生成**: Remotion
- **部署**: Docker + Docker Compose

### 目录结构
```
Workspace/
├── src/                    # 前端代码
│   ├── components/         # React 组件
│   │   ├── ui/            # shadcn/ui 基础组件
│   │   └── [feature]/     # 功能组件
│   ├── pages/             # 页面组件
│   ├── lib/               # 工具函数
│   └── contexts/          # React Context
├── server/                # 后端代码
│   ├── routes/            # API 路由
│   ├── services/          # 业务逻辑
│   ├── models/            # 数据模型
│   ├── fetchers/          # 数据抓取
│   └── tests/             # 测试文件
├── .monkeycode/           # 开发文档
│   └── specs/             # 功能规格文档
└── .trae/                 # Trae 配置
    ├── skills/            # Agent Skills
    └── rules/             # 项目规则
```

## 开发流程

### 1. 新功能开发流程

任何新功能开发必须遵循以下步骤：

1. **需求分析**
   - 在 `.monkeycode/specs/<feature-name>/` 创建需求文档
   - 使用 `requirements.md` 模板
   - 明确定义验收标准

2. **技术设计**
   - 创建 `design.md` 设计文档
   - 定义接口和数据模型
   - 评估技术方案

3. **任务拆解**
   - 创建 `tasklist.md` 任务清单
   - 估算工时
   - 识别依赖关系

4. **编码实现**
   - 遵循编码规范
   - 编写单元测试
   - 保持代码简洁

5. **测试验证**
   - 运行 lint 检查
   - 执行测试用例
   - 手动验证功能

6. **代码审查**
   - 自我审查
   - 提交 Pull Request
   - 修复审查意见

### 2. 编码规范

#### 前端规范

**组件命名**：
- 使用 PascalCase（如 `UserProfile`）
- 功能组件放在 `components/[feature]/` 目录

**Props 定义**：
```javascript
// 使用 PropTypes 或 JSDoc
/**
 * @param {Object} props
 * @param {User} props.user - 用户信息
 * @param {Function} props.onUpdate - 更新回调
 * @param {boolean} [props.loading=false] - 加载状态
 */
function UserProfile({ user, onUpdate, loading = false }) {
  // ...
}
```

**状态管理**：
- 简单状态使用 useState
- 复杂状态使用 useReducer 或 Context
- 服务端状态使用 React Query

**样式规范**：
- 优先使用 Tailwind CSS
- 自定义样式放在组件同级 CSS 文件
- 遵循移动端优先原则

#### 后端规范

**API 设计**：
```javascript
// 统一响应格式
{
  success: boolean,
  data: any,
  message: string,
  error?: string
}

// 错误响应格式
{
  success: false,
  error: 'ERROR_CODE',
  message: '用户友好的错误信息'
}
```

**路由组织**：
```javascript
// routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// 公开路由
router.post('/register', userController.register);
router.post('/login', userController.login);

// 需要认证的路由
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

module.exports = router;
```

**错误处理**：
```javascript
// 统一错误处理中间件
function errorHandler(err, req, res, next) {
  logger.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || '服务器内部错误'
  });
}
```

### 3. 文档规范

**需求文档** (`requirements.md`)：
```markdown
# [功能名称] 需求文档

## 需求概述
- 背景：
- 目标：
- 范围：

## 功能需求
### 1. [功能模块]
**需求 ID**: [前缀-序号]
**需求描述**: 
**验收标准**:
1. WHEN [条件] THEN [结果]
```

**设计文档** (`design.md`)：
```markdown
# [功能名称] 技术设计

## 架构设计
## 模块划分
## 接口设计
## 数据模型
## 错误处理
```

**任务清单** (`tasklist.md`)：
```markdown
# [功能名称] 开发任务

## 阶段 1: 基础设施
- [ ] [任务] - [工时]

## 阶段 2: 核心功能
- [ ] [任务] - [工时]

## 依赖项
```

### 4. 测试规范

**测试文件位置**：
- 单元测试：与被测试文件同级，后缀 `.test.js`
- 集成测试：`server/tests/integration.test.js`

**测试要求**：
- 核心逻辑必须有单元测试
- API 接口必须有集成测试
- 测试覆盖率目标：70%

**测试命名**：
```javascript
describe('功能模块', () => {
  it('应该[期望行为]', () => {});
  it('应该处理[边界条件]', () => {});
  it('应该拒绝[无效输入]', () => {});
});
```

### 5. 提交规范

**提交信息格式**：
```
<type>: <subject>

<body>

<footer>
```

**类型说明**：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat: 添加抖音 MCP 发布功能

- 实现二维码登录
- 支持图文和视频发布
- 添加发布状态查询

Closes #123
```

## 安全检查清单

- [ ] 没有硬编码的密钥、密码
- [ ] 用户输入已验证
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 敏感操作需要认证
- [ ] 日志不包含敏感信息

## 性能检查清单

- [ ] 大数据集使用分页
- [ ] 图片懒加载
- [ ] API 响应时间 < 500ms
- [ ] 避免 N+1 查询
- [ ] 使用缓存减少重复计算

## 常用命令

```bash
# 开发
npm run dev          # 启动前端开发服务器
npm run server       # 启动后端开发服务器

# 代码检查
npm run lint         # 运行 ESLint
npm run lint:fix     # 自动修复 ESLint 问题

# 测试
npm test             # 运行所有测试
npm run test:coverage # 生成测试覆盖率报告

# 构建
npm run build        # 生产构建
npm run preview      # 预览生产构建

# Docker
docker-compose up    # 启动所有服务
docker-compose build # 构建镜像
```

## 环境配置

**开发环境**：
- 前端：http://localhost:5173
- 后端：http://localhost:3000
- MongoDB：mongodb://localhost:27017

**环境变量**（`.env` 文件）：
```
# 后端
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ai-content
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...

# 前端
VITE_API_URL=http://localhost:3000
```

## 问题排查

**常见问题**：

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   netstat -ano | findstr :3000
   # 结束进程
   taskkill /PID <进程ID> /F
   ```

2. **MongoDB 连接失败**
   - 检查 MongoDB 服务是否启动
   - 验证连接字符串

3. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

## 参考资料

- [React 文档](https://react.dev/)
- [Express 文档](https://expressjs.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
