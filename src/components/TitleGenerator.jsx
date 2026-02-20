import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Sparkles, Check, AlertTriangle, Copy, RefreshCw, 
  TrendingUp, Shield, Zap, Target, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const TitleGenerator = ({
  topic,
  keywords = [],
  platform = 'toutiao',
  onSelect,
  onGenerated,
  className = ''
}) => {
  const { showSuccess, showError } = useNotification();
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [expandedTitle, setExpandedTitle] = useState(null);

  const platforms = [
    { id: 'toutiao', name: '今日头条', icon: '📰' },
    { id: 'douyin', name: '抖音', icon: '🎵' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕' },
    { id: 'weibo', name: '微博', icon: '📱' },
    { id: 'bilibili', name: '哔哩哔哩', icon: '📺' },
    { id: 'zhihu', name: '知乎', icon: '💡' }
  ];

  const generateMutation = useMutation({
    mutationFn: async (params) => {
      const response = await api.client.post('/contents/generate-titles', params);
      return response;
    },
    onSuccess: (data) => {
      if (data.success && data.titles) {
        setGeneratedTitles(data.titles);
        onGenerated?.(data.titles);
        showSuccess(`成功生成 ${data.titles.length} 个标题`);
      } else {
        showError(data.message || '标题生成失败');
      }
    },
    onError: (error) => {
      showError('标题生成失败: ' + error.message);
    }
  });

  const handleGenerate = () => {
    if (!topic) {
      showError('请先输入主题');
      return;
    }
    generateMutation.mutate({
      topic,
      keywords,
      platform,
      count: 6,
      style: 'balanced'
    });
  };

  const handleSelect = (titleObj) => {
    setSelectedTitle(titleObj);
    onSelect?.(titleObj.title, titleObj);
    showSuccess('已选择标题');
  };

  const handleCopy = async (title) => {
    try {
      await navigator.clipboard.writeText(title);
      showSuccess('已复制到剪贴板');
    } catch {
      showError('复制失败');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getComplianceBadge = (titleObj) => {
    if (titleObj.compliance) {
      return (
        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
          <Shield className="h-3 w-3 mr-1" />
          合规
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">
        <AlertTriangle className="h-3 w-3 mr-1" />
        需注意
      </Badge>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 标题生成区域 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                智能标题生成
              </CardTitle>
              <CardDescription>
                同时满足吸引力与合规性要求
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {platforms.find(p => p.id === platform)?.icon} 
              <span className="text-sm text-gray-500">
                {platforms.find(p => p.id === platform)?.name}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 主题显示 */}
          {topic && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500 mb-1">主题</p>
              <p className="font-medium text-gray-900">{topic}</p>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !topic}
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                生成爆款标题
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 生成的标题列表 */}
      {generatedTitles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              生成结果 ({generatedTitles.length}个)
            </h3>
            <p className="text-sm text-gray-500">
              点击选择标题
            </p>
          </div>

          {generatedTitles.map((titleObj, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedTitle?.title === titleObj.title 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSelect(titleObj)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      {titleObj.title}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {getComplianceBadge(titleObj)}
                      
                      {titleObj.pattern && (
                        <Badge variant="outline" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          {titleObj.pattern}
                        </Badge>
                      )}
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getScoreBg(titleObj.totalScore || titleObj.viralScore)}`}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        爆款潜力: {titleObj.totalScore || titleObj.viralScore}
                      </Badge>
                    </div>

                    {/* 展开详情 */}
                    {expandedTitle === index && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        {titleObj.complianceReason && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">合规说明：</span>
                            {titleObj.complianceReason}
                          </p>
                        )}
                        {titleObj.emotionalTrigger && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">情感触发：</span>
                            {titleObj.emotionalTrigger}
                          </p>
                        )}
                        {titleObj.clickPrediction && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">点击预测：</span>
                            {titleObj.clickPrediction}
                          </p>
                        )}
                        {titleObj.issues && titleObj.issues.length > 0 && (
                          <div className="bg-yellow-50 rounded p-2">
                            <p className="text-sm font-medium text-yellow-800 mb-1">注意事项：</p>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              {titleObj.issues.map((issue, i) => (
                                <li key={i}>• {issue.message || issue.word}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(titleObj.title);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTitle(expandedTitle === index ? null : index);
                      }}
                    >
                      {expandedTitle === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {selectedTitle?.title === titleObj.title && (
                      <div className="p-1 bg-blue-500 rounded-full">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 已选择的标题 */}
      {selectedTitle && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">已选择标题</p>
                <p className="font-medium text-gray-900">{selectedTitle.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">
                  爆款潜力: {selectedTitle.totalScore || selectedTitle.viralScore}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TitleGenerator;
