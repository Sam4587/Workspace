const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  logs: {
    backend: path.join(__dirname, '..', 'logs', 'backend.log'),
    frontend: path.join(__dirname, '..', 'logs', 'frontend.log')
  },
  ports: {
    frontend: 5174,
    backend: 5001
  }
};

function ensureLogsDir() {
  const logsDir = path.dirname(CONFIG.logs.backend);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function timestamp() {
  return new Date().toISOString();
}

function log(message) {
  console.log('[' + timestamp() + '] ' + message);
}

/**
 * 改进的服务检测函数
 */
function waitForService(port, timeoutMs, serviceName) {
  timeoutMs = timeoutMs || 30000;
  const start = Date.now();
  let checkCount = 0;
  
  return new Promise(function(resolve) {
    function check() {
      checkCount++;
      const elapsed = Date.now() - start;
      
      const req = http.get('http://localhost:' + port, function(res) {
        log(serviceName + ' responded with status: ' + res.statusCode + ' (after ' + elapsed + 'ms, ' + checkCount + ' attempts)');
        resolve({ ready: true, elapsed: elapsed, attempts: checkCount });
      });
      
      req.on('error', function(err) {
        if (Date.now() - start < timeoutMs) {
          if (checkCount % 5 === 0) {
            log(serviceName + ' not ready yet... (' + elapsed + 'ms elapsed)');
          }
          setTimeout(check, 500);
        } else {
          log(serviceName + ' failed to start after ' + timeoutMs + 'ms (' + checkCount + ' attempts)');
          resolve({ ready: false, elapsed: elapsed, attempts: checkCount, error: err.message });
        }
      });
      
      req.setTimeout(2000, function() {
        req.destroy();
        if (Date.now() - start < timeoutMs) {
          setTimeout(check, 500);
        } else {
          resolve({ ready: false, elapsed: Date.now() - start, attempts: checkCount, error: 'Timeout' });
        }
      });
    }
    
    check();
  });
}

/**
 * 查找夸克浏览器路径
 */
function findQuarkBrowser() {
  const possiblePaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Quark', 'Application', 'quark.exe'),
    path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Quark', 'Application', 'quark.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Quark', 'Application', 'quark.exe'),
    path.join(process.env.PROGRAMFILESX86 || '', 'Quark', 'Application', 'quark.exe'),
    'C:\\Program Files\\Quark\\Application\\quark.exe',
    'C:\\Program Files (x86)\\Quark\\Application\\quark.exe',
    'D:\\Program Files\\Quark\\Application\\quark.exe',
    'D:\\Program Files (x86)\\Quark\\Application\\quark.exe',
  ];

  for (const browserPath of possiblePaths) {
    if (fs.existsSync(browserPath)) {
      return browserPath;
    }
  }
  return null;
}

/**
 * 通过注册表查找夸克浏览器
 */
function findQuarkFromRegistry() {
  try {
    const { execSync } = require('child_process');
    const result = execSync('reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\quark.exe" /ve 2>nul', { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'ignore'] 
    });
    const match = result.match(/REG_SZ\s+(.+\.exe)/i);
    if (match && fs.existsSync(match[1])) {
      return match[1];
    }
  } catch (e) {}
  return null;
}

/**
 * 打开浏览器访问URL
 */
