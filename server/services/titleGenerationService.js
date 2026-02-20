/**
 * 智能标题生成服务
 * 同时满足吸引力和合规性两大核心要求
 * 
 * 功能：
 * 1. 吸引力优化：爆款模式、情感触发、悬念构建
 * 2. 合规性检测：违禁词、敏感词、平台规则
 * 3. 多平台适配：根据不同平台生成最佳标题
 */

const logger = require('../utils/logger');
const multiAIService = require('./multiAIService');

class TitleGenerationService {
  constructor() {
    // 爆款标题模式库
    this.viralPatterns = {
      number: {
        name: '数字型',
        templates: [
          '{数字}个{主题}技巧，第{数字}个太实用了',
          '{数字}分钟学会{主题}，新手必看',
          '{数字}%的人不知道的{主题}秘密',
          '这{数字}个{主题}误区，你中了几个？'
        ],
        score: 90
      },
      question: {
        name: '疑问型',
        templates: [
          '为什么{主题}？真相让人意外',
          '{主题}到底该怎么做？一文讲透',
          '你真的懂{主题}吗？90%的人都错了',
          '{主题}有什么讲究？看完就懂了'
        ],
        score: 85
      },
      contrast: {
        name: '对比型',
        templates: [
          '{主题}前后对比，差距太大了',
          '同样是{主题}，为什么差距这么大？',
          '{主题}的正确做法vs错误做法',
          '普通人做{主题}vs高手做{主题}'
        ],
        score: 88
      },
      emotion: {
        name: '情感型',
        templates: [
          '{主题}让我破防了，太真实',
          '看完这个{主题}，我沉默了',
          '{主题}背后的故事，让人泪目',
          '关于{主题}，我有话说'
        ],
        score: 82
      },
      curiosity: {
        name: '悬念型',
        templates: [
          '{主题}的秘密终于被揭开',
          '没想到{主题}竟然是这样',
          '{主题}背后隐藏的真相',
          '原来{主题}一直都做错了'
        ],
        score: 87
      },
      benefit: {
        name: '利益型',
        templates: [
          '{主题}省钱攻略，亲测有效',
          '{主题}必备指南，建议收藏',
          '{主题}实用技巧，学到就是赚到',
          '一文搞定{主题}，超详细'
        ],
        score: 80
      }
    };

    // 违禁词库（广告法相关）
    this.forbiddenWords = {
      absolute: ['最', '第一', '唯一', '绝对', '100%', '顶级', '最强', '最好', '最大', '最小', '首个', '首家', '独家', '绝版', '永久', '终身'],
      exaggerate: ['震惊', '惊呆', '疯了', '疯了', '吓死', '吓哭', '吓尿', '吓瘫', '吓傻', '惊爆', '曝光', '揭秘', '内幕', '黑幕'],
      medical: ['治愈', '疗效', '药效', '处方', '根治', '康复', '神药', '秘方', '偏方'],
      finance: ['保本', '保收益', '稳赚', '必赚', '暴富', '躺赚', '日赚', '月入过万', '年入百万'],
      sensitive: ['政治敏感词', '领导人姓名', '国家机密', '社会动荡']
    };

    // 平台规则
    this.platformRules = {
      toutiao: {
        name: '今日头条',
        maxTitleLength: 30,
        minTitleLength: 10,
        forbiddenWords: [...this.forbiddenWords.absolute, ...this.forbiddenWords.exaggerate],
        recommendedPatterns: ['number', 'question', 'contrast'],
        style: '新闻资讯风格，客观专业',
        features: ['数字开头效果好', '疑问句点击率高', '避免标题党']
      },
      douyin: {
        name: '抖音',
        maxTitleLength: 30,
        minTitleLength: 5,
        forbiddenWords: [...this.forbiddenWords.absolute, ...this.forbiddenWords.exaggerate],
        recommendedPatterns: ['emotion', 'curiosity', 'question'],
        style: '口语化，接地气，有情绪',
        features: ['口语化表达', '情绪共鸣', '话题感强']
      },
      xiaohongshu: {
        name: '小红书',
        maxTitleLength: 50,
        minTitleLength: 8,
        forbiddenWords: [...this.forbiddenWords.absolute],
        recommendedPatterns: ['benefit', 'emotion', 'number'],
        style: '种草分享风格，真诚有温度',
        features: ['个人体验感', '干货分享', '情感共鸣']
      },
      weibo: {
        name: '微博',
        maxTitleLength: 50,
        minTitleLength: 5,
        forbiddenWords: [...this.forbiddenWords.absolute, ...this.forbiddenWords.exaggerate, ...this.forbiddenWords.sensitive],
        recommendedPatterns: ['emotion', 'contrast', 'curiosity'],
        style: '热点评论风格，观点鲜明',
        features: ['话题标签', '观点表达', '互动性强']
      },
      bilibili: {
        name: '哔哩哔哩',
        maxTitleLength: 80,
        minTitleLength: 8,
        forbiddenWords: [...this.forbiddenWords.absolute],
        recommendedPatterns: ['number', 'question', 'contrast'],
        style: '年轻化，有趣有料',
        features: ['UP主风格', '梗文化', '知识性']
      },
      zhihu: {
        name: '知乎',
        maxTitleLength: 50,
        minTitleLength: 10,
        forbiddenWords: [...this.forbiddenWords.absolute],
        recommendedPatterns: ['question', 'contrast', 'benefit'],
        style: '专业理性，有深度',
        features: ['问题导向', '专业分析', '理性讨论']
      }
    };

    // 情感触发词库
    this.emotionalTriggers = {
      positive: ['惊喜', '感动', '温暖', '治愈', '暖心', '励志', '正能量'],
      negative: ['愤怒', '心痛', '无奈', '震惊', '后怕', '警醒'],
      curiosity: ['揭秘', '真相', '秘密', '内幕', '隐藏', '没想到'],
      urgency: ['紧急', '速看', '必看', '收藏', '转发', '扩散']
    };
  }

