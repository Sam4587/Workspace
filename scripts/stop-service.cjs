const path = require('path');
const fs = require('fs');

const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  ports: {
    frontend: 5174,
    backend: 5001
  }
};

function timestamp() {
  return new Date().toISOString();
}

function log(message) {
  console.log('[' + timestamp() + '] ' + message);
}

function killProcessByPort(port) {
  const { execSync } = require('child_process');
  try {
    const output = execSync('netstat -ano | findstr ":' + port + '" | findstr "LISTENING"', { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    
    var killed = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var parts = line.trim().split(/\s+/);
      var pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        try {
          process.kill(parseInt(pid));
          log('Stopped process on port ' + port + ' (PID: ' + pid + ')');
          killed = true;
        } catch (e) {
          log('Failed to stop PID ' + pid + ' on port ' + port);
        }
      }
    }
    return killed;
  } catch (e) {
    log('No process found on port ' + port);
    return false;
  }
}

async function stop() {
  console.log('========================================');
  console.log('   AI Content Flow - Service Stopper');
  console.log('========================================');
  console.log('');
  
  var stopped = false;
  
  console.log('Cleaning up ports...');
  
  if (killProcessByPort(CONFIG.ports.frontend)) stopped = true;
  if (killProcessByPort(CONFIG.ports.backend)) stopped = true;
  
  console.log('');
  console.log('========================================');
  if (stopped) {
    console.log('   Services stopped successfully!');
  } else {
    console.log('   No services were running');
  }
  console.log('========================================');
  console.log('');
  console.log('This window will close in 2 seconds...');
  
  setTimeout(function() {
    process.exit(0);
  }, 2000);
}

stop().catch(console.error);
