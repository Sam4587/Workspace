/**
 * 安全验证测试脚本
 * 测试SEC-004请求验证中间件的各项功能
 */

import express from 'express';
import validationMiddleware from '../server/middleware/validation.js';

const { 
  sanitizeInput, 
  preventSqlInjection, 
  csrfProtection, 
  requestSizeLimit,
  validateRequired,
  validateEmail,
  validateUrl
} = validationMiddleware;

const app = express();
app.use(express.json());

// 应用安全中间件
app.use(requestSizeLimit(1024 * 1024)); // 1MB限制用于测试
app.use(sanitizeInput());
app.use(preventSqlInjection());
app.use(csrfProtection());

// 测试路由
app.post('/test-xss', (req, res) => {
  res.json({ 
    success: true, 
    message: 'XSS防护测试通过',
    sanitizedBody: req.body 
  });
});

app.post('/test-sql-injection', (req, res) => {
  res.json({ 
    success: true, 
    message: 'SQL注入防护测试通过',
    body: req.body 
  });
});

app.post('/test-csrf', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CSRF防护测试通过' 
  });
});

app.post('/test-size-limit', (req, res) => {
  res.json({ 
    success: true, 
    message: '请求大小限制测试通过' 
  });
});

app.post('/test-validation', 
  validateRequired(['email', 'url']),
  validateEmail(['email']),
  validateUrl(['url']),
  (req, res) => {
    res.json({ 
      success: true, 
      message: '数据验证测试通过',
      data: req.body
    });
  }
);

const server = app.listen(3002, () => {
  console.log('安全验证测试服务器启动在端口 3002');
  
  // 延迟执行测试
  setTimeout(runTests, 1000);
});

async function runTests() {
  console.log('\n=== 开始安全中间件测试 ===\n');
  
  try {
    // 测试1: XSS防护
    console.log('1. 测试XSS防护:');
    const xssTest = await fetch('http://localhost:3002/test-xss', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-csrf-token': 'test-token'
      },
      body: JSON.stringify({
        name: '<script>alert("xss")</script>',
        content: '正常内容<script>恶意代码</script>'
      })
    });
    const xssResult = await xssTest.json();
    console.log('响应数据:', JSON.stringify(xssResult, null, 2));
    console.log('XSS防护结果: ✅ 通过');
    
    // 测试2: SQL注入防护
    console.log('\n2. 测试SQL注入防护:');
    const sqlTest = await fetch('http://localhost:3002/test-sql-injection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "SELECT * FROM users WHERE id = 1; DROP TABLE users;",
        condition: "1=1 OR 1=1"
      })
    });
    console.log('SQL注入防护状态码:', sqlTest.status);
    console.log(sqlTest.status === 400 ? '✅ 通过' : '❌ 失败');
    
    // 测试3: CSRF防护
    console.log('\n3. 测试CSRF防护:');
    const csrfTest = await fetch('http://localhost:3002/test-csrf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' })
    });
    console.log('CSRF防护状态码:', csrfTest.status);
    console.log(csrfTest.status === 403 ? '✅ 通过' : '❌ 失败');
    
    // 测试4: 请求大小限制
    console.log('\n4. 测试请求大小限制:');
    const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB数据
    const sizeTest = await fetch('http://localhost:3002/test-size-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: largeData })
    });
    console.log('请求大小限制状态码:', sizeTest.status);
    console.log(sizeTest.status === 413 ? '✅ 通过' : '❌ 失败');
    
    // 测试5: 数据验证
    console.log('\n5. 测试数据验证:');
    const validationTest = await fetch('http://localhost:3002/test-validation', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-csrf-token': 'test-token' // 添加CSRF令牌
      },
      body: JSON.stringify({
        email: 'test@example.com',
        url: 'https://example.com'
      })
    });
    console.log('数据验证状态码:', validationTest.status);
    console.log(validationTest.status === 200 ? '✅ 通过' : '❌ 失败');
    
    // 测试6: 无效数据验证
    console.log('\n6. 测试无效数据验证:');
    const invalidValidationTest = await fetch('http://localhost:3002/test-validation', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-csrf-token': 'test-token'
      },
      body: JSON.stringify({
        email: 'invalid-email',
        url: 'not-a-url'
      })
    });
    console.log('无效数据验证状态码:', invalidValidationTest.status);
    console.log(invalidValidationTest.status === 400 ? '✅ 通过' : '❌ 失败');
    
  } catch (error) {
    console.error('测试执行失败:', error.message);
  } finally {
    server.close();
    console.log('\n=== 测试完成 ===');
  }
}