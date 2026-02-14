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
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
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
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
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
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
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
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
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
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
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
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
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

app.get('/api/publish/history', (req, res) => {
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

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

app.listen(PORT, async () => {
  console.log(`服务器启动成功，端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  await fetchAndCacheTopics(false);
});

module.exports = app;