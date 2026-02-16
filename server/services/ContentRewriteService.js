/**
 * 内容改写服务
 * 根据不同平台风格改写视频内容
 */

const logger = require('../../utils/logger');
const { liteLLMAdapter } = require('../../ai');
const prompts = require('../prompts/videoAnalysis');

class ContentRewriteService {
  constructor() {
    this.adapter = liteLLMAdapter;

    // 平台配置
    this.platformConfigs = {
      xiaohongshu: {
        name: '小红书',
        maxTitle: 20,
        maxContent: 1000,
        style: 'emoji',
        promptTemplate: prompts.XIAOHONGSHU_REWRITE
      },
      douyin: {
        name: '抖音',
        maxTitle: 30,
        maxContent: 2000,
        style: 'casual',
        promptTemplate: prompts.DOUYIN_SCRIPT
      },
      toutiao: {
        name: '今日头条',
        maxTitle: 30,
        maxContent: 2000,
        style: 'professional',
        promptTemplate: prompts.TOUTIAO_ARTICLE
      }
    };
  }

  /**
   * 改写内容
   * @param {string} summary - 内容摘要
   * @param {string} platform - 目标平台
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async rewrite(summary, platform, options = {}) {
    try {
      const config = this.platformConfigs[platform];
      if (!config) {
        return {
          success: false,
          error: `不支持的平台: ${platform}`
        };
      }

      logger.info('[ContentRewriteService] 开始改写内容', { platform });

      const prompt = config.promptTemplate.replace('{summary}', summary);
      const response = await this.generateContent(prompt, options);
      const result = this.parseJSONResponse(response);

      // 验证和截断内容
      const validatedResult = this.validateAndTruncate(result, config);

      logger.info('[ContentRewriteService] 改写完成', { platform });

      return {
        success: true,
        platform,
        platformName: config.name,
        ...validatedResult
      };
    } catch (error) {
      logger.error('[ContentRewriteService] 改写失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量改写（多平台）
   * @param {string} summary - 内容摘要
   * @param {string[]} platforms - 目标平台列表
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async rewriteMulti(summary, platforms = ['xiaohongshu', 'douyin', 'toutiao'], options = {}) {
    try {
      logger.info('[ContentRewriteService] 开始批量改写', { platforms });

      // 使用批量生成 Prompt
      const prompt = prompts.MULTI_PLATFORM.replace('{summary}', summary);
      const response = await this.generateContent(prompt, options);
      const result = this.parseJSONResponse(response);

      // 验证和截断每个平台的内容
      const validatedResults = {};
      for (const platform of platforms) {
        if (result[platform]) {
          const config = this.platformConfigs[platform];
          validatedResults[platform] = {
            platform,
            platformName: config?.name || platform,
            ...this.validateAndTruncate(result[platform], config)
          };
        }
      }

      logger.info('[ContentRewriteService] 批量改写完成');

      return {
        success: true,
        results: validatedResults
      };
    } catch (error) {
      logger.error('[ContentRewriteService] 批量改写失败', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 改写为小红书风格
   * @param {string} summary - 内容摘要
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async rewriteForXiaohongshu(summary, options = {}) {
    return this.rewrite(summary, 'xiaohongshu', options);
  }

  /**
   * 改写为抖音风格
   * @param {string} summary - 内容摘要
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async rewriteForDouyin(summary, options = {}) {
    return this.rewrite(summary, 'douyin', options);
  }

  /**
   * 改写为今日头条风格
   * @param {string} summary - 内容摘要
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async rewriteForToutiao(summary, options = {}) {
    return this.rewrite(summary, 'toutiao', options);
  }

  /**
   * 验证并截断内容
   * @param {Object} result - 改写结果
   * @param {Object} config - 平台配置
   * @returns {Object}
   */
  validateAndTruncate(result, config) {
    if (!config) {
      return result;
    }

    const validated = { ...result };

    // 截断标题
    if (validated.title && config.maxTitle) {
      if (validated.title.length > config.maxTitle) {
        validated.title = validated.title.slice(0, config.maxTitle - 3) + '...';
      }
    }

    // 截断正文
    if (validated.content && config.maxContent) {
      if (validated.content.length > config.maxContent) {
        validated.content = validated.content.slice(0, config.maxContent - 3) + '...';
      }
    }

    // 抖音脚本特殊处理
    if (validated.mainContent && config.maxContent) {
      if (validated.mainContent.length > config.maxContent) {
        validated.mainContent = validated.mainContent.slice(0, config.maxContent - 3) + '...';
      }
    }

    return validated;
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
        temperature: options.temperature || 0.8,
        max_tokens: options.maxTokens || 3000
      });

      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      logger.error('[ContentRewriteService] AI 生成失败', { error: error.message });
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
      return JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // 忽略错误
        }
      }
      return {};
    }
  }

  /**
   * 获取支持的平台列表
   * @returns {Object[]}
   */
  getSupportedPlatforms() {
    return Object.entries(this.platformConfigs).map(([id, config]) => ({
      id,
      name: config.name,
      maxTitle: config.maxTitle,
      maxContent: config.maxContent,
      style: config.style
    }));
  }
}

module.exports = new ContentRewriteService();
