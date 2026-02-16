# 环境变量标准化管理规范

## 📅 文档版本
**版本**: 1.0  
**最后更新**: 2026年2月16日  
**作者**: AI开发团队

## 🎯 目标
建立统一的环境变量管理体系，确保不同环境下的配置一致性、安全性和可维护性。

## 📋 环境分类标准

### 开发环境 (development)
- 用于本地开发和调试
- 启用详细日志和调试信息
- 使用开发数据库和缓存
- 允许宽松的安全设置

### 测试环境 (test)
- 用于自动化测试和集成测试
- 模拟生产环境配置
- 使用独立的测试数据库
- 启用测试专用功能

### 生产环境 (production)
- 面向最终用户的正式环境
- 启用最高安全级别
- 使用正式数据库和缓存
- 严格的错误处理和日志记录

## 🔧 环境变量命名规范

### 命名约定
```
[服务前缀]_[功能模块]_[具体配置]
```

### 示例
```
# 数据库配置
DB_HOST=localhost
DB_PORT=27017
DB_NAME=ai_content_dev

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## 📁 配置文件结构

### 基础配置文件
```
server/
├── .env                    # 基础环境变量（git忽略）
├── .env.example           # 环境变量模板（git提交）
├── .env.development       # 开发环境配置
├── .env.test             # 测试环境配置
└── .env.production       # 生产环境配置
```

### 环境变量加载顺序
1. `.env` - 基础配置
2. `.env.[NODE_ENV]` - 环境特定配置
3. 系统环境变量 - 最高优先级

## 🔐 安全配置要求

### 必须加密的敏感信息
- JWT密钥
- 数据库密码
- API密钥
- 管理员密码
- 第三方服务凭证

### 安全实践
```
# ❌ 不安全的做法
JWT_SECRET=123456
ADMIN_PASSWORD=admin123

# ✅ 安全的做法
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=$(openssl rand -base64 12)
```

## 🚀 实施步骤

### 1. 创建环境变量模板
```bash
# 复制当前配置作为模板
cp server/.env server/.env.example

# 清除敏感信息
sed -i 's/JWT_SECRET=.*/JWT_SECRET=/' server/.env.example
sed -i 's/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=/' server/.env.example
```

### 2. 建立环境区分机制
```javascript
// server/config/environment.js
const environments = {
  development: {
    PORT: 5001,
    DB_NAME: 'ai_content_dev',
    LOG_LEVEL: 'debug'
  },
  test: {
    PORT: 5002,
    DB_NAME: 'ai_content_test',
    LOG_LEVEL: 'warn'
  },
  production: {
    PORT: 5001,
    DB_NAME: 'ai_content_prod',
    LOG_LEVEL: 'error'
  }
};

module.exports = environments[process.env.NODE_ENV || 'development'];
```

### 3. 配置加载机制
```javascript
// server/utils/configLoader.js
const dotenv = require('dotenv');
const path = require('path');

class ConfigLoader {
  static load() {
    // 加载基础配置
    dotenv.config();
    
    // 加载环境特定配置
    const env = process.env.NODE_ENV || 'development';
    dotenv.config({
      path: path.resolve(__dirname, `../.env.${env}`)
    });
    
    // 验证必要配置
    this.validateRequired();
  }
  
  static validateRequired() {
    const required = ['JWT_SECRET', 'DB_HOST'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

module.exports = ConfigLoader;
```

## ✅ 验证清单

### 配置完整性检查
- [ ] 所有环境都有对应的配置文件
- [ ] 敏感信息已从版本控制中移除
- [ ] 配置文件有清晰的注释说明
- [ ] 必要的环境变量都有默认值

### 安全性检查
- [ ] JWT密钥长度符合安全要求
- [ ] 管理员密码强度足够
- [ ] 数据库连接使用最小权限账户
- [ ] 生产环境禁用调试信息

### 可维护性检查
- [ ] 配置项命名清晰一致
- [ ] 有完整的配置文档
- [ ] 团队成员了解配置管理流程
- [ ] 配置变更有版本控制

## 📚 相关文档

- [标准化端口配置](STANDARD_PORT_CONFIGURATION.md)
- [开发工作流指南](dev/DEV_WORKFLOW.md)
- [安全加固计划](security/SECURITY_HARDENING_PLAN.md)

---
**维护者**: AI开发团队  
**联系方式**: dev-team@example.com