/**
 * 文本优化服务
 * VT-003: AI文本优化与智能分段
 * 
 * 功能：
 * - 错别字修正
 * - 句子补全
 * - 智能分段
 * - 标点优化
 */

const logger = require('../utils/logger');
const llmGateway = require('./llm');
const NodeCache = require('node-cache');

class TextOptimizationService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
    this.optimizationHistory = [];
    this.maxHistorySize = 300;

    this.config = {
      defaultModel: process.env.TEXT_OPT_MODEL || 'deepseek/deepseek-chat',
      maxTextLength: 10000,
      segmentMinLength: 50,
      segmentMaxLength: 500,
      enableCache: true
    };

    this.prompts = {
      correction: `你是一个专业的文字校对编辑。请对以下转录文本进行纠错：

1. 修正错别字和同音字错误
2. 修正语法错误
3. 保持原文的核心意思不变
4. 不要添加或删除内容

原始文本：
{text}

请直接输出修正后的文本，不要添加任何解释。`,

      completion: `你是一个专业的文本编辑。请对以下转录文本进行句子补全：

1. 补全不完整的句子
2. 添加缺失的主语或宾语
3. 保持原文的语气和风格
4. 不要添加原文没有的信息

原始文本：
{text}

请直接输出补全后的文本，不要添加任何解释。`,

      segmentation: `你是一个专业的文本编辑。请对以下文本进行智能分段：

1. 根据语义和主题进行分段
2. 每段应该表达一个完整的意思
3. 使用空行分隔段落
4. 保持原文内容不变

原始文本：
{text}

请直接输出分段后的文本，使用空行分隔段落。`,

      punctuation: `你是一个专业的标点符号编辑。请对以下文本进行标点优化：

1. 添加缺失的标点符号
2. 修正错误的标点符号
3. 使用中文标点符号
4. 保持原文内容不变

原始文本：
{text}

请直接输出优化后的文本。`,

      fullOptimization: `你是一个专业的文字编辑。请对以下转录文本进行全面优化：

1. 修正错别字和语法错误
2. 补全不完整的句子
3. 根据语义进行智能分段
4. 优化标点符号
5. 保持原文的核心意思不变

原始文本：
{text}

请输出优化后的文本，使用Markdown格式，包含适当的段落分隔。`
    };
  }

  async correctText(text, options = {}) {
    const optimizationId = this.generateId();

    try {
      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'correctText', options);
      }

      logger.info('[TextOptimization] 开始文本纠错', { optimizationId, textLength: text.length });

      const prompt = this.prompts.correction.replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: Math.ceil(text.length * 1.5)
      });

      const correctedText = result.content || result.choices?.[0]?.message?.content || text;

      const changes = this.compareTexts(text, correctedText);

      this.addToHistory({
        id: optimizationId,
        type: 'correction',
        originalLength: text.length,
        resultLength: correctedText.length,
        changes: changes.length
      });

      return {
        success: true,
        optimizationId,
        originalText: text,
        correctedText,
        changes,
        changeCount: changes.length
      };
    } catch (error) {
      logger.error('[TextOptimization] 纠错失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async completeSentences(text, options = {}) {
    const optimizationId = this.generateId();

    try {
      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'completeSentences', options);
      }

      logger.info('[TextOptimization] 开始句子补全', { optimizationId });

      const prompt = this.prompts.completion.replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: Math.ceil(text.length * 1.5)
      });

      const completedText = result.content || result.choices?.[0]?.message?.content || text;

      this.addToHistory({
        id: optimizationId,
        type: 'completion',
        originalLength: text.length,
        resultLength: completedText.length
      });

      return {
        success: true,
        optimizationId,
        originalText: text,
        completedText
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async segmentText(text, options = {}) {
    const optimizationId = this.generateId();

    try {
      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'segmentText', options);
      }

      logger.info('[TextOptimization] 开始智能分段', { optimizationId });

      const prompt = this.prompts.segmentation.replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: Math.ceil(text.length * 1.5)
      });

      const segmentedText = result.content || result.choices?.[0]?.message?.content || text;

      const paragraphs = segmentedText.split(/\n\s*\n/).filter(p => p.trim());

      this.addToHistory({
        id: optimizationId,
        type: 'segmentation',
        originalLength: text.length,
        resultLength: segmentedText.length,
        paragraphCount: paragraphs.length
      });

      return {
        success: true,
        optimizationId,
        originalText: text,
        segmentedText,
        paragraphs,
        paragraphCount: paragraphs.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async optimizePunctuation(text, options = {}) {
    const optimizationId = this.generateId();

    try {
      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'optimizePunctuation', options);
      }

      logger.info('[TextOptimization] 开始标点优化', { optimizationId });

      const prompt = this.prompts.punctuation.replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.2,
        maxTokens: Math.ceil(text.length * 1.3)
      });

      const optimizedText = result.content || result.choices?.[0]?.message?.content || text;

      this.addToHistory({
        id: optimizationId,
        type: 'punctuation',
        originalLength: text.length,
        resultLength: optimizedText.length
      });

      return {
        success: true,
        optimizationId,
        originalText: text,
        optimizedText
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fullOptimization(text, options = {}) {
    const optimizationId = this.generateId();
    const startTime = Date.now();

    try {
      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'fullOptimization', options);
      }

      logger.info('[TextOptimization] 开始全面优化', { optimizationId, textLength: text.length });

      const prompt = this.prompts.fullOptimization.replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: Math.ceil(text.length * 2)
      });

      const optimizedText = result.content || result.choices?.[0]?.message?.content || text;

      const paragraphs = optimizedText.split(/\n\s*\n/).filter(p => p.trim());
      const changes = this.compareTexts(text, optimizedText);

      const processingTime = Date.now() - startTime;

      this.addToHistory({
        id: optimizationId,
        type: 'full',
        originalLength: text.length,
        resultLength: optimizedText.length,
        paragraphCount: paragraphs.length,
        changeCount: changes.length,
        processingTime
      });

      return {
        success: true,
        optimizationId,
        originalText: text,
        optimizedText,
        paragraphs,
        paragraphCount: paragraphs.length,
        changes,
        changeCount: changes.length,
        processingTime,
        stats: {
          originalLength: text.length,
          resultLength: optimizedText.length,
          lengthChange: optimizedText.length - text.length,
          wordCount: optimizedText.split(/\s+/).length,
          sentenceCount: optimizedText.split(/[。！？.!?]/).filter(s => s.trim()).length
        }
      };
    } catch (error) {
      logger.error('[TextOptimization] 全面优化失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async processLongText(text, operation, options) {
    const chunks = this.splitText(text, this.config.maxTextLength * 0.8);
    const results = [];

    for (const chunk of chunks) {
      let result;
      switch (operation) {
        case 'correctText':
          result = await this.correctText(chunk, options);
          break;
        case 'completeSentences':
          result = await this.completeSentences(chunk, options);
          break;
        case 'segmentText':
          result = await this.segmentText(chunk, options);
          break;
        case 'optimizePunctuation':
          result = await this.optimizePunctuation(chunk, options);
          break;
        case 'fullOptimization':
          result = await this.fullOptimization(chunk, options);
          break;
        default:
          result = { success: false, error: '未知操作' };
      }

      if (result.success) {
        results.push(result.optimizedText || result.correctedText || result.completedText || result.segmentedText || chunk);
      } else {
        results.push(chunk);
      }
    }

    return {
      success: true,
      chunked: true,
      chunkCount: chunks.length,
      result: results.join('\n\n')
    };
  }

  splitText(text, maxLength) {
    const chunks = [];
    const sentences = text.split(/([。！？.!?])/);
    let currentChunk = '';

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '');

      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  compareTexts(original, optimized) {
    const changes = [];
    const originalWords = original.split(/(\s+|[，。！？、；：""''（）【】])/);
    const optimizedWords = optimized.split(/(\s+|[，。！？、；：""''（）【】])/);

    const maxLen = Math.max(originalWords.length, optimizedWords.length);

    for (let i = 0; i < maxLen; i++) {
      if (originalWords[i] !== optimizedWords[i]) {
        changes.push({
          position: i,
          original: originalWords[i] || '',
          optimized: optimizedWords[i] || '',
          type: !originalWords[i] ? 'added' : !optimizedWords[i] ? 'removed' : 'changed'
        });
      }
    }

    return changes.slice(0, 50);
  }

  async analyzeReadability(text) {
    try {
      const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
      const words = text.split(/\s+/).filter(w => w.trim());
      const chars = text.replace(/\s/g, '').length;

      const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
      const avgWordLength = words.length > 0 ? chars / words.length : 0;

      const complexWords = words.filter(w => w.length > 6).length;
      const complexWordRatio = words.length > 0 ? complexWords / words.length : 0;

      const readabilityScore = this.calculateReadabilityScore(avgSentenceLength, complexWordRatio);

      return {
        success: true,
        stats: {
          sentenceCount: sentences.length,
          wordCount: words.length,
          charCount: chars,
          avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
          avgWordLength: Math.round(avgWordLength * 10) / 10,
          complexWordRatio: Math.round(complexWordRatio * 100) / 100,
          readabilityScore
        },
        grade: this.getReadabilityGrade(readabilityScore)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  calculateReadabilityScore(avgSentenceLength, complexWordRatio) {
    const score = 100 - (avgSentenceLength * 2) - (complexWordRatio * 50);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getReadabilityGrade(score) {
    if (score >= 90) return { level: '优秀', description: '非常容易阅读' };
    if (score >= 80) return { level: '良好', description: '容易阅读' };
    if (score >= 70) return { level: '中等', description: '一般难度' };
    if (score >= 60) return { level: '及格', description: '稍有难度' };
    return { level: '较差', description: '阅读困难' };
  }

  addToHistory(entry) {
    this.optimizationHistory.unshift(entry);

    if (this.optimizationHistory.length > this.maxHistorySize) {
      this.optimizationHistory = this.optimizationHistory.slice(0, this.maxHistorySize);
    }
  }

  getHistory(options = {}) {
    let history = [...this.optimizationHistory];

    if (options.type) {
      history = history.filter(h => h.type === options.type);
    }

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  getStats() {
    const total = this.optimizationHistory.length;

    const typeStats = {};
    this.optimizationHistory.forEach(h => {
      if (!typeStats[h.type]) {
        typeStats[h.type] = { count: 0, totalChanges: 0, avgTime: 0 };
      }
      typeStats[h.type].count++;
      typeStats[h.type].totalChanges += h.changeCount || 0;
      if (h.processingTime) {
        typeStats[h.type].avgTime = (typeStats[h.type].avgTime + h.processingTime) / 2;
      }
    });

    return {
      total,
      typeStats,
      avgChangesPerOptimization: total > 0
        ? Math.round(this.optimizationHistory.reduce((sum, h) => sum + (h.changeCount || 0), 0) / total)
        : 0
    };
  }

  generateId() {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return { ...this.config };
  }
}

const textOptimizationService = new TextOptimizationService();

module.exports = {
  TextOptimizationService,
  textOptimizationService
};
