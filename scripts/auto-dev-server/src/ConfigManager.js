/**
 * 配置管理器
 * 负责加载和管理 Auto Dev Server 的配置
 */

const { cosmiconfig } = require('cosmiconfig');
const path = require('path');

class ConfigManager {
  constructor() {
    this.defaultConfig = {
      // 前端配置
      frontend: {
        command: 'npm run dev',
        cwd: '.', // 当前目录
        port: 5174,
        checkUrl: 'http://localhost:5174',
        timeout: 30000 // 30秒超时
      },
      
      // 后端配置
      backend: {
        command: 'node server/server.js',
        cwd: './server',
        port: 5001,
        checkUrl: 'http://localhost:5001/api/monitoring/health',
        timeout: 30000
      },
      
      // 通用配置
      common: {
        logLevel: 'info', // debug, info, warn, error
        autoRestart: true,
        restartDelay: 2000, // 重启延迟毫秒
        maxRetries: 3 // 最大重试次数
      }
    };
    
    this.currentConfig = { ...this.defaultConfig };
  }

  /**
   * 加载配置文件
   * 支持 .auto-dev-serverrc, .auto-dev-server.json, package.json 中的 autoDevServer 字段
   */
  async loadConfig(searchPath = process.cwd()) {
    try {
      const explorer = cosmiconfig('auto-dev-server');
      const result = await explorer.search(searchPath);
      
      if (result && result.config) {
        this.currentConfig = this.mergeConfig(this.defaultConfig, result.config);
        console.log('✅ 配置文件加载成功');
        return this.currentConfig;
      } else {
        console.log('ℹ️  未找到配置文件，使用默认配置');
        return this.defaultConfig;
      }
    } catch (error) {
      console.warn('⚠️  配置文件加载失败:', error.message);
      console.log('ℹ️  使用默认配置');
      return this.defaultConfig;
    }
  }

  /**
   * 合并配置对象
   */
  mergeConfig(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };
    
    // 深度合并
    for (const key in userConfig) {
      if (userConfig[key] && typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
        merged[key] = this.mergeConfig(merged[key] || {}, userConfig[key]);
      } else {
        merged[key] = userConfig[key];
      }
    }
    
    return merged;
  }

  /**
   * 获取配置
   */
  getConfig() {
    return this.currentConfig;
  }

  /**
   * 获取前端配置
   */
  getFrontendConfig() {
    return this.currentConfig.frontend;
  }

  /**
   * 获取后端配置
   */
  getBackendConfig() {
    return this.currentConfig.backend;
  }

  /**
   * 获取通用配置
   */
  getCommonConfig() {
    return this.currentConfig.common;
  }

  /**
   * 验证配置的有效性
   */
  validateConfig(config = this.currentConfig) {
    const errors = [];
    
    // 验证必需字段
    if (!config.frontend.command) {
      errors.push('frontend.command 是必需的');
    }
    
    if (!config.backend.command) {
      errors.push('backend.command 是必需的');
    }
    
    if (!config.frontend.port || config.frontend.port <= 0) {
      errors.push('frontend.port 必须是正整数');
    }
    
    if (!config.backend.port || config.backend.port <= 0) {
      errors.push('backend.port 必须是正整数');
    }
    
    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  /**
   * 创建默认配置文件
   */
  createDefaultConfigFile(filePath = path.join(process.cwd(), '.auto-dev-server.json')) {
    const fs = require('fs');
    
    const defaultConfigFile = {
      // 前端服务配置
      frontend: {
        command: "npm run dev",
        cwd: ".",
        port: 5174,
        checkUrl: "http://localhost:5174",
        timeout: 30000
      },
      
      // 后端服务配置
      backend: {
        command: "node server/server.js",
        cwd: "./server",
        port: 5001,
        checkUrl: "http://localhost:5001/api/monitoring/health",
        timeout: 30000
      },
      
      // 通用配置
      common: {
        logLevel: "info",
        autoRestart: true,
        restartDelay: 2000,
        maxRetries: 3
      }
    };
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultConfigFile, null, 2));
      console.log(`✅ 默认配置文件已创建: ${filePath}`);
      return filePath;
    } catch (error) {
      throw new Error(`创建配置文件失败: ${error.message}`);
    }
  }
}

module.exports = ConfigManager;