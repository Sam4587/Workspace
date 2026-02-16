#!/usr/bin/env node

/**
 * Auto Dev Server CLI 入口
 * 提供命令行界面来启动和管理开发服务器
 */

const AutoDevServer = require('./AutoDevServer');
const { logger } = require('./Logger');
const chalk = require('chalk').default || require('chalk');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0] || 'start';
const options = {
  config: args.find(arg => arg.startsWith('--config='))?.split('=')[1],
  help: args.includes('--help') || args.includes('-h'),
  version: args.includes('--version') || args.includes('-v'),
  createConfig: args.includes('--create-config')
};

// 显示帮助信息
function showHelp() {
  console.log(`
${chalk.bold('Auto Dev Server')} - 自动化开发服务器启动工具

${chalk.bold('用法:')}
  auto-dev [command] [options]

${chalk.bold('命令:')}
  start              启动开发服务器 (默认)
  status             显示服务状态
  restart <service>  重启指定服务 (frontend|backend)
  stop               停止所有服务
  config             创建默认配置文件

${chalk.bold('选项:')}
  --config=<path>    指定配置文件路径
  --create-config    创建默认配置文件
  --help, -h         显示帮助信息
  --version, -v      显示版本信息

${chalk.bold('示例:')}
  auto-dev                    # 启动开发服务器
  auto-dev --config=./my-config.json  # 使用自定义配置
  auto-dev status             # 查看服务状态
  auto-dev restart frontend   # 重启前端服务
  auto-dev --create-config    # 创建配置文件

${chalk.bold('服务信息:')}
  前端服务: http://localhost:5174
  后端服务: http://localhost:5001/api
`);
}

// 显示版本信息
function showVersion() {
  const packageJson = require('../package.json');
  console.log(`${packageJson.name} v${packageJson.version}`);
}

// 主函数
async function main() {
  try {
    // 处理帮助和版本命令
    if (options.help) {
      showHelp();
      return;
    }
    
    if (options.version) {
      showVersion();
      return;
    }
    
    // 创建 AutoDevServer 实例
    const autoDev = new AutoDevServer();
    
    // 处理配置文件创建
    if (options.createConfig) {
      await autoDev.createDefaultConfig();
      return;
    }
    
    // 初始化
    await autoDev.init(options.config);
    
    // 执行命令
    switch (command) {
      case 'start':
        await autoDev.start();
        break;
        
      case 'status':
        autoDev.showServiceStatus();
        break;
        
      case 'restart':
        const serviceName = args[1];
        if (!serviceName || !['frontend', 'backend'].includes(serviceName)) {
          logger.error('请指定要重启的服务: frontend 或 backend');
          process.exit(1);
        }
        await autoDev.restart(serviceName);
        break;
        
      case 'stop':
        await autoDev.stop();
        break;
        
      case 'config':
        await autoDev.createDefaultConfig();
        break;
        
      default:
        logger.error(`未知命令: ${command}`);
        showHelp();
        process.exit(1);
    }
    
  } catch (error) {
    logger.error(`执行失败: ${error.message}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('致命错误:', error.message);
    process.exit(1);
  });
}

module.exports = { main };