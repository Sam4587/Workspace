#!/usr/bin/env node

/**
 * AI Content Flow - 后台服务启动器
 * 使用 PM2 管理进程，支持后台运行
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CONFIG = {
  ports: {
    frontend: 5174,
    backend: 5001
  },
  projectRoot: path.resolve(__dirname, '..')
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  let color = colors.reset;
  let prefix = '[INFO]';
  
  switch(type) {
    case 'success':
      color = colors.green;
      prefix = '[OK]';
      break;
    case 'warning':
      color = colors.yellow;
      prefix = '[WARN]';
      break;
    case 'error':
      color = colors.red;
      prefix = '[ERROR]';
      break;
    case 'info':
      color = colors.cyan;
      prefix = '[INFO]';
      break;
  }
  
  console.log(`${color}${prefix} ${message}${colors.reset}`);
}

async function checkPM2() {
  return new Promise((resolve) => {
    exec('pm2 --version', (error) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function installPM2() {
  log('info', 'PM2 未安装，正在安装...');
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['install', '-g', 'pm2'], {
      shell: true,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        log('success', 'PM2 安装成功');
        resolve();
      } else {
        reject(new Error('PM2 安装失败'));
      }
    });
  });
}

async function startWithPM2() {
  log('info', '使用 PM2 启动服务...');
  
  const serverDir = path.join(CONFIG.projectRoot, 'server');
  const frontendDir = CONFIG.projectRoot;
  
  const ecosystemConfig = {
    apps: [
      {
        name: 'ai-content-flow-backend',
        script: 'npm',
        args: 'run dev',
        cwd: serverDir,
        interpreter: 'none',
        env: {
          NODE_ENV: 'development'
        }
      },
      {
        name: 'ai-content-flow-frontend',
        script: 'npm',
        args: 'run dev',
        cwd: frontendDir,
        interpreter: 'none',
        env: {
          NODE_ENV: 'development'
        }
      }
    ]
  };
  
  const configPath = path.join(CONFIG.projectRoot, 'ecosystem.dev.json');
  fs.writeFileSync(configPath, JSON.stringify(ecosystemConfig, null, 2));
  
  return new Promise((resolve, reject) => {
    const proc = spawn('pm2', ['start', 'ecosystem.dev.json'], {
      cwd: CONFIG.projectRoot,
      shell: true,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        log('success', '服务已通过 PM2 启动');
        log('info', '使用 "pm2 logs" 查看日志');
        log('info', '使用 "pm2 stop all" 停止所有服务');
        log('info', '使用 "pm2 delete all" 删除所有服务');
        resolve();
      } else {
        reject(new Error('PM2 启动失败'));
      }
    });
  });
}

async function startWithDetached() {
  log('info', '使用分离进程模式启动...');
  
  const serverDir = path.join(CONFIG.projectRoot, 'server');
  const frontendDir = CONFIG.projectRoot;
  
  const services = [];
  
  try {
    log('info', '启动后端服务...');
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: serverDir,
      shell: true,
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    backend.unref();
    services.push(backend);
    log('success', `后端服务已启动 (PID: ${backend.pid})`);
    
    await new Promise(r => setTimeout(r, 2000));
    
    log('info', '启动前端服务...');
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: frontendDir,
      shell: true,
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    frontend.unref();
    services.push(frontend);
    log('success', `前端服务已启动 (PID: ${frontend.pid})`);
    
    const pidFile = path.join(CONFIG.projectRoot, '.service-pids.json');
    fs.writeFileSync(pidFile, JSON.stringify({
      backend: backend.pid,
      frontend: frontend.pid,
      startedAt: new Date().toISOString()
    }, null, 2));
    
    log('success', '所有服务已在后台启动');
    log('info', `前端地址: http://localhost:${CONFIG.ports.frontend}`);
    log('info', `后端地址: http://localhost:${CONFIG.ports.backend}`);
    log('info', `PID 文件: ${pidFile}`);
    log('warning', '如需停止服务，请运行: node scripts/stop-service.cjs');
    
  } catch (error) {
    services.forEach(proc => {
      try { proc.kill(); } catch(e) {}
    });
    throw error;
  }
}

async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}============================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   AI Content Flow - Service Launcher       ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}============================================${colors.reset}`);
  console.log('\n');
  
  const args = process.argv.slice(2);
  const usePM2 = args.includes('--pm2') || args.includes('-p');
  const forceDetached = args.includes('--detached') || args.includes('-d');
  
  try {
    if (usePM2 || (!forceDetached && await checkPM2())) {
      if (!await checkPM2()) {
        await installPM2();
      }
      await startWithPM2();
    } else {
      await startWithDetached();
    }
    
    console.log('\n');
    log('success', '服务启动完成！');
    console.log('\n');
    
  } catch (error) {
    log('error', '启动失败: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
