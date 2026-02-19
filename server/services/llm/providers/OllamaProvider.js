const axios = require('axios');
const logger = require('../../../utils/logger');

class OllamaProvider {
  constructor(config) {
    this.name = 'Ollama';
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || process.env.OLLAMA_MODEL || 'llama3';
    this.timeout = config.timeout || 120000;
    this.models = config.models || [];
    this.enabled = true;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout
    });
  }

  isAvailable() {
    return this.enabled;
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/api/tags');
      return {
        healthy: true,
        models: response.data.models || []
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  async listModels() {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      logger.error('[Ollama] 获取模型列表失败:', error.message);
      return [];
    }
  }

  async pullModel(modelName) {
    try {
      logger.info(`[Ollama] 正在拉取模型: ${modelName}`);
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: false
      });
      logger.info(`[Ollama] 模型 ${modelName} 拉取完成`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error(`[Ollama] 拉取模型失败:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async generate(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 2000;

    try {
      const startTime = Date.now();
      
      const response = await this.client.post('/api/chat', {
        model,
        messages,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature
        }
      });

      const latency = Date.now() - startTime;
      
      logger.info('[Ollama] 生成完成', {
        model,
        latency,
        tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
      });

      return {
        content: response.data.message.content,
        model,
        provider: 'ollama',
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0,
          total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        },
        latency,
        raw: response.data
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.code === 'ECONNREFUSED') {
      return new Error('[Ollama] 无法连接到 Ollama 服务，请确保服务正在运行 (ollama serve)');
    }
    if (error.code === 'ETIMEDOUT') {
      return new Error('[Ollama] 请求超时，模型可能正在加载中');
    }
    if (error.response?.status === 404) {
      return new Error(`[Ollama] 模型不存在，请先拉取: ollama pull ${this.defaultModel}`);
    }
    return new Error(`[Ollama] 请求失败: ${error.message}`);
  }

  getModels() {
    return this.models;
  }

  getDefaultModel() {
    return this.defaultModel;
  }

  async ensureModelExists(modelName) {
    const models = await this.listModels();
    const exists = models.some(m => m.name === modelName || m.name.startsWith(modelName + ':'));
    
    if (!exists) {
      logger.info(`[Ollama] 模型 ${modelName} 不存在，尝试自动拉取...`);
      const result = await this.pullModel(modelName);
      return result.success;
    }
    
    return true;
  }
}

module.exports = OllamaProvider;
