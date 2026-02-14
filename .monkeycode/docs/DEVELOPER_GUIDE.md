# 开发者指南

## 环境搭建

### 前置要求

- **Node.js**: 18.x 或更高版本
- **npm**: 8.x 或更高版本（或使用 yarn）
- **MongoDB**: 6.0 或更高版本
- **Redis**: 7.0 或更高版本
- **Git**: 用于版本控制

### 1. 克隆项目

```bash
git clone https://github.com/Sam4587/Workspace.git
cd Workspace
```

### 2. 安装依赖

**前端依赖**:
```bash
npm install
```

**后端依赖**:
```bash
cd server
npm install
cd ..
```

### 3. 配置环境变量

**前端环境变量** (`.env`):
```env
# 服务器配置
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:3000

# 环境配置
NODE_ENV=development

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUBLISHING=true
VITE_ENABLE_AI_GENERATION=true
```

**后端环境变量** (`.env`):
```env
# 服务器配置
NODE_ENV=development
PORT=5000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai-content-system

# Redis 配置
REDIS_URL=redis://localhost:6379

# JWT 配置
JWT_SECRET=your-jwt-secret-key

# AI 服务配置
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key
XUNFEI_API_KEY=your-xunfei-api-key
XUNFEI_APP_ID=your-xunfei-app-id

# 平台配置
TOUTIAO_ACCESS_TOKEN=your-toutiao-access-token

# CORS 配置
CORS_ORIGIN=*
```

### 4. 启动服务

**启动 MongoDB**:
```bash
# 使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# 或使用本地安装的 MongoDB
mongod --dbpath /path/to/data
```

**启动 Redis**:
```bash
# 使用 Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine

# 或使用本地安装的 Redis
redis-server
```

**启动后端服务**:
```bash
cd server
npm run dev
```

**启动前端服务**:
```bash
npm run dev
```

访问 `http://localhost:8080` 查看应用。

## 项目结构

```
Workspace/
├── .monkeycode/           # MonkeyCode 配置和文档
│   └── docs/            # 项目文档
├── nginx/               # Nginx 配置
├── scripts/             # 部署脚本
├── server/              # 后端服务
│   ├── models/          # 数据模型
│   ├── routes/         # API 路由
│   ├── services/       # 业务服务
│   ├── utils/          # 工具函数
│   ├── ecosystem.config.js  # PM2 配置
│   ├── index.js        # Express 应用入口
│   └── start.js       # 服务启动脚本
├── src/               # 前端应用
│   ├── components/     # React 组件
│   │   ├── ui/       # shadcn/ui 组件
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── TopicCard.jsx
│   │   └── ...
│   ├── contexts/      # React Context
│   ├── data/         # 静态数据
│   ├── lib/          # 工具函数和 API 封装
│   ├── pages/        # 页面组件
│   ├── providers/    # React Provider
│   ├── App.jsx       # 应用根组件
│   └── main.jsx     # 应用入口
├── .env             # 前端环境变量
├── .gitignore       # Git 忽略文件
├── docker-compose.yml    # Docker Compose 配置
├── docker-compose.prod.yml  # 生产环境 Docker 配置
├── Dockerfile        # Docker 镜像构建文件
├── package.json     # 前端依赖和脚本
├── vite.config.js   # Vite 配置
├── tailwind.config.js  # Tailwind CSS 配置
└── README.md        # 项目说明
```

## 代码规范

### JavaScript/JSX 规范

**命名约定**:
- **组件**: PascalCase（如 `ContentGeneration.jsx`）
- **函数/变量**: camelCase（如 `fetchData`）
- **常量**: UPPER_SNAKE_CASE（如 `API_BASE_URL`）
- **类**: PascalCase（如 `HotTopicService`）

**组件结构**:
```jsx
// 1. 导入
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// 2. 常量定义
const DEFAULT_PAGE_SIZE = 20;

// 3. 组件定义
const MyComponent = ({ prop1, prop2 }) => {
  // 3.1 Hooks
  const [state, setState] = useState(null);
  const data = useQuery(...);

  // 3.2 事件处理函数
  const handleClick = () => {
    // 处理逻辑
  };

  // 3.3 副作用
  useEffect(() => {
    // 副作用逻辑
  }, []);

  // 3.4 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 4. 导出
export default MyComponent;
```

