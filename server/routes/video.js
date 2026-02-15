const express = require('express');
const router = express.Router();
const videoQueue = require('../services/videoQueue');
const ttsService = require('../services/ttsService');
const { videoManager } = require('../video');
const { logger } = require('../utils/logger');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.VIDEO_UPLOAD_DIR || path.join(process.cwd(), 'storage', 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `upload_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB 限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件格式: ${ext}`));
    }
  }
});

const videoTemplates = [
  {
    id: 'article-video',
    name: '文章视频',
    description: '将长文章转换为视频',
    category: 'article',
    aspectRatio: '16:9',
    duration: 30,
    defaultProps: {
      title: '',
      content: '',
      images: [],
      backgroundMusic: null,
    },
  },
  {
    id: 'micro-video',
    name: '微头条视频',
    description: '短视频形式展示热点内容',
    category: 'micro',
    aspectRatio: '9:16',
    duration: 15,
    defaultProps: {
      text: '',
      image: null,
    },
  },
];

router.get('/templates', (req, res) => {
  res.json({
    success: true,
    data: videoTemplates,
  });
});

router.get('/templates/:id', (req, res) => {
  const template = videoTemplates.find(t => t.id === req.params.id);
  
  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found',
    });
  }

  res.json({
    success: true,
    data: template,
  });
});

router.post('/render', async (req, res) => {
  try {
    const { templateId, props, options } = req.body;

    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'templateId is required and must be a string',
      });
    }

    const validTemplate = videoTemplates.find(t => t.id === templateId);
    if (!validTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid templateId',
      });
    }

    if (props && typeof props !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'props must be an object',
      });
    }

    const taskId = await videoQueue.addTask({
      compositionId: templateId,
      props: props || {},
      options: options || {},
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/render/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = videoQueue.getTaskStatus(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  res.json({
    success: true,
    data: task,
  });
});

router.get('/render', (req, res) => {
  const tasks = videoQueue.getAllTasks();
  
  res.json({
    success: true,
    data: tasks,
  });
});

router.get('/queue/status', (req, res) => {
  const status = videoQueue.getQueueStatus();
  
  res.json({
    success: true,
    data: status,
  });
});

router.delete('/render/:taskId', (req, res) => {
  const { taskId } = req.params;
  const cancelled = videoQueue.cancelTask(taskId);

  if (!cancelled) {
    return res.status(400).json({
      success: false,
      message: 'Task cannot be cancelled',
    });
  }

  res.json({
    success: true,
    message: 'Task cancelled',
  });
});

router.post('/tts/generate', async (req, res) => {
  try {
    const { text, provider, voice, speed } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'text is required',
      });
    }

    const result = await ttsService.generateSpeech({
      text,
      provider: provider || 'azure',
      voice,
      speed: speed || 1.0,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        audioUrl: result.outputUrl,
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete('/queue/clear', (req, res) => {
  videoQueue.clearCompleted();
  
  res.json({
    success: true,
    message: 'Completed tasks cleared',
  });
});

router.post('/render/batch', async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tasks array is required',
      });
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const submittedTaskIds = [];

    for (const task of tasks) {
      const { templateId, props, options } = task;
      
      if (!templateId) {
        continue;
      }

      const taskId = await videoQueue.addTask({
        compositionId: templateId,
        props: props || {},
        options: options || {},
        batchId,
      });

      submittedTaskIds.push(taskId);
    }

    res.json({
      success: true,
      data: {
        batchId,
        taskIds: submittedTaskIds,
        totalTasks: tasks.length,
        submittedTasks: submittedTaskIds.length,
      },
    });
  } catch (error) {
    console.error('Batch render error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/render/batch/:batchId', (req, res) => {
  const { batchId } = req.params;
  const allTasks = videoQueue.getAllTasks();
  
  const batchTasks = allTasks.filter(task => task.batchId === batchId);

  if (batchTasks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Batch not found',
    });
  }

  const completedCount = batchTasks.filter(t => t.status === 'completed').length;
  const failedCount = batchTasks.filter(t => t.status === 'failed').length;
  const renderingCount = batchTasks.filter(t => t.status === 'rendering').length;
  const pendingCount = batchTasks.filter(t => t.status === 'pending').length;

  res.json({
    success: true,
    data: {
      batchId,
      tasks: batchTasks,
      summary: {
        total: batchTasks.length,
        completed: completedCount,
        failed: failedCount,
        rendering: renderingCount,
        pending: pendingCount,
        progress: Math.round((completedCount / batchTasks.length) * 100),
      },
    },
  });
});

