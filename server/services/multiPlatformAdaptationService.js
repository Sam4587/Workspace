/**
 * 多平台内容适配和格式转换服务
 * 支持不同平台的内容格式转换和优化
 */

const logger = require('../utils/logger');

class MultiPlatformAdaptationService {
  constructor() {
    this.platformConfigs = this.loadPlatformConfigs();
    this.formatConverters = this.loadFormatConverters();
    this.optimizationRules = this.loadOptimizationRules();
  }

  /**
   * 加载各平台配置
   */
  loadPlatformConfigs() {
    return {
      toutiao: {
        name: '今日头条',
        maxLength: 2000,
        preferredFormat: 'article',
        supportedFeatures: ['images', 'videos', 'links'],
        contentGuidelines: {
          titleMaxLength: 30,
          requireCoverImage: true,
          allowHtml: true,
          preferredTone: 'informative'
        }
      },
      
      weibo: {
        name: '微博',
        maxLength: 500,
        preferredFormat: 'micro',
        supportedFeatures: ['images', 'videos', 'hashtags', 'mentions'],
        contentGuidelines: {
          titleMaxLength: 20,
          requireCoverImage: false,
          allowHtml: false,
          preferredTone: 'casual'
        }
      },
      
      zhihu: {
        name: '知乎',
        maxLength: 5000,
        preferredFormat: 'article',
        supportedFeatures: ['images', 'math', 'code', 'tables'],
        contentGuidelines: {
          titleMaxLength: 50,
          requireCoverImage: true,
          allowHtml: true,
          preferredTone: 'professional'
        }
      },
      
      xiaohongshu: {
        name: '小红书',
        maxLength: 1000,
        preferredFormat: 'lifestyle',
        supportedFeatures: ['images', 'emojis', 'hashtags'],
        contentGuidelines: {
          titleMaxLength: 25,
          requireCoverImage: true,
          allowHtml: false,
          preferredTone: 'lifestyle'
        }
      },
      
      douyin: {
        name: '抖音',
        maxLength: 300,
        preferredFormat: 'video_script',
        supportedFeatures: ['videos', 'music', 'effects'],
        contentGuidelines: {
          titleMaxLength: 20,
          requireCoverImage: true,
          allowHtml: false,
          preferredTone: 'entertaining'
        }
      },
      
      bilibili: {
        name: '哔哩哔哩',
        maxLength: 10000,
        preferredFormat: 'video_description',
        supportedFeatures: ['images', 'links', 'emojis'],
        contentGuidelines: {
          titleMaxLength: 80,
          requireCoverImage: true,
          allowHtml: true,
          preferredTone: 'enthusiastic'
        }
      }
    };
  }

  /**
   * 加载格式转换器
   */
  loadFormatConverters() {
    return {
      htmlToText: this.convertHtmlToText.bind(this),
      textToHtml: this.convertTextToHtml.bind(this),
      markdownToHtml: this.convertMarkdownToHtml.bind(this),
      htmlToMarkdown: this.convertHtmlToMarkdown.bind(this),
      richTextToPlain: this.convertRichTextToPlain.bind(this)
    };
  }

  /**
   * 加载优化规则
   */
  loadOptimizationRules() {
    const self = this;
    return {
      toutiao: {
        titleOptimization: (content, options) => self.optimizeToutiaoTitle(content, options),
        contentOptimization: (content, options) => self.optimizeToutiaoContent(content, options),
        imageOptimization: (content, options) => self.optimizeImages(content, options)
      },
      
      weibo: {
        titleOptimization: (content, options) => self.optimizeWeiboTitle(content, options),
        contentOptimization: (content, options) => self.optimizeWeiboContent(content, options),
        hashtagOptimization: (content, options) => self.optimizeHashtags(content, options)
      },
      
      zhihu: {
        titleOptimization: (content, options) => self.optimizeZhihuTitle(content, options),
        contentOptimization: (content, options) => self.optimizeZhihuContent(content, options),
        structureOptimization: (content, options) => self.optimizeStructure(content, options)
      },
      
      xiaohongshu: {
        titleOptimization: (content, options) => self.optimizeXiaohongshuTitle(content, options),
        contentOptimization: (content, options) => self.optimizeXiaohongshuContent(content, options),
        emojiOptimization: (content, options) => self.optimizeEmojis(content, options)
      },
      
      douyin: {
        titleOptimization: (content, options) => self.optimizeDouyinTitle(content, options),
        contentOptimization: (content, options) => self.optimizeDouyinContent(content, options),
        hookOptimization: (content, options) => self.optimizeVideoHook(content, options)
      },
      
      bilibili: {
        titleOptimization: (content, options) => self.optimizeBilibiliTitle(content, options),
        contentOptimization: (content, options) => self.optimizeBilibiliContent(content, options),
        communityOptimization: (content, options) => self.optimizeCommunityEngagement(content, options)
      }
    };
  }

