const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
const configLoader = require('./utils/configLoader');
const enhancedLogger = require('./utils/enhancedLogger');
const rateLimiter = require('./utils/rateLimiter');
const { loggingMiddleware, errorLoggingMiddleware, auditLoggingMiddleware } = require('./middleware/loggingMiddleware');
const { validateRequired, validateTypes, validateEmail } = require('./middleware/validation');
const healthRoutes = require('./routes/health');
const { metricsCollector } = require('./middleware/metricsMiddleware');
const alertService = require('./services/alertService');

// 加载环境配置
configLoader.load();

const app = express();
const PORT = configLoader.getNumber('PORT', 5001);

// Rate Limiter 配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: 1000, // 临时提高限制每个IP 15分钟内最多1000个请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
    retryAfter: 900 // 15分钟
  },
  standardHeaders: true, // 返回标准的RateLimit-*头
  legacyHeaders: false, // 禁用X-RateLimit-*头
});

// 应用全局速率限制（临时禁用用于测试）
// app.use(limiter);

// 应用自定义API速率限制中间件（临时禁用用于测试）
// app.use('/api/', rateLimiter.apiLimit);

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

// 日志中间件
app.use(loggingMiddleware);
app.use(auditLoggingMiddleware);

// 性能指标收集中间件
app.use(metricsCollector.collectRequestMetrics);

// 健康检查和监控路由
app.use('/api/monitoring', healthRoutes);

// 速率限制状态查询API
app.get('/api/rate-limit/status', async (req, res) => {
  try {
    const ip = req.ip || 'unknown';
    const status = await rateLimiter.getLimitStatus(ip);
    
    res.json({
      success: true,
      data: {
        ip: ip,
        ...status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取速率限制状态失败'
    });
  }
});

// =====================================================
// 使用 NewsNowFetcher 获取真实热点数据
// =====================================================
const { newsNowFetcher, NewsNowFetcher } = require('./fetchers/NewsNowFetcher');

let cachedTopics = [];
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟缓存（平衡实时性与安全性）

/**
 * 格式化时间为相对时间
 */
function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return past.toLocaleDateString('zh-CN');
}

/**
 * 从 NewsNow API 获取真实热点数据
 */
