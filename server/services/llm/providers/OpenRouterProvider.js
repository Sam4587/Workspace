const BaseProvider = require('../BaseProvider');

class OpenRouterProvider extends BaseProvider {
  constructor(config) {
    super(config);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://ai-content-flow.local',
      'X-Title': 'AI Content Flow'
    };
  }

  async generate(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 2000;

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      });

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        provider: 'openrouter',
        usage: response.data.usage,
        raw: response.data
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

module.exports = OpenRouterProvider;
