#!/usr/bin/env node

/**
 * Auto Dev Server 功能测试脚本
 * 用于验证Auto Dev Server的各项功能
 */

import { execSync } from 'child_process';
import path from 'path';

console.log('🧪 Auto Dev Server 功能测试\n');

// 测试1: 帮助信息
console.log('1. 测试帮助信息显示...');
try {
  const helpOutput = execSync('node scripts/auto-dev-server/src/cli.js --help', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ 帮助信息显示正常\n');
} catch (error) {
  console.log('❌ 帮助信息显示失败:', error.message);
}

// 测试2: 配置文件创建
console.log('2. 测试配置文件创建...');
try {
  const configOutput = execSync('node scripts/auto-dev-server/src/cli.js --create-config', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ 配置文件创建成功\n');
} catch (error) {
  console.log('❌ 配置文件创建失败:', error.message);
}

// 测试3: 服务状态查询
console.log('3. 测试服务状态查询...');
try {
  const statusOutput = execSync('node scripts/auto-dev-server/src/cli.js status', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ 服务状态查询正常\n');
  console.log('服务状态输出:');
  console.log(statusOutput);
} catch (error) {
  console.log('❌ 服务状态查询失败:', error.message);
}

// 测试4: 版本信息
console.log('4. 测试版本信息显示...');
try {
  const versionOutput = execSync('node scripts/auto-dev-server/src/cli.js --version', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ 版本信息显示正常\n');
} catch (error) {
  console.log('❌ 版本信息显示失败:', error.message);
}

console.log('🏁 Auto Dev Server 功能测试完成！');