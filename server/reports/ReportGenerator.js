/**
 * 报告生成器
 * 支持 HTML/PDF/Markdown 多格式报告，借鉴 TrendRadar 报告生成设计
 */

const ejs = require('ejs');
const logger = require('../utils/logger');

class ReportGenerator {
  constructor() {
    this.templates = {
      daily: null,
      weekly: null,
      content: null
    };

    // 内置模板
    this.builtInTemplates = {
      daily: this.getDailyTemplate(),
      weekly: this.getWeeklyTemplate(),
      content: this.getContentTemplate()
    };
  }

  /**
   * 生成热点日报
   * @param {import('../core/types').HotTopic[]} topics - 热点列表
   * @param {Object} options - 选项
   * @returns {Promise<{html: string, markdown: string}>}
   */
  async generateDailyReport(topics, options = {}) {
    const data = {
      date: new Date().toLocaleDateString('zh-CN'),
      topics: topics.slice(0, 30),
      stats: {
        total: topics.length,
        bySource: this.groupBySource(topics),
        byCategory: this.groupByCategory(topics),
        avgHeat: Math.round(topics.reduce((sum, t) => sum + t.heat, 0) / topics.length) || 0,
        topKeywords: this.extractTopKeywords(topics, 10)
      }
    };

    const html = await this.render('daily', data);
    const markdown = this.toMarkdown(data, 'daily');

    return { html, markdown, data };
  }

  /**
   * 生成热点周报
   * @param {Object} weeklyData - 周数据
   * @returns {Promise<{html: string, markdown: string}>}
   */
  async generateWeeklyReport(weeklyData) {
    const data = {
      startDate: weeklyData.startDate,
      endDate: weeklyData.endDate,
      topics: weeklyData.topics?.slice(0, 50) || [],
      stats: {
        totalTopics: weeklyData.totalTopics || 0,
        newTopics: weeklyData.newTopics || 0,
        hotTopics: weeklyData.hotTopics || 0,
        avgHeat: weeklyData.avgHeat || 0,
        topCategories: weeklyData.topCategories || [],
        sourceBreakdown: weeklyData.sourceBreakdown || {}
      },
      highlights: weeklyData.highlights || []
    };

    const html = await this.render('weekly', data);
    const markdown = this.toMarkdown(data, 'weekly');

    return { html, markdown, data };
  }

  /**
   * 生成内容报告
   * @param {Object[]} contents - 内容列表
   * @param {Object} analytics - 分析数据
   * @returns {Promise<{html: string, markdown: string}>}
   */
  async generateContentReport(contents, analytics) {
    const data = {
      period: analytics.period || '本周',
      contents: contents.slice(0, 20),
      stats: {
        totalContent: analytics.totalContent || contents.length,
        published: analytics.published || 0,
        pending: analytics.pending || 0,
        totalViews: analytics.totalViews || 0,
        totalLikes: analytics.totalLikes || 0,
        avgEngagement: analytics.avgEngagement || 0,
        topContent: analytics.topContent || contents.slice(0, 5)
      },
      insights: analytics.insights || []
    };

    const html = await this.render('content', data);
    const markdown = this.toMarkdown(data, 'content');

    return { html, markdown, data };
  }

