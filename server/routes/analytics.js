const express = require('express');
const Content = require('../models/Content');
const PublishRecord = require('../models/PublishRecord');
const HotTopic = require('../models/HotTopic');

const router = express.Router();

// 获取总体统计数据
router.get('/overview', async (req, res) => {
  try {
    const [
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      avgEngagement,
      growthRate,
      todayTopics,
      generatedContent,
      publishedContent,
      successRate
    ] = await Promise.all([
      PublishRecord.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$metrics.views' } } }
      ]),
      PublishRecord.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$metrics.likes' } } }
      ]),
      PublishRecord.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$metrics.comments' } } }
      ]),
      PublishRecord.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$metrics.shares' } } }
      ]),
      PublishRecord.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, avgEngagement: { $avg: { $add: ['$metrics.likes', '$metrics.comments', '$metrics.shares'] } } } }
      ]),
      Content.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]),
      HotTopic.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }),
      Content.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }),
      PublishRecord.countDocuments({
        status: 'success',
        publishTime: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }),
      PublishRecord.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const stats = {
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0,
      totalShares: totalShares[0]?.total || 0,
      avgEngagement: Math.round((avgEngagement[0]?.avgEngagement || 0) * 100) / 100,
      growthRate: 15.8, // 模拟增长率
      todayTopics: todayTopics || 0,
      generatedContent: generatedContent || 0,
      publishedContent: publishedContent || 0,
      successRate: successRate[0] ? Math.round((successRate[0].success / successRate[0].total) * 100) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取总体统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取总体统计失败'
    });
  }
});

// 获取浏览量趋势数据
router.get('/views-trend', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const trendData = await PublishRecord.aggregate([
      {
        $match: {
          status: 'success',
          publishTime: {
            $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%m-%d', date: '$publishTime' } },
          views: { $sum: '$metrics.views' },
          likes: { $sum: '$metrics.likes' },
          comments: { $sum: '$metrics.comments' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('获取浏览量趋势失败:', error);
    res.status(500).json({
      success: false,
      message: '获取浏览量趋势失败'
    });
  }
});

// 获取内容类型分布
router.get('/content-types', async (req, res) => {
  try {
    const typeData = await Content.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'article'] }, then: '长文章' },
                { case: { $eq: ['$_id', 'micro'] }, then: '微头条' },
                { case: { $eq: ['$_id', 'video'] }, then: '视频脚本' },
                { case: { $eq: ['$_id', 'audio'] }, then: '音频脚本' }
              ],
              default: '其他'
            }
          },
          value: '$count',
          color: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'article'] }, then: '#3B82F6' },
                { case: { $eq: ['$_id', 'micro'] }, then: '#10B981' },
                { case: { $eq: ['$_id', 'video'] }, then: '#8B5CF6' },
                { case: { $eq: ['$_id', 'audio'] }, then: '#F59E0B' }
              ],
              default: '#6B7280'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: typeData
    });
  } catch (error) {
    console.error('获取内容类型分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取内容类型分布失败'
    });
  }
});

// 获取热门内容排行
router.get('/top-content', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topContent = await PublishRecord.aggregate([
      {
        $match: {
          status: 'success',
          'metrics.views': { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'contents',
          localField: 'contentId',
          foreignField: '_id',
          as: 'content'
        }
      },
      { $unwind: '$content' },
      {
        $project: {
          title: '$content.title',
          views: '$metrics.views',
          likes: '$metrics.likes',
          comments: '$metrics.comments',
          shares: '$metrics.shares',
          publishDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$publishTime'
            }
          }
        }
      },
      { $sort: { views: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topContent
    });
  } catch (error) {
    console.error('获取热门内容失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门内容失败'
    });
  }
});

// 获取推荐机制洞察
router.get('/recommendation-insights', async (req, res) => {
  try {
    const { contentId } = req.query;
    
    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: '缺少内容ID'
      });
    }

    // 获取内容发布记录
    const publishRecord = await PublishRecord.findOne({ contentId })
      .populate('contentId', 'title type quality');

    if (!publishRecord) {
      return res.status(404).json({
        success: false,
        message: '内容发布记录不存在'
      });
    }

    // 计算推荐洞察指标
    const metrics = publishRecord.metrics || {};
    const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
    
    // 冷启动表现（基于初始推荐效果）
    const coldStartPerformance = Math.min(100, Math.round((metrics.views || 0) / 100));
    
    // 用户互动率
    const userEngagement = metrics.views > 0 ? Math.round((totalEngagement / metrics.views) * 100) : 0;
    
    // 内容质量评分
    const contentQuality = publishRecord.contentId?.quality || 70;
    
    // 综合推荐评分
    const recommendationScore = Math.round(
      (coldStartPerformance * 0.3) + 
      (userEngagement * 0.4) + 
      (contentQuality * 0.3)
    );

    // 生成推荐洞察
    const insights = [];
    
    if (coldStartPerformance < 30) {
      insights.push('冷启动阶段表现较弱，建议优化标题和封面图以提高点击率');
    } else if (coldStartPerformance > 70) {
      insights.push('冷启动阶段表现优秀，内容具有较强吸引力');
    }
    
    if (userEngagement < 5) {
      insights.push('用户互动率偏低，建议增加互动元素如提问、投票等');
    } else if (userEngagement > 15) {
      insights.push('用户互动率很高，内容引发了用户强烈共鸣');
    }
    
    if (contentQuality < 60) {
      insights.push('内容质量评分较低，建议优化内容结构和信息密度');
    } else if (contentQuality > 85) {
      insights.push('内容质量优秀，符合平台推荐标准');
    }
    
    if (metrics.shares > metrics.likes) {
      insights.push('分享率高于点赞率，内容具有较强的传播价值');
    }

    res.json({
      success: true,
      data: {
        coldStartPerformance,
        userEngagement,
        contentQuality,
        recommendationScore,
        insights
      }
    });
  } catch (error) {
    console.error('获取推荐洞察失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐洞察失败'
    });
  }
});

