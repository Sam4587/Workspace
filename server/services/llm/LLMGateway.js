const { getEnabledProviders, getProviderConfig, getDefaultProvider } = require('./config');
const OpenRouterProvider = require('./providers/OpenRouterProvider');
const GroqProvider = require('./providers/GroqProvider');
const CerebrasProvider = require('./providers/CerebrasProvider');
const DeepSeekProvider = require('./providers/DeepSeekProvider');

const providerClasses = {
  openrouter: OpenRouterProvider,
  groq: GroqProvider,
  cerebras: CerebrasProvider,
  deepseek: DeepSeekProvider
};

class LLMGateway {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    const enabledConfigs = getEnabledProviders();
    
    for (const config of enabledConfigs) {
      const ProviderClass = providerClasses[config.name];
      if (ProviderClass) {
        try {
          const provider = new ProviderClass(config);
          this.providers.set(config.name, provider);
          console.log(`[LLMGateway] 已加载提供商: ${config.name}`);
        } catch (error) {
          console.error(`[LLMGateway] 加载提供商 ${config.name} 失败:`, error.message);
        }
      }
    }
  }

  async generate(messages, options = {}) {
    const providerName = options.provider || getDefaultProvider();
    
    if (!providerName) {
      throw new Error('[LLMGateway] 没有可用的 LLM 提供商');
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`[LLMGateway] 提供商 ${providerName} 不可用`);
    }

    try {
      const result = await provider.generate(messages, options);
      return result;
    } catch (error) {
      console.error(`[LLMGateway] ${providerName} 生成失败:`, error.message);
      return await this.fallbackGenerate(messages, options, providerName);
    }
  }

  async fallbackGenerate(messages, options, failedProvider) {
    const providers = Array.from(this.providers.keys());
    const fallbackProviders = providers.filter(p => p !== failedProvider);

    for (const providerName of fallbackProviders) {
      try {
        console.log(`[LLMGateway] 尝试备用提供商: ${providerName}`);
        const provider = this.providers.get(providerName);
        const result = await provider.generate(messages, options);
        console.log(`[LLMGateway] ${providerName} 生成成功`);
        return result;
      } catch (error) {
        console.error(`[LLMGateway] ${providerName} 备用失败:`, error.message);
        continue;
      }
    }

    throw new Error('[LLMGateway] 所有提供商都失败');
  }

  getAvailableProviders() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      models: provider.getModels(),
      defaultModel: provider.getDefaultModel(),
      available: provider.isAvailable()
    }));
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  getModels(providerName) {
    const provider = this.providers.get(providerName);
    return provider ? provider.getModels() : [];
  }

  hasProviders() {
    return this.providers.size > 0;
  }
}

module.exports = new LLMGateway();
