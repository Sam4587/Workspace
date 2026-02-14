import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, FileText, Send, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import RecentActivity from '../components/RecentActivity';
import HotTopicsPreview from '../components/HotTopicsPreview';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const Index = () => {
  const { showError } = useNotification();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.getAnalyticsOverview();
        // 确保数据格式正确，提供默认值
        return {
          todayTopics: response.data?.todayTopics || 0,
          generatedContent: response.data?.generatedContent || 0,
          publishedContent: response.data?.publishedContent || 0,
          totalViews: response.data?.totalViews || 0,
          avgEngagement: response.data?.avgEngagement || 0,
          successRate: response.data?.successRate || 0
        };
      } catch (error) {
        showError('获取统计数据失败');
        // 返回默认数据而不是抛出错误
        return {
          todayTopics: 0,
          generatedContent: 0,
          publishedContent: 0,
          totalViews: 0,
          avgEngagement: 0,
          successRate: 0
        };
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  const statsData = [
    {
      title: '今日热点',
      value: stats?.todayTopics || 0,
      icon: TrendingUp,
      color: 'blue',
      change: '+12%'
    },
    {
      title: '生成内容',
      value: stats?.generatedContent || 0,
      icon: FileText,
      color: 'green',
      change: '+8%'
    },
    {
      title: '已发布',
      value: stats?.publishedContent || 0,
      icon: Send,
      color: 'purple',
      change: '+15%'
    },
    {
      title: '总浏览量',
      value: stats?.totalViews || 0,
      icon: Eye,
      color: 'orange',
      change: '+23%'
    }
  ];

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
          <p className="text-gray-500">请检查网络连接或稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">系统总览</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>最后更新: {new Date().toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">热点监控</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">正常运行</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI生成服务</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">正常运行</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">发布服务</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">正常运行</span>
              </div>
            </div>
          </div>
        </div>

        <HotTopicsPreview />
      </div>

      <RecentActivity />
    </div>
  );
};

export default Index;
