/**
 * 发布集成服务
 * 用于对接 Publisher Tools 服务，实现多平台内容发布
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class PublishIntegration {
  constructor() {
    // Publisher Tools 服务配置
    this.config = {
      baseUrl: process.env.PUBLISHER_TOOLS_URL || 'http://localhost:8080',
      apiKey: process.env.PUBLISHER_TOOLS_API_KEY,
      timeout: 30000
    };

    // 支持的平台
    this.supportedPlatforms = [
      'xiaohongshu',  // 小红书
      'douyin',       // 抖音
      'toutiao',      // 今日头条
      'weibo',        // 微博
      'bilibili',     // B站
      'zhihu'         // 知乎
    ];

    // 创建 axios 实例
    this.apiClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : ''
      }
    });

    // 添加请求拦截器
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug('[PublishIntegration] 发送请求', {
          url: config.url,
          method: config.method
        });
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug('[PublishIntegration] 收到响应', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('[PublishIntegration] 请求失败', {
          url: error.config?.url,
          message: error.message,
          response: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 检查 Publisher Tools 服务是否可用
   */
  async checkServiceStatus() {
    try {
      const response = await this.apiClient.get('/health');
      return response.data && response.data.status === 'ok';
    } catch (error) {
      logger.warn('[PublishIntegration] Publisher Tools 服务不可用', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * 发布内容到指定平台
   * @param {string} platform - 平台名称
   * @param {Object} content - 内容对象
   * @param {Object} options - 发布选项
   * @returns {Promise<Object>}
   */
  async publish(platform, content, options = {}) {
    try {
      // 验证平台支持
      if (!this.supportedPlatforms.includes(platform)) {
        throw new Error(`不支持的平台: ${platform}. 支持的平台: ${this.supportedPlatforms.join(', ')}`);
      }

      // 验证内容格式
      if (!content || !content.title || !content.content) {
        throw new Error('内容格式不正确，必须包含 title 和 content 字段');
      }

      // 构建发布请求
      const publishData = {
        platform: platform,
        content: {
          title: content.title,
          content: content.content,
          images: content.images || [],
          video: content.video || null,
          tags: content.tags || []
        },
        options: {
          scheduleTime: content.scheduleTime || null,
          account: content.account || null,
          ...options
        }
      };

      // 发送发布请求
      const response = await this.apiClient.post('/api/publish', publishData);

      logger.info('[PublishIntegration] 内容发布成功', {
        platform,
        title: content.title,
        publishId: response.data.publishId
      });

      return {
        success: true,
        publishId: response.data.publishId,
        platform,
        status: response.data.status || 'pending',
        message: '发布请求已提交',
        ...response.data
      };

    } catch (error) {
      logger.error('[PublishIntegration] 发布失败', {
        platform,
        title: content.title,
        error: error.message
      });

      return {
        success: false,
        platform,
        error: error.response?.data?.message || error.message,
        message: '发布失败'
      };
    }
  }

  /**
   * 批量发布内容到多个平台
   * @param {Array} publishTasks - 发布任务数组
   * @returns {Promise<Object>}
   */
  async publishBatch(publishTasks) {
    try {
      // 验证任务格式
      if (!Array.isArray(publishTasks) || publishTasks.length === 0) {
        throw new Error('发布任务必须是非空数组');
      }

      const results = [];
      const promises = publishTasks.map(async (task) => {
        try {
          const result = await this.publish(task.platform, task.content, task.options);
          results.push({
            ...task,
            result
          });
        } catch (error) {
          results.push({
            ...task,
            result: {
              success: false,
              error: error.message
            }
          });
        }
      });

      await Promise.all(promises);

      const successCount = results.filter(r => r.result.success).length;
      const totalCount = results.length;

      logger.info('[PublishIntegration] 批量发布完成', {
        totalCount,
        successCount,
        failedCount: totalCount - successCount
      });

      return {
        success: true,
        totalCount,
        successCount,
        failedCount: totalCount - successCount,
        results
      };

    } catch (error) {
      logger.error('[PublishIntegration] 批量发布失败', { error: error.message });

      return {
        success: false,
        error: error.message,
        message: '批量发布失败'
      };
    }
  }

  /**
   * 获取发布任务状态
   * @param {string} publishId - 发布任务ID
   * @returns {Promise<Object>}
   */
  async getPublishStatus(publishId) {
    try {
      const response = await this.apiClient.get(`/api/publish/${publishId}/status`);

      return {
        success: true,
        publishId,
        status: response.data.status,
        result: response.data.result,
        ...response.data
      };

    } catch (error) {
      logger.error('[PublishIntegration] 获取发布状态失败', {
        publishId,
        error: error.message
      });

      return {
        success: false,
        publishId,
        error: error.response?.data?.message || error.message,
        message: '获取发布状态失败'
      };
    }
  }

  /**
   * 获取平台账号状态
   * @param {string} platform - 平台名称
   * @returns {Promise<Object>}
   */
  async getAccountStatus(platform) {
    try {
      const response = await this.apiClient.get(`/api/accounts/${platform}/status`);

      return {
        success: true,
        platform,
        status: response.data.status,
        accounts: response.data.accounts,
        ...response.data
      };

    } catch (error) {
      logger.error('[PublishIntegration] 获取账号状态失败', {
        platform,
        error: error.message
      });

      return {
        success: false,
        platform,
        error: error.response?.data?.message || error.message,
        message: '获取账号状态失败'
      };
    }
  }

  /**
   * 获取支持的平台列表
   * @returns {Array}
   */
  getSupportedPlatforms() {
    return this.supportedPlatforms;
  }

  /**
   * 获取发布服务配置
   * @returns {Object}
   */
  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      apiKey: this.config.apiKey ? '***' : '',
      supportedPlatforms: this.supportedPlatforms
    };
  }

  /**
   * 上传文件到发布服务
   * @param {string} platform - 平台名称
   * @param {File} file - 文件对象
   * @returns {Promise<Object>}
   */
  async uploadFile(platform, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', platform);

      // 注意：axios 在 Node.js 中不能直接使用 FormData
      // 这里需要使用 form-data 库或流式上传
      const response = await this.apiClient.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        fileId: response.data.fileId,
        url: response.data.url,
        ...response.data
      };

    } catch (error) {
      logger.error('[PublishIntegration] 文件上传失败', {
        platform,
        error: error.message
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: '文件上传失败'
      };
    }
  }

  /**
   * 取消发布任务
   * @param {string} publishId - 发布任务ID
   * @returns {Promise<Object>}
   */
  async cancelPublish(publishId) {
    try {
      const response = await this.apiClient.delete(`/api/publish/${publishId}`);

      return {
        success: true,
        publishId,
        message: '发布任务已取消',
        ...response.data
      };

    } catch (error) {
      logger.error('[PublishIntegration] 取消发布失败', {
        publishId,
        error: error.message
      });

      return {
        success: false,
        publishId,
        error: error.response?.data?.message || error.message,
        message: '取消发布失败'
      };
    }
  }

  /**
   * 获取发布历史记录
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>}
   */
  async getPublishHistory(filters = {}) {
    try {
      const response = await this.apiClient.get('/api/publish/history', {
        params: filters
      });

      return {
        success: true,
        history: response.data.history,
        pagination: response.data.pagination,
        ...response.data
      };

    } catch (error) {
      logger.error('[PublishIntegration] 获取发布历史失败', {
        filters,
        error: error.message
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: '获取发布历史失败'
      };
    }
  }

  /**
   * 测试发布连接
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      const isServiceAvailable = await this.checkServiceStatus();
      if (!isServiceAvailable) {
        return {
          success: false,
          message: 'Publisher Tools 服务不可用',
          serviceAvailable: false
        };
      }

      // 尝试获取支持的平台列表
      const response = await this.apiClient.get('/api/platforms');

      return {
        success: true,
        serviceAvailable: true,
        platforms: response.data.platforms || [],
        message: '连接测试成功'
      };

    } catch (error) {
      logger.error('[PublishIntegration] 连接测试失败', { error: error.message });

      return {
        success: false,
        serviceAvailable: false,
        error: error.message,
        message: '连接测试失败'
      };
    }
  }
}

// 创建单例
const publishIntegration = new PublishIntegration();

module.exports = publishIntegration;