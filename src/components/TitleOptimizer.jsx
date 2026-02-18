import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Wand2, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const TitleOptimizer = ({ 
  title, 
  keywords = [], 
  targetPlatform = 'toutiao',
  onSelect,
  disabled = false
}) => {
  const { showError } = useNotification();
  const [optimizedTitles, setOptimizedTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const optimizeMutation = useMutation({
    mutationFn: () => api.optimizeTitle({
      title,
      keywords,
      targetPlatform,
      count: 5
    }),
    onSuccess: (data) => {
      if (data.success && data.optimizedTitles) {
        setOptimizedTitles(data.optimizedTitles);
        setShowOptions(true);
      } else {
        showError(data.message || '标题优化失败');
      }
    },
    onError: (error) => {
      showError('标题优化失败: ' + error.message);
    }
  });

  const handleSelect = (optTitle) => {
    setSelectedTitle(optTitle);
    onSelect?.(optTitle.title);
    setShowOptions(false);
  };

  const platformLabels = {
    toutiao: '今日头条',
    douyin: '抖音',
    xiaohongshu: '小红书'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => optimizeMutation.mutate()}
          disabled={disabled || optimizeMutation.isLoading || !title}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
        >
          {optimizeMutation.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          <span>AI优化标题</span>
        </button>
        {selectedTitle && (
          <span className="text-sm text-green-600">✓ 已选择优化标题</span>
        )}
      </div>

      {showOptions && optimizedTitles.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            为 {platformLabels[targetPlatform]} 生成 {optimizedTitles.length} 个标题选项：
          </p>
          <div className="space-y-2">
            {optimizedTitles.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(opt)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTitle?.title === opt.title
                    ? 'border-blue-500 bg-blue-50'
                    : opt.compliance
                    ? 'border-green-200 hover:border-green-400 bg-white'
                    : 'border-yellow-200 hover:border-yellow-400 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{opt.title}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      {opt.compliance ? (
                        <span className="flex items-center text-xs text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          符合规范
                        </span>
                      ) : (
                        <span className="flex items-center text-xs text-yellow-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {opt.reason || '可能不合规'}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        爆款潜力: {opt.score || 0}/100
                      </span>
                    </div>
                  </div>
                  {selectedTitle?.title === opt.title && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowOptions(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            收起选项
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleOptimizer;
