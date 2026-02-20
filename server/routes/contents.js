/**
 * 内容管理 API 路由
 */

const express = require('express');
const router = express.Router();

// 安全导入服务
let contentService = null;
let aiService = null;
let workflowEngine = null;
let performanceTrackingService = null;
let enhancedContentCreationService = null;
let contentQualityAssessmentService = null;
let multiPlatformAdaptationService = null;
let contentDistributionService = null;

try {
  contentService = require('../services/ContentService');
  console.log('[ContentRoute] ContentService 加载成功');
} catch (error) {
  console.error('[ContentRoute] ContentService 加载失败:', error.message);
  contentService = null;
}

try {
  aiService = require('../services/aiService');
  console.log('[ContentRoute] AIService 加载成功');
} catch (error) {
  console.error('[ContentRoute] AIService 加载失败:', error.message);
  aiService = null;
}

try {
  enhancedContentCreationService = require('../services/enhancedContentCreationService');
  console.log('[ContentRoute] EnhancedContentCreationService 加载成功');
} catch (error) {
  console.error('[ContentRoute] EnhancedContentCreationService 加载失败:', error.message);
  enhancedContentCreationService = null;
}

try {
  contentQualityAssessmentService = require('../services/contentQualityAssessmentService');
  console.log('[ContentRoute] ContentQualityAssessmentService 加载成功');
} catch (error) {
  console.error('[ContentRoute] ContentQualityAssessmentService 加载失败:', error.message);
  contentQualityAssessmentService = null;
}

try {
  multiPlatformAdaptationService = require('../services/multiPlatformAdaptationService');
  console.log('[ContentRoute] MultiPlatformAdaptationService 加载成功');
} catch (error) {
  console.error('[ContentRoute] MultiPlatformAdaptationService 加载失败:', error.message);
  multiPlatformAdaptationService = null;
}

try {
  contentDistributionService = require('../services/contentDistributionService');
  console.log('[ContentRoute] ContentDistributionService 加载成功');
} catch (error) {
  console.error('[ContentRoute] ContentDistributionService 加载失败:', error.message);
  contentDistributionService = null;
}

try {
  const workflowModule = require('../services/WorkflowEngine');
  workflowEngine = workflowModule.workflowEngine;
  console.log('[ContentRoute] WorkflowEngine 加载成功');
} catch (error) {
  console.error('[ContentRoute] WorkflowEngine 加载失败:', error.message);
  workflowEngine = null;
}

try {
  performanceTrackingService = require('../services/PerformanceTrackingService');
  console.log('[ContentRoute] PerformanceTrackingService 加载成功');
} catch (error) {
  console.error('[ContentRoute] PerformanceTrackingService 加载失败:', error.message);
  performanceTrackingService = null;
}

const logger = require('../utils/logger');

// 创建安全包装器函数
const safeServiceCall = async (serviceCall, serviceName) => {
  try {
    if (!serviceCall) {
      throw new Error(`${serviceName} 服务不可用`);
    }
    return await serviceCall();
  } catch (error) {
    logger.error(`[ContentAPI] ${serviceName} 调用失败`, { error: error.message });
    throw error;
  }
};

/**
 * POST /api/contents
 * 创建内容
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, ...contentData } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const result = await contentService.create(contentData, userId);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 创建内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents
 * 获取内容列表
 */
const ContentModel = require('../models/Content');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, hotTopicId, status, category, search, platform, userId, dateFrom, dateTo } = req.query;
    
    if (hotTopicId) {
      const contents = await ContentModel.findByHotTopicId(hotTopicId);
      return res.json({
        success: true,
        data: contents,
        pagination: {
          page: 1,
          limit: contents.length,
          total: contents.length,
          pages: 1
        }
      });
    }

    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const filters = {};
    if (status) filters.status = status.split(',');
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (platform) filters.platform = platform;
    if (userId) filters.userId = userId;
    if (dateFrom || dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }

    const result = await contentService.list(filters, parseInt(page), parseInt(limit));

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 获取内容列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/workflows
 * 获取工作流列表
 */
