/**
 * 任务管理API路由
 */

const express = require('express');
const router = express.Router();
const { taskManager } = require('../services/TaskManager');
const logger = require('../utils/logger');

// 创建任务
router.post('/', async (req, res) => {
  try {
    const { type, resourceId, parameters } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    // 验证必需参数
    if (!type || !resourceId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: type 和 resourceId'
      });
    }
    
    // 创建任务
    const task = await taskManager.createTask(type, resourceId, parameters, userId);
    
    res.status(201).json({
      success: true,
      data: {
        taskId: task.taskId,
        status: task.status,
        type: task.type,
        createdAt: task.createdAt
      },
      message: '任务创建成功'
    });
  } catch (error) {
    logger.error('[Tasks] 创建任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: '创建任务失败',
      message: error.message
    });
  }
});

// 获取用户任务列表
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id || 'anonymous';
    
    const tasks = await taskManager.getUserTasks(userId, {
      status,
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const totalCount = await taskManager.getUserTasks(userId, { status, type }).countDocuments();

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('[Tasks] 获取任务列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: '获取任务列表失败',
      message: error.message
    });
  }
});

// 获取任务详情
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    const task = await taskManager.getTask(taskId, userId);
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('[Tasks] 获取任务详情失败', { 
      taskId: req.params.taskId,
      error: error.message 
    });
    
    res.status(error.message === '任务不存在' ? 404 : 403).json({
      success: false,
      error: error.message
    });
  }
});

// 取消任务
router.post('/:taskId/cancel', async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    const task = await taskManager.cancelTask(taskId, userId);
    
    res.json({
      success: true,
      data: task,
      message: '任务已取消'
    });
  } catch (error) {
    logger.error('[Tasks] 取消任务失败', { 
      taskId: req.params.taskId,
      error: error.message 
    });
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 获取活跃任务
router.get('/active/count', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const activeTasks = await taskManager.getActiveTasks(userId);
    
    res.json({
      success: true,
      data: {
        count: activeTasks.length,
        tasks: activeTasks.map(task => ({
          taskId: task.taskId,
          type: task.type,
          status: task.status,
          progress: task.progress
        }))
      }
    });
  } catch (error) {
    logger.error('[Tasks] 获取活跃任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: '获取活跃任务失败'
    });
  }
});

// 系统统计信息（管理员接口）
router.get('/stats/system', async (req, res) => {
  try {
    const stats = taskManager.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('[Tasks] 获取系统统计失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: '获取系统统计失败'
    });
  }
});

module.exports = router;