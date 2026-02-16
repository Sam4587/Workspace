/**
 * 环境变量配置加载器
 * 统一管理不同环境下的配置加载和验证
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

class ConfigLoader {
  constructor() {
    this.config = {};
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * 加载所有环境配置
   */
  load() {
    console.log(`[ConfigLoader] Loading configuration for environment: ${this.environment}`);
    
    // 1. 加载基础配置
    this.loadBaseConfig();
    
    // 2. 加载环境特定配置
    this.loadEnvironmentConfig();
    
    // 3. 合并所有环境变量到配置对象
    this.mergeProcessEnv();
    
    // 4. 验证必要配置
    this.validateRequired();
    
    // 5. 应用默认值
    this.applyDefaults();
    
    console.log('[ConfigLoader] Configuration loaded successfully');
    return this.config;
  }

  /**
   * 加载基础环境变量
   */
  loadBaseConfig() {
    const basePath = path.resolve(__dirname, '../.env');
    
    if (fs.existsSync(basePath)) {
      const result = dotenv.config({ path: basePath });
      if (result.error) {
        console.warn('[ConfigLoader] Failed to load base config:', result.error.message);
      } else {
        console.log('[ConfigLoader] Base configuration loaded');
        // 立即合并到配置对象
        this.mergeProcessEnv();
      }
    } else {
      console.warn('[ConfigLoader] Base .env file not found');
    }
  }

  /**
   * 加载环境特定配置
   */
  loadEnvironmentConfig() {
    const envPath = path.resolve(__dirname, `../.env.${this.environment}`);
    
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath });
      if (result.error) {
        console.warn(`[ConfigLoader] Failed to load ${this.environment} config:`, result.error.message);
      } else {
        console.log(`[ConfigLoader] ${this.environment} configuration loaded`);
      }
    } else {
      console.log(`[ConfigLoader] Environment config file not found: ${envPath}`);
    }
    
    // 重新合并环境变量（环境特定配置优先级更高）
    this.mergeProcessEnv();
  }

  /**
   * 合并进程环境变量到配置对象
   */
  mergeProcessEnv() {
    Object.keys(process.env).forEach(key => {
      this.config[key] = process.env[key];
    });
  }

  /**
   * 验证必要配置项
   */
  validateRequired() {
    const required = [
      'JWT_SECRET',
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD'
    ];

    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // 验证JWT密钥强度
    if (this.config.JWT_SECRET && this.config.JWT_SECRET.length < 32) {
      console.warn('[ConfigLoader] JWT_SECRET should be at least 32 characters long for security');
    }

    console.log('[ConfigLoader] Required configuration validated');
  }

  /**
   * 应用默认值
   */
  applyDefaults() {
    const defaults = {
      PORT: '5001',
      NODE_ENV: 'development',
      LOG_LEVEL: 'info',
      CORS_ORIGIN: 'http://localhost:5174',
      TRACKING_INTERVAL: '3600000',
      TRACKING_CONCURRENT: '5',
      TRACKING_BATCH_SIZE: '10'
    };

    Object.keys(defaults).forEach(key => {
      if (!this.config[key]) {
        this.config[key] = defaults[key];
        console.log(`[ConfigLoader] Applied default value for ${key}: ${defaults[key]}`);
      }
    });
  }

  /**
   * 获取配置值
   * @param {string} key - 配置键
   * @param {*} defaultValue - 默认值
   */
  get(key, defaultValue = null) {
    return this.config[key] || defaultValue;
  }

  /**
   * 获取数字类型的配置值
   * @param {string} key - 配置键
   * @param {number} defaultValue - 默认值
   */
  getNumber(key, defaultValue = 0) {
    const value = this.config[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  /**
   * 获取布尔类型的配置值
   * @param {string} key - 配置键
   * @param {boolean} defaultValue - 默认值
   */
  getBoolean(key, defaultValue = false) {
    const value = this.config[key];
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    return value.toString().toLowerCase() === 'true';
  }

  /**
   * 获取数组类型的配置值
   * @param {string} key - 配置键
   * @param {string} separator - 分隔符
   * @param {Array} defaultValue - 默认值
   */
  getArray(key, separator = ',', defaultValue = []) {
    const value = this.config[key];
    if (!value) return defaultValue;
    return value.split(separator).map(item => item.trim()).filter(item => item);
  }

  /**
   * 获取当前环境
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment() {
    return this.environment === 'development';
  }

  /**
   * 检查是否为生产环境
   */
  isProduction() {
    return this.environment === 'production';
  }

  /**
   * 检查是否为测试环境
   */
  isTest() {
    return this.environment === 'test';
  }

  /**
   * 获取数据库配置
   */
  getDatabaseConfig() {
    return {
      host: this.get('DB_HOST', 'localhost'),
      port: this.getNumber('DB_PORT', 27017),
      name: this.get('DB_NAME', `ai_content_${this.environment}`),
      user: this.get('DB_USER'),
      password: this.get('DB_PASSWORD')
    };
  }

  /**
   * 获取Redis配置
   */
  getRedisConfig() {
    return {
      host: this.get('REDIS_HOST', 'localhost'),
      port: this.getNumber('REDIS_PORT', 6379),
      password: this.get('REDIS_PASSWORD'),
      db: this.getNumber('REDIS_DB', 0)
    };
  }

  /**
   * 获取JWT配置
   */
  getJwtConfig() {
    return {
      secret: this.get('JWT_SECRET'),
      accessTokenExpiresIn: this.get('JWT_ACCESS_TOKEN_EXPIRES', '24h'),
      refreshTokenExpiresIn: this.get('JWT_REFRESH_TOKEN_EXPIRES', '7d')
    };
  }

  /**
   * 输出配置摘要（隐藏敏感信息）
   */
  getConfigSummary() {
    const sensitiveKeys = [
      'JWT_SECRET',
      'ADMIN_PASSWORD',
      'DB_PASSWORD',
      'REDIS_PASSWORD',
      'OPENAI_API_KEY',
      'QWEN_API_KEY',
      // 添加其他敏感配置键
    ];

    const summary = { ...this.config };
    
    // 隐藏敏感信息
    sensitiveKeys.forEach(key => {
      if (summary[key]) {
        summary[key] = '[HIDDEN]';
      }
    });

    return summary;
  }
}

// 创建单例实例
const configLoader = new ConfigLoader();

module.exports = configLoader;