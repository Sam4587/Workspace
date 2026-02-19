const express = require('express');
const router = express.Router();
const { videoDownloaderService } = require('../services/videoDownloaderService');
const { transcriptionService } = require('../services/transcriptionService');
const { textOptimizationService } = require('../services/textOptimizationService');
const { multilingualService } = require('../services/multilingualService');
const logger = require('../utils/logger');

router.get('/downloader/platforms', (req, res) => {
  try {
    const platforms = videoDownloaderService.getSupportedPlatforms();
    res.json({ success: true, data: platforms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/downloader/check', async (req, res) => {
  try {
    const result = await videoDownloaderService.checkYtDlpInstalled();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/downloader/info', async (req, res) => {
  try {
    const { url, options } = req.body;
    const result = await videoDownloaderService.getVideoInfo(url, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/downloader/video', async (req, res) => {
  try {
    const { url, options } = req.body;
    const result = await videoDownloaderService.downloadVideo(url, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/downloader/audio', async (req, res) => {
  try {
    const { url, options } = req.body;
    const result = await videoDownloaderService.downloadAudio(url, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/downloader/subtitle', async (req, res) => {
  try {
    const { url, options } = req.body;
    const result = await videoDownloaderService.downloadSubtitle(url, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/downloader/batch', async (req, res) => {
  try {
    const { urls, options } = req.body;
    const result = await videoDownloaderService.batchDownload(urls, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/downloader/status/:downloadId', (req, res) => {
  try {
    const status = videoDownloaderService.getDownloadStatus(req.params.downloadId);
    if (!status) {
      return res.status(404).json({ success: false, error: '下载任务不存在' });
    }
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/downloader/cancel/:downloadId', (req, res) => {
  try {
    const result = videoDownloaderService.cancelDownload(req.params.downloadId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/downloader/history', (req, res) => {
  try {
    const { platform, status, limit } = req.query;
    const history = videoDownloaderService.getHistory({
      platform,
      status,
      limit: limit ? parseInt(limit) : 50
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/downloader/stats', (req, res) => {
  try {
    const stats = videoDownloaderService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transcription/models', (req, res) => {
  try {
    const models = transcriptionService.getModels();
    res.json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transcription/languages', (req, res) => {
  try {
    const languages = transcriptionService.getLanguages();
    res.json({ success: true, data: languages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transcription/check', async (req, res) => {
  try {
    const result = await transcriptionService.checkFasterWhisperInstalled();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/transcription/transcribe', async (req, res) => {
  try {
    const { audioPath, options } = req.body;
    const result = await transcriptionService.transcribe(audioPath, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/transcription/timestamps', async (req, res) => {
  try {
    const { audioPath, options } = req.body;
    const result = await transcriptionService.transcribeWithTimestamps(audioPath, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/transcription/detect-language', async (req, res) => {
  try {
    const { audioPath } = req.body;
    const result = await transcriptionService.detectLanguage(audioPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/transcription/batch', async (req, res) => {
  try {
    const { audioPaths, options } = req.body;
    const result = await transcriptionService.batchTranscribe(audioPaths, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transcription/status/:transcriptionId', (req, res) => {
  try {
    const status = transcriptionService.getTranscriptionStatus(req.params.transcriptionId);
    if (!status) {
      return res.status(404).json({ success: false, error: '转录任务不存在' });
    }
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transcription/history', (req, res) => {
  try {
    const { language, status, limit } = req.query;
    const history = transcriptionService.getHistory({
      language,
      status,
      limit: limit ? parseInt(limit) : 50
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transcription/stats', (req, res) => {
  try {
    const stats = transcriptionService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/optimization/correct', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await textOptimizationService.correctText(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/optimization/complete', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await textOptimizationService.completeSentences(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/optimization/segment', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await textOptimizationService.segmentText(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/optimization/punctuation', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await textOptimizationService.optimizePunctuation(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/optimization/full', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await textOptimizationService.fullOptimization(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/optimization/readability', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await textOptimizationService.analyzeReadability(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/optimization/stats', (req, res) => {
  try {
    const stats = textOptimizationService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/multilingual/languages', (req, res) => {
  try {
    const languages = multilingualService.getSupportedLanguages();
    res.json({ success: true, data: languages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/multilingual/detect', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await multilingualService.detectLanguage(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/multilingual/translate', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await multilingualService.translate(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/multilingual/summarize', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await multilingualService.summarize(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/multilingual/translate-summarize', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await multilingualService.translateAndSummarize(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/multilingual/multi-summary', async (req, res) => {
  try {
    const { text, options } = req.body;
    const result = await multilingualService.multiLanguageSummary(text, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/multilingual/batch-translate', async (req, res) => {
  try {
    const { items, options } = req.body;
    const result = await multilingualService.batchTranslate(items, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/multilingual/stats', (req, res) => {
  try {
    const stats = multilingualService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