  /**
   * 主要适配方法
   */
  async adaptContentForPlatform(content, targetPlatform, options = {}) {
    try {
      logger.info('[MultiPlatformAdaptation] 开始内容平台适配', { 
        targetPlatform,
        contentLength: content.length 
      });

      const platformConfig = this.platformConfigs[targetPlatform];
      if (!platformConfig) {
        throw new Error(`不支持的目标平台: ${targetPlatform}`);
      }

      // 1. 内容裁剪和调整
      let adaptedContent = this.adjustContentLength(content, platformConfig);

      // 2. 格式转换
      adaptedContent = await this.convertContentFormat(adaptedContent, options.format || 'text');

      // 3. 平台特定优化
      const optimizationRules = this.optimizationRules[targetPlatform];
      if (optimizationRules) {
        adaptedContent = await this.applyOptimizationRules(
          adaptedContent, 
          optimizationRules,
          options
        );
      }

      // 4. 生成平台特定的元数据
      const metadata = this.generatePlatformMetadata(adaptedContent, platformConfig, options);

      const result = {
        content: adaptedContent,
        platform: targetPlatform,
        platformName: platformConfig.name,
        metadata,
        adaptationsApplied: this.getAppliedAdaptations(targetPlatform, options),
        compatibilityScore: this.calculateCompatibilityScore(adaptedContent, platformConfig)
      };

      logger.info('[MultiPlatformAdaptation] 内容平台适配完成', { 
        targetPlatform,
        compatibilityScore: result.compatibilityScore
      });

      return result;
    } catch (error) {
      logger.error('[MultiPlatformAdaptation] 内容平台适配失败', { 
        error: error.message,
        targetPlatform,
        contentLength: content.length
      });
      throw error;
    }
  }

  /**
   * 批量平台适配
   */
  async adaptContentForMultiplePlatforms(content, platforms, options = {}) {
    const results = {};
    
    for (const platform of platforms) {
      try {
        results[platform] = await this.adaptContentForPlatform(
          content, 
          platform, 
          options
        );
      } catch (error) {
        logger.warn(`[MultiPlatformAdaptation] ${platform} 适配失败`, { 
          error: error.message 
        });
        results[platform] = {
          error: error.message,
          success: false
        };
      }
    }
    
    return results;
  }

  /**
   * 内容长度调整
   */
  adjustContentLength(content, platformConfig) {
    const maxLength = platformConfig.maxLength;
    
    if (content.length <= maxLength) {
      return content;
    }

    // 智能裁剪，保留重要内容
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    let trimmedContent = '';
    
    for (const sentence of sentences) {
      if ((trimmedContent + sentence + '。').length <= maxLength) {
        trimmedContent += sentence + '。';
      } else {
        break;
      }
    }
    
    // 如果还是太长，强制截断
    if (trimmedContent.length > maxLength) {
      trimmedContent = trimmedContent.substring(0, maxLength - 3) + '...';
    }
    
    return trimmedContent;
  }

  /**
   * 内容格式转换
   */
  async convertContentFormat(content, targetFormat) {
    const converter = this.formatConverters[targetFormat];
    if (converter) {
      return await converter(content);
    }
    return content;
  }

  /**
   * 应用优化规则
   */
  async applyOptimizationRules(content, rules, options) {
    let optimizedContent = content;
    
    // 应用标题优化
    if (rules.titleOptimization) {
      optimizedContent = await rules.titleOptimization(optimizedContent, options);
    }
    
    // 应用内容优化
    if (rules.contentOptimization) {
      optimizedContent = await rules.contentOptimization(optimizedContent, options);
    }
    
    // 应用特定功能优化
    const additionalOptimizations = Object.keys(rules).filter(
      key => key.endsWith('Optimization') && 
             key !== 'titleOptimization' && 
             key !== 'contentOptimization'
    );
    
    for (const optKey of additionalOptimizations) {
      optimizedContent = await rules[optKey](optimizedContent, options);
    }
    
    return optimizedContent;
  }

