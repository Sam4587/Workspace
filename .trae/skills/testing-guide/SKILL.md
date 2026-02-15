---
name: "testing-guide"
description: "指导测试用例编写和执行，确保功能正确性和代码稳定性。在编写测试、执行测试或需要验证功能时调用。"
---

# 测试规范指南

本 Skill 定义了团队测试标准，包括单元测试、集成测试和端到端测试的编写规范。

## 测试原则

1. **测试先行**：核心功能先写测试再写实现
2. **独立性**：每个测试用例独立运行，不依赖其他测试
3. **可重复性**：测试结果稳定，不受外部环境影响
4. **快速反馈**：测试执行速度快，及时发现问题

## 测试类型

### 1. 单元测试 (Unit Test)

**适用范围**：
- 工具函数
- 业务逻辑
- 数据转换
- 验证函数

**文件位置**：
```
src/utils/
├── formatDate.js
└── formatDate.test.js      # 单元测试文件

server/services/
├── userService.js
└── userService.test.js     # 单元测试文件
```

**测试框架**：
- 前端：Vitest（与 Vite 集成）
- 后端：Node.js 内置 test runner 或 Jest

**编写规范**：
```javascript
// 前端示例 - Vitest
import { describe, it, expect } from 'vitest';
import { formatDate, calculateScore } from './utils';

describe('formatDate', () => {
  it('应该正确格式化日期', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
  });

  it('应该处理无效日期', () => {
    expect(formatDate(null)).toBe('Invalid Date');
    expect(formatDate('invalid')).toBe('Invalid Date');
  });

  it('应该支持多种格式', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/15/2024');
    expect(formatDate(date, 'DD-MM-YYYY')).toBe('15-01-2024');
  });
});

// 后端示例 - Node.js test runner
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calculateTotal } = require('./orderService');

describe('Order Service', () => {
  describe('calculateTotal', () => {
    it('应该正确计算订单总价', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 1 }
      ];
      const total = calculateTotal(items);
      assert.strictEqual(total, 250);
    });

    it('应该应用折扣', () => {
      const items = [{ price: 100, quantity: 1 }];
      const total = calculateTotal(items, { discount: 0.1 });
      assert.strictEqual(total, 90);
    });

    it('应该处理空购物车', () => {
      const total = calculateTotal([]);
      assert.strictEqual(total, 0);
    });
  });
});
```

### 2. 集成测试 (Integration Test)

**适用范围**：
- API 接口
- 数据库操作
- 服务间调用
- 端到端流程

**文件位置**：
```
server/tests/
├── integration.test.js     # 集成测试主文件
└── setup.js                # 测试环境设置
```

**编写规范**：
```javascript
// server/tests/integration.test.js
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../index');

describe('API Integration Tests', () => {
  let authToken;

  before(async () => {
    // 设置测试环境
    // 创建测试数据库连接
    // 准备测试数据
  });

  after(async () => {
    // 清理测试数据
    // 关闭数据库连接
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录并返回 token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        })
        .expect(200);

      assert.ok(response.body.token);
      assert.strictEqual(response.body.user.username, 'testuser');
      authToken = response.body.token;
    });

    it('应该拒绝无效凭证', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'wrongpass'
        })
        .expect(401);

      assert.strictEqual(response.body.error, 'Invalid credentials');
    });
  });

  describe('GET /api/users/profile', () => {
    it('应该返回用户信息', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      assert.ok(response.body.id);
      assert.ok(response.body.username);
    });

    it('应该拒绝未认证请求', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
  });
});
```

### 3. 组件测试 (Component Test)

**适用范围**：
- React 组件
- 组件交互
- 状态管理

**编写规范**：
```javascript
// src/components/UserProfile.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from './UserProfile';

describe('UserProfile', () => {
  const mockUser = {
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://example.com/avatar.jpg'
  };

  it('应该正确渲染用户信息', () => {
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('张三')).toHaveAttribute('src', mockUser.avatar);
  });

  it('应该处理编辑按钮点击', () => {
    const onEdit = vi.fn();
    render(<UserProfile user={mockUser} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('编辑'));
    expect(onEdit).toHaveBeenCalledWith(mockUser);
  });

  it('应该显示加载状态', () => {
    render(<UserProfile user={null} loading={true} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

## 测试覆盖率要求

| 类型 | 目标覆盖率 | 最低覆盖率 |
|------|-----------|-----------|
| 单元测试 | 80% | 70% |
| 集成测试 | 60% | 50% |
| 整体 | 70% | 60% |

## 测试命名规范

```javascript
// 好的命名
describe('UserService', () => {
  describe('createUser', () => {
    it('应该成功创建新用户', () => {});
    it('应该拒绝重复邮箱', () => {});
    it('应该验证必填字段', () => {});
  });
});

// 不好的命名
describe('test1', () => {
  it('works', () => {});
  it('test case 2', () => {});
});
```

## Mock 使用规范

```javascript
// 外部依赖 Mock
vi.mock('../api', () => ({
  fetchUser: vi.fn(),
  updateUser: vi.fn()
}));

// 定时器 Mock
vi.useFakeTimers();

// 全局对象 Mock
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});
```

## 测试数据管理

```javascript
// tests/fixtures/users.js
module.exports = {
  validUser: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user'
  },
  adminUser: {
    id: '2',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin'
  },
  invalidUser: {
    username: '',  // 无效：空用户名
    email: 'invalid-email'  // 无效：错误邮箱格式
  }
};
```

## 常用命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- src/utils/formatDate.test.js

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试并监视文件变化
npm run test:watch

# 运行特定类型的测试
npm run test:unit
npm run test:integration
```

## 测试检查清单

- [ ] 测试用例独立，不依赖执行顺序
- [ ] 测试数据准备和清理完善
- [ ] 边界条件已覆盖
- [ ] 错误路径已测试
- [ ] 异步代码正确处理
- [ ] Mock 使用恰当，不过度 Mock
- [ ] 测试名称清晰描述测试目的
- [ ] 测试执行速度快
