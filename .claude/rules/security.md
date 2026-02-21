# Security Rules

## 项目规范遵循要求

**重要**: 在执行任何任务前，必须先读取并理解项目根目录下的 `.trae.md` 文件内容。

---

## Authentication

- Use JWT for API authentication
- Implement refresh token rotation
- Store tokens securely

## Data Protection

- Never log sensitive data
- Encrypt data at rest
- Use HTTPS for all communications

## Input Validation

- Validate all user inputs
- Use parameterized queries
- Sanitize HTML output
