/**
 * 多语言处理服务
 * VT-004: 多语言摘要与翻译
 * 
 * 功能：
 * - 语言检测
 * - 多语言翻译
 * - 摘要生成
 * - 多语言内容生成
 */

const logger = require('../utils/logger');
const llmGateway = require('./llm');
const NodeCache = require('node-cache');

class MultilingualService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 7200, checkperiod: 600 });
    this.processingHistory = [];
    this.maxHistorySize = 300;

    this.config = {
      defaultModel: process.env.MULTILINGUAL_MODEL || 'deepseek/deepseek-chat',
      maxTextLength: 8000,
      enableCache: true
    };

    this.supportedLanguages = {
      zh: { name: '中文', nativeName: '中文', code: 'zh-CN' },
      en: { name: '英语', nativeName: 'English', code: 'en-US' },
      ja: { name: '日语', nativeName: '日本語', code: 'ja-JP' },
      ko: { name: '韩语', nativeName: '한국어', code: 'ko-KR' },
      fr: { name: '法语', nativeName: 'Français', code: 'fr-FR' },
      de: { name: '德语', nativeName: 'Deutsch', code: 'de-DE' },
      es: { name: '西班牙语', nativeName: 'Español', code: 'es-ES' },
      ru: { name: '俄语', nativeName: 'Русский', code: 'ru-RU' },
      pt: { name: '葡萄牙语', nativeName: 'Português', code: 'pt-PT' },
      it: { name: '意大利语', nativeName: 'Italiano', code: 'it-IT' },
      ar: { name: '阿拉伯语', nativeName: 'العربية', code: 'ar-SA' },
      hi: { name: '印地语', nativeName: 'हिन्दी', code: 'hi-IN' },
      th: { name: '泰语', nativeName: 'ไทย', code: 'th-TH' },
      vi: { name: '越南语', nativeName: 'Tiếng Việt', code: 'vi-VN' },
      id: { name: '印尼语', nativeName: 'Bahasa Indonesia', code: 'id-ID' }
    };

    this.prompts = {
      translate: `你是一个专业的翻译专家。请将以下文本从{sourceLanguage}翻译成{targetLanguage}。

要求：
1. 保持原文的意思和语气
2. 使用自然流畅的目标语言表达
3. 保留专有名词和术语
4. 如果原文是口语，翻译也应保持口语风格

原文：
{text}

请直接输出翻译结果，不要添加任何解释。`,

      summarize: `你是一个专业的内容总结专家。请对以下文本生成一个简洁的摘要。

要求：
1. 提取核心观点和关键信息
2. 保持客观中立
3. 摘要长度约为原文的20-30%
4. 使用{language}输出

原文：
{text}

请直接输出摘要，不要添加任何解释。`,

      translateAndSummarize: `你是一个专业的翻译和内容总结专家。请完成以下任务：

1. 将文本从{sourceLanguage}翻译成{targetLanguage}
2. 生成简洁的摘要

原文：
{text}

请按以下格式输出：
【翻译】
[翻译内容]

【摘要】
[摘要内容]`,

      detectLanguage: `请识别以下文本的语言，只需输出语言代码（如zh、en、ja等）：

{text}`,

      multiLanguageSummary: `你是一个专业的内容总结专家。请对以下文本生成多语言摘要。

原文语言：{sourceLanguage}
原文：
{text}

请生成以下语言的摘要：
{targetLanguages}

格式：
【语言名称】
[摘要内容]`
    };
  }

  async detectLanguage(text) {
    try {
      if (text.length < 10) {
        return { success: false, error: '文本太短，无法检测语言' };
      }

      const sampleText = text.slice(0, 500);

      const prompt = this.prompts.detectLanguage.replace('{text}', sampleText);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: this.config.defaultModel,
        temperature: 0.1,
        maxTokens: 10
      });

      const langCode = (result.content || result.choices?.[0]?.message?.content || '').trim().toLowerCase();

      const language = this.supportedLanguages[langCode] || {
        name: langCode.toUpperCase(),
        code: langCode
      };

      return {
        success: true,
        languageCode: langCode,
        languageName: language.name,
        nativeName: language.nativeName || language.name,
        confidence: 0.9
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async translate(text, options = {}) {
    const processId = this.generateId();

    try {
      const sourceLanguage = options.sourceLanguage || 'auto';
      const targetLanguage = options.targetLanguage || 'zh';

      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'translate', options);
      }

      logger.info('[Multilingual] 开始翻译', { processId, sourceLanguage, targetLanguage });

      let detectedLanguage = sourceLanguage;
      if (sourceLanguage === 'auto') {
        const detection = await this.detectLanguage(text);
        if (detection.success) {
          detectedLanguage = detection.languageCode;
        }
      }

      const sourceLangName = this.supportedLanguages[detectedLanguage]?.name || detectedLanguage;
      const targetLangName = this.supportedLanguages[targetLanguage]?.name || targetLanguage;

      const prompt = this.prompts.translate
        .replace('{sourceLanguage}', sourceLangName)
        .replace('{targetLanguage}', targetLangName)
        .replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: Math.ceil(text.length * 2)
      });

      const translatedText = result.content || result.choices?.[0]?.message?.content || text;

      this.addToHistory({
        id: processId,
        type: 'translate',
        sourceLanguage: detectedLanguage,
        targetLanguage,
        originalLength: text.length,
        resultLength: translatedText.length
      });

      return {
        success: true,
        processId,
        originalText: text,
        translatedText,
        sourceLanguage: detectedLanguage,
        targetLanguage
      };
    } catch (error) {
      logger.error('[Multilingual] 翻译失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async summarize(text, options = {}) {
    const processId = this.generateId();

    try {
      const language = options.language || 'zh';
      const maxLength = options.maxLength || Math.ceil(text.length * 0.3);

      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'summarize', options);
      }

      logger.info('[Multilingual] 开始生成摘要', { processId, language });

      const langName = this.supportedLanguages[language]?.name || language;

      const prompt = this.prompts.summarize
        .replace('{language}', langName)
        .replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: maxLength
      });

      const summary = result.content || result.choices?.[0]?.message?.content || '';

      this.addToHistory({
        id: processId,
        type: 'summarize',
        language,
        originalLength: text.length,
        summaryLength: summary.length
      });

      return {
        success: true,
        processId,
        originalText: text,
        summary,
        language,
        compressionRatio: Math.round((summary.length / text.length) * 100)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async translateAndSummarize(text, options = {}) {
    const processId = this.generateId();
    const startTime = Date.now();

    try {
      const sourceLanguage = options.sourceLanguage || 'auto';
      const targetLanguage = options.targetLanguage || 'zh';

      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'translateAndSummarize', options);
      }

      logger.info('[Multilingual] 开始翻译并摘要', { processId });

      let detectedLanguage = sourceLanguage;
      if (sourceLanguage === 'auto') {
        const detection = await this.detectLanguage(text);
        if (detection.success) {
          detectedLanguage = detection.languageCode;
        }
      }

      const sourceLangName = this.supportedLanguages[detectedLanguage]?.name || detectedLanguage;
      const targetLangName = this.supportedLanguages[targetLanguage]?.name || targetLanguage;

      const prompt = this.prompts.translateAndSummarize
        .replace('{sourceLanguage}', sourceLangName)
        .replace('{targetLanguage}', targetLangName)
        .replace('{text}', text);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: Math.ceil(text.length * 2)
      });

      const response = result.content || result.choices?.[0]?.message?.content || '';

      const translationMatch = response.match(/【翻译】\s*([\s\S]*?)(?=【摘要】|$)/);
      const summaryMatch = response.match(/【摘要】\s*([\s\S]*?)$/);

      const translatedText = translationMatch ? translationMatch[1].trim() : response;
      const summary = summaryMatch ? summaryMatch[1].trim() : '';

      const processingTime = Date.now() - startTime;

      this.addToHistory({
        id: processId,
        type: 'translateAndSummarize',
        sourceLanguage: detectedLanguage,
        targetLanguage,
        originalLength: text.length,
        processingTime
      });

      return {
        success: true,
        processId,
        originalText: text,
        translatedText,
        summary,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        processingTime
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async multiLanguageSummary(text, options = {}) {
    const processId = this.generateId();

    try {
      const sourceLanguage = options.sourceLanguage || 'auto';
      const targetLanguages = options.targetLanguages || ['zh', 'en', 'ja'];

      if (text.length > this.config.maxTextLength) {
        return this.processLongText(text, 'multiLanguageSummary', options);
      }

      logger.info('[Multilingual] 开始多语言摘要', { processId, targetLanguages });

      let detectedLanguage = sourceLanguage;
      if (sourceLanguage === 'auto') {
        const detection = await this.detectLanguage(text);
        if (detection.success) {
          detectedLanguage = detection.languageCode;
        }
      }

      const sourceLangName = this.supportedLanguages[detectedLanguage]?.name || detectedLanguage;
      const targetLangNames = targetLanguages.map(lang =>
        this.supportedLanguages[lang]?.name || lang
      ).join('、');

      const prompt = this.prompts.multiLanguageSummary
        .replace('{sourceLanguage}', sourceLangName)
        .replace('{text}', text)
        .replace('{targetLanguages}', targetLangNames);

      const result = await llmGateway.generate([
        { role: 'user', content: prompt }
      ], {
        model: options.model || this.config.defaultModel,
        temperature: 0.3,
        maxTokens: Math.ceil(text.length * targetLanguages.length)
      });

      const response = result.content || result.choices?.[0]?.message?.content || '';

      const summaries = {};
      targetLanguages.forEach(lang => {
        const langName = this.supportedLanguages[lang]?.name || lang;
        const regex = new RegExp(`【${langName}】\\s*([\\s\\S]*?)(?=【|$)`);
        const match = response.match(regex);
        if (match) {
          summaries[lang] = match[1].trim();
        }
      });

      this.addToHistory({
        id: processId,
        type: 'multiLanguageSummary',
        sourceLanguage: detectedLanguage,
        targetLanguages,
        originalLength: text.length
      });

      return {
        success: true,
        processId,
        originalText: text,
        summaries,
        sourceLanguage: detectedLanguage,
        targetLanguages
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async batchTranslate(items, options = {}) {
    const results = [];

    for (const item of items) {
      const result = await this.translate(item.text, {
        ...options,
        sourceLanguage: item.sourceLanguage,
        targetLanguage: item.targetLanguage
      });

      results.push({
        id: item.id,
        ...result
      });
    }

    return {
      total: items.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async processLongText(text, operation, options) {
    const chunks = this.splitText(text, this.config.maxTextLength * 0.8);
    const results = [];

    for (const chunk of chunks) {
      let result;
      switch (operation) {
        case 'translate':
          result = await this.translate(chunk, options);
          results.push(result.success ? result.translatedText : chunk);
          break;
        case 'summarize':
          result = await this.summarize(chunk, options);
          results.push(result.success ? result.summary : '');
          break;
        case 'translateAndSummarize':
          result = await this.translateAndSummarize(chunk, options);
          results.push(result);
          break;
        case 'multiLanguageSummary':
          result = await this.multiLanguageSummary(chunk, options);
          results.push(result);
          break;
        default:
          results.push(chunk);
      }
    }

    if (operation === 'translate') {
      return {
        success: true,
        chunked: true,
        chunkCount: chunks.length,
        translatedText: results.join('\n\n')
      };
    }

    return {
      success: true,
      chunked: true,
      chunkCount: chunks.length,
      results
    };
  }

  splitText(text, maxLength) {
    const chunks = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        if (paragraph.length > maxLength) {
          const sentences = paragraph.split(/([。！？.!?])/);
          currentChunk = '';
          for (let i = 0; i < sentences.length; i += 2) {
            const sentence = sentences[i] + (sentences[i + 1] || '');
            if (currentChunk.length + sentence.length > maxLength) {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  addToHistory(entry) {
    this.processingHistory.unshift(entry);

    if (this.processingHistory.length > this.maxHistorySize) {
      this.processingHistory = this.processingHistory.slice(0, this.maxHistorySize);
    }
  }

  getHistory(options = {}) {
    let history = [...this.processingHistory];

    if (options.type) {
      history = history.filter(h => h.type === options.type);
    }

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  getStats() {
    const total = this.processingHistory.length;

    const typeStats = {};
    this.processingHistory.forEach(h => {
      if (!typeStats[h.type]) {
        typeStats[h.type] = { count: 0 };
      }
      typeStats[h.type].count++;
    });

    const languageStats = {};
    this.processingHistory.forEach(h => {
      if (h.targetLanguage) {
        if (!languageStats[h.targetLanguage]) {
          languageStats[h.targetLanguage] = 0;
        }
        languageStats[h.targetLanguage]++;
      }
    });

    return {
      total,
      typeStats,
      languageStats
    };
  }

  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, info]) => ({
      code,
      ...info
    }));
  }

  generateId() {
    return `ml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return { ...this.config };
  }
}

const multilingualService = new MultilingualService();

module.exports = {
  MultilingualService,
  multilingualService
};
