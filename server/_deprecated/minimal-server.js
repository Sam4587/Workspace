const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 简单的热点数据（模拟）
const mockHotTopics = [
  {
    _id: '1',
    title: 'AI大模型技术突破：GPT-5即将发布',
    description: 'OpenAI宣布即将发布新一代大模型，性能提升显著',
    category: '科技',
    source: '知乎',
    heat: 95,
    suitability: 88,
    trend: 'rising',
    keywords: ['AI', 'GPT', '大模型', 'OpenAI'],
    sourceUrl: 'https://example.com/topic1',
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    title: '2026年春节档票房突破100亿',
    description: '多部国产大片齐上映，春节档票房创历史新高',
    category: '娱乐',
    source: '微博',
    heat: 92,
    suitability: 85,
    trend: 'hot',
    keywords: ['春节档', '票房', '电影', '国产片'],
    sourceUrl: 'https://example.com/topic2',
    createdAt: new Date().toISOString()
  }
];

// 热点API端点
app.get('/api/hot-topics', (req, res) => {
  res.json({
    success: true,
    data: mockHotTopics,
    pagination: {
      page: 1,
      limit: 20,
      total: mockHotTopics.length,
      pages: 1
    }
  });
});

// 内容管理相关API（基本端点）
app.use('/api/contents', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 1
    }
  });
});

// 内容生成相关API（基本端点）
app.post('/api/content/generate', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'content_' + Date.now(),
      title: '生成的文章标题',
      content: '这是生成的内容...',
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  });
});

// 工作流相关API（基本端点）
app.get('/api/contents/workflows', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'hot-topic-to-content',
        name: '热点驱动内容生成',
        description: '自动监控热点并生成相关内容'
      },
      {
        id: 'video-transcript-to-content', 
        name: '视频转录内容生成',
        description: '基于视频转录生成多平台内容'
      }
    ]
  });
});

app.post('/api/contents/workflows/execute', (req, res) => {
  res.json({
    id: 'wf-' + Date.now(),
    workflowId: req.body.workflowId || 'unknown',
    status: 'completed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    tasks: [],
    trigger: 'manual'
  });
});

// 默认路由
app.get('*', (req, res) => {
  res.json({
    message: 'TrendRadar API Server - 全链路AI内容创作系统',
    endpoints: {
      health: '/api/health',
      hotTopics: '/api/hot-topics',
      contents: '/api/contents',
      contentGenerate: '/api/content/generate',
      workflows: '/api/contents/workflows'
    }
  });
});

app.listen(PORT, () => {
  console.log(`服务器启动成功，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;