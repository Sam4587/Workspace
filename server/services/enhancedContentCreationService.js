/**
 * 增强版AI内容创作服务
 * 提供智能写作、多模板支持、高级内容优化等功能
 */

const logger = require('../utils/logger');
const aiService = require('./aiService');
const contentService = require('./ContentService');
const multiAIService = require('./multiAIService');
const { calculateReadingTime, sanitizeHtml } = require('../utils/helpers');

class EnhancedContentCreationService {
  constructor() {
    this.templates = this.loadTemplates();
    this.writingStyles = this.loadWritingStyles();
    this.contentOptimizers = this.loadOptimizers();
  }

  /**
   * 加载内容模板
   */
  loadTemplates() {
    return {
      // 新闻报道模板
      news_report: {
        name: '新闻报道',
        structure: ['标题', '导语', '主体', '结尾'],
        sections: {
          title: {
            prompt: '生成吸引人的新闻标题，包含关键信息和数字',
            examples: ['震惊！某公司年度营收突破10亿大关', '最新研究揭示：90%的人不知道的健康秘密']
          },
          lead: {
            prompt: '撰写简洁有力的导语，概括核心信息',
            examples: ['据最新数据显示...', '近日，一项重要研究发现...']
          },
          body: {
            prompt: '详细展开报道内容，包含事实、数据、引用',
            examples: ['专家表示...', '相关数据显示...', '业内人士分析...']
          },
          conclusion: {
            prompt: '总结要点，展望未来或提出思考',
            examples: ['总的来说...', '这一现象值得我们深思...', '未来发展趋势值得关注...']
          }
        }
      },

      // 深度分析模板
      deep_analysis: {
        name: '深度分析',
        structure: ['引言', '背景分析', '核心论述', '案例佐证', '总结展望'],
        sections: {
          introduction: {
            prompt: '引入话题，说明分析的重要性和必要性',
            examples: ['在当今...', '随着...', '近年来...']
          },
          background: {
            prompt: '提供必要的背景信息和现状描述',
            examples: ['首先让我们了解一下...', '要理解这个问题...']
          },
          core_argument: {
            prompt: '提出核心观点，进行深入分析',
            examples: ['笔者认为...', '通过分析可以看出...', '关键在于...']
          },
          case_studies: {
            prompt: '提供具体案例或数据支撑观点',
            examples: ['以...为例...', '数据显示...', '实际案例如...']
          },
          conclusion: {
            prompt: '总结全文，提出建设性意见',
            examples: ['综上所述...', '因此建议...', '展望未来...']
          }
        }
      },

      // 产品评测模板
      product_review: {
        name: '产品评测',
        structure: ['开箱体验', '外观设计', '功能特点', '使用体验', '优缺点分析', '购买建议'],
        sections: {
          unboxing: {
            prompt: '描述开箱第一印象和包装情况',
            examples: ['今天收到了...', '包装很精美...', '第一眼看到...']
          },
          design: {
            prompt: '评价产品的外观设计和工艺',
            examples: ['外观方面...', '设计风格...', '做工质感...']
          },
          features: {
            prompt: '详细介绍产品的主要功能和特色',
            examples: ['核心功能包括...', '值得一提的是...', '最吸引人的是...']
          },
          experience: {
            prompt: '分享实际使用感受和体验',
            examples: ['使用下来...', '个人感受...', '操作体验...']
          },
          pros_cons: {
            prompt: '客观分析产品的优缺点',
            examples: ['优点：...', '不足之处：...', '性价比方面...']
          },
          recommendation: {
            prompt: '给出购买建议和适用人群',
            examples: ['适合...', '推荐指数...', '购买时机...']
          }
        }
      },

      // 教程指南模板
      tutorial_guide: {
        name: '教程指南',
        structure: ['前言', '准备工作', '步骤详解', '注意事项', '常见问题', '总结'],
        sections: {
          introduction: {
            prompt: '说明教程目的和适用对象',
            examples: ['本文将教你...', '适合新手...', '零基础也能学会...']
          },
          prerequisites: {
            prompt: '列出学习前的准备工作和要求',
            examples: ['需要准备...', '前置知识...', '环境要求...']
          },
          step_by_step: {
            prompt: '详细分步骤讲解操作过程',
            examples: ['第一步...', '接下来...', '然后...']
          },
          tips: {
            prompt: '提供重要的提示和注意事项',
            examples: ['特别注意...', '容易出错的地方...', '小贴士...']
          },
          faq: {
            prompt: '解答常见疑问和问题',
            examples: ['Q: ... A: ...', '经常有人问...', '需要注意的是...']
          },
          summary: {
            prompt: '总结要点，鼓励实践',
            examples: ['掌握以上...', '多加练习...', '熟能生巧...']
          }
        }
      },

      // 观点评论模板
      opinion_commentary: {
        name: '观点评论',
        structure: ['事件回顾', '个人观点', '论证分析', '社会意义', '呼吁倡议'],
        sections: {
          event_review: {
            prompt: '简述事件背景和发展过程',
            examples: ['近日...', '这件事...', '引起热议...']
          },
          personal_view: {
            prompt: '明确表达自己的观点和立场',
            examples: ['我认为...', '个人看法...', '我的观点是...']
          },
          argumentation: {
            prompt: '运用论据支撑观点，进行理性分析',
            examples: ['理由如下...', '从...角度来看...', '证据显示...']
          },
          social_impact: {
            prompt: '分析事件的社会影响和深层含义',
            examples: ['这一现象反映了...', '背后的原因...', '带来的启示...']
          },
          call_to_action: {
            prompt: '发出倡议或提出建设性建议',
            examples: ['希望...', '建议...', '我们应该...']
          }
        }
      }
    };
  }

