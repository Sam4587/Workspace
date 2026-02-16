/**
 * 请求验证中间件
 * 提供通用的数据验证功能
 */

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

/**
 * 验证必填字段
 * @param {Array} requiredFields - 必填字段数组
 * @returns {Function} Express中间件
 */
function validateRequired(requiredFields) {
  return (req, res, next) => {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        errors.push(`字段 '${field}' 是必填的`);
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 验证数据类型
 * @param {Object} schema - 验证模式 { fieldName: 'string|number|boolean|array|object' }
 * @returns {Function} Express中间件
 */
function validateTypes(schema) {
  return (req, res, next) => {
    const errors = [];
    
    Object.keys(schema).forEach(field => {
      const expectedType = schema[field];
      const value = req.body[field];
      
      if (value !== undefined && value !== null) {
        let isValid = false;
        
        switch (expectedType.toLowerCase()) {
          case 'string':
            isValid = typeof value === 'string';
            break;
          case 'number':
            isValid = typeof value === 'number' && !isNaN(value);
            break;
          case 'boolean':
            isValid = typeof value === 'boolean';
            break;
          case 'array':
            isValid = Array.isArray(value);
            break;
          case 'object':
            isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
            break;
          default:
            errors.push(`未知的数据类型: ${expectedType}`);
            return;
        }
        
        if (!isValid) {
          errors.push(`字段 '${field}' 必须是 ${expectedType} 类型`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '数据类型验证失败',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 验证字符串长度
 * @param {Object} lengthRules - 长度规则 { fieldName: { min: 1, max: 100 } }
 * @returns {Function} Express中间件
 */
function validateStringLength(lengthRules) {
  return (req, res, next) => {
    const errors = [];
    
    Object.keys(lengthRules).forEach(field => {
      const rules = lengthRules[field];
      const value = req.body[field];
      
      if (value !== undefined && typeof value === 'string') {
        const length = value.length;
        
        if (rules.min !== undefined && length < rules.min) {
          errors.push(`字段 '${field}' 长度不能少于 ${rules.min} 个字符`);
        }
        
        if (rules.max !== undefined && length > rules.max) {
          errors.push(`字段 '${field}' 长度不能超过 ${rules.max} 个字符`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '字符串长度验证失败',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 验证数值范围
 * @param {Object} rangeRules - 范围规则 { fieldName: { min: 0, max: 100 } }
 * @returns {Function} Express中间件
 */
function validateNumberRange(rangeRules) {
  return (req, res, next) => {
    const errors = [];
    
    Object.keys(rangeRules).forEach(field => {
      const rules = rangeRules[field];
      const value = req.body[field];
      
      if (value !== undefined && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`字段 '${field}' 不能小于 ${rules.min}`);
        }
        
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`字段 '${field}' 不能大于 ${rules.max}`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '数值范围验证失败',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 验证邮箱格式
 * @param {Array} emailFields - 邮箱字段数组
 * @returns {Function} Express中间件
 */
function validateEmail(emailFields) {
  return (req, res, next) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    emailFields.forEach(field => {
      const value = req.body[field];
      
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          errors.push(`字段 '${field}' 必须是有效的邮箱地址`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式验证失败',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 验证手机号格式
 * @param {Array} phoneFields - 手机号字段数组
 * @returns {Function} Express中间件
 */
function validatePhone(phoneFields) {
  return (req, res, next) => {
    const errors = [];
    const phoneRegex = /^1[3-9]\d{9}$/; // 中国手机号格式
    
    phoneFields.forEach(field => {
      const value = req.body[field];
      
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string' || !phoneRegex.test(value)) {
          errors.push(`字段 '${field}' 必须是有效的手机号`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '手机号格式验证失败',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 验证URL格式
 * @param {Array} urlFields - URL字段数组
 * @returns {Function} Express中间件
 */
function validateUrl(urlFields) {
  return (req, res, next) => {
    const errors = [];
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    urlFields.forEach(field => {
      const value = req.body[field];
      
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string' || !urlRegex.test(value)) {
          errors.push(`字段 '${field}' 必须是有效的URL`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'URL格式验证失败',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 组合多个验证器
 * @param {...Function} validators - 验证器函数数组
 * @returns {Function} Express中间件
 */
function validate(...validators) {
  return (req, res, next) => {
    for (const validator of validators) {
      // 由于每个验证器都会发送响应或调用next()，我们需要特殊的处理方式
      // 这里我们创建一个包装函数来捕获验证结果
      const originalJson = res.json;
      let validationError = null;
      
      res.json = function(data) {
        if (data && data.success === false && data.errors) {
          validationError = data;
          return;
        }
        return originalJson.call(this, data);
      };
      
      validator(req, res, () => {});
      
      if (validationError) {
        return res.status(400).json(validationError);
      }
    }
    
    next();
  };
}

/**
 * 验证JWT令牌格式
 * @returns {Function} Express中间件
 */
function validateJwtToken() {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '缺少访问令牌',
        timestamp: new Date().toISOString()
      });
    }
    
    // 简单的JWT格式验证（实际验证由auth中间件处理）
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        success: false,
        message: '无效的令牌格式',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

module.exports = {
  ValidationError,
  validateRequired,
  validateTypes,
  validateStringLength,
  validateNumberRange,
  validateEmail,
  validatePhone,
  validateUrl,
  validateJwtToken,
  validate
};