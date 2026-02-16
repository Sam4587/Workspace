/**
 * 内容质量评估和优化建议系统
 * 提供全面的内容质量分析、评分和改进建议
 */

const logger = require('../utils/logger');

class ContentQualityAssessmentService {
  constructor() {
    this.qualityMetrics = this.defineQualityMetrics();
    this.optimizationStrategies = this.defineOptimizationStrategies();
    this.industryStandards = this.loadIndustryStandards();
  }

  /**
   * 定义质量评估指标
   */
  defineQualityMetrics() {
    return {
      // 基础质量指标
      structural_quality: {
        name: '结构质量',
        weight: 0.2,
        components: ['逻辑结构', '段落组织', '标题层次']
      },
      
      linguistic_quality: {
        name: '语言质量',
        weight: 0.25,
        components: ['语法准确性', '词汇丰富度', '表达清晰度']
      },
      
      content_value: {
        name: '内容价值',
        weight: 0.3,
        components: ['信息准确性', '原创性', '实用性']
      },
      
      reader_engagement: {
        name: '读者参与度',
        weight: 0.15,
        components: ['吸引力', '互动性', '情感共鸣']
      },
      
      technical_optimization: {
        name: '技术优化',
        weight: 0.1,
        components: ['SEO友好性', '可读性', '格式规范']
      }
    };
  }

  /**
   * 定义优化策略
   */
  defineOptimizationStrategies() {
    return {
      improve_structure: {
        name: '改善结构',
        triggers: ['逻辑混乱', '段落过长', '缺乏层次'],
        actions: [
          '重新组织内容结构',
          '添加小标题分割',
          '调整段落长度'
        ]
      },
      
      enhance_language: {
        name: '提升语言',
        triggers: ['语法错误', '词汇单调', '表达模糊'],
        actions: [
          '修正语法错误',
          '丰富词汇表达',
          '优化句式结构'
        ]
      },
      
      add_value: {
        name: '增加价值',
        triggers: ['内容浅显', '缺乏深度', '实用性不足'],
        actions: [
          '添加数据支撑',
          '引入专家观点',
          '提供实用建议'
        ]
      },
      
      boost_engagement: {
        name: '提升参与度',
        triggers: ['开头平淡', '缺乏互动', '结尾无力'],
        actions: [
          '优化开头吸引力',
          '添加互动元素',
          '强化结尾号召'
        ]
      },
      
      technical_optimization: {
        name: '技术优化',
        triggers: ['SEO不足', '可读性差', '格式不规范'],
        actions: [
          '优化关键词布局',
          '改善句子长度',
          '规范化格式排版'
        ]
      }
    };
  }

  /**
   * 加载行业标准
   */
  loadIndustryStandards() {
    return {
      article_standards: {
        optimal_length: { min: 800, max: 2000, ideal: 1200 },
        paragraph_length: { min: 50, max: 200, ideal: 100 },
        sentence_length: { min: 15, max: 25, ideal: 20 },
        keyword_density: { min: 0.5, max: 3, ideal: 1.5 },
        readability_score: { min: 60, max: 80, ideal: 70 }
      },
      
      micro_content_standards: {
        optimal_length: { min: 100, max: 500, ideal: 300 },
        emoji_usage: { min: 0, max: 3, ideal: 1 },
        question_marks: { min: 1, max: 2, ideal: 1 },
        hashtags: { min: 1, max: 5, ideal: 3 }
      },
      
      video_script_standards: {
        optimal_length: { min: 300, max: 1000, ideal: 600 },
        dialogue_ratio: { min: 0.6, max: 0.8, ideal: 0.7 },
        action_descriptions: { min: 0.2, max: 0.4, ideal: 0.3 }
      }
    };
  }