  /**
   * 加载写作风格
   */
  loadWritingStyles() {
    return {
      professional: {
        name: '专业严谨',
        characteristics: ['用词准确', '逻辑清晰', '数据支撑', '客观中立'],
        tone: '正式、权威、可信'
      },
      conversational: {
        name: '轻松对话',
        characteristics: ['口语化表达', '亲切自然', '互动性强', '易于理解'],
        tone: '友好、平易近人、生动'
      },
      inspirational: {
        name: '激励鼓舞',
        characteristics: ['正能量', '鼓舞人心', '富有激情', '积极向上'],
        tone: '振奋、励志、充满希望'
      },
      humorous: {
        name: '幽默风趣',
        characteristics: ['轻松诙谐', '妙语连珠', '寓教于乐', '趣味性强'],
        tone: '有趣、活泼、引人发笑'
      },
      storytelling: {
        name: '故事叙述',
        characteristics: ['情节生动', '人物鲜明', '情感丰富', '引人入胜'],
        tone: '生动、感人、有代入感'
      }
    };
  }

  /**
   * 加载内容优化器
   */
  loadOptimizers() {
    return {
      seo_optimizer: {
        name: 'SEO优化',
        functions: ['关键词密度优化', '标题优化', '描述优化', '内部链接建议']
      },
      readability_enhancer: {
        name: '可读性提升',
        functions: ['句子结构调整', '词汇简化', '段落重组', '逻辑优化']
      },
      engagement_booster: {
        name: '互动性增强',
        functions: ['提问引导', '情感共鸣', '行动号召', '悬念设置']
      },
      fact_checker: {
        name: '事实核查',
        functions: ['数据验证', '引用核实', '逻辑检验', '偏见识别']
      }
    };
  }

