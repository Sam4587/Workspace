/**
 * 服务诊断工具
 * 用于检测服务状态和排查连接问题
 */

const http = require('http');
const net = require('net');
const { exec } = require('child_process');

const CONFIG = {
  ports: {
    frontend: 5174,
    backend: 5001
  }
};

function log(message) {
  console.log('[' + new Date().toISOString() + '] ' + message);
}

/**
 * 检查端口是否被占用
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve({ inUse: true, error: null });
      } else {
        resolve({ inUse: false, error: err.message });
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve({ inUse: false, error: null });
    });
    
    server.listen(port);
  });
}

/**
 * 检查HTTP服务是否响应
 */
function checkHttpService(port, path = '/') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          success: true,
          statusCode: res.statusCode,
          headers: res.headers,
          dataPreview: data.substring(0, 200)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        code: err.code
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

/**
 * 查找占用端口的进程
 */
function findProcessOnPort(port) {
  return new Promise((resolve) => {
    exec('netstat -ano | findstr ":' + port + '"', (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      const processes = [];
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          const localAddress = parts[1];
          if (localAddress.includes(':' + port)) {
            processes.push({
              localAddress: localAddress,
              pid: pid,
              state: parts[parts.length - 2] || 'UNKNOWN'
            });
          }
        }
      }
      
      resolve(processes);
    });
  });
}

/**
 * 获取进程信息
 */
function getProcessInfo(pid) {
  return new Promise((resolve) => {
    exec('tasklist /FI "PID eq ' + pid + '" /FO CSV /NH', (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      if (lines.length > 0) {
        const parts = lines[0].split('","');
        if (parts.length >= 2) {
          resolve({
            name: parts[0].replace('"', ''),
            pid: parts[1],
            memory: parts[parts.length - 1].replace('"', '')
          });
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * 主诊断函数
 */
async function runDiagnostics() {
  console.log('========================================');
  console.log('   AI Content Flow - Service Diagnostic');
  console.log('========================================');
  console.log('');

  // 1. 检查端口占用情况
  console.log('1. Checking port status...');
  console.log('');
  
  for (const [service, port] of Object.entries(CONFIG.ports)) {
    const portStatus = await checkPort(port);
    const processes = await findProcessOnPort(port);
    
    console.log('   Port ' + port + ' (' + service + '):');
    
    if (portStatus.inUse) {
      console.log('     Status: IN USE');
      
      if (processes.length > 0) {
        console.log('     Processes:');
        for (const proc of processes) {
          const procInfo = await getProcessInfo(proc.pid);
          if (procInfo) {
            console.log('       - PID: ' + proc.pid + ', Name: ' + procInfo.name + ', Memory: ' + procInfo.memory);
          } else {
            console.log('       - PID: ' + proc.pid + ', State: ' + proc.state);
          }
        }
      }
      
      // 检查HTTP响应
      console.log('     HTTP Check:');
      const httpCheck = await checkHttpService(port);
      if (httpCheck.success) {
        console.log('       ✓ Service is responding');
        console.log('       Status: ' + httpCheck.statusCode);
        console.log('       Content-Type: ' + (httpCheck.headers['content-type'] || 'N/A'));
      } else {
        console.log('       ✗ Service not responding');
        console.log('       Error: ' + httpCheck.error);
        if (httpCheck.code) {
          console.log('       Error Code: ' + httpCheck.code);
        }
      }
    } else {
      console.log('     Status: FREE');
      console.log('     No process is using this port');
    }
    console.log('');
  }

  // 2. 网络连接测试
  console.log('2. Testing network connectivity...');
  console.log('');
  
  const hosts = ['localhost', '127.0.0.1'];
  for (const host of hosts) {
    console.log('   Host: ' + host);
    for (const [service, port] of Object.entries(CONFIG.ports)) {
      const start = Date.now();
      try {
        await new Promise((resolve, reject) => {
          const socket = new net.Socket();
          socket.setTimeout(3000);
          socket.on('connect', () => {
            const elapsed = Date.now() - start;
            console.log('     Port ' + port + ' (' + service + '): ✓ Connected (' + elapsed + 'ms)');
            socket.destroy();
            resolve();
          });
          socket.on('timeout', () => {
            console.log('     Port ' + port + ' (' + service + '): ✗ Timeout');
            socket.destroy();
            reject(new Error('Timeout'));
          });
          socket.on('error', (err) => {
            console.log('     Port ' + port + ' (' + service + '): ✗ ' + err.message);
            reject(err);
          });
          socket.connect(port, host);
        });
      } catch (e) {
        // 错误已在上面处理
      }
    }
    console.log('');
  }

  // 3. 提供解决方案
  console.log('3. Recommendations:');
  console.log('');
  
  const frontendPortStatus = await checkPort(CONFIG.ports.frontend);
  const backendPortStatus = await checkPort(CONFIG.ports.backend);
  
  if (!frontendPortStatus.inUse && !backendPortStatus.inUse) {
    console.log('   ✗ No services are running');
    console.log('');
    console.log('   Solution: Run AI-Content-Flow-Start-Service.bat to start services');
  } else if (!frontendPortStatus.inUse) {
    console.log('   ✗ Frontend service is not running');
    console.log('');
    console.log('   Solution:');
    console.log('   1. Stop all services: Run AI-Content-Flow-Stop-Service.bat');
    console.log('   2. Start services again: Run AI-Content-Flow-Start-Service.bat');
  } else if (!backendPortStatus.inUse) {
    console.log('   ⚠ Backend service is not running');
    console.log('');
    console.log('   Solution:');
    console.log('   1. Check backend logs: logs/backend.log');
    console.log('   2. Restart services: Run AI-Content-Flow-Stop-Service.bat then AI-Content-Flow-Start-Service.bat');
  } else {
    const frontendHttp = await checkHttpService(CONFIG.ports.frontend);
    const backendHttp = await checkHttpService(CONFIG.ports.backend);
    
    if (frontendHttp.success && backendHttp.success) {
      console.log('   ✓ All services are running correctly');
      console.log('');
      console.log('   You can access the application at:');
      console.log('   http://localhost:' + CONFIG.ports.frontend);
    } else {
      console.log('   ⚠ Services are running but not responding correctly');
      console.log('');
      console.log('   Possible causes:');
      console.log('   - Services are still initializing');
      console.log('   - Firewall blocking connections');
      console.log('   - Services crashed');
      console.log('');
      console.log('   Solution:');
      console.log('   1. Wait 10-20 seconds and try again');
      console.log('   2. Check logs in logs/ directory');
      console.log('   3. Restart services');
    }
  }
  
  console.log('');
  console.log('========================================');
  console.log('');
  console.log('This window will close in 10 seconds...');
  
  setTimeout(() => {
    process.exit(0);
  }, 10000);
}

runDiagnostics().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
