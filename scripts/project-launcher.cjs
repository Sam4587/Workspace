#!/usr/bin/env node

/**
 * AI Content Flow - 项目启动器
 * 一键启动所有相关服务并在浏览器中打开前端
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

// 配置
const CONFIG = {
  ports: {
    frontend: 5174,
    backend: 5001,
    publisherTools: 8080,
    mongoDB: 27017,
    redis: 6379
  },
  browser: 'quark',
  frontendUrl: 'http://localhost:5174',
  projectRoot: path.resolve(__dirname, '..')
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// 日志函数
function log(type, message) {
  let color = colors.reset;
  let prefix = '[INFO]';
  
  switch(type) {
    case 'success':
      color = colors.green;
      prefix = '[✓]';
      break;
    case 'warning':
      color = colors.yellow;
      prefix = '[!]';
      break;
    case 'error':
      color = colors.red;
      prefix = '[✗]';
      break;
    case 'info':
      color = colors.cyan;
      prefix = '[→]';
      break;
  }
  
  console.log(`${color}${prefix} ${message}${colors.reset}`);
}

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close();
      resolve(false);
    });
    server.on('error', () => {
      resolve(true);
    });
  });
}

// 检查服务是否已运行
async function checkService(url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 启动服务（改进版）
function startService(name, command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    log('info', `启动 ${name}...`);
    
    // 检查工作目录是否存在
    if (!fs.existsSync(cwd)) {
      reject(new Error(`工作目录不存在: ${cwd}`));
      return;
    }
    
    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
      shell: true,
      windowsHide: false  // 显示窗口以便调试
    });
    
    let output = '';
    let errorOutput = '';
    
    proc.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
      // 显示关键日志
      if (str.includes('ready') || str.includes('started') || str.includes('running') || 
          str.includes('error') || str.includes('Error') || str.includes('失败')) {
        console.log(`[${name}] ${str.trim()}`);
      }
    });
    
    proc.stderr.on('data', (data) => {
      const str = data.toString();
      errorOutput += str;
      console.log(`[${name}] ${str.trim()}`);
    });
    
    // 等待服务启动
    setTimeout(() => {
      if (proc.pid) {
        log('success', `${name} 已启动 (PID: ${proc.pid})`);
        resolve(proc);
      } else {
        reject(new Error(`${name} 启动失败\n输出: ${output}\n错误: ${errorOutput}`));
      }
    }, 3000);
    
    proc.on('error', (err) => {
      reject(new Error(`${name} 启动错误: ${err.message}`));
    });
    
    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[${name}] 进程退出，代码: ${code}`);
      }
    });
  });
}

// 打开浏览器
function openBrowser(url) {
  return new Promise((resolve) => {
    log('info', `正在打开浏览器访问 ${url}...`);
    
    let command;
    const platform = os.platform();
    
    if (platform === 'win32') {
      command = `start "" "${url}"`;
    } else if (platform === 'darwin') {
      command = `open "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }
    
    exec(command, (error) => {
      if (error) {
        log('warning', '无法自动打开浏览器，请手动访问: ' + url);
      } else {
        log('success', '浏览器已打开');
      }
      resolve();
    });
  });
}

// 主函数
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║     AI Content Flow - 项目启动器       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  const args = process.argv.slice(2);
  
  // 显示帮助
  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法: node project-launcher.js [选项]\n');
    console.log('选项:');
    console.log('  --help, -h         显示帮助信息');
    console.log('  --no-browser       不自动打开浏览器');
    console.log('  --backend-only     只启动后端服务');
    console.log('  --frontend-only    只启动前端服务');
    console.log('\n功能:');
    console.log('  1. 检查端口占用情况');
    console.log('  2. 启动后端服务 (端口 5001)');
    console.log('  3. 启动前端服务 (端口 5174)');
    console.log('  4. 自动在浏览器中打开前端页面');
    return;
  }
  
  const noBrowser = args.includes('--no-browser');
  const backendOnly = args.includes('--backend-only');
  const frontendOnly = args.includes('--frontend-only');
  const services = [];
  
  try {
    // 检查项目结构
    log('info', '检查项目结构...');
    const serverDir = path.join(CONFIG.projectRoot, 'server');
    const frontendDir = CONFIG.projectRoot;
    
    if (!fs.existsSync(serverDir)) {
      throw new Error(`找不到 server 目录: ${serverDir}`);
    }
    
    // 检查 package.json
    const serverPkg = path.join(serverDir, 'package.json');
    const frontendPkg = path.join(frontendDir, 'package.json');
    
    if (!fs.existsSync(serverPkg)) {
      throw new Error(`找不到后端 package.json: ${serverPkg}`);
    }
    if (!fs.existsSync(frontendPkg)) {
      throw new Error(`找不到前端 package.json: ${frontendPkg}`);
    }
    
    log('success', '项目结构检查通过');
    
    // 检查端口
    if (!backendOnly) {
      log('info', '检查前端端口...');
      const frontendPortOccupied = await checkPort(CONFIG.ports.frontend);
      if (frontendPortOccupied) {
        log('warning', `前端端口 ${CONFIG.ports.frontend} 已被占用`);
        const isRunning = await checkService(CONFIG.frontendUrl);
        if (isRunning) {
          log('success', '检测到前端服务已在运行');
        }
      } else {
        log('success', `前端端口 ${CONFIG.ports.frontend} 可用`);
      }
    }
    
    if (!frontendOnly) {
      log('info', '检查后端端口...');
      const backendPortOccupied = await checkPort(CONFIG.ports.backend);
      if (backendPortOccupied) {
        log('warning', `后端端口 ${CONFIG.ports.backend} 已被占用`);
        const isRunning = await checkService(`http://localhost:${CONFIG.ports.backend}/api/health`);
        if (isRunning) {
          log('success', '检测到后端服务已在运行');
        }
      } else {
        log('success', `后端端口 ${CONFIG.ports.backend} 可用`);
      }
    }
    
    // 检查环境变量文件
    const envPath = path.join(serverDir, '.env');
    if (!fs.existsSync(envPath)) {
      log('warning', '未找到 server/.env 文件');
      const envExample = path.join(serverDir, '.env.example');
      if (fs.existsSync(envExample)) {
        log('info', '建议: 复制 server/.env.example 到 server/.env 并配置');
      }
    } else {
      log('success', '环境变量文件已配置');
    }
    
    // 启动后端
    if (!frontendOnly) {
      log('info', '正在启动后端服务...');
      try {
        const backend = await startService(
          '后端服务',
          'npm',
          ['run', 'dev'],
          serverDir
        );
        services.push(backend);
        
        // 等待后端启动
        log('info', '等待后端服务就绪...');
        let backendReady = false;
        for (let i = 0; i < 30; i++) {
          backendReady = await checkService(`http://localhost:${CONFIG.ports.backend}/api/health`);
          if (backendReady) break;
          await new Promise(r => setTimeout(r, 1000));
        }
        
        if (backendReady) {
          log('success', '后端服务已就绪');
        } else {
          log('warning', '后端服务启动中，可能需要更长时间');
        }
      } catch (err) {
        log('error', `后端启动失败: ${err.message}`);
        throw err;
      }
    }
    
    // 启动前端
    if (!backendOnly) {
      log('info', '正在启动前端服务...');
      try {
        const frontend = await startService(
          '前端服务',
          'npm',
          ['run', 'dev'],
          frontendDir
        );
        services.push(frontend);
        
        // 等待前端启动
        log('info', '等待前端服务就绪...');
        let frontendReady = false;
        for (let i = 0; i < 30; i++) {
          frontendReady = await checkService(CONFIG.frontendUrl);
          if (frontendReady) break;
          await new Promise(r => setTimeout(r, 1000));
        }
        
        if (frontendReady) {
          log('success', '前端服务已就绪');
        } else {
          log('warning', '前端服务启动中，可能需要更长时间');
        }
      } catch (err) {
        log('error', `前端启动失败: ${err.message}`);
        throw err;
      }
    }
    
    // 打开浏览器
    if (!noBrowser && !backendOnly) {
      // 再等待几秒确保服务完全启动
      await new Promise(r => setTimeout(r, 3000));
      await openBrowser(CONFIG.frontendUrl);
    }
    
    // 显示服务状态
    console.log('\n');
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}服务状态:${colors.reset}`);
    if (!backendOnly) {
      console.log(`  前端: ${colors.green}${CONFIG.frontendUrl}${colors.reset}`);
    }
    if (!frontendOnly) {
      console.log(`  后端: ${colors.green}http://localhost:${CONFIG.ports.backend}${colors.reset}`);
    }
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log('\n');
    
    log('info', '按 Ctrl+C 停止所有服务');
    
    // 处理退出
    process.on('SIGINT', () => {
      console.log('\n');
      log('info', '正在停止所有服务...');
      services.forEach(proc => {
        if (proc && !proc.killed) {
          try {
            proc.kill('SIGTERM');
          } catch (e) {
            // 忽略错误
          }
        }
      });
      setTimeout(() => {
        log('success', '所有服务已停止');
        process.exit(0);
      }, 2000);
    });
    
    // 保持进程运行
    process.stdin.resume();
    
  } catch (error) {
    log('error', '启动失败: ' + error.message);
    console.error(error);
    services.forEach(proc => {
      if (proc && !proc.killed) {
        try {
          proc.kill();
        } catch (e) {
          // 忽略错误
        }
      }
    });
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('发生错误:', error);
  process.exit(1);
});
