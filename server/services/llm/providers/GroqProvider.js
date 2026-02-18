const BaseProvider = require('../BaseProvider');

class GroqProvider extends BaseProvider {
  constructor(config) {
    super(config);
  }

  async generate(messages, options = {}) {
    return await this.chatCompletion(messages, options);
  }
}

module.exports = GroqProvider;
