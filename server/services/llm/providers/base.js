class BaseProvider {
  constructor(config) {
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
    this.enabled = !!config.apiKey;
    this.rateLimit = config.rateLimit || { rpm: 60, tpm: 60000 };
    this.models = config.models || [];
    this.type = config.type || 'free';
    this.trialCredits = config.trialCredits || 0;
    this.usedCredits = 0;
    this.requestCount = 0;
    this.lastReset = Date.now();
    this.healthStatus = 'unknown';
    this.lastHealthCheck = null;
  }

  async generate(messages, options = {}) {
    throw new Error('Not implemented');
  }

  async checkHealth() {
    throw new Error('Not implemented');
  }

  isAvailable() {
    if (!this.enabled) return false;
    if (this.type === 'trial' && this.usedCredits >= this.trialCredits) return false;
    return this.requestCount < this.rateLimit.rpm;
  }

  isHealthy() {
    if (!this.lastHealthCheck) return false;
    return this.healthStatus === 'healthy';
  }

  incrementUsage(credits = 1) {
    this.requestCount++;
    this.usedCredits += credits;
    
    const now = Date.now();
    if (now - this.lastReset > 60000) {
      this.requestCount = 0;
      this.lastReset = now;
    }
  }

  getStatus() {
    return {
      name: this.name,
      enabled: this.enabled,
      available: this.isAvailable(),
      healthy: this.isHealthy(),
      type: this.type,
      rateLimit: this.rateLimit,
      requestCount: this.requestCount,
      usedCredits: this.usedCredits,
      trialCredits: this.trialCredits,
      models: this.models.map(m => m.id),
    };
  }

  selectModel(preferredModel) {
    if (preferredModel) {
      const model = this.models.find(m => m.id === preferredModel);
      if (model) return model;
    }
    return this.models.find(m => m.type === 'free') || this.models[0];
  }
}

module.exports = BaseProvider;
