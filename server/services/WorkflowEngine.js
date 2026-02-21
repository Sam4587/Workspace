/**
 * 工作流引擎
 * 用于管理热点监控、内容生成、发布等自动化流程
 */

const logger = require('../utils/logger');
const hotTopicService = require('./hotTopicService');
const { workflowStorage } = require('./WorkflowStorage');

// 安全导入AI服务
let aiService = null;
try {
  aiService = require('./aiService');
  console.log('[WorkflowEngine] AI服务加载成功');
} catch (error) {
  console.error('[WorkflowEngine] AI服务加载失败:', error.message);
  // 使用mock版本
  aiService = {
    generateContent: async (params) => ({
      title: params.topic || '模拟标题',
      content: `基于"${params.topic}"生成的模拟内容`,
      platformConfigs: [],
      type: 'article',
      wordCount: 100,
      readingTime: 1,
      quality: 70,
      suggestions: [],
      aiProvider: 'mock',
      aiModel: 'mock-model',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    }),
    analyzeVideoContent: async (transcript) => ({
      summary: '这是视频内容的摘要',
      keyPoints: ['关键点1', '关键点2', '关键点3'],
      suitablePlatforms: ['xiaohongshu', 'douyin', 'toutiao'],
      targetAudience: '通用受众',
      keywords: ['关键词1', '关键词2', '关键词3'],
      sentiment: 'positive',
      contentType: '教育'
    }),
    generateVideoContent: async (analysis) => ({
      title: '基于分析生成的视频标题',
      content: '基于分析结果生成的视频内容',
      platformVariants: [
        {
          platform: 'xiaohongshu',
          title: '小红书版本标题',
          content: '小红书版本内容',
          tags: ['标签1', '标签2']
        },
        {
          platform: 'douyin',
          title: '抖音版本标题',
          content: '抖音版本内容',
          tags: ['标签3', '标签4']
        }
      ],
      tags: ['通用标签1', '通用标签2'],
      publishingTips: '发布建议'
    })
  };
}

const contentService = require('./ContentService');
const publishIntegration = require('./PublishIntegration');

// 工作流状态
const WORKFLOW_STATUS = {
  PENDING: 'pending',        // 待执行
  RUNNING: 'running',        // 执行中
  COMPLETED: 'completed',    // 已完成
  FAILED: 'failed',          // 已失败
  CANCELLED: 'cancelled'     // 已取消
};

// 任务状态
const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

// 错误类型
const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  AI_SERVICE_ERROR: 'ai_service_error',
  DATABASE_ERROR: 'database_error',
  TIMEOUT_ERROR: 'timeout_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  UNKNOWN_ERROR: 'unknown_error'
};

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true
};

// 计算重试延迟
function calculateRetryDelay(attempt, config = RETRY_CONFIG) {
  const { initialDelay, maxDelay, backoffMultiplier, jitter } = config;
  
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  delay = Math.min(delay, maxDelay);
  
  if (jitter) {
    const jitterFactor = 0.8 + Math.random() * 0.4;
    delay = delay * jitterFactor;
  }
  
  return Math.round(delay);
}

// 可重试错误判断
function isRetryableError(error) {
  const retryableTypes = [
    ERROR_TYPES.NETWORK_ERROR,
    ERROR_TYPES.TIMEOUT_ERROR,
    ERROR_TYPES.RATE_LIMIT_ERROR,
    ERROR_TYPES.AI_SERVICE_ERROR
  ];
  
  return retryableTypes.includes(error?.type);
}

