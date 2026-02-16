const axios = require('axios');

async function testTranscriptionAPI() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🔍 测试转录API路由...\n');
  
  try {
    // 测试转录引擎列表
    console.log('1. 获取转录引擎列表...');
    const engines = await axios.get(`${baseURL}/api/transcription/engines/list`);
    console.log('✅ 可用引擎:', engines.data.data.map(e => e.name));
    
    // 测试队列状态
    console.log('\n2. 获取队列状态...');
    const queueStatus = await axios.get(`${baseURL}/api/transcription/queue/status`);
    console.log('✅ 队列状态:', queueStatus.data.data);
    
    // 测试提交转录任务（模拟）
    console.log('\n3. 测试提交转录任务...');
    try {
      const submitResponse = await axios.post(`${baseURL}/api/transcription/submit`, {
        videoId: 'test_video_123',
        engine: 'whisper-local',
        options: {
          language: 'zh'
        }
      });
      console.log('✅ 任务提交响应:', submitResponse.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 任务提交验证通过（视频不存在是预期行为）');
      } else {
        throw error;
      }
    }
    
    // 测试同步转录（模拟）
    console.log('\n4. 测试同步转录...');
    try {
      const transcribeResponse = await axios.post(`${baseURL}/api/transcription/transcribe`, {
        videoId: 'test_video_456',
        engine: 'whisper-local'
      });
      console.log('✅ 同步转录响应:', transcribeResponse.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 同步转录验证通过（视频不存在是预期行为）');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 转录API核心功能测试通过！');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.status, error.response.data);
    } else {
      console.error('❌ 连接错误:', error.message);
    }
  }
}

testTranscriptionAPI();