**API 调用**:
```jsx
// 使用 TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['hot-topics', page],
  queryFn: () => api.getHotTopics({ page })
});

// 使用 Mutation
const mutation = useMutation({
  mutationFn: api.createContent,
  onSuccess: () => {
    toast.success('创建成功');
  }
});
```

### 后端代码规范

**路由结构**:
```javascript
const express = require('express');
const router = express.Router();

// 1. POST - 创建
router.post('/', async (req, res) => {
  try {
    // 验证
    // 处理逻辑
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET - 列表
router.get('/', async (req, res) => {
  // ...
});

// 3. GET - 详情
router.get('/:id', async (req, res) => {
  // ...
});

// 4. PATCH - 更新
router.patch('/:id', async (req, res) => {
  // ...
});

// 5. DELETE - 删除
router.delete('/:id', async (req, res) => {
  // ...
});

module.exports = router;
```

**错误处理**:
```javascript
// 使用 try-catch
try {
  const result = await someAsyncOperation();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('操作失败:', error);
  res.status(500).json({
    success: false,
    message: '操作失败',
    error: error.message
  });
}
```

### CSS/Tailwind 规范

**使用 Tailwind 类名**:
```jsx
// 好的做法
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">标题</h2>
</div>

// 避免
<div style={{ display: 'flex', padding: '16px' }}>
```

**响应式设计**:
```jsx
// 使用 Tailwind 响应式前缀
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## 开发工作流

### 1. 功能开发流程

1. **创建功能分支**:
```bash
git checkout -b feat/feature-name
```

2. **开发功能**:
   - 编写代码
   - 添加测试
   - 更新文档

3. **提交代码**:
```bash
git add .
git commit -m "feat: 添加新功能"
```

4. **推送分支**:
```bash
git push origin feat/feature-name
```

5. **创建 Pull Request**

### 2. 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修改 bug 的代码变动）
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**:
```
feat(content): 添加内容生成功能

- 集成 OpenAI API
- 添加生成参数配置
- 实现内容预览

Closes #123
```

### 3. 代码审查

提交 PR 后，需要经过代码审查：

- **代码质量**: 代码风格是否符合规范
- **功能完整性**: 是否满足需求
- **测试覆盖**: 是否有足够的测试
- **文档更新**: 是否更新了相关文档
- **性能考虑**: 是否有性能问题

### 4. 部署流程

**开发环境**:
- 代码合并到 `main` 分支后自动部署到开发环境

**生产环境**:
- 通过 Git Tag 触发生产环境部署
- 部署前需要经过完整测试

## 调试技巧

### 前端调试

**使用 React DevTools**:
1. 安装 React DevTools 浏览器插件
2. 检查组件状态和 Props
3. 查看组件树

**使用 Vite DevTools**:
1. 查看模块依赖关系
2. 分析构建性能
3. 检查 HMR 状态

**Console 调试**:
```jsx
console.log('调试信息', data);
console.error('错误信息', error);
console.warn('警告信息', warning);
```

### 后端调试

**使用 VS Code 调试器**:
1. 在 `server/start.js` 设置断点
2. 配置 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动后端",
      "program": "${workspaceFolder}/server/start.js"
    }
  ]
}
```

**使用 Winston 日志**:
```javascript
const { info, error, warn, debug } = require('./utils/logger');

info('普通信息');
error('错误信息', error);
warn('警告信息');
debug('调试信息');
```

### 数据库调试

**使用 MongoDB Compass**:
1. 连接到本地 MongoDB
2. 查看数据集合
3. 执行查询和聚合

**使用 Redis CLI**:
```bash
redis-cli
> KEYS *
> GET key
> DEL key
```

## 测试

### 单元测试

**使用 Jest**:
```javascript
// __tests__/hotTopicService.test.js
const hotTopicService = require('../services/hotTopicService');

describe('HotTopicService', () => {
  test('应该成功获取微博热搜', async () => {
    const topics = await hotTopicService.fetchWeiboHotSearch();
    expect(topics).toHaveLength(20);
    expect(topics[0]).toHaveProperty('title');
  });
});
```

### 集成测试

