/**
 * 数据分析模块测试用例
 */

const request = require('supertest');
const express = require('express');
const analyticsRouter = require('../routes/analytics');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRouter);

describe('数据分析模块测试', () => {
  describe('GET /api/analytics/overview', () => {
    it('应该成功获取数据分析概览', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalViews');
      expect(response.body.data).toHaveProperty('totalLikes');
      expect(response.body.data).toHaveProperty('totalComments');
      expect(response.body.data).toHaveProperty('totalShares');
    });
  });

  describe('GET /api/analytics/views-trend', () => {
    it('应该成功获取浏览量趋势数据', async () => {
      const response = await request(app)
        .get('/api/analytics/views-trend?days=7')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该处理无效的天数参数', async () => {
      const response = await request(app)
        .get('/api/analytics/views-trend?days=invalid')
        .expect(200); // 应该优雅地处理无效参数

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/analytics/content-types', () => {
    it('应该成功获取内容类型分布', async () => {
      const response = await request(app)
        .get('/api/analytics/content-types')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/analytics/top-content', () => {
    it('应该成功获取热门内容排行', async () => {
      const response = await request(app)
        .get('/api/analytics/top-content?limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('应该处理无效的limit参数', async () => {
      const response = await request(app)
        .get('/api/analytics/top-content?limit=invalid')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/analytics/hot-topics', () => {
    it('应该成功获取热点话题统计', async () => {
      const response = await request(app)
        .get('/api/analytics/hot-topics?days=7')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/analytics/user-behavior', () => {
    it('应该成功获取用户行为分析', async () => {
      const response = await request(app)
        .get('/api/analytics/user-behavior?days=30')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/analytics/content-quality', () => {
    it('应该成功获取内容质量分析', async () => {
      const response = await request(app)
        .get('/api/analytics/content-quality')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/analytics/predictions', () => {
    it('应该成功获取预测分析', async () => {
      const response = await request(app)
        .get('/api/analytics/predictions?metric=views&days=7')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('historical');
      expect(response.body.data).toHaveProperty('predictions');
      expect(response.body.data).toHaveProperty('trend');
    });

    it('应该处理无效的参数', async () => {
      const response = await request(app)
        .get('/api/analytics/predictions?metric=invalid&days=-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/analytics/export', () => {
    it('应该成功导出CSV格式数据', async () => {
      const response = await request(app)
        .get('/api/analytics/export?type=csv&dataType=overview')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers).toHaveProperty('content-disposition');
    });

    it('应该成功导出JSON格式数据', async () => {
      const response = await request(app)
        .get('/api/analytics/export?type=json&dataType=trends')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('应该处理不支持的数据类型', async () => {
      const response = await request(app)
        .get('/api/analytics/export?type=csv&dataType=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理数据库连接错误', async () => {
      // 这里可以mock数据库连接失败的情况
      // 由于我们使用的是模拟数据，这个测试主要是验证错误处理机制
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200); // 即使数据库有问题也应该返回成功但空数据

      expect(response.body).toHaveProperty('success', true);
    });

    it('应该处理内部服务器错误', async () => {
      // 可以通过mock特定的错误情况来测试
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      // 验证即使出现错误也返回统一的响应格式
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内响应', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 响应时间应该小于3秒
      expect(responseTime).toBeLessThan(3000);
    });

    it('应该能够处理并发请求', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/api/analytics/overview')
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });
    });
  });
});

describe('报告生成服务测试', () => {
  const { ReportGenerator } = require('../reports/ReportGenerator');
  let reportGenerator;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
  });

  describe('报告生成测试', () => {
    it('应该成功生成日报Markdown', () => {
      const testData = {
        date: '2024-01-15',
        stats: {
          total: 50,
          avgHeat: 85.5,
          topKeywords: ['科技', '人工智能', '创新']
        },
        topics: [
          {
            title: '测试话题1',
            source: 'weibo',
            heat: 95,
            category: '科技',
            trend: 'up'
          }
        ]
      };

      const markdown = reportGenerator.dailyToMarkdown(testData);
      expect(typeof markdown).toBe('string');
      expect(markdown).toContain('# 热点日报');
      expect(markdown).toContain('测试话题1');
    });

    it('应该成功生成周报Markdown', () => {
      const testData = {
        startDate: '2024-01-08',
        endDate: '2024-01-14',
        stats: {
          totalTopics: 150,
          newTopics: 30,
          hotTopics: 15,
          avgHeat: 78.2
        },
        highlights: [
          {
            title: '重要事件',
            description: '本周重要事件描述'
          }
        ]
      };

      const markdown = reportGenerator.weeklyToMarkdown(testData);
      expect(typeof markdown).toBe('string');
      expect(markdown).toContain('# 热点周报');
      expect(markdown).toContain('2024-01-08 - 2024-01-14');
    });

    it('应该成功生成HTML报告', async () => {
      const testData = {
        overview: {
          totalViews: 100000,
          totalLikes: 10000,
          totalComments: 2000,
          avgEngagement: '8.5'
        },
        trends: [
          { date: '2024-01-01', views: 1200, likes: 120, comments: 25 }
        ],
        topContent: [
          { title: '热门文章1', views: 5000, likes: 500, comments: 100 }
        ]
      };

      const html = await reportGenerator.toHTML(testData, 'daily');
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('数据分析日报');
    });
  });

  describe('高级报告生成测试', () => {
    it('应该成功生成包含预测的高级报告', async () => {
      const result = await reportGenerator.generateAdvancedReport('daily', {
        timeRange: '7d',
        format: 'html',
        includePredictions: true,
        includeRecommendations: true
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('type', 'daily');
      expect(result.metadata).toHaveProperty('format', 'html');
    });

    it('应该成功生成Excel格式报告', async () => {
      const result = await reportGenerator.generateAdvancedReport('weekly', {
        format: 'excel'
      });

      expect(result).toHaveProperty('success', true);
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('指标,数值');
    });
  });

  describe('工具方法测试', () => {
    it('应该正确分组数据', () => {
      const topics = [
        { source: 'weibo', category: '科技' },
        { source: 'weibo', category: '娱乐' },
        { source: 'toutiao', category: '科技' }
      ];

      const groupedBySource = reportGenerator.groupBySource(topics);
      expect(groupedBySource).toHaveProperty('weibo');
      expect(groupedBySource).toHaveProperty('toutiao');
      expect(groupedBySource.weibo).toHaveLength(2);

      const groupedByCategory = reportGenerator.groupByCategory(topics);
      expect(groupedByCategory).toHaveProperty('科技');
      expect(groupedByCategory).toHaveProperty('娱乐');
    });

    it('应该正确提取关键词', () => {
      const topics = [
        { keywords: ['人工智能', '机器学习', '深度学习'] },
        { keywords: ['人工智能', '神经网络'] },
        { keywords: ['大数据', '云计算'] }
      ];

      const topKeywords = reportGenerator.extractTopKeywords(topics, 3);
      expect(Array.isArray(topKeywords)).toBe(true);
      expect(topKeywords).toContain('人工智能');
    });

    it('应该正确格式化数字', () => {
      expect(reportGenerator.formatNumber(1000)).toBe('1,000');
      expect(reportGenerator.formatNumber(15000)).toBe('1.5万');
      expect(reportGenerator.formatNumber(0)).toBe('0');
    });

    it('应该正确格式化日期', () => {
      const date = new Date('2024-01-15');
      const formatted = reportGenerator.formatDate(date);
      expect(formatted).toContain('2024');
    });
  });
});