/**
 * 转录 API 路由
 */

const express = require('express');
const router = express.Router();
const { transcriptionEngine } = require('../transcription');
const logger = require('../utils/logger');
const videoStorage = require('../video/VideoStorage');

/**
 * POST /api/transcription/submit
 * 提交转录任务
 */
router.post('/submit', async (req, res) => {
  try {
    const { videoId, engine, options } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'videoId 参数是必需的'
      });
    }

    // 获取视频信息
    const videoInfo = videoStorage.getVideoInfo(videoId);
    if (!videoInfo) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    if (!videoInfo.localPath) {
      return res.status(400).json({
        success: false,
        message: '视频文件路径无效'
      });
    }

    logger.info('[TranscriptionAPI] 提交转录任务', { videoId, engine });

    // 提交任务
    const taskId = await transcriptionEngine.submitTask({
      videoId,
      mediaPath: videoInfo.localPath,
      options: {
        engine,
        ...options
      }
    });

    // 更新视频状态
    await videoStorage.updateStatus(videoId, 'transcribing', { taskId });

    res.json({
      success: true,
      data: {
        taskId,
        videoId,
        status: 'pending'
      }
    });
  } catch (error) {
    logger.error('[TranscriptionAPI] 提交任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/transcription/:taskId
 * 查询任务状态
 */
router.get('/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = transcriptionEngine.getTaskStatus(taskId);

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
});

/**
 * GET /api/transcription/queue/status
 * 获取队列状态
 */
router.get('/queue/status', (req, res) => {
  const status = transcriptionEngine.getQueueStatus();

  res.json({
    success: true,
    data: status
  });
});

/**
 * GET /api/transcription/engines/list
 * 获取可用引擎列表
 */
router.get('/engines/list', (req, res) => {
  const engines = transcriptionEngine.listEngines();

  res.json({
    success: true,
    data: engines
  });
});

/**
 * POST /api/transcription/transcribe
 * 同步转录（立即执行）
 */
router.post('/transcribe', async (req, res) => {
  try {
    const { videoId, engine, options } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'videoId 参数是必需的'
      });
    }

    // 获取视频信息
    const videoInfo = videoStorage.getVideoInfo(videoId);
    if (!videoInfo) {
      return res.status(404).json({
        success: false,
        message: '视频不存在'
      });
    }

    logger.info('[TranscriptionAPI] 同步转录', { videoId, engine });

    // 执行转录
    const result = await transcriptionEngine.transcribe(videoInfo.localPath, {
      engine,
      ...options
    });

    if (result.success) {
      // 更新视频状态
      await videoStorage.updateStatus(videoId, 'transcribed', { transcription: result });

      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    logger.error('[TranscriptionAPI] 转录失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/transcription/:taskId
 * 取消任务
 */
router.delete('/:taskId', (req, res) => {
  const { taskId } = req.params;
  const cancelled = transcriptionEngine.cancelTask(taskId);

  if (!cancelled) {
    return res.status(400).json({
      success: false,
      message: '任务无法取消'
    });
  }

  res.json({
    success: true,
    message: '任务已取消'
  });
});

/**
 * GET /api/transcription/video/:videoId
 * 获取视频的转录结果
 */
router.get('/video/:videoId', (req, res) => {
  const { videoId } = req.params;
  const videoInfo = videoStorage.getVideoInfo(videoId);

  if (!videoInfo) {
    return res.status(404).json({
      success: false,
      message: '视频不存在'
    });
  }

  if (!videoInfo.transcription) {
    // 检查是否有进行中的任务
    const tasks = transcriptionEngine.taskQueue.getTasksByVideoId(videoId);
    const pendingTask = tasks.find(t => t.status === 'pending' || t.status === 'processing');

    if (pendingTask) {
      return res.json({
        success: true,
        data: {
          status: 'processing',
          taskId: pendingTask.taskId,
          progress: pendingTask.progress
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: '视频尚未转录'
    });
  }

  res.json({
    success: true,
    data: {
      status: 'completed',
      transcription: videoInfo.transcription
    }
  });
});

module.exports = router;
