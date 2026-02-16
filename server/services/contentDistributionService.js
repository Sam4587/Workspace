/**
 * 内容发布和分发机制服务
 * 支持多平台自动发布、定时发布、批量发布等功能
 */

const logger = require('../utils/logger');
const cron = require('node-cron');

class ContentDistributionService {
  constructor() {
    this.publishers = this.loadPublishers();
    this.scheduledTasks = new Map();
    this.publishQueue = [];
    this.publishHistory = [];
    
    // 启动定时任务监控
    this.startScheduledMonitor();
  }

  /**
   * 加载发布器
   */
  loadPublishers() {
    return {
      toutiao: {
        name: '今日头条',
        enabled: true,
        apiEndpoint: '/api/publish/toutiao',
        rateLimit: 10, // 每分钟最多10次发布
        supportedFormats: ['article', 'micro', 'video']
      },
      
      weibo: {
        name: '微博',
        enabled: true,
        apiEndpoint: '/api/publish/weibo',
        rateLimit: 30, // 每分钟最多30次发布
        supportedFormats: ['micro', 'image', 'video']
      },
      
      zhihu: {
        name: '知乎',
        enabled: true,
        apiEndpoint: '/api/publish/zhihu',
        rateLimit: 5, // 每分钟最多5次发布
        supportedFormats: ['article', 'answer']
      },
      
      xiaohongshu: {
        name: '小红书',
        enabled: true,
        apiEndpoint: '/api/publish/xiaohongshu',
        rateLimit: 8, // 每分钟最多8次发布
        supportedFormats: ['note', 'video']
      },
      
      douyin: {
        name: '抖音',
        enabled: true,
        apiEndpoint: '/api/publish/douyin',
        rateLimit: 15, // 每分钟最多15次发布
        supportedFormats: ['video']
      },
      
      bilibili: {
        name: '哔哩哔哩',
        enabled: true,
        apiEndpoint: '/api/publish/bilibili',
        rateLimit: 3, // 每分钟最多3次发布
        supportedFormats: ['video', 'article']
      }
    };
  }

  /**
   * 立即发布内容
   */
  async publishContent(content, platforms, options = {}) {
    try {
      logger.info('[Distribution] 开始内容发布', { 
        contentId: content._id,
        platforms: platforms.join(', '),
        options
      });

      const results = {};
      
      for (const platform of platforms) {
        try {
          const publisher = this.publishers[platform];
          if (!publisher || !publisher.enabled) {
            results[platform] = {
              success: false,
              error: `平台 ${platform} 未启用或不支持`
            };
            continue;
          }

          // 检查格式支持
          if (!publisher.supportedFormats.includes(content.type)) {
            results[platform] = {
              success: false,
              error: `平台 ${platform} 不支持 ${content.type} 格式`
            };
            continue;
          }

          // 执行发布
          const publishResult = await this.executePublish(content, platform, options);
          results[platform] = publishResult;
          
          // 记录发布历史
          this.recordPublishHistory(content._id, platform, publishResult);
          
        } catch (error) {
          logger.error(`[Distribution] ${platform} 发布失败`, { 
            error: error.message,
            contentId: content._id
          });
          
          results[platform] = {
            success: false,
            error: error.message
          };
        }
      }

      const successCount = Object.values(results).filter(r => r.success).length;
      
      logger.info('[Distribution] 内容发布完成', { 
        contentId: content._id,
        successCount,
        totalPlatforms: platforms.length
      });

      return {
        success: successCount > 0,
        results,
        summary: {
          total: platforms.length,
          success: successCount,
          failed: platforms.length - successCount
        }
      };
    } catch (error) {
      logger.error('[Distribution] 内容发布过程失败', { 
        error: error.message,
        contentId: content._id
      });
      throw error;
    }
  }