function openBrowser(url, delayMs) {
  delayMs = delayMs || 2000;
  
  setTimeout(() => {
    log('Searching for Quark browser...');
    
    let quarkPath = findQuarkBrowser();
    if (!quarkPath) {
      quarkPath = findQuarkFromRegistry();
    }
    
    if (quarkPath) {
      try {
        log('Found Quark browser at: ' + quarkPath);
        const browserProcess = spawn(quarkPath, [url], {
          detached: true,
          stdio: 'ignore',
          windowsHide: false
        });
        browserProcess.unref();
        log('✓ Opened URL with Quark browser: ' + url);
        return;
      } catch (e) {
        log('✗ Failed to open with Quark: ' + e.message);
      }
    }
    
    // 备用浏览器
    const backupBrowsers = [
      { name: 'Edge', path: path.join(process.env.PROGRAMFILESX86 || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe') },
      { name: 'Edge', path: path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe') },
      { name: 'Chrome', path: path.join(process.env.PROGRAMFILESX86 || '', 'Google', 'Chrome', 'Application', 'chrome.exe') },
      { name: 'Chrome', path: path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe') },
    ];
    
    log('Quark browser not found, trying backup browsers...');
    
    for (const browser of backupBrowsers) {
      if (fs.existsSync(browser.path)) {
        try {
          const browserProcess = spawn(browser.path, [url], {
            detached: true,
            stdio: 'ignore',
            windowsHide: false
          });
          browserProcess.unref();
          log('✓ Opened URL with ' + browser.name + ' browser: ' + url);
          return;
        } catch (e) {
          continue;
        }
      }
    }
    
    // 系统默认浏览器
    try {
      exec('start "" "' + url + '"');
      log('✓ Opened URL with system default browser');
    } catch (e) {
      log('✗ Failed to open browser: ' + e.message);
    }
  }, delayMs);
}

function startBackend() {
  log('Starting backend service...');
  const backendLog = fs.openSync(CONFIG.logs.backend, 'a');
  
  const backend = spawn('node', ['server.js'], {
    cwd: path.join(CONFIG.projectRoot, 'server'),
    detached: true,
    stdio: ['ignore', backendLog, backendLog],
    windowsHide: true,
    env: process.env
  });
  
  backend.unref();
  log('✓ Backend started (PID: ' + backend.pid + ')');
  return backend.pid;
}

/**
 * 修复后的前端启动函数
 * 使用 npx 正确启动 vite
 */
function startFrontend() {
  log('Starting frontend service...');
  const frontendLog = fs.openSync(CONFIG.logs.frontend, 'a');
  
  // 使用 npx vite 启动前端服务
  // 在 Windows 上使用 cmd /c 来正确执行 npx
  const frontend = spawn('cmd', ['/c', 'npx', 'vite', '--port', '5174', '--host'], {
    cwd: CONFIG.projectRoot,
    detached: true,
    stdio: ['ignore', frontendLog, frontendLog],
    windowsHide: true,
    env: process.env
  });
  
  frontend.unref();
  log('✓ Frontend started (PID: ' + frontend.pid + ')');
  
  // 监听进程错误
  frontend.on('error', (err) => {
    log('✗ Frontend process error: ' + err.message);
  });
  
  return frontend.pid;
}

async function start() {
  console.log('========================================');
  console.log('   AI Content Flow - Service Manager');
  console.log('========================================');
  console.log('');
  
  const startTime = Date.now();
  
  ensureLogsDir();
  
  // 1. 启动后端服务
  const backendPid = startBackend();
  
  // 2. 等待后端就绪
  log('Waiting for backend to be ready...');
  const backendStatus = await waitForService(CONFIG.ports.backend, 60000, 'Backend');
  
  if (!backendStatus.ready) {
    console.log('');
    console.log('========================================');
    console.log('   ✗ FAILED: Backend failed to start');
    console.log('========================================');
    console.log('');
    console.log('Please check the logs:');
    console.log('  ' + CONFIG.logs.backend);
    console.log('');
    console.log('Press any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(1));
    return;
  }
  
  log('✓ Backend ready at http://localhost:' + CONFIG.ports.backend + 
      ' (' + backendStatus.elapsed + 'ms, ' + backendStatus.attempts + ' attempts)');
  
  // 3. 启动前端服务
  const frontendPid = startFrontend();
  
  // 4. 等待前端就绪
  log('Waiting for frontend to be ready...');
  const frontendStatus = await waitForService(CONFIG.ports.frontend, 60000, 'Frontend');
  
  if (!frontendStatus.ready) {
    console.log('');
    console.log('========================================');
    console.log('   ✗ FAILED: Frontend failed to start');
    console.log('========================================');
    console.log('');
    console.log('Please check the logs:');
    console.log('  ' + CONFIG.logs.frontend);
    console.log('');
    console.log('Common solutions:');
    console.log('  1. Run: npm install');
    console.log('  2. Check if port 5174 is in use');
    console.log('  3. Check the frontend log for errors');
    console.log('');
    console.log('Press any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(1));
    return;
  }
  
  log('✓ Frontend ready at http://localhost:' + CONFIG.ports.frontend + 
      ' (' + frontendStatus.elapsed + 'ms, ' + frontendStatus.attempts + ' attempts)');
  
  // 5. 额外等待确保服务完全就绪
  log('Waiting for services to stabilize...');
  await new Promise(r => setTimeout(r, 1000));
  
  // 6. 打开浏览器
  const serviceUrl = 'http://localhost:' + CONFIG.ports.frontend;
  log('Opening browser in 2 seconds...');
  openBrowser(serviceUrl, 2000);
  
  const totalTime = Date.now() - startTime;
  
  // 7. 显示成功信息
  setTimeout(() => {
    console.log('');
    console.log('========================================');
    console.log('   ✓ Services started successfully!');
    console.log('========================================');
    console.log('');
    console.log('Total startup time: ' + totalTime + 'ms');
    console.log('');
    console.log('Services:');
    console.log('  Frontend: http://localhost:' + CONFIG.ports.frontend);
    console.log('  Backend:  http://localhost:' + CONFIG.ports.backend);
    console.log('');
    console.log('Logs:');
    console.log('  Backend:  ' + CONFIG.logs.backend);
    console.log('  Frontend: ' + CONFIG.logs.frontend);
    console.log('');
    console.log('Press Ctrl+C to stop services');
    console.log('');
    console.log('This window will close in 5 seconds...');
    
    setTimeout(function() {
      process.exit(0);
    }, 5000);
  }, 2500);
}

start().catch(function(err) {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
