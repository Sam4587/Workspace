import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, X } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const TrendTimeline = ({ topic, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [days, setDays] = useState(7);

  const { data: trendData, isLoading } = useQuery({
    queryKey: ['topic-trend', topic._id, days],
    queryFn: async () => {
      const response = await api.getTopicTrend(topic._id, days);
      return response.data || null;
    },
    enabled: !!topic?._id,
    retry: 2
  });

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'hot':
        return <BarChart3 className="h-4 w-4 text-red-600" />;
      case 'new':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendLabel = (trend) => {
    switch (trend) {
      case 'up': return '上升';
      case 'down': return '下降';
      case 'hot': return '火爆';
      case 'new': return '新增';
      default: return '稳定';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (!topic) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">趋势时间轴</h2>
          <p className="text-sm text-gray-500">话题热度变化追踪</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {topic.title}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">{topic.source}</span>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatDateTime(topic.publishedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">时间范围:</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>近1天</option>
            <option value={3}>近3天</option>
            <option value={7}>近7天</option>
            <option value={14}>近14天</option>
            <option value={30}>近30天</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : !trendData ? (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p>暂无趋势数据</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">热度趋势图</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={12}
                />
                <Tooltip
                  labelFormatter={formatDateTime}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderRadius: '6px',
                    border: 'none'
                  }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="heat"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="热度值"
                />
                <Line
                  type="monotone"
                  dataKey="rank"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="排名"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 mb-1">当前热度</p>
              <p className="text-2xl font-bold text-blue-700">{trendData.currentHeat || 0}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs text-red-600 mb-1">热度变化</p>
              <p className={`text-2xl font-bold ${(trendData.heatChange || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(trendData.heatChange || 0) >= 0 ? '+' : ''}{trendData.heatChange || 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-purple-600 mb-1">记录次数</p>
              <p className="text-2xl font-bold text-purple-700">{trendData.trendCount || 0}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-orange-600 mb-1">火爆次数</p>
              <p className="text-2xl font-bold text-orange-700">{trendData.hotCount || 0}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">趋势记录</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {trendData.timeline?.length > 0 ? (
                trendData.timeline.slice().reverse().map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(record.trend)}
                      <span className="text-gray-600">{getTrendLabel(record.trend)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-500">
                      <span>{formatDateTime(record.timestamp)}</span>
                      <span>热度: {record.heat}</span>
                      <span>排名: {record.rank}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-4">暂无记录</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendTimeline;
