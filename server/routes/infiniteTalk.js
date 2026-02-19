const express = require('express');
const router = express.Router();
const { infiniteTalkService } = require('../services/infiniteTalkService');
const { videoDubbingService } = require('../services/videoDubbingService');
const { speechAnalysisService } = require('../services/speechAnalysisService');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/infiniteTalk';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|wav|mp3|m4a|flac|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('不支持的文件类型'));
  }
});

router.get('/health', async (req, res) => {
  try {
    const health = await infiniteTalkService.checkHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/models', async (req, res) => {
  try {
    const models = await infiniteTalkService.getModels();
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/voices', async (req, res) => {
  try {
    const voices = await videoDubbingService.getAvailableVoices();
    res.json({
      success: true,
      data: voices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { sourceImage, audioFile, ...options } = req.body;
    
    if (!sourceImage) {
      return res.status(400).json({
        success: false,
        error: '请提供源图片'
      });
    }

    const result = await videoDubbingService.createDubbing({
      sourceImage,
      audioSource: audioFile,
      ...options
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[InfiniteTalkAPI] 生成失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/generate-from-text', async (req, res) => {
  try {
    const { sourceImage, text, ...options } = req.body;
    
    if (!sourceImage || !text) {
      return res.status(400).json({
        success: false,
        error: '请提供源图片和文本'
      });
    }

    const result = await videoDubbingService.createDubbing({
      sourceImage,
      text,
      ...options
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[InfiniteTalkAPI] 从文本生成失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/upload/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传图片文件'
      });
    }

    const result = await infiniteTalkService.uploadImage(req.file.path);
    
    res.json({
      success: true,
      data: {
        ...result,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/upload/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传音频文件'
      });
    }

    const result = await infiniteTalkService.uploadAudio(req.file.path);
    
    res.json({
      success: true,
      data: {
        ...result,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/dubbing/:dubbingId', async (req, res) => {
  try {
    const { dubbingId } = req.params;
    const status = await videoDubbingService.getDubbingStatus(dubbingId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/dubbing/:dubbingId', async (req, res) => {
  try {
    const { dubbingId } = req.params;
    const result = await videoDubbingService.cancelDubbing(dubbingId);
    
    res.json({
      success: result.success,
      message: result.message || result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/dubbing/:dubbingId/download', async (req, res) => {
  try {
    const { dubbingId } = req.params;
    const { output } = req.query;
    
    const outputPath = output || `./outputs/${dubbingId}.mp4`;
    const result = await videoDubbingService.downloadResult(dubbingId, outputPath);
    
    if (result.success) {
      res.download(outputPath);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/dubbing/queue/stats', (req, res) => {
  try {
    const stats = videoDubbingService.getQueueStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/dubbing/history', (req, res) => {
  try {
    const { status, limit } = req.query;
    const history = videoDubbingService.getHistory({
      status,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/speech/analyze', async (req, res) => {
  try {
    const { audioPath, ...options } = req.body;
    
    if (!audioPath) {
      return res.status(400).json({
        success: false,
        error: '请提供音频路径'
      });
    }

    const result = await speechAnalysisService.analyzeAudio(audioPath, options);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/speech/transcribe', async (req, res) => {
  try {
    const { audioPath, calculateSpeakingRate } = req.body;
    
    if (!audioPath) {
      return res.status(400).json({
        success: false,
        error: '请提供音频路径'
      });
    }

    const result = await speechAnalysisService.transcribe(audioPath, { calculateSpeakingRate });
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/speech/emotion', async (req, res) => {
  try {
    const { audioPath } = req.body;
    
    if (!audioPath) {
      return res.status(400).json({
        success: false,
        error: '请提供音频路径'
      });
    }

    const result = await speechAnalysisService.analyzeEmotion(audioPath);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/speech/style', async (req, res) => {
  try {
    const { audioPath } = req.body;
    
    if (!audioPath) {
      return res.status(400).json({
        success: false,
        error: '请提供音频路径'
      });
    }

    const result = await speechAnalysisService.analyzeSpeakingStyle(audioPath);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/speech/compare', async (req, res) => {
  try {
    const { audioPath1, audioPath2 } = req.body;
    
    if (!audioPath1 || !audioPath2) {
      return res.status(400).json({
        success: false,
        error: '请提供两个音频路径'
      });
    }

    const result = await speechAnalysisService.compareAudio(audioPath1, audioPath2);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/batch/dubbing', async (req, res) => {
  try {
    const { items, ...options } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: '请提供配音项目列表'
      });
    }

    const result = await videoDubbingService.batchDubbing(items, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/multi-character', async (req, res) => {
  try {
    const { characters } = req.body;
    
    if (!characters || !Array.isArray(characters)) {
      return res.status(400).json({
        success: false,
        error: '请提供角色列表'
      });
    }

    const result = await videoDubbingService.createMultiCharacterDubbing(characters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
