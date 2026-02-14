/**
 * 存储管理器
 * 统一管理 MongoDB 和 Redis 操作，借鉴 TrendRadar 数据层设计
 */

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

class StorageManager {
  constructor() {
    this.mongoConnection = null;
    this.redisClient = null;
    this.models = {};
    this.isConnected = false;
  }

  /**
   * 初始化连接
   * @param {Object} config - 配置
   * @returns {Promise<void>}
   */
  async initialize(config = {}) {
    const mongoUrl = config.mongoUrl || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-content';
    const redisUrl = config.redisUrl || process.env.REDIS_URL;

    try {
      // 连接 MongoDB
      await this.connectMongo(mongoUrl);

      // 连接 Redis (可选)
      if (redisUrl) {
        await this.connectRedis(redisUrl);
      }

      // 初始化模型
      this.initializeModels();

      this.isConnected = true;
      logger.info('[StorageManager] 初始化完成');
    } catch (error) {
      logger.error(`[StorageManager] 初始化失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 连接 MongoDB
   * @param {string} url - MongoDB 连接 URL
   */
  async connectMongo(url) {
    try {
      this.mongoConnection = await mongoose.connect(url, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      logger.info('[StorageManager] MongoDB 连接成功');

      // 监听连接事件
      mongoose.connection.on('error', (err) => {
        logger.error(`[StorageManager] MongoDB 错误: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('[StorageManager] MongoDB 断开连接');
      });
    } catch (error) {
      logger.error(`[StorageManager] MongoDB 连接失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 连接 Redis
   * @param {string} url - Redis 连接 URL
   */
  async connectRedis(url) {
    try {
      const { createClient } = require('redis');
      this.redisClient = createClient({ url });

      this.redisClient.on('error', (err) => {
        logger.error(`[StorageManager] Redis 错误: ${err.message}`);
      });

      await this.redisClient.connect();
      logger.info('[StorageManager] Redis 连接成功');
    } catch (error) {
      logger.warn(`[StorageManager] Redis 连接失败: ${error.message}`);
      this.redisClient = null;
    }
  }

  /**
   * 初始化数据模型
   */
  initializeModels() {
    // 热点话题模型
    const HotTopicSchema = new mongoose.Schema({
      title: { type: String, required: true, index: true },
      source: { type: String, required: true, index: true },
      sourceId: { type: String, index: true },
      heat: { type: Number, default: 0 },
      category: { type: String, default: 'other' },
      trend: { type: String, default: 'new' },
      keywords: [String],
      description: String,
      sourceUrl: String,
      coverImage: String,
      history: [{
        heat: Number,
        timestamp: { type: Date, default: Date.now }
      }],
      firstSeen: { type: Date, default: Date.now },
      lastUpdated: { type: Date, default: Date.now },
      expiryAt: { type: Date, expires: 60 * 60 * 24 * 7 } // 7天后过期
    }, {
      timestamps: true,
      collection: 'hot_topics'
    });

    // 创建索引
    HotTopicSchema.index({ title: 1, source: 1 }, { unique: true });
    HotTopicSchema.index({ heat: -1 });
    HotTopicSchema.index({ lastUpdated: -1 });

    // 内容模型
    const ContentSchema = new mongoose.Schema({
      title: { type: String, required: true },
      type: { type: String, enum: ['article', 'weibo', 'video_script', 'xiaohongshu'], required: true },
      content: { type: String, required: true },
      topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'HotTopic' },
      topicTitle: String,
      aiProvider: String,
      model: String,
      status: { type: String, enum: ['draft', 'published', 'failed'], default: 'draft' },
      publishedTo: [String],
      stats: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
      },
      metadata: mongoose.Schema.Types.Mixed,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }, {
      collection: 'contents'
    });

    ContentSchema.index({ type: 1, status: 1 });
    ContentSchema.index({ createdAt: -1 });

    // 分析报告模型
    const AnalysisReportSchema = new mongoose.Schema({
      type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
      date: { type: Date, required: true },
      data: mongoose.Schema.Types.Mixed,
      stats: mongoose.Schema.Types.Mixed,
      insights: [String],
      generatedAt: { type: Date, default: Date.now }
    }, {
      collection: 'analysis_reports'
    });

    AnalysisReportSchema.index({ type: 1, date: -1 });

    // 注册模型
    this.models.HotTopic = mongoose.model('HotTopic', HotTopicSchema);
    this.models.Content = mongoose.model('Content', ContentSchema);
    this.models.AnalysisReport = mongoose.model('AnalysisReport', AnalysisReportSchema);

    logger.info('[StorageManager] 数据模型初始化完成');
  }

  /**
   * 获取模型
   * @param {string} name - 模型名称
   * @returns {mongoose.Model}
   */
  getModel(name) {
    return this.models[name];
  }

  // ==================== 热点话题操作 ====================

  /**
   * 保存热点话题
   * @param {Object} topic - 话题数据
   * @returns {Promise<Object>}
   */
  async saveTopic(topic) {
    const model = this.models.HotTopic;

    try {
      const existing = await model.findOne({ title: topic.title, source: topic.source });

      if (existing) {
        // 更新现有记录
        existing.heat = topic.heat;
        existing.trend = topic.trend || existing.trend;
        existing.lastUpdated = new Date();

        // 添加历史记录
        if (topic.heat !== existing.heat) {
          existing.history.push({ heat: topic.heat, timestamp: new Date() });
        }

        await existing.save();
        return existing;
      }

      // 创建新记录
      const newTopic = new model(topic);
      await newTopic.save();
      return newTopic;
    } catch (error) {
      logger.error(`[StorageManager] 保存话题失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量保存热点话题
   * @param {Object[]} topics - 话题数组
   * @returns {Promise<number>}
   */
  async saveTopicsBatch(topics) {
    let saved = 0;

    for (const topic of topics) {
      try {
        await this.saveTopic(topic);
        saved++;
      } catch (error) {
        logger.warn(`[StorageManager] 批量保存跳过: ${error.message}`);
      }
    }

    return saved;
  }

  /**
   * 获取热点话题
   * @param {Object} query - 查询条件
   * @param {Object} options - 选项
   * @returns {Promise<Object[]>}
   */
  async getTopics(query = {}, options = {}) {
    const model = this.models.HotTopic;
    const { limit = 50, sort = { heat: -1 }, skip = 0 } = options;

    return model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * 获取热门话题
   * @param {number} limit - 数量限制
   * @returns {Promise<Object[]>}
   */
  async getTopTopics(limit = 20) {
    return this.getTopics({}, { limit, sort: { heat: -1 } });
  }

  /**
   * 获取话题历史
   * @param {string} topicId - 话题 ID
   * @returns {Promise<Object>}
   */
  async getTopicHistory(topicId) {
    const model = this.models.HotTopic;
    const topic = await model.findById(topicId).lean();
    return topic?.history || [];
  }

  // ==================== 内容操作 ====================

  /**
   * 保存内容
   * @param {Object} content - 内容数据
   * @returns {Promise<Object>}
   */
  async saveContent(content) {
    const model = this.models.Content;

    try {
      const newContent = new model(content);
      await newContent.save();
      return newContent;
    } catch (error) {
      logger.error(`[StorageManager] 保存内容失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取内容列表
   * @param {Object} query - 查询条件
   * @param {Object} options - 选项
   * @returns {Promise<Object[]>}
   */
  async getContents(query = {}, options = {}) {
    const model = this.models.Content;
    const { limit = 20, sort = { createdAt: -1 }, skip = 0 } = options;

    return model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * 更新内容状态
   * @param {string} contentId - 内容 ID
   * @param {string} status - 状态
   * @param {Object} metadata - 额外元数据
   * @returns {Promise<Object>}
   */
  async updateContentStatus(contentId, status, metadata = {}) {
    const model = this.models.Content;

    return model.findByIdAndUpdate(
      contentId,
      { status, ...metadata, updatedAt: new Date() },
      { new: true }
    );
  }

  // ==================== 分析报告操作 ====================

  /**
   * 保存分析报告
   * @param {Object} report - 报告数据
   * @returns {Promise<Object>}
   */
  async saveReport(report) {
    const model = this.models.AnalysisReport;

    try {
      const newReport = new model(report);
      await newReport.save();
      return newReport;
    } catch (error) {
      logger.error(`[StorageManager] 保存报告失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取最新报告
   * @param {string} type - 报告类型
   * @returns {Promise<Object>}
   */
  async getLatestReport(type) {
    const model = this.models.AnalysisReport;
    return model.findOne({ type }).sort({ date: -1 }).lean();
  }

  // ==================== Redis 缓存操作 ====================

  /**
   * 设置缓存
   * @param {string} key - 键
   * @param {*} value - 值
   * @param {number} ttl - 过期时间(秒)
   */
  async setCache(key, value, ttl = 3600) {
    if (!this.redisClient) return false;

    try {
      const data = JSON.stringify(value);
      if (ttl > 0) {
        await this.redisClient.setEx(key, ttl, data);
      } else {
        await this.redisClient.set(key, data);
      }
      return true;
    } catch (error) {
      logger.warn(`[StorageManager] 设置缓存失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 键
   * @returns {Promise<*>}
   */
  async getCache(key) {
    if (!this.redisClient) return null;

    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn(`[StorageManager] 获取缓存失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 键
   */
  async deleteCache(key) {
    if (!this.redisClient) return false;

    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      logger.warn(`[StorageManager] 删除缓存失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 清除匹配的缓存
   * @param {string} pattern - 匹配模式
   */
  async clearCachePattern(pattern) {
    if (!this.redisClient) return 0;

    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.warn(`[StorageManager] 清除缓存失败: ${error.message}`);
      return 0;
    }
  }

  // ==================== 统计操作 ====================

  /**
   * 获取统计数据
   * @returns {Promise<Object>}
   */
  async getStats() {
    const HotTopic = this.models.HotTopic;
    const Content = this.models.Content;

    const [topicCount, contentCount, todayTopics] = await Promise.all([
      HotTopic.countDocuments(),
      Content.countDocuments(),
      HotTopic.countDocuments({
        firstSeen: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    return {
      totalTopics: topicCount,
      totalContents: contentCount,
      todayTopics,
      redisConnected: !!this.redisClient,
      mongoConnected: this.isConnected
    };
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('[StorageManager] MongoDB 连接已关闭');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('[StorageManager] Redis 连接已关闭');
      }

      this.isConnected = false;
    } catch (error) {
      logger.error(`[StorageManager] 关闭连接失败: ${error.message}`);
    }
  }
}

// 单例模式
const storageManager = new StorageManager();

module.exports = {
  StorageManager,
  storageManager
};