async function fetchAndCacheTopics(clearCache = true) {
  try {
    console.log('开始从 NewsNow API 获取实时热点数据...');
    
    // 检查缓存是否有效
    if (!clearCache && cachedTopics.length > 0 && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      console.log(`使用缓存数据，共 ${cachedTopics.length} 条`);
      return cachedTopics;
    }
    
    // 使用 NewsNowFetcher 获取真实数据
    const topics = await newsNowFetcher.fetch();
    
    if (topics && topics.length > 0) {
      // 为每个话题添加必要的字段
      for (const topic of topics) {
        topic._id = topic._id || `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        topic.createdAt = topic.createdAt || new Date().toISOString();
        topic.time = formatTimeAgo(topic.publishedAt || new Date());
      }
      
      cachedTopics = topics;
      lastFetchTime = Date.now();
      
      console.log(`成功获取 ${topics.length} 条实时热点数据`);
      return cachedTopics;
    } else {
      console.log('NewsNow API 未返回数据');
      return cachedTopics.length > 0 ? cachedTopics : [];
    }
  } catch (error) {
    console.error('获取热点数据失败:', error.message);
    // 如果有缓存数据，返回缓存
    if (cachedTopics.length > 0) {
      console.log('使用缓存数据作为备用');
      return cachedTopics;
    }
    return [];
  }
}

// =====================================================
// API 路由
// =====================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    cachedTopics: cachedTopics.length,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime).toISOString() : null
  });
});

app.get('/api/hot-topics', async (req, res) => {
  try {
    const { page = 1, limit = 20, category = 'all', search = '', sortBy = 'heat', sortOrder = 'desc' } = req.query;
    
    let topics = cachedTopics;
    
    if (!topics.length || (Date.now() - lastFetchTime > CACHE_DURATION)) {
      topics = await fetchAndCacheTopics();
    }
    
    let filteredTopics = [...topics];
    
    if (category !== 'all') {
      filteredTopics = filteredTopics.filter(t => t.category === category);
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredTopics = filteredTopics.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }
    
    filteredTopics.sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    const total = filteredTopics.length;
    const startIndex = (page - 1) * limit;
    const paginatedTopics = filteredTopics.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedTopics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取热点话题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点话题失败'
    });
  }
});

app.get('/api/hot-topics/:id', (req, res) => {
  const topic = cachedTopics.find(t => t._id === req.params.id);
  if (!topic) {
    return res.status(404).json({
      success: false,
      message: '热点话题不存在'
    });
  }
  res.json({
    success: true,
    data: topic
  });
});

app.post('/api/hot-topics/update', async (req, res) => {
  try {
    const topics = await fetchAndCacheTopics(true);
    res.json({
      success: true,
      message: '热点数据更新成功',
      data: {
        count: topics.length,
        topics: topics.slice(0, 20)
      }
    });
  } catch (error) {
    console.error('更新热点数据失败:', error);
    res.status(500).json({
      success: false,
      message: '更新热点数据失败'
    });
  }
});

app.get('/api/hot-topics/trends/new', (req, res) => {
  res.json({
    success: true,
    data: cachedTopics.slice(0, 5)
  });
});

app.get('/api/hot-topics/trends/timeline/:id', (req, res) => {
  const mockTrend = [
    { timestamp: Date.now() - 6 * 3600000, heat: 30, rank: 50, trend: 'stable' },
    { timestamp: Date.now() - 4 * 3600000, heat: 45, rank: 35, trend: 'up' },
    { timestamp: Date.now() - 2 * 3600000, heat: 80, rank: 15, trend: 'up' },
    { timestamp: Date.now(), heat: 95, rank: 5, trend: 'hot' }
  ];
  res.json({
    success: true,
    data: {
      timeline: mockTrend,
      currentHeat: 95,
      heatChange: 65,
      trendCount: 4,
      hotCount: 1
    }
  });
});

app.get('/api/hot-topics/trends/cross-platform/:title', (req, res) => {
  res.json({
    success: true,
    data: {
      '微博热搜': { count: 1, avgHeat: 95, maxHeat: 95 },
      '今日头条': { count: 1, avgHeat: 88, maxHeat: 88 },
      '百度热搜': { count: 1, avgHeat: 90, maxHeat: 90 }
    }
  });
});

// ========== NewsNow 数据源 API ==========

const NEWSNOW_SOURCES = [
  { id: 'weibo', name: '微博热搜', enabled: true },
  { id: 'zhihu', name: '知乎热榜', enabled: true },
  { id: 'toutiao', name: '今日头条', enabled: true },
  { id: 'baidu', name: '百度热搜', enabled: true },
  { id: 'douyin', name: '抖音热点', enabled: true },
  { id: 'bilibili-hot-search', name: 'B站热门', enabled: true },
  { id: 'thepaper', name: '澎湃新闻', enabled: true },
  { id: 'wallstreetcn-hot', name: '华尔街见闻', enabled: true }
];

app.get('/api/hot-topics/newsnow/sources', (req, res) => {
  res.json({
    success: true,
    data: NEWSNOW_SOURCES
  });
});

app.post('/api/hot-topics/newsnow/fetch', async (req, res) => {
  try {
    const { sources, maxItems = 20 } = req.body;

    let topics = cachedTopics;

    if (sources && Array.isArray(sources) && sources.length > 0) {
      const sourceNames = sources.map(s => {
        const source = NEWSNOW_SOURCES.find(ns => ns.id === s);
        return source ? source.name : s;
      });
      topics = cachedTopics.filter(t => sourceNames.includes(t.source));
    }

    topics = topics.slice(0, maxItems);

    res.json({
      success: true,
      data: {
        fetched: topics.length,
        saved: topics.length,
        topics
      }
    });
  } catch (error) {
    console.error('获取 NewsNow 数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取 NewsNow 数据失败'
    });
  }
});

app.get('/api/hot-topics/newsnow/fetch/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { maxItems = 20 } = req.query;

    const source = NEWSNOW_SOURCES.find(s => s.id === sourceId);
    if (!source) {
      return res.status(400).json({
        success: false,
        message: `不支持的数据源: ${sourceId}`,
        availableSources: NEWSNOW_SOURCES.map(s => s.id)
      });
    }

    // 使用 NewsNowFetcher 获取指定数据源
    const fetcher = new NewsNowFetcher({ sourceId, maxItems: parseInt(maxItems) });
    const topics = await fetcher.fetchSource(sourceId);

    res.json({
      success: true,
      data: {
        source: sourceId,
        sourceName: source.name,
        count: topics.length,
        topics
      }
    });
  } catch (error) {
    console.error('获取数据源热点失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据源热点失败'
    });
  }
});

app.get('/api/hot-topics/sources', (req, res) => {
  res.json({
    success: true,
    data: NEWSNOW_SOURCES
  });
});

// ========== 内容相关 API ==========

app.get('/api/content', (req, res) => {
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

app.get('/api/analytics/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalViews: 12500,
      totalLikes: 890,
      totalComments: 234,
      totalShares: 156,
      avgEngagement: 72,
      growthRate: 15,
      todayTopics: cachedTopics.length,
      generatedContent: 12,
      publishedContent: 8,
      successRate: 85
    }
  });
});

app.get('/api/video/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: '文章视频',
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
        category: 'article',
        defaultProps: {
          title: '默认标题',
          subtitle: '默认副标题',
          content: '这是默认内容...'
        }
      },
      {
        id: '2',
        name: '短视频',
        thumbnail: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400',
        category: 'micro',
        defaultProps: {
          title: '爆款短视频',
          subtitle: '快速吸引眼球',
          content: '精彩内容不容错过...'
        }
      }
    ]
  });
});

app.post('/api/video/render', (req, res) => {
  res.json({
    success: true,
    data: {
      taskId: 'mock-task-' + Date.now(),
      status: 'pending'
    }
  });
});

app.get('/api/video/render/:taskId', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'completed',
      progress: 100,
      videoUrl: 'https://example.com/mock-video.mp4'
    }
  });
});

// ========== 视频下载相关 API ==========

app.post('/api/video/download', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'url 参数是必需的'
    });
  }
  res.json({
    success: true,
    data: {
      videoId: 'vid_' + Date.now(),
      status: 'downloading'
    }
  });
});

app.get('/api/video/download/:id/status', (req, res) => {
  res.json({
    success: true,
    data: {
      videoId: req.params.id,
      platform: 'douyin',
      title: '示例视频标题',
      author: '创作者',
      duration: 60,
      status: 'downloaded',
      fileSize: 10240000,
      createdAt: new Date().toISOString()
    }
  });
});

app.get('/api/video/download/list', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 0,
      data: []
    }
  });
});

app.get('/api/video/platforms/list', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'douyin', name: '抖音', enabled: true },
      { id: 'kuaishou', name: '快手', enabled: true },
      { id: 'generic', name: '其他平台', enabled: true }
    ]
  });
});

app.post('/api/video/metadata', (req, res) => {
  const { url } = req.body;
  res.json({
    success: true,
    data: {
      platform: 'douyin',
      videoId: 'mock_video_id',
      url
    }
  });
});

// ========== 转录相关 API ==========

app.post('/api/transcription/submit', (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({
      success: false,
      message: 'videoId 参数是必需的'
    });
  }
  res.json({
    success: true,
    data: {
      taskId: 'transcribe_' + Date.now(),
      videoId,
      status: 'pending'
    }
  });
});

app.get('/api/transcription/:taskId', (req, res) => {
  res.json({
    success: true,
    data: {
      taskId: req.params.taskId,
      status: 'completed',
      progress: 100,
      result: {
        success: true,
        engine: 'whisper-local',
        duration: 60,
        language: 'zh-CN',
        text: '这是一个示例转录文本，展示了 AI 语音识别的能力。',
        segments: [
          { index: 0, start: 0, end: 5, text: '这是一个示例转录文本', confidence: 0.95 }
        ],
        keywords: ['AI', '语音识别', '转录'],
        metadata: { processingTime: 15000 }
      }
    }
  });
});

app.get('/api/transcription/video/:videoId', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'completed',
      transcription: {
        success: true,
        engine: 'whisper-local',
        duration: 60,
        language: 'zh-CN',
        text: '这是一个示例转录文本',
        segments: [],
        keywords: ['AI', '语音识别'],
        metadata: { processingTime: 15000 }
      }
    }
  });
});

app.get('/api/transcription/engines/list', (req, res) => {
  res.json({
    success: true,
    data: [
      { name: 'whisper-local', enabled: true },
      { name: 'aliyun-asr', enabled: true }
    ]
  });
});

// ========== 内容改写相关 API ==========

app.post('/api/content/video-rewrite', (req, res) => {
  res.json({
    success: true,
    data: {
      summary: '这是一个关于热点话题的视频内容摘要',
      keyPoints: ['要点一', '要点二', '要点三'],
      results: {
        xiaohongshu: {
          title: '爆款标题！一定要看',
          content: '姐妹们！这个视频绝了！...',
          tags: ['热点', '爆款']
        },
        douyin: {
          hook: '三秒内不划走！',
          mainContent: '今天给大家分享...',
          cta: '点赞关注！'
        },
        toutiao: {
          title: '深度解析：热点话题',
          content: '近日，一个热点话题引发关注...',
          microContent: '热点话题持续发酵。',
          tags: ['热点', '社会']
        }
      }
    }
  });
});

app.post('/api/content/analyze', (req, res) => {
  res.json({
    success: true,
    summary: '内容摘要',
    keyPoints: ['要点1', '要点2'],
    keywords: ['关键词1', '关键词2'],
    category: '科技',
    sentiment: 'positive'
  });
});

app.get('/api/content/platforms', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'xiaohongshu', name: '小红书', maxTitle: 20, maxContent: 1000 },
      { id: 'douyin', name: '抖音', maxTitle: 30, maxContent: 2000 },
      { id: 'toutiao', name: '今日头条', maxTitle: 30, maxContent: 2000 }
    ]
  });
});

app.post('/api/content/publish', (req, res) => {
  res.json({
    success: true,
    message: '发布任务已提交',
    data: {
      publishId: 'pub_' + Date.now()
    }
  });
});

app.get('/api/content/publish/status', (req, res) => {
  res.json({
    success: true,
    data: {
      xiaohongshu: true,
      douyin: false,
      toutiao: true
    }
  });
});

// ========== 认证相关 API ==========

// 注册认证路由
app.use('/api/auth', require('./routes/auth'));

// ========== 数据分析相关 API ==========

app.get('/api/analytics/views-trend', (req, res) => {
  const { days = 7 } = req.query;
  const data = [];
  for (let i = 0; i < parseInt(days); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 5000) + 1000,
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 100) + 20
    });
  }
  res.json({ success: true, data: data.reverse() });
});

app.get('/api/analytics/content-types', (req, res) => {
  res.json({
    success: true,
    data: [
      { type: '文章', count: 45, percentage: 45 },
      { type: '微头条', count: 30, percentage: 30 },
      { type: '视频', count: 15, percentage: 15 },
      { type: '音频', count: 10, percentage: 10 }
    ]
  });
});

app.get('/api/analytics/top-content', (req, res) => {
  res.json({
    success: true,
    data: cachedTopics.slice(0, 5).map((t, i) => ({
      id: t._id,
      title: t.title,
      views: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 100) + 20
    }))
  });
});

// ========== 内容生成相关 API ==========

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

// 注册内容管理路由
app.use('/api/contents', require('./routes/contents'));

// 注册视频管理路由
app.use('/api/video', require('./routes/video'));

// 注册视频下载路由
app.use('/api/video-download', require('./routes/videoDownload'));

// 注册转录路由
app.use('/api/transcription', require('./routes/transcription'));

// 注册任务队列管理路由
app.use('/api/task-queue', require('./routes/taskQueue'));

// 兼容旧的内容API路由
app.get('/api/content/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      title: '示例内容',
      content: '这是内容详情...',
      type: 'article',
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  });
});

app.put('/api/content/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    }
  });
});

app.delete('/api/content/:id', (req, res) => {
  res.json({
    success: true,
    message: '内容已删除'
  });
});

// 全局错误处理中间件
app.use(errorLoggingMiddleware);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 启动服务器
app.listen(PORT, async () => {
  enhancedLogger.info('服务器启动成功', { 
    port: PORT, 
    environment: configLoader.getEnvironment(),
    pid: process.pid
  });
  enhancedLogger.info('健康检查端点', { url: `http://localhost:${PORT}/api/health` });
  enhancedLogger.info('监控面板端点', { url: `http://localhost:${PORT}/api/monitoring` });
  
  // 启动定期监控检查
  startMonitoringChecks();
  
  // 启动时获取热点数据
  await fetchAndCacheTopics(false);
  
  // 启动定时清理过期令牌任务（每小时执行一次）
  const tokenService = require('./services/TokenService');
  setInterval(() => {
    tokenService.cleanupExpiredTokens();
  }, 60 * 60 * 1000); // 每小时
  
  console.log('✅ JWT刷新令牌机制已启用');
  
  // 启动定时自动更新热点数据任务（每15分钟执行一次，降低频率确保安全）
  setInterval(async () => {
    try {
      const topics = await fetchAndCacheTopics();
      console.log(`[自动更新] 热点数据更新完成，获取 ${topics.length} 条数据`);
    } catch (error) {
      console.error('[自动更新] 热点数据更新失败:', error.message);
    }
  }, 15 * 60 * 1000); // 每15分钟（更安全的频率）
  
  console.log('✅ 自动热点数据更新机制已启用');
});

// 定期监控检查函数
async function startMonitoringChecks() {
  // 每分钟检查一次性能指标
  setInterval(async () => {
    try {
      const metrics = metricsCollector.getOverallMetrics();
      const systemMetrics = metricsCollector.getSystemLoadMetrics();
      
      // 检查是否需要触发告警
      await alertService.checkMetrics(metrics, systemMetrics);
      
      // 记录性能日志
      if (parseFloat(metrics.avgResponseTime) > 1000) {
        enhancedLogger.perf('Performance Warning', parseFloat(metrics.avgResponseTime), {
          requestCount: metrics.requestCount,
          errorRate: metrics.errorRate
        });
      }
    } catch (error) {
      enhancedLogger.error('监控检查失败', { error: error.message });
    }
  }, 60000); // 每分钟检查一次
  
  enhancedLogger.info('监控检查服务已启动', { interval: '60s' });
}

module.exports = app;
