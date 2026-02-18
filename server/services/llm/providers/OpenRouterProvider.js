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
    return await this.chatCompletion(messages, options);
  }
}

module.exports = OpenRouterProvider;
