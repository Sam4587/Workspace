const OpenRouterProvider = require('./providers/openrouter');
const GroqProvider = require('./providers/groq');
const CerebrasProvider = require('./providers/cerebras');

class LLMGateway {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = process.env.DEFAULT_PROVIDER || 'openrouter';
    
    this.fallbackChains = [
      ['openrouter', 'groq', 'cerebras'],
    ];
    
    this.init();
  }

  init() {
    const providerConfigs = [
      new OpenRouterProvider(),
      new GroqProvider(),
      new CerebrasProvider(),
    ];

    providerConfigs.forEach(provider => {
      if (provider.enabled) {
        this.providers.set(provider.name, provider);
        console.log(`[LLM Gateway] Provider ${provider.name} initialized`);
      } else {
        console.log(`[LLM Gateway] Provider ${provider.name} disabled (no API key)`);
      }
    });

    if (this.providers.size === 0) {
      console.warn('[LLM Gateway] Warning: No providers available!');
    }
  }

  async generate(messages, options = {}) {
    const { model, provider: preferredProvider, ...opts } = options;

    let provider = this.getProvider(preferredProvider, model);

    if (!provider || !provider.isAvailable()) {
      provider = this.selectAvailableProvider();
    }

    if (!provider) {
      throw new Error('No available LLM provider');
    }

    try {
      const result = await provider.generate(messages, { ...opts, model });
      return result;
    } catch (error) {
      console.error(`[LLM Gateway] Provider ${provider.name} failed:`, error.message);
      
      const fallback = this.selectAvailableProvider(provider.name);
      if (fallback) {
        console.log(`[LLM Gateway] Falling back to ${fallback.name}`);
        return fallback.generate(messages, { ...opts, model });
      }
      
      throw error;
    }
  }

  getProvider(name, model) {
    if (name && this.providers.has(name)) {
      return this.providers.get(name);
    }

    if (model) {
      for (const provider of this.providers.values()) {
        if (provider.models.find(m => m.id === model || m.id.includes(model))) {
          return provider;
        }
      }
    }

    if (this.providers.has(this.defaultProvider)) {
      return this.providers.get(this.defaultProvider);
    }

    return null;
  }

  selectAvailableProvider(excludeName = null) {
    for (const [name, provider] of this.providers) {
      if (name !== excludeName && provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  async healthCheck() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        const healthy = await provider.checkHealth();
        results[name] = {
          status: healthy ? 'healthy' : 'unhealthy',
          ...provider.getStatus(),
        };
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message,
        };
      }
    }

    return results;
  }

  getAvailableProviders() {
    const available = [];
    for (const provider of this.providers.values()) {
      if (provider.isAvailable()) {
        available.push(provider.getStatus());
      }
    }
    return available;
  }

  getAllProviders() {
    const all = [];
    for (const provider of this.providers.values()) {
      all.push(provider.getStatus());
    }
    return all;
  }

  getModels() {
    const models = [];
    for (const provider of this.providers.values()) {
      for (const model of provider.models) {
        models.push({
          ...model,
          provider: provider.name,
          providerType: provider.type,
          available: provider.isAvailable(),
        });
      }
    }
    return models;
  }
}

module.exports = new LLMGateway();
