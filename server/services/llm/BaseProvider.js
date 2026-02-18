const axios = require('axios');

class BaseProvider {
  constructor(config) {
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.defaultModel;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 2;
    this.models = config.models || [];
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: this.getHeaders()
    });
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  async generate(messages, options = {}) {
    throw new Error('Method generate() must be implemented by subclass');
  }

  async chatCompletion(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 2000;

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...options.extraParams
      });

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        provider: this.name.toLowerCase(),
        usage: response.data.usage,
        raw: response.data
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;
      
      if (status === 401) {
        return new Error(`[${this.name}] API Key 无效或未配置`);
      } else if (status === 429) {
        return new Error(`[${this.name}] 请求频率超限，请稍后重试`);
      } else if (status === 500 || status === 502 || status === 503) {
        return new Error(`[${this.name}] 服务暂时不可用`);
      }
      
      return new Error(`[${this.name}] API 错误: ${message}`);
    }
    
    return new Error(`[${this.name}] 请求失败: ${error.message}`);
  }

  isAvailable() {
    return !!this.apiKey;
  }

  getModels() {
    return this.models;
  }

  getDefaultModel() {
    return this.defaultModel;
  }
}

module.exports = BaseProvider;
