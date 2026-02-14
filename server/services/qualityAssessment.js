const NodeCache = require('node-cache');

class QualityAssessment {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1小时缓存
    this.sensitiveWords = this.loadSensitiveWords();
    this.factCheckKeywords = ['数据', '研究', '报告', '统计', '调查', '分析'];
  }
  
  // 加载敏感词库
  loadSensitiveWords() {
    // 这里可以从文件或数据库加载敏感词
    return [
      '政治敏感词',
      '违法信息',
      '虚假信息',
      // 更多敏感词...
    ];
  }
  
  // 综合质量评估
  async assessContent(content, type) {
    const cacheKey = `quality_${Buffer.from(content).toString('base64')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const assessment = {
      overall: 0,
      dimensions: {
        readability: this.assessReadability(content),
        structure: this.assessStructure(content, type),
        engagement: this.assessEngagement(content),
        credibility: this.assessCredibility(content),
        originality: this.assessOriginality(content)
      },
      issues: [],
      suggestions: [],
      sensitiveWords: this.checkSensitiveWords(content),
      factCheck: this.checkFactAccuracy(content)
    };
    
    // 计算综合得分
    assessment.overall = Math.round(
      (assessment.dimensions.readability +
       assessment.dimensions.structure +
       assessment.dimensions.engagement +
       assessment.dimensions.credibility +
       assessment.dimensions.originality) / 5
    );
    
    // 生成改进建议
    this.generateSuggestions(assessment);
    
    this.cache.set(cacheKey, assessment);
    return assessment;
  }
  
  // 可读性评估
  assessReadability(content) {
    let score = 50;
    
    // 句子长度分析
    const sentences = content.split(/[。！？]/).filter(s => s.trim());
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    if (avgSentenceLength >= 10 && avgSentenceLength <= 30) {
      score += 20;
    } else if (avgSentenceLength > 50) {
      score -= 10;
    }
    
    // 段落结构
    const paragraphs = content.split('\n').filter(p => p.trim());
    if (paragraphs.length >= 3) {
      score += 15;
    }
    
    // 词汇复杂度
    const words = content.match(/[\u4e00-\u9fa5]+/g) || [];
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / words.length;
    
    if (vocabularyRichness > 0.6) {
      score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  // 结构评估
  assessStructure(content, type) {
    let score = 50;
    
    switch (type) {
      case 'article':
        if (content.includes('首先') || content.includes('第一')) score += 10;
        if (content.includes('其次') || content.includes('第二')) score += 10;
        if (content.includes('最后') || content.includes('总结')) score += 10;
        if (content.includes('因此') || content.includes('所以')) score += 10;
        break;
        
      case 'micro':
        if (content.length <= 300) score += 20;
        if (content.includes('#')) score += 10;
        if (content.includes('？') || content.includes('!')) score += 10;
        break;
        
      case 'video':
        if (content.includes('开场') || content.includes('开场白')) score += 15;
        if (content.includes('画面') || content.includes('镜头')) score += 15;
        if (content.includes('结尾') || content.includes('总结')) score += 10;
        break;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  // 吸引力评估
  assessEngagement(content) {
    let score = 50;
    
    // 情感词汇
    const emotionalWords = ['惊人', '震撼', '惊喜', '感动', '兴奋', '重要', '关键'];
    const hasEmotionalWords = emotionalWords.some(word => content.includes(word));
    if (hasEmotionalWords) score += 15;
    
    // 互动元素
    if (content.includes('？')) score += 10;
    if (content.includes('！')) score += 5;
    if (content.includes('你') || content.includes('大家')) score += 10;
    
    // 时效性词汇
    const timeWords = ['最新', '刚刚', '今天', '现在', '实时'];
    const hasTimeWords = timeWords.some(word => content.includes(word));
    if (hasTimeWords) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  // 可信度评估
  assessCredibility(content) {
    let score = 50;
    
    // 数据支撑
    const dataPatterns = [/\d+%/, /\d+个/, /\d+万/, /\d+亿/];
    const hasData = dataPatterns.some(pattern => pattern.test(content));
    if (hasData) score += 20;
    
    // 引用来源
    if (content.includes('据') || content.includes('研究显示')) score += 15;
    if (content.includes('专家') || content.includes('学者')) score += 10;
    
    // 事实核查关键词
    const hasFactKeywords = this.factCheckKeywords.some(keyword => content.includes(keyword));
    if (hasFactKeywords) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }
  
  // 原创性评估
  assessOriginality(content) {
    let score = 70; // 基础分数
    
    // 避免陈词滥调
    const clichés = ['众所周知', '不言而喻', '显而易见', '总的来说'];
    const hasClichés = clichés.some(cliché => content.includes(cliché));
    if (hasClichés) score -= 10;
    
    // 独特视角
    const uniquePerspectives = ['新视角', '深度分析', '独家', '揭秘'];
    const hasUniquePerspective = uniquePerspectives.some(perspective => content.includes(perspective));
    if (hasUniquePerspective) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }
  
  // 敏感词检查
  checkSensitiveWords(content) {
    const found = [];
    this.sensitiveWords.forEach(word => {
      if (content.includes(word)) {
        found.push(word);
      }
    });
    return found;
  }
  
  // 事实准确性检查
  checkFactAccuracy(content) {
    const issues = [];
    
    // 检查数据格式
    const dataMatches = content.match(/\d+[%％]/g);
    if (dataMatches) {
      dataMatches.forEach(match => {
        const value = parseInt(match);
        if (value > 100) {
          issues.push(`数据 "${match}" 可能不准确`);
        }
      });
    }
    
    // 检查时间表述
    const timePatterns = [
      /昨天.*今天/,
      /今天.*明天/,
      /刚刚.*现在/
    ];
    
    timePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push('时间表述可能存在逻辑问题');
      }
    });
    
    return issues;
  }
  
  // 生成改进建议
  generateSuggestions(assessment) {
    if (assessment.dimensions.readability < 60) {
      assessment.suggestions.push('建议优化句子结构，避免过长句子');
    }
    
    if (assessment.dimensions.structure < 60) {
      assessment.suggestions.push('建议增加文章结构标记，如首先、其次、最后等');
    }
    
    if (assessment.dimensions.credibility < 60) {
      assessment.suggestions.push('建议添加数据支撑和引用来源');
    }
    
    if (assessment.sensitiveWords.length > 0) {
      assessment.suggestions.push('发现敏感词汇，建议修改或删除');
    }
    
    if (assessment.factCheck.length > 0) {
      assessment.suggestions.push('发现可能的事实错误，建议核实');
    }
  }
}

module.exports = new QualityAssessment();
