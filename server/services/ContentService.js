/**
 * 内容管理服务 - 简化稳定版本
 * 临时修复语法错误，确保服务稳定运行
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

  // 简化方法，避免语法错误
  async create(contentData, userId) {
    try {
      logger.warn('[ContentService] 服务已简化，使用内存存储');
      const content = {
        _id: `content_${Date.now()}`,
        title: contentData.title || '未命名内容',
        content: contentData.content || '',
        userId,
        createdAt: new Date(),
        status: 'DRAFT'
      };
      
      memoryStorage.contents.push(content);
      
      return {
        success: true,
        content: content
      };
    } catch (error) {
      logger.error('[ContentService] 创建内容失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getById(contentId) {
    try {
      const content = memoryStorage.contents.find(c => c._id === contentId);
      return content ? { success: true, content } : { success: false, error: '内容不存在' };
    } catch (error) {
      logger.error('[ContentService] 获取内容详情失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async update(contentId, updateData, userId) {
    try {
      const index = memoryStorage.contents.findIndex(c => c._id === contentId);
      if (index === -1) {
        return { success: false, error: '内容不存在' };
      }
      
      Object.assign(memoryStorage.contents[index], updateData);
      return { success: true, content: memoryStorage.contents[index] };
    } catch (error) {
      logger.error('[ContentService] 更新内容失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async delete(contentId, userId) {
    try {
      const index = memoryStorage.contents.findIndex(c => c._id === contentId);
      if (index === -1) {
        return { success: false, error: '内容不存在' };
      }
      
      memoryStorage.contents.splice(index, 1);
      return { success: true, message: '内容已删除' };
    } catch (error) {
      logger.error('[ContentService] 删除内容失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async list(filters = {}, page = 1, limit = 20) {
    try {
      let results = [...memoryStorage.contents];
      
      // 简单过滤
      if (filters.userId) {
        results = results.filter(c => c.userId === filters.userId);
      }
      
      const skip = (page - 1) * limit;
      const data = results.slice(skip, skip + limit);
      
      return {
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: results.length,
          pages: Math.ceil(results.length / limit)
        }
      };
    } catch (error) {
      logger.error('[ContentService] 查询内容列表失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// 创建单例
const contentService = new ContentService();
module.exports = contentService;