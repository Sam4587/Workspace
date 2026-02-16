const mongoose = require('mongoose');

const hotTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  heat: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  source: {
    type: String,
    required: true
  },
  sourceUrl: {
    type: String
  },
  keywords: [{
    type: String
  }],
  suitability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  publishedAt: {
    type: Date,
    default: Date.now
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

hotTopicSchema.index({ heat: -1 });
hotTopicSchema.index({ category: 1, heat: -1 });
hotTopicSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('HotTopic', hotTopicSchema);
