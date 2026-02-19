require('dotenv').config();
const aiProviderService = require('./services/aiProviderService');

async function testOllama() {
  console.log('=== Ollama 测试 ===\n');

  try {
    console.log('1. 检查 AI 提供商配置...');
    const providers = aiProviderService.getProviderList();
    console.log('可用提供商:', providers.map(p => p.name).join(', '));
    
    const ollamaProvider = providers.find(p => p.id === 'ollama');
    if (!ollamaProvider) {
      console.log('✗ Ollama 未配置！请检查 .env 文件');
      return;
    }
    console.log('✓ Ollama 已配置');
    console.log('  地址:', ollamaProvider.model ? '已配置模型' : '默认模型');
    console.log('');

    console.log('2. 测试 Ollama 连接...');
    const result = await aiProviderService.chatCompletion([
      { role: 'user', content: '你好，请用 1-2 句话介绍一下你自己' }
    ], {
      provider: 'ollama',
      maxTokens: 100
    });

    console.log('✓ Ollama 连接成功！');
    console.log('响应:', result.content);
    
  } catch (error) {
    console.log('✗ 测试失败');
    console.error('错误:', error.message);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n💡 提示：请确保 Ollama 服务正在运行！');
      console.log('   启动命令：ollama serve');
      console.log('   或者：在 Windows/Mac 上打开 Ollama 应用');
    }
  }
}

testOllama();
