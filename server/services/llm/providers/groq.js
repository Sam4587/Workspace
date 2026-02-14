const axios = require('axios');
const BaseProvider = require('./base');

class GroqProvider extends BaseProvider {
  constructor() {
    super({
      name: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      rateLimit: { rpm: 30, tpm: 15000 },
      type: 'free',
      models: [
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', type: 'free' },
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', type: 'free' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', type: 'free' },
        { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', type: 'free' },
      ]
    });
  }

  async generate(messages, options = {}) {
    if (!this.enabled) {
      throw new Error('Groq API key not configured');
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
      throw new Error(`Groq error: ${error.message}`);
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
          model: 'llama-3.1-8b-instant',
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

module.exports = GroqProvider;
