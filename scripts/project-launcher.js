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
  browser: 'quark', // 夸克浏览器
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
  const timestamp = new Date().toLocaleTimeString();
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
      resolve(false); // 端口可用
    });
    server.on('error', () => {
      resolve(true); // 端口被占用
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

// 启动服务
function startService(name, command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    log('info', `启动 ${name}...`);
    
    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
      shell: true,
      windowsHide: true
    });
    
    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // 等待服务启动
    setTimeout(() => {
      if (proc.pid) {
        log('success', `${name} 已启动 (PID: ${proc.pid})`);
        resolve(proc);
      } else {
        reject(new Error(`${name} 启动失败`));
      }
    }, 3000);
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// 打开浏览器
function openBrowser(url) {
  return new Promise((resolve, reject) => {
    log('info', `正在打开浏览器访问 ${url}...`);
    
    let command;
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows - 尝试使用夸克浏览器
      const quarkPaths = [
        path.join(process.env.LOCALAPPDATA, 'Quark', 'Application', 'quark.exe'),
        path.join(process.env.PROGRAMFILES, 'Quark', 'Application', 'quark.exe'),
        path.join(process.env['PROGRAMFILES(X86)'], 'Quark', 'Application', 'quark.exe')
      ];
      
      let quarkPath = quarkPaths.find(p => fs.existsSync(p));
      
      if (quarkPath) {
        command = `"${quarkPath}" "${url}"`;
      } else {
        // 使用默认浏览器
        command = `start "" "${url}"`;
      }
    } else if (platform === 'darwin') {
      command = `open "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }
    
    exec(command, (error) => {
      if (error) {
        log('warning', '无法自动打开浏览器，请手动访问: ' + url);
        reject(error);
      } else {
        log('success', '浏览器已打开');
        resolve();
      }
    });
  });
}

// 创建桌面快捷方式 (Windows)
function createDesktopShortcut() {
  if (os.platform() !== 'win32') {
    log('warning', '桌面快捷方式仅在 Windows 上支持');
    return;
  }
  
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const shortcutPath = path.join(desktopPath, 'AI Content Flow.lnk');
  const scriptPath = path.resolve(__dirname, 'project-launcher.js');
  
  // 创建 VBS 脚本来生成快捷方式
  const vbsScript = `
Set WshShell = WScript.CreateObject("WScript.Shell")
Set oLink = WshShell.CreateShortcut("${shortcutPath}")
oLink.TargetPath = "node"
oLink.Arguments = "\"${scriptPath}\""
oLink.WorkingDirectory = "${CONFIG.projectRoot}"
oLink.IconLocation = "${path.join(CONFIG.projectRoot, 'favicon.png')}"
oLink.Description = "启动 AI Content Flow 开发环境"
oLink.Save
  `.trim();
  
  const vbsPath = path.join(os.tmpdir(), 'create-shortcut.vbs');
  fs.writeFileSync(vbsPath, vbsScript);
  
  exec(`cscript //nologo "${vbsPath}"`, (error) => {
    fs.unlinkSync(vbsPath);
    if (error) {
      log('error', '创建桌面快捷方式失败: ' + error.message);
    } else {
      log('success', `桌面快捷方式已创建: ${shortcutPath}`);
    }
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
  
  // 创建快捷方式模式
  if (args.includes('--create-shortcut')) {
    createDesktopShortcut();
    return;
  }
  
  // 显示帮助
  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法: node project-launcher.js [选项]\n');
    console.log('选项:');
    console.log('  --create-shortcut  创建桌面快捷方式');
    console.log('  --help, -h         显示帮助信息');
    console.log('  --no-browser       不自动打开浏览器');
    console.log('\n功能:');
    console.log('  1. 检查端口占用情况');
    console.log('  2. 启动后端服务 (端口 5001)');
    console.log('  3. 启动前端服务 (端口 5174)');
    console.log('  4. 自动在浏览器中打开前端页面');
    return;
  }
  
  const noBrowser = args.includes('--no-browser');
  const services = [];
  
  try {
    // 检查端口
    log('info', '检查端口占用情况...');
    const ports = [
      { name: '前端', port: CONFIG.ports.frontend },
      { name: '后端', port: CONFIG.ports.backend }
    ];
    
    for (const { name, port } of ports) {
      const isOccupied = await checkPort(port);
      if (isOccupied) {
        log('warning', `${name}端口 ${port} 已被占用`);
      } else {
        log('success', `${name}端口 ${port} 可用`);
      }
    }
    
    // 检查环境变量文件
    const envPath = path.join(CONFIG.projectRoot, 'server', '.env');
    if (!fs.existsSync(envPath)) {
      log('warning', '未找到 server/.env 文件，将使用默认配置');
      log('info', '建议复制 server/.env.example 到 server/.env 并配置');
    }
    
    // 启动后端
    log('info', '正在启动后端服务...');
    const backend = await startService(
      '后端服务',
      'npm',
      ['run', 'dev'],
      path.join(CONFIG.projectRoot, 'server')
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
    
    // 启动前端
    log('info', '正在启动前端服务...');
    const frontend = await startService(
      '前端服务',
      'npm',
      ['run', 'dev'],
      CONFIG.projectRoot
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
    
    // 打开浏览器
    if (!noBrowser) {
      await openBrowser(CONFIG.frontendUrl);
    }
    
    // 显示服务状态
    console.log('\n');
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}服务状态:${colors.reset}`);
    console.log(`  前端: ${colors.green}http://localhost:${CONFIG.ports.frontend}${colors.reset}`);
    console.log(`  后端: ${colors.green}http://localhost:${CONFIG.ports.backend}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log('\n');
    
    log('info', '按 Ctrl+C 停止所有服务');
    
    // 处理退出
    process.on('SIGINT', () => {
      console.log('\n');
      log('info', '正在停止所有服务...');
      services.forEach(proc => {
        if (proc && !proc.killed) {
          proc.kill('SIGTERM');
        }
      });
      setTimeout(() => {
        log('success', '所有服务已停止');
        process.exit(0);
      }, 2000);
    });
    
  } catch (error) {
    log('error', '启动失败: ' + error.message);
    services.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill();
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
