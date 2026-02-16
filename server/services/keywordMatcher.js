const logger = require('../utils/logger');

class KeywordMatcher {
  constructor() {
    this.commonWords = [
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到',
      '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'
    ];

    this.globalFilters = [
      '广告', '推广', '营销', '震惊', '标题党', '爆料', '兼职', '刷单',
      '代刷', '涨粉', '互粉', '互赞', '互推', '推广费'
    ];

    this.wordGroups = {
      '科技': ['AI', '人工智能', '科技', '互联网', '手机', '数码', '华为', '苹果', '小米'],
      '财经': ['股市', '经济', '金融', '投资', '房价', '财经', '基金', '股票', 'A股'],
      '汽车': ['汽车', '比亚迪', '特斯拉', '马斯克', '新能源', '电动车'],
      '手机新品': ['iPhone', '华为', 'OPPO', '苹果', '三星', 'vivo', '一加', '魅族', '发布', '新品'],
      '股市行情': ['A股', '上证', '深证', '涨跌', '涨停', '跌停', '牛市', '熊市']
    };
  }

  parseKeywordConfig(keywords) {
    const parsed = {
      groups: {},
      mustHave: [],
      exclude: [],
      quantity: null
    };

    if (typeof keywords === 'string') {
      keywords = keywords.split('\n').filter(k => k.trim() && !k.trim().startsWith('#'));
    }

    for (const keyword of keywords) {
      if (keyword.trim() === '') continue;

      if (keyword.startsWith('[') && keyword.endsWith(']')) {
        const groupName = keyword.slice(1, -1).trim();
        if (!parsed.groups[groupName]) {
          parsed.groups[groupName] = [];
        }
        parsed.groups[groupName].push({
          name: groupName,
          pattern: keyword
        });
      } else if (keyword.startsWith('+')) {
        const mustWord = keyword.slice(1).trim();
        if (mustWord) parsed.mustHave.push(mustWord);
      } else if (keyword.startsWith('!')) {
        const excludeWord = keyword.slice(1).trim();
        if (excludeWord) parsed.exclude.push(excludeWord);
      } else if (keyword.startsWith('@')) {
        const num = parseInt(keyword.slice(1));
        if (!isNaN(num)) {
          parsed.quantity = num;
        }
      } else if (keyword.startsWith('/pattern/')) {
        const pattern = keyword.slice(9).trim();
        parsed.regexPattern = pattern;
      } else {
        if (!parsed.groups['default']) {
          parsed.groups['default'] = [];
        }
        parsed.groups['default'].push({
          name: 'default',
          pattern: keyword
        });
      }
    }

    return parsed;
  }

  matchTopic(topic, config) {
    const title = topic.title || '';
    const description = topic.description || '';
    const text = `${title} ${description}`.toLowerCase();

    if (this.globalFilters.some(filter => text.includes(filter.toLowerCase()))) {
      logger.debug(`全局过滤: ${title}`);
      return { match: false, reason: 'global_filter' };
    }

    if (config.mustHave && config.mustHave.length > 0) {
      const hasAll = config.mustHave.every(word => text.includes(word.toLowerCase()));
      if (!hasAll) {
        return { match: false, reason: 'missing_must' };
      }
    }

    if (config.exclude && config.exclude.length > 0) {
      const hasAny = config.exclude.some(word => text.includes(word.toLowerCase()));
      if (hasAny) {
        return { match: false, reason: 'in_exclude' };
      }
    }

    if (config.regexPattern) {
      try {
        const regex = new RegExp(config.regexPattern, 'i');
        if (!regex.test(title)) {
          return { match: false, reason: 'regex_no_match' };
        }
      } catch (error) {
        logger.warn(`正则表达式解析失败: ${config.regexPattern}`);
      }
    }

    let score = 0;
    let matchedGroups = [];

    for (const [groupName, groupKeywords] of Object.entries(this.wordGroups)) {
      if (config.groups && Object.keys(config.groups).length > 0) {
        if (!config.groups[groupName]) continue;
      }

      const matched = groupKeywords.some(keyword => {
        if (config.mustHave && config.mustHave.length > 0) {
          return config.mustHave.every(must => keyword.includes(must));
        }
        return text.includes(keyword.toLowerCase());
      });

      if (matched) {
        score += 1;
        matchedGroups.push(groupName);
      }
    }

    return {
      match: true,
      score,
      matchedGroups,
      displayReason: config.groups && config.groups.default ? this.getDisplayReason(config.groups.default) : null
    };
  }

  getDisplayReason(defaultGroup) {
    const reasons = defaultGroup.map(g => g.pattern);
    return reasons.join(', ');
  }

  filterTopics(topics, config) {
    const filtered = [];
    const skipped = [];

    for (const topic of topics) {
      const result = this.matchTopic(topic, config);

      if (result.match) {
        filtered.push({
          ...topic,
          matchScore: result.score,
          matchedGroups: result.matchedGroups
        });
      } else {
        skipped.push({
          title: topic.title,
          reason: result.reason
        });
      }
    }

    filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    if (config.quantity) {
      const groupCounts = {};
      filtered.forEach(topic => {
        topic.matchedGroups.forEach(group => {
          groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
      });

      const limited = [];
      const usedGroups = new Set();

      for (const topic of filtered) {
        const availableGroups = topic.matchedGroups.filter(g => !usedGroups.has(g));

        if (availableGroups.length === 0) continue;

        const groupWithLeast = availableGroups.reduce((min, curr) =>
          (groupCounts[curr] || 0) < (groupCounts[min] || 0) ? curr : min
        );

        if (limited.length < config.quantity) {
          limited.push(topic);
          usedGroups.add(groupWithLeast);
        }
      }

      logger.info(`数量限制: ${filtered.length} -> ${limited.length} 条`);
      return limited;
    }

    logger.info(`关键词过滤: ${topics.length} -> ${filtered.length} 条`);
    logger.debug(`跳过: ${skipped.length} 条`, { skipped });

    return {
      filtered,
      skipped,
      summary: {
        total: topics.length,
        matched: filtered.length,
        skipped: skipped.length,
        globalFiltered: skipped.filter(s => s.reason === 'global_filter').length
      }
    };
  }

  extractKeywords(text) {
    if (!text) return [];

    const cleanText = text
      .replace(/[^\u4e00-\u9fa5\s\w]/g, '')
      .replace(/[^\u4e00-\u9fa5]/g, '')
      .toLowerCase();

    const words = cleanText.split(/[\s,，。！？；：""''（）()【】《》\[\]]/);

    return words
      .filter(word => word.length > 1 && !this.commonWords.includes(word))
      .slice(0, 5);
  }

  validateKeywordConfig(config) {
    const errors = [];

    if (config.regexPattern) {
      try {
        new RegExp(config.regexPattern);
      } catch (error) {
        errors.push(`正则表达式无效: ${config.regexPattern}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new KeywordMatcher();
