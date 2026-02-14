import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, X, Loader2, Send } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const AIAnalysisPanel = ({ selectedTopics, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [options, setOptions] = useState({
    includeTrends: true,
    includeSentiment: true,
    includeKeywords: true,
    includeSummary: false
  });
  const [showBrief, setShowBrief] = useState(false);
  const [maxLength, setMaxLength] = useState(300);
  const [focus, setFocus] = useState('important');

  const { data: healthCheck } = useQuery({
    queryKey: ['ai-health'],
    queryFn: async () => {
      const response = await api.checkAIHealth();
      return response.data || null;
    },
    refetchInterval: 60000,
    retry: 1
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeTopics(selectedTopics, options),
    onSuccess: (response) => {
      if (response.success) {
        showSuccess('AI 分析完成');
      } else {
        showError(response.message || 'AI 分析失败');
      }
    },
    onError: (error) => {
      showError('AI 分析失败: ' + (error.message || '请稍后重试'));
    }
  });

  const briefMutation = useMutation({
    mutationFn: () => api.generateBrief(selectedTopics, maxLength, focus),
    onSuccess: (response) => {
      if (response.success) {
        showSuccess('简报生成完成');
        setShowBrief(true);
      } else {
        showError(response.message || '简报生成失败');
      }
    },
    onError: (error) => {
      showError('简报生成失败: ' + (error.message || '请稍后重试'));
    }
  });

  const handleAnalyze = () => {
    if (selectedTopics.length === 0) {
      showError('请先选择要分析的话题');
      return;
    }
    analyzeMutation.mutate();
  };

  const handleGenerateBrief = () => {
    if (selectedTopics.length === 0) {
      showError('请先选择要生成简报的话题');
      return;
    }
    briefMutation.mutate();
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'controversial':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const analysisData = analyzeMutation.data?.data;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">AI 智能分析</h2>
          <p className="text-sm text-gray-500">基于人工智能的话题分析</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {healthCheck && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
          healthCheck.healthy
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {healthCheck.healthy ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span>
            AI 服务状态: {healthCheck.healthy ? '正常' : '异常'}
            {healthCheck.provider && ` (${healthCheck.provider})`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">分析选项</h3>
          {[
            { key: 'includeTrends', label: '趋势分析', icon: <TrendingUp className="h-4 w-4" /> },
            { key: 'includeSentiment', label: '情感分析', icon: <Sparkles className="h-4 w-4" /> },
            { key: 'includeKeywords', label: '关键词提取', icon: <Brain className="h-4 w-4" /> },
            { key: 'includeSummary', label: '生成简报', icon: <CheckCircle2 className="h-4 w-4" /> }
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-600 text-sm">{icon}</span>
              <span className="text-gray-700 text-sm">{label}</span>
            </label>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">简报设置</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">最大字数</label>
              <input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value) || 300)}
                min="50"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">重点方向</label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="important">重要话题</option>
                <option value="trending">趋势热点</option>
                <option value="all">全面覆盖</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={selectedTopics.length === 0 || analyzeMutation.isLoading}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzeMutation.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <span>{analyzeMutation.isLoading ? '分析中...' : '开始分析'}</span>
        </button>
        <button
          onClick={handleGenerateBrief}
          disabled={selectedTopics.length === 0 || briefMutation.isLoading}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {briefMutation.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{briefMutation.isLoading ? '生成中...' : '生成简报'}</span>
        </button>
      </div>

      {showBrief && briefMutation.data?.data?.brief && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-blue-700 mb-2">AI 简报</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {briefMutation.data.data.brief}
          </p>
        </div>
      )}

      {analysisData && (
        <div className="space-y-4">
          {analysisData.trendOverview && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">趋势概述</h3>
              <p className="text-gray-800 font-medium">{analysisData.trendOverview}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisData.risingTopics && analysisData.risingTopics.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" /> 上升趋势
                </h3>
                <ul className="space-y-1">
                  {analysisData.risingTopics.map((topic, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisData.fallingTopics && analysisData.fallingTopics.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1" /> 下降趋势
                </h3>
                <ul className="space-y-1">
                  {analysisData.fallingTopics.map((topic, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisData.hotTopics && analysisData.hotTopics.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-700 mb-2">火爆话题</h3>
                <ul className="space-y-1">
                  {analysisData.hotTopics.map((topic, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {analysisData.sentiment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">情感分析</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'positive', label: '正面', color: 'text-green-600', bg: 'bg-green-100' },
                  { key: 'negative', label: '负面', color: 'text-red-600', bg: 'bg-red-100' },
                  { key: 'controversial', label: '争议', color: 'text-purple-600', bg: 'bg-purple-100' },
                  { key: 'neutral', label: '中性', color: 'text-gray-600', bg: 'bg-gray-100' }
                ].map(({ key, label, color, bg }) => (
                  <div key={key} className={`rounded-lg p-3 ${bg}`}>
                    <div className="flex items-center space-x-1 mb-1">
                      {getSentimentIcon(key)}
                      <span className={`text-xs font-medium ${color}`}>{label}</span>
                    </div>
                    {analysisData.sentiment[key]?.length > 0 ? (
                      <ul className="space-y-1">
                        {analysisData.sentiment[key].slice(0, 3).map((topic, idx) => (
                          <li key={idx} className="text-xs text-gray-700 truncate">
                            {topic}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400">无</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisData.topKeywords && analysisData.topKeywords.length > 0 && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-700 mb-3 flex items-center">
                <Brain className="h-4 w-4 mr-1" /> 高频关键词
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysisData.topKeywords.slice(0, 10).map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-indigo-700 shadow-sm"
                  >
                    {item.keyword} ({item.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysisData.briefing && analysisData.briefing.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-700 mb-2">热点简报</h3>
              <ul className="space-y-2">
                {analysisData.briefing.map((brief, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {idx + 1}. {brief}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {selectedTopics.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">请先选择要分析的话题</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
