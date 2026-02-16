# AI 开发者行为准则

> 本文档定义 AI 开发者在项目中必须遵守的行为准则，确保代码质量和用户体验。

## 核心原则

### 1. 真实数据优先

**禁止行为**:
- 在核心功能中使用硬编码 Mock 数据
- 在 API 失败时静默返回假数据
- 用假数据掩盖系统问题

**正确做法**:
- 使用真实 API 或数据源
- API 失败时返回 `success: false` 和空数据
- 让用户知道真实情况

**示例**:

```javascript
// 错误 - 禁止
async function getData() {
  try {
    return await api.fetch();
  } catch (error) {
    return mockData; // 禁止返回假数据
  }
}

// 正确
async function getData() {
  try {
    return { success: true, data: await api.fetch() };
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}
```

### 2. 问题透明化

**禁止行为**:
- 隐藏错误信息
- 用 `success: true` 掩盖失败
- 静默忽略异常

**正确做法**:
- 记录详细错误日志
- 返回明确的错误信息
- 在 UI 上显示错误状态

### 3. 先咨询后行动

**必须咨询用户的场景**:
- 涉及数据源选择（真实数据 vs Mock 数据）
- 架构重大变更
- 删除现有功能
- 引入新的外部依赖
- 修改用户可见的行为

**咨询方式**:
```
我注意到需要 [具体操作]，这会 [影响]。
您希望我：
A. [选项A]
B. [选项B]
请确认您的选择。
```

## 代码规范

### 错误处理

```javascript
// 标准错误处理模式
async function operation() {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    logger.error('操作失败:', error);
    return { 
      success: false, 
      message: error.message,
      data: null 
    };
  }
}
```

### 数据获取

```javascript
// 标准数据获取模式
async function fetchData() {
  // 1. 尝试主数据源
  let data = await tryPrimarySource();
  
  // 2. 主数据源失败，尝试备用
  if (!data || data.length === 0) {
    data = await tryFallbackSource();
  }
  
  // 3. 都失败，返回空（不是假数据）
  if (!data || data.length === 0) {
    return { success: false, data: [], message: '暂无数据' };
  }
  
  return { success: true, data };
}
```

### 日志记录

```javascript
// 使用统一的 logger
const logger = require('../utils/logger');

// 正确的日志级别
logger.error('严重错误，需要关注');  // 错误
logger.warn('警告，可能有问题');     // 警告
logger.info('正常信息');            // 信息
logger.debug('调试信息');           // 调试
```

## 文档规范

### 问题修复记录

每次修复重要问题后，必须在 `docs/dev/` 创建 `ISSUE_*.md` 文档：

```markdown
# [问题简述]

## 问题概述
- 发现时间
- 问题模块
- 严重程度

## 问题表现
具体描述用户看到的现象

## 问题根因分析
深入分析问题原因

## 修复方案
具体的代码修改

## 经验教训
总结避免类似问题的方法
```

### 功能规格文档

新功能必须在 `docs/specs/` 创建规格文档：

```
specs/{feature-name}/
├── requirements.md   # WHEN-THEN-SHALL 格式需求
├── design.md         # 技术设计
└── tasklist.md       # 实现任务清单
```

## 检查清单

### 提交前检查

- [ ] 没有硬编码 Mock 数据
- [ ] 错误处理返回正确状态
- [ ] 日志记录完整
- [ ] 相关文档已更新
- [ ] 没有引入新的安全风险

### 功能完成检查

- [ ] 主流程正常工作
- [ ] 错误情况正确处理
- [ ] 边界情况考虑周全
- [ ] 用户体验良好
- [ ] 文档完整

## 违规处理

### 严重违规

- 在核心功能使用假数据
- 隐藏系统错误
- 删除用户数据

**处理**: 立即修复，创建问题记录文档

### 一般违规

- 日志记录不完整
- 错误信息不清晰
- 文档未更新

**处理**: 尽快修复，更新文档

---

**版本**: 1.0  
**生效日期**: 2026-02-16  
**适用范围**: 所有 AI 开发者
