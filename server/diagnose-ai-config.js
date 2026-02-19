require('dotenv').config();
const aiProviderService = require('./services/aiProviderService');

console.log('=== AI 配置诊断工具 ===\n');

console.log('1. 环境变量检查：');
const envVars = [
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY', 
  'GROQ_API_KEY',
  'QWEN_API_KEY',
  'ZHIPU_API_KEY',
  'MOONSHOT_API_KEY',
  'SILICONFLOW_API_KEY',
  'OPENROUTER_API_KEY',
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY'
];

envVars.forEach(key => {
  const value = process.env[key];
  const status = value ? (value.length > 10 ? '✓ 已配置' : '⚠ 配置过短') : '✗ 未配置';
  console.log(`   ${key}: ${status}`);
});

console.log('\n2. 可用的 AI 提供商：');
const providers = aiProviderService.getProviderList();
if (providers.length === 0) {
  console.log('   没有配置任何 AI 提供商');
} else {
  providers.forEach(p => {
    console.log(`   - ${p.name} (${p.id})${p.isDefault ? ' [默认]' : ''}`);
    console.log(`     模型: ${p.model}`);
    console.log(`     类型: ${p.type}`);
    console.log(`     启用: ${p.enabled ? '是' : '否'}`);
  });
}

console.log('\n3. 默认提供商：');
console.log(`   ${aiProviderService.defaultProvider}`);

console.log('\n4. 建议：');
if (providers.length === 0) {
  console.log('   ⚠ 请至少配置一个 AI 提供商的 API Key');
  console.log('   推荐选项：');
  console.log('   1. SiliconFlow (免费额度充足) - 配置 SILICONFLOW_API_KEY');
  console.log('   2. DeepSeek (新用户有免费额度) - 配置 DEEPSEEK_API_KEY');
  console.log('   3. 通义千问 (阿里云) - 配置 QWEN_API_KEY');
} else {
  console.log('   ✓ 配置看起来没问题！可以运行测试了');
}
