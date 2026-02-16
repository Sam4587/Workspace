const axios = require('axios');

async function testTaskQueueManagement() {
  const baseURL = 'http://localhost:5001';
  
  console.log('🔧 测试转录任务队列管理功能...\n');
  
  try {
    // 测试获取队列状态
    console.log('1. 获取任务队列状态...');
    const statusResponse = await axios.get(`${baseURL}/api/task-queue/status`);
    console.log('✅ 队列状态:', {
      total: statusResponse.data.data.stats?.total || statusResponse.data.data.total,
      pending: statusResponse.data.data.queues?.pending?.count || statusResponse.data.data.pending,
      processing: statusResponse.data.data.queues?.processing?.count || statusResponse.data.data.processing
    });
    
    // 测试获取任务列表
    console.log('\n2. 获取任务列表...');
    const tasksResponse = await axios.get(`${baseURL}/api/task-queue/tasks?limit=5`);
    console.log('✅ 任务列表:', tasksResponse.data.data.tasks.length, '个任务');
    
    // 测试获取统计信息
    console.log('\n3. 获取任务统计...');
    const statsResponse = await axios.get(`${baseURL}/api/task-queue/statistics`);
    console.log('✅ 统计信息:', {
      total: statsResponse.data.data.total,
      successRate: statsResponse.data.data.successRate + '%'
    });
    
    // 测试获取系统信息
    console.log('\n4. 获取系统资源信息...');
    const systemResponse = await axios.get(`${baseURL}/api/task-queue/system`);
    console.log('✅ 系统信息:', {
      cpuCores: systemResponse.data.data.cpu.cores,
      memoryUsage: systemResponse.data.data.memory.usage + '%'
    });
    
    // 测试添加测试任务
    console.log('\n5. 测试添加任务...');
    const addTaskResponse = await axios.post(`${baseURL}/api/transcription/submit`, {
      videoId: 'test_video_' + Date.now(),
      engine: 'whisper-local',
      options: {
        priority: 2, // 高优先级
        timeout: 300000
      }
    });
    
    const taskId = addTaskResponse.data.data.taskId;
    console.log('✅ 任务已添加:', taskId);
    
    // 测试获取特定任务详情
    console.log('\n6. 获取任务详情...');
    const taskDetailResponse = await axios.get(`${baseURL}/api/task-queue/tasks/${taskId}`);
    console.log('✅ 任务详情:', {
      status: taskDetailResponse.data.data.status,
      progress: taskDetailResponse.data.data.progress + '%'
    });
    
    // 测试批量操作（模拟）
    console.log('\n7. 测试批量操作...');
    try {
      const batchResponse = await axios.post(`${baseURL}/api/task-queue/batch/cancel`, {
        status: 'pending'
      });
      console.log('✅ 批量操作响应:', batchResponse.data.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ 批量操作验证通过（无匹配任务是预期行为）');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 转录任务队列管理功能测试通过！');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API错误:', error.response.status, error.response.data);
    } else {
      console.error('❌ 连接错误:', error.message);
    }
  }
}

// 运行测试
testTaskQueueManagement();