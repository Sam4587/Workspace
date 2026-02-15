import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const RecentActivity = () => {
  const { showError } = useNotification();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      try {
        // 获取最近的内容生成记录
        const contentResponse = await api.getContents({ limit: 2, sortBy: 'createdAt', sortOrder: 'desc' });
        const publishResponse = await api.getPublishHistory({ limit: 2, sortBy: 'publishTime', sortOrder: 'desc' });
        
        const contentActivities = (contentResponse.data || []).map(item => ({
          id: `content-${item._id}`,
          type: 'generate',
          title: `生成${getTypeText(item.type)}《${item.title}》`,
          status: item.status === 'published' ? 'success' : 'pending',
          time: formatTime(item.createdAt)
        }));
        
        const publishActivities = (publishResponse.data || []).map(item => ({
          id: `publish-${item._id}`,
          type: 'publish',
          title: `发布${getTypeText(item.contentId?.type)}《${item.contentId?.title}》`,
          status: item.status,
          time: formatTime(item.publishTime)
        }));
        
        return [...contentActivities, ...publishActivities]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 4);
      } catch (error) {
        showError('获取最近活动失败');
        // 返回空数组而不是抛出错误
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
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
    switch (type) {
      case 'generate':
        return <FileText className="h-4 w-4" />;
      case 'publish':
        return <Send className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
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

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'pending':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '未知时间';
    
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 60) {
        return `${minutes}分钟前`;
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else {
        return `${days}天前`;
      }
    } catch (error) {
      return '未知时间';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">最近活动</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">最近活动</h3>
        <div className="text-center py-8">
          <div className="text-destructive mb-2">加载失败</div>
          <button 
            onClick={() => window.location.reload()}
            className="text-primary hover:text-primary/80 text-sm"
          >
            点击重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow p-6 border border-border">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">最近活动</h3>
      
      <div className="space-y-4">
        {activities?.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                {getIcon(activity.type)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">
                {activity.title}
              </p>
              <p className="text-sm text-muted-foreground">{activity.time}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusIcon(activity.status)}
              <span className="text-sm text-muted-foreground">
                {getStatusText(activity.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {activities?.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无最近活动</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
