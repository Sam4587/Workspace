#!/usr/bin/env node

/**
 * TrendRadar 开发服务器启动脚本
 * 一键启动前后端服务
 */

const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const rootDir = path.join(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(prefix, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${color}${prefix}${colors.reset} ${message}`);
}

function printBanner() {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                    TrendRadar 开发服务器                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╠═══════════════════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  前端: http://localhost:5174                               ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  后端: http://localhost:5001                               ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
}

// 存储子进程
const processes = [];

// 清理函数
function cleanup() {
  log('INFO', '正在停止所有服务...', colors.yellow);
  processes.forEach((proc) => {
    try {
      proc.kill('SIGTERM');
    } catch (e) {
      // 忽略错误
    }
  });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 启动后端服务
function startBackend() {
  log('BACKEND', '启动后端服务 (端口 5001)...', colors.blue);
  
  const serverPath = path.join(rootDir, 'server');
  const backend = spawn('node', ['server.js'], {
    cwd: serverPath,
    shell: isWindows,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  backend.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      if (line.includes('listening') || line.includes('started')) {
        log('BACKEND', line, colors.green);
      } else if (line.includes('error') || line.includes('Error')) {
        log('BACKEND', line, colors.yellow);
      } else {
        log('BACKEND', line, colors.reset);
      }
    });
  });

  backend.stderr.on('data', (data) => {
    log('BACKEND', data.toString(), colors.yellow);
  });

  backend.on('close', (code) => {
    if (code !== 0 && code !== null) {
      log('BACKEND', `后端服务退出，代码: ${code}`, colors.yellow);
    }
  });

  processes.push(backend);
  return backend;
}

// 启动前端服务
function startFrontend() {
  log('FRONTEND', '启动前端服务 (端口 5174)...', colors.blue);
  
  const frontend = spawn('npm', ['run', 'dev', '--', '--port', '5174'], {
    cwd: rootDir,
    shell: true,
    stdio: 'pipe'
  });

  frontend.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      if (line.includes('ready in') || line.includes('Local:')) {
        log('FRONTEND', line, colors.green);
      } else if (line.includes('error') || line.includes('Error')) {
        log('FRONTEND', line, colors.yellow);
      }
    });
  });

  frontend.stderr.on('data', (data) => {
    const line = data.toString();
    if (line.includes('ready in') || line.includes('Local:')) {
      log('FRONTEND', line, colors.green);
    }
  });

  frontend.on('close', (code) => {
    if (code !== 0 && code !== null) {
      log('FRONTEND', `前端服务退出，代码: ${code}`, colors.yellow);
    }
  });

  processes.push(frontend);
  return frontend;
}

// 检查端口是否可用
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port);
  });
}

// 主函数
async function main() {
  printBanner();

  // 检查端口
  const backendPortFree = await checkPort(5001);
  const frontendPortFree = await checkPort(5174);

  if (!backendPortFree) {
    log('WARN', '端口 5001 已被占用，后端服务可能启动失败', colors.yellow);
  }

  if (!frontendPortFree) {
    log('WARN', '端口 5174 已被占用，前端服务可能启动失败', colors.yellow);
  }

  // 启动服务
  startBackend();
  
  // 延迟启动前端，确保后端先启动
  setTimeout(() => {
    startFrontend();
  }, 1000);

  log('INFO', '所有服务已启动！按 Ctrl+C 停止', colors.green);
  log('INFO', '前端地址: http://localhost:5174', colors.cyan);
  log('INFO', '后端地址: http://localhost:5001', colors.cyan);
  log('INFO', 'API 文档: http://localhost:5001/api/docs', colors.cyan);
}

main().catch((err) => {
  log('ERROR', err.message, colors.yellow);
  process.exit(1);
});