router.get('/workflows', (req, res) => {
  try {
    if (!workflowEngine) {
      return res.status(500).json({
        success: false,
        message: '工作流引擎不可用'
      });
    }

    const workflows = workflowEngine.getWorkflows();

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    logger.error('[ContentAPI] 获取工作流列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/stats
 * 获取工作流统计
 */
router.get('/workflows/stats', (req, res) => {
  try {
    if (!workflowEngine) {
      return res.status(500).json({
        success: false,
        message: '工作流引擎不可用'
      });
    }

    const stats = workflowEngine.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('[ContentAPI] 获取工作流统计失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/workflows/execute
 * 执行工作流
 */
router.post('/workflows/execute', async (req, res) => {
  try {
    if (!workflowEngine) {
      return res.status(500).json({
        success: false,
        message: '工作流引擎不可用'
      });
    }

    const { workflowId, context, trigger = 'manual' } = req.body;

    const result = await workflowEngine.executeWorkflow(workflowId, context, trigger);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 执行工作流失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/:id
 * 获取内容详情
 */
router.get('/:id', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id } = req.params;

    const result = await contentService.getById(id);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 获取内容详情失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/contents/:id
 * 更新内容
 */
router.put('/:id', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id || 'anonymous';

    const result = await contentService.update(id, updateData, userId);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 更新内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/contents/:id
 * 删除内容
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const result = await contentService.delete(id, userId);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 删除内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/:id/status
 * 更新内容状态
 */
router.post('/:id/status', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user?.id || 'system';

    const result = await contentService.updateStatus(id, status, userId, reason);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 更新内容状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/:id/publish
 * 发布内容到平台
 */
router.post('/:id/publish', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id } = req.params;
    const { platform, options } = req.body;

    const result = await contentService.publishToPlatform(id, platform, options);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 发布内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/:id/publish/batch
 * 批量发布内容到多个平台
 */
router.post('/:id/publish/batch', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id } = req.params;
    const { platforms, options } = req.body;

    const result = await contentService.publishToPlatforms(id, platforms, options);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 批量发布内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/:id/publish/:platform/status
 * 获取发布状态
 */
router.get('/:id/publish/:platform/status', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id, platform } = req.params;

    const result = await contentService.getPublishStatus(id, platform);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 获取发布状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/:id/performance
 * 获取内容性能数据
 */
router.get('/:id/performance', async (req, res) => {
  try {
    if (!performanceTrackingService) {
      return res.status(500).json({
        success: false,
        message: '性能追踪服务不可用'
      });
    }

    const { id } = req.params;

    const result = await performanceTrackingService.getPerformanceReport(id);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 获取性能数据失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/:id/performance/track
 * 手动追踪性能
 */
router.post('/:id/performance/track', async (req, res) => {
  try {
    if (!performanceTrackingService) {
      return res.status(500).json({
        success: false,
        message: '性能追踪服务不可用'
      });
    }

    const { id } = req.params;

    const result = await performanceTrackingService.trackContent(id);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 手动追踪性能失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/publish
 * 立即发布内容
 */
router.post('/publish', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const { contentId, platforms, options } = req.body;
    
    // 获取内容
    const contentResult = await contentService.getById(contentId);
    if (!contentResult.success) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    const result = await contentDistributionService.publishContent(
      contentResult.content, 
      platforms, 
      options
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] 内容发布失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/schedule-publish
 * 定时发布内容
 */
router.post('/schedule-publish', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const { contentId, platforms, scheduleTime, options } = req.body;
    
    // 获取内容
    const contentResult = await contentService.getById(contentId);
    if (!contentResult.success) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    const result = await contentDistributionService.schedulePublish(
      contentResult.content, 
      platforms, 
      scheduleTime,
      options
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] 定时发布设置失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/batch-publish
 * 批量发布内容
 */
router.post('/batch-publish', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const { contentIds, platformMapping, options } = req.body;
    
    // 获取所有内容
    const contents = [];
    for (const contentId of contentIds) {
      const result = await contentService.getById(contentId);
      if (result.success) {
        contents.push(result.content);
      }
    }

    const result = await contentDistributionService.batchPublish(
      contents, 
      platformMapping, 
      options
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] 批量发布失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/smart-distribute
 * 智能分发内容
 */
router.post('/smart-distribute', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const { contentId, strategy, options } = req.body;
    
    // 获取内容
    const contentResult = await contentService.getById(contentId);
    if (!contentResult.success) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    const result = await contentDistributionService.smartDistribute(
      contentResult.content, 
      strategy, 
      options
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] 智能分发失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/publish-status/:contentId
 * 获取发布状态
 */
router.get('/publish-status/:contentId', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const { contentId } = req.params;
    const { platform } = req.query;

    const status = await contentDistributionService.getPublishStatus(contentId, platform);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('[ContentAPI] 获取发布状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/scheduled-tasks
 * 获取调度任务
 */
router.get('/scheduled-tasks', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const { status, contentId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (contentId) filter.contentId = contentId;

    const tasks = contentDistributionService.getScheduledTasks(filter);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    logger.error('[ContentAPI] 获取调度任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/contents/scheduled-tasks/:taskId
 * 取消调度任务
 */
router.delete('/scheduled-tasks/:taskId', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const { taskId } = req.params;

    const result = contentDistributionService.cancelScheduledTask(taskId);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 取消调度任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/publishers
 * 获取可用发布器
 */
router.get('/publishers', async (req, res) => {
  try {
    if (!contentDistributionService) {
      return res.status(500).json({
        success: false,
        message: '内容分发服务不可用'
      });
    }

    const publishers = contentDistributionService.getAvailablePublishers();

    res.json({
      success: true,
      data: publishers
    });
  } catch (error) {
    logger.error('[ContentAPI] 获取发布器失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/adapt-platform
 * 多平台内容适配
 */
router.post('/adapt-platform', async (req, res) => {
  try {
    if (!multiPlatformAdaptationService) {
      return res.status(500).json({
        success: false,
        message: '多平台适配服务不可用'
      });
    }

    const { content, targetPlatform, options } = req.body;

    const adaptation = await multiPlatformAdaptationService.adaptContentForPlatform(
      content, 
      targetPlatform, 
      options
    );

    res.json({
      success: true,
      data: adaptation
    });
  } catch (error) {
    logger.error('[ContentAPI] 多平台内容适配失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/adapt-multiple-platforms
 * 批量多平台内容适配
 */
router.post('/adapt-multiple-platforms', async (req, res) => {
  try {
    if (!multiPlatformAdaptationService) {
      return res.status(500).json({
        success: false,
        message: '多平台适配服务不可用'
      });
    }

    const { content, platforms, options } = req.body;

    const adaptations = await multiPlatformAdaptationService.adaptContentForMultiplePlatforms(
      content, 
      platforms, 
      options
    );

    res.json({
      success: true,
      data: adaptations
    });
  } catch (error) {
    logger.error('[ContentAPI] 批量多平台内容适配失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/platforms
 * 获取支持的平台列表
 */
router.get('/platforms', async (req, res) => {
  try {
    if (!multiPlatformAdaptationService) {
      return res.status(500).json({
        success: false,
        message: '多平台适配服务不可用'
      });
    }

    const platforms = multiPlatformAdaptationService.getSupportedPlatforms();

    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    logger.error('[ContentAPI] 获取平台列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/quality-assess
 * 内容质量评估
 */
router.post('/quality-assess', async (req, res) => {
  try {
    if (!contentQualityAssessmentService) {
      return res.status(500).json({
        success: false,
        message: '内容质量评估服务不可用'
      });
    }

    const { content, contentType, options } = req.body;

    const assessment = await contentQualityAssessmentService.assessContentQuality(
      content, 
      contentType, 
      options
    );

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('[ContentAPI] 内容质量评估失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/generate-enhanced
 * 增强版AI内容生成
 */
router.post('/generate-enhanced', async (req, res) => {
  try {
    if (!enhancedContentCreationService) {
      return res.status(500).json({
        success: false,
        message: '增强内容生成服务不可用'
      });
    }

    const { formData, options } = req.body;

    const result = await enhancedContentCreationService.generateSmartContent(formData, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] 增强AI生成内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/templates
 * 获取可用内容模板
 */
router.get('/templates', async (req, res) => {
  try {
    if (!enhancedContentCreationService) {
      return res.status(500).json({
        success: false,
        message: '内容生成服务不可用'
      });
    }

    const templates = enhancedContentCreationService.getAvailableTemplates();
    const styles = enhancedContentCreationService.getAvailableStyles();

    res.json({
      success: true,
      data: {
        templates,
        styles
      }
    });
  } catch (error) {
    logger.error('[ContentAPI] 获取模板失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/generate
 * AI生成内容并保存
 */
router.post('/generate', async (req, res) => {
  try {
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'AI服务不可用'
      });
    }

    const { formData, type, options } = req.body;

    const result = await aiService.generateAndSaveContent(formData, type, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] AI生成内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/generate/batch
 * 批量AI生成内容
 */
router.post('/generate/batch', async (req, res) => {
  try {
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'AI服务不可用'
      });
    }

    const { formDataList, type, options } = req.body;

    const result = await aiService.batchGenerateContent(formDataList, type, options);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 批量AI生成内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/analyze-video
 * 分析视频转录内容
 */
router.post('/analyze-video', async (req, res) => {
  try {
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'AI服务不可用'
      });
    }

    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: '转录内容不能为空'
      });
    }

    const result = await aiService.analyzeVideoContent(transcript);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] 分析视频转录失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/generate-video
 * 基于分析生成视频内容
 */
router.post('/generate-video', async (req, res) => {
  try {
    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'AI服务不可用'
      });
    }

    const { analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({
        success: false,
        message: '分析结果不能为空'
      });
    }

    const result = await aiService.generateVideoContent(analysis);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ContentAPI] 生成视频内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/contents/:id/review
 * 审核内容
 */
router.post('/:id/review', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { id } = req.params;
    const { isApproved, comments } = req.body;
    const reviewer = req.user?.id || 'anonymous';

    const result = await contentService.review(id, isApproved, reviewer, comments);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 审核内容失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/stats
 * 获取内容统计
 */
router.get('/stats', async (req, res) => {
  try {
    if (!contentService) {
      return res.status(500).json({
        success: false,
        message: '内容服务不可用'
      });
    }

    const { userId, dateFrom, dateTo } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (dateFrom || dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }

    const result = await contentService.getStats(filters);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 获取统计信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/performance/ranking
 * 获取性能排行榜
 */
router.get('/performance/ranking', async (req, res) => {
  try {
    if (!performanceTrackingService) {
      return res.status(500).json({
        success: false,
        message: '性能追踪服务不可用'
      });
    }

    const { metric = 'views', limit = 10 } = req.query;

    const result = await performanceTrackingService.getPerformanceRanking(metric, parseInt(limit));

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 获取性能排行榜失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/contents/performance/trends
 * 获取性能趋势
 */
router.get('/performance/trends', async (req, res) => {
  try {
    if (!performanceTrackingService) {
      return res.status(500).json({
        success: false,
        message: '性能追踪服务不可用'
      });
    }

    const { startDate, endDate, platform, category } = req.query;

    const options = { startDate, endDate, platform, category };

    const result = await performanceTrackingService.getPerformanceTrends(options);

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 获取性能趋势失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/optimize-title', async (req, res) => {
  try {
    const { title, keywords, targetPlatform = 'toutiao', count = 5 } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '标题不能为空'
      });
    }

    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'AI服务不可用'
      });
    }

    const result = await aiService.optimizeTitle({
      title,
      keywords: keywords || [],
      targetPlatform,
      count
    });

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 标题优化失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/generate-titles', async (req, res) => {
  try {
    const titleGenerationService = require('../services/titleGenerationService');
    const { topic, keywords, platform = 'toutiao', count = 5, style = 'balanced' } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: '主题不能为空'
      });
    }

    const result = await titleGenerationService.generateTitles({
      topic,
      keywords: keywords || [],
      platform,
      count,
      style
    });

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 标题生成失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/title-platforms', (req, res) => {
  try {
    const titleGenerationService = require('../services/titleGenerationService');
    const platforms = {
      toutiao: titleGenerationService.getPlatformRules('toutiao'),
      douyin: titleGenerationService.getPlatformRules('douyin'),
      xiaohongshu: titleGenerationService.getPlatformRules('xiaohongshu'),
      weibo: titleGenerationService.getPlatformRules('weibo'),
      bilibili: titleGenerationService.getPlatformRules('bilibili'),
      zhihu: titleGenerationService.getPlatformRules('zhihu')
    };

    res.json({
      success: true,
      platforms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/viral-patterns', (req, res) => {
  try {
    const titleGenerationService = require('../services/titleGenerationService');
    const patterns = titleGenerationService.getViralPatterns();

    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/check-title-compliance', (req, res) => {
  try {
    const titleGenerationService = require('../services/titleGenerationService');
    const { title, platform = 'toutiao' } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '标题不能为空'
      });
    }

    const result = titleGenerationService.quickComplianceCheck(title, platform);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;