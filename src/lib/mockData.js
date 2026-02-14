export const mockHotTopics = [
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
    sourceUrl: 'https://example.com/topic1'
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
    sourceUrl: 'https://example.com/topic2'
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
    sourceUrl: 'https://example.com/topic3'
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
    sourceUrl: 'https://example.com/topic4'
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
    sourceUrl: 'https://example.com/topic5'
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
    sourceUrl: 'https://example.com/topic6'
  }
];

export const mockVideoTemplates = [
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
  },
  {
    id: '3',
    name: '知识科普',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    category: 'article',
    defaultProps: {
      title: '科普小知识',
      subtitle: '每天学习一点',
      content: '让我们一起来了解...'
    }
  }
];

export const mockTrendData = [
  { time: '00:00', value: 30 },
  { time: '04:00', value: 25 },
  { time: '08:00', value: 45 },
  { time: '12:00', value: 80 },
  { time: '16:00', value: 95 },
  { time: '20:00', value: 88 },
  { time: '24:00', value: 92 }
];

export const mockCrossPlatformData = {
  weibo: { heat: 95, mentions: 15000 },
  zhihu: { heat: 88, mentions: 8000 },
  toutiao: { heat: 90, mentions: 12000 }
};