  /**
   * 全面内容质量评估
   */
  async assessContentQuality(content, contentType = 'article', options = {}) {
    try {
      logger.info('[QualityAssessment] 开始内容质量评估', { 
        contentType,
        contentLength: content.length 
      });

      // 1. 基础指标分析
      const basicMetrics = this.analyzeBasicMetrics(content, contentType);
      
      // 2. 结构质量评估
      const structuralScore = this.evaluateStructure(content, contentType);
      
      // 3. 语言质量评估
      const linguisticScore = this.evaluateLanguage(content);
      
      // 4. 内容价值评估
      const valueScore = this.evaluateContentValue(content, options.context || {});
      
      // 5. 参与度评估
      const engagementScore = this.evaluateEngagement(content, contentType);
      
      // 6. 技术优化评估
      const technicalScore = this.evaluateTechnicalAspects(content, contentType);
      
      // 7. 综合评分
      const overallScore = this.calculateOverallScore({
        structural: structuralScore,
        linguistic: linguisticScore,
        value: valueScore,
        engagement: engagementScore,
        technical: technicalScore
      });
      
      // 8. 生成详细报告
      const assessmentReport = this.generateAssessmentReport({
        basicMetrics,
        scores: {
          structural: structuralScore,
          linguistic: linguisticScore,
          value: valueScore,
          engagement: engagementScore,
          technical: technicalScore,
          overall: overallScore
        },
        contentType
      });
      
      // 9. 生成优化建议
      const optimizationSuggestions = this.generateOptimizationSuggestions(
        assessmentReport,
        content,
        contentType
      );
      
      const result = {
        overallScore: overallScore.score,
        qualityLevel: this.determineQualityLevel(overallScore.score),
        detailedScores: assessmentReport.scores,
        metrics: basicMetrics,
        suggestions: optimizationSuggestions,
        timestamp: new Date().toISOString(),
        contentType
      };

      logger.info('[QualityAssessment] 内容质量评估完成', { 
        overallScore: result.overallScore,
        qualityLevel: result.qualityLevel
      });

      return result;
    } catch (error) {
      logger.error('[QualityAssessment] 内容质量评估失败', { 
        error: error.message,
        contentLength: content.length
      });
      throw error;
    }
  }

