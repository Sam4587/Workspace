/**
 * 核心类型和常量定义
 * 借鉴 TrendRadar 模块化架构设计
 */

// 数据源类型
const SourceType = {
  API: 'api',
  SCRAPE: 'scrape',
  RSS: 'rss'
};

// 支持的数据源
const Source = {
  WEIBO: '微博热搜',
  TOUTIAO: '今日头条',
  BAIDU: '百度热搜',
  ZHIHU: '知乎热榜',
  DOUYIN: '抖音热搜',
  BILIBILI: 'B站热门',
  RSS: 'RSS订阅'
};

// 热点分类
const Category = {
  ENTERTAINMENT: '娱乐',
  TECH: '科技',
  FINANCE: '财经',
  SPORTS: '体育',
  SOCIETY: '社会',
  INTERNATIONAL: '国际',
  OTHER: '其他'
};

// 趋势方向
const Trend = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable',
  NEW: 'new',
  HOT: 'hot'
};

// AI 提供商
const AIProvider = {
  OPENAI: 'openai',
  CLAUDE: 'claude',
  DEEPSEEK: 'deepseek',
  MOONSHOT: 'moonshot',
  ZHIPU: 'zhipu',
  QWEN: 'qwen',
  BAIDU: 'baidu',
  XUNFEI: 'xunfei'
};

// AI 提供商到 LiteLLM 模型的映射
const AIProviderModelMap = {
  [AIProvider.OPENAI]: 'gpt-4',
  [AIProvider.CLAUDE]: 'claude-3-opus-20240229',
  [AIProvider.DEEPSEEK]: 'deepseek/deepseek-chat',
  [AIProvider.MOONSHOT]: 'moonshot/moonshot-v1-8k',
  [AIProvider.ZHIPU]: 'zhipu/glm-4',
  [AIProvider.QWEN]: 'qwen/qwen-turbo',
  [AIProvider.BAIDU]: 'baidu/ernie-bot-4',
  [AIProvider.XUNFEI]: 'xunfei/spark-v3.5'
};

// 通知渠道
const NotificationChannel = {
  WEWORK: 'wework',
  DINGTALK: 'dingtalk',
  FEISHU: 'feishu',
  TELEGRAM: 'telegram',
  EMAIL: 'email',
  WEBHOOK: 'webhook',
  NTFY: 'ntfy',
  BARK: 'bark',
  SLACK: 'slack'
};

// 内容类型
const ContentType = {
  ARTICLE: 'article',
  MICRO_POST: 'micro_post',
  VIDEO_SCRIPT: 'video_script',
  AUDIO_SCRIPT: 'audio_script'
};

// 发布状态
const PublishStatus = {
  PENDING: 'pending',
  PUBLISHING: 'publishing',
  PUBLISHED: 'published',
  FAILED: 'failed',
  SCHEDULED: 'scheduled'
};

/**
 * @typedef {Object} HotTopic
 * @property {string} title - 热点标题
 * @property {string} description - 热点描述
 * @property {string} category - 分类
 * @property {number} heat - 热度值 (0-100)
 * @property {string} trend - 趋势方向
 * @property {string} source - 数据来源
 * @property {string} sourceUrl - 来源链接
 * @property {string[]} keywords - 关键词
 * @property {number} suitability - 适配度评分
 * @property {Date} publishedAt - 发布时间
 */

/**
 * @typedef {Object} FetcherConfig
 * @property {string} name - 数据源名称
 * @property {string} url - 数据源 URL
 * @property {string} type - 数据源类型
 * @property {Object} [headers] - 请求头
 * @property {number} [timeout] - 超时时间
 * @property {number} [cacheTTL] - 缓存时间
 */

/**
 * @typedef {Object} AIResponse
 * @property {string} content - 生成的内容
 * @property {Object} usage - Token 使用情况
 * @property {string} model - 使用的模型
 * @property {string} provider - AI 提供商
 */

/**
 * @typedef {Object} NotificationResult
 * @property {string} channel - 通知渠道
 * @property {boolean} success - 是否成功
 * @property {string} [error] - 错误信息
 */

module.exports = {
  SourceType,
  Source,
  Category,
  Trend,
  AIProvider,
  AIProviderModelMap,
  NotificationChannel,
  ContentType,
  PublishStatus
};