  /**
   * 智能内容生成主函数
   */
  async generateSmartContent(formData, options = {}) {
    const {
      template = 'news_report',
      style = 'professional',
      targetPlatform = 'toutiao',
      optimizeFor = ['seo', 'readability'],
      includeAnalytics = true
    } = options;

    try {
      logger.info('[EnhancedContent] 开始智能内容生成', { 
        template, 
        style, 
        targetPlatform 
      });

      // 1. 选择合适的模板
      const selectedTemplate = this.templates[template];
      if (!selectedTemplate) {
        throw new Error(`不支持的模板类型: ${template}`);
      }

      // 2. 应用写作风格
      const writingStyle = this.writingStyles[style];
      if (!writingStyle) {
        throw new Error(`不支持的写作风格: ${style}`);
      }

      // 3. 分段生成内容
      const contentSections = await this.generateContentSections(
        formData, 
        selectedTemplate, 
        writingStyle,
        targetPlatform
      );

      // 4. 组装完整内容
      const assembledContent = this.assembleContent(contentSections, selectedTemplate);

      // 5. 应用优化器
      const optimizedContent = await this.applyOptimizers(
        assembledContent, 
        optimizeFor,
        formData
      );

      // 6. 生成元数据和分析
      const metadata = await this.generateMetadata(
        optimizedContent, 
        formData, 
        targetPlatform,
        includeAnalytics
      );

      // 7. 保存到内容管理系统
      const savedContent = await this.saveContent(
        optimizedContent, 
        metadata, 
        formData,
        options
      );

      const result = {
        ...savedContent,
        template: selectedTemplate.name,
        style: writingStyle.name,
        optimizations: optimizeFor,
        analytics: metadata.analytics,
        wordCount: optimizedContent.content.length,
        readingTime: calculateReadingTime(optimizedContent.content)
      };

      logger.info('[EnhancedContent] 智能内容生成完成', { 
        contentId: result._id,
        wordCount: result.wordCount
      });

      return result;
    } catch (error) {
      logger.error('[EnhancedContent] 智能内容生成失败', { 
        error: error.message,
        formData,
        options
      });
      throw error;
    }
  }

  /**
   * 分段生成内容
   */
  async generateContentSections(formData, template, style, platform) {
    const sections = {};
    
    for (const [sectionKey, sectionConfig] of Object.entries(template.sections)) {
      try {
        const sectionPrompt = this.buildSectionPrompt(
          formData, 
          sectionConfig, 
          style, 
          platform
        );
        
        const aiResponse = await multiAIService.generateContent(sectionPrompt, {
          temperature: 0.7,
          maxTokens: 800
        });
        
        sections[sectionKey] = aiResponse.content.trim();
        
        logger.debug(`[EnhancedContent] 生成段落完成: ${sectionKey}`);
      } catch (error) {
        logger.warn(`[EnhancedContent] 段落生成失败: ${sectionKey}`, { 
          error: error.message 
        });
        // 使用备用内容
        sections[sectionKey] = `关于${formData.topic}的${sectionConfig.prompt}内容...`;
      }
    }
    
    return sections;
  }

  /**
   * 构建段落提示词
   */
  buildSectionPrompt(formData, sectionConfig, style, platform) {
    const basePrompt = `你是一位专业的${style.name}写作者，请为"${formData.topic}"这个话题撰写一段内容。\n\n`;

    const requirements = [
      `写作风格: ${style.tone}`,
      `目标平台: ${this.getPlatformName(platform)}`,
      `内容要求: ${sectionConfig.prompt}`,
      `字数要求: 200-400字`
    ];

    if (formData.keywords) {
      requirements.push(`关键词: ${formData.keywords.join(', ')}`);
    }

    if (formData.targetAudience) {
      requirements.push(`目标读者: ${formData.targetAudience}`);
    }

    return basePrompt + requirements.join('\n') + '\n\n请严格按照要求生成高质量内容:';
  }

  /**
   * 组装完整内容
   */
  assembleContent(sections, template) {
    const contentParts = [];
    
    // 按模板结构顺序组装
    for (const sectionName of template.structure) {
      const sectionKey = this.getSectionKey(sectionName);
      if (sections[sectionKey]) {
        contentParts.push(sections[sectionKey]);
      }
    }
    
    const fullContent = contentParts.join('\n\n');
    
    return {
      title: sections.title || sections.introduction || '自动生成的标题',
      content: fullContent,
      excerpt: fullContent.substring(0, 200) + '...'
    };
  }

  /**
   * 应用内容优化器
   */
  async applyOptimizers(content, optimizers, formData) {
    let optimizedContent = { ...content };
    
    for (const optimizerKey of optimizers) {
      try {
        switch (optimizerKey) {
          case 'seo':
            optimizedContent = await this.optimizeForSEO(optimizedContent, formData);
            break;
          case 'readability':
            optimizedContent = await this.enhanceReadability(optimizedContent);
            break;
          case 'engagement':
            optimizedContent = await this.boostEngagement(optimizedContent);
            break;
          case 'fact_check':
            optimizedContent = await this.factCheck(optimizedContent);
            break;
        }
      } catch (error) {
        logger.warn(`[EnhancedContent] 优化器应用失败: ${optimizerKey}`, { 
          error: error.message 
        });
      }
    }
    
    return optimizedContent;
  }

