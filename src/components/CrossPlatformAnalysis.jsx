import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const CrossPlatformAnalysis = ({ topic, onClose }) => {
  const { showError } = useNotification();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['cross-platform', topic?.title],
    queryFn: async () => {
      const response = await api.getCrossPlatformAnalysis(topic.title);
      return response.data || {};
    },
    enabled: !!topic?.title,
    retry: 2
  });

  const platforms = ['微博热搜', '今日头条', '百度热搜'];

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case '微博热搜':
        return <Globe className="h-5 w-5 text-red-500" />;
      case '今日头条':
        return <Globe className="h-5 w-5 text-blue-500" />;
      case '百度热搜':
        return <Globe className="h-5 w-5 text-green-500" />;
      default:
        return <Globe className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHeatColor = (heat) => {
    if (heat >= 90) return 'bg-red-600';
    if (heat >= 70) return 'bg-orange-500';
    if (heat >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (!topic) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">跨平台分析</h2>
          <p className="text-sm text-gray-500">话题在各平台的分布情况</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
          {topic.title}
        </h3>
        <p className="text-sm text-gray-600">
          {topic.description || topic.title}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : !analysis || Object.keys(analysis).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p>暂无跨平台数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const platformData = analysis[platform];
              return (
                <div
                  key={platform}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    {getPlatformIcon(platform)}
                    <span className="font-medium text-gray-900">{platform}</span>
                  </div>

                  {platformData ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">出现次数</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {platformData.count || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">平均热度</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {platformData.avgHeat || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">最高热度</span>
                        <div className={`px-2 py-0.5 rounded text-white text-xs font-bold ${getHeatColor(platformData.maxHeat || 0)}`}>
                          {platformData.maxHeat || 0}
                        </div>
                      </div>
                      {platformData.latestAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">最后出现</span>
                          <span className="text-xs text-gray-700">
                            {new Date(platformData.latestAt).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <span className="text-sm">未收录</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">平台对比分析</h3>
            <div className="space-y-2">
              {platforms.map((platform) => {
                const platformData = analysis[platform];
                if (!platformData) return null;

                return (
                  <div key={platform} className="flex items-center">
                    <div className="w-24 flex items-center space-x-2">
                      {getPlatformIcon(platform)}
                      <span className="text-xs text-gray-600 truncate">{platform}</span>
                    </div>
                    <div className="flex-1 bg-white rounded h-6 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getHeatColor(platformData.avgHeat || 0)}`}
                        style={{ width: `${Math.min(100, platformData.avgHeat || 0)}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {platformData.avgHeat || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 mb-1">收录平台</p>
              <p className="text-2xl font-bold text-blue-700">
                {Object.values(analysis).filter(p => p && p.count > 0).length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600 mb-1">总热度</p>
              <p className="text-2xl font-bold text-green-700">
                {Object.values(analysis).reduce((sum, p) => sum + (p?.avgHeat || 0), 0).toFixed(0)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-xs text-purple-600 mb-1">最高热度</p>
              <p className="text-2xl font-bold text-purple-700">
                {Math.max(...Object.values(analysis).map(p => p?.maxHeat || 0)) || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossPlatformAnalysis;
