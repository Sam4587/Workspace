const providerConfigs = {
  openrouter: {
    name: 'OpenRouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
    enabled: !!process.env.OPENROUTER_API_KEY,
    priority: 1,
    timeout: 60000,
    maxRetries: 2,
    models: [
      'google/gemma-3-12b-it:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'deepseek/deepseek-chat',
      'anthropic/claude-3-haiku',
      'openai/gpt-4o-mini'
    ]
  },
  groq: {
    name: 'Groq',
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    enabled: !!process.env.GROQ_API_KEY,
    priority: 2,
    timeout: 30000,
    maxRetries: 2,
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
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
      'deepseek-coder',
      'deepseek-reasoner'
    ]
  },
  ollama: {
    name: 'Ollama',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    defaultModel: process.env.OLLAMA_MODEL || 'llama3',
    enabled: process.env.OLLAMA_ENABLED === 'true' || !!process.env.OLLAMA_BASE_URL,
    priority: 5,
    timeout: 120000,
    maxRetries: 1,
    models: [
      'llama3',
      'llama3.1',
      'llama3.2',
      'qwen2.5',
      'deepseek-r1',
      'mistral',
      'codellama',
      'phi3'
    ]
  },
  openai: {
    name: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    enabled: !!process.env.OPENAI_API_KEY,
    priority: 6,
    timeout: 60000,
    maxRetries: 2,
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ]
  },
  anthropic: {
    name: 'Anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    enabled: !!process.env.ANTHROPIC_API_KEY,
    priority: 7,
    timeout: 60000,
    maxRetries: 2,
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ]
  },
  gemini: {
    name: 'Gemini',
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    enabled: !!process.env.GEMINI_API_KEY,
    priority: 8,
    timeout: 60000,
    maxRetries: 2,
    models: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ]
  }
};

function getEnabledProviders() {
  return Object.entries(providerConfigs)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([key, config]) => ({ 
      ...config, 
      key,
      displayName: config.name 
    }));
}

function getProviderConfig(name) {
  return providerConfigs[name] || null;
}

function getDefaultProvider() {
  const defaultModel = process.env.AI_DEFAULT_MODEL;
  
  if (defaultModel) {
    const [provider] = defaultModel.split('/');
    if (providerConfigs[provider]?.enabled) {
      return provider;
    }
  }
  
  const enabled = getEnabledProviders();
  return enabled.length > 0 ? enabled[0].key : null;
}

function getDefaultModel() {
  return process.env.AI_DEFAULT_MODEL || null;
}

function getFallbackModels() {
  const fallback = process.env.AI_FALLBACK_MODELS;
  if (fallback) {
    return fallback.split(',').map(m => m.trim()).filter(Boolean);
  }
  return [];
}

function parseModelString(modelString) {
  if (!modelString || !modelString.includes('/')) {
    return { provider: null, model: modelString };
  }
  
  const [provider, ...modelParts] = modelString.split('/');
  return {
    provider,
    model: modelParts.join('/')
  };
}

module.exports = {
  providerConfigs,
  getEnabledProviders,
  getProviderConfig,
  getDefaultProvider,
  getDefaultModel,
  getFallbackModels,
  parseModelString
};
