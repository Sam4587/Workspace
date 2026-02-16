/**
 * 视频下载 API 路由
 */

const express = require('express');
const router = express.Router();
const { videoManager } = require('../video');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// 配置文件上传
const storage = multer.diskStorage({
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
  storage,
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

    const storage = videoManager.storage;
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
 * GET /api/video/:id/status
 * 获取视频状态
 */
router.get('/:id/status', (req, res) => {
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
 * GET /api/video/list
 * 获取视频列表
 */
router.get('/list', (req, res) => {
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
 * GET /api/video/:id
 * 获取视频详情
 */
router.get('/:id', (req, res) => {
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
 * DELETE /api/video/:id
 * 删除视频
 */
router.delete('/:id', async (req, res) => {
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
  const stats = videoManager.storage.getStats();

  res.json({
    success: true,
    data: stats
  });
});

module.exports = router;
