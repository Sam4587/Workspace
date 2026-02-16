const mongoose = require('mongoose');

const publishRecordSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  platform: {
    type: String,
    enum: ['toutiao', 'weibo', 'weixin'],
    default: 'toutiao'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  publishTime: {
    type: Date,
    default: Date.now
  },
  scheduledTime: {
    type: Date
  },
  platformUrl: {
    type: String
  },
  failReason: {
    type: String
  },
  metrics: {
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
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

publishRecordSchema.index({ contentId: 1 });
publishRecordSchema.index({ platform: 1 });
publishRecordSchema.index({ status: 1 });
publishRecordSchema.index({ publishTime: -1 });

module.exports = mongoose.model('PublishRecord', publishRecordSchema);
