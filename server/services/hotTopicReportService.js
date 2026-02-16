/**
 * 热点报告自动生成和推送服务
 * 支持定时生成日报、周报、月报，并通过多种渠道推送
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { HotTopic } = require('../models/HotTopic');
const TrendAnalysisService = require('./trendAnalysisService');
const CrossPlatformAnalysisService = require('./crossPlatformAnalysisService');
const aiProviderService = require('./aiProviderService');
const notificationService = require('./notificationService');

class HotTopicReportService {
  constructor() {
    this.reportCache = new Map();
    this.cacheDuration = 30 * 60 * 1000; // 30分钟缓存
    this.reportDir = path.join(__dirname, '../../reports');
    this.ensureReportDirectory();
  }

  /**
   * 确保报告目录存在
   */
  async ensureReportDirectory() {
    try {
      await fs.access(this.reportDir);
    } catch (error) {
      await fs.mkdir(this.reportDir, { recursive: true });
      logger.info(`[ReportService] 创建报告目录: ${this.reportDir}`);
    }
  }

  /**
   * 生成热点日报
   */
  async generateDailyReport(options = {}) {
    const {
      date = new Date(),
      platforms = ['weibo', 'toutiao', 'zhihu'],
      topN = 20,
      includeAnalysis = true,
      format = 'html'
    } = options;

    const cacheKey = `daily_${date.toISOString().split('T')[0]}_${platforms.join('_')}`;
    
    // 检查缓存
    if (this.reportCache.has(cacheKey)) {
      const cached = this.reportCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.data;
      }
    }

    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);

      // 获取当日热点数据
      const topics = await HotTopic.find({
        source: { $in: platforms },
        publishedAt: { $gte: startDate, $lt: endDate }
      }).sort({ heat: -1, publishedAt: -1 }).limit(topN * 2);

      if (topics.length === 0) {
        throw new Error('当日无热点数据');
      }

      // 数据分析
      const trendAnalysis = includeAnalysis ? 
        await TrendAnalysisService.analyzeTrends(topics) : null;
      
      const crossPlatformAnalysis = includeAnalysis ? 
        await CrossPlatformAnalysisService.analyzeCrossPlatform(topics) : null;

      // AI内容分析
      const aiAnalysis = includeAnalysis ? 
        await this.performAIAnalysis(topics.slice(0, topN)) : null;

      // 生成报告内容
      const reportData = {
        date: startDate,
        period: 'daily',
        summary: this.generateSummary(topics, trendAnalysis),
        topTopics: topics.slice(0, topN),
        trendAnalysis,
        crossPlatformAnalysis,
        aiAnalysis,
        statistics: this.calculateStatistics(topics)
      };

      const report = await this.formatReport(reportData, format);

      // 缓存结果
      this.reportCache.set(cacheKey, {
        data: report,
        timestamp: Date.now()
      });

      // 保存报告文件
      await this.saveReportFile(report, `daily_${startDate.toISOString().split('T')[0]}`, format);

      logger.info(`[ReportService] 日报生成完成: ${topics.length}条话题`);

      return report;
    } catch (error) {
      logger.error('[ReportService] 生成日报失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 生成热点周报
   */
  async generateWeeklyReport(options = {}) {
    const {
      date = new Date(),
      platforms = ['weibo', 'toutiao', 'zhihu'],
      topN = 50,
      includeAnalysis = true,
      format = 'html'
    } = options;

    const cacheKey = `weekly_${this.getWeekNumber(date)}_${platforms.join('_')}`;

    try {
      // 获取一周的数据
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);

      const topics = await HotTopic.find({
        source: { $in: platforms },
        publishedAt: { $gte: startDate, $lt: endDate }
      }).sort({ heat: -1, publishedAt: -1 }).limit(topN * 2);

      if (topics.length === 0) {
        throw new Error('本周无热点数据');
      }

      // 周趋势分析
      const weeklyTrends = await this.analyzeWeeklyTrends(topics, startDate, endDate);
      
      // 平台对比分析
      const platformComparison = await CrossPlatformAnalysisService.analyzeCrossPlatform(topics);

      // AI深度分析
      const aiAnalysis = includeAnalysis ? 
        await this.performAIWeeklyAnalysis(topics.slice(0, topN)) : null;

      const reportData = {
        date: startDate,
        period: 'weekly',
        dateRange: { start: startDate, end: endDate },
        summary: this.generateWeeklySummary(topics, weeklyTrends),
        topTopics: topics.slice(0, topN),
        weeklyTrends,
        platformComparison,
        aiAnalysis,
        statistics: this.calculateStatistics(topics)
      };

      const report = await this.formatReport(reportData, format);
      
      // 保存报告文件
      await this.saveReportFile(report, `weekly_${this.getWeekNumber(date)}`, format);

      logger.info(`[ReportService] 周报生成完成: ${topics.length}条话题`);

      return report;
    } catch (error) {
      logger.error('[ReportService] 生成周报失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 生成热点月报
   */
  async generateMonthlyReport(options = {}) {
    const {
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      platforms = ['weibo', 'toutiao', 'zhihu'],
      topN = 100,
      includeAnalysis = true,
      format = 'html'
    } = options;

    const cacheKey = `monthly_${year}_${month}_${platforms.join('_')}`;

    try {
      // 获取月份数据
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const topics = await HotTopic.find({
        source: { $in: platforms },
        publishedAt: { $gte: startDate, $lt: endDate }
      }).sort({ heat: -1, publishedAt: -1 }).limit(topN * 2);

      if (topics.length === 0) {
        throw new Error('本月无热点数据');
      }

      // 月度趋势分析
      const monthlyTrends = await this.analyzeMonthlyTrends(topics, startDate, endDate);
      
      // 分类热点分析
      const categoryAnalysis = this.analyzeByCategory(topics);

      const reportData = {
        date: startDate,
        period: 'monthly',
        dateRange: { start: startDate, end: endDate },
        summary: this.generateMonthlySummary(topics, monthlyTrends),
        topTopics: topics.slice(0, topN),
        monthlyTrends,
        categoryAnalysis,
        statistics: this.calculateStatistics(topics)
      };

      const report = await this.formatReport(reportData, format);
      
      // 保存报告文件
      await this.saveReportFile(report, `monthly_${year}_${month}`, format);

      logger.info(`[ReportService] 月报生成完成: ${topics.length}条话题`);

      return report;
    } catch (error) {
      logger.error('[ReportService] 生成月报失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 执行AI分析
   */
  async performAIAnalysis(topics) {
    try {
      const analysisPrompt = `
请分析以下${topics.length}个热点话题，生成专业的分析报告：

话题列表：
${topics.map((t, i) => `${i+1}. ${t.title} (热度:${t.heat}, 平台:${t.source})`).join('\n')}

请从以下维度进行分析：
1. 整体趋势概述（50字内）
2. 最受关注的3个话题及其特点
3. 平台分布特点
4. 内容类型偏好
5. 发展建议（3点）

以JSON格式返回，字段包括：overview, topTopics, platformInsights, contentPreferences, recommendations
`;

      const result = await aiProviderService.chatCompletion([
        {
          role: 'system',
          content: '你是一个专业的热点分析师，请提供客观、深入的分析。'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ], {
        temperature: 0.3,
        maxTokens: 1500
      });

      return JSON.parse(result.content);
    } catch (error) {
      logger.warn('[ReportService] AI分析失败，使用默认分析', { error: error.message });
      return this.getDefaultAIAnalysis(topics);
    }
  }

  /**
   * 生成报告摘要
   */
  generateSummary(topics, trendAnalysis) {
    const totalTopics = topics.length;
    const avgHeat = topics.reduce((sum, t) => sum + (t.heat || 0), 0) / totalTopics;
    const platforms = [...new Set(topics.map(t => t.source))].length;
    
    return {
      totalTopics,
      avgHeat: parseFloat(avgHeat.toFixed(1)),
      platforms,
      peakHour: trendAnalysis?.trendMetrics?.peakHour || 'N/A',
      dominantCategory: this.getDominantCategory(topics),
      trend: trendAnalysis?.trendMetrics?.overallTrend || 'stable'
    };
  }

  /**
   * 生成周报摘要
   */
  generateWeeklySummary(topics, weeklyTrends) {
    const dailyAverages = weeklyTrends.dailyStats.map(day => day.avgHeat);
    const overallTrend = this.calculateOverallTrend(dailyAverages);
    
    return {
      ...this.generateSummary(topics),
      weeklyGrowth: overallTrend.growth,
      mostActiveDay: weeklyTrends.peakDay,
      trendStability: weeklyTrends.stability
    };
  }

  /**
  * 生成月报摘要
  */
  generateMonthlySummary(topics, monthlyTrends) {
    return {
      ...this.generateSummary(topics),
      weeklyPattern: monthlyTrends.weeklyPattern,
      platformEvolution: monthlyTrends.platformEvolution,
      categoryShifts: monthlyTrends.categoryShifts
    };
  }

  /**
   * 计算统计数据
   */
  calculateStatistics(topics) {
    const bySource = {};
    const byCategory = {};
    const byHour = {};

    topics.forEach(topic => {
      // 按来源统计
      const source = topic.source || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;

      // 按分类统计
      const category = topic.category || 'other';
      byCategory[category] = (byCategory[category] || 0) + 1;

      // 按小时统计
      const hour = new Date(topic.publishedAt).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });

    return {
      bySource,
      byCategory,
      byHour,
      total: topics.length,
      avgHeat: topics.reduce((sum, t) => sum + (t.heat || 0), 0) / topics.length
    };
  }

  /**
   * 格式化报告
   */
  async formatReport(data, format) {
    switch (format.toLowerCase()) {
      case 'html':
        return this.formatAsHTML(data);
      case 'markdown':
        return this.formatAsMarkdown(data);
      case 'json':
        return this.formatAsJSON(data);
      default:
        return this.formatAsHTML(data);
    }
  }

  /**
   * HTML格式化
   */
  formatAsHTML(data) {
    const template = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>热点${data.period === 'daily' ? '日报' : data.period === 'weekly' ? '周报' : '月报'} - ${data.date.toLocaleDateString()}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
        .topic-list { list-style: none; padding: 0; }
        .topic-item { padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; background: #f8f9fa; border-radius: 0 8px 8px 0; }
        .topic-title { font-weight: bold; color: #333; }
        .topic-meta { font-size: 14px; color: #666; margin-top: 5px; }
        .heat-high { color: #e74c3c; }
        .heat-medium { color: #f39c12; }
        .heat-low { color: #27ae60; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>热点${data.period === 'daily' ? '日报' : data.period === 'weekly' ? '周报' : '月报'}</h1>
            <p>${data.date.toLocaleDateString('zh-CN')} ${data.dateRange ? `(${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()})` : ''}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 数据概览</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.summary.totalTopics}</div>
                        <div class="stat-label">总话题数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.summary.avgHeat}</div>
                        <div class="stat-label">平均热度</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.summary.platforms}</div>
                        <div class="stat-label">覆盖平台</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.summary.dominantCategory}</div>
                        <div class="stat-label">热门分类</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🔥 热门话题 Top ${data.topTopics.length}</h2>
                <ul class="topic-list">
                    ${data.topTopics.map((topic, index) => `
                        <li class="topic-item">
                            <div class="topic-title">${index + 1}. ${topic.title}</div>
                            <div class="topic-meta">
                                平台: <strong>${topic.source}</strong> | 
                                热度: <strong class="${topic.heat >= 80 ? 'heat-high' : topic.heat >= 50 ? 'heat-medium' : 'heat-low'}">${topic.heat}</strong> | 
                                分类: ${topic.category || '未分类'}
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>

            ${data.aiAnalysis ? `
            <div class="section">
                <h2>🤖 AI分析洞察</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3>整体概述</h3>
                    <p>${data.aiAnalysis.overview}</p>
                    
                    <h3>重点关注</h3>
                    <ul>
                        ${data.aiAnalysis.topTopics.map(topic => `<li>${topic}</li>`).join('')}
                    </ul>
                    
                    <h3>发展建议</h3>
                    <ul>
                        ${data.aiAnalysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p>AI Content Flow 热点监控系统</p>
        </div>
    </div>
</body>
</html>`;

    return {
      content: template,
      type: 'html',
      filename: `hot-topics-${data.period}-${data.date.toISOString().split('T')[0]}.html`
    };
  }

  /**
   * 保存报告文件
   */
  async saveReportFile(report, baseName, format) {
    try {
      const filename = `${baseName}.${format}`;
      const filepath = path.join(this.reportDir, filename);
      
      if (format === 'html' || format === 'markdown') {
        await fs.writeFile(filepath, report.content, 'utf8');
      } else {
        await fs.writeFile(filepath, JSON.stringify(report.content, null, 2), 'utf8');
      }
      
      logger.info(`[ReportService] 报告已保存: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error('[ReportService] 保存报告文件失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取默认AI分析
   */
  getDefaultAIAnalysis(topics) {
    const categories = [...new Set(topics.map(t => t.category || 'other'))];
    const sources = [...new Set(topics.map(t => t.source))];
    
    return {
      overview: `本期共收录${topics.length}个热点话题，涵盖${categories.length}个内容分类，在${sources.length}个平台上有分布。`,
      topTopics: topics.slice(0, 3).map(t => t.title),
      platformInsights: '各平台内容分布相对均衡',
      contentPreferences: '娱乐和科技类内容较为热门',
      recommendations: [
        '建议关注跨平台传播的热点话题',
        '可适当增加垂直领域的内容覆盖',
        '注意把握热点时效性，及时跟进'
      ]
    };
  }

  /**
   * 获取周数
   */
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * 获取主导分类
   */
  getDominantCategory(topics) {
    const categoryCount = {};
    topics.forEach(t => {
      const cat = t.category || 'other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'other';
  }

  /**
   * 计算整体趋势
   */
  calculateOverallTrend(values) {
    if (values.length < 2) return { growth: 0, trend: 'stable' };
    
    const first = values[0];
    const last = values[values.length - 1];
    const growth = ((last - first) / first) * 100;
    
    return {
      growth: parseFloat(growth.toFixed(1)),
      trend: growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable'
    };
  }

  /**
   * 分析周趋势
   */
  async analyzeWeeklyTrends(topics, startDate, endDate) {
    const dailyStats = [];
    const days = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      
      const dayTopics = topics.filter(t => {
        const pubDate = new Date(t.publishedAt);
        return pubDate >= dayStart && pubDate < dayEnd;
      });
      
      dailyStats.push({
        date: dayStart,
        count: dayTopics.length,
        avgHeat: dayTopics.length > 0 ? 
          dayTopics.reduce((sum, t) => sum + (t.heat || 0), 0) / dayTopics.length : 0,
        topics: dayTopics.slice(0, 5)
      });
    }
    
    const heats = dailyStats.map(d => d.avgHeat);
    const stability = this.calculateStability(heats);
    const peakDay = dailyStats.reduce((max, day) => 
      day.avgHeat > max.avgHeat ? day : max, dailyStats[0]).date;
    
    return {
      dailyStats,
      stability,
      peakDay: peakDay.toLocaleDateString('zh-CN'),
      trend: this.calculateOverallTrend(heats)
    };
  }

  /**
   * 计算稳定性
   */
  calculateStability(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return mean > 0 ? (1 - stdDev / mean) : 0;
  }

  /**
   * 按分类分析
   */
  analyzeByCategory(topics) {
    const categoryStats = {};
    
    topics.forEach(topic => {
      const category = topic.category || 'other';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalHeat: 0,
          avgHeat: 0,
          sources: new Set()
        };
      }
      
      const stats = categoryStats[category];
      stats.count++;
      stats.totalHeat += topic.heat || 0;
      stats.sources.add(topic.source);
    });
    
    // 计算平均热度
    Object.values(categoryStats).forEach(stats => {
      stats.avgHeat = stats.totalHeat / stats.count;
      stats.sourceCount = stats.sources.size;
      delete stats.sources; // 删除Set对象以便JSON序列化
    });
    
    return categoryStats;
  }

  /**
   * Markdown格式化
   */
  formatAsMarkdown(data) {
    let content = `# 热点${data.period === 'daily' ? '日报' : data.period === 'weekly' ? '周报' : '月报'}\n\n`;
    content += `**生成时间**: ${data.date.toLocaleString('zh-CN')}\n\n`;
    
    if (data.dateRange) {
      content += `**统计周期**: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}\n\n`;
    }
    
    content += `## 📊 数据概览\n\n`;
    content += `- 总话题数: ${data.summary.totalTopics}\n`;
    content += `- 平均热度: ${data.summary.avgHeat}\n`;
    content += `- 覆盖平台: ${data.summary.platforms}\n`;
    content += `- 热门分类: ${data.summary.dominantCategory}\n\n`;
    
    content += `## 🔥 热门话题\n\n`;
    data.topTopics.forEach((topic, index) => {
      content += `${index + 1}. **${topic.title}**\n`;
      content += `   - 平台: ${topic.source}\n`;
      content += `   - 热度: ${topic.heat}\n`;
      content += `   - 分类: ${topic.category || '未分类'}\n\n`;
    });
    
    if (data.aiAnalysis) {
      content += `## 🤖 AI分析洞察\n\n`;
      content += `### 整体概述\n${data.aiAnalysis.overview}\n\n`;
      content += `### 重点关注\n`;
      data.aiAnalysis.topTopics.forEach(topic => {
        content += `- ${topic}\n`;
      });
      content += `\n### 发展建议\n`;
      data.aiAnalysis.recommendations.forEach(rec => {
        content += `- ${rec}\n`;
      });
      content += `\n`;
    }
    
    return {
      content,
      type: 'markdown',
      filename: `hot-topics-${data.period}-${data.date.toISOString().split('T')[0]}.md`
    };
  }

  /**
   * JSON格式化
   */
  formatAsJSON(data) {
    return {
      content: data,
      type: 'json',
      filename: `hot-topics-${data.period}-${data.date.toISOString().split('T')[0]}.json`
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.reportCache.clear();
    logger.info('[ReportService] 报告缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.reportCache.size,
      keys: Array.from(this.reportCache.keys())
    };
  }
}

module.exports = new HotTopicReportService();