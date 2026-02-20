import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, TrendingUp, ExternalLink, Wand2, Brain, BarChart3, CheckSquare, Square, Calendar, Download, Bell, FileText, MoreHorizontal, Sparkles, Zap } from 'lucide-react';
import TopicCard from '../components/TopicCard';
import FilterPanel from '../components/FilterPanel';
import TrendTimeline from '../components/TrendTimeline';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import CrossPlatformAnalysis from '../components/CrossPlatformAnalysis';
import HotTopicVisualization from '../components/HotTopicVisualization';
import HotTopicToContent from '../components/HotTopicToContent';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const CATEGORY_TRANSLATIONS = {
  'other': '其他',
  'entertainment': '娱乐',
  'tech': '科技',
  'finance': '财经',
  'sports': '体育',
  'social': '社会',
  'international': '国际'
};

const SOURCE_TRANSLATIONS = {
  'weibo': '微博热搜',
  'weixin': '微信',
  'zhihu': '知乎',
  'douyin': '抖音',
  'bilibili': '哔哩哔哩',
  'toutiao': '今日头条',
  'xiaohongshu': '小红书',
  'baidu': '百度热搜',
  'tieba': '贴吧热议',
  'thepaper': '澎湃新闻',
  'ifeng': '凤凰网',
  'wallstreetcn-hot': '华尔街见闻',
  'cls-hot': '财联社热门',
  'bilibili-hot-search': 'B站热搜',
  'unknown': '未知'
};

const translateCategory = (category) => {
  return CATEGORY_TRANSLATIONS[category] || category;
};

const translateSource = (source) => {
  return SOURCE_TRANSLATIONS[source] || source;
};

const translateCategoryToEnglish = (chineseCategory) => {
  const reverseMap = Object.fromEntries(
    Object.entries(CATEGORY_TRANSLATIONS).map(([k, v]) => [v, k])
  );
  return reverseMap[chineseCategory] || chineseCategory;
};

