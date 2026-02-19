require('dotenv').config();
const llmGateway = require('./services/llm');

async function testLLMGateway() {
  console.log('=== LLM Gateway 统一接口测试 ===\n');

  console.log('1. 检查可用提供商...');
  const providers = llmGateway.getAvailableProviders();
  console.log('可用提供商:', providers.map(p => `${p.displayName} (${p.defaultModel})`).join(', '));
  
  if (providers.length === 0) {
    console.log('✗ 没有可用的提供商！请检查 .env 配置');
    return;
  }
  console.log('');

  console.log('2. 测试Ollama本地模型...');
  const ollamaProvider = providers.find(p => p.name === 'ollama');
  if (ollamaProvider) {
    try {
      const models = await llmGateway.listOllamaModels();
      console.log(`  ✓ Ollama服务运行中，已安装模型: ${models.length}个`);
      if (models.length > 0) {
        console.log(`  模型列表: ${models.map(m => m.name).join(', ')}`);
      }
      
      console.log('  → 测试Ollama生成...');
      const startTime = Date.now();
      const result = await llmGateway.generate([
        { role: 'user', content: '请用一句话回答：1+1等于几？' }
      ], {
        model: 'ollama/llama3',
        maxTokens: 50
      });
      console.log(`    ✓ 成功 (${Date.now() - startTime}ms)`);
      console.log(`    响应: ${result.content.substring(0, 100)}...`);
    } catch (error) {
      console.log(`  ✗ Ollama测试失败: ${error.message}`);
      console.log('  💡 提示：请确保运行 "ollama serve" 启动服务');
    }
  } else {
    console.log('  ⊘ Ollama未配置，跳过');
  }
  console.log('');

  console.log('3. 测试OpenRouter...');
  const openrouterProvider = providers.find(p => p.name === 'openrouter');
  if (openrouterProvider) {
    try {
      console.log('  → 测试OpenRouter生成...');
      const startTime = Date.now();
      const result = await llmGateway.generate([
        { role: 'user', content: '请用一句话回答：1+1等于几？' }
      ], {
        model: 'openrouter/deepseek/deepseek-chat-v3-0324:free',
        maxTokens: 50
      });
      console.log(`    ✓ 成功 (${Date.now() - startTime}ms)`);
      console.log(`    响应: ${result.content.substring(0, 100)}...`);
    } catch (error) {
      console.log(`    ✗ 失败: ${error.message}`);
    }
  } else {
    console.log('  ⊘ OpenRouter未配置，跳过');
  }
  console.log('');

  console.log('4. 测试Fallback机制...');
  try {
    const result = await llmGateway.generate([
      { role: 'user', content: '你好，请简短回复' }
    ], {
      maxTokens: 30
    });
    console.log('  ✓ Fallback测试成功');
    console.log(`  使用模型: ${result.provider}/${result.model}`);
  } catch (error) {
    console.log(`  ✗ Fallback测试失败: ${error.message}`);
  }
  console.log('');

  console.log('5. 健康检查...');
  const healthResults = await llmGateway.checkHealth();
  for (const [name, result] of Object.entries(healthResults)) {
    const status = result.healthy ? '✓' : '✗';
    console.log(`  ${status} ${name}: ${result.healthy ? '正常' : result.error}`);
  }

  console.log('\n=== 测试完成 ===');
}

testLLMGateway().catch(console.error);
