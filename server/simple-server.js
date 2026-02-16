const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

const { fetcherManager } = require('./fetchers');
const { topicAnalyzer } = require('./core');

let cachedTopics = [
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
  },
  {
    _id: '3',
    title: '央行宣布降准0.5个百分点',
    description: '释放长期资金约1万亿，支持实体经济发展',
    category: '财经',
    source: '今日头条',
    heat: 88,
    suitability: 82,
    trend: 'stable',
    keywords: ['央行', '降准', '货币政策', '经济'],
    sourceUrl: 'https://example.com/topic3',
    createdAt: new Date().toISOString()
  },
  {
    _id: '4',
    title: '中国队获得冬奥会首金',
    description: '冰雪健儿奋勇拼搏，为祖国赢得荣誉',
    category: '体育',
    source: '知乎',
    heat: 85,
    suitability: 90,
    trend: 'rising',
    keywords: ['冬奥会', '金牌', '体育', '中国队'],
    sourceUrl: 'https://example.com/topic4',
    createdAt: new Date().toISOString()
  },
  {
    _id: '5',
    title: '新能源汽车销量再创新高',
    description: '国内新能源车市持续火热，渗透率突破50%',
    category: '科技',
    source: '微博',
    heat: 82,
    suitability: 78,
    trend: 'hot',
    keywords: ['新能源', '汽车', '销量', '电动车'],
    sourceUrl: 'https://example.com/topic5',
    createdAt: new Date().toISOString()
  },
  {
    _id: '6',
    title: '一线城市房价环比上涨',
    description: '楼市回暖迹象明显，购房需求逐步释放',
    category: '社会',
    source: '今日头条',
    heat: 78,
    suitability: 75,
    trend: 'stable',
    keywords: ['房价', '楼市', '房产', '一线城市'],
    sourceUrl: 'https://example.com/topic6',
    createdAt: new Date().toISOString()
  }
];
let lastFetchTime = Date.now();
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchAndCacheTopics(clearCache = true) {
  try {
    console.log('开始获取实时热点数据...');
    
    fetcherManager.initializeDefaultSources();
    
    if (clearCache) {
      console.log('清除 Fetcher 缓存以获取最新数据...');
      fetcherManager.clearAllCache();
    }
    
    const topics = await fetcherManager.fetchAll();
    
    if (topics && topics.length > 0) {
      for (const topic of topics) {
        topic.category = topicAnalyzer.categorize(topic.title);
        topic.keywords = topicAnalyzer.extractKeywords(topic.title);
        topic.suitability = topicAnalyzer.calculateSuitability(topic.title, topic.description);
        topic._id = topic.id || Date.now() + Math.random().toString(36).substr(2, 9);
        topic.createdAt = new Date().toISOString();
      }
      
      cachedTopics = topics;
      lastFetchTime = Date.now();
      
      console.log(`获取到 ${topics.length} 条实时热点数据`);
      return cachedTopics;
    } else {
      console.log('没有获取到实时数据，使用默认数据');
      return cachedTopics;
    }
  } catch (error) {
    console.error('获取热点数据失败:', error);
    return cachedTopics;
  }
}

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
        t.description.toLowerCase().includes(searchLower)
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
    const topics = await fetchAndCacheTopics();
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
    { time: '00:00', value: 30 },
    { time: '04:00', value: 25 },
    { time: '08:00', value: 45 },
    { time: '12:00', value: 80 },
    { time: '16:00', value: 95 },
    { time: '20:00', value: 88 },
    { time: '24:00', value: 92 }
  ];
  res.json({
    success: true,
    data: mockTrend
  });
});

app.get('/api/hot-topics/trends/cross-platform/:title', (req, res) => {
  res.json({
    success: true,
    data: {
      weibo: { heat: 95, mentions: 15000 },
      zhihu: { heat: 88, mentions: 8000 },
      toutiao: { heat: 90, mentions: 12000 }
    }
  });
});

// ========== NewsNow 数据源 API ==========

