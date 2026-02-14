/**
 * 核心模块入口
 */

const { TopicAnalyzer, topicAnalyzer } = require('./TopicAnalyzer');
const { TrendAnalyzer, trendAnalyzer } = require('./TrendAnalyzer');
const { StorageManager, storageManager } = require('./StorageManager');
const {
  SourceType,
  Source,
  Category,
  Trend,
  ContentStatus,
  AIProvider,
  NotificationChannel,
  AIProviderModelMap,
  HotTopic,
  Content,
  AIResponse,
  NotificationResult
} = require('./types');

module.exports = {
  // 分析器
  TopicAnalyzer,
  topicAnalyzer,
  TrendAnalyzer,
  trendAnalyzer,

  // 存储管理
  StorageManager,
  storageManager,

  // 类型定义
  types: {
    SourceType,
    Source,
    Category,
    Trend,
    ContentStatus,
    AIProvider,
    NotificationChannel,
    AIProviderModelMap,
    HotTopic,
    Content,
    AIResponse,
    NotificationResult
  }
};
