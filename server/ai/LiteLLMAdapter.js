/**
 * LiteLLM 适配器
 * 统一接口支持 100+ AI 提供商，借鉴 TrendRadar AI Analyzer 设计
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { AIProvider, AIProviderModelMap } = require('../core/types');

class LiteLLMAdapter {
  /**
   * @param {Object} config
   * @param {string} [config.proxyUrl] - LiteLLM Proxy 地址
   * @param {string} [config.apiKey] - API Key (可选，Proxy 可能已配置)
   */
  constructor(config = {}) {
    this.proxyUrl = config.proxyUrl || process.env.LITELLM_PROXY_URL || 'http://localhost:4000';
    this.apiKey = config.apiKey || process.env.LITELLM_API_KEY || '';

    this.axiosInstance = axios.create({
      baseURL: this.proxyUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
      }
    });

    // 提供商健康状态缓存
    this.healthStatus = new Map();
    this.lastHealthCheck = null;
  }

  /**
   * 生成内容
   * @param {string} prompt - 提示词
   * @param {Object} options - 选项
   * @param {string} [options.model] - 模型名称
   * @param {string} [options.provider] - AI 提供商
   * @param {number} [options.maxTokens] - 最大 Token 数
   * @param {number} [options.temperature] - 温度
   * @returns {Promise<import('../core/types').AIResponse>}
   */
  async generate(prompt, options = {}) {
    // 确定使用的模型
    let model = options.model;
    if (!model && options.provider) {
      model = AIProviderModelMap[options.provider];
    }
    if (!model) {
      model = 'gpt-4'; // 默认模型
    }

    const payload = {
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的内容创作者，擅长撰写高质量的文章、微头条、视频脚本等。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    };

    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.post('/v1/chat/completions', payload);
      const duration = Date.now() - startTime;

      const choice = response.data.choices[0];
      const usage = response.data.usage;

      logger.info(`[LiteLLM] 生成完成: model=${model}, tokens=${usage?.total_tokens}, duration=${duration}ms`);

      return {
        content: choice.message.content,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0
        },
        model: response.data.model || model,
        provider: options.provider || this.extractProvider(model)
      };
    } catch (error) {
      logger.error(`[LiteLLM] 生成失败: ${error.message}`, {
        model,
        status: error.response?.status
      });
      throw new Error(`LiteLLM 生成失败: ${error.message}`);
    }
  }

  /**
   * 流式生成内容
   * @param {string} prompt - 提示词
   * @param {Function} onChunk - 接收数据块的回调
   * @param {Object} options - 选项
   */
  async generateStream(prompt, onChunk, options = {}) {
    let model = options.model;
    if (!model && options.provider) {
      model = AIProviderModelMap[options.provider];
    }
    if (!model) {
      model = 'gpt-4';
    }

    const payload = {
      model,
      messages: [
        { role: 'system', content: '你是一个专业的内容创作者。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      stream: true
    };

    try {
      const response = await this.axiosInstance.post('/v1/chat/completions', payload, {
        responseType: 'stream'
      });

      let fullContent = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content, fullContent);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve({
            content: fullContent,
            model,
            provider: options.provider || this.extractProvider(model)
          });
        });
        response.data.on('error', reject);
      });
    } catch (error) {
      logger.error(`[LiteLLM] 流式生成失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取可用模型列表
   * @returns {Promise<string[]>}
   */
  async getAvailableModels() {
    try {
      const response = await this.axiosInstance.get('/v1/models');
      return response.data.data.map(m => m.id);
    } catch (error) {
      logger.warn(`[LiteLLM] 获取模型列表失败: ${error.message}`);
      return Object.values(AIProviderModelMap);
    }
  }

  /**
   * 健康检查
   * @param {string} [model] - 可选，检查特定模型
   * @returns {Promise<{healthy: boolean, latency?: number, error?: string}>}
   */
  async healthCheck(model) {
    const testModel = model || 'gpt-4';

    try {
      const startTime = Date.now();
      await this.axiosInstance.post('/v1/chat/completions', {
        model: testModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      });
      const latency = Date.now() - startTime;

      this.healthStatus.set(testModel, { healthy: true, latency, lastCheck: new Date() });

      return { healthy: true, latency };
    } catch (error) {
      this.healthStatus.set(testModel, { healthy: false, error: error.message, lastCheck: new Date() });
      return { healthy: false, error: error.message };
    }
  }

  /**
   * 批量健康检查
   * @returns {Promise<Object>}
   */
  async healthCheckAll() {
    const models = Object.values(AIProviderModelMap);
    const results = {};

    for (const model of models) {
      results[model] = await this.healthCheck(model);
    }

    this.lastHealthCheck = new Date();
    return results;
  }

  /**
   * 获取缓存的健康状态
   * @returns {Object}
   */
  getCachedHealthStatus() {
    const status = {};
    for (const [model, data] of this.healthStatus) {
      status[model] = data;
    }
    return {
      models: status,
      lastCheck: this.lastHealthCheck
    };
  }

  /**
   * 从模型名称提取提供商
   * @param {string} model
   * @returns {string}
   */
  extractProvider(model) {
    const modelLower = model.toLowerCase();

    if (modelLower.includes('gpt') || modelLower.includes('o1') || modelLower.includes('o3')) {
      return AIProvider.OPENAI;
    }
    if (modelLower.includes('claude')) {
      return AIProvider.CLAUDE;
    }
    if (modelLower.includes('deepseek')) {
      return AIProvider.DEEPSEEK;
    }
    if (modelLower.includes('moonshot')) {
      return AIProvider.MOONSHOT;
    }
    if (modelLower.includes('glm') || modelLower.includes('zhipu')) {
      return AIProvider.ZHIPU;
    }
    if (modelLower.includes('qwen')) {
      return AIProvider.QWEN;
    }
    if (modelLower.includes('ernie') || modelLower.includes('baidu')) {
      return AIProvider.BAIDU;
    }
    if (modelLower.includes('spark') || modelLower.includes('xunfei')) {
      return AIProvider.XUNFEI;
    }

    return 'unknown';
  }

  /**
   * 获取提供商列表
   * @returns {string[]}
   */
  getAvailableProviders() {
    return Object.values(AIProvider);
  }
}

// 单例模式
const liteLLMAdapter = new LiteLLMAdapter();

module.exports = {
  LiteLLMAdapter,
  liteLLMAdapter
};
