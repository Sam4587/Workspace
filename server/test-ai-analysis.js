require('dotenv').config();
const aiProviderService = require('./services/aiProviderService');
const { newsNowFetcher } = require('./fetchers/NewsNowFetcher');

async function testAIAnalysis() {
  console.log('=== AI 分析功能测试 ===\n');
  
  try {
    console.log('1. 检查 AI 提供商配置...');
    console.log('默认提供商:', aiProviderService.defaultProvider);
    console.log('可用提供商:', aiProviderService.getProviderList().map(p => p.name).join(', '));
    console.log('✓ AI 提供商配置检查完成\n');

    console.log('2. 从 NewsNow 获取热点数据...');
    const topics = await newsNowFetcher.fetch();
    console.log(`✓ 成功获取 ${topics.length} 条热点数据\n`);
    
    if (topics.length > 0) {
      console.log('部分话题预览:');
      topics.slice(0, 3).forEach((topic, i) => {
        console.log(`${i + 1}. [${topic.source}] ${topic.title} (热度: ${topic.heat})`);
      });
      console.log('');
    }

    console.log('3. 开始 AI 分析...');
    console.log('这可能需要几秒钟...\n');
    
    const analysis = await aiProviderService.analyzeTopics(topics, {
      includeTrends: true,
      includeSentiment: true,
      includeKeywords: true,
      includeSummary: true
    });

    if (analysis) {
      console.log('✓ AI 分析成功完成！\n');
      console.log('=== 分析结果 ===');
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      console.log('✗ AI 分析返回 null');
    }
    
  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

testAIAnalysis();