  /**
   * 生成平台元数据
   */
  generatePlatformMetadata(content, platformConfig, options) {
    return {
      title: this.generateOptimizedTitle(content, platformConfig),
      tags: this.extractRelevantTags(content, platformConfig),
      coverImageUrl: options.coverImage || this.generatePlaceholderImage(content),
      publishTime: options.publishTime || new Date().toISOString(),
      category: options.category || this.inferCategory(content),
      seoKeywords: this.extractSeoKeywords(content),
      readingTime: this.calculateReadingTime(content, platformConfig.preferredFormat)
    };
  }

  /**
   * 平台特定优化方法
   */
  
  // 今日头条优化
  async optimizeToutiaoTitle(content, options) {
    const title = content.substring(0, 30);
    // 添加数字和热点词汇提高点击率
    const hotWords = ['震惊', '揭秘', '独家', '最新', '重磅'];
    if (!hotWords.some(word => title.includes(word)) && title.length < 25) {
      return `【${hotWords[Math.floor(Math.random() * hotWords.length)]}】${title}`;
    }
    return title;
  }

  async optimizeToutiaoContent(content, options) {
    // 添加段落分割和重点标记
    return content.replace(/([。！？])([^。！？]{20,}?)([。！？])/g, '$1\n\n$2$3');
  }

  // 微博优化
  async optimizeWeiboTitle(content, options) {
    return content.substring(0, 20);
  }

  async optimizeWeiboContent(content, options) {
    // 添加表情符号和话题标签
    let optimized = content;
    
    // 添加适量表情符号
    const emojis = ['🔥', '💡', '🎯', '✨', '🚀'];
    if (!/[🔥💡🎯✨🚀]/.test(content) && content.length > 100) {
      optimized = emojis[Math.floor(Math.random() * emojis.length)] + ' ' + optimized;
    }
    
    return optimized;
  }

  async optimizeHashtags(content, options) {
    // 自动添加相关话题标签
    const commonTags = ['#热点', '#新闻', '#科技', '#生活'];
    const existingTags = (content.match(/#[^#\s]+/g) || []).length;
    
    if (existingTags < 3) {
      return content + ' ' + commonTags.slice(0, 3 - existingTags).join(' ');
    }
    return content;
  }

  // 知乎优化
  async optimizeZhihuTitle(content, options) {
    return content.substring(0, 50);
  }

  async optimizeZhihuContent(content, options) {
    // 添加更专业的表达和深度分析
    const professionalPrefixes = ['值得注意的是', '深入分析表明', '研究表明', '专家指出'];
    if (content.length > 200 && !professionalPrefixes.some(prefix => content.includes(prefix))) {
      const firstSentenceEnd = content.indexOf('。') + 1;
      if (firstSentenceEnd > 0) {
        return professionalPrefixes[Math.floor(Math.random() * professionalPrefixes.length)] + 
               content.substring(firstSentenceEnd);
      }
    }
    return content;
  }

  async optimizeStructure(content, options) {
    // 添加小标题和结构化内容
    const sections = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (sections.length > 3) {
      return sections.map((section, index) => 
        `**${index + 1}.** ${section}`
      ).join('\n\n');
    }
    return content;
  }

  // 图片优化
  async optimizeImages(content, options) {
    return content;
  }

  // 小红书优化
  async optimizeXiaohongshuTitle(content, options) {
    return content.substring(0, 25);
  }

  async optimizeXiaohongshuContent(content, options) {
    // 添加生活方式化表达
    const lifestylePhrases = ['姐妹们', '宝子们', '家人们', '冲鸭'];
    if (!lifestylePhrases.some(phrase => content.includes(phrase))) {
      return lifestylePhrases[Math.floor(Math.random() * lifestylePhrases.length)] + '！' + content;
    }
    return content;
  }

  async optimizeEmojis(content, options) {
    // 优化表情符号使用
    const emojis = ['💕', '🌟', '💖', '🌈', '🌸'];
    const currentEmojiCount = (content.match(/[💕🌟💖🌈🌸]/g) || []).length;
    
    if (currentEmojiCount < 2) {
      return emojis.slice(0, 2 - currentEmojiCount).join('') + content;
    }
    return content;
  }

  // 抖音优化
  async optimizeDouyinTitle(content, options) {
    return content.substring(0, 20);
  }

  async optimizeDouyinContent(content, options) {
    // 添加口语化表达和互动元素
    const casualPhrases = ['话说', '你知道吗', '真的绝了', '太香了'];
    if (!casualPhrases.some(phrase => content.includes(phrase))) {
      return casualPhrases[Math.floor(Math.random() * casualPhrases.length)] + '！' + content;
    }
    return content;
  }

  async optimizeVideoHook(content, options) {
    // 优化视频开头吸引力
    const hooks = ['前方高能预警！', '不看后悔系列！', '颠覆认知！', '全程高能！'];
    const firstSentence = content.split(/[。！？]/)[0];
    return hooks[Math.floor(Math.random() * hooks.length)] + firstSentence;
  }

  // B站优化
  async optimizeBilibiliTitle(content, options) {
    return content.substring(0, 80);
  }

  async optimizeBilibiliContent(content, options) {
    // 添加社区化表达
    const communityPhrases = ['小伙伴们', '老铁们', '观众老爷们', '弹幕大军'];
    if (!communityPhrases.some(phrase => content.includes(phrase))) {
      return communityPhrases[Math.floor(Math.random() * communityPhrases.length)] + '！' + content;
    }
    return content;
  }

  async optimizeCommunityEngagement(content, options) {
    // 添加互动引导
    const engagementPhrases = ['记得点赞投币收藏哦', '一键三连走起', '评论区见', '求关注'];
    if (!engagementPhrases.some(phrase => content.includes(phrase))) {
      return content + '\n\n' + engagementPhrases[Math.floor(Math.random() * engagementPhrases.length)];
    }
    return content;
  }

  /**
   * 格式转换方法
   */
  
  convertHtmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  convertTextToHtml(text) {
    return `<p>${text.replace(/\n\s*\n/g, '</p><p>')}</p>`;
  }

  convertMarkdownToHtml(markdown) {
    // 简单的Markdown转换
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n$/gim, '<br />');
  }

  convertHtmlToMarkdown(html) {
    return html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img.*?alt="(.*?)".*?src="(.*?)".*?>/gi, '![$1]($2)')
      .replace(/<[^>]*>/g, '');
  }