// ============================================
// 视频下载相关 API
// ============================================

/**
 * POST /api/video/download
 * 下载视频
 */
router.post('/download', async (req, res) => {
  try {
    const { url, removeWatermark } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'url 参数是必需的'
      });
    }

    logger.info('[VideoAPI] 收到下载请求', { url, removeWatermark });

    const result = await videoManager.download(url, { removeWatermark });

    if (result.success) {
      res.json({
        success: true,
        data: {
          videoId: result.videoId,
          status: 'downloaded',
          metadata: result.metadata
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    logger.error('[VideoAPI] 下载请求失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/video/upload
 * 上传本地视频
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的视频文件'
      });
    }

    const videoId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 保存视频信息
    const videoInfo = {
      videoId,
      platform: 'upload',
      title: req.body.title || req.file.originalname,
      author: req.body.author || '本地上传',
      duration: 0,
      localPath: req.file.path,
      fileSize: req.file.size,
      status: 'uploaded',
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      createdAt: new Date().toISOString()
    };

    const storage = require('../video/VideoStorage');
    await storage.saveVideo(videoId, videoInfo);

    logger.info('[VideoAPI] 视频上传成功', { videoId, filename: req.file.originalname });

    res.json({
      success: true,
      data: {
        videoId,
        status: 'uploaded',
        filename: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    logger.error('[VideoAPI] 上传失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/video/download/:id/status
 * 获取视频下载状态
 */
router.get('/download/:id/status', (req, res) => {
  const { id } = req.params;
  const videoInfo = videoManager.getStatus(id);

  if (!videoInfo) {
    return res.status(404).json({
      success: false,
      message: '视频不存在'
    });
  }

  res.json({
    success: true,
    data: videoInfo
  });
});

/**
 * GET /api/video/download/list
 * 获取已下载视频列表
 */
router.get('/download/list', (req, res) => {
  const query = {
    platform: req.query.platform,
    status: req.query.status,
    page: parseInt(req.query.page) || 1,
    pageSize: parseInt(req.query.pageSize) || 20
  };

  const result = videoManager.listVideos(query);

  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/video/download/:id
 * 获取已下载视频详情
 */
router.get('/download/:id', (req, res) => {
  const { id } = req.params;
  const videoInfo = videoManager.getStatus(id);

  if (!videoInfo) {
    return res.status(404).json({
      success: false,
      message: '视频不存在'
    });
  }

  res.json({
    success: true,
    data: videoInfo
  });
});

/**
 * DELETE /api/video/download/:id
 * 删除已下载的视频
 */
router.delete('/download/:id', async (req, res) => {
  const { id } = req.params;

  const deleted = await videoManager.deleteVideo(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: '视频不存在或删除失败'
    });
  }

  res.json({
    success: true,
    message: '视频已删除'
  });
});

/**
 * GET /api/video/platforms/list
 * 获取支持的平台列表
 */
router.get('/platforms/list', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'douyin', name: '抖音', enabled: true },
      { id: 'kuaishou', name: '快手', enabled: true },
      { id: 'generic', name: '其他平台', enabled: true }
    ]
  });
});

/**
 * POST /api/video/metadata
 * 获取视频元数据（不下载）
 */
router.post('/metadata', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'url 参数是必需的'
      });
    }

    const platformInfo = videoManager.identifyPlatform(url);

    if (!platformInfo) {
      return res.json({
        success: true,
        data: {
          platform: 'unknown',
          message: '无法识别的平台，将使用通用下载器'
        }
      });
    }

    res.json({
      success: true,
      data: {
        platform: platformInfo.platform,
        videoId: platformInfo.videoId,
        url
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/video/storage/stats
 * 获取存储统计
 */
router.get('/storage/stats', (req, res) => {
  const storage = require('../video/VideoStorage');
  const stats = storage.getStats();

  res.json({
    success: true,
    data: stats
  });
});

module.exports = router;
