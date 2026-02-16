/**
 * Remotion视频生成功能测试脚本
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

async function testVideoGeneration() {
  console.log('🚀 开始测试Remotion视频生成功能\n');

  try {
    // 1. 测试获取模板列表
    console.log('1. 测试获取视频模板列表...');
    const templatesResponse = await axios.get(`${BASE_URL}/api/video-generation/templates`);
    console.log('✅ 模板列表获取成功');
    console.log('可用模板:', templatesResponse.data.data.map(t => t.id));
    
    // 2. 测试渲染文章视频
    console.log('\n2. 测试渲染文章视频...');
    const articleRenderResponse = await axios.post(`${BASE_URL}/api/video-generation/render`, {
      templateId: 'ArticleVideo',
      props: {
        title: '测试文章标题',
        subtitle: '这是一个测试副标题',
        content: '这是测试的文章内容，用来验证Remotion视频生成功能是否正常工作。',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800']
      }
    });
    console.log('✅ 文章视频渲染请求提交成功');
    console.log('渲染ID:', articleRenderResponse.data.data.renderId);
    
    // 3. 测试渲染微头条视频
    console.log('\n3. 测试渲染微头条视频...');
    const microRenderResponse = await axios.post(`${BASE_URL}/api/video-generation/render`, {
      templateId: 'MicroVideo',
      props: {
        title: '测试微头条标题',
        content: '这是测试的微头条内容\n支持多行文本展示\n可以展示更多内容',
        username: '测试用户',
        likes: 100,
        comments: 50,
        shares: 25
      }
    });
    console.log('✅ 微头条视频渲染请求提交成功');
    console.log('渲染ID:', microRenderResponse.data.data.renderId);
    
    // 4. 测试批量渲染
    console.log('\n4. 测试批量渲染功能...');
    const batchRenderResponse = await axios.post(`${BASE_URL}/api/video-generation/batch-render`, {
      tasks: [
        {
          templateId: 'ArticleVideo',
          props: {
            title: '批量测试1',
            content: '第一个批量渲染任务'
          }
        },
        {
          templateId: 'MicroVideo',
          props: {
            title: '批量测试2',
            content: '第二个批量渲染任务'
          }
        }
      ]
    });
    console.log('✅ 批量渲染请求提交成功');
    console.log('批量渲染结果:', batchRenderResponse.data.data.length, '个任务');
    
    // 5. 测试获取视频列表
    console.log('\n5. 测试获取已渲染视频列表...');
    const listResponse = await axios.get(`${BASE_URL}/api/video-generation/list`);
    console.log('✅ 视频列表获取成功');
    console.log('已渲染视频数量:', listResponse.data.data.length);
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保后端服务已启动 (端口 5001)');
    }
  }
}

// 运行测试
testVideoGeneration();