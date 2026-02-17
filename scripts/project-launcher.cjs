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

// 执行命令并返回 Promise
function execCommand(command, cwd, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, [], {
      cwd,
      shell: true,
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    
    let output = '';
    if (options.silent) {
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });
    }
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${output}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
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

// 检查并安装依赖
async function checkAndInstallDependencies(name, cwd) {
  const nodeModulesPath = path.join(cwd, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    log('success', `${name} dependencies already installed`);
    return true;
  }
  
  log('warning', `${name} dependencies not found`);
  log('info', `Installing ${name} dependencies...`);
  
  try {
    await execCommand('npm install', cwd, { silent: true });
    log('success', `${name} dependencies installed successfully`);
    return true;
  } catch (err) {
    log('error', `Failed to install ${name} dependencies: ${err.message}`);
    return false;
  }
}

// 启动服务
function startService(name, command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    log('info', `Starting ${name}...`);
    
    if (!fs.existsSync(cwd)) {
      reject(new Error(`Working directory does not exist: ${cwd}`));
      return;
    }
    
    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
      shell: true,
      windowsHide: false
    });
    
    let output = '';
    let errorOutput = '';
    let hasError = false;
    
    proc.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
      
      // Check for errors
      if (str.includes('MODULE_NOT_FOUND') || str.includes('Error:') || str.includes('error:')) {
        hasError = true;
        errorOutput += str;
      }
      
      // Show important messages
      if (str.includes('ready') || str.includes('started') || str.includes('running') || 
          str.includes('listening') || str.includes('MODULE_NOT_FOUND') || 
          str.includes('Error:') || str.includes('error:')) {
        console.log(`[${name}] ${str.trim()}`);
      }
    });
    
    proc.stderr.on('data', (data) => {
      const str = data.toString();
      errorOutput += str;
      console.log(`[${name}] ${str.trim()}`);
    });
    
    proc.on('error', (err) => {
      reject(new Error(`${name} start error: ${err.message}`));
    });
    
    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[${name}] Process exited with code: ${code}`);
        if (hasError || errorOutput) {
          reject(new Error(`${name} failed to start. Error: ${errorOutput || output}`));
        }
      }
    });
    
    // Wait for service to start
    setTimeout(() => {
      if (proc.pid && !hasError) {
        log('success', `${name} started (PID: ${proc.pid})`);
        resolve(proc);
      } else if (hasError) {
        reject(new Error(`${name} failed to start. Check output above.`));
      } else {
        reject(new Error(`${name} failed to start. No process ID.`));
      }
    }, 5000);
  });
}

// 打开浏览器
function openBrowser(url) {
  return new Promise((resolve) => {
    log('info', `Opening browser at ${url}...`);
    
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
        log('warning', 'Cannot open browser automatically, please visit: ' + url);
      } else {
        log('success', 'Browser opened');
      }
      resolve();
    });
  });
}

// 主函数
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.magenta}============================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}     AI Content Flow - Project Launcher     ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}============================================${colors.reset}`);
  console.log('\n');
  
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node project-launcher.cjs [options]\n');
    console.log('Options:');
    console.log('  --help, -h         Show help information');
    console.log('  --no-browser       Do not open browser automatically');
    console.log('  --backend-only     Start backend service only');
    console.log('  --frontend-only    Start frontend service only');
    console.log('  --install          Force reinstall dependencies');
    console.log('\nFeatures:');
    console.log('  1. Check port availability');
    console.log('  2. Install dependencies if needed');
    console.log('  3. Start backend service (port 5001)');
    console.log('  4. Start frontend service (port 5174)');
    console.log('  5. Open frontend in browser');
    return;
  }
  
  const noBrowser = args.includes('--no-browser');
  const backendOnly = args.includes('--backend-only');
  const frontendOnly = args.includes('--frontend-only');
  const forceInstall = args.includes('--install');
  const services = [];
  
  try {
    // Check project structure
    log('info', 'Checking project structure...');
    const serverDir = path.join(CONFIG.projectRoot, 'server');
    const frontendDir = CONFIG.projectRoot;
    
    if (!fs.existsSync(serverDir)) {
      throw new Error(`Server directory not found: ${serverDir}`);
    }
    
    const serverPkg = path.join(serverDir, 'package.json');
    const frontendPkg = path.join(frontendDir, 'package.json');
    
    if (!fs.existsSync(serverPkg)) {
      throw new Error(`Backend package.json not found: ${serverPkg}`);
    }
    if (!fs.existsSync(frontendPkg)) {
      throw new Error(`Frontend package.json not found: ${frontendPkg}`);
    }
    
    log('success', 'Project structure check passed');
    
    // Check and install dependencies
    if (!frontendOnly) {
      log('info', 'Checking backend dependencies...');
      const backendDepsInstalled = await checkAndInstallDependencies('Backend', serverDir);
      if (!backendDepsInstalled) {
        throw new Error('Failed to install backend dependencies');
      }
    }
    
    if (!backendOnly) {
      log('info', 'Checking frontend dependencies...');
      const frontendDepsInstalled = await checkAndInstallDependencies('Frontend', frontendDir);
      if (!frontendDepsInstalled) {
        throw new Error('Failed to install frontend dependencies');
      }
    }
    
    // Check ports
    if (!backendOnly) {
      log('info', 'Checking frontend port...');
      const frontendPortOccupied = await checkPort(CONFIG.ports.frontend);
      if (frontendPortOccupied) {
        log('warning', `Frontend port ${CONFIG.ports.frontend} is occupied`);
        const isRunning = await checkService(CONFIG.frontendUrl);
        if (isRunning) {
          log('success', 'Frontend service already running');
        }
      } else {
        log('success', `Frontend port ${CONFIG.ports.frontend} is available`);
      }
    }
    
    if (!frontendOnly) {
      log('info', 'Checking backend port...');
      const backendPortOccupied = await checkPort(CONFIG.ports.backend);
      if (backendPortOccupied) {
        log('warning', `Backend port ${CONFIG.ports.backend} is occupied`);
        const isRunning = await checkService(`http://localhost:${CONFIG.ports.backend}/api/health`);
        if (isRunning) {
          log('success', 'Backend service already running');
        }
      } else {
        log('success', `Backend port ${CONFIG.ports.backend} is available`);
      }
    }
    
    // Check environment variables
    const envPath = path.join(serverDir, '.env');
    if (!fs.existsSync(envPath)) {
      log('warning', 'server/.env file not found');
      const envExample = path.join(serverDir, '.env.example');
      if (fs.existsSync(envExample)) {
        log('info', 'Tip: Copy server/.env.example to server/.env and configure');
      }
    } else {
      log('success', 'Environment variables configured');
    }
    
    // Start backend
    if (!frontendOnly) {
      log('info', 'Starting backend service...');
      try {
        const backend = await startService(
          'Backend',
          'npm',
          ['run', 'dev'],
          serverDir
        );
        services.push(backend);
        
        // Wait for backend to be ready
        log('info', 'Waiting for backend to be ready...');
        let backendReady = false;
        for (let i = 0; i < 30; i++) {
          backendReady = await checkService(`http://localhost:${CONFIG.ports.backend}/api/health`);
          if (backendReady) break;
          await new Promise(r => setTimeout(r, 1000));
        }
        
        if (backendReady) {
          log('success', 'Backend service is ready');
        } else {
          log('warning', 'Backend service starting, may need more time');
        }
      } catch (err) {
        log('error', `Backend start failed: ${err.message}`);
        throw err;
      }
    }
    
    // Start frontend
    if (!backendOnly) {
      log('info', 'Starting frontend service...');
      try {
        const frontend = await startService(
          'Frontend',
          'npm',
          ['run', 'dev'],
          frontendDir
        );
        services.push(frontend);
        
        // Wait for frontend to be ready
        log('info', 'Waiting for frontend to be ready...');
        let frontendReady = false;
        for (let i = 0; i < 30; i++) {
          frontendReady = await checkService(CONFIG.frontendUrl);
          if (frontendReady) break;
          await new Promise(r => setTimeout(r, 1000));
        }
        
        if (frontendReady) {
          log('success', 'Frontend service is ready');
        } else {
          log('warning', 'Frontend service starting, may need more time');
        }
      } catch (err) {
        log('error', `Frontend start failed: ${err.message}`);
        throw err;
      }
    }
    
    // Open browser
    if (!noBrowser && !backendOnly) {
      await new Promise(r => setTimeout(r, 3000));
      await openBrowser(CONFIG.frontendUrl);
    }
    
    // Show service status
    console.log('\n');
    console.log(`${colors.bright}${colors.cyan}============================================${colors.reset}`);
    console.log(`${colors.bright}Service Status:${colors.reset}`);
    if (!backendOnly) {
      console.log(`  Frontend: ${colors.green}${CONFIG.frontendUrl}${colors.reset}`);
    }
    if (!frontendOnly) {
      console.log(`  Backend:  ${colors.green}http://localhost:${CONFIG.ports.backend}${colors.reset}`);
    }
    console.log(`${colors.bright}${colors.cyan}============================================${colors.reset}`);
    console.log('\n');
    
    log('info', 'Press Ctrl+C to stop all services');
    
    // Handle exit
    process.on('SIGINT', () => {
      console.log('\n');
      log('info', 'Stopping all services...');
      services.forEach(proc => {
        if (proc && !proc.killed) {
          try {
            proc.kill('SIGTERM');
          } catch (e) {
            // Ignore error
          }
        }
      });
      setTimeout(() => {
        log('success', 'All services stopped');
        process.exit(0);
      }, 2000);
    });
    
    // Keep process running
    process.stdin.resume();
    
  } catch (error) {
    log('error', 'Startup failed: ' + error.message);
    console.error(error);
    services.forEach(proc => {
      if (proc && !proc.killed) {
        try {
          proc.kill();
        } catch (e) {
          // Ignore error
        }
      }
    });
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
