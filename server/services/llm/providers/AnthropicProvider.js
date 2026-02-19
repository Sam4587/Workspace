const axios = require('axios');
const logger = require('../../../utils/logger');

class AnthropicProvider {
  constructor(config) {
    this.name = 'Anthropic';
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.defaultModel = config.defaultModel || 'claude-3-5-sonnet-20241022';
    this.timeout = config.timeout || 60000;
    this.models = config.models || [];
    this.enabled = !!this.apiKey;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
  }

  isAvailable() {
    return this.enabled;
  }

  async generate(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 2000;
    const temperature = options.temperature || 0.7;

    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    try {
      const startTime = Date.now();
      
      const requestBody = {
        model,
        max_tokens: maxTokens,
        messages: chatMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        temperature
      };

      if (systemMessage) {
        requestBody.system = systemMessage.content;
      }

      const response = await this.client.post('/messages', requestBody);

      const latency = Date.now() - startTime;
      
      logger.info('[Anthropic] 生成完成', {
        model,
        latency,
        tokens: response.data.usage?.input_tokens + response.data.usage?.output_tokens
      });

      return {
        content: response.data.content[0].text,
        model: response.data.model,
        provider: 'anthropic',
        usage: {
          prompt_tokens: response.data.usage?.input_tokens || 0,
          completion_tokens: response.data.usage?.output_tokens || 0,
          total_tokens: (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0)
        },
        latency,
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
        return new Error('[Anthropic] API Key 无效或未配置');
      } else if (status === 429) {
        return new Error('[Anthropic] 请求频率超限，请稍后重试');
      } else if (status === 500 || status === 502 || status === 503) {
        return new Error('[Anthropic] 服务暂时不可用');
      }
      
      return new Error(`[Anthropic] API 错误: ${message}`);
    }
    
    return new Error(`[Anthropic] 请求失败: ${error.message}`);
  }

  getModels() {
    return this.models;
  }

  getDefaultModel() {
    return this.defaultModel;
  }
}

module.exports = AnthropicProvider;