// 获取内容优化建议
router.get('/optimization-suggestions', async (req, res) => {
  try {
    const { contentId } = req.query;
    
    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: '缺少内容ID'
      });
    }

    // 获取内容发布记录
    const publishRecord = await PublishRecord.findOne({ contentId })
      .populate('contentId', 'title content type quality wordCount');

    if (!publishRecord) {
      return res.status(404).json({
        success: false,
        message: '内容发布记录不存在'
      });
    }

    const content = publishRecord.contentId;
    const metrics = publishRecord.metrics || {};
    
    // 生成优化建议
    const titleOptimization = [];
    const contentOptimization = [];
    const timingOptimization = [];
    const audienceOptimization = [];

    // 标题优化建议
    if (content.title.length < 10) {
      titleOptimization.push('标题较短，建议增加关键词以提高搜索曝光');
    } else if (content.title.length > 30) {
      titleOptimization.push('标题较长，建议精简以提高阅读体验');
    }
    
    if (!content.title.includes('？') && !content.title.includes('!')) {
      titleOptimization.push('标题缺乏情感色彩，建议添加问号或感叹号增强吸引力');
    }
    
    if (!content.title.includes('最新') && !content.title.includes('突发')) {
      titleOptimization.push('标题缺乏时效性词汇，建议添加时间相关词汇');
    }

    // 内容优化建议
    if (content.wordCount < 500) {
      contentOptimization.push('内容字数较少，建议增加信息密度和细节描述');
    } else if (content.wordCount > 2000) {
      contentOptimization.push('内容字数较多，建议分段并添加小标题提高可读性');
    }
    
    if (content.quality < 70) {
      contentOptimization.push('内容质量评分较低，建议增加数据支撑和案例引用');
    }
    
    if (!content.content.includes('数据') && !content.content.includes('研究')) {
      contentOptimization.push('内容缺乏数据支撑，建议添加相关统计数据');
    }
    
    if (!content.content.includes('案例') && !content.content.includes('实例')) {
      contentOptimization.push('内容缺乏实际案例，建议添加具体案例说明');
    }

    // 发布时机建议
    const publishHour = new Date(publishRecord.publishTime).getHours();
    if (publishHour < 8 || publishHour > 22) {
      timingOptimization.push('发布时间较晚，建议选择用户活跃时段（8:00-22:00）发布');
    } else {
      timingOptimization.push('发布时间选择合理，符合用户活跃时段');
    }
    
    if (metrics.views < 1000) {
      timingOptimization.push('浏览量较低，建议尝试不同时间段发布同类内容');
    }

    // 受众优化建议
    const engagementRate = metrics.views > 0 ? 
      ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100 : 0;
    
    if (engagementRate < 5) {
      audienceOptimization.push('用户互动率偏低，建议优化内容以更好匹配目标受众兴趣');
    } else if (engagementRate > 15) {
      audienceOptimization.push('用户互动率很高，建议继续深耕该受众群体');
    }
    
    if (metrics.shares > metrics.likes * 2) {
      audienceOptimization.push('内容分享率很高，适合扩大传播，建议增加社交分享引导');
    }

    res.json({
      success: true,
      data: {
        titleOptimization,
        contentOptimization,
        timingOptimization,
        audienceOptimization
      }
    });
  } catch (error) {
    console.error('获取优化建议失败:', error);
    res.status(500).json({
      success: false,
      message: '获取优化建议失败'
    });
  }
});

// 获取热点话题统计
router.get('/hot-topics', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const topicStats = await HotTopic.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgHeat: { $avg: '$heat' },
          maxHeat: { $max: '$heat' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: topicStats
    });
  } catch (error) {
    console.error('获取热点话题统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点话题统计失败'
    });
  }
});

module.exports = router;
