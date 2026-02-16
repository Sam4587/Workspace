/**
 * 视频生成API路由
 */

const express = require('express');
const router = express.Router();
const { videoRenderer } = require('../video/renderer');
const { validateRequired, validateTypes } = require('../middleware/validation');

/**
 * GET /api/video/templates
 * 获取可用的视频模板列表
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await videoRenderer.getTemplates();
    
    res.json({
      success: true,
      data: templates,
      message: '模板列表获取成功'
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/video/render
 * 渲染单个视频
 */
router.post('/render', 
  validateRequired(['templateId']),
  validateTypes({ 
    templateId: 'string', 
    props: 'object',
    options: 'object'
  }),
  async (req, res) => {
    try {
      const { templateId, props = {}, options = {} } = req.body;
      
      const result = await videoRenderer.renderVideo(templateId, props, options);
      
      res.json({
        success: true,
        data: result,
        message: '视频渲染任务已提交'
      });
    } catch (error) {
      console.error('视频渲染失败:', error);
      res.status(500).json({
        success: false,
        message: '视频渲染失败',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/video/batch-render
 * 批量渲染视频
 */
router.post('/batch-render',
  validateRequired(['tasks']),
  validateTypes({ tasks: 'array' }),
  async (req, res) => {
    try {
      const { tasks } = req.body;
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'tasks必须是非空数组'
        });
      }
      
      const results = await videoRenderer.batchRender(tasks);
      
      res.json({
        success: true,
        data: results,
        message: `批量渲染完成，成功${results.filter(r => r.status === 'success').length}个，失败${results.filter(r => r.status === 'failed').length}个`
      });
    } catch (error) {
      console.error('批量渲染失败:', error);
      res.status(500).json({
        success: false,
        message: '批量渲染失败',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/video/render/:renderId
 * 获取渲染任务状态
 */
router.get('/render/:renderId', async (req, res) => {
  try {
    const { renderId } = req.params;
    
    const status = await videoRenderer.getRenderStatus(renderId);
    
    res.json({
      success: true,
      data: status,
      message: '渲染状态获取成功'
    });
  } catch (error) {
    console.error('获取渲染状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取渲染状态失败',
      error: error.message
    });
  }
});

/**
 * GET /api/video/list
 * 获取已渲染的视频列表
 */
router.get('/list', async (req, res) => {
  try {
    const videos = await videoRenderer.getRenderedList();
    
    res.json({
      success: true,
      data: videos,
      message: '视频列表获取成功'
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取视频列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/video/:filename
 * 下载已渲染的视频
 */
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const videoPath = path.join(process.cwd(), 'storage', 'videos', filename);
    
    // 检查文件是否存在
    try {
      await fs.access(videoPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: '视频文件不存在'
      });
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // 流式传输文件
    const fileStream = fs.createReadStream(videoPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('视频下载失败:', error);
    res.status(500).json({
      success: false,
      message: '视频下载失败',
      error: error.message
    });
  }
});

module.exports = router;