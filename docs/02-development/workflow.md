# 🛠️ 开发工作流规范

## 🎯 开发前准备

### 必须执行的前置步骤

```bash
# 1. 拉取最新代码
git pull origin master

# 2. 启动开发环境
npm run dev

# 3. 验证服务状态
curl http://localhost:5001/api/monitoring/health
curl http://localhost:5174/
```

---

## 🔄 标准开发流程（7步法）

### 第1步：需求分析
- 阅读对应功能的规格文档 (`docs/specs/*/requirements.md`)
- 理解用户故事和验收标准
- 确认技术可行性

### 第2步：技术设计
- 参考设计文档 (`docs/specs/*/design.md`)
- 确定技术方案和架构
- 评估影响范围

### 第3步：任务拆分
- 按照任务清单 (`docs/specs/*/tasklist.md`) 分解
- 估算每项任务的时间成本
- 确定依赖关系

### 第4步：编码实现
- 遵循编码规范和最佳实践
- 保持代码整洁和可读性
- 及时提交阶段性成果

### 第5步：测试验证
- 编写单元测试和集成测试
- 执行手动测试验证功能
- 确保不破坏现有功能

### 第6步：代码提交
```bash
git add .
git commit -m "feat(scope): 功能描述"
git push origin feature/branch-name
```

### 第7步：文档更新
- 更新相关技术文档
- 补充API文档和注释
- 记录变更日志

---

## 📋 代码规范

### 命名约定
```javascript
// 组件命名 - PascalCase
const UserProfile = () => {}

// 函数命名 - camelCase  
const getUserData = () => {}

// 常量命名 - UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:5001'

// 私有变量 - underscore prefix
const _privateMethod = () => {}
```

### 文件组织
```
src/
├── components/
│   ├── ui/           # 基础UI组件
│   └── business/     # 业务组件
├── pages/            # 页面组件
├── services/         # 服务层
├── hooks/            # 自定义Hook
└── utils/            # 工具函数
```

### 注释规范
```javascript
/**
 * 用户登录服务
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果
 * @throws {Error} 登录失败时抛出错误
 */
async function loginUser(username, password) {
  // 实现逻辑
}
```

---

## 🔧 开发工具链

### 代码检查
```bash
# ESLint 检查
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# TypeScript 类型检查
npm run type-check
```

### 测试套件
```bash
# 运行所有测试
npm run test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

### 构建和部署
```bash
# 开发构建
npm run build

# 生产构建
npm run build:prod

# 预览构建结果
npm run preview
```

---

## 🎯 分支管理策略

### 分支命名规范
```
feature/user-login      # 新功能开发
bugfix/login-error      # Bug修复
hotfix/critical-bug     # 紧急修复
release/v1.2.0          # 版本发布
```

### 工作流示例
```bash
# 1. 创建功能分支
git checkout -b feature/new-dashboard

# 2. 开发过程中定期提交
git add .
git commit -m "feat(dashboard): 添加用户统计面板"

# 3. 推送到远程仓库
git push origin feature/new-dashboard

# 4. 创建Pull Request进行代码审查

# 5. 合并到主分支
git checkout master
git merge feature/new-dashboard
git push origin master
```

---

## 🔍 调试技巧

### 前端调试
```javascript
// 使用console.table查看对象
console.table(userData);

// 使用console.group组织日志
console.group('API调用');
console.log('请求参数:', params);
console.log('响应数据:', response);
console.groupEnd();

// 条件断点调试
debugger; // 在特定条件下触发断点
```

### 后端调试
```bash
# 查看应用日志
tail -f server/logs/application/app-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f server/logs/error/error-$(date +%Y-%m-%d).log

# 实时监控系统资源
htop
```

### API调试
```bash
# 使用curl测试API
curl -X GET "http://localhost:5001/api/users" \
  -H "Authorization: Bearer $TOKEN"

# 使用Postman或Insomnia图形化测试
```

---

## 📊 性能优化检查清单

### 前端性能
- [ ] 组件懒加载
- [ ] 图片压缩和WebP格式
- [ ] 代码分割和动态导入
- [ ] 减少不必要的重渲染
- [ ] 使用React.memo优化组件

### 后端性能
- [ ] 数据库查询优化
- [ ] 缓存策略实施
- [ ] API响应时间监控
- [ ] 内存泄漏检测
- [ ] 并发处理能力

### 网络性能
- [ ] CDN静态资源加速
- [ ] HTTP/2协议启用
- [ ] 资源压缩(Gzip/Brotli)
- [ ] 缓存头合理设置

---

## 🔐 安全开发规范

### 输入验证
```javascript
// 前端表单验证
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// 后端参数校验
const validateInput = (data) => {
  // 使用Joi或类似的验证库
};
```

### 敏感信息处理
- [ ] 不在代码中硬编码密钥
- [ ] 使用环境变量管理配置
- [ ] 敏感日志脱敏处理
- [ ] API响应数据过滤

### 权限控制
```javascript
// 基于角色的访问控制
const checkPermission = (user, resource, action) => {
  return user.roles.includes(requiredRole);
};
```

---

## 📈 代码审查要点

### 功能性检查
- [ ] 代码实现符合需求
- [ ] 边界条件处理完整
- [ ] 错误处理机制健全
- [ ] 单元测试覆盖充分

### 代码质量
- [ ] 代码结构清晰合理
- [ ] 命名规范一致
- [ ] 注释说明充分
- [ ] 无重复代码

### 性能考量
- [ ] 算法复杂度合理
- [ ] 数据库查询优化
- [ ] 内存使用效率高
- [ ] 响应时间符合预期

---

## 🚀 持续集成

### 自动化流程
1. **代码提交** → 触发CI流水线
2. **静态检查** → ESLint、TypeScript检查
3. **单元测试** → Jest测试套件运行
4. **构建验证** → 生产环境构建测试
5. **部署预览** → 自动部署到预览环境

### CI配置示例
```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 📚 学习资源

### 内部文档
- [架构设计文档](architecture.md)
- [API参考手册](api-reference.md)
- [技术标准规范](../04-technical-standards/)

### 外部资源
- React官方文档
- Node.js最佳实践
- 现代JavaScript教程

---
**文档维护**: 定期更新开发规范，适应项目发展需要