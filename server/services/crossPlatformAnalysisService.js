/**
 * 跨平台热点对比分析服务
 * 提供不同平台间热点话题的对比、相似度分析、传播路径追踪等功能
 */

const logger = require('../utils/logger');
const { Source } = require('../core/types');

class CrossPlatformAnalysisService {
  constructor() {
    this.similarityCache = new Map();
    this.cacheDuration = 10 * 60 * 1000; // 10分钟缓存
  }

  /**
   * 跨平台热点对比分析
   * @param {Array} topics - 热点话题数组
   * @param {Object} options - 分析选项
   * @returns {Object} 对比分析结果
   */
  async analyzeCrossPlatform(topics, options = {}) {
    const {
      platforms = ['weibo', 'toutiao', 'zhihu'],
      similarityThreshold = 0.6,
      includeSpreadAnalysis = true
    } = options;

    if (!topics || topics.length === 0) {
      return this.getDefaultCrossPlatformResult();
    }

    const analysis = {
      platforms: this.analyzePlatformDistribution(topics),
      similarities: await this.findSimilarTopics(topics, similarityThreshold),
      spreadPatterns: includeSpreadAnalysis ? this.analyzeSpreadPatterns(topics) : null,
      uniqueInsights: this.generateUniqueInsights(topics),
      recommendations: this.generateRecommendations(topics)
    };

    // 缓存结果
    const cacheKey = `cross_${platforms.join('_')}_${topics.length}`;
    this.similarityCache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });

    return analysis;
  }

  /**
   * 分析平台分布情况
   */
  analyzePlatformDistribution(topics) {
    const platformStats = {};
    const totalTopics = topics.length;

    topics.forEach(topic => {
      const source = topic.source || 'unknown';
      if (!platformStats[source]) {
        platformStats[source] = {
          count: 0,
          totalHeat: 0,
          avgHeat: 0,
          topics: []
        };
      }
      
      platformStats[source].count++;
      platformStats[source].totalHeat += topic.heat || 0;
      platformStats[source].topics.push({
        title: topic.title,
        heat: topic.heat,
        publishedAt: topic.publishedAt
      });
    });

    // 计算平均热度
    Object.values(platformStats).forEach(stat => {
      stat.avgHeat = stat.totalHeat / stat.count;
      stat.percentage = (stat.count / totalTopics * 100).toFixed(1);
      stat.topics.sort((a, b) => b.heat - a.heat).slice(0, 5); // 取前5个热门话题
    });

    return {
      distribution: platformStats,
      totalPlatforms: Object.keys(platformStats).length,
      dominantPlatform: this.findDominantPlatform(platformStats),
      platformDiversity: this.calculatePlatformDiversity(platformStats)
    };
  }

  /**
   * 查找相似话题
   */
  async findSimilarTopics(topics, threshold) {
    const similarities = [];
    const processedPairs = new Set();

    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const topic1 = topics[i];
        const topic2 = topics[j];
        
        // 避免重复比较同一对
        const pairKey = `${Math.min(i,j)}_${Math.max(i,j)}`;
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        // 只比较不同平台的话题
        if (topic1.source === topic2.source) continue;

        const similarity = await this.calculateTopicSimilarity(topic1, topic2);
        if (similarity >= threshold) {
          similarities.push({
            topic1: {
              id: topic1._id,
              title: topic1.title,
              source: topic1.source,
              heat: topic1.heat
            },
            topic2: {
              id: topic2._id,
              title: topic2.title,
              source: topic2.source,
              heat: topic2.heat
            },
            similarity: parseFloat(similarity.toFixed(3)),
            timeGap: Math.abs(new Date(topic1.publishedAt) - new Date(topic2.publishedAt))
          });
        }
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // 取前20个最相似的
  }

  /**
   * 计算话题相似度
   */
  async calculateTopicSimilarity(topic1, topic2) {
    const title1 = topic1.title || '';
    const title2 = topic2.title || '';
    
    // 标题相似度（基于编辑距离）
    const titleSimilarity = this.calculateStringSimilarity(title1, title2);
    
    // 关键词重叠度
    const keywords1 = new Set(topic1.keywords || []);
    const keywords2 = new Set(topic2.keywords || []);
    const keywordOverlap = this.calculateSetOverlap(keywords1, keywords2);
    
    // 分类一致性
    const categoryMatch = topic1.category === topic2.category ? 1 : 0;
    
    // 综合相似度计算
    return titleSimilarity * 0.5 + keywordOverlap * 0.3 + categoryMatch * 0.2;
  }

  /**
   * 计算字符串相似度（编辑距离算法）
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[s2.length][s1.length];
    return 1 - distance / Math.max(s1.length, s2.length);
  }

  /**
   * 计算集合重叠度
   */
  calculateSetOverlap(set1, set2) {
    if (set1.size === 0 || set2.size === 0) return 0;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * 分析传播模式
   */
  analyzeSpreadPatterns(topics) {
    const patterns = {
      originFirst: [], // 原创首发
      fastSpread: [],  // 快速传播
      delayedReaction: [], // 延迟反应
      platformExclusive: [] // 平台独占
    };

    // 按标题分组
    const titleGroups = this.groupByTitle(topics);

    Object.entries(titleGroups).forEach(([title, groupTopics]) => {
      if (groupTopics.length < 2) {
        patterns.platformExclusive.push(groupTopics[0]);
        return;
      }

      // 按发布时间排序
      const sortedTopics = groupTopics.sort((a, b) => 
        new Date(a.publishedAt) - new Date(b.publishedAt)
      );

      const firstTopic = sortedTopics[0];
      const timeSpan = new Date(sortedTopics[sortedTopics.length - 1].publishedAt) - 
                      new Date(firstTopic.publishedAt);

      // 判断传播模式
      if (timeSpan < 30 * 60 * 1000) { // 30分钟内
        patterns.fastSpread.push({
          title,
          topics: sortedTopics,
          spreadTime: timeSpan
        });
      } else if (timeSpan > 2 * 60 * 60 * 1000) { // 超过2小时
        patterns.delayedReaction.push({
          title,
          topics: sortedTopics,
          reactionTime: timeSpan
        });
      } else {
        patterns.originFirst.push({
          title,
          origin: firstTopic,
          followers: sortedTopics.slice(1)
        });
      }
    });

    return {
      summary: {
        totalUnique: Object.keys(titleGroups).length,
        fastSpreadCount: patterns.fastSpread.length,
        delayedReactionCount: patterns.delayedReaction.length,
        platformExclusiveCount: patterns.platformExclusive.length
      },
      patterns
    };
  }

  /**
   * 按标题分组话题
   */
  groupByTitle(topics) {
    const groups = {};
    
    topics.forEach(topic => {
      // 标准化标题用于分组
      const normalizedTitle = this.normalizeTitle(topic.title);
      if (!groups[normalizedTitle]) {
        groups[normalizedTitle] = [];
      }
      groups[normalizedTitle].push(topic);
    });

    return groups;
  }

  /**
   * 标准化标题
   */
  normalizeTitle(title) {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 移除标点符号
      .replace(/\s+/g, ' ') // 规范化空格
      .trim();
  }

  /**
   * 生成独特见解
   */
  generateUniqueInsights(topics) {
    const insights = [];
    
    // 平台特色分析
    const platformCharacteristics = this.analyzePlatformCharacteristics(topics);
    insights.push({
      type: 'platform_characteristics',
      title: '平台内容特色',
      description: platformCharacteristics.summary,
      data: platformCharacteristics.details
    });

    // 时效性分析
    const timeliness = this.analyzeTimeliness(topics);
    insights.push({
      type: 'timeliness',
      title: '内容时效性',
      description: timeliness.summary,
      data: timeliness.details
    });

    // 热度分布分析
    const heatDistribution = this.analyzeHeatDistribution(topics);
    insights.push({
      type: 'heat_distribution',
      title: '热度分布特征',
      description: heatDistribution.summary,
      data: heatDistribution.details
    });

    return insights;
  }

  /**
   * 分析平台特色
   */
  analyzePlatformCharacteristics(topics) {
    const characteristics = {};
    
    topics.forEach(topic => {
      const source = topic.source || 'unknown';
      if (!characteristics[source]) {
        characteristics[source] = {
          categories: {},
          avgLength: 0,
          totalTopics: 0
        };
      }
      
      const char = characteristics[source];
      char.totalTopics++;
      
      // 分类统计
      const category = topic.category || 'other';
      char.categories[category] = (char.categories[category] || 0) + 1;
      
      // 标题长度统计
      char.avgLength += (topic.title || '').length;
    });

    // 计算平均值
    Object.values(characteristics).forEach(char => {
      char.avgLength = Math.round(char.avgLength / char.totalTopics);
      char.dominantCategory = Object.entries(char.categories)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'other';
    });

    return {
      summary: '各平台在内容类型和表达方式上呈现差异化特征',
      details: characteristics
    };
  }

  /**
   * 分析时效性
   */
  analyzeTimeliness(topics) {
    const now = new Date();
    const timeStats = {
      recent: 0,    // 1小时内
      current: 0,   // 1-6小时
      trending: 0,  // 6-24小时
      archived: 0   // 超过24小时
    };

    topics.forEach(topic => {
      const age = now - new Date(topic.publishedAt);
      const hours = age / (1000 * 60 * 60);

      if (hours <= 1) timeStats.recent++;
      else if (hours <= 6) timeStats.current++;
      else if (hours <= 24) timeStats.trending++;
      else timeStats.archived++;
    });

    const total = topics.length;
    return {
      summary: `内容时效性良好，${((timeStats.recent + timeStats.current) / total * 100).toFixed(1)}%为近期热点`,
      details: Object.entries(timeStats).reduce((acc, [key, count]) => {
        acc[key] = {
          count,
          percentage: (count / total * 100).toFixed(1)
        };
        return acc;
      }, {})
    };
  }

  /**
   * 分析热度分布
   */
  analyzeHeatDistribution(topics) {
    const distribution = {
      viral: 0,     // 90-100 病毒式传播
      hot: 0,       // 70-89 热门
      warm: 0,      // 40-69 温热
      cool: 0       // 0-39 冷门
    };

    topics.forEach(topic => {
      const heat = topic.heat || 0;
      if (heat >= 90) distribution.viral++;
      else if (heat >= 70) distribution.hot++;
      else if (heat >= 40) distribution.warm++;
      else distribution.cool++;
    });

    const total = topics.length;
    return {
      summary: `热度分布较为均衡，其中热门内容占比${((distribution.hot + distribution.viral) / total * 100).toFixed(1)}%`,
      details: Object.entries(distribution).reduce((acc, [key, count]) => {
        acc[key] = {
          count,
          percentage: (count / total * 100).toFixed(1)
        };
        return acc;
      }, {})
    };
  }

  /**
   * 生成推荐建议
   */
  generateRecommendations(topics) {
    const recommendations = [];
    const platformStats = this.analyzePlatformDistribution(topics);

    // 平台覆盖建议
    if (platformStats.totalPlatforms < 3) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        title: '扩大平台覆盖',
        description: `当前仅覆盖${platformStats.totalPlatforms}个平台，建议增加更多数据源`
      });
    }

    // 内容时效建议
    const timeliness = this.analyzeTimeliness(topics);
    if (parseFloat(timeliness.details.archived.percentage) > 30) {
      recommendations.push({
        type: 'timeliness',
        priority: 'medium',
        title: '提升内容新鲜度',
        description: '较多历史内容，建议加强实时热点抓取'
      });
    }

    // 热度优化建议
    const heatDist = this.analyzeHeatDistribution(topics);
    if (parseFloat(heatDist.details.viral.percentage) < 5) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        title: '挖掘爆款潜力',
        description: '病毒式传播内容较少，可加强优质内容识别'
      });
    }

    return recommendations;
  }

  /**
   * 找到主导平台
   */
  findDominantPlatform(platformStats) {
    let dominant = null;
    let maxCount = 0;

    Object.entries(platformStats).forEach(([platform, stats]) => {
      if (stats.count > maxCount) {
        maxCount = stats.count;
        dominant = platform;
      }
    });

    return dominant;
  }

  /**
   * 计算平台多样性
   */
  calculatePlatformDiversity(platformStats) {
    const counts = Object.values(platformStats).map(stat => stat.count);
    if (counts.length <= 1) return 0;

    const total = counts.reduce((sum, count) => sum + count, 0);
    const proportions = counts.map(count => count / total);

    // 计算香农熵
    const entropy = -proportions.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(counts.length);

    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * 获取默认结果
   */
  getDefaultCrossPlatformResult() {
    return {
      platforms: {
        distribution: {},
        totalPlatforms: 0,
        dominantPlatform: null,
        platformDiversity: 0
      },
      similarities: [],
      spreadPatterns: null,
      uniqueInsights: [],
      recommendations: []
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.similarityCache.clear();
    logger.info('[CrossPlatformAnalysisService] 缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.similarityCache.size,
      keys: Array.from(this.similarityCache.keys())
    };
  }
}

module.exports = new CrossPlatformAnalysisService();