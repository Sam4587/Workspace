/**
 * 话题分析器
 * 负责分类、关键词提取、适配度评分等
 */

const { Category } = require('./types');

class TopicAnalyzer {
  constructor() {
    // 分类关键词映射
    this.categoryKeywords = {
      [Category.ENTERTAINMENT]: ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐', '演员', '导演', '票房', '演唱会'],
      [Category.TECH]: ['AI', '人工智能', '科技', '互联网', '手机', '数码', '编程', '代码', '软件', '硬件', '芯片', 'GPT'],
      [Category.FINANCE]: ['股市', '经济', '金融', '投资', '房价', '财经', '股票', '基金', '银行', '利率'],
      [Category.SPORTS]: ['足球', '篮球', '奥运', '体育', '运动员', '比赛', '世界杯', 'NBA', '中超'],
      [Category.SOCIETY]: ['社会', '民生', '政策', '教育', '医疗', '交通', '天气', '就业', '养老'],
      [Category.INTERNATIONAL]: ['国际', '外交', '战争', '政治', '国家', '联合国', '美国', '欧洲', '日本']
    };

    // 停用词列表
    this.stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
      '自己', '这', '那', '么', '他', '她', '它', '们', '什么', '怎么', '如何', '为什么',
      '这个', '那个', '哪些', '哪个', '多少', '几', '可以', '能', '应该', '必须', '可能'
    ]);
  }

  /**
   * 分类话题
   * @param {string} title - 话题标题
   * @returns {string} - 分类
   */
  categorize(title) {
    if (!title || typeof title !== 'string') {
      return Category.OTHER;
    }

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }

    return Category.OTHER;
  }

  /**
   * 批量分类
   * @param {string[]} titles - 标题数组
   * @returns {string[]} - 分类数组
   */
  categorizeBatch(titles) {
    return titles.map(title => this.categorize(title));
  }

  /**
   * 提取关键词
   * @param {string} text - 文本
   * @param {number} limit - 返回数量限制
   * @returns {string[]}
   */
  extractKeywords(text, limit = 5) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // 分词（简单实现，按标点和空格分割）
    const words = text.split(/[\s,，。！？；：""''（）()【】《》\[\]、]/);

    // 过滤停用词和短词
    const keywords = words
      .filter(word => word.length > 1 && !this.stopWords.has(word))
      .filter(word => !/^\d+$/.test(word)); // 过滤纯数字

    // 去重
    const uniqueKeywords = [...new Set(keywords)];

    return uniqueKeywords.slice(0, limit);
  }

  /**
   * 批量提取关键词
   * @param {string[]} texts - 文本数组
   * @param {number} limit - 每个文本的关键词数量限制
   * @returns {string[][]}
   */
  extractKeywordsBatch(texts, limit = 5) {
    return texts.map(text => this.extractKeywords(text, limit));
  }

  /**
   * 计算适配度评分
   * @param {string} title - 话题标题
   * @param {string} [description] - 话题描述
   * @returns {number} - 适配度 (0-100)
   */
  calculateSuitability(title, description = '') {
    let score = 50;
    const fullText = `${title} ${description}`;

    // 标题长度适中
    if (title.length >= 10 && title.length <= 50) {
      score += 20;
    } else if (title.length >= 5 && title.length <= 100) {
      score += 10;
    }

    // 包含疑问词或感叹词（引发关注）
    if (/[？?!！]/.test(fullText)) {
      score += 10;
    }

    // 包含时效性关键词
    if (/最新|突发|刚刚|重磅|震惊|曝光|揭秘|首次|独家/.test(fullText)) {
      score += 15;
    }

    // 包含数字（具体数据）
    if (/\d+/.test(fullText)) {
      score += 5;
    }

    // 包含热点人物或事件关键词
    if (/明星|网红|官方|通报|调查|宣布|发布/.test(fullText)) {
      score += 10;
    }

    // 避免敏感或低质量内容
    if (/广告|推广|优惠|折扣|领取|免费送/.test(fullText)) {
      score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 批量计算适配度
   * @param {Array<{title: string, description?: string}>} topics - 话题数组
   * @returns {number[]}
   */
  calculateSuitabilityBatch(topics) {
    return topics.map(t => this.calculateSuitability(t.title, t.description));
  }

  /**
   * 提取热门关键词
   * @param {Array<{keywords?: string[]}>} topics - 话题数组
   * @param {number} limit - 返回数量限制
   * @returns {Array<{keyword: string, count: number}>}
   */
  extractTopKeywords(topics, limit = 20) {
    const keywordCount = {};

    for (const topic of topics) {
      if (!topic.keywords) continue;
      for (const keyword of topic.keywords) {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      }
    }

    return Object.entries(keywordCount)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 分析话题情感倾向
   * @param {string} text - 文本
   * @returns {{ sentiment: string, confidence: number }}
   */
  analyzeSentiment(text) {
    const positiveWords = ['好', '棒', '赞', '优秀', '成功', '突破', '创新', '领先', '最佳', '喜爱'];
    const negativeWords = ['差', '坏', '糟', '失败', '问题', '风险', '危机', '下跌', '损失', '批评'];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) positiveScore++;
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeScore++;
    }

    const total = positiveScore + negativeScore;
    if (total === 0) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }

    if (positiveScore > negativeScore) {
      return { sentiment: 'positive', confidence: positiveScore / total };
    } else if (negativeScore > positiveScore) {
      return { sentiment: 'negative', confidence: negativeScore / total };
    }

    return { sentiment: 'neutral', confidence: 0.5 };
  }

  /**
   * 获取分类统计
   * @param {Array<{category: string}>} topics - 话题数组
   * @returns {Object}
   */
  getCategoryStats(topics) {
    const stats = {};

    for (const topic of topics) {
      const category = topic.category || Category.OTHER;
      stats[category] = (stats[category] || 0) + 1;
    }

    return stats;
  }
}

// 单例模式
const topicAnalyzer = new TopicAnalyzer();

module.exports = {
  TopicAnalyzer,
  topicAnalyzer
};