  /**
   * SEO优化
   */
  async optimizeForSEO(content, formData) {
    // 关键词密度优化
    const keywords = formData.keywords || [];
    let optimizedContent = content.content;
    
    // 确保关键词合理分布
    keywords.forEach(keyword => {
      const occurrences = (optimizedContent.match(new RegExp(keyword, 'gi')) || []).length;
      const density = (occurrences / optimizedContent.length) * 100;
      
      if (density < 1 && optimizedContent.length > 500) {
        // 在合适位置插入关键词
        optimizedContent = optimizedContent.replace(
          /(。|\n)/, 
          `$1${keyword}`
        );
      }
    });
    
    // 优化标题
    const optimizedTitle = this.optimizeTitle(content.title, keywords);
    
    return {
      ...content,
      title: optimizedTitle,
      content: optimizedContent
    };
  }

  /**
   * 可读性提升
   */
  async enhanceReadability(content) {
    let enhancedContent = content.content;
    
    // 简化复杂句子
    enhancedContent = enhancedContent.replace(
      /([^。！？]{50,}?[。！？])/g,
      (match) => {
        if (match.length > 80) {
          return match.replace(/，/g, '。\n');
        }
        return match;
      }
    );
    
    // 添加过渡词
    const transitionWords = ['首先', '其次', '此外', '最后', '总之'];
    enhancedContent = enhancedContent.replace(
      /(。)([^。]{20,}?)(。)/g,
      `$1${transitionWords[Math.floor(Math.random() * transitionWords.length)]}$2$3`
    );
    
    return {
      ...content,
      content: enhancedContent
    };
  }

  /**
   * 互动性增强
   */
  async boostEngagement(content) {
    let enhancedContent = content.content;
    
    // 添加提问
    const questions = [
      '你觉得呢？',
      '你怎么看？',
      '有什么想法？',
      '欢迎留言讨论'
    ];
    
    // 在适当位置插入互动元素
    enhancedContent = enhancedContent.replace(
      /(。)([^。]{30,}?)(。)/,
      `$1$2$3\n\n${questions[Math.floor(Math.random() * questions.length)]}👇`
    );
    
    return {
      ...content,
      content: enhancedContent
    };
  }

  /**
   * 事实核查
   */
  async factCheck(content) {
    // 简单的事实核查逻辑
    const suspiciousClaims = [
      /\d+%的人说/,
      /研究表明/,
      /专家认为/,
      /最新发现/
    ];
    
    let checkedContent = content.content;
    
    suspiciousClaims.forEach(pattern => {
      checkedContent = checkedContent.replace(
        pattern,
        match => `【待核实】${match}`
      );
    });
    
    return {
      ...content,
      content: checkedContent,
      factCheckNotes: '部分内容需要进一步核实'
    };
  }

  /**
   * 生成元数据
   */
  async generateMetadata(content, formData, platform, includeAnalytics) {
    const metadata = {
      platform: platform,
      category: formData.category || 'default',
      tags: formData.keywords || [],
      wordCount: content.content.length,
      readingTime: calculateReadingTime(content.content),
      language: 'zh-CN'
    };

    if (includeAnalytics) {
      metadata.analytics = {
        predictedEngagement: this.predictEngagement(content, formData),
        seoScore: this.calculateSEOScore(content, formData),
        readabilityScore: this.calculateReadabilityScore(content.content),
        contentQuality: this.assessContentQuality(content)
      };
    }

    return metadata;
  }

  /**
   * 保存内容
   */
  async saveContent(content, metadata, formData, options) {
    const contentData = {
      title: content.title,
      content: sanitizeHtml(content.content),
      summary: content.excerpt,
      sourceType: options.sourceType || 'ai_generated',
      sourceId: options.sourceId || null,
      platforms: [metadata.platform],
      generatedBy: 'enhanced_ai',
      category: metadata.category,
      tags: metadata.tags,
      metadata: {
        ...metadata,
        aiModel: 'enhanced_content_creator',
        generationParams: {
          template: options.template,
          style: options.style,
          optimizations: options.optimizeFor
        }
      },
      status: options.autoApprove ? 'approved' : 'review'
    };

    const result = await contentService.create(contentData, options.userId || 'system');
    
    if (!result.success) {
      throw new Error(`内容保存失败: ${result.error}`);
    }

    return result.content;
  }

