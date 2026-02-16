/**
 * 效果追踪服务
 * 用于收集和分析发布后的内容表现数据
 */

const { Content } = require('../models/Content');
const { logger } = require('../utils/logger');
const axios = require('axios');

class PerformanceTrackingService {
  constructor() {
    this.platformTrackers = {
      'xiaohongshu': new XiaoHongShuTracker(),
      'douyin': new DouyinTracker(),
      'toutiao': new ToutiaoTracker(),
      'weibo': new WeiboTracker(),
      'zhihu': new ZhihuTracker(),
      'bilibili': new BilibiliTracker()
    };

    // 定时任务配置
    this.config = {
      trackingInterval: process.env.TRACKING_INTERVAL || 3600000, // 1小时
      maxConcurrent: process.env.TRACKING_CONCURRENT || 5,
      batchSize: process.env.TRACKING_BATCH_SIZE || 10
    };

    // 追踪队列
    this.trackingQueue = [];
    this.isTrackingRunning = false;
  }

  /**
   * 开始性能追踪
   */
  async startTracking() {
    if (this.isTrackingRunning) {
      logger.warn('[PerformanceTrackingService] 追踪服务已在运行中');
      return;
    }

    this.isTrackingRunning = true;
    logger.info('[PerformanceTrackingService] 性能追踪服务启动');

    // 立即执行一次
    await this.trackPerformance();

    // 设置定时任务
    setInterval(async () => {
      await this.trackPerformance();
    }, this.config.trackingInterval);
  }

  /**
   * 追踪性能数据
   */
  async trackPerformance() {
    try {
      logger.info('[PerformanceTrackingService] 开始执行性能追踪');

      // 获取需要追踪的内容（已发布且性能数据更新时间超过阈值的内容）
      const cutoffTime = new Date(Date.now() - this.config.trackingInterval);
      const contents = await Content.find({
        status: 'published',
        'performance.lastUpdated': { $lt: cutoffTime },
        'publishInfo.publishedPlatforms': {
          $elemMatch: {
            status: 'success'
          }
        }
      }).limit(this.config.batchSize);

      if (contents.length === 0) {
        logger.info('[PerformanceTrackingService] 无需要追踪的内容');
        return;
      }

      logger.info(`[PerformanceTrackingService] 发现 ${contents.length} 个需要追踪的内容`);

      // 并发追踪
      const promises = contents.map(content => this.trackContentPerformance(content));
      const results = await Promise.allSettled(promises);

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;

      logger.info('[PerformanceTrackingService] 性能追踪完成', {
        total: contents.length,
        success: successCount,
        errors: errorCount
      });

    } catch (error) {
      logger.error('[PerformanceTrackingService] 性能追踪执行失败', {
        error: error.message
      });
    }
  }

