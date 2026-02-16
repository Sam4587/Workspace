#!/usr/bin/env node

/**
 * 安全配置检查脚本
 * 用于验证环境变量配置和安全设置
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(colors.red, `❌ ${message}`);
}

function success(message) {
  log(colors.green, `✅ ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

// 检查环境变量
function checkEnvironmentVariables() {
  log(colors.cyan, '\n=== 环境变量安全检查 ===');
  
  const requiredVars = [
    { name: 'JWT_SECRET', description: 'JWT密钥' },
    { name: 'ADMIN_USERNAME', description: '管理员用户名' },
    { name: 'ADMIN_PASSWORD', description: '管理员密码' }
  ];

  const optionalVars = [
    { name: 'NODE_ENV', description: '运行环境' },
    { name: 'LOG_LEVEL', description: '日志级别' },
    { name: 'CORS_ORIGIN', description: 'CORS来源' }
  ];

  let hasErrors = false;
  let hasWarnings = false;

  // 检查必需变量
  log(colors.white, '\n必需配置项:');
  requiredVars.forEach(({ name, description }) => {
    if (!process.env[name]) {
      error(`${description} (${name}) 未配置`);
      hasErrors = true;
    } else {
      success(`${description} (${name}) 已配置`);
      
      // 额外检查
      if (name === 'JWT_SECRET') {
        if (process.env[name].length < 32) {
          warning('JWT_SECRET 长度建议至少32字符');
          hasWarnings = true;
        }
      }
      
      if (name === 'ADMIN_PASSWORD') {
        if (process.env[name] === 'admin123') {
          warning('正在使用默认密码，请修改');
          hasWarnings = true;
        }
        if (process.env[name].length < 8) {
          warning('密码长度建议至少8位');
          hasWarnings = true;
        }
      }
    }
  });

  // 检查可选变量
  log(colors.white, '\n推荐配置项:');
  optionalVars.forEach(({ name, description }) => {
    if (!process.env[name]) {
      warning(`${description} (${name}) 未配置`);
      hasWarnings = true;
    } else {
      success(`${description} (${name}) 已配置: ${process.env[name]}`);
    }
  });

  return { hasErrors, hasWarnings };
}

// 检查硬编码密钥
async function checkHardcodedSecrets() {
  log(colors.cyan, '\n=== 硬编码密钥扫描 ===');
  
  const excludeDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '__tests__',
    '__mocks__'
  ];

  const secretPatterns = [
    /['"`]sk-[a-zA-Z0-9]{20,}['"`]/gi,  // OpenAI API Key
    /['"`][a-zA-Z0-9]{32,}['"`]/gi,     // Generic long keys
    /password\s*[:=]\s*['"][^'"]+['"]/gi, // Password assignments
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,   // Secret assignments
    /api[key]?\s*[:=]\s*['"][^'"]+['"]/gi  // API Key assignments
  ];

  let findings = [];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // 跳过排除目录
      if (excludeDirs.some(exclude => fullPath.includes(exclude))) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx|json|env)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          secretPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              matches.forEach(match => {
                findings.push({
                  file: path.relative(process.cwd(), fullPath),
                  line: content.substring(0, content.indexOf(match)).split('\n').length,
                  match: match.trim()
                });
              });
            }
          });
        } catch (err) {
          // 忽略无法读取的文件
        }
      }
    }
  }

  // 扫描项目目录
  scanDirectory(process.cwd());

  if (findings.length === 0) {
    success('未发现可疑的硬编码密钥');
  } else {
    error(`发现 ${findings.length} 个可疑的硬编码密钥:`);
    findings.forEach(({ file, line, match }) => {
      warning(`  ${file}:${line} -> ${match}`);
    });
  }

  return findings.length > 0;
}

// 检查Git历史中的敏感信息
async function checkGitHistory() {
  log(colors.cyan, '\n=== Git历史安全检查 ===');
  
  try {
    // 检查是否有git-secrets工具
    require('child_process').execSync('git secrets --version', { stdio: 'ignore' });
    
    info('运行 git-secrets 扫描...');
    const { execSync } = require('child_process');
    const output = execSync('git secrets --scan-history', { encoding: 'utf8' });
    
    if (output.trim()) {
      error('Git历史中发现敏感信息:');
      console.log(output);
      return true;
    } else {
      success('Git历史中未发现敏感信息');
      return false;
    }
  } catch (err) {
    warning('未安装 git-secrets，跳过历史扫描');
    info('安装建议: brew install git-secrets (macOS) 或 apt-get install git-secrets (Linux)');
    return false;
  }
}

// 生成安全配置报告
function generateSecurityReport(hasEnvErrors, hasEnvWarnings, hasHardcodedSecrets, hasGitIssues) {
  log(colors.cyan, '\n=== 安全配置报告 ===');
  
  const issues = [];
  if (hasEnvErrors) issues.push('环境变量配置错误');
  if (hasEnvWarnings) issues.push('环境变量配置警告');
  if (hasHardcodedSecrets) issues.push('发现硬编码密钥');
  if (hasGitIssues) issues.push('Git历史包含敏感信息');

  if (issues.length === 0) {
    success('🎉 安全检查通过！没有发现严重问题。');
    log(colors.green, '\n建议:');
    log(colors.white, '• 定期运行此检查脚本');
    log(colors.white, '• 保持依赖包更新');
    log(colors.white, '• 监控安全公告');
  } else {
    error(`发现 ${issues.length} 个安全问题:`);
    issues.forEach(issue => warning(`• ${issue}`));
    
    log(colors.yellow, '\n建议修复步骤:');
    if (hasEnvErrors) {
      log(colors.white, '1. 按照 .env.example 配置必需的环境变量');
    }
    if (hasHardcodedSecrets) {
      log(colors.white, '2. 移除代码中的硬编码密钥，使用环境变量');
    }
    if (hasGitIssues) {
      log(colors.white, '3. 清理Git历史中的敏感信息');
    }
    log(colors.white, '4. 重新运行此脚本验证修复结果');
  }
}

// 生成JWT密钥
function generateJwtSecret() {
  log(colors.cyan, '\n=== JWT密钥生成工具 ===');
  
  const secret = createHash('sha256').update(Date.now().toString()).digest('hex') + 
                 createHash('sha256').update(Math.random().toString()).digest('hex');
  success('生成的安全JWT密钥:');
  console.log(secret);
  
  log(colors.yellow, '\n使用方法:');
  log(colors.white, '1. 将此密钥添加到 .env 文件:');
  log(colors.white, '   JWT_SECRET=' + secret);
  log(colors.white, '2. 重启应用使配置生效');
  
  return secret;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--generate-key')) {
    generateJwtSecret();
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
安全检查工具使用说明:

命令:
  node security-check.js              # 运行完整安全检查
  node security-check.js --generate-key # 生成JWT密钥
  node security-check.js --help        # 显示帮助信息

检查项目:
  • 环境变量配置
  • 硬编码密钥扫描  
  • Git历史敏感信息检查
  • 安全配置建议

    `);
    return;
  }

  log(colors.magenta, '🔐 AI内容创作系统安全检查工具');
  log(colors.magenta, '=====================================');

  // 加载环境变量
  (await import('dotenv')).config({ path: path.resolve(__dirname, '../../server/.env') });

  try {
    // 执行各项检查
    const { hasErrors: envErrors, hasWarnings: envWarnings } = checkEnvironmentVariables();
    const hasHardcodedSecrets = await checkHardcodedSecrets();
    const hasGitIssues = await checkGitHistory();

    // 生成报告
    generateSecurityReport(envErrors, envWarnings, hasHardcodedSecrets, hasGitIssues);

  } catch (error) {
    error('检查过程中发生错误:');
    console.error(error);
    process.exit(1);
  }
}

// 运行主函数
if (import.meta.url === `file://${__filename}`) {
  main();
}