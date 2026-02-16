/**
 * 转录任务队列管理 API 路由
 * 提供任务队列的监控、管理和控制功能
 */

const express = require('express');
const router = express.Router();
const { transcriptionEngine } = require('../transcription');
const logger = require('../utils/logger');
const { validateRequired, validateTypes } = require('../middleware/validation');

/**
 * GET /api/task-queue/status
 * 获取任务队列整体状态
 */
router.get('/status', (req, res) => {
  try {
    const status = transcriptionEngine.getQueueStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 获取队列状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/task-queue/tasks
 * 获取任务列表
 */
router.get('/tasks', (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const allTasks = transcriptionEngine.taskQueue.getAllTasks();
    let filteredTasks = allTasks;
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    const totalCount = filteredTasks.length;
    const paginatedTasks = filteredTasks
      .slice(parseInt(offset))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        tasks: paginatedTasks,
        pagination: {
          totalCount,
          currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          hasNext: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 获取任务列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/task-queue/tasks/:taskId
 * 获取特定任务详情
 */
router.get('/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = transcriptionEngine.taskQueue.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 获取任务详情失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/task-queue/tasks/:taskId/cancel
 * 取消任务
 */
router.post('/tasks/:taskId/cancel', (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;
    
    const cancelled = transcriptionEngine.taskQueue.cancel(taskId);
    
    if (!cancelled) {
      return res.status(400).json({
        success: false,
        message: '任务无法取消（可能已完成或不存在）'
      });
    }
    
    res.json({
      success: true,
      message: '任务已取消',
      data: {
        taskId,
        reason: reason || 'User cancelled'
      }
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 取消任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/task-queue/tasks/:taskId/retry
 * 重试失败的任务
 */
router.post('/tasks/:taskId/retry', (req, res) => {
  try {
    const { taskId } = req.params;
    
    // 注意：这里需要访问增强版队列的重试功能
    // 暂时使用基本的重新提交逻辑
    const task = transcriptionEngine.taskQueue.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    if (task.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: '只能重试失败的任务'
      });
    }
    
    // 重新提交任务
    transcriptionEngine.taskQueue.updateStatus(taskId, 'pending');
    
    res.json({
      success: true,
      message: '任务已重新排队',
      data: {
        taskId
      }
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 重试任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/task-queue/tasks/:taskId/pause
 * 暂停任务
 */
router.post('/tasks/:taskId/pause', (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = transcriptionEngine.taskQueue.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    if (task.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: '只能暂停正在处理的任务'
      });
    }
    
    transcriptionEngine.taskQueue.updateStatus(taskId, 'paused');
    
    res.json({
      success: true,
      message: '任务已暂停',
      data: {
        taskId
      }
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 暂停任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/task-queue/tasks/:taskId/resume
 * 恢复暂停的任务
 */
router.post('/tasks/:taskId/resume', (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = transcriptionEngine.taskQueue.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    if (task.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: '只能恢复已暂停的任务'
      });
    }
    
    transcriptionEngine.taskQueue.updateStatus(taskId, 'pending');
    
    res.json({
      success: true,
      message: '任务已恢复',
      data: {
        taskId
      }
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 恢复任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/task-queue/statistics
 * 获取任务统计信息
 */
router.get('/statistics', (req, res) => {
  try {
    const { timeRange = '24h', groupBy } = req.query;
    
    // 如果有增强版队列，使用其统计功能
    if (transcriptionEngine.enhancedTaskQueue) {
      const stats = transcriptionEngine.enhancedTaskQueue.getStatistics({
        timeRange,
        groupBy
      });
      
      return res.json({
        success: true,
        data: stats
      });
    }
    
    // 使用基础统计
    const tasks = transcriptionEngine.taskQueue.getAllTasks();
    const now = Date.now();
    const timeRanges = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000
    };
    
    const timeThreshold = now - (timeRanges[timeRange] || timeRanges['24h']);
    const recentTasks = tasks.filter(task => 
      new Date(task.createdAt).getTime() > timeThreshold
    );
    
    const stats = {
      total: tasks.length,
      recent: recentTasks.length,
      byStatus: {},
      byEngine: {},
      averageProcessingTime: 0,
      successRate: 0
    };
    
    // 按状态统计
    tasks.forEach(task => {
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
    });
    
    // 按引擎统计
    tasks.forEach(task => {
      const engine = task.options?.engine || 'unknown';
      stats.byEngine[engine] = (stats.byEngine[engine] || 0) + 1;
    });
    
    // 计算成功率
    const completedTasks = recentTasks.filter(t => t.status === 'completed');
    if (recentTasks.length > 0) {
      stats.successRate = Math.round((completedTasks.length / recentTasks.length) * 100);
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 获取统计信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/task-queue/batch/cancel
 * 批量取消任务
 */
router.post('/batch/cancel', (req, res) => {
  try {
    const { taskIds, status, reason } = req.body;
    
    if (!taskIds && !status) {
      return res.status(400).json({
        success: false,
        message: '必须提供taskIds或status参数'
      });
    }
    
    let tasksToCancel = [];
    
    if (taskIds) {
      // 按ID取消
      tasksToCancel = taskIds;
    } else if (status) {
      // 按状态取消
      const allTasks = transcriptionEngine.taskQueue.getAllTasks();
      tasksToCancel = allTasks
        .filter(task => task.status === status)
        .map(task => task.taskId);
    }
    
    const results = [];
    let successCount = 0;
    
    tasksToCancel.forEach(taskId => {
      const success = transcriptionEngine.taskQueue.cancel(taskId);
      results.push({
        taskId,
        success
      });
      if (success) successCount++;
    });
    
    res.json({
      success: true,
      data: {
        total: tasksToCancel.length,
        success: successCount,
        failed: tasksToCancel.length - successCount,
        results
      }
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 批量取消任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/task-queue/cleanup
 * 清理已完成的任务
 */
router.delete('/cleanup', (req, res) => {
  try {
    transcriptionEngine.taskQueue.clearCompleted();
    
    res.json({
      success: true,
      message: '已完成任务清理完成'
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 清理任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/task-queue/system
 * 获取系统资源信息
 */
router.get('/system', (req, res) => {
  try {
    const os = require('os');
    
    const systemInfo = {
      cpu: {
        cores: os.cpus().length,
        load: os.loadavg(),
        arch: os.arch()
      },
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024), // MB
        free: Math.round(os.freemem() / 1024 / 1024),   // MB
        usage: Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100) // %
      },
      uptime: Math.round(os.uptime()),
      platform: os.platform()
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    logger.error('[TaskQueueAPI] 获取系统信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;