  /**
   * 执行具体平台发布
   */
  async executePublish(content, platform, options) {
    // 这里应该调用具体的平台API
    // 目前返回模拟结果
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    // 模拟成功率
    const isSuccess = Math.random() > 0.1; // 90% 成功率
    
    if (isSuccess) {
      return {
        success: true,
        postId: `post_${platform}_${Date.now()}`,
        postUrl: `https://${platform}.com/post/example_${Date.now()}`,
        publishTime: new Date().toISOString(),
        platformData: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        }
      };
    } else {
      throw new Error(`发布到 ${platform} 失败`);
    }
  }

  /**
   * 定时发布内容
   */
  async schedulePublish(content, platforms, scheduleTime, options = {}) {
    try {
      const taskId = `schedule_${content._id}_${Date.now()}`;
      
      const task = {
        id: taskId,
        contentId: content._id,
        content,
        platforms,
        scheduleTime: new Date(scheduleTime),
        options,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };
      
      // 添加到调度任务
      this.scheduledTasks.set(taskId, task);
      
      // 设置定时执行
      const cronExpression = this.generateCronExpression(scheduleTime);
      const cronTask = cron.schedule(cronExpression, async () => {
        try {
          logger.info('[Distribution] 执行定时发布任务', { taskId });
          
          const result = await this.publishContent(content, platforms, options);
          task.result = result;
          task.status = 'completed';
          task.executedAt = new Date().toISOString();
          
          // 清理已完成的任务
          this.scheduledTasks.delete(taskId);
          
        } catch (error) {
          logger.error('[Distribution] 定时发布执行失败', { 
            taskId,
            error: error.message
          });
          
          task.status = 'failed';
          task.error = error.message;
          task.executedAt = new Date().toISOString();
        }
      });
      
      task.cronTask = cronTask;
      
      logger.info('[Distribution] 定时发布任务已创建', { 
        taskId,
        scheduleTime,
        platforms: platforms.join(', ')
      });
      
      return {
        success: true,
        taskId,
        scheduleTime: task.scheduleTime
      };
    } catch (error) {
      logger.error('[Distribution] 创建定时发布任务失败', { 
        error: error.message,
        contentId: content._id
      });
      throw error;
    }
  }

  /**
   * 批量发布内容
   */
  async batchPublish(contents, platformMapping, options = {}) {
    try {
      logger.info('[Distribution] 开始批量发布', { 
        contentCount: contents.length,
        platforms: Object.keys(platformMapping)
      });

      const batchResults = [];
      
      for (const content of contents) {
        const platforms = platformMapping[content._id] || [];
        if (platforms.length === 0) continue;
        
        try {
          const result = await this.publishContent(content, platforms, options);
          batchResults.push({
            contentId: content._id,
            result
          });
        } catch (error) {
          logger.error('[Distribution] 批量发布单项失败', { 
            error: error.message,
            contentId: content._id
          });
          
          batchResults.push({
            contentId: content._id,
            result: {
              success: false,
              error: error.message
            }
          });
        }
      }

      const successfulItems = batchResults.filter(item => item.result.success).length;
      
      logger.info('[Distribution] 批量发布完成', { 
        totalItems: contents.length,
        successfulItems,
        failedItems: contents.length - successfulItems
      });

      return {
        success: successfulItems > 0,
        results: batchResults,
        summary: {
          total: contents.length,
          success: successfulItems,
          failed: contents.length - successfulItems
        }
      };
    } catch (error) {
      logger.error('[Distribution] 批量发布过程失败', { 
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 智能分发策略
   */
  async smartDistribute(content, strategy = 'balanced', options = {}) {
    try {
      const availablePlatforms = Object.entries(this.publishers)
        .filter(([, publisher]) => publisher.enabled)
        .map(([platform]) => platform);
      
      let selectedPlatforms = [];
      
      switch (strategy) {
        case 'maximize_reach':
          // 最大化覆盖面：选择所有可用平台
          selectedPlatforms = availablePlatforms;
          break;
          
        case 'balanced':
          // 平衡策略：选择3-4个主要平台
          selectedPlatforms = availablePlatforms.slice(0, Math.min(4, availablePlatforms.length));
          break;
          
        case 'quality_focus':
          // 质量导向：选择知乎、今日头条等高质量平台
          selectedPlatforms = ['zhihu', 'toutiao'].filter(p => availablePlatforms.includes(p));
          break;
          
        case 'engagement_focus':
          // 互动导向：选择微博、小红书等高互动平台
          selectedPlatforms = ['weibo', 'xiaohongshu'].filter(p => availablePlatforms.includes(p));
          break;
          
        default:
          selectedPlatforms = availablePlatforms.slice(0, 3);
      }
      
      if (selectedPlatforms.length === 0) {
        throw new Error('没有可用的发布平台');
      }
      
      // 执行发布
      const result = await this.publishContent(content, selectedPlatforms, {
        ...options,
        distributionStrategy: strategy
      });
      
      return {
        ...result,
        strategy,
        selectedPlatforms
      };
    } catch (error) {
      logger.error('[Distribution] 智能分发失败', { 
        error: error.message,
        strategy
      });
      throw error;
    }
  }

  /**
   * 获取发布状态
   */
  async getPublishStatus(contentId, platform = null) {
    try {
      const history = this.publishHistory.filter(
        record => record.contentId === contentId
      );
      
      if (platform) {
        return history.filter(record => record.platform === platform);
      }
      
      return history;
    } catch (error) {
      logger.error('[Distribution] 获取发布状态失败', { 
        error: error.message,
        contentId,
        platform
      });
      throw error;
    }
  }

  /**
   * 获取调度任务状态
   */
  getScheduledTasks(filter = {}) {
    const tasks = Array.from(this.scheduledTasks.values());
    
    if (filter.status) {
      return tasks.filter(task => task.status === filter.status);
    }
    
    if (filter.contentId) {
      return tasks.filter(task => task.contentId === filter.contentId);
    }
    
    return tasks;
  }

  /**
   * 取消调度任务
   */
  cancelScheduledTask(taskId) {
    try {
      const task = this.scheduledTasks.get(taskId);
      if (task && task.cronTask) {
        task.cronTask.stop();
        this.scheduledTasks.delete(taskId);
        
        logger.info('[Distribution] 调度任务已取消', { taskId });
        return { success: true };
      }
      
      return { success: false, error: '任务不存在或已执行' };
    } catch (error) {
      logger.error('[Distribution] 取消调度任务失败', { 
        error: error.message,
        taskId
      });
      throw error;
    }
  }

  /**
   * 获取平台统计信息
   */
  getPlatformStats() {
    const stats = {};
    
    for (const [platform, publisher] of Object.entries(this.publishers)) {
      const platformHistory = this.publishHistory.filter(
        record => record.platform === platform
      );
      
      stats[platform] = {
        name: publisher.name,
        enabled: publisher.enabled,
        totalPublished: platformHistory.length,
        successfulPublishes: platformHistory.filter(r => r.success).length,
        successRate: platformHistory.length > 0 
          ? (platformHistory.filter(r => r.success).length / platformHistory.length * 100).toFixed(2) + '%'
          : '0%'
      };
    }
    
    return stats;
  }

  /**
   * 辅助方法
   */
  
  generateCronExpression(dateTime) {
    const date = new Date(dateTime);
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  recordPublishHistory(contentId, platform, result) {
    this.publishHistory.push({
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId,
      platform,
      success: result.success,
      result: result.success ? result : { error: result.error },
      timestamp: new Date().toISOString()
    });
    
    // 保持历史记录在合理范围内
    if (this.publishHistory.length > 1000) {
      this.publishHistory = this.publishHistory.slice(-500);
    }
  }

  startScheduledMonitor() {
    // 每分钟检查一次即将到期的任务
    setInterval(() => {
      const now = new Date();
      const upcomingTasks = Array.from(this.scheduledTasks.values())
        .filter(task => {
          const timeDiff = task.scheduleTime.getTime() - now.getTime();
          return timeDiff > 0 && timeDiff <= 60000; // 1分钟内
        });
      
      if (upcomingTasks.length > 0) {
        logger.info('[Distribution] 检测到即将执行的调度任务', { 
          count: upcomingTasks.length 
        });
      }
    }, 60000);
  }

  /**
   * 获取可用发布器
   */
  getAvailablePublishers() {
    return Object.entries(this.publishers)
      .filter(([, publisher]) => publisher.enabled)
      .map(([platform, publisher]) => ({
        id: platform,
        name: publisher.name,
        supportedFormats: publisher.supportedFormats,
        rateLimit: publisher.rateLimit
      }));
  }

  /**
   * 启用/禁用发布器
   */
  togglePublisher(platform, enabled) {
    if (this.publishers[platform]) {
      this.publishers[platform].enabled = enabled;
      logger.info(`[Distribution] ${enabled ? '启用' : '禁用'}发布器: ${platform}`);
    }
  }
}

module.exports = new ContentDistributionService();