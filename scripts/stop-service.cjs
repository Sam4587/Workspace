#!/usr/bin/env node

/**
 * AI Content Flow - 后台服务停止器
 * 停止通过 start-service.cjs 启动的后台服务
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const CONFIG = {
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

async function stopPM2() {
  log('info', '停止 PM2 管理的服务...');
  return new Promise((resolve, reject) => {
    const proc = spawn('pm2', ['delete', 'all'], {
      shell: true,
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        log('success', 'PM2 服务已停止');
        resolve();
      } else {
        reject(new Error('PM2 停止失败'));
      }
    });
  });
}

async function stopDetached() {
  log('info', '停止分离进程...');
  
  const pidFile = path.join(CONFIG.projectRoot, '.service-pids.json');
  
  if (!fs.existsSync(pidFile)) {
    log('warning', '未找到 PID 文件，可能服务未通过 start-service.cjs 启动');
    return;
  }
  
  try {
    const pids = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
    log('info', `找到 PID 文件，启动时间: ${pids.startedAt}`);
    
    const killed = [];
    
    if (pids.backend) {
      try {
        process.kill(pids.backend);
        log('success', `后端服务已停止 (PID: ${pids.backend})`);
        killed.push('backend');
      } catch (e) {
        log('warning', `无法停止后端服务 (PID: ${pids.backend}): ${e.message}`);
      }
    }
    
    if (pids.frontend) {
      try {
        process.kill(pids.frontend);
        log('success', `前端服务已停止 (PID: ${pids.frontend})`);
        killed.push('frontend');
      } catch (e) {
        log('warning', `无法停止前端服务 (PID: ${pids.frontend}): ${e.message}`);
      }
    }
    
    fs.unlinkSync(pidFile);
    log('info', 'PID 文件已删除');
    
    if (killed.length > 0) {
      log('success', `已停止 ${killed.length} 个服务`);
    }
    
  } catch (error) {
    log('error', '读取 PID 文件失败: ' + error.message);
  }
}

async function killByPort(port) {
  log('info', `检查端口 ${port}...`);
  
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          resolve(false);
          return;
        }
        
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)\s*$/);
          if (match) {
            pids.add(match[1]);
          }
        });
        
        if (pids.size > 0) {
          log('info', `发现端口 ${port} 被占用，PID: ${Array.from(pids).join(', ')}`);
          pids.forEach(pid => {
            try {
              process.kill(pid);
              log('success', `进程 ${pid} 已终止`);
            } catch (e) {
              log('warning', `无法终止进程 ${pid}: ${e.message}`);
            }
          });
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } else {
      exec(`lsof -ti :${port}`, (error, stdout) => {
        if (error || !stdout) {
          resolve(false);
          return;
        }
        
        const pids = stdout.trim().split('\n').filter(Boolean);
        log('info', `发现端口 ${port} 被占用，PID: ${pids.join(', ')}`);
        
        pids.forEach(pid => {
          try {
            process.kill(pid);
            log('success', `进程 ${pid} 已终止`);
          } catch (e) {
            log('warning', `无法终止进程 ${pid}: ${e.message}`);
          }
        });
        
        resolve(true);
      });
    }
  });
}

async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}============================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   AI Content Flow - Service Stopper       ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}============================================${colors.reset}`);
  console.log('\n');
  
  const args = process.argv.slice(2);
  const forceKill = args.includes('--force') || args.includes('-f');
  const killPorts = args.includes('--ports') || args.includes('-p');
  
  try {
    if (await checkPM2()) {
      await stopPM2();
    }
    
    await stopDetached();
    
    if (killPorts || forceKill) {
      log('info', '强制清理端口...');
      await killByPort(5174);
      await killByPort(5001);
    }
    
    console.log('\n');
    log('success', '服务停止完成！');
    console.log('\n');
    
  } catch (error) {
    log('error', '停止失败: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
