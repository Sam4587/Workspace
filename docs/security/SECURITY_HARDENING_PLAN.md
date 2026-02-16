# 安全加固执行计划

> **创建时间**: 2026-02-16  
> **优先级**: P0（紧急）  
> **预计完成时间**: 1-2天  

---

## 🎯 安全加固任务清单

### SEC-001: 移除所有硬编码密钥 ✅ 部分完成
**当前状态**: 认证路由已修正，但仍需全面检查

**具体任务**:
- [x] `server/routes/auth.js` 已修正JWT_SECRET和管理员凭证读取方式
- [ ] 检查所有服务文件中的硬编码密钥
- [ ] 确保所有敏感配置都来自环境变量
- [ ] 移除代码仓库中的任何密钥痕迹

**验收标准**:
```
WHEN 运行代码扫描工具 THEN SHALL 不发现任何硬编码密钥
WHEN 查看Git历史 THEN SHALL 不包含敏感信息
WHEN 启动应用 THEN SHALL 正确读取环境变量配置
```

### SEC-002: 完善JWT认证体系 ⚠️ 部分完成
**当前状态**: 基础JWT实现已完成，需要增强

**具体任务**:
- [ ] 实现JWT刷新令牌机制
- [ ] 添加JWT黑名单/白名单管理
- [ ] 实现多设备登录控制
- [ ] 添加JWT过期时间配置
- [ ] 实现JWT签名算法强化（RS256替代HS256）

**技术细节**:
```javascript
// 需要实现的功能
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  algorithm: 'RS256' // 更安全的非对称加密
};
```

### SEC-003: 实现API速率限制 ⚠️ 代码存在但未启用
**当前状态**: server.js中已引入rateLimit但需要配置优化

**具体任务**:
- [ ] 优化速率限制配置（区分API类型）
- [ ] 实现IP白名单机制
- [ ] 添加自适应限流策略
- [ ] 实现详细的限流日志记录

**配置建议**:
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 白名单IP跳过限制
    return WHITELIST_IPS.includes(req.ip);
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 认证接口更严格
  message: { error: '认证尝试过于频繁' }
});
```

### SEC-004: 添加请求验证中间件 ❌ 未开始
**当前状态**: 需要全新实现

**具体任务**:
- [ ] 实现输入数据验证中间件
- [ ] 添加SQL注入防护
- [ ] 实现XSS防护
- [ ] 添加CSRF保护
- [ ] 实现请求大小限制

**技术实现**:
```javascript
// 输入验证中间件
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        details: error.details
      });
    }
    next();
  };
};

// XSS防护
app.use(helmet.xssFilter());
app.use(helmet.noSniff());

// 请求大小限制
app.use(express.json({ limit: '10mb' }));
```

---

## 🔧 实施步骤

### 第一阶段：立即执行（今日完成）
1. **环境变量配置检查**
   ```bash
   # 检查必需环境变量
   node -e "
   const required = ['JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
   const missing = required.filter(key => !process.env[key]);
   if (missing.length) {
     console.error('❌ 缺少必需环境变量:', missing);
     process.exit(1);
   }
   console.log('✅ 环境变量配置完整');
   "
   ```

2. **代码扫描**
   ```bash
   # 使用git-secrets扫描历史提交
   git secrets --scan-history
   
   # 使用grep查找可能的密钥
   grep -r "sk-" . --exclude-dir=node_modules
   grep -r "apikey" . --exclude-dir=node_modules
   ```

### 第二阶段：24小时内完成
1. **JWT体系增强**
2. **速率限制优化**
3. **基础安全中间件部署**

### 第三阶段：48小时内完成
1. **全面安全测试**
2. **安全文档更新**
3. **团队培训**

---

## 🛡️ 安全配置检查清单

### 必需配置项
| 配置项 | 状态 | 说明 |
|--------|------|------|
| `JWT_SECRET` | ⚠️ 必需 | 至少64字符的随机字符串 |
| `ADMIN_USERNAME` | ⚠️ 必需 | 管理员用户名 |
| `ADMIN_PASSWORD` | ⚠️ 必需 | 强密码（至少12位） |
| `NODE_ENV` | ⚠️ 必需 | production/development |

### 推荐安全配置
| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| `LOG_LEVEL` | debug | warn |
| `CORS_ORIGIN` | * | 具体域名 |
| `PORT` | 5000 | 443(HTTPS) |
| `NODE_TLS_REJECT_UNAUTHORIZED` | 0 | 1 |

---

## 🧪 测试验证计划

### 安全测试用例

1. **JWT安全测试**
   ```
   GIVEN 无效的JWT令牌
   WHEN 访问受保护API
   THEN SHALL 返回401未授权
   
   GIVEN 过期的JWT令牌
   WHEN 访问受保护API
   THEN SHALL 返回401未授权
   ```

2. **速率限制测试**
   ```
   GIVEN 同一IP连续发送100+请求
   WHEN 在15分钟窗口期内
   THEN SHALL 在第101次请求时被限制
   ```

3. **输入验证测试**
   ```
   GIVEN 包含恶意脚本的输入
   WHEN 提交到API
   THEN SHALL 被拒绝并返回400错误
   ```

---

## 📋 应急响应预案

### 安全事件处理流程
1. **发现安全漏洞** → 立即隔离受影响服务
2. **评估影响范围** → 确定数据泄露程度
3. **修复漏洞** → 应用安全补丁
4. **通知相关人员** → 按预案通知团队和用户
5. **事后分析** → 记录事件并改进防护措施

### 关键联系人
- 安全负责人: [待指定]
- 技术负责人: [待指定]
- 运维负责人: [待指定]

---

## 📚 相关文档
- [.env.example](../../server/.env.example) - 环境变量模板
- [auth.js](../../server/routes/auth.js) - 认证路由实现
- [server.js](../../server/server.js) - 主服务器配置

---

**负责人**: [待指定]  
**预计完成时间**: 2026-02-18  
**最后更新**: 2026-02-16