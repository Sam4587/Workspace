#!/usr/bin/env node

/**
 * API 测试脚本
 * 用于验证API端点的功能和响应
 */

import axios from 'axios';

// 配置
const BASE_URL = 'http://localhost:5001/api';
const TEST_TIMEOUT = 10000;

// 测试客户端
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试结果统计
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// 测试用例定义
const testCases = [
  {
    name: '健康检查',
    method: 'GET',
    url: '/monitoring/health',
    expectedStatus: 200
  },
  {
    name: '系统信息',
    method: 'GET',
    url: '/monitoring/system',
    expectedStatus: 200
  },
  {
    name: '性能指标',
    method: 'GET',
    url: '/monitoring/metrics',
    expectedStatus: 200
  },
  {
    name: '热点数据源',
    method: 'GET',
    url: '/hot-topics/sources',
    expectedStatus: 200
  },
  {
    name: '内容平台列表',
    method: 'GET',
    url: '/content/platforms',
    expectedStatus: 200
  },
  {
    name: '视频平台列表',
    method: 'GET',
    url: '/video/platforms/list',
    expectedStatus: 200
  },
  {
    name: '转录引擎列表',
    method: 'GET',
    url: '/transcription/engines/list',
    expectedStatus: 200
  },
  {
    name: 'LLM模型列表',
    method: 'GET',
    url: '/llm/models',
    expectedStatus: 200
  }
];

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// 执行单个测试
async function runTest(testCase) {
  testResults.total++;
  
  try {
    console.log(`${colors.blue('🧪')} 测试: ${testCase.name}`);
    console.log(`${colors.gray('   请求:')} ${testCase.method} ${BASE_URL}${testCase.url}`);
    
    const startTime = Date.now();
    const response = await apiClient({
      method: testCase.method,
      url: testCase.url,
      data: testCase.data
    });
    const duration = Date.now() - startTime;
    
    if (response.status === testCase.expectedStatus) {
      testResults.passed++;
      console.log(`${colors.green('   ✅ 通过')} (${duration}ms)`);
      
      // 显示响应摘要
      if (response.data && typeof response.data === 'object') {
        const dataKeys = Object.keys(response.data);
        console.log(`${colors.gray('   响应:')} ${dataKeys.length} 个字段`);
        if (dataKeys.includes('success') && response.data.success === false) {
          console.log(`${colors.yellow('   ⚠️  API返回失败状态')}`);
        }
      }
    } else {
      testResults.failed++;
      console.log(`${colors.red('   ❌ 失败')} 期望状态码 ${testCase.expectedStatus}，实际 ${response.status}`);
    }
    
  } catch (error) {
    testResults.failed++;
    console.log(`${colors.red('   ❌ 错误')} ${error.message}`);
    
    if (error.response) {
      console.log(`${colors.gray('   服务响应:')} ${error.response.status} ${error.response.statusText}`);
      if (error.response.data) {
        console.log(`${colors.gray('   错误详情:')} ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  console.log(''); // 空行分隔
}

// 运行认证测试
async function runAuthTests() {
  console.log(`${colors.blue('🔐 认证测试')}`);
  console.log(`${colors.gray('='.repeat(50))}\n`);
  
  // 登录测试
  try {
    console.log(`${colors.blue('🧪')} 测试: 用户登录`);
    const loginResponse = await apiClient.post('/auth/login', {
      username: 'admin',
      password: 'SecurePass123!@#'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      testResults.passed++;
      console.log(`${colors.green('   ✅ 登录成功')}`);
      
      // 测试需要认证的端点
      const authToken = loginResponse.data.data.tokens.accessToken;
      const authClient = axios.create({
        baseURL: BASE_URL,
        timeout: TEST_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // 获取当前用户信息
      try {
        const userResponse = await authClient.get('/auth/me');
        if (userResponse.status === 200) {
          testResults.passed++;
          console.log(`${colors.green('   ✅ 用户信息获取成功')}`);
        }
      } catch (error) {
        testResults.failed++;
        console.log(`${colors.red('   ❌ 用户信息获取失败')} ${error.message}`);
      }
      
    } else {
      testResults.failed++;
      console.log(`${colors.red('   ❌ 登录失败')}`);
    }
  } catch (error) {
    testResults.failed++;
    console.log(`${colors.red('   ❌ 登录测试错误')} ${error.message}`);
  }
  
  console.log('');
}

// 运行监控测试
async function runMonitoringTests() {
  console.log(`${colors.blue('📊 监控测试')}`);
  console.log(`${colors.gray('='.repeat(50))}\n`);
  
  const monitoringEndpoints = [
    { name: '基础健康检查', url: '/monitoring/health' },
    { name: '详细健康检查', url: '/monitoring/health/detailed' },
    { name: '系统资源', url: '/monitoring/system' },
    { name: '性能指标', url: '/monitoring/metrics' },
    { name: '服务依赖', url: '/monitoring/dependencies' },
    { name: '告警状态', url: '/monitoring/alerts' }
  ];
  
  for (const endpoint of monitoringEndpoints) {
    await runTest({
      name: endpoint.name,
      method: 'GET',
      url: endpoint.url,
      expectedStatus: 200
    });
  }
}

// 运行核心功能测试
async function runCoreFunctionalityTests() {
  console.log(`${colors.blue('🚀 核心功能测试')}`);
  console.log(`${colors.gray('='.repeat(50))}\n`);
  
  // 热点监控测试
  console.log(`${colors.yellow('🔥 热点监控')}`);
  await runTest({
    name: '获取热点列表',
    method: 'GET',
    url: '/hot-topics?limit=5',
    expectedStatus: 200
  });
  
  // 内容生成测试
  console.log(`${colors.yellow('📝 内容生成')}`);
  await runTest({
    name: '获取内容平台',
    method: 'GET',
    url: '/content/platforms',
    expectedStatus: 200
  });
  
  // 视频处理测试
  console.log(`${colors.yellow('🎥 视频处理')}`);
  await runTest({
    name: '获取视频平台',
    method: 'GET',
    url: '/video/platforms/list',
    expectedStatus: 200
  });
  
  // 转录服务测试
  console.log(`${colors.yellow('🎤 转录服务')}`);
  await runTest({
    name: '获取转录引擎',
    method: 'GET',
    url: '/transcription/engines/list',
    expectedStatus: 200
  });
}

// 显示测试结果摘要
function showTestSummary() {
  console.log(`${colors.blue('📋 测试结果摘要')}`);
  console.log(`${colors.gray('='.repeat(50))}`);
  console.log(`${colors.green('✅ 通过:')} ${testResults.passed}`);
  console.log(`${colors.red('❌ 失败:')} ${testResults.failed}`);
  console.log(`${colors.blue('📊 总计:')} ${testResults.total}`);
  
  const successRate = testResults.total > 0 ? 
    ((testResults.passed / testResults.total) * 100).toFixed(1) : 0;
  
  console.log(`${colors.blue('📈 成功率:')} ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log(`${colors.green('🎉 所有测试通过！')}`);
  } else {
    console.log(`${colors.yellow('⚠️  部分测试失败，请检查服务状态')}`);
  }
  
  console.log('');
}

// 主函数
async function main() {
  console.log(`${colors.blue('🤖 API 测试套件')}`);
  console.log(`${colors.gray('开始测试 API 端点...\n')}`);
  
  try {
    // 检查服务是否在线
    try {
      await axios.get(`${BASE_URL}/monitoring/health`, { timeout: 3000 });
      console.log(`${colors.green('✅ 后端服务在线')}\n`);
    } catch (error) {
      console.log(`${colors.red('❌ 后端服务不可达')}`);
      console.log(`${colors.gray('请确保服务已在端口 5001 启动')}\n`);
      process.exit(1);
    }
    
    // 按类别运行测试
    await runAuthTests();
    await runMonitoringTests();
    await runCoreFunctionalityTests();
    
    // 显示结果
    showTestSummary();
    
  } catch (error) {
    console.error(`${colors.red('测试执行失败:')} ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runTest, testCases, apiClient };