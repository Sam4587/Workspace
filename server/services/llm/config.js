const providerConfigs = {
  openrouter: {
    name: 'OpenRouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: process.env.OPENROUTER_MODEL || 'google/gemma-3-12b-it:free',
    enabled: !!process.env.OPENROUTER_API_KEY,
    priority: 1,
    timeout: 60000,
    maxRetries: 2,
    models: [
      'google/gemma-3-12b-it:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'deepseek/deepseek-chat'
    ]
  },
  groq: {
    name: 'Groq',
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: process.env.GROQ_MODEL || 'llama3-70b-8192',
    enabled: !!process.env.GROQ_API_KEY,
    priority: 2,
    timeout: 30000,
    maxRetries: 2,
    models: [
      'llama3-70b-8192',
      'llama3-8b-8192',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ]
  },
  cerebras: {
    name: 'Cerebras',
    apiKey: process.env.CEREBRAS_API_KEY,
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: process.env.CEREBRAS_MODEL || 'llama-3.1-8b',
    enabled: !!process.env.CEREBRAS_API_KEY,
    priority: 3,
    timeout: 30000,
    maxRetries: 2,
    models: [
      'llama-3.1-8b',
      'llama-3.1-70b'
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    enabled: !!process.env.DEEPSEEK_API_KEY,
    priority: 4,
    timeout: 60000,
    maxRetries: 2,
    models: [
      'deepseek-chat',
      'deepseek-coder'
    ]
  }
};

function getEnabledProviders() {
  return Object.entries(providerConfigs)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([name, config]) => ({ name, ...config }));
}

function getProviderConfig(name) {
  return providerConfigs[name] || null;
}

function getDefaultProvider() {
  const enabled = getEnabledProviders();
  return enabled.length > 0 ? enabled[0].name : null;
}

module.exports = {
  providerConfigs,
  getEnabledProviders,
  getProviderConfig,
  getDefaultProvider
};
