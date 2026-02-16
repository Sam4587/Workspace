const mongoose = require('mongoose');
const HotTopic = require('../models/HotTopic');
const logger = require('../utils/logger');

const TrendTimelineSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotTopic',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  rank: {
    type: Number,
    min: 1,
    max: 100
  },
  heat: {
    type: Number,
    min: 0,
    max: 100
  },
  isNew: {
    type: Boolean,
    default: false,
    index: true
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable', 'new', 'hot'],
    default: 'stable'
  }
});

TrendTimelineSchema.index({ topicId: 1, timestamp: -1 });
TrendTimelineSchema.index({ isNew: 1, timestamp: -1 });

const TrendTimeline = mongoose.model('TrendTimeline', TrendTimelineSchema);

class TrendAnalysisService {
  async recordTopicSnapshot(topics) {
    const records = [];

    for (const topic of topics) {
      const existing = await TrendTimeline.findOne({
        topicId: topic._id,
        title: topic.title,
        source: topic.source
      }).sort({ timestamp: -1 });

      if (existing) {
        const prevRank = existing.rank;
        const newRank = topic.heat;

        let trend = 'stable';
        if (newRank > prevRank) trend = 'up';
        else if (newRank < prevRank) trend = 'down';

        if (topic.heat >= 80) trend = 'hot';

        await TrendTimeline.findByIdAndUpdate(existing._id, {
          rank: topic.heat,
          heat: topic.heat,
          trend: trend,
          isNew: false
        });
      } else {
        await TrendTimeline.create({
          topicId: topic._id,
          title: topic.title,
          source: topic.source,
          rank: topic.heat,
          heat: topic.heat,
          isNew: true,
          trend: topic.heat >= 80 ? 'hot' : 'new'
        });
      }

      records.push({
        topicId: topic._id,
        title: topic.title,
        source: topic.source,
        rank: topic.heat,
        heat: topic.heat,
        isNew: !existing,
        trend: topic.trend || 'stable'
      });
    }

    return records;
  }

  async getNewTopics(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const newTopics = await TrendTimeline.find({
      isNew: true,
      timestamp: { $gte: since }
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

    return newTopics.map(t => ({
      ...t,
      isNew: true,
      timestamp: t.timestamp
    }));
  }

  async getTopicTrend(topicId, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const timeline = await TrendTimeline.find({
      topicId,
      timestamp: { $gte: since }
    })
    .sort({ timestamp: 1 })
    .lean();

    if (timeline.length === 0) {
      return null;
    }

    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    const heatChange = last.heat - first.heat;
    const rankChange = last.rank - first.rank;

    const peaks = timeline.filter(t => t.trend === 'hot');
    const duration = last.timestamp - first.timestamp;

    return {
      topicId,
      title: last.title,
      source: last.source,
      currentRank: last.rank,
      currentHeat: last.heat,
      heatChange,
      rankChange,
      duration: duration / (1000 * 60 * 60),
      trendCount: timeline.length,
      hotCount: peaks.length,
      timeline: timeline.map(t => ({
        timestamp: t.timestamp,
        rank: t.rank,
        heat: t.heat,
        trend: t.trend
      }))
    };
  }

  async getCrossPlatformAnalysis(title) {
    const sources = ['微博热搜', '今日头条', '百度热搜'];

    const analysis = await HotTopic.aggregate([
      {
        $match: {
          title: { $regex: title, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          avgHeat: { $avg: '$heat' },
          maxHeat: { $max: '$heat' },
          latestAt: { $max: '$publishedAt' }
        }
      }
    ]);

    const result = {};
    sources.forEach(source => {
      const found = analysis.find(a => a._id === source);
      result[source] = found ? {
        count: found.count,
        avgHeat: Math.round(found.avgHeat || 0),
        maxHeat: found.maxHeat || 0,
        latestAt: found.latestAt
      } : null;
    });

    return result;
  }

  async getTrendingStats(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await TrendTimeline.aggregate([
      {
        $match: {
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          newTopics: { $sum: { $cond: { if: { $eq: ['$isNew', true] }, then: 1, else: 0 } } },
          hotTopics: { $sum: { $cond: { if: { $eq: ['$trend', 'hot'] }, then: 1, else: 0 } } },
          totalSnapshots: { $sum: 1 },
          avgHeat: { $avg: '$heat' }
        }
      },
      {
        $project: {
          _id: 0,
          newTopics: 1,
          hotTopics: 1,
          totalSnapshots: 1,
          avgHeat: 1
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        newTopics: 0,
        hotTopics: 0,
        totalSnapshots: 0,
        avgHeat: 0,
        dateRange: days
      };
    }

    return {
      newTopics: stats[0].newTopics || 0,
      hotTopics: stats[0].hotTopics || 0,
      totalSnapshots: stats[0].totalSnapshots || 0,
      avgHeat: Math.round(stats[0].avgHeat || 0),
      dateRange: days
    };
  }

  async cleanupOldTimeline(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await TrendTimeline.deleteMany({
      timestamp: { $lt: since }
    });

    if (result.deletedCount > 0) {
      logger.info(`清理趋势时间轴数据 ${result.deletedCount} 条`);
    }

    return result.deletedCount;
  }
}

module.exports = {
  TrendAnalysisService,
  TrendTimeline
};