  /**
   * 渲染模板
   * @param {string} templateName - 模板名称
   * @param {Object} data - 数据
   * @returns {Promise<string>}
   */
  async render(templateName, data) {
    const template = this.builtInTemplates[templateName];
    if (!template) {
      throw new Error(`模板不存在: ${templateName}`);
    }

    try {
      return await ejs.render(template, { ...data, formatDate: this.formatDate, formatNumber: this.formatNumber });
    } catch (error) {
      logger.error(`[ReportGenerator] 模板渲染失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 转换为 Markdown
   * @param {Object} data - 数据
   * @param {string} type - 报告类型
   * @returns {string}
   */
  toMarkdown(data, type) {
    if (type === 'daily') {
      return this.dailyToMarkdown(data);
    } else if (type === 'weekly') {
      return this.weeklyToMarkdown(data);
    } else if (type === 'content') {
      return this.contentToMarkdown(data);
    }
    return '';
  }

  /**
   * 日报转 Markdown
   */
  dailyToMarkdown(data) {
    let md = `# 热点日报 - ${data.date}\n\n`;

    // 统计摘要
    md += `## 统计摘要\n\n`;
    md += `- **热点总数**: ${data.stats.total}\n`;
    md += `- **平均热度**: ${data.stats.avgHeat}\n`;
    md += `- **热门关键词**: ${data.stats.topKeywords.join('、')}\n\n`;

    // 按来源分组
    md += `## 来源分布\n\n`;
    for (const [source, count] of Object.entries(data.stats.bySource)) {
      md += `- ${source}: ${count} 条\n`;
    }
    md += '\n';

    // 热点列表
    md += `## 热点列表\n\n`;
    for (let i = 0; i < data.topics.length; i++) {
      const topic = data.topics[i];
      const trendEmoji = topic.trend === 'up' ? '🔺' : topic.trend === 'down' ? '🔻' : topic.trend === 'new' ? '🆕' : '';
      md += `${i + 1}. **${topic.title}** ${trendEmoji}\n`;
      md += `   - 来源: ${topic.source} | 热度: ${topic.heat} | 分类: ${topic.category}\n`;
      if (topic.sourceUrl) {
        md += `   - 链接: [查看详情](${topic.sourceUrl})\n`;
      }
      md += '\n';
    }

    md += `---\n*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    return md;
  }

  /**
   * 周报转 Markdown
   */
  weeklyToMarkdown(data) {
    let md = `# 热点周报\n\n`;
    md += `**时间范围**: ${data.startDate} - ${data.endDate}\n\n`;

    md += `## 本周统计\n\n`;
    md += `- **热点总数**: ${data.stats.totalTopics}\n`;
    md += `- **新增热点**: ${data.stats.newTopics}\n`;
    md += `- **超级热点**: ${data.stats.hotTopics}\n`;
    md += `- **平均热度**: ${data.stats.avgHeat}\n\n`;

    if (data.highlights.length > 0) {
      md += `## 本周亮点\n\n`;
      for (const h of data.highlights) {
        md += `- **${h.title}**: ${h.description}\n`;
      }
      md += '\n';
    }

    md += `---\n*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    return md;
  }

  /**
   * 内容报告转 Markdown
   */
  contentToMarkdown(data) {
    let md = `# 内容创作报告 - ${data.period}\n\n`;

    md += `## 统计摘要\n\n`;
    md += `- **内容总数**: ${data.stats.totalContent}\n`;
    md += `- **已发布**: ${data.stats.published}\n`;
    md += `- **待发布**: ${data.stats.pending}\n`;
    md += `- **总浏览量**: ${this.formatNumber(data.stats.totalViews)}\n`;
    md += `- **总点赞数**: ${this.formatNumber(data.stats.totalLikes)}\n`;
    md += `- **平均互动率**: ${data.stats.avgEngagement}%\n\n`;

    if (data.stats.topContent.length > 0) {
      md += `## 热门内容\n\n`;
      for (let i = 0; i < data.stats.topContent.length; i++) {
        const content = data.stats.topContent[i];
        md += `${i + 1}. **${content.title}**\n`;
        md += `   - 浏览: ${this.formatNumber(content.views)} | 点赞: ${this.formatNumber(content.likes)}\n\n`;
      }
    }

    md += `---\n*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    return md;
  }

  /**
   * 按来源分组
   */
  groupBySource(topics) {
    const groups = {};
    for (const topic of topics) {
      groups[topic.source] = (groups[topic.source] || 0) + 1;
    }
    return groups;
  }

  /**
   * 按分类分组
   */
  groupByCategory(topics) {
    const groups = {};
    for (const topic of topics) {
      groups[topic.category] = (groups[topic.category] || 0) + 1;
    }
    return groups;
  }

  /**
   * 提取热门关键词
   */
  extractTopKeywords(topics, limit = 10) {
    const keywordCount = {};
    for (const topic of topics) {
      for (const keyword of (topic.keywords || [])) {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      }
    }

    return Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword]) => keyword);
  }

  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('zh-CN');
  }

  /**
   * 格式化数字
   */
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  /**
   * 获取日报 HTML 模板
   */
  getDailyTemplate() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>热点日报 - <%= date %></title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; margin-bottom: 20px; font-size: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin: 20px 0 15px; font-size: 18px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #3b82f6; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    .source-list { display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0; }
    .source-tag { background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px; font-size: 13px; }
    .topic-list { list-style: none; }
    .topic-item { padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
    .topic-item:last-child { border-bottom: none; }
    .topic-title { font-size: 16px; font-weight: 500; color: #1f2937; }
    .topic-meta { font-size: 13px; color: #6b7280; margin-top: 5px; }
    .trend-up { color: #10b981; }
    .trend-down { color: #ef4444; }
    .trend-new { color: #8b5cf6; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>热点日报 - <%= date %></h1>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value"><%= stats.total %></div>
        <div class="stat-label">热点总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><%= stats.avgHeat %></div>
        <div class="stat-label">平均热度</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><%= Object.keys(stats.bySource).length %></div>
        <div class="stat-label">数据来源</div>
      </div>
    </div>

    <h2>来源分布</h2>
    <div class="source-list">
      <% for (const [source, count] of Object.entries(stats.bySource)) { %>
        <span class="source-tag"><%= source %>: <%= count %>条</span>
      <% } %>
    </div>

    <h2>热点列表</h2>
    <ul class="topic-list">
      <% topics.forEach((topic, index) => { %>
        <li class="topic-item">
          <div class="topic-title">
            <%= index + 1 %>. <%= topic.title %>
            <% if (topic.trend === 'up') { %><span class="trend-up">↑</span><% } %>
            <% if (topic.trend === 'down') { %><span class="trend-down">↓</span><% } %>
            <% if (topic.trend === 'new') { %><span class="trend-new">新</span><% } %>
          </div>
          <div class="topic-meta">
            来源: <%= topic.source %> | 热度: <%= topic.heat %> | 分类: <%= topic.category %>
          </div>
        </li>
      <% }); %>
    </ul>

    <div class="footer">
      生成时间: <%= new Date().toLocaleString('zh-CN') %>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 获取周报 HTML 模板
   */
  getWeeklyTemplate() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>热点周报</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; margin-bottom: 10px; font-size: 24px; }
    .date-range { color: #6b7280; margin-bottom: 20px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>热点周报</h1>
    <p class="date-range"><%= startDate %> - <%= endDate %></p>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value"><%= stats.totalTopics %></div>
        <div class="stat-label">热点总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><%= stats.newTopics %></div>
        <div class="stat-label">新增热点</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><%= stats.hotTopics %></div>
        <div class="stat-label">超级热点</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><%= stats.avgHeat %></div>
        <div class="stat-label">平均热度</div>
      </div>
    </div>

    <div class="footer">
      生成时间: <%= new Date().toLocaleString('zh-CN') %>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 获取内容报告 HTML 模板
   */
  getContentTemplate() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>内容创作报告 - <%= period %></title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; margin-bottom: 20px; font-size: 24px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #374151; margin: 20px 0 15px; font-size: 18px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f0fdf4; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    .content-list { list-style: none; }
    .content-item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .content-title { font-size: 15px; font-weight: 500; color: #1f2937; }
    .content-meta { font-size: 13px; color: #6b7280; margin-top: 5px; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>内容创作报告 - <%= period %></h1>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value"><%= stats.totalContent %></div>
        <div class="stat-label">内容总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><%= stats.published %></div>
        <div class="stat-label">已发布</div>
      </div>
      <div class="stat-card">
        <div class="stat-value"><%= formatNumber(stats.totalViews) %></div>
        <div class="stat-label">总浏览量</div>
      </div>
    </div>

    <% if (stats.topContent && stats.topContent.length > 0) { %>
    <h2>热门内容</h2>
    <ul class="content-list">
      <% stats.topContent.forEach((content, index) => { %>
        <li class="content-item">
          <div class="content-title"><%= index + 1 %>. <%= content.title %></div>
          <div class="content-meta">浏览: <%= formatNumber(content.views) %> | 点赞: <%= formatNumber(content.likes) %></div>
        </li>
      <% }); %>
    </ul>
    <% } %>

    <div class="footer">
      生成时间: <%= new Date().toLocaleString('zh-CN') %>
    </div>
  </div>
</body>
</html>`;
  }
}

// 单例模式
const reportGenerator = new ReportGenerator();

module.exports = {
  ReportGenerator,
  reportGenerator
};
