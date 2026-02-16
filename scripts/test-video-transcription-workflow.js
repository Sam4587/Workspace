#!/usr/bin/env node
/**
 * 视频转录完整工作流测试脚本
 * 测试从视频下载到内容发布的全流程
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// 配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
const TEST_VIDEO_URL = process.env.TEST_VIDEO_URL || 'https://v.douyin.com/iJFdY8qh/';

console.log('🚀 开始视频转录完整工作流测试\n');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testVideoDownload() {
  console.log('1️⃣ 测试视频下载功能...');
  
  try {
    // 1. 获取视频元数据
    console.log('   ➤ 获取视频元数据');
    const metadataResponse = await axios.post(`${BASE_URL}/api/video/metadata`, {
      url: TEST_VIDEO_URL
    });
    
    if (!metadataResponse.data.success) {
      throw new Error('获取元数据失败: ' + metadataResponse.data.message);
    }
    
    console.log('   ✅ 元数据获取成功:', metadataResponse.data.data);
    
    // 2. 下载视频
    console.log('   ➤ 下载视频');
    const downloadResponse = await axios.post(`${BASE_URL}/api/video/download`, {
      url: TEST_VIDEO_URL,
      removeWatermark: true
    });
    
    if (!downloadResponse.data.success) {
      throw new Error('视频下载失败: ' + downloadResponse.data.message);
    }
    
    const videoId = downloadResponse.data.data.videoId;
    console.log('   ✅ 视频下载成功，videoId:', videoId);
    
    // 3. 等待下载完成并检查状态
    console.log('   ➤ 检查下载状态');
    await delay(3000); // 等待下载完成
    
    const statusResponse = await axios.get(`${BASE_URL}/api/video/${videoId}/status`);
    console.log('   ✅ 视频状态:', statusResponse.data.data.status);
    
    return videoId;
    
  } catch (error) {
    console.error('   ❌ 视频下载测试失败:', error.message);
    throw error;
  }
}

async function testTranscription(videoId) {
  console.log('\n2️⃣ 测试视频转录功能...');
  
  try {
    // 1. 获取可用转录引擎
    console.log('   ➤ 获取转录引擎列表');
    const enginesResponse = await axios.get(`${BASE_URL}/api/transcription/engines/list`);
    console.log('   ✅ 可用引擎:', enginesResponse.data.data.map(e => e.name));
    
    // 2. 提交转录任务
    console.log('   ➤ 提交转录任务');
    const submitResponse = await axios.post(`${BASE_URL}/api/transcription/submit`, {
      videoId: videoId,
      engine: 'whisper-local',
      options: {
        language: 'zh'
      }
    });
    
    if (!submitResponse.data.success) {
      throw new Error('提交转录任务失败: ' + submitResponse.data.message);
    }
    
    const taskId = submitResponse.data.data.taskId;
    console.log('   ✅ 转录任务提交成功，taskId:', taskId);
    
    // 3. 轮询任务状态
    console.log('   ➤ 监控转录进度');
    let taskStatus = 'pending';
    let attempts = 0;
    const maxAttempts = 30; // 最多等待5分钟
    
    while (taskStatus !== 'completed' && taskStatus !== 'failed' && attempts < maxAttempts) {
      await delay(10000); // 每10秒检查一次
      
      try {
        const statusResponse = await axios.get(`${BASE_URL}/api/transcription/${taskId}`);
        taskStatus = statusResponse.data.data.status;
        const progress = statusResponse.data.data.progress || 0;
        console.log(`   🔄 转录状态: ${taskStatus} (${progress}%)`);
        
        if (taskStatus === 'completed') {
          console.log('   ✅ 转录完成');
          return statusResponse.data.data.result;
        } else if (taskStatus === 'failed') {
          throw new Error('转录任务失败: ' + statusResponse.data.data.error);
        }
      } catch (error) {
        console.log('   ⚠️  获取状态失败，继续轮询...');
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('转录超时');
    }
    
  } catch (error) {
    console.error('   ❌ 视频转录测试失败:', error.message);
    throw error;
  }
}

async function testContentAnalysis(transcript) {
  console.log('\n3️⃣ 测试内容分析功能...');
  
  try {
    console.log('   ➤ 分析转录内容');
    const analysisResponse = await axios.post(`${BASE_URL}/api/content/analyze`, {
      text: transcript.text,
      options: {
        model: 'gpt-4'
      }
    });
    
    if (!analysisResponse.data.success) {
      throw new Error('内容分析失败: ' + analysisResponse.data.message);
    }
    
    console.log('   ✅ 内容分析完成');
    console.log('   📊 摘要:', analysisResponse.data.summary?.slice(0, 100) + '...');
    console.log('   📊 关键词:', analysisResponse.data.keywords?.join(', '));
    console.log('   📊 分类:', analysisResponse.data.category);
    console.log('   📊 情感:', analysisResponse.data.sentiment);
    
    return analysisResponse.data.summary || transcript.text.slice(0, 500);
    
  } catch (error) {
    console.error('   ❌ 内容分析测试失败:', error.message);
    throw error;
  }
}

async function testContentRewrite(summary) {
  console.log('\n4️⃣ 测试内容改写功能...');
  
  try {
    // 1. 获取支持的平台
    console.log('   ➤ 获取支持的平台');
    const platformsResponse = await axios.get(`${BASE_URL}/api/content/platforms`);
    console.log('   ✅ 支持平台:', platformsResponse.data.data);
    
    // 2. 批量改写内容
    console.log('   ➤ 批量改写内容');
    const rewriteResponse = await axios.post(`${BASE_URL}/api/content/video-rewrite`, {
      text: summary,
      platforms: ['xiaohongshu', 'douyin', 'toutiao']
    });
    
    if (!rewriteResponse.data.success) {
      throw new Error('内容改写失败: ' + rewriteResponse.data.message);
    }
    
    console.log('   ✅ 内容改写完成');
    const results = rewriteResponse.data.data.results;
    
    // 显示各平台改写结果
    for (const [platform, content] of Object.entries(results)) {
      console.log(`   📱 ${platform}:`);
      if (content.title) console.log(`      标题: ${content.title}`);
      if (content.content) console.log(`      内容: ${content.content.slice(0, 100)}...`);
      if (content.tags) console.log(`      标签: ${content.tags.join(', ')}`);
    }
    
    return results;
    
  } catch (error) {
    console.error('   ❌ 内容改写测试失败:', error.message);
    throw error;
  }
}

async function testPublishIntegration(contents) {
  console.log('\n5️⃣ 测试发布集成功能...');
  
  try {
    // 1. 检查发布工具状态
    console.log('   ➤ 检查发布工具状态');
    const statusResponse = await axios.get(`${BASE_URL}/api/content/publish/status`);
    console.log('   ✅ 发布工具状态:', statusResponse.data.data);
    
    // 2. 测试小红书发布（模拟）
    console.log('   ➤ 测试内容发布（模拟）');
    const xiaohongshuContent = contents.xiaohongshu;
    if (xiaohongshuContent) {
      const publishResponse = await axios.post(`${BASE_URL}/api/content/publish`, {
        platform: 'xiaohongshu',
        content: xiaohongshuContent
      });
      
      console.log('   ✅ 发布请求发送成功');
      console.log('   📤 发布结果:', publishResponse.data);
    }
    
  } catch (error) {
    console.error('   ❌ 发布集成测试失败:', error.message);
    // 不抛出错误，因为发布工具可能未配置
  }
}

async function main() {
  try {
    console.log('📋 开始完整的视频转录工作流测试\n');
    
    // 1. 视频下载
    const videoId = await testVideoDownload();
    
    // 2. 视频转录
    const transcript = await testTranscription(videoId);
    
    // 3. 内容分析
    const summary = await testContentAnalysis(transcript);
    
    // 4. 内容改写
    const contents = await testContentRewrite(summary);
    
    // 5. 发布集成
    await testPublishIntegration(contents);
    
    console.log('\n🎉 所有测试完成！');
    console.log('\n📊 测试总结:');
    console.log('✅ 视频下载: 成功');
    console.log('✅ 视频转录: 成功');
    console.log('✅ 内容分析: 成功');
    console.log('✅ 内容改写: 成功');
    console.log('✅ 发布集成: 完成（模拟）');
    
  } catch (error) {
    console.error('\n💥 测试过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = {
  testVideoDownload,
  testTranscription,
  testContentAnalysis,
  testContentRewrite,
  testPublishIntegration
};