  /**
   * 生成标题
   * @param {Object} params - 参数
   * @param {string} params.topic - 主题内容
   * @param {string[]} params.keywords - 关键词
   * @param {string} params.platform - 目标平台
   * @param {number} params.count - 生成数量
   * @param {string} params.style - 风格偏好
   * @returns {Promise<Object>} 生成结果
   */
  async generateTitles(params) {
    const {
      topic,
      keywords = [],
      platform = 'toutiao',
      count = 5,
      style = 'balanced'
    } = params;

    try {
      logger.info('开始生成标题', { topic, platform, count });

      const rules = this.platformRules[platform] || this.platformRules.toutiao;

      // 1. 生成AI标题
      const aiTitles = await this._generateAITitles(topic, keywords, rules, count);

      // 2. 合规性检测
      const validatedTitles = aiTitles.map(title => this._validateTitle(title, rules));

      // 3. 吸引力评分
      const scoredTitles = validatedTitles.map(title => this._scoreTitle(title, topic, keywords));

      // 4. 排序并返回
      const sortedTitles = scoredTitles.sort((a, b) => b.totalScore - a.totalScore);

      return {
        success: true,
        titles: sortedTitles.slice(0, count),
        platform: rules.name,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('标题生成失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 使用AI生成标题
   */
  async _generateAITitles(topic, keywords, rules, count) {
    const prompt = `你是一个专业的内容标题创作专家。请为以下主题生成 ${count} 个爆款标题。

主题：${topic}
关键词：${keywords.join('、') || '无'}
目标平台：${rules.name}
标题长度：${rules.minTitleLength}-${rules.maxTitleLength}字

【吸引力要求】
1. 使用以下爆款模式之一：
   - 数字型：用数字增加可信度和吸引力
   - 疑问型：引发好奇心和点击欲望
   - 对比型：制造反差，突出价值
   - 情感型：触发情感共鸣
   - 悬念型：制造悬念，引发好奇
   - 利益型：突出实用价值

2. 情感触发技巧：
   - 使用情感词汇（惊喜、感动、震惊等）
   - 制造紧迫感（必看、速看、收藏）
   - 引发好奇心（真相、秘密、没想到）

【合规性要求】
1. 严禁使用以下违禁词：${rules.forbiddenWords.join('、')}
2. 避免夸大宣传、虚假承诺
3. 标题需准确反映内容，不得标题党
4. 符合《广告法》和平台内容规范

【平台特色】
${rules.features.join('；')}

请以JSON格式返回：
[
  {
    "title": "标题内容",
    "pattern": "使用的爆款模式",
    "emotionalTrigger": "情感触发点",
    "compliance": true,
    "complianceReason": "合规性说明",
    "viralScore": 85,
    "clickPrediction": "高/中/低"
  }
]`;

    try {
      const response = await multiAIService.generateContent(prompt, {
        temperature: 0.8,
        maxTokens: 2000
      });

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this._parseTitleResponse(response.content);
    } catch (error) {
      logger.error('AI生成标题失败', { error: error.message });
      return this._generateFallbackTitles(topic, keywords, rules, count);
    }
  }

  /**
   * 验证标题合规性
   */
  _validateTitle(titleObj, rules) {
    const title = titleObj.title || '';
    const issues = [];
    let compliance = true;

    // 检查违禁词
    for (const category of Object.keys(this.forbiddenWords)) {
      for (const word of this.forbiddenWords[category]) {
        if (title.includes(word)) {
          issues.push({
            type: 'forbidden_word',
            word,
            category,
            severity: 'high'
          });
          compliance = false;
        }
      }
    }

    // 检查标题长度
    if (title.length < rules.minTitleLength) {
      issues.push({
        type: 'too_short',
        message: `标题过短，建议${rules.minTitleLength}字以上`,
        severity: 'medium'
      });
    }

    if (title.length > rules.maxTitleLength) {
      issues.push({
        type: 'too_long',
        message: `标题过长，建议${rules.maxTitleLength}字以内`,
        severity: 'medium'
      });
    }

    // 检查标题党特征
    const clickbaitPatterns = ['震惊！', '惊呆了！', '不敢相信！', '看完我哭了', '看完沉默了'];
    for (const pattern of clickbaitPatterns) {
      if (title.includes(pattern)) {
        issues.push({
          type: 'clickbait',
          pattern,
          severity: 'medium',
          message: '可能被视为标题党'
        });
      }
    }

    return {
      ...titleObj,
      compliance,
      issues,
      complianceReason: compliance ? '符合规范' : issues.map(i => i.message || i.word).join('；')
    };
  }

  /**
   * 标题吸引力评分
   */
  _scoreTitle(titleObj, topic, keywords) {
    const title = titleObj.title || '';
    let viralScore = titleObj.viralScore || 50;
    let clickScore = 50;

    // 爆款模式加分
    for (const [patternKey, pattern] of Object.entries(this.viralPatterns)) {
      if (titleObj.pattern === pattern.name || this._containsPattern(title, pattern.templates)) {
        viralScore += pattern.score * 0.1;
      }
    }

    // 关键词匹配加分
    const keywordMatches = keywords.filter(kw => title.includes(kw)).length;
    viralScore += keywordMatches * 5;

    // 情感触发加分
    for (const triggers of Object.values(this.emotionalTriggers)) {
      for (const trigger of triggers) {
        if (title.includes(trigger)) {
          viralScore += 3;
          clickScore += 5;
        }
      }
    }

    // 数字加分
    if (/\d+/.test(title)) {
      viralScore += 5;
      clickScore += 8;
    }

    // 疑问句加分
    if (title.includes('？') || title.includes('?') || title.includes('吗') || title.includes('呢')) {
      viralScore += 5;
      clickScore += 10;
    }

    // 合规性影响
    if (!titleObj.compliance) {
      viralScore -= 20;
      clickScore -= 15;
    }

    // 计算总分
    const totalScore = Math.round((viralScore * 0.6 + clickScore * 0.4));

    return {
      ...titleObj,
      viralScore: Math.min(100, Math.max(0, Math.round(viralScore))),
      clickScore: Math.min(100, Math.max(0, Math.round(clickScore))),
      totalScore: Math.min(100, Math.max(0, totalScore)),
      clickPrediction: totalScore >= 70 ? '高' : totalScore >= 50 ? '中' : '低'
    };
  }

  /**
   * 检查是否包含模式
   */
  _containsPattern(title, templates) {
    for (const template of templates) {
      const pattern = template.replace(/\{[^}]+\}/g, '.*');
      if (new RegExp(pattern).test(title)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 解析标题响应
   */
  _parseTitleResponse(content) {
    const titles = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('"title"') || line.includes("'title'")) {
        const match = line.match(/["']([^"']+)["']/);
        if (match) {
          titles.push({
            title: match[1],
            pattern: '通用',
            viralScore: 70,
            compliance: true
          });
        }
      }
    }

    return titles;
  }

  /**
   * 生成备用标题
   */
  _generateFallbackTitles(topic, keywords, rules, count) {
    const titles = [];
    const patterns = Object.values(this.viralPatterns);

    for (let i = 0; i < count; i++) {
      const pattern = patterns[i % patterns.length];
      const template = pattern.templates[i % pattern.templates.length];
      
      let title = template
        .replace('{主题}', topic)
        .replace(/{数字}/g, Math.floor(Math.random() * 10) + 1);

      if (keywords.length > 0) {
        title = title.replace('{关键词}', keywords[0]);
      }

      titles.push({
        title: title.slice(0, rules.maxTitleLength),
        pattern: pattern.name,
        viralScore: pattern.score,
        compliance: true,
        complianceReason: '基于模板生成，符合规范'
      });
    }

    return titles;
  }

  /**
   * 快速合规性检查
   */
  quickComplianceCheck(title, platform = 'toutiao') {
    const rules = this.platformRules[platform] || this.platformRules.toutiao;
    const issues = [];

    // 检查违禁词
    for (const [category, words] of Object.entries(this.forbiddenWords)) {
      for (const word of words) {
        if (title.includes(word)) {
          issues.push({
            type: 'forbidden_word',
            word,
            category,
            severity: 'high'
          });
        }
      }
    }

    // 检查长度
    if (title.length < rules.minTitleLength) {
      issues.push({
        type: 'too_short',
        message: `标题过短，建议${rules.minTitleLength}字以上`,
        severity: 'medium'
      });
    }

    if (title.length > rules.maxTitleLength) {
      issues.push({
        type: 'too_long',
        message: `标题过长，建议${rules.maxTitleLength}字以内`,
        severity: 'medium'
      });
    }

    return {
      compliant: issues.filter(i => i.severity === 'high').length === 0,
      issues,
      suggestion: issues.length > 0 ? this._generateComplianceSuggestion(issues) : null
    };
  }

  /**
   * 生成合规建议
   */
  _generateComplianceSuggestion(issues) {
    const suggestions = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'forbidden_word':
          suggestions.push(`请替换"${issue.word}"，该词属于${issue.category}类违禁词`);
          break;
        case 'too_short':
          suggestions.push(issue.message);
          break;
        case 'too_long':
          suggestions.push(issue.message);
          break;
        case 'clickbait':
          suggestions.push(`避免使用"${issue.pattern}"等标题党表达`);
          break;
      }
    }

    return suggestions.join('；');
  }

  /**
   * 获取平台规则
   */
  getPlatformRules(platform = 'toutiao') {
    return this.platformRules[platform] || this.platformRules.toutiao;
  }

  /**
   * 获取爆款模式列表
   */
  getViralPatterns() {
    return Object.entries(this.viralPatterns).map(([key, value]) => ({
      id: key,
      name: value.name,
      score: value.score,
      templates: value.templates
    }));
  }
}

module.exports = new TitleGenerationService();
