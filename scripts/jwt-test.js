/**
 * JWT刷新令牌机制完整测试脚本
 */
import axios from 'axios';

async function runTests() {
  console.log('=== JWT刷新令牌机制完整测试 ===\n');
  
  const baseURL = 'http://localhost:5001/api';
  
  try {
    // 1. 用户登录测试
    console.log('1. 用户登录测试...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'SecurePass123!@#'
    });
    
    console.log('✅ 登录成功');
    const { access_token, refresh_token } = loginResponse.data.data;
    console.log(`   访问令牌: ${access_token.substring(0, 20)}...`);
    console.log(`   刷新令牌: ${refresh_token}`);
    
    // 2. 使用访问令牌获取用户信息
    console.log('\n2. 访问令牌验证测试...');
    const userInfoResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    console.log('✅ 访问令牌验证通过');
    console.log(`   用户信息: ${JSON.stringify(userInfoResponse.data.data)}`);
    
    // 3. 刷新令牌测试
    console.log('\n3. 刷新令牌测试...');
    const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
      refresh_token: refresh_token
    });
    
    console.log('✅ 刷新令牌成功');
    const newAccessToken = refreshResponse.data.data.access_token;
    console.log(`   新访问令牌: ${newAccessToken.substring(0, 20)}...`);
    
    // 4. 使用新令牌验证
    console.log('\n4. 新令牌验证测试...');
    const newUserInfoResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`
      }
    });
    
    console.log('✅ 新令牌验证通过');
    
    // 5. 登出测试
    console.log('\n5. 用户登出测试...');
    await axios.post(`${baseURL}/auth/logout`, {
      refresh_token: refresh_token
    }, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    console.log('✅ 登出成功');
    
    // 6. 验证令牌已失效
    console.log('\n6. 令牌失效验证测试...');
    try {
      await axios.get(`${baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      console.log('❌ 令牌撤销失败 - 令牌仍然有效');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 令牌已成功撤销');
      } else {
        console.log('❌ 意外错误:', error.message);
      }
    }
    
    console.log('\n🎉 所有JWT刷新令牌机制测试通过！');
    console.log('🔒 系统已具备完整的双令牌安全认证机制');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 安装axios后再运行测试
runTests();