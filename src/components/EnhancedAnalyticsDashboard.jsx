import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  TrendingUp, Eye, Heart, MessageCircle, Share, Calendar, Download, 
  BarChart3, Lightbulb, Target, Clock, Users, Zap, AlertTriangle,
  Filter, RefreshCw, Settings, Save, Copy, Printer
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedAnalyticsDashboard = () => {
  const { showError, showSuccess } = useNotification();
  const [timeRange, setTimeRange] = useState('7');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetrics, setSelectedMetrics] = useState(['views', 'likes']);
  const [exportFormat, setExportFormat] = useState('csv');

  // 获取总体统计数据
  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics-overview-enhanced', timeRange],
    queryFn: async () => {
      try {
        const response = await api.get('/analytics/overview');
        return response.data || {};
      } catch (error) {
        showError('获取统计数据失败');
        return {};
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // 获取趋势数据
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['analytics-trends-enhanced', timeRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/analytics/views-trend?days=${timeRange}`);
        return response.data || [];
      } catch (error) {
        showError('获取趋势数据失败');
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  // 获取用户行为数据
  const { data: behaviorData, isLoading: behaviorLoading } = useQuery({
    queryKey: ['analytics-behavior', timeRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/analytics/user-behavior?days=${timeRange}`);
        return response.data || [];
      } catch (error) {
        showError('获取用户行为数据失败');
        return [];
      }
    },
    staleTime: 15 * 60 * 1000,
  });

  // 获取内容质量数据
  const { data: qualityData, isLoading: qualityLoading } = useQuery({
    queryKey: ['analytics-quality'],
    queryFn: async () => {
      try {
        const response = await api.get('/analytics/content-quality');
        return response.data || [];
      } catch (error) {
        showError('获取内容质量数据失败');
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });

  // 获取预测数据
  const { data: predictionData, isLoading: predictionLoading } = useQuery({
    queryKey: ['analytics-predictions', timeRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/analytics/predictions?days=${timeRange}&metric=views`);
        return response.data || {};
      } catch (error) {
        showError('获取预测数据失败');
        return {};
      }
    },
    staleTime: 60 * 60 * 1000,
  });

  // 获取内容类型分布
  const { data: contentTypeData, isLoading: contentTypeLoading } = useQuery({
    queryKey: ['analytics-content-types'],
    queryFn: async () => {
      try {
        const response = await api.get('/analytics/content-types');
        return response.data || [];
      } catch (error) {
        showError('获取内容类型分布失败');
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });

  // 自定义工具提示组件
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 导出数据函数
  const handleExport = async () => {
    try {
      const response = await api.get(`/analytics/export?type=${exportFormat}&dataType=overview`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-data-${new Date().toISOString().split('T')[0]}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSuccess('数据导出成功');
    } catch (error) {
      showError('数据导出失败');
    }
  };

  // 刷新所有数据
  const handleRefresh = () => {
    refetchOverview();
    showSuccess('数据刷新成功');
  };

  // 统计卡片数据
  const statsData = [
    {
      title: '总浏览量',
      value: overviewData?.totalViews || 0,
      icon: Eye,
      color: 'blue',
      change: '+12%',
      trend: 'up'
    },
    {
      title: '总点赞数',
      value: overviewData?.totalLikes || 0,
      icon: Heart,
      color: 'red',
      change: '+8%',
      trend: 'up'
    },
    {
      title: '总评论数',
      value: overviewData?.totalComments || 0,
      icon: MessageCircle,
      color: 'green',
      change: '+15%',
      trend: 'up'
    },
    {
      title: '分享次数',
      value: overviewData?.totalShares || 0,
      icon: Share,
      color: 'purple',
      change: '+5%',
      trend: 'up'
    },
    {
      title: '平均互动率',
      value: `${overviewData?.avgEngagement || 0}%`,
      icon: Users,
      color: 'yellow',
      change: '+2%',
      trend: 'up'
    },
    {
      title: '增长指数',
      value: overviewData?.growthRate || 0,
      icon: TrendingUp,
      color: 'indigo',
      change: '+18%',
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据分析仪表板</h1>
          <p className="text-gray-600 mt-1">实时监控和分析您的内容表现数据</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">今天</option>
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
          </select>
          
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>刷新</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>导出</span>
            </button>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: '概览', icon: BarChart3 },
            { key: 'trends', label: '趋势分析', icon: TrendingUp },
            { key: 'behavior', label: '用户行为', icon: Users },
            { key: 'quality', label: '内容质量', icon: Target },
            { key: 'predictions', label: '预测分析', icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 统计卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {statsData.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 趋势图表 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">浏览量趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 内容类型分布 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">内容类型分布</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contentTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {contentTypeData && Array.isArray(contentTypeData) ? contentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )) : null}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">多维度趋势分析</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3B82F6" name="浏览量" strokeWidth={2} />
                  <Line type="monotone" dataKey="likes" stroke="#EF4444" name="点赞数" strokeWidth={2} />
                  <Line type="monotone" dataKey="comments" stroke="#10B981" name="评论数" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">用户活跃时段</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={behaviorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="avgViewsPerContent" name="平均每内容浏览量" fill="#3B82F6" />
                    <Bar yAxisId="right" dataKey="engagementRate" name="互动率(%)" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">周活跃度分布</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis dataKey="hour" type="number" name="小时" />
                    <YAxis dataKey="dayOfWeek" type="number" name="星期" />
                    <ZAxis range={[100, 1000]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="用户活跃度" data={behaviorData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">内容质量分析</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        内容类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均质量分
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均字数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均浏览量
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {qualityData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item._id === 'article' ? '长文章' : 
                           item._id === 'micro' ? '微头条' : 
                           item._id === 'video' ? '视频' : '其他'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span>{item.avgQuality.toFixed(1)}</span>
                            <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${item.avgQuality}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.avgWordCount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.avgViews?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">浏览量预测</h3>
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>基于历史数据的趋势预测</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-blue-600">
                    预测趋势: {predictionData?.trend || '未知'}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={predictionData?.predictions || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="predictedValue" 
                      stroke="#8B5CF6" 
                      name="预测值" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">预测置信度</h3>
                <div className="space-y-4">
                  {(predictionData?.predictions || []).map((pred, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{pred.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${pred.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {(overviewLoading || trendLoading || behaviorLoading || qualityLoading || predictionLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-700">正在加载数据...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalyticsDashboard;