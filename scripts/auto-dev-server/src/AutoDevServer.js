/**
 * AutoDevServer 主控制器
 * 协调配置管理、进程管理和日志输出
 */

const ConfigManager = require('./ConfigManager');
const ProcessManager = require('./ProcessManager');
const { logger } = require('./Logger');

class AutoDevServer {
  constructor() {
    this.configManager = new ConfigManager();
    this.processManager = null;
    this.isRunning = false;
    this.shutdownInProgress = false;
    
    // 设置信号处理
    this.setupSignalHandlers();
  }

  /**
   * 初始化 AutoDevServer
   */
  async init(configPath = null) {
    try {
      logger.header('Auto Dev Server 初始化');
      
      // 加载配置
      const config = await this.configManager.loadConfig(configPath);
      this.configManager.validateConfig(config);
      
      // 初始化进程管理器
      this.processManager = new ProcessManager(this.configManager);
      
      // 设置日志级别
      const logLevel = this.configManager.getCommonConfig().logLevel;
      logger.setLevel(logLevel);
      
      logger.success('初始化完成');
      return true;
    } catch (error) {
      logger.error(`初始化失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 启动开发服务器
   */
  async start() {
    if (this.isRunning) {
      logger.warn('服务已经在运行中');
      return;
    }

    try {
      logger.header('启动开发服务器');
      
      this.isRunning = true;
      
      // 启动后端服务
      logger.info('正在启动后端服务...');
      await this.processManager.startBackend();
      
      // 等待一小段时间让后端稳定
      await this.delay(2000);
      
      // 启动前端服务
      logger.info('正在启动前端服务...');
      await this.processManager.startFrontend();
      
      // 显示服务状态
      this.showServiceStatus();
      
      logger.success('所有服务启动完成！');
      logger.info('按 Ctrl+C 停止所有服务');
      
    } catch (error) {
      logger.error(`启动失败: ${error.message}`);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 停止开发服务器
   */
  async stop() {
    if (this.shutdownInProgress) {
      return;
    }
    
    this.shutdownInProgress = true;
    
    try {
      logger.header('停止开发服务器');
      
      if (this.processManager) {
        this.processManager.stopAll();
      }
      
      this.isRunning = false;
      this.shutdownInProgress = false;
      
      logger.success('所有服务已停止');
      
    } catch (error) {
      logger.error(`停止过程中出现错误: ${error.message}`);
      this.shutdownInProgress = false;
      throw error;
    }
  }

  /**
   * 重启指定服务
   */
  async restart(serviceName) {
    if (!this.processManager) {
      throw new Error('服务未初始化');
    }
    
    await this.processManager.restartService(serviceName);
    this.showServiceStatus();
  }

  /**
   * 显示当前服务状态
   */
  showServiceStatus() {
    if (!this.processManager) {
      logger.warn('服务未初始化');
      return;
    }
    
    logger.header('服务状态');
    
    const status = this.processManager.getStatus();
    
    // 显示前端状态
    logger.serviceStatus(
      '前端服务', 
      status.frontend,
      { pid: status.processes.frontend || 'N/A' }
    );
    
    // 显示后端状态
    logger.serviceStatus(
      '后端服务', 
      status.backend,
      { pid: status.processes.backend || 'N/A' }
    );
    
    logger.divider();
  }

  /**
   * 设置信号处理器
   */
  setupSignalHandlers() {
    // 处理 Ctrl+C (SIGINT)
    process.on('SIGINT', async () => {
      if (!this.shutdownInProgress) {
        console.log('\n'); // 换行
        logger.info('收到停止信号，正在优雅关闭...');
        await this.stop();
        process.exit(0);
      }
    });
    
    // 处理 SIGTERM
    process.on('SIGTERM', async () => {
      if (!this.shutdownInProgress) {
        logger.info('收到终止信号，正在优雅关闭...');
        await this.stop();
        process.exit(0);
      }
    });
    
    // 处理未捕获的异常
    process.on('uncaughtException', async (error) => {
      logger.error(`未捕获的异常: ${error.message}`);
      logger.error(error.stack);
      
      if (!this.shutdownInProgress) {
        await this.stop();
      }
      
      process.exit(1);
    });
    
    // 处理未处理的 Promise 拒绝
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error(`未处理的 Promise 拒绝: ${reason}`);
      
      if (!this.shutdownInProgress) {
        await this.stop();
      }
      
      process.exit(1);
    });
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取运行状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      shutdownInProgress: this.shutdownInProgress,
      services: this.processManager ? this.processManager.getStatus() : null
    };
  }

  /**
   * 创建默认配置文件
   */
  async createDefaultConfig() {
    try {
      const configPath = await this.configManager.createDefaultConfigFile();
      logger.success(`默认配置文件已创建: ${configPath}`);
      return configPath;
    } catch (error) {
      logger.error(`创建配置文件失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AutoDevServer;