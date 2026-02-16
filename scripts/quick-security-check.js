#!/usr/bin/env node

// 简化版安全检查脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

console.log('🔐 AI内容创作系统安全检查');
console.log('========================');

// 检查环境变量
console.log('\n📋 环境变量检查:');
const requiredEnvVars = ['JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];

let allGood = true;
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: 已配置`);
  } else {
    console.log(`❌ ${varName}: 未配置`);
    allGood = false;
  }
});

// 检查.env文件
const envPath = path.resolve(__dirname, '../server/.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env 文件存在');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your-jwt-secret-here') || 
      envContent.includes('admin123') ||
      envContent.includes('sk-')) {
    console.log('⚠️  .env 文件中可能包含默认值或示例密钥');
    allGood = false;
  }
} else {
  console.log('❌ .env 文件不存在');
  allGood = false;
}

// 检查认证路由安全性
const authRoutePath = path.resolve(__dirname, '../server/routes/auth.js');
if (fs.existsSync(authRoutePath)) {
  const authContent = fs.readFileSync(authRoutePath, 'utf8');
  
  console.log('\n🔍 代码安全检查:');
  
  // 检查是否有硬编码密钥
  if (authContent.includes("'your-secret-key'") || 
      authContent.includes('"your-secret-key"')) {
    console.log('❌ 发现硬编码JWT密钥');
    allGood = false;
  } else {
    console.log('✅ 未发现硬编码JWT密钥');
  }
  
  // 检查是否有默认密码
  if (authContent.includes("'admin123'") || 
      authContent.includes('"admin123"')) {
    console.log('⚠️  发现默认密码（这可能是有意的设计）');
  } else {
    console.log('✅ 未使用明显默认密码');
  }
}

console.log('\n📊 检查结果:');
if (allGood) {
  console.log('🎉 基本安全配置良好！');
  console.log('\n建议:');
  console.log('• 定期更新依赖包');
  console.log('• 监控安全公告');
  console.log('• 实施更严格的访问控制');
} else {
  console.log('🚨 发现安全配置问题，请及时修复');
  console.log('\n紧急修复步骤:');
  console.log('1. 复制 server/.env.example 到 server/.env');
  console.log('2. 配置 JWT_SECRET 和管理员凭证');
  console.log('3. 重启服务使配置生效');
}

console.log('\n💡 提示: 运行 node scripts/security-check.js --generate-key 生成安全的JWT密钥');