  convertRichTextToPlain(richText) {
    // 移除富文本格式
    return richText.replace(/<\/?[^>]+(>|$)/g, '');
  }

  /**
   * 辅助方法
   */
  
  generateOptimizedTitle(content, platformConfig) {
    const maxLength = platformConfig.contentGuidelines.titleMaxLength;
    return content.substring(0, maxLength);
  }

  extractRelevantTags(content, platformConfig) {
    // 基于内容提取相关标签
    const commonTags = ['科技', '生活', '娱乐', '教育', '财经'];
    return commonTags.slice(0, 3);
  }

  generatePlaceholderImage(content) {
    // 生成占位图片URL
    return 'https://placehold.co/600x400?text=封面图片';
  }

  inferCategory(content) {
    // 基于内容推断分类
    const keywords = {
      '科技': ['AI', '人工智能', '技术', '编程', '互联网'],
      '生活': ['生活', '日常', '经验', '分享'],
      '娱乐': ['娱乐', '明星', '电影', '音乐']
    };
    
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => content.includes(word))) {
        return category;
      }
    }
    return '综合';
  }

  extractSeoKeywords(content) {
    // 提取SEO关键词
    const words = content.replace(/[^\w\s]/g, '').split(/\s+/);
    const wordCount = {};
    
    words.forEach(word => {
      if (word.length > 2) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  calculateReadingTime(content, format) {
    const wordsPerMinute = format === 'video_script' ? 150 : 300;
    const wordCount = content.replace(/[^\w\s]/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  getAppliedAdaptations(platform, options) {
    const adaptations = [`长度调整(${this.platformConfigs[platform].maxLength}字符)`];
    
    if (options.format) {
      adaptations.push(`格式转换(${options.format})`);
    }
    
    adaptations.push(`${this.platformConfigs[platform].name}优化`);
    
    return adaptations;
  }

  calculateCompatibilityScore(content, platformConfig) {
    let score = 100;
    
    // 长度适配度
    const lengthRatio = content.length / platformConfig.maxLength;
    if (lengthRatio > 1) {
      score -= (lengthRatio - 1) * 20;
    }
    
    // 格式兼容性
    if (platformConfig.contentGuidelines.allowHtml === false && /<[a-z][\s\S]*>/i.test(content)) {
      score -= 30;
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * 获取平台配置信息
   */
  getPlatformInfo(platform) {
    return this.platformConfigs[platform] || null;
  }

  /**
   * 获取所有支持的平台
   */
  getSupportedPlatforms() {
    return Object.entries(this.platformConfigs).map(([key, config]) => ({
      id: key,
      name: config.name,
      maxLength: config.maxLength,
      preferredFormat: config.preferredFormat
    }));
  }
}

module.exports = new MultiPlatformAdaptationService();