const multiAIService = require('./multiAIService');
const contentService = require('./ContentService');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.defaultModel = process.env.DEFAULT_AI_MODEL || 'openai';
    this.contentService = contentService;
  }

  async generateContent(formData, type, options = {}) {
    try {
      const prompt = this.buildPrompt(formData, type);
      
      const aiResponse = await multiAIService.generateContent(prompt, {
        model: options.model || this.defaultModel,
        maxTokens: this.getMaxTokens(type),
        temperature: 0.7
      });

      const content = aiResponse.content.trim();
      
      return {
        title: formData.title,
        content: content,
        type: type,
        wordCount: content.length,
        readingTime: Math.ceil(content.length / 400),
        quality: this.calculateQuality(content),
        suggestions: this.generateSuggestions(content, type),
        aiProvider: aiResponse.provider,
        aiModel: aiResponse.model,
        usage: aiResponse.usage
      };
    } catch (error) {
      logger.error('AI生成失败:', { error: error.message, formData, type });
      throw new Error('内容生成失败，请稍后重试');
    }
  }

  buildPrompt(formData, type) {
    const basePrompt = `基于热点话题"${formData.topic}"，生成一篇${this.getTypeName(type)}。\n\n`;
    
    const requirements = [
      `标题：${formData.title}`,
      `关键词：${formData.keywords || '无'}`,
      `目标受众：${formData.targetAudience || '普通用户'}`,
      `内容风格：${formData.tone || '专业'}`,
      `长度要求：${this.getLengthRequirement(type, formData.length)}`
    ];

    if (formData.includeData) requirements.push('要求包含相关数据支撑');
    if (formData.includeCase) requirements.push('要求包含实际案例');
    if (formData.includeExpert) requirements.push('要求包含专家观点');

    const typeSpecificPrompt = this.getTypeSpecificPrompt(type, formData);
    
    // 添加今日头条发文规范要求
    const guidelinesPrompt = this.getGuidelinesPrompt(type, formData);
    
    return basePrompt + requirements.join('\n') + '\n\n' + typeSpecificPrompt + '\n\n' + guidelinesPrompt;
  }

  getTypeName(type) {
    const typeNames = {
      'article': '长文章',
      'micro': '微头条',
      'video': '视频脚本',
      'audio': '音频脚本'
    };
    return typeNames[type] || '文章';
  }

  getLengthRequirement(type, length) {
    const requirements = {
      'article': {
        'short': '500-800字',
        'medium': '800-1500字',
        'long': '1500-3000字'
      },
      'micro': {
        'short': '100-200字',
        'medium': '200-300字',
        'long': '300-500字'
      },
      'video': {
        'short': '1-3分钟脚本',
        'medium': '3-5分钟脚本',
        'long': '5-10分钟脚本'
      },
      'audio': {
        'short': '2-5分钟脚本',
        'medium': '5-10分钟脚本',
        'long': '10-20分钟脚本'
      }
    };
    
    return requirements[type]?.[length] || '中等长度';
  }

  getTypeSpecificPrompt(type, formData) {
    const prompts = {
      'article': `请生成一篇结构完整的文章，包含：
1. 引人入胜的开头
2. 逻辑清晰的正文（分段论述）
3. 有力的结尾总结
4. 适当的小标题
5. 数据支撑和案例引用（如要求）`,

      'micro': `请生成一篇适合微头条的短文，要求：
1. 开头直接点明主题
2. 内容简洁有力
3. 结尾有互动引导
4. 适合快速阅读
5. 包含话题标签`,

      'video': `请生成一个视频脚本，包含：
1. 开场白（吸引观众）
2. 主要内容（分镜头描述）
3. 结尾总结
4. 画面描述和字幕提示
5. 时长控制在${this.getLengthRequirement('video', formData.length)}`,

      'audio': `请生成一个音频脚本，包含：
1. 开场问候
2. 主要内容（口语化表达）
3. 结尾总结
4. 语调和节奏提示
5. 时长控制在${this.getLengthRequirement('audio', formData.length)}`
    };
    
    return prompts[type] || prompts['article'];
  }

  // 添加今日头条发文规范提示
  getGuidelinesPrompt(type, formData) {
    return `请严格遵守今日头条发文规范：

1. 标题规范：
   - 长度控制在10-30字之间
   - 避免使用"最"、"第一"、"唯一"、"绝对"、"100%"等绝对化用语
   - 避免标题党，标题与内容需一致
   - 不使用敏感词汇和夸大表述

2. 内容规范：
   - 内容需原创，避免抄袭
   - 段落清晰，逻辑连贯
   - 数据需真实可靠，注明来源
   - 避免传播虚假信息
   - 不涉及敏感政治话题
   - 不宣扬暴力、色情内容
   - 不侵犯他人隐私

3. 质量要求：
   - 内容需有实质性信息
   - 表达清晰，语言规范
   - 结构合理，层次分明
   - 具有一定的社会价值

4. 特别要求：
   - 如果要求包含数据支撑，请确保数据真实可信
   - 如果要求包含实际案例，请提供具体案例
   - 如果要求包含专家观点，请引用权威专家意见

请确保生成的内容完全符合以上规范要求。`;
  }

  getMaxTokens(type) {
    const tokenLimits = {
      'article': 2000,
      'micro': 500,
      'video': 1500,
      'audio': 1500
    };
    return tokenLimits[type] || 1000;
  }

  calculateQuality(content) {
    let score = 70;
    
    if (content.length > 200) score += 10;
    if (content.includes('。') && content.split('。').length > 3) score += 5;
    if (content.includes('，') && content.split('，').length > 5) score += 5;
    if (content.includes('数据') || content.includes('研究')) score += 5;
    if (content.includes('案例') || content.includes('实例')) score += 5;
    
    return Math.min(100, score);
  }

  generateSuggestions(content, type) {
    const suggestions = [];
    
    if (content.length < 300) {
      suggestions.push('建议增加更多内容细节');
    }
    
    if (!content.includes('数据') && !content.includes('研究')) {
      suggestions.push('建议添加相关数据支撑');
    }
    
    if (!content.includes('案例') && !content.includes('实例')) {
      suggestions.push('建议添加实际案例');
    }
    
    if (type === 'article' && content.split('。').length < 5) {
      suggestions.push('建议增加段落数量，提升可读性');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('内容质量良好，可以直接发布');
    }
    
    return suggestions;
  }

  /**
   * 生成内容并保存到内容管理服务
   * @param {Object} formData - 表单数据
   * @param {string} type - 内容类型
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async generateAndSaveContent(formData, type, options = {}) {
    try {
      // 生成内容
      const generatedContent = await this.generateContent(formData, type, options);

      // 准备内容数据
      const contentData = {
        title: generatedContent.title,
        content: generatedContent.content,
        summary: generatedContent.title,
        excerpt: generatedContent.content.substring(0, 200),
        sourceType: options.sourceType || 'manual',
        sourceId: options.sourceId || null,
        sourceUrl: options.sourceUrl || '',
        platforms: options.platforms || [],
        generatedBy: 'ai',
        aiModel: generatedContent.aiModel,
        aiPrompt: this.buildPrompt(formData, type),
        generationParams: {
          temperature: 0.7,
          maxTokens: this.getMaxTokens(type)
        },
        category: options.category || 'default',
        tags: options.tags || [],
        metadata: {
          wordCount: generatedContent.wordCount,
          readingTime: generatedContent.readingTime,
          language: 'zh-CN',
          qualityScore: {
            score: generatedContent.quality,
            maxScore: 100,
            breakdown: {}
          }
        },
        status: options.autoApprove ? 'approved' : 'review'
      };

      // 保存到内容管理服务
      const result = await this.contentService.create(contentData, options.userId || 'system');

      if (!result.success) {
        throw new Error(`内容保存失败: ${result.error}`);
      }

      return {
        ...generatedContent,
        saved: true,
        contentId: result.content._id,
        content: result.content
      };

    } catch (error) {
      logger.error('生成并保存内容失败:', { error: error.message, formData, type });
      throw new Error(`生成并保存内容失败: ${error.message}`);
    }
  }

  /**
   * 批量生成内容
   * @param {Array} formDataList - 表单数据列表
   * @param {string} type - 内容类型
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async batchGenerateContent(formDataList, type, options = {}) {
    try {
      const results = [];
      const promises = formDataList.map(formData => 
        this.generateAndSaveContent(formData, type, options)
      );

      const settledResults = await Promise.allSettled(promises);

      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            index,
            success: true,
            data: result.value
          });
        } else {
          results.push({
            index,
            success: false,
            error: result.reason.message
          });
        }
      });

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: true,
        results,
        summary: {
          totalCount,
          successCount,
          failedCount: totalCount - successCount
        }
      };

    } catch (error) {
      logger.error('批量生成内容失败:', { error: error.message, count: formDataList.length });
      throw new Error(`批量生成内容失败: ${error.message}`);
    }
  }

  /**
   * 分析视频转录内容
   * @param {string} transcript - 视频转录文本
   * @returns {Promise<Object>}
   */
  async analyzeVideoContent(transcript) {
    try {
      const prompt = `请分析以下视频转录内容，并提取关键信息：
      
转录内容：
${transcript}

请返回以下信息：
- 总结：简洁概括视频主要内容
- 关键点：列出3-5个核心观点
- 适合平台：推荐适合发布到哪些平台（小红书、抖音、今日头条等）
- 目标受众：描述适合的观众群体
- 关键词：提取5-10个关键词
- 情感倾向：正面、负面或中性
- 内容类型：教育、娱乐、新闻、科普等

请以JSON格式返回结果。`;

      const aiResponse = await multiAIService.generateContent(prompt, {
        model: this.defaultModel,
        maxTokens: 1000,
        temperature: 0.5
      });

      // 尝试解析JSON响应
      let analysis;
      try {
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // 如果AI没有返回有效JSON，手动解析
          analysis = this.parseAnalysisResponse(aiResponse.content);
        }
      } catch {
        analysis = this.parseAnalysisResponse(aiResponse.content);
      }

      return analysis;
    } catch (error) {
      logger.error('视频内容分析失败:', { error: error.message });
      throw new Error('视频内容分析失败');
    }
  }

  /**
   * 生成视频内容
   * @param {Object} analysis - 视频分析结果
   * @returns {Promise<Object>}
   */
  async generateVideoContent(analysis) {
    try {
      const prompt = `基于以下视频分析结果，生成适合多平台发布的文本内容：

视频分析：
- 总结：${analysis.summary || ''}
- 关键点：${Array.isArray(analysis.keyPoints) ? analysis.keyPoints.join(', ') : ''}
- 适合平台：${Array.isArray(analysis.suitablePlatforms) ? analysis.suitablePlatforms.join(', ') : ''}
- 目标受众：${analysis.targetAudience || ''}
- 关键词：${Array.isArray(analysis.keywords) ? analysis.keywords.join(', ') : ''}
- 情感倾向：${analysis.sentiment || ''}
- 内容类型：${analysis.contentType || ''}

请生成适合发布的内容，包括：
1. 适合不同平台的标题变体
2. 核心内容文本
3. 推荐的标签/话题
4. 发布建议

请以JSON格式返回，包含：
- title: 主标题
- content: 核心内容
- platformVariants: 不同平台的内容变体数组
- tags: 推荐标签数组
- publishingTips: 发布建议

格式：
{
  "title": "主标题",
  "content": "核心内容文本",
  "platformVariants": [
    {
      "platform": "平台名称",
      "title": "平台特定标题", 
      "content": "平台特定内容",
      "tags": ["标签1", "标签2"]
    }
  ],
  "tags": ["通用标签"],
  "publishingTips": "发布建议文本"
}`;

      const aiResponse = await multiAIService.generateContent(prompt, {
        model: this.defaultModel,
        maxTokens: 2000,
        temperature: 0.7
      });

      // 解析JSON响应
      let content;
      try {
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI未返回有效的JSON格式');
        }
      } catch {
        throw new Error('AI返回格式不正确，无法解析');
      }

      return content;

    } catch (error) {
      logger.error('视频内容生成失败:', { error: error.message });
      throw new Error('视频内容生成失败');
    }
  }

  /**
   * 解析分析响应
   * @param {string} response - AI响应
   * @returns {Object}
   */
  parseAnalysisResponse(response) {
    const analysis = {};
    
    // 简单解析响应内容
    const lines = response.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.includes('总结：') || line.includes('总结:')) {
        analysis.summary = line.replace(/^[^：:]*[：:]/, '').trim();
      } else if (line.includes('关键点：') || line.includes('关键点:')) {
        const points = line.replace(/^[^：:]*[：:]/, '').trim();
        analysis.keyPoints = points.split(/[，,、]/).map(p => p.trim()).filter(p => p);
      } else if (line.includes('适合平台：') || line.includes('适合平台:')) {
        const platforms = line.replace(/^[^：:]*[：:]/, '').trim();
        analysis.suitablePlatforms = platforms.split(/[，,、]/).map(p => p.trim()).filter(p => p);
      } else if (line.includes('目标受众：') || line.includes('目标受众:')) {
        analysis.targetAudience = line.replace(/^[^：:]*[：:]/, '').trim();
      } else if (line.includes('关键词：') || line.includes('关键词:')) {
        const keywords = line.replace(/^[^：:]*[：:]/, '').trim();
        analysis.keywords = keywords.split(/[，,、]/).map(k => k.trim()).filter(k => k);
      } else if (line.includes('情感倾向：') || line.includes('情感倾向:')) {
        analysis.sentiment = line.replace(/^[^：:]*[：:]/, '').trim();
      } else if (line.includes('内容类型：') || line.includes('内容类型:')) {
        analysis.contentType = line.replace(/^[^：:]*[：:]/, '').trim();
      }
    }

    return analysis;
  }
}

module.exports = new AIService;