**使用 Supertest**:
```javascript
const request = require('supertest');
const app = require('../index');

describe('Hot Topics API', () => {
  test('GET /api/hot-topics 应该返回热点列表', async () => {
    const response = await request(app)
      .get('/api/hot-topics')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

### E2E 测试

**使用 Playwright**:
```javascript
// e2e/content-generation.spec.js
const { test, expect } = require('@playwright/test');

test('内容生成流程', async ({ page }) => {
  await page.goto('http://localhost:8080/content-generation');
  await page.fill('[name="title"]', '测试标题');
  await page.click('button[type="submit"]');
  await expect(page.locator('.content-preview')).toBeVisible();
});
```

## 性能优化

### 前端优化

**代码分割**:
```jsx
// 路由懒加载
const HotTopics = React.lazy(() => import('./pages/HotTopics'));
const ContentGeneration = React.lazy(() => import('./pages/ContentGeneration'));
```

**图片优化**:
```jsx
// 使用懒加载
<img src={image} loading="lazy" alt="描述" />

// 使用 WebP 格式
<picture>
  <source srcSet={imageWebp} type="image/webp" />
  <img src={image} alt="描述" />
</picture>
```

**防抖和节流**:
```jsx
import { debounce } from 'lodash';

const handleSearch = debounce((value) => {
  // 搜索逻辑
}, 300);
```

### 后端优化

**数据库索引**:
```javascript
// 在模型中定义索引
hotTopicSchema.index({ heat: -1 });
hotTopicSchema.index({ category: 1, createdAt: -1 });
```

**缓存策略**:
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });

// 使用缓存
function getHotTopics() {
  const cached = cache.get('hot-topics');
  if (cached) return cached;

  const topics = await fetchFromDB();
  cache.set('hot-topics', topics);
  return topics;
}
```

**异步处理**:
```javascript
// 使用 Promise.all 并行请求
const [weibo, toutiao] = await Promise.all([
  fetchWeiboHotSearch(),
  fetchToutiaoHot()
]);
```

## 常见问题

### Q: 前端无法连接后端 API？

**A**: 检查以下几点：
1. 后端服务是否正常启动
2. `.env` 文件中的 `VITE_API_URL` 是否正确
3. 后端 CORS 配置是否允许前端域名
4. 浏览器控制台是否有跨域错误

### Q: MongoDB 连接失败？

**A**: 检查以下几点：
1. MongoDB 服务是否正常运行
2. `MONGODB_URI` 连接字符串是否正确
3. MongoDB 用户名密码是否正确
4. 防火墙是否阻止了 27017 端口

### Q: AI 生成失败？

**A**: 检查以下几点：
1. API Key 是否正确配置
2. API Key 是否有足够的配额
3. 网络是否可以访问 AI 服务
4. 查看后端日志获取详细错误信息

### Q: Docker 部署失败？

**A**: 检查以下几点：
1. Docker 服务是否正常运行
2. Docker Compose 配置是否正确
3. 端口是否被占用
4. 查看容器日志：`docker-compose logs`

## 贡献指南

### 如何贡献

1. Fork 项目到你的 GitHub
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交更改：`git commit -m 'feat: 添加你的功能'`
4. 推送到分支：`git push origin feat/your-feature`
5. 创建 Pull Request

### 贡献类型

- **Bug 修复**: 修复已知的 Bug
- **新功能**: 添加新的功能
- **文档改进**: 完善文档
- **性能优化**: 优化性能
- **代码重构**: 重构代码
- **测试补充**: 添加测试

### Pull Request 模板

```markdown
## 描述
简要描述此 PR 的目的

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构

## 测试
- [ ] 已添加单元测试
- [ ] 已添加集成测试
- [ ] 已通过所有测试

## 检查清单
- [ ] 代码符合项目规范
- [ ] 已更新相关文档
- [ ] 已通过代码审查
```

## 相关资源

- [React 官方文档](https://react.dev/)
- [Express 官方文档](https://expressjs.com/)
- [MongoDB 官方文档](https://www.mongodb.com/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Vite 文档](https://vitejs.dev/)
- [TanStack Query 文档](https://tanstack.com/query/latest)

## 联系方式

- **Issues**: [GitHub Issues](https://github.com/Sam4587/Workspace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Sam4587/Workspace/discussions)
- **Email**: [项目维护者邮箱]

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。
