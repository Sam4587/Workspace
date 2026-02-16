/**
 * 内容数据模型
 * 用于存储生成的内容及其状态信息
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// 内容状态枚举
const CONTENT_STATUS = {
  DRAFT: 'draft',           // 草稿
  REVIEW: 'review',         // 审核中
  APPROVED: 'approved',     // 已批准
  PUBLISHED: 'published',   // 已发布
  REJECTED: 'rejected',     // 已拒绝
  ARCHIVED: 'archived'      // 已归档
};

// 平台发布状态枚举
const PLATFORM_STATUS = {
  PENDING: 'pending',       // 待发布
  PUBLISHING: 'publishing', // 发布中
  SUCCESS: 'success',       // 发布成功
  FAILED: 'failed',         // 发布失败
  CANCELLED: 'cancelled'    // 已取消
};

const ContentSchema = new Schema({
  // 基础信息
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  summary: {
    type: String,
    maxlength: 500
  },
  excerpt: {
    type: String,
    maxlength: 200
  },

  // 来源信息
  sourceType: {
    type: String,
    enum: ['hot_topic', 'manual', 'rss', 'video_transcript', 'custom'],
    default: 'manual'
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    ref: 'HotTopic'  // 如果来自热点话题
  },
  sourceUrl: {
    type: String,
    maxlength: 500
  },

  // 平台配置
  platforms: [{
    platform: {
      type: String,
      required: true
    },
    title: String,          // 平台特定标题
    content: String,        // 平台特定内容
    tags: [String],         // 平台特定标签
    config: {               // 平台特定配置
      scheduleTime: Date,   // 计划发布时间
      targetAudience: String // 目标受众
    }
  }],

  // 生成信息
  generatedBy: {
    type: String,
    enum: ['ai', 'manual', 'hybrid'],
    default: 'ai'
  },
  aiModel: String,         // 使用的AI模型
  aiPrompt: String,        // 使用的提示词
  generationParams: {       // 生成参数
    temperature: Number,
    maxTokens: Number
  },

  // 状态管理
  status: {
    type: String,
    enum: Object.values(CONTENT_STATUS),
    default: CONTENT_STATUS.DRAFT
  },
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(CONTENT_STATUS)
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: String,      // 操作人
    reason: String          // 状态变更原因
  }],

  // 发布信息
  publishInfo: {
    publishedPlatforms: [{
      platform: String,
      status: {
        type: String,
        enum: Object.values(PLATFORM_STATUS)
      },
      publishId: String,    // 发布任务ID
      publishTime: Date,
      result: Object,       // 发布结果详情
      error: String         // 错误信息
    }],
    publishTime: Date,      // 首次发布时间
    scheduleTime: Date      // 计划发布时间
  },

  // 效果追踪
  performance: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },

  // 分类标签
  category: String,
  tags: [String],
  keywords: [String],

  // 多媒体资源
  media: {
    images: [String],       // 图片URL数组
    video: String,          // 视频URL
    audio: String,          // 音频URL
  },

  // 元数据
  metadata: {
    wordCount: Number,
    readingTime: Number,    // 阅读时间（分钟）
    language: String,       // 内容语言
    sentiment: {           // 情感分析
      score: Number,
      label: String
    },
    qualityScore: {        // 质量评分
      score: Number,
      maxScore: Number,
      breakdown: Object
    }
  },

  // 审核信息
  review: {
    reviewer: String,
    reviewTime: Date,
    comments: String,
    isApproved: Boolean
  },

  // 用户关联
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  // 系统字段
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: String,
  updatedBy: String
}, {
  timestamps: true,
  collection: 'contents'
});

// 索引
ContentSchema.index({ status: 1, createdAt: -1 });
ContentSchema.index({ sourceId: 1 });
ContentSchema.index({ userId: 1 });
ContentSchema.index({ 'publishInfo.scheduleTime': 1 });
ContentSchema.index({ tags: 1 });
ContentSchema.index({ category: 1 });

// 中间件：更新时间
ContentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 虚拟字段：计算字段
ContentSchema.virtual('isPublished').get(function() {
  return this.status === CONTENT_STATUS.PUBLISHED;
});

ContentSchema.virtual('isScheduled').get(function() {
  return this.publishInfo?.scheduleTime && this.publishInfo.scheduleTime > new Date();
});

// 实例方法：状态变更
ContentSchema.methods.updateStatus = function(newStatus, user, reason = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: user,
    reason: reason
  });
};

// 实例方法：添加平台发布信息
ContentSchema.methods.addPlatformPublishInfo = function(platform, publishId, status = PLATFORM_STATUS.PENDING) {
  const platformInfo = this.publishInfo.publishedPlatforms.find(p => p.platform === platform);
  if (platformInfo) {
    platformInfo.status = status;
    platformInfo.publishId = publishId;
    platformInfo.publishTime = new Date();
  } else {
    this.publishInfo.publishedPlatforms.push({
      platform,
      status,
      publishId,
      publishTime: new Date()
    });
  }
};

// 实例方法：更新平台发布状态
ContentSchema.methods.updatePlatformStatus = function(platform, status, result = null) {
  const platformInfo = this.publishInfo.publishedPlatforms.find(p => p.platform === platform);
  if (platformInfo) {
    platformInfo.status = status;
    if (result) {
      platformInfo.result = result;
    }
    if (status === PLATFORM_STATUS.SUCCESS) {
      platformInfo.publishTime = new Date();
    }
  }
};

// 实例方法：更新性能数据
ContentSchema.methods.updatePerformance = function(data) {
  const now = new Date();
  Object.assign(this.performance, data, { lastUpdated: now });

  // 重新计算互动率
  if (this.performance.views > 0) {
    const engagement = (this.performance.likes + this.performance.comments + this.performance.shares) / this.performance.views;
    this.performance.engagementRate = engagement * 100;
  }
};

// 静态方法：创建草稿
ContentSchema.statics.createDraft = async function(contentData, userId) {
  const content = new this({
    ...contentData,
    status: CONTENT_STATUS.DRAFT,
    userId: userId || null,
    createdBy: userId || 'system'
  });

  return await content.save();
};

// 静态方法：查询发布内容
ContentSchema.statics.findPublished = async function(filters = {}) {
  return await this.find({
    status: CONTENT_STATUS.PUBLISHED,
    ...filters
  }).sort({ 'publishInfo.publishTime': -1 });
};

// 静态方法：查询待发布内容
ContentSchema.statics.findScheduled = async function() {
  return await this.find({
    status: CONTENT_STATUS.APPROVED,
    'publishInfo.scheduleTime': { $lte: new Date() },
    'publishInfo.publishedPlatforms': {
      $elemMatch: {
        status: { $in: [PLATFORM_STATUS.PENDING, PLATFORM_STATUS.PUBLISHING] }
      }
    }
  });
};

module.exports = {
  Content: mongoose.model('Content', ContentSchema),
  CONTENT_STATUS,
  PLATFORM_STATUS
};