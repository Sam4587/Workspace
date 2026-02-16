/**
 * 报告生成器
 * 支持多种格式和类型的报告生成
 */

const fs = require('fs').promises;
const path = require('path');
const ejs = require('ejs');

class ReportGenerator {
  constructor() {
    this.reportDir = path.join(__dirname, '../../reports');
    this.builtInTemplates = {
      daily: this.getDailyTemplate(),
      weekly: this.getWeeklyTemplate(),
      content: this.getContentTemplate()
    };
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
    }
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
    md += `- **平均质量分**: ${data.stats.avgQuality}\n\n`;

    md += `## 内容表现\n\n`;
    for (const content of data.topContent) {
      md += `- **${content.title}**\n`;
      md += `  - 浏览量: ${content.views}\n`;
      md += `  - 点赞数: ${content.likes}\n`;
      md += `  - 评论数: ${content.comments}\n\n`;
    }

    md += `---\n*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    return md;
  }

  /**
   * 生成高级分析报告
   */
  async generateAdvancedReport(type, options = {}) {
    const {
      timeRange = '7d',
      format = 'html',
      includePredictions = true,
      includeRecommendations = true
    } = options;

    try {
      // 获取报告数据
      const reportData = await this.fetchReportData(type, timeRange);
      
      // 添加AI分析和预测
      if (includePredictions) {
        reportData.predictions = await this.generatePredictions(reportData);
      }
      
      if (includeRecommendations) {
        reportData.recommendations = await this.generateRecommendations(reportData);
      }

      // 格式化报告
      let formattedReport;
      switch (format.toLowerCase()) {
        case 'pdf':
          formattedReport = await this.toPDF(reportData, type);
          break;
        case 'excel':
          formattedReport = await this.toExcel(reportData, type);
          break;
        case 'markdown':
          formattedReport = this.toMarkdown(reportData, type);
          break;
        default:
          formattedReport = await this.toHTML(reportData, type);
      }

      return {
        success: true,
        data: formattedReport,
        metadata: {
          type,
          format,
          generatedAt: new Date().toISOString(),
          timeRange
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取报告数据
   */
  async fetchReportData(type, timeRange) {
    // 这里应该调用相应的服务获取数据
    // 为了演示，返回模拟数据
    const mockData = {
      overview: {
        totalViews: Math.floor(Math.random() * 100000) + 50000,
        totalLikes: Math.floor(Math.random() * 10000) + 5000,
        totalComments: Math.floor(Math.random() * 2000) + 1000,
        avgEngagement: (Math.random() * 10 + 5).toFixed(2)
      },
      trends: [
        { date: '2024-01-01', views: 1200, likes: 120, comments: 25 },
        { date: '2024-01-02', views: 1500, likes: 150, comments: 30 },
        { date: '2024-01-03', views: 1800, likes: 180, comments: 35 }
      ],
      topContent: [
        { title: '热门文章1', views: 5000, likes: 500, comments: 100 },
        { title: '热门文章2', views: 4500, likes: 450, comments: 90 }
      ]
    };

    return mockData;
  }

  /**
   * 生成预测数据
   */
  async generatePredictions(data) {
    // 简单的线性预测
    const lastValue = data.trends[data.trends.length - 1];
    const trend = (lastValue.views - data.trends[0].views) / data.trends.length;
    
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedViews: Math.round(lastValue.views + trend * i),
        confidence: (0.9 - i * 0.05).toFixed(2)
      });
    }
    
    return {
      trend: trend > 0 ? '上升' : '下降',
      predictions
    };
  }

  /**
   * 生成推荐建议
   */
  async generateRecommendations(data) {
    const recommendations = [];
    
    // 基于数据生成建议
    if (data.overview.avgEngagement < 8) {
      recommendations.push('用户互动率偏低，建议优化内容质量和增加互动元素');
    }
    
    if (data.trends.some(t => t.views > 2000)) {
      recommendations.push('部分内容表现优异，建议分析成功要素并复制到其他内容');
    }
    
    return recommendations;
  }

  /**
   * 转换为PDF格式
   */
  async toPDF(data, type) {
    // 这里应该使用PDF生成库如 pdfmake 或 puppeteer
    // 为了演示返回HTML格式
    return await this.toHTML(data, type);
  }

  /**
   * 转换为Excel格式
   */
  async toExcel(data, type) {
    // 这里应该使用Excel生成库如 exceljs
    // 为了演示返回CSV格式
    let csv = '指标,数值\n';
    Object.entries(data.overview).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    return csv;
  }

  /**
   * 转换为HTML格式
   */
  async toHTML(data, type) {
    const template = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.getTitle(type)} - ${new Date().toLocaleDateString()}</title>
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
        .stat-label { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .recommendation { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #2196f3; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.getTitle(type)}</h1>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="content">
            <!-- 数据概览 -->
            <div class="section">
                <h2>📊 数据概览</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.overview.totalViews?.toLocaleString() || 0}</div>
                        <div class="stat-label">总浏览量</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.overview.totalLikes?.toLocaleString() || 0}</div>
                        <div class="stat-label">总点赞数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.overview.totalComments?.toLocaleString() || 0}</div>
                        <div class="stat-label">总评论数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.overview.avgEngagement || 0}%</div>
                        <div class="stat-label">平均互动率</div>
                    </div>
                </div>
            </div>

            <!-- 趋势分析 -->
            <div class="section">
                <h2>📈 趋势分析</h2>
                <table>
                    <thead>
                        <tr>
                            <th>日期</th>
                            <th>浏览量</th>
                            <th>点赞数</th>
                            <th>评论数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.trends?.map(trend => `
                            <tr>
                                <td>${trend.date}</td>
                                <td>${trend.views?.toLocaleString() || 0}</td>
                                <td>${trend.likes?.toLocaleString() || 0}</td>
                                <td>${trend.comments?.toLocaleString() || 0}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4">暂无数据</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- 热门内容 -->
            <div class="section">
                <h2>🔥 热门内容</h2>
                <table>
                    <thead>
                        <tr>
                            <th>标题</th>
                            <th>浏览量</th>
                            <th>点赞数</th>
                            <th>评论数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.topContent?.map(content => `
                            <tr>
                                <td>${content.title}</td>
                                <td>${content.views?.toLocaleString() || 0}</td>
                                <td>${content.likes?.toLocaleString() || 0}</td>
                                <td>${content.comments?.toLocaleString() || 0}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4">暂无数据</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- 预测分析 -->
            ${data.predictions ? `
            <div class="section">
                <h2>🔮 预测分析</h2>
                <div class="recommendation">
                    <strong>趋势预测:</strong> ${data.predictions.trend}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>预测日期</th>
                            <th>预测浏览量</th>
                            <th>置信度</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.predictions.predictions.map(pred => `
                            <tr>
                                <td>${pred.date}</td>
                                <td>${pred.predictedViews?.toLocaleString() || 0}</td>
                                <td>${(pred.confidence * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- 优化建议 -->
            ${data.recommendations && data.recommendations.length > 0 ? `
            <div class="section">
                <h2>💡 优化建议</h2>
                ${data.recommendations.map(rec => `
                    <div class="recommendation">
                        ${rec}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>AI内容流程平台数据分析报告</p>
            <p>Generated by AI Content Flow Platform</p>
        </div>
    </div>
</body>
</html>`;

    return template;
  }

  /**
   * 获取报告标题
   */
  getTitle(type) {
    const titles = {
      'daily': '数据分析日报',
      'weekly': '数据分析周报',
      'monthly': '数据分析月报',
      'quarterly': '数据分析季报',
      'annual': '数据分析年报',
      'custom': '自定义数据分析报告'
    };
    return titles[type] || '数据分析报告';
  }

  /**
   * 按来源分组
   */
  groupBySource(topics) {
    const groups = {};
    for (const topic of topics) {
      const source = topic.source || 'unknown';
      if (!groups[source]) groups[source] = [];
      groups[source].push(topic);
    }
    return groups;
  }

  /**
   * 按分类分组
   */
  groupByCategory(topics) {
    const groups = {};
    for (const topic of topics) {
      const category = topic.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(topic);
    }
    return groups;
  }

  /**
   * 提取热门关键词
   */
  extractTopKeywords(topics, limit = 10) {
    const keywordCount = {};
    for (const topic of topics) {
      const keywords = topic.keywords || [];
      for (const keyword of keywords) {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      }
    }
    
    return Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
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
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
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
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .topic-item { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .topic-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .topic-meta { color: #666; font-size: 14px; }
        .trend-up { color: #28a745; }
        .trend-down { color: #dc3545; }
        .trend-new { color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>热点日报</h1>
            <p><%= date %></p>
        </div>
        <div class="content">
            <div class="section">
                <h2>📊 统计摘要</h2>
                <p>热点总数: <%= stats.total %></p>
                <p>平均热度: <%= stats.avgHeat %></p>
                <p>热门关键词: <%= stats.topKeywords.join('、') %></p>
            </div>
            
            <div class="section">
                <h2>📰 热点列表</h2>
                <% topics.forEach(function(topic, index) { %>
                    <div class="topic-item">
                        <div class="topic-title">
                            <%= index + 1 %>. <%= topic.title %> 
                            <% if (topic.trend === 'up') { %>
                                <span class="trend-up">🔺</span>
                            <% } else if (topic.trend === 'down') { %>
                                <span class="trend-down">🔻</span>
                            <% } else if (topic.trend === 'new') { %>
                                <span class="trend-new">🆕</span>
                            <% } %>
                        </div>
                        <div class="topic-meta">
                            来源: <%= topic.source %> | 热度: <%= topic.heat %> | 分类: <%= topic.category %>
                            <% if (topic.sourceUrl) { %>
                                | <a href="<%= topic.sourceUrl %>" target="_blank">查看详情</a>
                            <% } %>
                        </div>
                    </div>
                <% }); %>
            </div>
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
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .highlight { background: #d4edda; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>热点周报</h1>
            <p><%= startDate %> - <%= endDate %></p>
        </div>
        <div class="content">
            <div class="section">
                <h2>📊 本周统计</h2>
                <p>热点总数: <%= stats.totalTopics %></p>
                <p>新增热点: <%= stats.newTopics %></p>
                <p>超级热点: <%= stats.hotTopics %></p>
                <p>平均热度: <%= stats.avgHeat %></p>
            </div>
            
            <% if (highlights.length > 0) { %>
            <div class="section">
                <h2>⭐ 本周亮点</h2>
                <% highlights.forEach(function(h) { %>
                    <div class="highlight">
                        <strong><%= h.title %>:</strong> <%= h.description %>
                    </div>
                <% }); %>
            </div>
            <% } %>
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
    <title>内容创作报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .content-item { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .content-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .content-meta { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>内容创作报告</h1>
            <p><%= period %></p>
        </div>
        <div class="content">
            <div class="section">
                <h2>📊 统计摘要</h2>
                <p>内容总数: <%= stats.totalContent %></p>
                <p>已发布: <%= stats.published %></p>
                <p>平均质量分: <%= stats.avgQuality %></p>
            </div>
            
            <div class="section">
                <h2>📰 内容表现</h2>
                <% topContent.forEach(function(content) { %>
                    <div class="content-item">
                        <div class="content-title"><%= content.title %></div>
                        <div class="content-meta">
                            浏览量: <%= content.views %> | 
                            点赞数: <%= content.likes %> | 
                            评论数: <%= content.comments %>
                        </div>
                    </div>
                <% }); %>
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

// 创建单例实例
const reportGenerator = new ReportGenerator();

module.exports = {
  ReportGenerator,
  reportGenerator
};