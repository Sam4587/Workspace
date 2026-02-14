const express = require('express');
const router = express.Router();
const videoQueue = require('../services/videoQueue');
const ttsService = require('../services/ttsService');

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

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'templateId is required',
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

module.exports = router;
