/**
 * 视频内容分析服务
 * 基于 LiteLLM 对视频转录内容进行分析和总结
 */

const { logger } = require('../../utils/logger');
const { liteLLMAdapter } = require('../../ai');
const prompts = require('../prompts/videoAnalysis');

class VideoAnalysisService {
  constructor() {
    this.adapter = liteLLMAdapter;
  }

  /**
   * 分析视频内容
   * @param {string} transcript - 转录文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async analyze(transcript, options = {}) {
    try {
      logger.info('[VideoAnalysisService] 开始分析视频内容', {
        textLength: transcript.length
      });

      const prompt = prompts.SUMMARY_PROMPT.replace('{transcript}', transcript);
      const response = await this.generateContent(prompt, options);

      const result = this.parseJSONResponse(response);

      logger.info('[VideoAnalysisService] 分析完成');
      return {
        success: true,
        ...result
      };
    } catch (error) {
      logger.error('[VideoAnalysisService] 分析失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 提取关键词
   * @param {string} transcript - 转录文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async extractKeywords(transcript, options = {}) {
    try {
      const prompt = prompts.KEYWORD_EXTRACTION.replace('{transcript}', transcript);
      const response = await this.generateContent(prompt, options);
      const result = this.parseJSONResponse(response);

      return {
        success: true,
        keywords: result.keywords || []
      };
    } catch (error) {
      logger.error('[VideoAnalysisService] 提取关键词失败', { error: error.message });
      return {
        success: false,
        keywords: [],
        error: error.message
      };
    }
  }

  /**
   * 内容分类
   * @param {string} transcript - 转录文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async classify(transcript, options = {}) {
    try {
      const prompt = prompts.CONTENT_CLASSIFICATION.replace('{transcript}', transcript);
      const response = await this.generateContent(prompt, options);
      const result = this.parseJSONResponse(response);

      return {
        success: true,
        category: result.category,
        confidence: result.confidence
      };
    } catch (error) {
      logger.error('[VideoAnalysisService] 分类失败', { error: error.message });
      return {
        success: false,
        category: '其他',
        error: error.message
      };
    }
  }

  /**
   * 情感分析
   * @param {string} transcript - 转录文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async analyzeSentiment(transcript, options = {}) {
    try {
      const prompt = prompts.SENTIMENT_ANALYSIS.replace('{transcript}', transcript);
      const response = await this.generateContent(prompt, options);
      const result = this.parseJSONResponse(response);

      return {
        success: true,
        sentiment: result.sentiment,
        emotion: result.emotion,
        intensity: result.intensity
      };
    } catch (error) {
      logger.error('[VideoAnalysisService] 情感分析失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 质量评估
   * @param {string} transcript - 转录文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async assessQuality(transcript, options = {}) {
    try {
      const prompt = prompts.QUALITY_ASSESSMENT.replace('{transcript}', transcript);
      const response = await this.generateContent(prompt, options);
      const result = this.parseJSONResponse(response);

      return {
        success: true,
        scores: result.scores,
        overallScore: result.overallScore,
        recommendation: result.recommendation
      };
    } catch (error) {
      logger.error('[VideoAnalysisService] 质量评估失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 完整分析（综合所有分析维度）
   * @param {string} transcript - 转录文本
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async fullAnalysis(transcript, options = {}) {
    try {
      logger.info('[VideoAnalysisService] 开始完整分析');

      // 并行执行所有分析
      const [analysis, keywords, classification, sentiment, quality] = await Promise.all([
        this.analyze(transcript, options),
        this.extractKeywords(transcript, options),
        this.classify(transcript, options),
        this.analyzeSentiment(transcript, options),
        this.assessQuality(transcript, options)
      ]);

      return {
        success: true,
        summary: analysis.summary || '',
        keyPoints: analysis.keyPoints || [],
        quotes: analysis.quotes || [],
        keywords: keywords.keywords || [],
        category: classification.category,
        categoryConfidence: classification.confidence,
        sentiment: sentiment.sentiment,
        emotion: sentiment.emotion,
        qualityScore: quality.overallScore,
        recommendation: quality.recommendation
      };
    } catch (error) {
      logger.error('[VideoAnalysisService] 完整分析失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成内容
   * @param {string} prompt - 提示词
   * @param {Object} options - 选项
   * @returns {Promise<string>}
   */
  async generateContent(prompt, options = {}) {
    try {
      if (!this.adapter) {
        throw new Error('LiteLLM 适配器未初始化');
      }

      const response = await this.adapter.chat({
        messages: [{ role: 'user', content: prompt }],
        model: options.model,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      });

      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      logger.error('[VideoAnalysisService] AI 生成失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 解析 JSON 响应
   * @param {string} response - AI 响应
   * @returns {Object}
   */
  parseJSONResponse(response) {
    try {
      // 尝试直接解析
      return JSON.parse(response);
    } catch {
      // 尝试提取 JSON 块
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // 忽略错误，返回空对象
        }
      }
      return {};
    }
  }
}

module.exports = new VideoAnalysisService();
