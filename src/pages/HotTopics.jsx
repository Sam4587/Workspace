import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, TrendingUp, ExternalLink, Wand2, Brain, BarChart3, CheckSquare, Square } from 'lucide-react';
import TopicCard from '../components/TopicCard';
import FilterPanel from '../components/FilterPanel';
import TrendTimeline from '../components/TrendTimeline';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import CrossPlatformAnalysis from '../components/CrossPlatformAnalysis';
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
    navigate('/content-generation', {
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

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedTopicIds.length === topics?.length && topics?.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">全选</label>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>筛选</span>
          </button>
        </div>

        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}
      </div>

      {newTopics && newTopics.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">新增热点</h3>
            </div>
            <span className="text-sm text-gray-600">近24小时</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {newTopics.slice(0, 6).map(topic => (
              <div
                key={topic._id}
                className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleShowTrendTimeline(topic)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                    {topic.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTopic(topic._id);
                    }}
                    className="ml-2 flex-shrink-0"
                  >
                    {selectedTopicIds.includes(topic._id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {topic.source}
                  </span>
                  <span className="text-red-600 font-medium">
                    热度: {topic.heat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredTopics?.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {topics?.length === 0 ? '暂无热点数据' : '暂无匹配的热点'}
          </h3>
          <p className="text-gray-500 mb-4">
            {topics?.length === 0
              ? '当前没有可用的热点数据，请点击"刷新数据"按钮或稍后再试'
              : '请尝试调整搜索条件或筛选选项'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTopics?.map(topic => (
            <div key={topic._id} className="relative">
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedTopicIds.includes(topic._id)}
                  onChange={() => handleSelectTopic(topic._id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              <TopicCard topic={topic} />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => window.open(topic.sourceUrl, '_blank')}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  title="查看原文"
                >
                  <ExternalLink className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleShowTrendTimeline(topic)}
                  className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                  title="趋势时间轴"
                >
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleShowCrossPlatform(topic)}
                  className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                  title="跨平台分析"
                >
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </button>
                <button
                  onClick={() => handleGenerateContent(topic)}
                  className="p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
                  title="生成内容"
                >
                  <Wand2 className="h-4 w-4 text-purple-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {activePanel === 'timeline' && selectedTopic && (
            <TrendTimeline topic={selectedTopic} onClose={handleClosePanel} />
          )}
          {activePanel === 'crossPlatform' && selectedTopic && (
            <CrossPlatformAnalysis topic={selectedTopic} onClose={handleClosePanel} />
          )}
          {activePanel?.type === 'ai' && (
            <AIAnalysisPanel
              selectedTopics={activePanel.topics}
              onClose={handleClosePanel}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HotTopics;
