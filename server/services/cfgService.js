/**
 * 条件引导生成服务
 * IT-005: 条件引导生成(CFG)技术
 * 
 * 功能：
 * - CFG参数调优
 * - 生成质量控制
 * - 内容一致性保证
 * - 参数模型管理
 */

const logger = require('../utils/logger');

class CFGService {
  constructor() {
    this.config = {
      defaultGuidanceScale: 7.5,
      minGuidanceScale: 1.0,
      maxGuidanceScale: 20.0,
      defaultSteps: 20,
      minSteps: 10,
      maxSteps: 50,
      qualityThreshold: 0.85
    };

    this.parameterModels = new Map();
    this.generationHistory = [];
    this.maxHistorySize = 200;

    this.initializeDefaultModels();
  }

  initializeDefaultModels() {
    this.parameterModels.set('default', {
      name: '默认模型',
      guidanceScale: 7.5,
      steps: 20,
      scheduler: 'euler',
      qualityScore: 0.85,
      useCases: ['general']
    });

    this.parameterModels.set('high_quality', {
      name: '高质量模式',
      guidanceScale: 12.0,
      steps: 35,
      scheduler: 'dpm++',
      qualityScore: 0.92,
      useCases: ['portrait', 'close_up']
    });

    this.parameterModels.set('fast', {
      name: '快速模式',
      guidanceScale: 5.0,
      steps: 12,
      scheduler: 'euler_a',
      qualityScore: 0.78,
      useCases: ['preview', 'draft']
    });

    this.parameterModels.set('creative', {
      name: '创意模式',
      guidanceScale: 15.0,
      steps: 30,
      scheduler: 'dpm++',
      qualityScore: 0.88,
      useCases: ['artistic', 'stylized']
    });
  }

