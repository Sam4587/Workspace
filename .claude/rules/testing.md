# Testing Rules

## 项目规范遵循要求

**重要**: 在执行任何任务前，必须先读取并理解项目根目录下的 `.trae.md` 文件内容。

---

## Coverage Requirements

| Metric | Minimum | Target |
|--------|---------|--------|
| Statements | 70% | 80% |
| Branches | 60% | 75% |
| Functions | 70% | 85% |

## Test Types

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test API endpoints
- **E2E Tests**: Test critical user flows

## Naming Convention

```typescript
describe('FunctionName', () => {
  it('should do something when condition', () => {
    // test
  });
});
```
