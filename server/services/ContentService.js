/**
 * 内容管理服务
 * 提供内容的CRUD操作、状态管理、发布管理等功能
 * 
 * 注意：本服务依赖 MongoDB 模型，当前项目已弃用 MongoDB
 * 该服务暂时禁用，待数据存储方案确定后重新实现
 */

const logger = require('../utils/logger');
const publishIntegration = require('./PublishIntegration');

// 模拟数据存储（内存）
const memoryStorage = {
  contents: []
};

class ContentService {
  constructor() {
    this.publishIntegration = publishIntegration;
  }

  async createContent(contentData, userId) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async getContentById(contentId) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async updateContent(contentId, updates) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async deleteContent(contentId) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async listContents(filters = {}) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async publishContent(contentId, platforms) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async getPublishStatus(contentId) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async batchPublish(contentIds, platforms) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }

  async getStatistics(filters = {}) {
    logger.warn('[ContentService] 服务已禁用，依赖 MongoDB');
    return { success: false, error: '服务已禁用' };
  }
}

const contentService = new ContentService();

module.exports = contentService;
  async create(contentData, userId) {
    try {
      // 验证必要字段
      if (!contentData.title || !contentData.content) {
        throw new Error('标题和内容为必填项');
      }

      const content = await Content.createDraft(contentData, userId);
      logger.info('[ContentService] 内容创建成功', {
        contentId: content._id,
        title: content.title,
        userId
      });

      return {
        success: true,
        content: content.toObject()
      };
    } catch (error) {
      logger.error('[ContentService] 创建内容失败', {
        error: error.message,
        userId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取内容详情
   * @param {string} contentId - 内容ID
   * @returns {Promise<Object>}
   */
  async getById(contentId) {
    try {
      const content = await Content.findById(contentId)
        .populate('sourceId', 'title heat category')
        .populate('userId', 'username email');

      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      return {
        success: true,
        content: content.toObject()
      };
    } catch (error) {
      logger.error('[ContentService] 获取内容详情失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新内容
   * @param {string} contentId - 内容ID
   * @param {Object} updateData - 更新数据
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async update(contentId, updateData, userId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      // 如果内容已发布，不允许修改核心内容
      if (content.status === CONTENT_STATUS.PUBLISHED) {
        // 只允许修改非核心字段
        const allowedFields = ['tags', 'category', 'metadata'];
        const updateKeys = Object.keys(updateData);
        const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
        if (invalidFields.length > 0) {
          return {
            success: false,
            error: `已发布内容不允许修改字段: ${invalidFields.join(', ')}`
          };
        }
      }

      Object.assign(content, updateData);
      content.updatedBy = userId;
      await content.save();

      logger.info('[ContentService] 内容更新成功', {
        contentId,
        userId
      });

      return {
        success: true,
        content: content.toObject()
      };
    } catch (error) {
      logger.error('[ContentService] 更新内容失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除内容
   * @param {string} contentId - 内容ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async delete(contentId, userId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      // 已发布内容不能直接删除
      if (content.status === CONTENT_STATUS.PUBLISHED) {
        return {
          success: false,
          error: '已发布内容不允许删除'
        };
      }

      await Content.findByIdAndDelete(contentId);

      logger.info('[ContentService] 内容删除成功', {
        contentId,
        userId
      });

      return {
        success: true,
        message: '内容已删除'
      };
    } catch (error) {
      logger.error('[ContentService] 删除内容失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分页查询内容
   * @param {Object} filters - 过滤条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>}
   */
  async list(filters = {}, page = 1, limit = 20) {
    try {
      const query = {};
      const skip = (page - 1) * limit;

      // 状态过滤
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query.status = { $in: filters.status };
        } else {
          query.status = filters.status;
        }
      }

      // 分类过滤
      if (filters.category) {
        query.category = filters.category;
      }

      // 标签过滤
      if (filters.tags && Array.isArray(filters.tags)) {
        query.tags = { $in: filters.tags };
      }

      // 关键词搜索
      if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        query.$or = [
          { title: searchRegex },
          { content: searchRegex },
          { summary: searchRegex }
        ];
      }

      // 平台过滤
      if (filters.platform) {
        query['platforms.platform'] = filters.platform;
      }

      // 用户过滤
      if (filters.userId) {
        query.userId = filters.userId;
      }

      // 时间范围过滤
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const [contents, total] = await Promise.all([
        Content.find(query)
          .populate('userId', 'username email')
          .populate('sourceId', 'title heat category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Content.countDocuments(query)
      ]);

      return {
        success: true,
        data: contents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('[ContentService] 查询内容列表失败', {
        filters,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新内容状态
   * @param {string} contentId - 内容ID
   * @param {string} status - 新状态
   * @param {string} userId - 用户ID
   * @param {string} reason - 状态变更原因
   * @returns {Promise<Object>}
   */
  async updateStatus(contentId, status, userId, reason = '') {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      // 验证状态转换是否合法
      const validTransitions = this.getValidStatusTransitions(content.status);
      if (!validTransitions.includes(status)) {
        return {
          success: false,
          error: `无效的状态转换: ${content.status} -> ${status}`
        };
      }

      content.updateStatus(status, userId, reason);
      await content.save();

      logger.info('[ContentService] 内容状态更新成功', {
        contentId,
        from: content.status,
        to: status,
        userId
      });

      return {
        success: true,
        content: content.toObject()
      };
    } catch (error) {
      logger.error('[ContentService] 更新内容状态失败', {
        contentId,
        status,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取有效状态转换
   * @param {string} currentStatus - 当前状态
   * @returns {Array}
   */
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      [CONTENT_STATUS.DRAFT]: [CONTENT_STATUS.REVIEW, CONTENT_STATUS.ARCHIVED],
      [CONTENT_STATUS.REVIEW]: [CONTENT_STATUS.APPROVED, CONTENT_STATUS.REJECTED, CONTENT_STATUS.DRAFT],
      [CONTENT_STATUS.APPROVED]: [CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.REVIEW],
      [CONTENT_STATUS.PUBLISHED]: [CONTENT_STATUS.ARCHIVED],
      [CONTENT_STATUS.REJECTED]: [CONTENT_STATUS.DRAFT, CONTENT_STATUS.REVIEW],
      [CONTENT_STATUS.ARCHIVED]: [CONTENT_STATUS.DRAFT]
    };

    return transitions[currentStatus] || [];
  }

  /**
   * 发布内容到指定平台
   * @param {string} contentId - 内容ID
   * @param {string} platform - 平台名称
   * @param {Object} options - 发布选项
   * @returns {Promise<Object>}
   */
  async publishToPlatform(contentId, platform, options = {}) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      // 检查内容状态
      if (content.status !== CONTENT_STATUS.APPROVED && content.status !== CONTENT_STATUS.PUBLISHED) {
        return {
          success: false,
          error: '内容必须是已批准状态才能发布'
        };
      }

      // 获取平台特定内容
      const platformConfig = content.platforms.find(p => p.platform === platform);
      const contentToPublish = {
        title: platformConfig?.title || content.title,
        content: platformConfig?.content || content.content,
        tags: platformConfig?.tags || [],
        images: content.media?.images || [],
        scheduleTime: platformConfig?.config?.scheduleTime || options.scheduleTime
      };

      // 发送到发布服务
      const publishResult = await this.publishIntegration.publish(platform, contentToPublish, options);

      if (publishResult.success) {
        // 更新内容的发布信息
        content.addPlatformPublishInfo(platform, publishResult.publishId, PLATFORM_STATUS.PUBLISHING);
        await content.save();

        // 如果立即发布成功，更新状态
        if (publishResult.status === 'success') {
          content.updatePlatformStatus(platform, PLATFORM_STATUS.SUCCESS);
          if (content.status !== CONTENT_STATUS.PUBLISHED) {
            content.updateStatus(CONTENT_STATUS.PUBLISHED, 'system', '首次发布成功');
          }
          await content.save();
        }

        logger.info('[ContentService] 内容发布提交成功', {
          contentId,
          platform,
          publishId: publishResult.publishId
        });

        return {
          success: true,
          publishResult
        };
      } else {
        // 发布失败，记录错误
        content.updatePlatformStatus(platform, PLATFORM_STATUS.FAILED, { error: publishResult.error });
        await content.save();

        return {
          success: false,
          error: publishResult.error
        };
      }
    } catch (error) {
      logger.error('[ContentService] 发布内容失败', {
        contentId,
        platform,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量发布内容
   * @param {string} contentId - 内容ID
   * @param {Array} platforms - 平台列表
   * @param {Object} options - 发布选项
   * @returns {Promise<Object>}
   */
  async publishToPlatforms(contentId, platforms, options = {}) {
    try {
      const results = [];
      for (const platform of platforms) {
        const result = await this.publishToPlatform(contentId, platform, options);
        results.push({
          platform,
          result
        });
      }

      const successCount = results.filter(r => r.result.success).length;
      const totalCount = results.length;

      logger.info('[ContentService] 批量发布完成', {
        contentId,
        totalCount,
        successCount,
        failedCount: totalCount - successCount
      });

      return {
        success: true,
        results,
        summary: {
          totalCount,
          successCount,
          failedCount: totalCount - successCount
        }
      };
    } catch (error) {
      logger.error('[ContentService] 批量发布失败', {
        contentId,
        platforms,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取发布状态
   * @param {string} contentId - 内容ID
   * @param {string} platform - 平台名称
   * @returns {Promise<Object>}
   */
  async getPublishStatus(contentId, platform) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      const platformInfo = content.publishInfo.publishedPlatforms.find(p => p.platform === platform);
      if (!platformInfo || !platformInfo.publishId) {
        return {
          success: false,
          error: '未找到发布任务'
        };
      }

      // 查询发布服务获取最新状态
      const statusResult = await this.publishIntegration.getPublishStatus(platformInfo.publishId);

      if (statusResult.success) {
        // 更新本地状态
        content.updatePlatformStatus(platform, statusResult.status, statusResult.result);
        await content.save();

        return {
          success: true,
          status: statusResult.status,
          result: statusResult.result
        };
      } else {
        return statusResult;
      }
    } catch (error) {
      logger.error('[ContentService] 获取发布状态失败', {
        contentId,
        platform,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新内容性能数据
   * @param {string} contentId - 内容ID
   * @param {Object} performanceData - 性能数据
   * @returns {Promise<Object>}
   */
  async updatePerformance(contentId, performanceData) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      content.updatePerformance(performanceData);
      await content.save();

      logger.info('[ContentService] 内容性能数据更新成功', {
        contentId,
        performanceData
      });

      return {
        success: true,
        content: content.toObject()
      };
    } catch (error) {
      logger.error('[ContentService] 更新性能数据失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取内容统计
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>}
   */
  async getStats(filters = {}) {
    try {
      const query = {};
      
      // 应用过滤条件
      if (filters.userId) query.userId = filters.userId;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const stats = await Content.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await Content.countDocuments(query);
      const byCategory = await Content.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        stats: {
          total,
          byStatus: stats,
          byCategory: byCategory.filter(item => item._id),
          statusDistribution: stats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      logger.error('[ContentService] 获取统计信息失败', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 审核内容
   * @param {string} contentId - 内容ID
   * @param {boolean} isApproved - 是否批准
   * @param {string} reviewer - 审核人
   * @param {string} comments - 审核意见
   * @returns {Promise<Object>}
   */
  async review(contentId, isApproved, reviewer, comments = '') {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        return {
          success: false,
          error: '内容不存在'
        };
      }

      if (content.status !== CONTENT_STATUS.REVIEW) {
        return {
          success: false,
          error: '内容不在审核状态'
        };
      }

      // 更新审核信息
      content.review = {
        reviewer,
        reviewTime: new Date(),
        comments,
        isApproved
      };

      // 根据审核结果更新状态
      if (isApproved) {
        content.updateStatus(CONTENT_STATUS.APPROVED, reviewer, '审核通过');
      } else {
        content.updateStatus(CONTENT_STATUS.REJECTED, reviewer, comments || '审核未通过');
      }

      await content.save();

      logger.info('[ContentService] 内容审核完成', {
        contentId,
        isApproved,
        reviewer
      });

      return {
        success: true,
        content: content.toObject()
      };
    } catch (error) {
      logger.error('[ContentService] 内容审核失败', {
        contentId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取待发布内容列表
   * @returns {Promise<Object>}
   */
  async getScheduledContents() {
    try {
      const contents = await Content.findScheduled();
      return {
        success: true,
        contents: contents.map(c => c.toObject())
      };
    } catch (error) {
      logger.error('[ContentService] 获取待发布内容失败', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 创建内容模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<Object>}
   */
  async createTemplate(templateData) {
    try {
      // 这里可以实现内容模板功能
      // 目前先返回成功
      return {
        success: true,
        template: templateData
      };
    } catch (error) {
      logger.error('[ContentService] 创建模板失败', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 创建单例
const contentService = new ContentService();

module.exports = contentService;