class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.runningInstances = new Map();
    this.workflowInstances = new Map();
    this.storage = workflowStorage;
    
    this.loadFromStorage();
    this.registerBuiltInWorkflows();
  }

  loadFromStorage() {
    const { instances: storedInstances } = this.storage.getWorkflowInstances();
    storedInstances.forEach(instance => {
      if (instance.status === WORKFLOW_STATUS.COMPLETED || 
          instance.status === WORKFLOW_STATUS.FAILED ||
          instance.status === WORKFLOW_STATUS.CANCELLED) {
        this.workflowInstances.set(instance.id, instance);
      }
    });
    
    logger.info('[WorkflowEngine] 从存储加载工作流历史', { 
      count: this.workflowInstances.size 
    });
  }

  saveCheckpoint(instance, taskIndex) {
    const checkpoint = {
      instanceId: instance.id,
      taskIndex,
      context: JSON.parse(JSON.stringify(instance.context)),
      tasks: JSON.parse(JSON.stringify(instance.tasks)),
      createdAt: new Date()
    };
    
    this.storage.saveCheckpoint(checkpoint);
    logger.debug('[WorkflowEngine] 检查点已保存', { 
      instanceId: instance.id, 
      taskIndex 
    });
    
    return checkpoint;
  }

  async resumeFromCheckpoint(instanceId) {
    const checkpoint = this.storage.getLatestCheckpoint(instanceId);
    if (!checkpoint) {
      logger.warn('[WorkflowEngine] 没有找到检查点', { instanceId });
      return null;
    }
    
    const instance = {
      id: instanceId,
      workflowId: checkpoint.workflowId || 'hot-topic-to-content',
      status: WORKFLOW_STATUS.RUNNING,
      context: checkpoint.context,
      tasks: checkpoint.tasks,
      startedAt: checkpoint.createdAt,
      completedAt: null,
      trigger: 'checkpoint_resume',
      resumedFromCheckpoint: true,
      error: null
    };
    
    logger.info('[WorkflowEngine] 从检查点恢复工作流', { 
      instanceId,
      taskIndex: checkpoint.taskIndex 
    });
    
    return instance;
  }

  /**
   * 注册内置工作流
   */
  registerBuiltInWorkflows() {
    // 热点驱动内容生成工作流
    this.registerWorkflow('hot-topic-to-content', {
      name: '热点驱动内容生成',
      description: '自动监控热点并生成相关内容',
      tasks: [
        {
          id: 'fetch-hot-topics',
          name: '获取热点话题',
          type: 'fetch',
          handler: this.fetchHotTopics.bind(this),
          required: true
        },
        {
          id: 'filter-topics',
          name: '筛选热点',
          type: 'filter',
          handler: this.filterTopics.bind(this),
          required: true
        },
        {
          id: 'generate-content',
          name: '生成内容',
          type: 'generate',
          handler: this.generateContent.bind(this),
          required: true
        },
        {
          id: 'save-content',
          name: '保存内容',
          type: 'save',
          handler: this.saveContent.bind(this),
          required: true
        },
        {
          id: 'schedule-publish',
          name: '计划发布',
          type: 'publish',
          handler: this.schedulePublish.bind(this),
          required: false
        }
      ]
    });

    // 视频转录内容生成工作流
    this.registerWorkflow('video-transcript-to-content', {
      name: '视频转录内容生成',
      description: '基于视频转录生成多平台内容',
      tasks: [
        {
          id: 'analyze-transcript',
          name: '分析转录内容',
          type: 'analyze',
          handler: this.analyzeTranscript.bind(this),
          required: true
        },
        {
          id: 'generate-video-content',
          name: '生成视频内容',
          type: 'generate',
          handler: this.generateVideoContent.bind(this),
          required: true
        },
        {
          id: 'save-video-content',
          name: '保存视频内容',
          type: 'save',
          handler: this.saveContent.bind(this),
          required: true
        }
      ]
    });

    // 内容发布工作流
    this.registerWorkflow('content-to-publish', {
      name: '内容发布',
      description: '自动化发布内容到多平台',
      tasks: [
        {
          id: 'validate-content',
          name: '验证内容',
          type: 'validate',
          handler: this.validateContentForPublish.bind(this),
          required: true
        },
        {
          id: 'prepare-platform-content',
          name: '准备平台内容',
          type: 'prepare',
          handler: this.preparePlatformContent.bind(this),
          required: true
        },
        {
          id: 'publish-to-platforms',
          name: '发布到平台',
          type: 'publish',
          handler: this.publishToPlatforms.bind(this),
          required: true
        }
      ]
    });
  }

  /**
   * 注册工作流
   * @param {string} workflowId - 工作流ID
   * @param {Object} workflowDef - 工作流定义
   */
  registerWorkflow(workflowId, workflowDef) {
    this.workflows.set(workflowId, {
      id: workflowId,
      ...workflowDef,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    logger.info('[WorkflowEngine] 工作流注册成功', {
      workflowId: workflowId
    });
  }

  /**
   * 获取工作流定义
   * @param {string} workflowId - 工作流ID
   * @returns {Object}
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * 获取所有工作流
   * @returns {Array}
   */
  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * 执行工作流
   * @param {string} workflowId - 工作流ID
   * @param {Object} context - 执行上下文
   * @param {string} trigger - 触发源
   * @param {Object} config - 工作流配置
   * @returns {Promise<Object>}
   */
  async executeWorkflow(workflowId, context = {}, trigger = 'manual', config = {}) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    const instanceId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const instance = {
      id: instanceId,
      workflowId,
      status: WORKFLOW_STATUS.RUNNING,
      context: { ...context },
      tasks: [],
      startedAt: new Date(),
      completedAt: null,
      trigger,
      config: { ...config },
      error: null,
      retryCount: 0,
      maxRetries: config.maxRetries || RETRY_CONFIG.maxRetries
    };

    this.runningInstances.set(instanceId, instance);
    this.storage.saveWorkflowInstance(instance);

    logger.info('[WorkflowEngine] 开始执行工作流', {
      workflowId,
      instanceId,
      trigger
    });

    let currentTaskIndex = 0;

    try {
      for (currentTaskIndex = 0; currentTaskIndex < workflow.tasks.length; currentTaskIndex++) {
        const taskDef = workflow.tasks[currentTaskIndex];
        
        if (instance.status !== WORKFLOW_STATUS.RUNNING) {
          break;
        }

        const taskResult = await this.executeTaskWithRetry(instance, taskDef, currentTaskIndex);
        
        if (!taskResult.success && taskDef.required) {
          instance.status = WORKFLOW_STATUS.FAILED;
          instance.error = taskResult.error;
          break;
        }

        if ((currentTaskIndex + 1) % 2 === 0 || currentTaskIndex === workflow.tasks.length - 1) {
          this.saveCheckpoint(instance, currentTaskIndex + 1);
        }

        this.storage.saveWorkflowInstance(instance);
      }

      instance.status = instance.status === WORKFLOW_STATUS.RUNNING ? WORKFLOW_STATUS.COMPLETED : instance.status;
      instance.completedAt = new Date();

      logger.info('[WorkflowEngine] 工作流执行完成', {
        workflowId,
        instanceId,
        status: instance.status
      });

    } catch (error) {
      instance.status = WORKFLOW_STATUS.FAILED;
      instance.error = error.message || '未知错误';
      logger.error('[WorkflowEngine] 工作流执行失败', {
        workflowId,
        instanceId,
        error: instance.error,
        currentTaskIndex
      });
    } finally {
      this.runningInstances.delete(instanceId);
      this.workflowInstances.set(instanceId, instance);
      this.storage.saveWorkflowInstance(instance);
    }

    return instance;
  }

  /**
   * 执行任务（带重试机制）
   */
  async executeTaskWithRetry(instance, taskDef, taskIndex) {
    let lastError = null;
    const maxRetries = instance.config.maxRetries || RETRY_CONFIG.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const taskResult = await this.executeTask(instance, taskDef, attempt);
        
        if (taskResult.success) {
          return taskResult;
        }

        lastError = taskResult.error;

        if (attempt < maxRetries && isRetryableError(lastError)) {
          const delay = calculateRetryDelay(attempt);
          logger.warn('[WorkflowEngine] 任务失败，准备重试', {
            taskId: taskDef.id,
            attempt: attempt + 1,
            maxRetries,
            delay
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          instance.retryCount = attempt + 1;
          continue;
        }

        return taskResult;

      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries && isRetryableError(error)) {
          const delay = calculateRetryDelay(attempt);
          logger.warn('[WorkflowEngine] 任务异常，准备重试', {
            taskId: taskDef.id,
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: error.message
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          instance.retryCount = attempt + 1;
          continue;
        }

        return {
          success: false,
          error: error.message || '任务执行异常'
        };
      }
    }

    return {
      success: false,
      error: lastError?.message || '任务执行失败，已达到最大重试次数'
    };
  }

  /**
   * 执行任务
   * @param {Object} instance - 工作流实例
   * @param {Object} taskDef - 任务定义
   * @param {number} attempt - 重试次数
   * @returns {Promise<Object>}
   */
  async executeTask(instance, taskDef, attempt = 0) {
    const taskId = `task-${Date.now()}-${taskDef.id}-${attempt}`;
    const task = {
      id: taskId,
      name: taskDef.name,
      type: taskDef.type,
      status: TASK_STATUS.RUNNING,
      startedAt: new Date(),
      completedAt: null,
      result: null,
      error: null,
      attempt
    };

    if (attempt === 0) {
      instance.tasks.push(task);
    } else {
      const existingTaskIndex = instance.tasks.findIndex(t => 
        t.name === taskDef.name && t.status === TASK_STATUS.FAILED
      );
      if (existingTaskIndex >= 0) {
        instance.tasks[existingTaskIndex] = task;
      } else {
        instance.tasks.push(task);
      }
    }

    logger.debug('[WorkflowEngine] 开始执行任务', {
      workflowId: instance.workflowId,
      instanceId: instance.id,
      taskId: task.id,
      taskName: task.name,
      attempt
    });

    try {
      const result = await taskDef.handler(instance.context, taskDef);
      
      task.status = TASK_STATUS.COMPLETED;
      task.result = result;
      task.completedAt = new Date();

      logger.debug('[WorkflowEngine] 任务执行成功', {
        taskId: task.id,
        taskName: task.name,
        attempt
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      task.status = TASK_STATUS.FAILED;
      task.error = error.message;
      task.completedAt = new Date();

      logger.error('[WorkflowEngine] 任务执行失败', {
        taskId: task.id,
        taskName: task.name,
        attempt,
        error: error.message
      });

      return {
        success: false,
        error: {
          message: error.message,
          type: this.classifyError(error)
        }
      };
    }
  }

  classifyError(error) {
    const message = error?.message || '';
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return ERROR_TYPES.TIMEOUT_ERROR;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('ECONN')) {
      return ERROR_TYPES.NETWORK_ERROR;
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return ERROR_TYPES.RATE_LIMIT_ERROR;
    }
    if (message.includes('AI') || message.includes('OpenAI') || message.includes('LLM')) {
      return ERROR_TYPES.AI_SERVICE_ERROR;
    }
    if (message.includes('database') || message.includes('DB') || message.includes('Mongo')) {
      return ERROR_TYPES.DATABASE_ERROR;
    }
    if (message.includes('validation') || message.includes('required')) {
      return ERROR_TYPES.VALIDATION_ERROR;
    }
    
    return ERROR_TYPES.UNKNOWN_ERROR;
  }

  // ==================== 内置任务处理器 ====================

  /**
   * 获取热点话题任务
   */
  async fetchHotTopics(context) {
    const topics = await hotTopicService.getCachedTopics();
    context.hotTopics = topics;
    return {
      count: topics.length,
      topics: topics.slice(0, 10).map(t => ({ title: t.title, heat: t.heat, source: t.source }))
    };
  }

  /**
   * 筛选热点话题任务
   */
  async filterTopics(context) {
    const { hotTopics } = context;
    if (!hotTopics || hotTopics.length === 0) {
      return { filteredTopics: [] };
    }

    // 筛选条件：热度>70，非重复内容
    const minHeat = context.minHeat || 70;
    const maxCount = context.maxCount || 10;

    const filtered = hotTopics
      .filter(topic => topic.heat >= minHeat)
      .slice(0, maxCount);

    context.filteredTopics = filtered;
    return {
      originalCount: hotTopics.length,
      filteredCount: filtered.length,
      minHeat,
      topics: filtered.map(t => ({ title: t.title, heat: t.heat }))
    };
  }

  /**
   * 生成内容任务
   */
  async generateContent(context) {
    const { filteredTopics } = context;
    if (!filteredTopics || filteredTopics.length === 0) {
      return { generatedCount: 0, contents: [] };
    }

    const generatedContents = [];
    for (const topic of filteredTopics) {
      try {
        // 检查AI服务是否可用
        if (!aiService) {
          logger.warn('[WorkflowEngine] AI服务不可用，使用模拟数据');
          generatedContents.push({
            topicId: topic._id,
            title: topic.title,
            content: `基于"${topic.title}"生成的模拟内容`,
            platformConfigs: []
          });
          continue;
        }

        const content = await aiService.generateContent({
          topic: topic.title,
          source: topic.source,
          category: topic.category,
          keywords: topic.keywords
        });

        generatedContents.push({
          topicId: topic._id,
          title: content.title,
          content: content.content,
          platformConfigs: content.platformConfigs
        });
      } catch (error) {
        logger.warn('[WorkflowEngine] 内容生成失败', {
          topic: topic.title,
          error: error.message
        });
      }
    }

    context.generatedContents = generatedContents;
    return {
      generatedCount: generatedContents.length,
      topicsProcessed: filteredTopics.length
    };
  }

  /**
   * 保存内容任务
   */
  async saveContent(context) {
    const { generatedContents } = context;
    if (!generatedContents || generatedContents.length === 0) {
      return { savedCount: 0 };
    }

    const savedContents = [];
    for (const genContent of generatedContents) {
      try {
        const result = await contentService.create({
          title: genContent.title,
          content: genContent.content,
          summary: genContent.title,
          sourceType: 'hot_topic',
          sourceId: genContent.topicId,
          platforms: genContent.platformConfigs || [],
          category: context.category || 'default',
          tags: context.tags || [],
          status: context.autoApprove ? 'approved' : 'review'
        }, context.userId || 'workflow');

        if (result.success) {
          savedContents.push(result.content);
          context.lastSavedContentId = result.content._id;
        }
      } catch (error) {
        logger.warn('[WorkflowEngine] 内容保存失败', {
          title: genContent.title,
          error: error.message
        });
      }
    }

    context.savedContents = savedContents;
    return {
      savedCount: savedContents.length,
      totalGenerated: generatedContents.length
    };
  }

  /**
   * 计划发布任务
   */
  async schedulePublish(context) {
    const { savedContents } = context;
    if (!savedContents || savedContents.length === 0) {
      return { scheduledCount: 0 };
    }

    const scheduled = [];
    for (const content of savedContents) {
      try {
        // 如果内容有平台配置，自动发布
        if (content.platforms && content.platforms.length > 0) {
          const platforms = content.platforms.map(p => p.platform);
          const result = await contentService.publishToPlatforms(content._id, platforms);
          scheduled.push({
            contentId: content._id,
            platforms,
            result: result.summary
          });
        }
      } catch (error) {
        logger.warn('[WorkflowEngine] 发布计划失败', {
          contentId: content._id,
          error: error.message
        });
      }
    }

    return {
      scheduledCount: scheduled.length,
      details: scheduled
    };
  }

  /**
   * 分析视频转录任务
   */
  async analyzeTranscript(context) {
    const { transcript } = context;
    if (!transcript) {
      throw new Error('转录内容不能为空');
    }

    // 检查AI服务是否可用
    if (!aiService) {
      logger.warn('[WorkflowEngine] AI服务不可用，使用模拟分析结果');
      return {
        summary: '这是视频内容的摘要',
        keyPoints: ['关键点1', '关键点2', '关键点3'],
        suitablePlatforms: ['xiaohongshu', 'douyin', 'toutiao'],
        targetAudience: '通用受众',
        keywords: ['关键词1', '关键词2', '关键词3'],
        sentiment: 'positive',
        contentType: '教育'
      };
    }

    try {
      // 这里可以调用视频分析服务
      const analysis = await aiService.analyzeVideoContent(transcript);
      context.analysis = analysis;
      return analysis;
    } catch (error) {
      logger.error('[WorkflowEngine] 视频转录分析失败', { error: error.message });
      // 返回模拟结果
      return {
        summary: '这是视频内容的摘要',
        keyPoints: ['关键点1', '关键点2', '关键点3'],
        suitablePlatforms: ['xiaohongshu', 'douyin', 'toutiao'],
        targetAudience: '通用受众',
        keywords: ['关键词1', '关键词2', '关键词3'],
        sentiment: 'positive',
        contentType: '教育'
      };
    }
  }

  /**
   * 生成视频内容任务
   */
  async generateVideoContent(context) {
    const { analysis } = context;
    if (!analysis) {
      throw new Error('需要先进行转录分析');
    }

    // 检查AI服务是否可用
    if (!aiService) {
      logger.warn('[WorkflowEngine] AI服务不可用，使用模拟内容');
      return {
        title: '基于分析生成的视频标题',
        content: '基于分析结果生成的视频内容',
        platformVariants: [
          {
            platform: 'xiaohongshu',
            title: '小红书版本标题',
            content: '小红书版本内容',
            tags: ['标签1', '标签2']
          },
          {
            platform: 'douyin',
            title: '抖音版本标题',
            content: '抖音版本内容',
            tags: ['标签3', '标签4']
          }
        ],
        tags: ['通用标签1', '通用标签2'],
        publishingTips: '发布建议'
      };
    }

    try {
      const content = await aiService.generateVideoContent(analysis);
      context.videoContent = content;
      return content;
    } catch (error) {
      logger.error('[WorkflowEngine] 视频内容生成失败', { error: error.message });
      // 返回模拟结果
      return {
        title: '基于分析生成的视频标题',
        content: '基于分析结果生成的视频内容',
        platformVariants: [
          {
            platform: 'xiaohongshu',
            title: '小红书版本标题',
            content: '小红书版本内容',
            tags: ['标签1', '标签2']
          },
          {
            platform: 'douyin',
            title: '抖音版本标题',
            content: '抖音版本内容',
            tags: ['标签3', '标签4']
          }
        ],
        tags: ['通用标签1', '通用标签2'],
        publishingTips: '发布建议'
      };
    }
  }

  /**
   * 验证发布内容任务
   */
  async validateContentForPublish(context) {
    const { contentId } = context;
    if (!contentId) {
      throw new Error('内容ID不能为空');
    }

    const result = await contentService.getById(contentId);
    if (!result.success) {
      throw new Error(`获取内容失败: ${result.error}`);
    }

    const content = result.content;
    if (!['approved', 'published'].includes(content.status)) {
      throw new Error(`内容状态(${content.status})不允许发布`);
    }

    context.content = content;
    return { contentId: content._id, title: content.title, status: content.status };
  }

  /**
   * 准备平台内容任务
   */
  async preparePlatformContent(context) {
    const { content } = context;
    if (!content) {
      throw new Error('内容不能为空');
    }

    // 根据平台配置准备内容
    const platformContents = [];
    for (const platformConfig of content.platforms || []) {
      platformContents.push({
        platform: platformConfig.platform,
        title: platformConfig.title || content.title,
        content: platformConfig.content || content.content,
        tags: platformConfig.tags || [],
        config: platformConfig.config || {}
      });
    }

    context.platformContents = platformContents;
    return { platformCount: platformContents.length, platforms: platformContents.map(p => p.platform) };
  }

  /**
   * 发布到平台任务
   */
  async publishToPlatforms(context) {
    const { content, platformContents } = context;
    if (!content || !platformContents || platformContents.length === 0) {
      return { publishedCount: 0 };
    }

    const results = [];
    for (const platformContent of platformContents) {
      try {
        const result = await contentService.publishToPlatform(
          content._id,
          platformContent.platform,
          { scheduleTime: platformContent.config.scheduleTime }
        );

        results.push({
          platform: platformContent.platform,
          success: result.success,
          publishId: result.publishResult?.publishId
        });
      } catch (error) {
        logger.error('[WorkflowEngine] 平台发布失败', {
          platform: platformContent.platform,
          contentId: content._id,
          error: error.message
        });

        results.push({
          platform: platformContent.platform,
          success: false,
          error: error.message
        });
      }
    }

    return {
      publishedCount: results.filter(r => r.success).length,
      totalCount: results.length,
      results
    };
  }

  /**
   * 获取工作流实例状态
   * @param {string} instanceId - 实例ID
   * @returns {Object}
   */
  getWorkflowInstance(instanceId) {
    return this.runningInstances.get(instanceId) || this.workflowInstances.get(instanceId);
  }

  /**
   * 获取运行中的工作流实例
   * @returns {Array}
   */
  getRunningInstances() {
    return Array.from(this.runningInstances.values());
  }

  /**
   * 获取工作流实例历史
   * @returns {Array}
   */
  getWorkflowHistory() {
    return Array.from(this.workflowInstances.values());
  }

  /**
   * 取消运行中的工作流
   * @param {string} instanceId - 实例ID
   * @returns {boolean}
   */
  cancelWorkflow(instanceId) {
    const instance = this.runningInstances.get(instanceId);
    if (!instance) {
      return false;
    }

    instance.status = WORKFLOW_STATUS.CANCELLED;
    instance.completedAt = new Date();
    this.runningInstances.delete(instanceId);
    this.workflowInstances.set(instanceId, instance);

    logger.info('[WorkflowEngine] 工作流已取消', { instanceId });

    // 只保留最近100个实例
    if (this.workflowInstances.size > 100) {
      const keys = Array.from(this.workflowInstances.keys());
      for (let i = 0; i < keys.length - 100; i++) {
        this.workflowInstances.delete(keys[i]);
      }
    }

    return true;
  }

  /**
   * 创建定时工作流
   * @param {string} workflowId - 工作流ID
   * @param {string} cronExpression - Cron表达式
   * @param {Object} context - 执行上下文
   * @returns {string} - 定时任务ID
   */
  createScheduledWorkflow(workflowId, cronExpression, context) {
    // 这里可以集成 node-cron 来实现定时任务
    // 暂时返回模拟ID
    const scheduleId = `schedule-${Date.now()}-${workflowId}`;
    logger.info('[WorkflowEngine] 定时工作流已创建', {
      scheduleId,
      workflowId,
      cron: cronExpression
    });

    return scheduleId;
  }

  /**
   * 获取工作流统计
   * @returns {Object}
   */
  getStats() {
    const runningCount = this.runningInstances.size;
    const historyCount = this.workflowInstances.size;
    const workflowCount = this.workflows.size;

    // 统计历史实例状态
    const statusStats = {};
    for (const instance of this.workflowInstances.values()) {
      const status = instance.status;
      statusStats[status] = (statusStats[status] || 0) + 1;
    }

    return {
      workflowCount,
      runningCount,
      historyCount,
      statusStats,
      recentInstances: Array.from(this.workflowInstances.values())
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .slice(0, 10)
        .map(instance => ({
          id: instance.id,
          workflowId: instance.workflowId,
          status: instance.status,
          startedAt: instance.startedAt,
          trigger: instance.trigger
        }))
    };
  }
}

// 创建单例
const workflowEngine = new WorkflowEngine();

module.exports = {
  WorkflowEngine,
  workflowEngine,
  WORKFLOW_STATUS,
  TASK_STATUS,
  ERROR_TYPES,
  RETRY_CONFIG
};