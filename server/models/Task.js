/**
 * 任务模型
 * 用于跟踪内容生成、转录等长时间运行的任务
 */

const { Schema, model } = require('mongoose');

const TaskSchema = new Schema({
  // 任务基本信息
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 任务类型
  type: {
    type: String,
    required: true,
    enum: ['content_generation', 'video_transcription', 'content_rewrite', 'analysis'],
    index: true
  },
  
  // 任务状态
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // 关联资源ID
  resourceId: {
    type: String,
    required: true
  },
  
  // 任务参数
  parameters: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // 进度信息
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    message: {
      type: String,
      default: ''
    },
    currentStep: {
      type: String,
      default: ''
    },
    totalSteps: {
      type: Number,
      default: 0
    }
  },
  
  // 结果数据
  result: {
    type: Schema.Types.Mixed,
    default: null
  },
  
  // 错误信息
  error: {
    message: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      default: ''
    },
    stack: {
      type: String,
      default: ''
    }
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  startedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // 用户信息
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // 超时设置
  timeout: {
    type: Number,
    default: 300000 // 5分钟超时
  },
  
  // 重试次数
  retryCount: {
    type: Number,
    default: 0
  },
  
  maxRetries: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// 索引优化
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ status: 1, type: 1 });
// 注意：createdAt的索引已经在timestamps中自动创建

// 实例方法
TaskSchema.methods.updateProgress = function(percentage, message, currentStep) {
  this.progress.percentage = percentage;
  this.progress.message = message || this.progress.message;
  this.progress.currentStep = currentStep || this.progress.currentStep;
  return this.save();
};

TaskSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.startedAt = new Date();
  return this.save();
};

TaskSchema.methods.markAsCompleted = function(result) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.result = result;
  this.progress.percentage = 100;
  return this.save();
};

TaskSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.error = {
    message: error.message || '未知错误',
    code: error.code || 'UNKNOWN_ERROR',
    stack: error.stack || ''
  };
  return this.save();
};

TaskSchema.methods.canRetry = function() {
  return this.retryCount < this.maxRetries && 
         ['failed', 'cancelled'].includes(this.status);
};

TaskSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  this.status = 'pending';
  return this.save();
};

// 静态方法
TaskSchema.statics.findByTaskId = function(taskId) {
  return this.findOne({ taskId });
};

TaskSchema.statics.findByUser = function(userId, options = {}) {
  const { status, type, limit = 20, page = 1 } = options;
  const query = { userId };
  
  if (status) query.status = status;
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

TaskSchema.statics.getActiveTasks = function(userId) {
  return this.find({
    userId,
    status: { $in: ['pending', 'processing'] }
  }).sort({ createdAt: -1 });
};

TaskSchema.statics.cleanupOldTasks = function(days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['completed', 'failed', 'cancelled'] }
  });
};

module.exports = model('Task', TaskSchema);