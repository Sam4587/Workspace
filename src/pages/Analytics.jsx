import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Eye, Heart, MessageCircle, Share, Calendar, Download, BarChart3, Lightbulb, Target, Clock, Users } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const Analytics = () => {
  const { showError } = useNotification();
  const [timeRange, setTimeRange] = useState('7');
  const [selectedContent, setSelectedContent] = useState(null);

  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      try {
        const response = await api.getAnalyticsOverview();
        // 确保返回数据格式正确
        return response.data || {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          avgEngagement: 0,
          growthRate: 0
        };
      } catch (error) {
        showError('获取统计数据失败');
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  const { data: viewsTrendData, isLoading: viewsTrendLoading, error: viewsTrendError } = useQuery({
    queryKey: ['views-trend', timeRange],
    queryFn: async () => {
      try {
        const response = await api.getViewsTrend(parseInt(timeRange));
        // 确保返回数组格式
        return response.data || [];
      } catch (error) {
        showError('获取浏览量趋势失败');
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    enabled: !!timeRange,
  });

  const { data: contentTypeData, isLoading: contentTypeLoading, error: contentTypeError } = useQuery({
    queryKey: ['content-types'],
    queryFn: async () => {
      try {
        const response = await api.getContentTypeDistribution();
        // 确保返回数组格式
        return response.data || [];
      } catch (error) {
        showError('获取内容类型分布失败');
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: topContentData, isLoading: topContentLoading, error: topContentError } = useQuery({
    queryKey: ['top-content'],
    queryFn: async () => {
      try {
        const response = await api.getTopContent(10);
        // 确保返回数组格式
        return response.data || [];
      } catch (error) {
        showError('获取热门内容失败');
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: recommendationInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['recommendation-insights', selectedContent],
    queryFn: async () => {
      if (!selectedContent) return null;
      try {
        const response = await api.getRecommendationInsights(selectedContent);
        return response.data;
      } catch (error) {
        showError('获取推荐洞察失败');
        return null;
      }
    },
    enabled: !!selectedContent,
  });

  const { data: optimizationSuggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['optimization-suggestions', selectedContent],
    queryFn: async () => {
      if (!selectedContent) return null;
      try {
        const response = await api.getContentOptimizationSuggestions(selectedContent);
        return response.data;
      } catch (error) {
        showError('获取优化建议失败');
        return null;
      }
    },
    enabled: !!selectedContent,
  });

  const timeRangeOptions = [
    { value: '7', label: '最近7天' },
    { value: '30', label: '最近30天' },
    { value: '90', label: '最近90天' }
  ];

  // 处理统计数据，确保有默认值
  const statsData = [
    {
      title: '总浏览量',
      value: overviewData?.totalViews || 0,
      icon: Eye,
      color: 'blue',
      change: `+${overviewData?.growthRate || 0}%`
    },
    {
      title: '总点赞数',
      value: overviewData?.totalLikes || 0,
      icon: Heart,
      color: 'green',
      change: '+12%'
    },
    {
      title: '总评论数',
      value: overviewData?.totalComments || 0,
      icon: MessageCircle,
      color: 'purple',
      change: '+8%'
    },
    {
      title: '总分享数',
      value: overviewData?.totalShares || 0,
      icon: Share,
      color: 'orange',
      change: '+15%'
    }
  ];

  // 错误处理
  if (overviewError || viewsTrendError || contentTypeError || topContentError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
          <p className="text-gray-500 mb-4">请检查网络连接或稍后重试</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>导出报告</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">浏览量趋势</h3>
          {viewsTrendLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          ) : viewsTrendError ? (
            <div className="h-64 flex items-center justify-center text-red-500">
              加载失败，请重试
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsTrendData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="likes" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="comments" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">内容类型分布</h3>
          {contentTypeLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          ) : contentTypeError ? (
            <div className="h-64 flex items-center justify-center text-red-500">
              加载失败，请重试
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentTypeData || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {(contentTypeData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">热门内容</h3>
          <select
            value={selectedContent || ''}
            onChange={(e) => setSelectedContent(e.target.value || null)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">选择内容查看推荐洞察</option>
            {(topContentData || []).map((content) => (
              <option key={content._id} value={content._id}>
                {content.title}
              </option>
            ))}
          </select>
        </div>
        
        {topContentLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : topContentError ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">加载失败</div>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              点击重试
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(topContentData || []).map((content, index) => (
              <div 
                key={content._id || index} 
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedContent === content._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedContent(content._id)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <h4 className="font-medium text-gray-900">{content.title || '未知标题'}</h4>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>发布时间: {content.publishDate || '未知'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span>{(content.views || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4 text-gray-400" />
                    <span>{content.likes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <span>{content.comments || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Share className="h-4 w-4 text-gray-400" />
                    <span>{content.shares || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {(!topContentData || topContentData.length === 0) && (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
                <p className="text-gray-500">还没有热门内容数据</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 推荐洞察面板 */}
      {selectedContent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              推荐机制洞察
            </h3>
            
            {insightsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recommendationInsights ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">冷启动表现</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {recommendationInsights.coldStartPerformance}%
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">用户互动</div>
                    <div className="text-2xl font-bold text-green-600">
                      {recommendationInsights.userEngagement}%
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">内容质量</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {recommendationInsights.contentQuality}%
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">推荐评分</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {recommendationInsights.recommendationScore}%
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">推荐洞察</h4>
                  <ul className="space-y-2">
                    {recommendationInsights.insights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无推荐洞察数据</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
              优化建议
            </h3>
            
            {suggestionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : optimizationSuggestions ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-blue-600" />
                    标题优化
                  </h4>
                  <ul className="space-y-1">
                    {optimizationSuggestions.titleOptimization.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1 text-green-600" />
                    内容优化
                  </h4>
                  <ul className="space-y-1">
                    {optimizationSuggestions.contentOptimization.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-purple-600" />
                    发布时机
                  </h4>
                  <ul className="space-y-1">
                    {optimizationSuggestions.timingOptimization.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-1 text-orange-600" />
                    受众优化
                  </h4>
                  <ul className="space-y-1">
                    {optimizationSuggestions.audienceOptimization.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无优化建议</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
