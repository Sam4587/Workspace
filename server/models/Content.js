const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['article', 'micro', 'video', 'audio'],
    required: true
  },
  hotTopicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotTopic'
  },
  keywords: [{
    type: String
  }],
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0
  },
  quality: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  suggestions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'rejected', 'published'],
    default: 'draft'
  },
  author: {
    type: String,
    default: 'AI生成'
  },
  metadata: {
    targetAudience: String,
    tone: String,
    length: String,
    includeData: Boolean,
    includeCase: Boolean,
    includeExpert: Boolean
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

contentSchema.index({ type: 1 });
contentSchema.index({ status: 1 });
contentSchema.index({ hotTopicId: 1 });
contentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Content', contentSchema);
