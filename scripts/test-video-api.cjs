const axios = require('axios');

async function testVideoAPI() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🔍 测试视频API路由...\n');
  
  try {
    // 测试健康检查
    console.log('1. 测试健康检查端点...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ 健康检查:', healthResponse.data);
    
    // 测试视频模板列表
    console.log('\n2. 测试视频模板列表...');
    const templatesResponse = await axios.get(`${baseURL}/api/video/templates`);
    console.log('✅ 视频模板:', templatesResponse.data.data.length, '个模板');
    
    // 测试支持的平台
    console.log('\n3. 测试支持的平台...');
    const platformsResponse = await axios.get(`${baseURL}/api/video/platforms/list`);
    console.log('✅ 支持平台:', platformsResponse.data.data.map(p => p.name));
    
    // 测试视频下载元数据
    console.log('\n4. 测试视频元数据获取...');
    const metadataResponse = await axios.post(`${baseURL}/api/video/metadata`, {
      url: 'https://www.douyin.com/video/123456789'
    });
    console.log('✅ 元数据解析:', metadataResponse.data.data);
    
    // 测试视频渲染模板
    console.log('\n5. 测试视频渲染...');
    const renderResponse = await axios.post(`${baseURL}/api/video/render`, {
      templateId: 'article-video',
      props: {
        title: '测试标题',
        content: '测试内容'
      }
    });
    console.log('✅ 渲染任务:', renderResponse.data.data.taskId);
    
    // 测试转录引擎列表
    console.log('\n6. 测试转录引擎...');
    const enginesResponse = await axios.get(`${baseURL}/api/transcription/engines/list`);
    console.log('✅ 转录引擎:', enginesResponse.data.data.length, '个引擎');
    
    console.log('\n🎉 所有视频API测试通过！');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.status, error.response.data);
    } else {
      console.error('❌ 连接错误:', error.message);
    }
  }
}

testVideoAPI();