/**
 * 转录结果数据库模型
 * 用于持久化存储转录结果和任务信息
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// 导入类型定义
const { 
  TranscriptionEngine, 
  TranscriptionStatus, 
  LanguageCode 
} = require('./TranscriptModel');

// 转录结果模式
const TranscriptSchema = new Schema({
  // 基础信息
  videoId: {
    type: String,
    required: true,
    index: true,
    description: '关联的视频ID'
  },
  
  taskId: {
    type: String,
    index: true,
    description: '关联的任务ID'
  },

  // 转录基本信息
  engine: {
    type: String,
    enum: Object.values(TranscriptionEngine),
    required: true,
    description: '使用的转录引擎'
  },

  status: {
    type: String,
    enum: Object.values(TranscriptionStatus),
    default: TranscriptionStatus.PENDING,
    index: true,
    description: '转录状态'
  },

  duration: {
    type: Number,
    min: 0,
    description: '音频时长（秒）'
  },

  language: {
    type: String,
    enum: Object.values(LanguageCode),
    default: LanguageCode.CHINESE_SIMPLIFIED,
    description: '识别语言'
  },

  // 转录内容
  text: {
    type: String,
    maxlength: 100000, // 100KB 限制
    description: '完整转录文本'
  },

  // 时间片段
  segments: [{
    index: {
      type: Number,
      required: true
    },
    start: {
      type: Number,
      required: true,
      min: 0
    },
    end: {
      type: Number,
      required: true,
      min: 0
    },
    text: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    },
    speaker: {
      type: String,
      default: 'unknown'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }],

  // 关键词
  keywords: [{
    word: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: Number,
      min: 1,
      default: 1
    },
    timestamps: [{
      type: Number
    }],
    importance: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  }],

  // 元数据
  metadata: {
    engine: String,
    model: String,
    processingTime: {
      type: Number,
      min: 0
    },
    deviceId: String,
    engineSpecific: Schema.Types.Mixed,
    version: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },

  // 分析结果
  analysis: {
    summary: String,
    keyPoints: [String],
    quotes: [String],
    topics: [String],
    sentiment: {
      polarity: {
        type: String,
        enum: ['positive', 'negative', 'neutral']
      },
      score: {
        type: Number,
        min: -1,
        max: 1
      }
    },
    contentType: String,
    suitablePlatforms: [String],
    statistics: {
      wordCount: Number,
      sentenceCount: Number,
      averageSentenceLength: Number
    }
  },

  // 错误信息
  error: {
    type: String,
    maxlength: 1000
  },

  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// 索引
TranscriptSchema.index({ videoId: 1, status: 1 });
TranscriptSchema.index({ engine: 1, createdAt: -1 });
TranscriptSchema.index({ 'metadata.processingTime': 1 });
TranscriptSchema.index({ 'analysis.sentiment.polarity': 1 });

// 虚拟属性
TranscriptSchema.virtual('wordCount').get(function() {
  return this.text ? this.text.split(/\s+/).length : 0;
});

TranscriptSchema.virtual('segmentCount').get(function() {
  return this.segments ? this.segments.length : 0;
});

TranscriptSchema.virtual('keywordCount').get(function() {
  return this.keywords ? this.keywords.length : 0;
});

// 中间件
TranscriptSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 实例方法
TranscriptSchema.methods.getDurationFormatted = function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = Math.floor(this.duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

TranscriptSchema.methods.getTextPreview = function(length = 100) {
  if (!this.text) return '';
  return this.text.length > length 
    ? this.text.substring(0, length) + '...' 
    : this.text;
};

TranscriptSchema.methods.getKeywordsSorted = function(sortBy = 'frequency') {
  if (!this.keywords) return [];
  
  return [...this.keywords].sort((a, b) => {
    if (sortBy === 'frequency') {
      return b.frequency - a.frequency;
    } else if (sortBy === 'importance') {
      return b.importance - a.importance;
    }
    return 0;
  });
};

// 静态方法
TranscriptSchema.statics.findByVideoId = function(videoId) {
  return this.findOne({ videoId });
};

TranscriptSchema.statics.findByStatus = function(status, options = {}) {
  const query = this.find({ status });
  
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort);
  
  return query;
};

TranscriptSchema.statics.getStatistics = async function(filters = {}) {
  const match = {};
  if (filters.engine) match.engine = filters.engine;
  if (filters.status) match.status = filters.status;
  if (filters.dateFrom) match.createdAt = { $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    match.createdAt = match.createdAt || {};
    match.createdAt.$lte = new Date(filters.dateTo);
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgProcessingTime: { $avg: '$metadata.processingTime' },
        avgDuration: { $avg: '$duration' },
        byEngine: {
          $push: {
            engine: '$engine',
            count: 1,
            processingTime: '$metadata.processingTime'
          }
        },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    avgProcessingTime: 0,
    avgDuration: 0,
    byEngine: [],
    byStatus: []
  };
};

// 转录任务模式
const TranscriptionTaskSchema = new Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  videoId: {
    type: String,
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: Object.values(TranscriptionStatus),
    default: TranscriptionStatus.PENDING,
    index: true
  },

  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  mediaPath: {
    type: String,
    required: true
  },

  options: {
    type: Schema.Types.Mixed,
    default: {}
  },

  result: {
    type: Schema.Types.ObjectId,
    ref: 'Transcript'
  },

  error: String,

  retryCount: {
    type: Number,
    default: 0
  },

  maxRetries: {
    type: Number,
    default: 3
  },

  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },

  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  startedAt: Date,
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // 超时控制
  timeout: {
    type: Number,
    default: 300000 // 5分钟
  },

  expiresAt: {
    type: Date,
    index: { expires: '7d' } // 7天后自动删除
  }
});

// 任务索引
TranscriptionTaskSchema.index({ status: 1, priority: -1, createdAt: 1 });
TranscriptionTaskSchema.index({ videoId: 1, createdAt: -1 });
TranscriptionTaskSchema.index({ expiresAt: 1 });

// 任务中间件
TranscriptionTaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (this.status === TranscriptionStatus.PROCESSING && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  if ((this.status === TranscriptionStatus.COMPLETED || 
       this.status === TranscriptionStatus.FAILED) && 
      !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// 任务静态方法
TranscriptionTaskSchema.statics.getActiveTasks = function() {
  return this.find({ 
    status: { 
      $in: [TranscriptionStatus.PENDING, TranscriptionStatus.PROCESSING] 
    } 
  }).sort({ priority: -1, createdAt: 1 });
};

TranscriptionTaskSchema.statics.getPendingTasks = function(limit = 10) {
  return this.find({ status: TranscriptionStatus.PENDING })
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

TranscriptionTaskSchema.statics.getByVideoId = function(videoId) {
  return this.find({ videoId }).sort({ createdAt: -1 });
};

TranscriptionTaskSchema.statics.cleanupExpired = function() {
  return this.deleteMany({ 
    expiresAt: { $lt: new Date() } 
  });
};

// 模型导出
const Transcript = mongoose.model('Transcript', TranscriptSchema);
const TranscriptionTask = mongoose.model('TranscriptionTask', TranscriptionTaskSchema);

module.exports = {
  Transcript,
  TranscriptionTask,
  TranscriptSchema,
  TranscriptionTaskSchema
};