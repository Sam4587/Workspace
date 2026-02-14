const multiAIService = require('./multiAIService');

class AIService {
  constructor() {
    this.defaultModel = process.env.DEFAULT_AI_MODEL || 'openai';
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
      console.error('AI生成失败:', error);
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
}

module.exports = new AIService;
