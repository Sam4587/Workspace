import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import PublishQueue from '../components/PublishQueue';
import PublishHistory from '../components/PublishHistory';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const Publishing = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState('queue');

  const { data: queueData, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['publish-queue'],
    queryFn: async () => {
      try {
        const response = await api.getPublishQueue({ status: 'all' });
        return response.data || [];
      } catch (error) {
        showError('获取发布队列失败');
        // 返回空数组而不是抛出错误，防止页面崩溃
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30秒缓存
  });

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['publish-history'],
    queryFn: async () => {
      try {
        const response = await api.getPublishHistory();
        return response.data || [];
      } catch (error) {
        showError('获取发布历史失败');
        // 返回空数组而不是抛出错误，防止页面崩溃
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30秒缓存
  });

  const publishMutation = useMutation({
    mutationFn: async (contentId) => {
      const response = await api.publishToToutiao(contentId);
      return response.data;
    },
    onSuccess: () => {
      showSuccess('发布成功');
      refetchQueue();
      refetchHistory();
    },
    onError: (error) => {
      showError('发布失败: ' + error.message);
    }
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([refetchQueue(), refetchHistory()]);
    }
  });

  const handlePublish = async (contentId) => {
    publishMutation.mutate(contentId);
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const tabs = [
    { id: 'queue', label: '发布队列', icon: Clock },
    { id: 'history', label: '发布历史', icon: CheckCircle }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">发布管理</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshMutation.isLoading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
          <button 
            disabled={publishMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>立即发布</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'queue' && (
            <PublishQueue 
              data={queueData} 
              isLoading={queueLoading}
              onPublish={handlePublish}
              publishLoading={publishMutation.isLoading}
            />
          )}
          {activeTab === 'history' && (
            <PublishHistory 
              data={historyData} 
              isLoading={historyLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Publishing;
