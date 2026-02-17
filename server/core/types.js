/**
 * Core Type Definitions
 * 项目核心类型定义文件
 */

// 数据源类型枚举
const SourceType = {
  API: 'api',
  RSS: 'rss',
  SCRAPER: 'scraper',
  WEBSOCKET: 'websocket'
};

// 数据源枚举
const Source = {
  WEIBO: 'weibo',
  ZHIHU: 'zhihu',
  TOUTIAO: 'toutiao',
  BAIDU: 'baidu',
  DOUYIN: 'douyin',
  BILIBILI: 'bilibili',
  RSS: 'rss',
  OTHER: 'other'
};

// 分类枚举
const Category = {
  HOT: 'hot',
  SOCIAL: 'social',
  TECH: 'tech',
  ENTERTAINMENT: 'entertainment',
  SPORTS: 'sports',
  FINANCE: 'finance',
  OTHER: 'other'
};

// 趋势数据类型
class Trend {
  constructor(data = {}) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.url = data.url || '';
    this.source = data.source || '';
    this.category = data.category || Category.OTHER;
    this.hotScore = data.hotScore || 0;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.metadata = data.metadata || {};
  }
}

// AI 提供商枚举
const AIProvider = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  LOCAL: 'local'
};

// AI 提供商模型映射
const AIProviderModelMap = {
  [AIProvider.OPENAI]: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  [AIProvider.ANTHROPIC]: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  [AIProvider.GOOGLE]: ['gemini-pro', 'gemini-ultra'],
  [AIProvider.LOCAL]: ['local-model']
};

// 通知渠道枚举
const NotificationChannel = {
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook',
  PUSH: 'push'
};

// 抓取器配置类型
class FetcherConfig {
  constructor(data = {}) {
    this.name = data.name || '';
    this.url = data.url || '';
    this.type = data.type || SourceType.API;
    this.headers = data.headers || {};
    this.timeout = data.timeout || 15000;
    this.cacheTTL = data.cacheTTL || 1800;
  }
}

// 热点话题类型
class HotTopic {
  constructor(data = {}) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.url = data.url || '';
    this.source = data.source || '';
    this.hotScore = data.hotScore || 0;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.metadata = data.metadata || {};
  }
}

module.exports = {
  SourceType,
  Source,
  Category,
  Trend,
  AIProvider,
  AIProviderModelMap,
  NotificationChannel,
  FetcherConfig,
  HotTopic
};
