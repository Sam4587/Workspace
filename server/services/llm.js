/**
 * 免费 LLM Gateway 模块
 * 支持 Groq、Together AI、Ollama 等免费/低成本 LLM 提供商
 */

const axios = require('axios');

class LLMGateway {
  constructor() {
    this.providers = new Map();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.registerProviders();
    this.initialized = true;
  }

  registerProviders() {
    if (process.env.GROQ_API_KEY) {
      this.providers.set('groq', {
        name: 'Groq',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
        model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile'
      });
    }
    
    if (process.env.TOGETHER_API_KEY) {
      this.providers.set('together', {
        name: 'Together AI',
        apiKey: process.env.TOGETHER_API_KEY,
        baseUrl: 'https://api.together.xyz/v1',
        model: process.env.TOGETHER_MODEL || 'meta-llama/Llama-3-70b-chat-hf'
      });
    }
    
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
      });
    }
    
    if (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_ENABLED === 'true') {
      this.providers.set('ollama', {
        name: 'Ollama',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3'
      });
    }
  }

  async generate(messages, options = {}) {
    this.init();
    const provider = this.selectProvider(options.provider);
    
    if (!provider) {
      throw new Error('No LLM provider available. Please configure at least one provider in .env');
    }

    switch (provider.name) {
      case 'Groq':
      case 'Together AI':
      case 'OpenRouter':
        return await this.callOpenAICompatible(provider, messages, options);
      case 'Ollama':
        return await this.callOllama(provider, messages, options);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  selectProvider(preferred) {
    if (preferred && this.providers.has(preferred)) {
      return this.providers.get(preferred);
    }
    
    const priority = ['groq', 'together', 'openrouter', 'ollama'];
    for (const name of priority) {
      if (this.providers.has(name)) {
        return this.providers.get(name);
      }
    }
    
    return null;
  }

  async callOpenAICompatible(provider, messages, options) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (provider.name === 'OpenRouter') {
        headers['HTTP-Referer'] = 'https://ai-content-flow.local';
        headers['X-Title'] = 'AI Content Flow';
      }
      
      headers['Authorization'] = `Bearer ${provider.apiKey}`;

      const response = await axios.post(
        `${provider.baseUrl}/chat/completions`,
        {
          model: provider.model,
          messages,
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7
        },
        {
          headers,
          timeout: 60000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        provider: provider.name.toLowerCase(),
        usage: response.data.usage || {}
      };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      throw new Error(`${provider.name} API call failed: ${errMsg}`);
    }
  }

  async callOllama(provider, messages, options) {
    try {
      const response = await axios.post(
        `${provider.baseUrl}/api/chat`,
        {
          model: provider.model,
          messages,
          stream: false,
          options: {
            num_predict: options.maxTokens || 2000,
            temperature: options.temperature || 0.7
          }
        },
        {
          timeout: 120000
        }
      );

      return {
        content: response.data.message.content,
        model: provider.model,
        provider: 'ollama',
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0
        }
      };
    } catch (error) {
      throw new Error(`Ollama call failed: ${error.message}`);
    }
  }

  getAvailableProviders() {
    this.init();
    return Array.from(this.providers.entries()).map(([id, p]) => ({
      id,
      name: p.name,
      model: p.model
    }));
  }

  getModels() {
    return this.getAvailableProviders();
  }

  hasProviders() {
    this.init();
    return this.providers.size > 0;
  }
}

module.exports = new LLMGateway();
