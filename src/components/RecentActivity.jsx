import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const RecentActivity = () => {
  const { showError } = useNotification();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      try {
        // 获取最近的内容生成记录
        const contentResponse = await api.getContents({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' });
        
        const contentActivities = (contentResponse.data || []).map(item => ({
          id: `content-${item._id || item.id}`,
          type: 'generate',
          title: `生成${getTypeText(item.type)}《${item.title}》`,
          status: item.status === 'published' ? 'success' : 'pending',
          time: formatTime(item.createdAt)
        }));
        
        return contentActivities.slice(0, 4);
      } catch (error) {
        showError('获取最近活动失败');
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 2 * 60 * 1000,
  });

  const getTypeText = (type) => {
    const typeMap = {
      'article': '长文章',
      'micro': '微头条',
      'video': '视频脚本',
      'audio': '音频脚本'
    };
    return typeMap[type] || '内容';
  };

  const getIcon = (type) => {
    return <FileText className="h-4 w-4" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">最近活动</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">最近活动</h3>
        <p className="text-gray-500 text-center py-8">加载失败</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">最近活动</h3>
      <div className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
              {getStatusIcon(activity.status)}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">暂无最近活动</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