const HotTopics = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    heatRange: [0, 100],
    suitabilityRange: [0, 100],
    timeRange: '24h',
    sources: [],
    trends: []
  });

  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState(false);
  const [viewingTopicContents, setViewingTopicContents] = useState(null);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [openTopicMenu, setOpenTopicMenu] = useState(null);
  const [showSmartCreate, setShowSmartCreate] = useState(false);
  const [smartCreateTopic, setSmartCreateTopic] = useState(null);
  
  const reportMenuRef = useRef(null);
  const topicMenuRefs = useRef({});

  const { data: topics, isLoading, refetch } = useQuery({
    queryKey: ['hot-topics', searchTerm, selectedCategory, filters],
    queryFn: async () => {
      try {
        const params = {
          search: searchTerm,
          category: selectedCategory,
          minHeat: filters.heatRange[0],
          maxHeat: filters.heatRange[1],
          page: 1,
          limit: 200,
          sortBy: 'heat',
          sortOrder: 'desc'
        };

        const response = await api.getHotTopics(params);
        return response.data || [];
      } catch (error) {
        showError('获取热点话题失败');
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });

  const { data: newTopics } = useQuery({
    queryKey: ['new-topics', 24],
    queryFn: async () => {
      const response = await api.getNewTopics(24);
      return response.data || [];
    },
    refetchInterval: 300000,
    retry: 1
  });

  const { data: topicContents } = useQuery({
    queryKey: ['topic-contents', viewingTopicContents?._id],
    queryFn: async () => {
      if (!viewingTopicContents) return [];
      const response = await api.getHotTopicContents(viewingTopicContents._id);
      return response.data || [];
    },
    enabled: !!viewingTopicContents
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.updateHotTopics(),
    onSuccess: () => {
      showSuccess('热点数据刷新成功');
      refetch();
    },
    onError: (error) => {
      showError('刷新热点数据失败: ' + (error.message || '请检查网络连接'));
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ type, format }) => {
      const response = await fetch(`/api/hot-topics/reports/${type}?format=${format}`);
      if (!response.ok) throw new Error('生成报告失败');
      return response.blob();
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `热点${variables.type === 'daily' ? '日报' : variables.type === 'weekly' ? '周报' : '月报'}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess(`${variables.type === 'daily' ? '日报' : variables.type === 'weekly' ? '周报' : '月报'}生成成功`);
    },
    onError: (error) => {
      showError('生成报告失败: ' + error.message);
    }
  });

  const categories = [
    { value: 'all', label: '全部分类' },
    { value: 'entertainment', label: '娱乐' },
    { value: 'tech', label: '科技' },
    { value: 'finance', label: '财经' },
    { value: 'sports', label: '体育' },
    { value: 'social', label: '社会' },
    { value: 'international', label: '国际' },
    { value: 'other', label: '其他' }
  ];

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleGenerateContent = (topic) => {
    navigate('/content-creation', {
      state: {
        selectedTopic: topic
      }
    });
  };

  const handleSelectTopic = (topicId) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTopicIds.length === topics?.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(topics?.map(t => t._id) || []);
    }
  };

  const handleShowTrendTimeline = (topic) => {
    setSelectedTopic(topic);
    setActivePanel('timeline');
  };

  const handleShowCrossPlatform = (topic) => {
    setSelectedTopic(topic);
    setActivePanel('crossPlatform');
  };

  const handleViewTopicContents = (topic) => {
    setViewingTopicContents(topic);
  };

  const handleShowAIAnalysis = () => {
    const selectedTopicsList = topics?.filter(t => selectedTopicIds.includes(t._id)) || [];
    setActivePanel({ type: 'ai', topics: selectedTopicsList });
  };

  const handleSmartCreate = (topic) => {
    setSmartCreateTopic(topic);
    setShowSmartCreate(true);
  };

  const handleGenerateFromAnalysis = (data) => {
    navigate('/content-creation', {
      state: {
        selectedTopic: {
          _id: data.hotTopicId,
          title: data.topic,
          keywords: data.keywords
        },
        generatedTitle: data.title,
        analysis: data.analysis
      }
    });
    setShowSmartCreate(false);
    setSmartCreateTopic(null);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
    setSelectedTopic(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target)) {
        setShowReportMenu(false);
      }
      if (openTopicMenu !== null) {
        const menuRef = topicMenuRefs.current[openTopicMenu];
        if (menuRef && !menuRef.contains(event.target)) {
          setOpenTopicMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openTopicMenu]);

  const filteredTopics = topics?.filter(topic => {
    if (!topics || topics.length === 0) return false;

    const matchesSearch = !searchTerm ||
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.keywords?.some(keyword =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // 定义主要分类
    const mainCategories = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international'];
    
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'other' && !mainCategories.includes(topic.category)) ||
      topic.category === selectedCategory;

    const matchesHeatRange = topic.heat >= filters.heatRange[0] && topic.heat <= filters.heatRange[1];

    const matchesSuitabilityRange = topic.suitability >= filters.suitabilityRange[0] &&
                                   topic.suitability <= filters.suitabilityRange[1];

    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const matchesTimeRange = !filters.timeRange ||
      (topic.publishedAt &&
       new Date(topic.publishedAt) >= new Date(now - timeRangeMs[filters.timeRange]));

    const matchesSources = filters.sources.length === 0 ||
      filters.sources.includes(topic.source);

    const matchesTrends = filters.trends.length === 0 ||
      filters.trends.includes(topic.trend);

    return matchesSearch && matchesCategory && matchesHeatRange &&
           matchesSuitabilityRange && matchesTimeRange &&
           matchesSources && matchesTrends;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">热点监控</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVisualizationMode(!visualizationMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              visualizationMode 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>{visualizationMode ? '列表模式' : '可视化模式'}</span>
          </button>
          
          <div className="relative" ref={reportMenuRef}>
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>生成报告</span>
            </button>
            {showReportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    generateReportMutation.mutate({ type: 'daily', format: 'html' });
                    setShowReportMenu(false);
                  }}
                  disabled={generateReportMutation.isLoading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  📄 日报 (HTML)
                </button>
                <button
                  onClick={() => {
                    generateReportMutation.mutate({ type: 'weekly', format: 'html' });
                    setShowReportMenu(false);
                  }}
                  disabled={generateReportMutation.isLoading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  📊 周报 (HTML)
                </button>
                <button
                  onClick={() => {
                    generateReportMutation.mutate({ type: 'monthly', format: 'html' });
                    setShowReportMenu(false);
                  }}
                  disabled={generateReportMutation.isLoading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  📈 月报 (HTML)
                </button>
              </div>
            )}
          </div>

          {selectedTopicIds.length > 0 && (
            <button
              onClick={handleShowAIAnalysis}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Brain className="h-4 w-4" />
              <span>AI 分析 ({selectedTopicIds.length})</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshMutation.isLoading ? 'animate-spin' : ''}`} />
            <span>{refreshMutation.isLoading ? '刷新中...' : '刷新数据'}</span>
          </button>
        </div>
      </div>

      {visualizationMode ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">数据可视化分析</h2>
            <p className="text-gray-600">通过图表直观展示热点数据的趋势和分布</p>
          </div>
          <HotTopicVisualization 
            topics={filteredTopics} 
            loading={isLoading} 
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 筛选和搜索 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜索热点话题..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>筛选</span>
                </button>
              </div>
            </div>

            {/* 热门分类快捷按钮 */}
            <div className="flex flex-wrap gap-1.5">
              <button
                key="all"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {categories.filter(c => c.value !== 'all').map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onApply={() => {}}
                  onReset={() => setFilters({
                    heatRange: [0, 100],
                    suitabilityRange: [0, 100],
                    timeRange: '24h',
                    sources: [],
                    trends: []
                  })}
                />
              </div>
            )}
          </div>

          {/* 热点话题列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {selectedCategory === 'all' ? '热点话题' : `${categories.find(c => c.value === selectedCategory)?.label}话题`} ({filteredTopics.length})
              </h2>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">
                  {selectedTopicIds.length > 0 && `${selectedTopicIds.length} 项已选`}
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {selectedTopicIds.length === filteredTopics.length ? '取消全选' : '全选'}
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">加载中...</p>
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="p-6 text-center">
                  <TrendingUp className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无热点话题</h3>
                  <p className="mt-1 text-xs text-gray-500">尝试调整筛选条件或刷新数据</p>
                </div>
              ) : (
                filteredTopics.map((topic) => (
                  <div key={topic._id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => handleSelectTopic(topic._id)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {selectedTopicIds.includes(topic._id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 truncate">{topic.title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span>{translateSource(topic.source)}</span>
                              <span className="flex items-center">
                                <TrendingUp className="h-3 w-3 mr-0.5 text-orange-500" />
                                {topic.heat}
                              </span>
                              <span>{translateCategory(topic.category)}</span>
                              <span>{new Date(topic.publishedAt).toLocaleDateString()}</span>
                            </div>
                            {topic.keywords && topic.keywords.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {topic.keywords.slice(0, 3).map((keyword, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                        <button
                          onClick={() => handleSmartCreate(topic)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-colors"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>智能创作</span>
                        </button>
                        <button
                          onClick={() => handleGenerateContent(topic)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          <span>生成内容</span>
                        </button>
                        <div className="relative" ref={(el) => (topicMenuRefs.current[topic._id] = el)}>
                          <button
                            onClick={() => setOpenTopicMenu(openTopicMenu === topic._id ? null : topic._id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openTopicMenu === topic._id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg py-1 z-10">
                              <button
                                onClick={() => {
                                  handleViewTopicContents(topic);
                                  setOpenTopicMenu(null);
                                }}
                                className="flex items-center space-x-1.5 w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>查看内容</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleShowTrendTimeline(topic);
                                  setOpenTopicMenu(null);
                                }}
                                className="flex items-center space-x-1.5 w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>查看趋势</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleShowCrossPlatform(topic);
                                  setOpenTopicMenu(null);
                                }}
                                className="flex items-center space-x-1.5 w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>跨平台分析</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI分析面板 */}
      {activePanel && activePanel.type === 'ai' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">AI热点分析</h2>
              <button
                onClick={handleClosePanel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <AIAnalysisPanel 
                topics={activePanel.topics} 
                onClose={handleClosePanel}
              />
            </div>
          </div>
        </div>
      )}

      {/* 趋势时间轴面板 */}
      {activePanel === 'timeline' && selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">趋势时间轴</h2>
              <button
                onClick={handleClosePanel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <TrendTimeline topic={selectedTopic} />
            </div>
          </div>
        </div>
      )}

      {/* 跨平台分析面板 */}
      {activePanel === 'crossPlatform' && selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">跨平台分析</h2>
              <button
                onClick={handleClosePanel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <CrossPlatformAnalysis topic={selectedTopic} />
            </div>
          </div>
        </div>
      )}

      {/* 关联内容面板 */}
      {viewingTopicContents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">关联内容</h2>
                <p className="text-sm text-gray-500 mt-1">{viewingTopicContents.title}</p>
              </div>
              <button
                onClick={() => setViewingTopicContents(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {!topicContents || topicContents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">暂无关联内容</h3>
                  <p className="text-gray-500 mt-2">点击"生成内容"按钮来创建关联内容</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topicContents.map((content) => (
                    <div key={content._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{content.title}</h4>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {content.type}
                            </span>
                            <span>{content.wordCount} 字</span>
                            <span>质量: {content.metadata?.qualityScore?.score || 0}/100</span>
                            <span>{new Date(content.createdAt).toLocaleString()}</span>
                          </div>
                          {content.excerpt && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{content.excerpt}</p>
                          )}
                        </div>
                        <button
                          onClick={() => navigate('/content-creation', { state: { contentId: content._id } })}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 智能创作弹窗 */}
      {showSmartCreate && smartCreateTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  智能创作
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  从热点分析到内容创作的完整流程
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSmartCreate(false);
                  setSmartCreateTopic(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <HotTopicToContent
                topic={smartCreateTopic}
                onGenerateContent={handleGenerateFromAnalysis}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotTopics;
