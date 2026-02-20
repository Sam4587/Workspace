# 开发快速参考卡

> 一页纸速查，开发时放在手边

---

## 一、开发流程（7 步）

```
需求分析 → 技术设计 → 任务拆分 → 编码实现 → 测试验证 → 代码提交 → 文档更新
```

---

## 二、文档模板（复制即用）

### 需求文档 (requirements.md)

```markdown
# 需求文档

## 需求1: {标题}

**用户故事:** AS {角色}, I WANT {功能}, SO THAT {价值}

### 验收标准
1. WHEN {条件} THEN SHALL {行为}
2. IF {异常} THEN SHALL {处理}
```

### 设计文档 (design.md)

```markdown
# 设计文档

## 模块划分

| 模块 | 文件 | 职责 |
|------|------|------|
| xxx | path/to/file.js | xxx |

## API 设计
POST /api/xxx
Request: { field: type }
Response: { field: type }
```

### 任务清单 (tasklist.md)

```markdown
# 任务清单

## 第一阶段

- [ ] **任务1**: 描述
  - 验收: xxx
- [ ] **任务2**: 描述
  - 验收: xxx
```

---

## 三、验收标准格式

| 关键字 | 用途 | 示例 |
|--------|------|------|
| WHEN | 触发条件 | WHEN 用户点击按钮 |
| THEN SHALL | 预期行为 | THEN SHALL 显示结果 |
| IF | 异常条件 | IF 网络错误 |
| WHILE | 持续状态 | WHILE 加载中 |

---

## 四、常用命令

```bash
# 启动开发环境
cd server && node simple-server.js  # 后端
npm run dev                          # 前端

# Git 操作
git pull origin master    # 拉取
git add .                 # 暂存
git commit -m "feat: xxx" # 提交
git push origin master    # 推送

# 健康检查
curl http://localhost:5001/api/health
```

---

## 五、服务地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5174 |
| 后端 | http://localhost:5001 |

---

## 六、渐进式开发法

**不要一次读完所有文档！**

| 阶段 | 只看 | 时间 |
|------|------|------|
| 开始前 | 需求文档的验收标准 | 5 分钟 |
| 开发中 | 设计文档的模块划分 | 按需 |
| 完成后 | 任务清单确认完成 | 2 分钟 |

---

## 七、遇到问题？

| 问题 | 解决方案 |
|------|----------|
| 设计不合理 | 代码注释 `// TODO: 设计变更`，完成后更新文档 |
| 任务遗漏 | 每日结束时更新 tasklist.md |
| 文档太长 | 只看当前任务相关部分 |

---

**详细规范**: `docs/dev/SPEC_STANDARDS.md`
**完整流程**: `docs/02-development/workflow.md`