  /**
   * 分析基础指标
   */
  analyzeBasicMetrics(content, contentType) {
    const charCount = content.length;
    const wordCount = content.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0).length;
    const sentenceCount = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0).length;
    const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgParagraphLength = paragraphCount > 0 ? wordCount / paragraphCount : 0;
    
    // 关键词密度分析（简单实现）
    const keywordDensity = this.analyzeKeywordDensity(content);
    
    return {
      charCount,
      wordCount,
      sentenceCount,
      paragraphCount,
      avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
      avgParagraphLength: Math.round(avgParagraphLength * 100) / 100,
      keywordDensity,
      readabilityScore: this.calculateReadabilityScore(content)
    };
  }

  /**
   * 评估结构质量
   */
  evaluateStructure(content, contentType) {
    const standards = this.industryStandards[`${contentType}_standards`] || this.industryStandards.article_standards;
    
    let score = 100;
    const issues = [];
    
    // 检查段落长度
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const longParagraphs = paragraphs.filter(p => p.length > standards.paragraph_length.max);
    const shortParagraphs = paragraphs.filter(p => p.length < standards.paragraph_length.min);
    
    if (longParagraphs.length > paragraphs.length * 0.3) {
      score -= 20;
      issues.push('存在过多长段落，建议分割');
    }
    
    if (shortParagraphs.length > paragraphs.length * 0.5) {
      score -= 10;
      issues.push('段落过于零碎，建议合并');
    }
    
    // 检查逻辑连接词
    const transitionWords = ['首先', '其次', '另外', '然而', '因此', '总而言之'];
    const hasTransitions = transitionWords.some(word => content.includes(word));
    
    if (!hasTransitions) {
      score -= 15;
      issues.push('缺乏逻辑连接词，结构不够清晰');
    }
    
    // 检查标题使用
    const hasHeadings = content.includes('#') || content.includes('##') || /[一二三四五六七八九十]、/.test(content);
    if (!hasHeadings && content.length > 500) {
      score -= 10;
      issues.push('长内容缺乏标题层次');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      recommendations: this.generateStructureRecommendations(issues)
    };
  }

  /**
   * 评估语言质量
   */
  evaluateLanguage(content) {
    let score = 100;
    const issues = [];
    
    // 语法检查（简单实现）
    const grammarIssues = this.checkGrammar(content);
    if (grammarIssues.length > 0) {
      score -= grammarIssues.length * 5;
      issues.push(...grammarIssues);
    }
    
    // 词汇丰富度
    const vocabularyRichness = this.analyzeVocabularyRichness(content);
    if (vocabularyRichness < 0.3) {
      score -= 15;
      issues.push('词汇使用较为单一');
    }
    
    // 表达清晰度
    const clarityScore = this.evaluateClarity(content);
    if (clarityScore < 70) {
      score -= (70 - clarityScore) * 0.5;
      issues.push('表达不够清晰');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      vocabularyRichness,
      clarityScore
    };
  }

  /**
   * 评估内容价值
   */
  evaluateContentValue(content, context) {
    let score = 100;
    const issues = [];
    
    // 原创性检查
    const originalityScore = this.checkOriginality(content);
    if (originalityScore < 80) {
      score -= (80 - originalityScore) * 0.3;
      issues.push('原创性有待提升');
    }
    
    // 实用性评估
    const practicalElements = this.countPracticalElements(content);
    if (practicalElements < 3) {
      score -= (3 - practicalElements) * 10;
      issues.push('实用建议较少');
    }
    
    // 数据支撑检查
    const hasDataSupport = /\d+(?:\.?\d*)%?/.test(content) || /数据显示|研究表明|统计表明/.test(content);
    if (!hasDataSupport && content.length > 300) {
      score -= 15;
      issues.push('缺乏数据支撑');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      originalityScore,
      practicalElements,
      hasDataSupport
    };
  }

  /**
   * 评估参与度
   */
  evaluateEngagement(content, contentType) {
    let score = 100;
    const issues = [];
    
    // 开头吸引力
    const opening = content.substring(0, Math.min(100, content.length));
    const hasHook = /[\?？!！]|震惊|揭秘|独家/.test(opening);
    if (!hasHook) {
      score -= 20;
      issues.push('开头缺乏吸引力');
    }
    
    // 互动元素
    const interactiveElements = this.countInteractiveElements(content);
    if (interactiveElements < 2) {
      score -= (2 - interactiveElements) * 10;
      issues.push('互动元素不足');
    }
    
    // 情感共鸣
    const emotionalWords = ['感动', '震撼', '惊喜', '温暖', '愤怒', '开心'];
    const hasEmotionalAppeal = emotionalWords.some(word => content.includes(word));
    if (!hasEmotionalAppeal) {
      score -= 15;
      issues.push('缺乏情感共鸣');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      hasStrongOpening: hasHook,
      interactiveElements,
      hasEmotionalAppeal
    };
  }

  /**
   * 评估技术优化
   */
  evaluateTechnicalAspects(content, contentType) {
    let score = 100;
    const issues = [];
    
    // SEO检查
    const seoScore = this.evaluateSEO(content);
    if (seoScore < 70) {
      score -= (70 - seoScore) * 0.3;
      issues.push('SEO优化不足');
    }
    
    // 可读性检查
    const readability = this.calculateReadabilityScore(content);
    if (readability < 60) {
      score -= (60 - readability) * 0.2;
      issues.push('可读性较差');
    }
    
    // 格式规范
    const formatIssues = this.checkFormatting(content);
    if (formatIssues.length > 0) {
      score -= formatIssues.length * 5;
      issues.push(...formatIssues);
    }
    
    return {
      score: Math.max(0, score),
      issues,
      seoScore,
      readability,
      formatIssues: formatIssues.length
    };
  }

  /**
   * 计算综合评分
   */
  calculateOverallScore(scores) {
    const weights = {
      structural: 0.2,
      linguistic: 0.25,
      value: 0.3,
      engagement: 0.15,
      technical: 0.1
    };
    
    const weightedScore = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key].score * weight);
    }, 0);
    
    return {
      score: Math.round(weightedScore),
      breakdown: Object.fromEntries(
        Object.entries(scores).map(([key, value]) => [key, value.score])
      )
    };
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(assessment, content, contentType) {
    const suggestions = [];
    const scores = assessment.scores;
    
    // 根据各项得分生成针对性建议
    if (scores.structural.score < 70) {
      suggestions.push({
        category: 'structure',
        priority: 'high',
        title: '改善内容结构',
        description: '当前内容结构需要优化',
        actions: this.optimizationStrategies.improve_structure.actions,
        estimatedImpact: '提升15-25分'
      });
    }
    
    if (scores.linguistic.score < 70) {
      suggestions.push({
        category: 'language',
        priority: 'high',
        title: '提升语言表达',
        description: '语言质量有待改善',
        actions: this.optimizationStrategies.enhance_language.actions,
        estimatedImpact: '提升10-20分'
      });
    }
    
    if (scores.value.score < 70) {
      suggestions.push({
        category: 'value',
        priority: 'medium',
        title: '增加内容价值',
        description: '内容深度和实用性需要加强',
        actions: this.optimizationStrategies.add_value.actions,
        estimatedImpact: '提升20-30分'
      });
    }
    
    if (scores.engagement.score < 70) {
      suggestions.push({
        category: 'engagement',
        priority: 'medium',
        title: '提升读者参与度',
        description: '需要增强内容的吸引力和互动性',
        actions: this.optimizationStrategies.boost_engagement.actions,
        estimatedImpact: '提升15-25分'
      });
    }
    
    if (scores.technical.score < 70) {
      suggestions.push({
        category: 'technical',
        priority: 'low',
        title: '技术优化',
        description: 'SEO和可读性方面需要优化',
        actions: this.optimizationStrategies.technical_optimization.actions,
        estimatedImpact: '提升5-15分'
      });
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 辅助方法
   */
  
  determineQualityLevel(score) {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    if (score >= 60) return '及格';
    return '需要改进';
  }

  analyzeKeywordDensity(content) {
    // 简单的关键词密度分析
    const words = content.replace(/[^\w\s]/g, '').toLowerCase().split(/\s+/);
    const wordCount = {};
    
    words.forEach(word => {
      if (word.length > 2) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    const totalWords = words.length;
    const densities = Object.entries(wordCount)
      .map(([word, count]) => ({
        word,
        density: (count / totalWords) * 100
      }))
      .sort((a, b) => b.density - a.density)
      .slice(0, 5);
    
    return densities;
  }

  checkGrammar(content) {
    const issues = [];
    
    // 简单的语法检查规则
    if (/的的|得得|地地/.test(content)) {
      issues.push('存在重复助词');
    }
    
    if (/[，。！？]{2,}/.test(content)) {
      issues.push('标点符号使用不当');
    }
    
    return issues;
  }

  analyzeVocabularyRichness(content) {
    const words = content.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length || 0;
  }

  evaluateClarity(content) {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    // 简单的清晰度评分
    if (avgLength < 20) return 90;
    if (avgLength < 40) return 80;
    if (avgLength < 60) return 70;
    if (avgLength < 80) return 60;
    return 50;
  }

  checkOriginality(content) {
    // 简单的原创性检查（实际应用中应使用更复杂的算法）
    const commonPhrases = ['众所周知', '毫无疑问', '显而易见', '不言而喻'];
    const originalPhrases = content.split(/[。！？]/).filter(sentence => 
      !commonPhrases.some(phrase => sentence.includes(phrase))
    );
    
    return (originalPhrases.length / Math.max(1, content.split(/[。！？]/).length)) * 100;
  }

  countPracticalElements(content) {
    const practicalIndicators = ['建议', '方法', '技巧', '步骤', '如何', '应该', '可以'];
    return practicalIndicators.filter(indicator => 
      content.includes(indicator)
    ).length;
  }

  countInteractiveElements(content) {
    const interactiveIndicators = ['?', '？', '你觉得', '你怎么看', '留言', '评论'];
    return interactiveIndicators.filter(indicator => 
      content.includes(indicator)
    ).length;
  }

  evaluateSEO(content) {
    let score = 100;
    
    // 检查标题标签
    if (!/<h[1-6]>/.test(content)) score -= 20;
    
    // 检查关键词分布
    const keywords = this.analyzeKeywordDensity(content);
    if (keywords.length === 0) score -= 30;
    
    // 检查内部链接
    if (!/<a\s+href/.test(content)) score -= 15;
    
    return Math.max(0, score);
  }

  calculateReadabilityScore(content) {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    const words = content.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const score = Math.max(0, 100 - (avgSentenceLength - 20) * 2);
    
    return Math.round(score);
  }

  checkFormatting(content) {
    const issues = [];
    
    // 检查多余的空行
    if (/\n\s*\n\s*\n/.test(content)) {
      issues.push('存在多余空行');
    }
    
    // 检查行首空格
    if (/^\s+/m.test(content)) {
      issues.push('行首有多余空格');
    }
    
    return issues;
  }

  generateAssessmentReport(data) {
    return {
      ...data,
      assessmentTime: new Date().toISOString(),
      version: '1.0'
    };
  }

  generateStructureRecommendations(issues) {
    const recommendations = [];
    
    if (issues.includes('存在过多长段落，建议分割')) {
      recommendations.push('将长段落按主题分割成2-3个小段落');
    }
    
    if (issues.includes('缺乏逻辑连接词，结构不够清晰')) {
      recommendations.push('添加"首先"、"其次"、"另外"等连接词');
    }
    
    return recommendations;
  }
}

module.exports = new ContentQualityAssessmentService();