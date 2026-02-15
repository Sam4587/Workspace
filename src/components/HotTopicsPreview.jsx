import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const HotTopicsPreview = () => {
  const { showError } = useNotification();

  const { data: hotTopics, isLoading, error } = useQuery({
    queryKey: ['hot-topics-preview'],
    queryFn: async () => {
      try {
        const response = await api.getHotTopics({ limit: 3, sortBy: 'heat', sortOrder: 'desc' });
        // 确保返回的是数组
        return response.data || [];
      } catch (error) {
        showError('获取热门话题失败');
        // 返回空数组而不是抛出错误
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">热门话题</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">热门话题</h3>
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">热门话题</h3>
        <TrendingUp className="h-5 w-5 text-red-500" />
      </div>
      
      <div className="space-y-4">
        {hotTopics?.map((topic) => (
          <div key={topic._id} className="border-l-4 border-red-500 pl-4 hover:bg-accent transition-colors rounded-r">
            <h4 className="text-sm font-medium text-card-foreground mb-1 line-clamp-2">
              {topic.title}
            </h4>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">
                {topic.category}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-medium">
                  热度: {topic.heat}
                </span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(topic.publishedAt).toLocaleString('zh-CN', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <Link 
          to="/hot-topics"
          className="flex items-center justify-center space-x-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="text-sm">查看更多热点</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      
      {hotTopics?.length === 0 && (
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无热门话题</p>
          <p className="text-muted-foreground/70 text-sm mt-2">系统正在初始化热点数据，请稍后再试</p>
        </div>
      )}
    </div>
  );
};

export default HotTopicsPreview;
