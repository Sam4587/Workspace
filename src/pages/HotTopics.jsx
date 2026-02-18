import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, TrendingUp, ExternalLink, Wand2, Brain, BarChart3, CheckSquare, Square, Calendar, Download, Bell } from 'lucide-react';
import TopicCard from '../components/TopicCard';
import FilterPanel from '../components/FilterPanel';
import TrendTimeline from '../components/TrendTimeline';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import CrossPlatformAnalysis from '../components/CrossPlatformAnalysis';
import HotTopicVisualization from '../components/HotTopicVisualization';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

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
          limit: 50,
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

  const refreshMutation = useMutation({
    mutationFn: api.updateHotTopics,
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
    { value: '娱乐', label: '娱乐' },
    { value: '科技', label: '科技' },
    { value: '财经', label: '财经' },
    { value: '体育', label: '体育' },
    { value: '社会', label: '社会' },
    { value: '国际', label: '国际' }
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

  const handleShowAIAnalysis = () => {
    const selectedTopicsList = topics?.filter(t => selectedTopicIds.includes(t._id)) || [];
    setActivePanel({ type: 'ai', topics: selectedTopicsList });
  };

  const handleClosePanel = () => {
    setActivePanel(null);
    setSelectedTopic(null);
  };

  const filteredTopics = topics?.filter(topic => {
    if (!topics || topics.length === 0) return false;

    const matchesSearch = !searchTerm ||
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.keywords?.some(keyword =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;

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
          
          <div className="relative group">
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>生成报告</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => generateReportMutation.mutate({ type: 'daily', format: 'html' })}
                disabled={generateReportMutation.isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                📄 日报 (HTML)
              </button>
              <button
                onClick={() => generateReportMutation.mutate({ type: 'weekly', format: 'html' })}
                disabled={generateReportMutation.isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                📊 周报 (HTML)
              </button>
              <button
                onClick={() => generateReportMutation.mutate({ type: 'monthly', format: 'html' })}
                disabled={generateReportMutation.isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                📈 月报 (HTML)
              </button>
            </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧主内容区 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 筛选和搜索 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="搜索热点话题..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>筛选</span>
                </button>
              </div>

              {showFilters && (
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
              )}
            </div>

            {/* 热点话题列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  热点话题 ({filteredTopics.length})
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {selectedTopicIds.length > 0 && `${selectedTopicIds.length} 项已选`}
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedTopicIds.length === filteredTopics.length ? '取消全选' : '全选'}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">加载中...</p>
                  </div>
                ) : filteredTopics.length === 0 ? (
                  <div className="p-8 text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">暂无热点话题</h3>
                    <p className="mt-1 text-sm text-gray-500">尝试调整筛选条件或刷新数据</p>
                  </div>
                ) : (
                  filteredTopics.map((topic) => (
                    <TopicCard
                      key={topic._id}
                      topic={topic}
                      isSelected={selectedTopicIds.includes(topic._id)}
                      onSelect={() => handleSelectTopic(topic._id)}
                      onGenerateContent={() => handleGenerateContent(topic)}
                      onShowTrend={handleShowTrendTimeline}
                      onShowCrossPlatform={handleShowCrossPlatform}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右侧侧边栏 */}
          <div className="space-y-6">
            {/* 快捷操作 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
              <div className="space-y-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshMutation.isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshMutation.isLoading ? 'animate-spin' : ''}`} />
                  <span>{refreshMutation.isLoading ? '刷新中...' : '刷新数据'}</span>
                </button>
                
                {selectedTopicIds.length > 0 && (
                  <button
                    onClick={handleShowAIAnalysis}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Brain className="h-4 w-4" />
                    <span>AI分析 ({selectedTopicIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* 实时热点 */}
            {newTopics && newTopics.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">实时热点</h3>
                <div className="space-y-3">
                  {newTopics.slice(0, 5).map((topic) => (
                    <div key={topic._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {topic.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            热度 {topic.heat}
                          </span>
                          <span className="text-xs text-gray-500">{topic.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
};

export default HotTopics;
