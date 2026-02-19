const axios = require('axios');
const logger = require('../../../utils/logger');

class GeminiProvider {
  constructor(config) {
    this.name = 'Gemini';
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = config.defaultModel || 'gemini-2.0-flash';
    this.timeout = config.timeout || 60000;
    this.models = config.models || [];
    this.enabled = !!this.apiKey;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout
    });
  }

  isAvailable() {
    return this.enabled;
  }

  async generate(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 2000;
    const temperature = options.temperature || 0.7;

    try {
      const startTime = Date.now();
      
      const systemInstruction = messages
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n');

      const contents = this.convertMessagesToGeminiFormat(messages);

      const requestBody = {
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature
        }
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await this.client.post(
        `/models/${model}:generateContent?key=${this.apiKey}`,
        requestBody
      );

      const latency = Date.now() - startTime;
      
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      logger.info('[Gemini] 生成完成', {
        model,
        latency,
        tokens: response.data.usageMetadata?.totalTokenCount
      });

      return {
        content: text,
        model,
        provider: 'gemini',
        usage: {
          prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.data.usageMetadata?.totalTokenCount || 0
        },
        latency,
        raw: response.data
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  convertMessagesToGeminiFormat(messages) {
    const geminiMessages = [];
    let currentRole = null;
    let currentParts = [];

    for (const msg of messages.filter(m => m.role !== 'system')) {
      const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
      
      if (currentRole !== geminiRole && currentParts.length > 0) {
        geminiMessages.push({
          role: currentRole,
          parts: currentParts
        });
        currentParts = [];
      }
      
      currentRole = geminiRole;
      currentParts.push({ text: msg.content });
    }

    if (currentParts.length > 0) {
      geminiMessages.push({
        role: currentRole,
        parts: currentParts
      });
    }

    return geminiMessages;
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;
      
      if (status === 400) {
        return new Error(`[Gemini] 请求参数错误: ${message}`);
      } else if (status === 401 || status === 403) {
        return new Error('[Gemini] API Key 无效或未配置');
      } else if (status === 429) {
        return new Error('[Gemini] 请求频率超限，请稍后重试');
      } else if (status === 503) {
        return new Error('[Gemini] 服务暂时不可用');
      }
      
      return new Error(`[Gemini] API 错误: ${message}`);
    }
    
    return new Error(`[Gemini] 请求失败: ${error.message}`);
  }

  getModels() {
    return this.models;
  }

  getDefaultModel() {
    return this.defaultModel;
  }

  async listModels() {
    try {
      const response = await this.client.get(`/models?key=${this.apiKey}`);
      return response.data.models?.map(m => m.name) || [];
    } catch (error) {
      logger.error('[Gemini] 获取模型列表失败:', error.message);
      return [];
    }
  }
}

module.exports = GeminiProvider;