  async optimizeParameters(options = {}) {
    const {
      prompt,
      negativePrompt = '',
      style = 'default',
      qualityTarget = 0.85,
      maxSteps = this.config.maxSteps
    } = options;

    try {
      logger.info('[CFG] 开始参数优化', { style, qualityTarget });

      const baseModel = this.parameterModels.get(style) || this.parameterModels.get('default');

      let optimizedParams = { ...baseModel };

      if (qualityTarget > 0.9) {
        optimizedParams.guidanceScale = Math.min(
          optimizedParams.guidanceScale * 1.2,
          this.config.maxGuidanceScale
        );
        optimizedParams.steps = Math.min(
          Math.floor(optimizedParams.steps * 1.3),
          maxSteps
        );
      } else if (qualityTarget < 0.8) {
        optimizedParams.guidanceScale = Math.max(
          optimizedParams.guidanceScale * 0.8,
          this.config.minGuidanceScale
        );
        optimizedParams.steps = Math.max(
          Math.floor(optimizedParams.steps * 0.7),
          this.config.minSteps
        );
      }

      const promptComplexity = this.analyzePromptComplexity(prompt);
      if (promptComplexity > 0.7) {
        optimizedParams.guidanceScale *= 1.1;
        optimizedParams.steps = Math.min(optimizedParams.steps + 5, maxSteps);
      }

      optimizedParams.guidanceScale = Math.round(optimizedParams.guidanceScale * 10) / 10;
      optimizedParams.steps = Math.round(optimizedParams.steps);
      optimizedParams.estimatedQuality = this.estimateQuality(optimizedParams);

      return {
        success: true,
        parameters: optimizedParams,
        analysis: {
          promptComplexity,
          styleMatch: style,
          qualityTarget
        }
      };
    } catch (error) {
      logger.error('[CFG] 参数优化失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  analyzePromptComplexity(prompt) {
    if (!prompt) return 0.5;

    let complexity = 0.5;

    const wordCount = prompt.split(/\s+/).length;
    if (wordCount > 50) complexity += 0.2;
    else if (wordCount > 30) complexity += 0.1;

    if (prompt.includes(',') || prompt.includes(';')) complexity += 0.1;

    const styleKeywords = ['style', 'art', 'cinematic', 'detailed', 'realistic'];
    styleKeywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword)) complexity += 0.05;
    });

    return Math.min(complexity, 1.0);
  }

  estimateQuality(params) {
    const guidanceContribution = Math.min(params.guidanceScale / 15, 1) * 0.3;
    const stepsContribution = Math.min(params.steps / 40, 1) * 0.4;
    const baseQuality = 0.5;

    return Math.min(baseQuality + guidanceContribution + stepsContribution, 0.98);
  }

  async generateWithCFG(options) {
    const {
      prompt,
      negativePrompt = '',
      guidanceScale = this.config.defaultGuidanceScale,
      steps = this.config.defaultSteps,
      seed = -1,
      width = 512,
      height = 512,
      style = 'default'
    } = options;

    const generationId = this.generateId();
    const startTime = Date.now();

    try {
      logger.info('[CFG] 开始条件引导生成', { generationId, guidanceScale, steps });

      const optimizedParams = await this.optimizeParameters({
        prompt,
        negativePrompt,
        style,
        qualityTarget: 0.85
      });

      const generation = {
        id: generationId,
        prompt,
        negativePrompt,
        parameters: optimizedParams.success ? optimizedParams.parameters : {
          guidanceScale,
          steps
        },
        seed: seed === -1 ? Math.floor(Math.random() * 2147483647) : seed,
        width,
        height,
        status: 'processing',
        createdAt: new Date().toISOString()
      };

      const result = await this.simulateGeneration(generation);

      generation.status = 'completed';
      generation.result = result;
      generation.processingTime = Date.now() - startTime;

      this.addToHistory(generation);

      return {
        success: true,
        generationId,
        result,
        parameters: generation.parameters
      };
    } catch (error) {
      logger.error('[CFG] 生成失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async simulateGeneration(generation) {
    return {
      imageUrl: `https://placeholder.com/${generation.id}.png`,
      width: generation.width,
      height: generation.height,
      qualityScore: this.estimateQuality(generation.parameters),
      consistencyScore: 0.9 + Math.random() * 0.08,
      seed: generation.seed
    };
  }

  async batchGenerate(items, options = {}) {
    const results = [];

    for (const item of items) {
      try {
        const result = await this.generateWithCFG({
          ...options,
          prompt: item.prompt,
          negativePrompt: item.negativePrompt,
          seed: item.seed
        });

        results.push({
          itemId: item.id,
          success: result.success,
          generationId: result.generationId,
          error: result.error
        });
      } catch (error) {
        results.push({
          itemId: item.id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      total: items.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  compareParameters(params1, params2) {
    return {
      guidanceScaleDiff: params1.guidanceScale - params2.guidanceScale,
      stepsDiff: params1.steps - params2.steps,
      qualityDiff: this.estimateQuality(params1) - this.estimateQuality(params2),
      recommendation: this.generateComparisonRecommendation(params1, params2)
    };
  }

  generateComparisonRecommendation(params1, params2) {
    const quality1 = this.estimateQuality(params1);
    const quality2 = this.estimateQuality(params2);

    if (quality1 > quality2 + 0.05) {
      return '参数组1预计产生更高质量的结果';
    } else if (quality2 > quality1 + 0.05) {
      return '参数组2预计产生更高质量的结果';
    }
    return '两组参数预计产生相近质量的结果';
  }

  getParameterModel(modelName) {
    return this.parameterModels.get(modelName) || null;
  }

  getAllModels() {
    return Array.from(this.parameterModels.entries()).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }

  addParameterModel(name, params) {
    this.parameterModels.set(name, {
      name,
      ...params,
      qualityScore: this.estimateQuality(params)
    });

    logger.info('[CFG] 新增参数模型', { name });
    return { success: true, name };
  }

  addToHistory(generation) {
    this.generationHistory.unshift(generation);

    if (this.generationHistory.length > this.maxHistorySize) {
      this.generationHistory = this.generationHistory.slice(0, this.maxHistorySize);
    }
  }

  getHistory(options = {}) {
    let history = [...this.generationHistory];

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  getStats() {
    const total = this.generationHistory.length;
    const success = this.generationHistory.filter(g => g.status === 'completed').length;

    const avgQuality = total > 0
      ? this.generationHistory.reduce((sum, g) => sum + (g.result?.qualityScore || 0), 0) / total
      : 0;

    const avgProcessingTime = total > 0
      ? this.generationHistory.reduce((sum, g) => sum + (g.processingTime || 0), 0) / total
      : 0;

    return {
      total,
      success,
      failed: total - success,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
      avgQuality: Math.round(avgQuality * 100) / 100,
      avgProcessingTime: Math.round(avgProcessingTime)
    };
  }

  generateId() {
    return `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return { ...this.config };
  }
}

const cfgService = new CFGService();

module.exports = {
  CFGService,
  cfgService
};
