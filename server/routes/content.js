const express = require('express');
const Content = require('../models/Content');
const aiService = require('../services/aiService');

const router = express.Router();

// 生成内容
router.post('/generate', async (req, res) => {
  try {
    const { formData, type } = req.body;
    
    if (!formData || !type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 调用AI服务生成内容
    const generatedContent = await aiService.generateContent(formData, type);
    
    // 保存到数据库
    const content = new Content({
      ...generatedContent,
      hotTopicId: formData.hotTopicId,
      metadata: {
        targetAudience: formData.targetAudience,
        tone: formData.tone,
        length: formData.length,
        includeData: formData.includeData,
        includeCase: formData.includeCase,
        includeExpert: formData.includeExpert
      }
    });

    await content.save();

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('生成内容失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成内容失败'
    });
  }
});

// 获取内容列表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = 'all',
      status = 'all',
      search = ''
    } = req.query;

    const filter = {};
    
    if (type !== 'all') {
      filter.type = type;
    }
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const contents = await Content.find(filter)
      .populate('hotTopicId', 'title category heat')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Content.countDocuments(filter);

    res.json({
      success: true,
      data: contents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取内容列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取内容列表失败'
    });
  }
});

// 获取单个内容详情
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('hotTopicId', 'title category heat');
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('获取内容详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取内容详情失败'
    });
  }
});

// 更新内容
router.put('/:id', async (req, res) => {
  try {
    const { title, content, status } = req.body;
    
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    res.json({
      success: true,
      data: updatedContent
    });
  } catch (error) {
    console.error('更新内容失败:', error);
    res.status(500).json({
      success: false,
      message: '更新内容失败'
    });
  }
});

// 删除内容
router.delete('/:id', async (req, res) => {
  try {
    const deletedContent = await Content.findByIdAndDelete(req.params.id);
    
    if (!deletedContent) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    res.json({
      success: true,
      message: '内容删除成功'
    });
  } catch (error) {
    console.error('删除内容失败:', error);
    res.status(500).json({
      success: false,
      message: '删除内容失败'
    });
  }
});

// 更新内容状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'review', 'approved', 'rejected', 'published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }

    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    res.json({
      success: true,
      data: updatedContent
    });
  } catch (error) {
    console.error('更新内容状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新内容状态失败'
    });
  }
});

module.exports = router;
