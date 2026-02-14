const axios = require('axios');
const BaseProvider = require('./base');

class OpenRouterProvider extends BaseProvider {
  constructor() {
    super({
      name: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      rateLimit: { rpm: 20, tpm: 100000 },
      type: 'free',
      models: [
        { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B', type: 'free' },
        { id: 'meta-llama/llama-3.1-405b-instruct:free', name: 'Llama 3.1 405B', type: 'free' },
        { id: 'qwen/qwen3-4b:free', name: 'Qwen3 4B', type: 'free' },
        { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1', type: 'free' },
        { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1', type: 'free' },
      ]
    });
  }

  async generate(messages, options = {}) {
    if (!this.enabled) {
      throw new Error('OpenRouter API key not configured');
    }

    const model = this.selectModel(options.model);
    if (!model) {
      throw new Error('No available model');
    }

    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: model.id,
          messages,
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'http://localhost',
            'X-Title': 'AI Content Generator',
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      this.incrementUsage();

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
        provider: this.name,
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`OpenRouter error: ${error.message}`);
    }
  }

  async checkHealth() {
    if (!this.enabled) {
      this.healthStatus = 'disabled';
      return false;
    }

    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: 'google/gemma-3-12b-it:free',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      this.healthStatus = 'healthy';
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.healthStatus = 'unhealthy';
      this.lastHealthCheck = new Date();
      return false;
    }
  }
}

module.exports = OpenRouterProvider;
