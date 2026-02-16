/**
 * 请求验证中间件测试脚本
 */

const express = require('express');
const { validateRequired, validateTypes, validateEmail } = require('../server/middleware/validation');

const app = express();
app.use(express.json());

// 测试路由
app.post('/test-required', 
  validateRequired(['name', 'email']),
  (req, res) => {
    res.json({ success: true, message: '必填字段验证通过' });
  }
);

app.post('/test-types', 
  validateTypes({ age: 'number', isActive: 'boolean' }),
  (req, res) => {
    res.json({ success: true, message: '类型验证通过' });
  }
);

app.post('/test-email', 
  validateEmail(['email']),
  (req, res) => {
    res.json({ success: true, message: '邮箱验证通过' });
  }
);

app.listen(3001, () => {
  console.log('验证测试服务器启动在端口 3001');
  
  // 测试用例
  setTimeout(async () => {
    console.log('\n=== 开始测试 ===');
    
    try {
      // 测试必填字段验证
      console.log('\n1. 测试必填字段验证:');
      const response1 = await fetch('http://localhost:3001/test-required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data1 = await response1.json();
      console.log('缺少必填字段:', data1);
      
      // 测试类型验证
      console.log('\n2. 测试类型验证:');
      const response2 = await fetch('http://localhost:3001/test-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: 'not-a-number', isActive: 'not-boolean' })
      });
      const data2 = await response2.json();
      console.log('错误类型:', data2);
      
      // 测试邮箱验证
      console.log('\n3. 测试邮箱验证:');
      const response3 = await fetch('http://localhost:3001/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' })
      });
      const data3 = await response3.json();
      console.log('无效邮箱:', data3);
      
      // 测试通过的情况
      console.log('\n4. 测试验证通过的情况:');
      const response4 = await fetch('http://localhost:3001/test-required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John', email: 'john@example.com' })
      });
      const data4 = await response4.json();
      console.log('验证通过:', data4);
      
    } catch (error) {
      console.error('测试过程中出现错误:', error);
    }
    
    // 关闭测试服务器
    process.exit(0);
  }, 1000);
});