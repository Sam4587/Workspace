const express = require('express');
const router = express.Router();
const { videoTranscriptionPipeline } = require('../services/videoTranscriptionPipeline');
const { progressNotifierService, ProgressEvents } = require('../services/progressNotifierService');
const logger = require('../utils/logger');

router.post('/execute', async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: '请提供视频URL'
      });
    }

    const result = await videoTranscriptionPipeline.execute(url, options);
    res.json(result);
  } catch (error) {
    logger.error('[PipelineAPI] 执行失败', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/quick-transcribe', async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: '请提供视频URL'
      });
    }

    const result = await videoTranscriptionPipeline.quickTranscribe(url, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { urls, options } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供视频URL列表'
      });
    }

    const result = await videoTranscriptionPipeline.batchExecute(urls, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/:pipelineId', (req, res) => {
  try {
    const status = videoTranscriptionPipeline.getPipelineStatus(req.params.pipelineId);
    if (!status) {
      return res.status(404).json({ success: false, error: '管道不存在' });
    }
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/cancel/:pipelineId', (req, res) => {
  try {
    const result = videoTranscriptionPipeline.cancelPipeline(req.params.pipelineId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', (req, res) => {
  try {
    const { status, limit } = req.query;
    const history = videoTranscriptionPipeline.getHistory({
      status,
      limit: limit ? parseInt(limit) : 50
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = videoTranscriptionPipeline.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/progress/events', (req, res) => {
  try {
    res.json({ success: true, data: ProgressEvents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/progress/stats', (req, res) => {
  try {
    const stats = progressNotifierService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/progress/clients', (req, res) => {
  try {
    const clients = progressNotifierService.listClients();
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/progress/client/:clientId', (req, res) => {
  try {
    const info = progressNotifierService.getClientInfo(req.params.clientId);
    if (!info) {
      return res.status(404).json({ success: false, error: '客户端不存在' });
    }
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
