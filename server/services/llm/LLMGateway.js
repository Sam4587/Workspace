const { 
  getEnabledProviders, 
  getProviderConfig, 
  getDefaultProvider,
  getDefaultModel,
  getFallbackModels,
  parseModelString
} = require('./config');
const OpenRouterProvider = require('./providers/OpenRouterProvider');
const GroqProvider = require('./providers/GroqProvider');
const CerebrasProvider = require('./providers/CerebrasProvider');
const DeepSeekProvider = require('./providers/DeepSeekProvider');
const OllamaProvider = require('./providers/OllamaProvider');
const AnthropicProvider = require('./providers/AnthropicProvider');
const GeminiProvider = require('./providers/GeminiProvider');
const logger = require('../../utils/logger');

const providerClasses = {
  openrouter: OpenRouterProvider,
  groq: GroqProvider,
  cerebras: CerebrasProvider,
  deepseek: DeepSeekProvider,
  ollama: OllamaProvider,
  openai: OpenRouterProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider
};

class LLMGateway {
  constructor() {
    this.providers = new Map();
    this.initialized = false;
  }

  initializeProviders() {
    if (this.initialized) return;
    
    const enabledConfigs = getEnabledProviders();
    
    for (const config of enabledConfigs) {
      const ProviderClass = providerClasses[config.key];
      if (ProviderClass) {
        try {
          const provider = new ProviderClass(config);
          this.providers.set(config.key, provider);
          logger.info(`[LLMGateway] 已加载提供商: ${config.displayName}`);
        } catch (error) {
          logger.error(`[LLMGateway] 加载提供商 ${config.displayName} 失败:`, error.message);
        }
      }
    }
    
    this.initialized = true;
  }

  async generate(messages, options = {}) {
    this.initializeProviders();
    
    const modelString = options.model || getDefaultModel();
    const { provider: parsedProvider, model: parsedModel } = parseModelString(modelString);
    
    let providerName = parsedProvider || options.provider || getDefaultProvider();
    let modelName = parsedModel || options.modelName;
    
    if (!providerName) {
      throw new Error('[LLMGateway] 没有可用的 LLM 提供商，请检查环境变量配置');
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      logger.warn(`[LLMGateway] 提供商 ${providerName} 不可用，尝试备用提供商`);
      return await this.fallbackGenerate(messages, options, providerName);
    }

    try {
      const startTime = Date.now();
      const result = await provider.generate(messages, { 
        ...options, 
        model: modelName 
      });
      
      logger.info(`[LLMGateway] ${providerName} 生成成功`, {
        model: result.model,
        latency: Date.now() - startTime,
        tokens: result.usage?.total_tokens
      });
      
      return result;
    } catch (error) {
      logger.error(`[LLMGateway] ${providerName} 生成失败:`, error.message);
      return await this.fallbackGenerate(messages, options, providerName);
    }
  }

  async fallbackGenerate(messages, options, failedProvider) {
    const fallbackModels = getFallbackModels();
    const providers = Array.from(this.providers.keys());
    const fallbackProviders = providers.filter(p => p !== failedProvider);

    for (const fallbackModel of fallbackModels) {
      const { provider, model } = parseModelString(fallbackModel);
      if (provider && this.providers.has(provider)) {
        try {
          logger.info(`[LLMGateway] 尝试备用模型: ${fallbackModel}`);
          const providerInstance = this.providers.get(provider);
          const result = await providerInstance.generate(messages, { 
            ...options, 
            model 
          });
          logger.info(`[LLMGateway] ${fallbackModel} 生成成功`);
          return result;
        } catch (error) {
          logger.error(`[LLMGateway] ${fallbackModel} 失败:`, error.message);
          continue;
        }
      }
    }

    for (const providerName of fallbackProviders) {
      try {
        logger.info(`[LLMGateway] 尝试备用提供商: ${providerName}`);
        const providerInstance = this.providers.get(providerName);
        const result = await providerInstance.generate(messages, options);
        logger.info(`[LLMGateway] ${providerName} 生成成功`);
        return result;
      } catch (error) {
        logger.error(`[LLMGateway] ${providerName} 备用失败:`, error.message);
        continue;
      }
    }

    throw new Error('[LLMGateway] 所有提供商都失败，请检查API配置或网络连接');
  }

  async chat(messages, options = {}) {
    return this.generate(messages, options);
  }

  async checkHealth() {
    this.initializeProviders();
    
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        if (provider.checkHealth) {
          results[name] = await provider.checkHealth();
        } else {
          const testResult = await provider.generate([
            { role: 'user', content: 'ping' }
          ], { maxTokens: 5 });
          results[name] = { healthy: !!testResult };
        }
      } catch (error) {
        results[name] = { healthy: false, error: error.message };
      }
    }
    
    return results;
  }

  getAvailableProviders() {
    this.initializeProviders();
    
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      name: key,
      displayName: provider.name,
      models: provider.getModels(),
      defaultModel: provider.getDefaultModel(),
      available: provider.isAvailable()
    }));
  }

  getProvider(name) {
    this.initializeProviders();
    return this.providers.get(name);
  }

  getModels(providerName) {
    this.initializeProviders();
    const provider = this.providers.get(providerName);
    return provider ? provider.getModels() : [];
  }

  hasProviders() {
    this.initializeProviders();
    return this.providers.size > 0;
  }

  async listOllamaModels() {
    this.initializeProviders();
    const ollama = this.providers.get('ollama');
    if (ollama) {
      return await ollama.listModels();
    }
    return [];
  }

  async pullOllamaModel(modelName) {
    this.initializeProviders();
    const ollama = this.providers.get('ollama');
    if (ollama) {
      return await ollama.pullModel(modelName);
    }
    return { success: false, error: 'Ollama not available' };
  }
}

module.exports = new LLMGateway();