// NewsNow 支持的数据源列表
const NEWSNOW_SOURCES = [
  { id: 'weibo', name: '微博热搜', enabled: true },
  { id: 'zhihu', name: '知乎热榜', enabled: true },
  { id: 'toutiao', name: '今日头条', enabled: true },
  { id: 'baidu', name: '百度热搜', enabled: true },
  { id: 'douyin', name: '抖音热点', enabled: true },
  { id: 'bilibili', name: 'B站热门', enabled: true }
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

    // 使用已缓存的热点数据
    let topics = cachedTopics;

    // 如果指定了数据源，过滤数据
    if (sources && Array.isArray(sources) && sources.length > 0) {
      const sourceNames = sources.map(s => {
        const source = NEWSNOW_SOURCES.find(ns => ns.id === s);
        return source ? source.name : s;
      });
      topics = cachedTopics.filter(t => sourceNames.includes(t.source));
    }

    // 限制返回数量
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

app.get('/api/hot-topics/newsnow/fetch/:sourceId', (req, res) => {
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

  // 过滤指定数据源的热点
  const topics = cachedTopics
    .filter(t => t.source === source.name)
    .slice(0, parseInt(maxItems));

  res.json({
    success: true,
    data: {
      source: sourceId,
      sourceName: source.name,
      count: topics.length,
      topics
    }
  });
});

// 数据源列表 API（另一种路径）
app.get('/api/hot-topics/sources', (req, res) => {
  res.json({
    success: true,
    data: NEWSNOW_SOURCES
  });
});

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
        text: '这是一个示例转录文本，展示了 AI 语音识别的能力。视频内容围绕热点话题展开讨论，提供了深入的见解和分析。',
        segments: [
          { index: 0, start: 0, end: 5, text: '这是一个示例转录文本', confidence: 0.95 },
          { index: 1, start: 5, end: 10, text: '展示了 AI 语音识别的能力', confidence: 0.92 }
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
        text: '这是一个示例转录文本，展示了 AI 语音识别的能力。视频内容围绕热点话题展开讨论，提供了深入的见解和分析。',
        segments: [],
        keywords: ['AI', '语音识别', '转录'],
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
          content: '姐妹们！这个视频绝了！内容太精彩了，一定要分享给大家...\n\n#热点 #爆款',
          tags: ['热点', '爆款', '必看']
        },
        douyin: {
          hook: '三秒内不划走，后面更精彩！',
          mainContent: '今天给大家分享一个超级热门的话题...',
          cta: '点赞关注，不错过更多精彩内容！'
        },
        toutiao: {
          title: '深度解析：热点话题背后的真相',
          content: '近日，一个热点话题引发广泛关注。本文将从多个角度进行分析...',
          microContent: '热点话题持续发酵，专家解读背后深意。',
          tags: ['热点', '社会', '深度解析']
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

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    data: {
      token: 'mock_token_' + Date.now(),
      user: { id: '1', username: 'admin' }
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      username: 'admin',
      role: 'admin'
    }
  });
});

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
    data: [
      { id: '1', title: 'AI技术突破：GPT-5即将发布', views: 12500, likes: 890, comments: 234 },
      { id: '2', title: '春节档票房破百亿', views: 9800, likes: 654, comments: 187 },
      { id: '3', title: '新能源汽车销量创新高', views: 7600, likes: 432, comments: 156 }
    ]
  });
});

app.get('/api/analytics/recommendation-insights', (req, res) => {
  res.json({
    success: true,
    data: {
      coldStartPerformance: 85,
      userEngagement: 72,
      contentQuality: 88,
      recommendationScore: 82,
      insights: [
        '内容质量评分较高，继续保持',
        '建议增加互动引导，提升用户参与度',
        '新内容冷启动表现良好'
      ]
    }
  });
});

app.get('/api/analytics/optimization-suggestions', (req, res) => {
  res.json({
    success: true,
    data: {
      titleOptimization: ['建议标题控制在20-30字', '加入数字增加点击率'],
      contentOptimization: ['增加分段，提升可读性', '适当添加图片或视频'],
      timingOptimization: ['建议在18:00-22:00发布', '周末发布效果更佳'],
      audienceOptimization: ['关注科技领域用户', '针对年轻群体优化内容']
    }
  });
});

// ========== 发布队列 API ==========

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

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

app.listen(PORT, async () => {

// 健康检查端点
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "服务运行正常",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
  console.log(`服务器启动成功，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  await fetchAndCacheTopics(false);
});

module.exports = app;