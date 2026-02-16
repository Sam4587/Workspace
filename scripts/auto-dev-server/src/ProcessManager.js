/**
 * 进程管理器
 * 负责启动、停止和监控前后端服务进程
 */

const { spawn } = require('cross-spawn');
const axios = require('axios');
const chalk = require('chalk').default || require('chalk');

class ProcessManager {
  constructor(config) {
    this.config = config;
    this.processes = {
      frontend: null,
      backend: null
    };
    this.status = {
      frontend: 'stopped',
      backend: 'stopped'
    };
  }

  /**
   * 启动前端服务
   */
  async startFrontend() {
    const frontendConfig = this.config.getFrontendConfig();
    
    console.log(chalk.blue('🚀 正在启动前端服务...'));
    console.log(chalk.gray(`   命令: ${frontendConfig.command}`));
    console.log(chalk.gray(`   工作目录: ${frontendConfig.cwd}`));
    
    try {
      // 解析命令
      const [command, ...args] = this.parseCommand(frontendConfig.command);
      
      // 启动进程
      this.processes.frontend = spawn(command, args, {
        cwd: frontendConfig.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      this.status.frontend = 'starting';
      
      // 监听进程事件
      this.setupProcessListeners('frontend', this.processes.frontend, frontendConfig);
      
      // 等待服务启动
      await this.waitForService('frontend', frontendConfig);
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 前端服务启动失败:'), error.message);
      this.status.frontend = 'error';
      throw error;
    }
  }

  /**
   * 启动后端服务
   */
  async startBackend() {
    const backendConfig = this.config.getBackendConfig();
    
    console.log(chalk.blue('🚀 正在启动后端服务...'));
    console.log(chalk.gray(`   命令: ${backendConfig.command}`));
    console.log(chalk.gray(`   工作目录: ${backendConfig.cwd}`));
    
    try {
      // 解析命令
      const [command, ...args] = this.parseCommand(backendConfig.command);
      
      // 启动进程
      this.processes.backend = spawn(command, args, {
        cwd: backendConfig.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      });
      
      this.status.backend = 'starting';
      
      // 监听进程事件
      this.setupProcessListeners('backend', this.processes.backend, backendConfig);
      
      // 等待服务启动
      await this.waitForService('backend', backendConfig);
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 后端服务启动失败:'), error.message);
      this.status.backend = 'error';
      throw error;
    }
  }

  /**
   * 解析命令字符串
   */
  parseCommand(commandString) {
    // 简单的命令解析（支持空格分隔）
    return commandString.trim().split(/\s+/);
  }

  /**
   * 设置进程事件监听器
   */
  setupProcessListeners(serviceName, process, config) {
    const serviceLabel = serviceName === 'frontend' ? chalk.green('[前端]') : chalk.yellow('[后端]');
    
    // 监听标准输出
    process.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${serviceLabel} ${output}`);
      }
    });
    
    // 监听错误输出
    process.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`${serviceLabel} ${chalk.red(output)}`);
      }
    });
    
    // 监听进程退出
    process.on('close', (code) => {
      console.log(`${serviceLabel} 进程已退出，退出码: ${code}`);
      this.status[serviceName] = 'stopped';
      
      // 如果是前端服务退出，自动停止后端服务
      if (serviceName === 'frontend' && this.processes.backend) {
        console.log(chalk.yellow('⚠️  前端服务已停止，正在停止后端服务...'));
        this.stopBackend();
      }
    });
    
    // 监听进程错误
    process.on('error', (error) => {
      console.error(`${serviceLabel} 进程错误:`, error.message);
      this.status[serviceName] = 'error';
    });
  }

  /**
   * 等待服务启动并可访问
   */
  async waitForService(serviceName, config) {
    const maxRetries = 30; // 最多尝试30次
    const retryInterval = 2000; // 每2秒检查一次
    
    console.log(chalk.gray(`   等待服务在端口 ${config.port} 启动...`));
    
    for (let i = 1; i <= maxRetries; i++) {
      try {
        // 检查服务是否可访问
        await axios.get(config.checkUrl, {
          timeout: 3000,
          validateStatus: (status) => status < 500 // 接受2xx和4xx状态码
        });
        
        console.log(chalk.green(`✅ ${serviceName} 服务启动成功！`));
        this.status[serviceName] = 'running';
        return;
      } catch (error) {
        if (i === maxRetries) {
          throw new Error(`${serviceName} 服务启动超时`);
        }
        
        if (i % 5 === 0) {
          console.log(chalk.gray(`   重试 ${i}/${maxRetries}...`));
        }
        
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
  }

  /**
   * 停止前端服务
   */
  stopFrontend() {
    if (this.processes.frontend) {
      console.log(chalk.blue('🛑 正在停止前端服务...'));
      this.terminateProcess('frontend', this.processes.frontend);
      this.processes.frontend = null;
    }
  }

  /**
   * 停止后端服务
   */
  stopBackend() {
    if (this.processes.backend) {
      console.log(chalk.blue('🛑 正在停止后端服务...'));
      this.terminateProcess('backend', this.processes.backend);
      this.processes.backend = null;
    }
  }

  /**
   * 终止进程
   */
  terminateProcess(serviceName, process) {
    try {
      if (process.pid) {
        // 在Windows上使用taskkill，在Unix系统上使用SIGTERM
        if (process.platform === 'win32') {
          require('child_process').execSync(`taskkill /PID ${process.pid} /F`, { stdio: 'ignore' });
        } else {
          process.kill('SIGTERM');
        }
      }
    } catch (error) {
      console.warn(`⚠️  终止${serviceName}进程时出现警告:`, error.message);
    }
    
    this.status[serviceName] = 'stopped';
  }

  /**
   * 停止所有服务
   */
  stopAll() {
    console.log(chalk.blue('🛑 正在停止所有服务...'));
    this.stopFrontend();
    this.stopBackend();
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      frontend: this.status.frontend,
      backend: this.status.backend,
      processes: {
        frontend: this.processes.frontend ? this.processes.frontend.pid : null,
        backend: this.processes.backend ? this.processes.backend.pid : null
      }
    };
  }

  /**
   * 重启指定服务
   */
  async restartService(serviceName) {
    console.log(chalk.blue(`🔄 正在重启${serviceName}服务...`));
    
    // 停止服务
    if (serviceName === 'frontend') {
      this.stopFrontend();
    } else if (serviceName === 'backend') {
      this.stopBackend();
    }
    
    // 等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 重新启动服务
    if (serviceName === 'frontend') {
      await this.startFrontend();
    } else if (serviceName === 'backend') {
      await this.startBackend();
    }
  }
}

module.exports = ProcessManager;