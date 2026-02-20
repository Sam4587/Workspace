# 安全加固快速执行指南

> **目标**: 24小时内完成核心安全加固任务

---

## 🚀 立即执行清单

### 1. 环境变量配置 (30分钟)
```bash
# 1. 复制环境变量模板
cp server/.env.example server/.env

# 2. 生成安全的JWT密钥
node -e "
const crypto = require('crypto');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
"

# 3. 编辑 .env 文件，填入必要配置
nano server/.env
```

**必需配置项**:
```
JWT_SECRET=你的64位随机字符串
ADMIN_USERNAME=你的管理员用户名
ADMIN_PASSWORD=你的强密码（至少12位）
```

### 2. 运行安全检查 (15分钟)
```bash
# 运行安全扫描脚本
node scripts/security-check.js

# 如果发现问题，根据报告修复
```

### 3. JWT体系增强 (2小时)
```javascript
// 在 server/routes/auth.js 中添加刷新令牌机制
const refreshTokens = new Map();

// 生成刷新令牌
function generateRefreshToken(userId) {
  const refreshToken = crypto.randomBytes(64).toString('hex');
  refreshTokens.set(refreshToken, { userId, expires: Date.now() + 7 * 24 * 3600 * 1000 });
  return refreshToken;
}

// 刷新令牌接口
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ success: false, message: '无效的刷新令牌' });
  }
  
  const tokenData = refreshTokens.get(refreshToken);
  if (tokenData.expires < Date.now()) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({ success: false, message: '刷新令牌已过期' });
  }
  
  // 生成新的访问令牌
  const newToken = jwt.sign(
    { userId: tokenData.userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ success: true, data: { token: newToken } });
});
```

### 4. 速率限制优化 (1小时)
```javascript
// 在 server/server.js 中优化速率限制
const rateLimit = require('express-rate-limit');

// 不同类型的API使用不同的限制策略
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 认证接口更严格（5次/15分钟）
  message: { error: '认证尝试过于频繁' }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 严格限制（10次/小时）
  message: { error: '操作过于频繁' }
});

// 应用到不同路由
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/sensitive/', strictLimiter);
```

### 5. 输入验证中间件 (2小时)
```bash
# 安装验证库
npm install joi
```

```javascript
// 创建验证中间件 server/middleware/validation.js
const Joi = require('joi');

const schemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(8).required()
  }),
  
  videoDownload: Joi.object({
    url: Joi.string().uri().required(),
    platform: Joi.string().valid('douyin', 'kuaishou', 'generic')
  }),
  
  contentGenerate: Joi.object({
    title: Joi.string().max(100).required(),
    content: Joi.string().max(5000).required(),
    platform: Joi.string().valid('xiaohongshu', 'douyin', 'toutiao').required()
  })
};

function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ success: false, message: '验证模式不存在' });
    }
    
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        details: error.details.map(d => d.message)
      });
    }
    
    next();
  };
}

module.exports = { validate };
```

```javascript
// 在路由中使用验证中间件
const { validate } = require('../middleware/validation');

router.post('/login', validate('login'), async (req, res) => {
  // 登录逻辑...
});

router.post('/video/download', validate('videoDownload'), async (req, res) => {
  // 视频下载逻辑...
});
```

---

## 🧪 验证测试

### 安全测试脚本
```bash
# 创建测试脚本 test/security.test.js
mkdir -p test
```

```javascript
// test/security.test.js
const request = require('supertest');
const app = require('../server/server');

describe('安全测试', () => {
  test('JWT令牌过期测试', async () => {
    // 使用过期令牌访问受保护接口
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer expired-token');
    
    expect(response.status).toBe(401);
  });

  test('速率限制测试', async () => {
    // 快速发送多个请求测试限流
    const promises = Array(20).fill().map(() => 
      request(app).post('/api/auth/login').send({
        username: 'test',
        password: 'test123'
      })
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('输入验证测试', async () => {
    // 测试恶意输入
    const response = await request(app)
      .post('/api/content/generate')
      .send({
        title: '<script>alert("xss")</script>',
        content: 'test',
        platform: 'invalid'
      });
    
    expect(response.status).toBe(400);
  });
});
```

---

## 📋 部署检查清单

### 部署前必做
- [ ] 环境变量已正确配置
- [ ] 安全检查脚本运行通过
- [ ] JWT密钥已更换为生产环境密钥
- [ ] 管理员密码已修改为强密码
- [ ] 所有API端点都有适当的速率限制
- [ ] 输入验证中间件已部署到关键接口

### 部署后验证
- [ ] 运行安全扫描确认无硬编码密钥
- [ ] 测试JWT认证流程
- [ ] 验证速率限制功能
- [ ] 检查错误日志中无敏感信息泄露
- [ ] 确认所有安全中间件正常工作

---

## 🆘 应急处理

### 发现安全漏洞时
1. **立即隔离**: 停止受影响的服务
2. **评估影响**: 确定数据泄露范围
3. **修复漏洞**: 应用安全补丁
4. **更换密钥**: 重新生成所有密钥
5. **通知团队**: 按预案通知相关人员

### 常用应急命令
```bash
# 快速重启服务
pm2 restart server

# 查看实时日志
pm2 logs server --lines 100

# 检查服务状态
pm2 status

# 紧急停止所有服务
pm2 stop all
```

---

**预计完成时间**: 6-8小时  
**风险等级**: 高（建议安排专门时间块执行）  
**回滚方案**: 保留当前配置备份，出现问题时可快速回滚