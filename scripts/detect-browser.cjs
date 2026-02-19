/**
 * 浏览器检测工具
 * 用于诊断夸克浏览器是否正确安装和检测
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('========================================');
console.log('   Browser Detection Diagnostic Tool');
console.log('========================================');
console.log('');

// 检测环境变量
console.log('Environment Variables:');
console.log('  LOCALAPPDATA: ' + (process.env.LOCALAPPDATA || 'Not set'));
console.log('  USERPROFILE: ' + (process.env.USERPROFILE || 'Not set'));
console.log('  PROGRAMFILES: ' + (process.env.PROGRAMFILES || 'Not set'));
console.log('  PROGRAMFILESX86: ' + (process.env.PROGRAMFILESX86 || 'Not set'));
console.log('');

// 夸克浏览器可能路径
const quarkPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Quark', 'Application', 'quark.exe'),
    path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Quark', 'Application', 'quark.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Quark', 'Application', 'quark.exe'),
    path.join(process.env.PROGRAMFILESX86 || '', 'Quark', 'Application', 'quark.exe'),
    'C:\\Program Files\\Quark\\Application\\quark.exe',
    'C:\\Program Files (x86)\\Quark\\Application\\quark.exe',
    'D:\\Program Files\\Quark\\Application\\quark.exe',
    'D:\\Program Files (x86)\\Quark\\Application\\quark.exe',
];

console.log('Checking Quark Browser paths:');
let quarkFound = false;
for (const browserPath of quarkPaths) {
    const exists = fs.existsSync(browserPath);
    const status = exists ? '✓ FOUND' : '✗ Not found';
    console.log('  ' + status + ': ' + browserPath);
    if (exists && !quarkFound) {
        quarkFound = true;
    }
}
console.log('');

// 尝试从注册表查找
console.log('Checking Windows Registry:');
try {
    const result = execSync('reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\quark.exe" /ve 2>nul', { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', 'ignore'] 
    });
    console.log('  Registry query result:');
    console.log('  ' + result.split('\n').join('\n  '));
    
    const match = result.match(/REG_SZ\s+(.+\.exe)/i);
    if (match) {
        console.log('  ✓ Found in registry: ' + match[1]);
        if (fs.existsSync(match[1])) {
            console.log('  ✓ File exists at registry path');
        } else {
            console.log('  ✗ File does not exist at registry path');
        }
    }
} catch (e) {
    console.log('  ✗ Not found in registry or registry access denied');
}
console.log('');

// 备用浏览器检测
console.log('Checking Backup Browsers:');
const backupBrowsers = [
    { name: 'Edge (x86)', path: path.join(process.env.PROGRAMFILESX86 || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe') },
    { name: 'Edge', path: path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe') },
    { name: 'Chrome (x86)', path: path.join(process.env.PROGRAMFILESX86 || '', 'Google', 'Chrome', 'Application', 'chrome.exe') },
    { name: 'Chrome', path: path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe') },
];

for (const browser of backupBrowsers) {
    const exists = fs.existsSync(browser.path);
    const status = exists ? '✓ FOUND' : '✗ Not found';
    console.log('  ' + status + ': ' + browser.name);
}
console.log('');

// 总结
console.log('========================================');
if (quarkFound) {
    console.log('✓ Quark browser detected!');
    console.log('  Service start will use Quark browser.');
} else {
    console.log('✗ Quark browser not detected.');
    console.log('  Please install Quark browser from:');
    console.log('  https://www.quark.cn/');
    console.log('');
    console.log('  Or ensure it is installed at one of the');
    console.log('  checked paths above.');
}
console.log('========================================');
console.log('');
console.log('This window will close in 5 seconds...');

setTimeout(function() {
    process.exit(0);
}, 5000);
