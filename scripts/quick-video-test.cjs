const axios = require('axios');

async function quickTest() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🚀 快速测试视频API...\n');
  
  try {
    // 测试视频模板
    console.log('1. 获取视频模板...');
    const templates = await axios.get(`${baseURL}/api/video/templates`);
    console.log('✅ 模板数量:', templates.data.data.length);
    
    // 测试支持平台
    console.log('\n2. 获取支持平台...');
    const platforms = await axios.get(`${baseURL}/api/video/platforms/list`);
    console.log('✅ 平台:', platforms.data.data.map(p => p.name));
    
    // 测试转录引擎
    console.log('\n3. 获取转录引擎...');
    const engines = await axios.get(`${baseURL}/api/transcription/engines/list`);
    console.log('✅ 引擎:', engines.data.data.map(e => e.name));
    
    console.log('\n🎉 视频API核心功能测试通过！');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.status, error.response.data);
    } else {
      console.error('❌ 连接错误:', error.message);
    }
  }
}

// 等待几秒让限流重置
setTimeout(quickTest, 3000);