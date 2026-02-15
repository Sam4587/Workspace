---
name: "code-review"
description: "执行标准化代码审查，确保代码质量、安全性和可维护性。在代码提交前、合并请求时或用户要求代码审查时调用。"
---

# 代码审查规范

本 Skill 定义了标准化的代码审查流程，确保所有提交的代码符合团队质量标准。

## 审查触发条件

1. 功能开发完成后准备提交
2. 合并请求（Pull Request）创建时
3. 用户主动要求审查代码
4. 定期代码质量检查

## 审查维度

### 1. 功能性审查 (Functionality)

**检查要点**：
- [ ] 代码实现了需求文档中描述的功能
- [ ] 边界条件已正确处理
- [ ] 错误处理机制完善
- [ ] 没有明显的逻辑错误

**审查方法**：
1. 对照需求文档检查功能完整性
2. 检查条件分支是否覆盖所有场景
3. 验证错误处理路径

### 2. 代码质量审查 (Code Quality)

**检查要点**：
- [ ] 代码遵循项目 ESLint/Prettier 规范
- [ ] 命名清晰、有意义
- [ ] 函数/组件职责单一
- [ ] 代码重复度低（DRY 原则）
- [ ] 复杂度适中（避免过深的嵌套）

**命名规范检查**：
```javascript
// 正确示例
const userProfile = { name: '张三', age: 25 };
function calculateTotalPrice(items) { }
class UserService { }

// 错误示例
const data = { name: '张三' };  // 太笼统
function calc(items) { }        // 缩写不清晰
class Service { }               // 太笼统
```

### 3. 安全性审查 (Security)

**检查要点**：
- [ ] 没有硬编码的敏感信息（密码、密钥、Token）
- [ ] 用户输入已验证和转义
- [ ] 防止 SQL 注入、XSS 攻击
- [ ] 权限检查到位
- [ ] 没有暴露内部实现细节

**安全检查清单**：
```javascript
// 输入验证
const userId = req.params.id;
if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
  return res.status(400).json({ error: 'Invalid user ID format' });
}

// SQL 注入防护 - 使用参数化查询
// 正确
db.query('SELECT * FROM users WHERE id = ?', [userId]);
// 错误
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// XSS 防护 - 输出转义
// 正确
element.textContent = userInput;
// 错误
element.innerHTML = userInput;
```

### 4. 性能审查 (Performance)

**检查要点**：
- [ ] 没有不必要的重复计算
- [ ] 大数据集使用分页或虚拟滚动
- [ ] 避免内存泄漏
- [ ] 异步操作有错误处理

**性能优化检查**：
```javascript
// 避免重复计算 - 使用 useMemo
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.score - a.score);
}, [data]);

// 避免不必要重渲染 - 使用 useCallback
const handleClick = useCallback(() => {
  onItemSelect(id);
}, [id, onItemSelect]);
```

### 5. 可维护性审查 (Maintainability)

**检查要点**：
- [ ] 代码有适当的注释
- [ ] 复杂逻辑有文档说明
- [ ] 测试覆盖率高
- [ ] 配置与代码分离

**文档要求**：
```javascript
/**
 * 计算用户积分
 * @param {number} baseScore - 基础分数
 * @param {number} multiplier - 倍数
 * @param {string} level - 用户等级
 * @returns {number} 最终积分
 * @throws {Error} 当参数无效时抛出
 */
function calculateScore(baseScore, multiplier, level) {
  // 实现...
}
```

## 审查流程

### 步骤 1：准备审查
1. 获取待审查的代码变更
2. 阅读相关的需求文档和设计文档
3. 了解代码的上下文和目的

### 步骤 2：执行审查
按照以下顺序进行审查：
1. 功能性审查 - 代码是否正确实现了功能
2. 安全性审查 - 是否存在安全隐患
3. 代码质量审查 - 是否符合编码规范
4. 性能审查 - 是否存在性能问题
5. 可维护性审查 - 是否易于维护

### 步骤 3：记录问题
使用以下格式记录发现的问题：

```markdown
## 审查结果

### 严重问题 (Critical) - 必须修复
- [ ] [文件名]:[行号] - [问题描述] - [修复建议]

### 警告 (Warning) - 建议修复
- [ ] [文件名]:[行号] - [问题描述] - [修复建议]

### 建议 (Suggestion) - 可选优化
- [ ] [文件名]:[行号] - [问题描述] - [修复建议]

### 通过项
- [x] [检查项名称]
```

### 步骤 4：反馈与跟踪
1. 将审查结果反馈给开发者
2. 跟踪问题修复情况
3. 修复完成后进行复查

## 审查标准

### 通过标准
- 没有严重问题
- 警告项不超过 3 个
- 所有功能性检查项通过

### 不通过标准
- 存在任何严重问题
- 警告项超过 5 个
- 功能性检查项未通过

## 常见问题及修复建议

### 问题 1：魔法数字
```javascript
// 问题代码
if (status === 3) { }

// 修复建议
const STATUS_COMPLETED = 3;
if (status === STATUS_COMPLETED) { }
```

### 问题 2：过长函数
```javascript
// 问题代码
function processUserData(user) {
  // 100+ 行代码...
}

// 修复建议
function validateUser(user) { }
function transformUserData(user) { }
function saveUserData(user) { }

function processUserData(user) {
  validateUser(user);
  const transformed = transformUserData(user);
  return saveUserData(transformed);
}
```

### 问题 3：未处理的 Promise
```javascript
// 问题代码
fetchUserData(userId).then(data => {
  console.log(data);
});

// 修复建议
async function loadUserData(userId) {
  try {
    const data = await fetchUserData(userId);
    console.log(data);
  } catch (error) {
    logger.error('Failed to load user data:', error);
    throw new UserDataLoadError(error.message);
  }
}
```

## 审查工具

```bash
# 运行 ESLint 检查
npm run lint

# 运行测试
npm test

# 检查测试覆盖率
npm run test:coverage
```