  /**
   * 辅助方法
   */
  
  getSectionKey(sectionName) {
    const keyMap = {
      '标题': 'title',
      '导语': 'lead',
      '主体': 'body',
      '结尾': 'conclusion',
      '引言': 'introduction',
      '背景分析': 'background',
      '核心论述': 'core_argument',
      '案例佐证': 'case_studies',
      '总结展望': 'conclusion',
      '开箱体验': 'unboxing',
      '外观设计': 'design',
      '功能特点': 'features',
      '使用体验': 'experience',
      '优缺点分析': 'pros_cons',
      '购买建议': 'recommendation',
      '前言': 'introduction',
      '准备工作': 'prerequisites',
      '步骤详解': 'step_by_step',
      '注意事项': 'tips',
      '常见问题': 'faq',
      '总结': 'summary',
      '事件回顾': 'event_review',
      '个人观点': 'personal_view',
      '论证分析': 'argumentation',
      '社会意义': 'social_impact',
      '呼吁倡议': 'call_to_action'
    };
    
    return keyMap[sectionName] || sectionName.toLowerCase();
  }

  getPlatformName(platform) {
    const platformNames = {
      'toutiao': '今日头条',
      'weibo': '微博',
      'zhihu': '知乎',
      'xiaohongshu': '小红书',
      'douyin': '抖音'
    };
    return platformNames[platform] || platform;
  }

  optimizeTitle(title, keywords) {
    // 确保标题包含关键词且吸引人
    let optimizedTitle = title;
    
    if (keywords.length > 0 && !keywords.some(kw => title.includes(kw))) {
      optimizedTitle = `${keywords[0]}：${title}`;
    }
    
    // 保持标题长度适中
    if (optimizedTitle.length > 30) {
      optimizedTitle = optimizedTitle.substring(0, 27) + '...';
    }
    
    return optimizedTitle;
  }

  predictEngagement(content, formData) {
    // 简单的参与度预测算法
    const factors = {
      titleLength: content.title.length > 15 && content.title.length < 25 ? 1 : 0.5,
      keywordCount: formData.keywords ? Math.min(formData.keywords.length / 5, 1) : 0.3,
      contentLength: content.content.length > 500 ? 1 : 0.7,
      questionMarks: (content.content.match(/[\?？]/g) || []).length > 0 ? 1 : 0.8
    };
    
    const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / Object.keys(factors).length;
    return Math.round(score * 100);
  }

  calculateSEOScore(content, formData) {
    const keywords = formData.keywords || [];
    const contentText = content.content.toLowerCase();
    
    let score = 0;
    
    // 关键词出现次数
    keywords.forEach(keyword => {
      const count = (contentText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      score += Math.min(count * 10, 30);
    });
    
    // 标题优化
    if (content.title.length >= 15 && content.title.length <= 60) score += 20;
    
    // 内容长度
    if (content.content.length > 300) score += 30;
    
    return Math.min(Math.round(score), 100);
  }

  calculateReadabilityScore(content) {
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
    const words = content.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const score = Math.max(0, 100 - (avgSentenceLength - 15) * 2);
    
    return Math.round(score);
  }

  assessContentQuality(content) {
    const assessments = {
      completeness: content.content.length > 200 ? 1 : 0.5,
      structure: content.content.includes('\n\n') ? 1 : 0.7,
      engagement: (content.content.match(/[\?？!！]/g) || []).length > 2 ? 1 : 0.6,
      clarity: content.content.length / content.title.length > 3 ? 1 : 0.8
    };
    
    const average = Object.values(assessments).reduce((sum, val) => sum + val, 0) / Object.keys(assessments).length;
    return Math.round(average * 100);
  }

  /**
   * 获取可用模板列表
   */
  getAvailableTemplates() {
    return Object.entries(this.templates).map(([key, template]) => ({
      id: key,
      name: template.name,
      structure: template.structure
    }));
  }

  /**
   * 获取可用写作风格
   */
  getAvailableStyles() {
    return Object.entries(this.writingStyles).map(([key, style]) => ({
      id: key,
      name: style.name,
      characteristics: style.characteristics,
      tone: style.tone
    }));
  }
}

module.exports = new EnhancedContentCreationService();