  /**
   * 追踪单个内容的性能
   * @param {Object} content - 内容对象
   */
  async trackContentPerformance(content) {
    try {
      let totalPerformance = {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0
      };

      // 遍历所有成功发布平台
      for (const platformInfo of content.publishInfo.publishedPlatforms) {
        if (platformInfo.status !== 'success' || !platformInfo.result?.url) {
          continue;
        }

        const platform = platformInfo.platform;
        const tracker = this.platformTrackers[platform];
        if (!tracker) {
          logger.warn(`[PerformanceTrackingService] 不支持的平台追踪: ${platform}`);
          continue;
        }

        try {
          const platformPerformance = await tracker.getPerformance(platformInfo.result.url, content);
          if (platformPerformance) {
            // 累加各平台数据
            totalPerformance.views += platformPerformance.views || 0;
            totalPerformance.likes += platformPerformance.likes || 0;
            totalPerformance.comments += platformPerformance.comments || 0;
            totalPerformance.shares += platformPerformance.shares || 0;
            totalPerformance.saves += platformPerformance.saves || 0;
          }
        } catch (error) {
          logger.error(`[PerformanceTrackingService] 平台(${platform})性能追踪失败`, {
            contentId: content._id,
            platform,
            error: error.message
          });
        }
      }

      // 更新内容性能数据
      await this.updateContentPerformance(content._id, totalPerformance);

      logger.debug('[PerformanceTrackingService] 内容性能数据更新成功', {
        contentId: content._id,
        performance: totalPerformance
      });

    } catch (error) {
      logger.error('[PerformanceTrackingService] 追踪内容性能失败', {
        contentId: content._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 更新内容性能数据
   * @param {string} contentId - 内容ID
   * @param {Object} performanceData - 性能数据
   */
  async updateContentPerformance(contentId, performanceData) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new Error('内容不存在');
      }

      // 更新性能数据
      Object.assign(content.performance, performanceData);
      content.performance.lastUpdated = new Date();

      // 计算互动率
      if (content.performance.views > 0) {
        const engagement = (content.performance.likes + content.performance.comments + content.performance.shares) / content.performance.views;
        content.performance.engagementRate = engagement * 100;
      }

      await content.save();
    } catch (error) {
      logger.error('[PerformanceTrackingService] 更新内容性能数据失败', {
        contentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 手动追踪内容性能
   * @param {string} contentId - 内容ID
   * @returns {Promise<Object>}
   */
  async trackContent(contentId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      await this.trackContentPerformance(content);
      
      return {
        success: true,
        message: '性能追踪完成'
      };
    } catch (error) {
      logger.error('[PerformanceTrackingService] 手动追踪失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取内容性能报告
   * @param {string} contentId - 内容ID
   * @returns {Promise<Object>}
   */
  async getPerformanceReport(contentId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      if (!content.isPublished) {
        return {
          success: false,
          error: '内容未发布，无法生成性能报告'
        };
      }

      // 获取历史性能数据（如果有）
      const history = await this.getContentPerformanceHistory(contentId);

      return {
        success: true,
        data: {
          contentId: content._id,
          title: content.title,
          performance: content.performance,
          history: history,
          publishInfo: content.publishInfo,
          platforms: content.platforms
        }
      };
    } catch (error) {
      logger.error('[PerformanceTrackingService] 获取性能报告失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取内容性能历史
   * @param {string} contentId - 内容ID
   * @returns {Promise<Array>}
   */
  async getContentPerformanceHistory(contentId) {
    // 这里可以实现从历史数据表获取性能变化历史
    // 目前返回空数组，实际实现需要额外的数据存储
    return [];
  }

  /**
   * 获取平台性能概览
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>}
   */
  async getPlatformOverview(filters = {}) {
    try {
      const pipeline = [
        { $match: { status: 'published' } },
        {
          $group: {
            _id: '$publishInfo.publishedPlatforms.platform',
            totalContents: { $sum: 1 },
            totalViews: { $sum: '$performance.views' },
            totalLikes: { $sum: '$performance.likes' },
            totalComments: { $sum: '$performance.comments' },
            avgEngagementRate: { $avg: '$performance.engagementRate' }
          }
        }
      ];

      const result = await Content.aggregate(pipeline);
      
      return {
        success: true,
        data: result.filter(item => item._id) // 过滤掉空的_id
      };
    } catch (error) {
      logger.error('[PerformanceTrackingService] 获取平台概览失败', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取内容性能排行榜
   * @param {string} metric - 指标（views, likes, comments, engagementRate）
   * @param {number} limit - 限制数量
   * @returns {Promise<Object>}
   */
  async getPerformanceRanking(metric = 'views', limit = 10) {
    try {
      const validMetrics = ['views', 'likes', 'comments', 'engagementRate', 'shares', 'saves'];
      if (!validMetrics.includes(metric)) {
        return {
          success: false,
          error: `不支持的指标: ${metric}, 支持: ${validMetrics.join(', ')}`
        };
      }

      const contents = await Content.find({ status: 'published' })
        .sort({ [`performance.${metric}`]: -1 })
        .limit(limit)
        .select('_id title content performance publishInfo.createdAt')
        .lean();

      return {
        success: true,
        data: contents
      };
    } catch (error) {
      logger.error('[PerformanceTrackingService] 获取性能排行榜失败', {
        metric,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取性能趋势
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async getPerformanceTrends(options = {}) {
    try {
      const { startDate, endDate, platform, category } = options;
      
      const match = { status: 'published' };
      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }
      if (category) match.category = category;

      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            totalViews: { $sum: "$performance.views" },
            totalLikes: { $sum: "$performance.likes" },
            totalComments: { $sum: "$performance.comments" },
            contentCount: { $sum: 1 },
            avgEngagementRate: { $avg: "$performance.engagementRate" }
          }
        },
        { $sort: { "_id": 1 } }
      ];

      if (platform) {
        pipeline.unshift({
          $match: { "publishInfo.publishedPlatforms.platform": platform }
        });
      }

      const result = await Content.aggregate(pipeline);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('[PerformanceTrackingService] 获取性能趋势失败', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 重置内容性能数据
   * @param {string} contentId - 内容ID
   * @returns {Promise<Object>}
   */
  async resetPerformance(contentId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      // 重置性能数据（保留基础字段）
      content.performance = {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        engagementRate: 0,
        lastUpdated: new Date()
      };

      await content.save();

      return {
        success: true,
        message: '性能数据已重置'
      };
    } catch (error) {
      logger.error('[PerformanceTrackingService] 重置性能数据失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量追踪内容性能
   * @param {Array} contentIds - 内容ID数组
   * @returns {Promise<Object>}
   */
  async batchTrack(contentIds) {
    try {
      const results = [];
      const promises = contentIds.map(id => this.trackContent(id));
      const settledResults = await Promise.allSettled(promises);

      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            contentId: contentIds[index],
            success: result.value.success,
            error: result.value.error
          });
        } else {
          results.push({
            contentId: contentIds[index],
            success: false,
            error: result.reason?.message || '未知错误'
          });
        }
      });

      const successCount = results.filter(r => r.success).length;

      return {
        success: true,
        results,
        summary: {
          total: contentIds.length,
          success: successCount,
          failed: contentIds.length - successCount
        }
      };
    } catch (error) {
      logger.error('[PerformanceTrackingService] 批量追踪失败', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取追踪服务状态
   * @returns {Object}
   */
  getStatus() {
    return {
      isRunning: this.isTrackingRunning,
      config: this.config,
      queueSize: this.trackingQueue.length,
      supportedPlatforms: Object.keys(this.platformTrackers)
    };
  }
}

// 平台特定的追踪器基类
class PlatformTracker {
  constructor(platformName) {
    this.platformName = platformName;
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }

  /**
   * 获取性能数据
   * @param {string} url - 内容URL
   * @param {Object} content - 内容对象
   * @returns {Promise<Object>}
   */
  async getPerformance(url, content) {
    throw new Error('getPerformance 方法必须被子类实现');
  }

  /**
   * 验证URL格式
   * @param {string} url - URL
   * @returns {boolean}
   */
  validateUrl(url) {
    return url && typeof url === 'string' && url.startsWith('http');
  }
}

// 小红书追踪器
class XiaoHongShuTracker extends PlatformTracker {
  constructor() {
    super('xiaohongshu');
  }

  async getPerformance(url, content) {
    // 实际实现中需要通过API或网页抓取获取数据
    // 这里返回模拟数据
    return {
      views: Math.floor(Math.random() * 10000), // 模拟数据
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      saves: Math.floor(Math.random() * 200)
    };
  }
}

// 抖音追踪器
class DouyinTracker extends PlatformTracker {
  constructor() {
    super('douyin');
  }

  async getPerformance(url, content) {
    // 实际实现中需要通过API或网页抓取获取数据
    // 这里返回模拟数据
    return {
      views: Math.floor(Math.random() * 15000),
      likes: Math.floor(Math.random() * 800),
      comments: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 100),
      saves: Math.floor(Math.random() * 300)
    };
  }
}

// 今日头条追踪器
class ToutiaoTracker extends PlatformTracker {
  constructor() {
    super('toutiao');
  }

  async getPerformance(url, content) {
    // 实际实现中需要通过API或网页抓取获取数据
    // 这里返回模拟数据
    return {
      views: Math.floor(Math.random() * 8000),
      likes: Math.floor(Math.random() * 400),
      comments: Math.floor(Math.random() * 150),
      shares: Math.floor(Math.random() * 80),
      saves: Math.floor(Math.random() * 100)
    };
  }
}

// 微博追踪器
class WeiboTracker extends PlatformTracker {
  constructor() {
    super('weibo');
  }

  async getPerformance(url, content) {
    // 实际实现中需要通过API或网页抓取获取数据
    // 这里返回模拟数据
    return {
      views: Math.floor(Math.random() * 12000),
      likes: Math.floor(Math.random() * 600),
      comments: Math.floor(Math.random() * 300),
      shares: Math.floor(Math.random() * 200),
      saves: Math.floor(Math.random() * 150)
    };
  }
}

// 知乎追踪器
class ZhihuTracker extends PlatformTracker {
  constructor() {
    super('zhihu');
  }

  async getPerformance(url, content) {
    // 实际实现中需要通过API或网页抓取获取数据
    // 这里返回模拟数据
    return {
      views: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 250),
      shares: Math.floor(Math.random() * 100),
      saves: Math.floor(Math.random() * 400)
    };
  }
}

// B站追踪器
class BilibiliTracker extends PlatformTracker {
  constructor() {
    super('bilibili');
  }

  async getPerformance(url, content) {
    // 实际实现中需要通过API或网页抓取获取数据
    // 这里返回模拟数据
    return {
      views: Math.floor(Math.random() * 20000),
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 500),
      shares: Math.floor(Math.random() * 300),
      saves: Math.floor(Math.random() * 600)
    };
  }
}

// 创建单例
const performanceTrackingService = new PerformanceTrackingService();

module.exports = performanceTrackingService;