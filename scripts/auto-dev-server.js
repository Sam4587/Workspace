#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import chalk from 'chalk';

const CONFIG_FILE_NAMES = [
  'auto-dev-server.config.json',
  '.auto-dev-serverrc.json',
  'auto-dev-server.json'
];

const DEFAULT_CONFIG = {
  frontend: {
    command: 'npm run dev',
    cwd: '.',
    readyPattern: 'ready in',
    env: {}
  },
  backend: {
    command: 'npm run dev',
    cwd: './server',
    readyPattern: '服务器启动成功',
    env: {}
  },
  timeout: 30000
};

function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { hour12: false });
}

function log(name, message, type = 'info') {
  const colors = {
    info: chalk.white,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow
  };
  
  const labels = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  const timestamp = chalk.gray(`[${getTimestamp()}]`);
  const nameTag = chalk.blue(`[${name}]`);
  const label = labels[type];
  const coloredMessage = colors[type](message);
  
  console.log(`${timestamp} ${nameTag} ${label} ${coloredMessage}`);
}

function findConfigFile() {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

function loadConfig() {
  const configPath = findConfigFile();
  
  if (!configPath) {
    log('系统', '未找到配置文件，使用默认配置', 'warning');
    return DEFAULT_CONFIG;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const userConfig = JSON.parse(configContent);
    
    const mergedConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      frontend: { ...DEFAULT_CONFIG.frontend, ...userConfig.frontend },
      backend: { ...DEFAULT_CONFIG.backend, ...userConfig.backend }
    };
    
    log('系统', `已加载配置: ${path.basename(configPath)}`, 'success');
    return mergedConfig;
  } catch (error) {
    log('系统', `配置文件读取失败: ${error.message}`, 'error');
    log('系统', '使用默认配置', 'warning');
    return DEFAULT_CONFIG;
  }
}

function startService(name, config, onReady) {
  return new Promise((resolve, reject) => {
    log(name, '正在启动...', 'info');
    
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? true : false;
    
    const env = { ...process.env, ...config.env };
    
    const child = spawn(config.command, {
      cwd: path.resolve(config.cwd),
      env,
      shell,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let isReady = false;
    let timeoutId;
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    
    timeoutId = setTimeout(() => {
      if (!isReady) {
        cleanup();
        reject(new Error(`${name}启动超时，请检查服务是否正常`));
      }
    }, config.timeout || 30000);
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(chalk.gray(`[${name}] `) + output);
      
      if (!isReady && config.readyPattern && output.includes(config.readyPattern)) {
        isReady = true;
        cleanup();
        log(name, '服务就绪', 'success');
        if (onReady) onReady();
        resolve(child);
      }
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(chalk.red(`[${name}] `) + output);
    });
    
    child.on('error', (error) => {
      cleanup();
      log(name, `启动失败: ${error.message}`, 'error');
      reject(error);
    });
    
    child.on('close', (code) => {
      cleanup();
      if (!isReady) {
        reject(new Error(`${name}进程退出，代码: ${code}`));
      }
    });
  });
}

async function main() {
  console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║           🚀 自动化开发服务器启动中...                      ║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝\n'));
  
  const config = loadConfig();
  const processes = [];
  
  try {
    const frontendProcess = await startService('前端', config.frontend);
    processes.push(frontendProcess);
    
    const backendProcess = await startService('后端', config.backend);
    processes.push(backendProcess);
    
    console.log(chalk.green('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green('║              ✅ 所有服务已就绪！                             ║'));
    console.log(chalk.green('║                                                              ║'));
    console.log(chalk.green('║  按 Ctrl+C 停止所有服务                                      ║'));
    console.log(chalk.green('╚═══════════════════════════════════════════════════════════╝\n'));
    
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n正在停止所有服务...'));
      
      for (const proc of processes.reverse()) {
        proc.kill('SIGTERM');
      }
      
      setTimeout(() => {
        console.log(chalk.green('所有服务已停止，再见！👋\n'));
        process.exit(0);
      }, 1000);
    });
    
  } catch (error) {
    log('系统', `错误: ${error.message}`, 'error');
    
    console.log(chalk.yellow('\n💡 排查建议:'));
    console.log(chalk.gray('   1. 检查端口是否被占用'));
    console.log(chalk.gray('   2. 确认依赖已安装 (npm install)'));
    console.log(chalk.gray('   3. 检查配置文件是否正确'));
    console.log(chalk.gray('   4. 查看上方日志中的错误详情\n'));
    
    for (const proc of processes) {
      proc.kill('SIGTERM');
    }
    
    process.exit(1);
  }
}

main();
