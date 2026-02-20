import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Video, Play, Sparkles, TrendingUp, AlertTriangle, 
  Lightbulb, ChevronDown, ChevronUp, Copy, Check,
  Zap, Target, MessageCircle, Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from './ui/accordion';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const VideoStructureAnalysis = ({ 
  initialTranscript = '', 
  onApplySuggestions,
  className = '' 
}) => {
  const { showSuccess, showError } = useNotification();
  const [transcript, setTranscript] = useState(initialTranscript);
  const [analysis, setAnalysis] = useState(null);
  const [expandedSections, setExpandedSections] = useState(['structure']);

  const analyzeMutation = useMutation({
    mutationFn: async (text) => {
      const response = await api.client.post('/video-analysis/structure', {
        transcript: text,
        metadata: { platform: '通用', duration: '未知' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setAnalysis(data.data);
        showSuccess('视频结构分析完成');
      } else {
        showError(data.message || '分析失败');
      }
    },
    onError: (error) => {
      showError('分析失败: ' + (error.message || '请稍后重试'));
    }
  });

  const handleAnalyze = () => {
    if (!transcript.trim()) {
      showError('请输入视频转录文本');
      return;
    }
    if (transcript.trim().length < 10) {
      showError('转录文本过短，至少需要10个字符');
      return;
    }
    analyzeMutation.mutate(transcript);
  };

  const handleApplySuggestions = () => {
    if (onApplySuggestions && analysis?.suggestions) {
      onApplySuggestions(analysis.suggestions);
      showSuccess('优化建议已应用');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getViralPotentialBadge = (potential) => {
    const variants = {
      high: { variant: 'default', label: '高潜力', className: 'bg-green-500' },
      medium: { variant: 'secondary', label: '中等潜力', className: 'bg-yellow-500' },
      low: { variant: 'destructive', label: '潜力较低', className: '' }
    };
    return variants[potential] || variants.medium;
  };

  const renderStructureSection = (key, data, icons) => {
    const iconMap = {
      hook: <Zap className="h-5 w-5 text-amber-500" />,
      setup: <Target className="h-5 w-5 text-blue-500" />,
      climax: <Sparkles className="h-5 w-5 text-purple-500" />,
      cta: <MessageCircle className="h-5 w-5 text-green-500" />
    };

    const nameMap = {
      hook: '开头钩子',
      setup: '铺垫内容',
      climax: '核心包袱',
      cta: '结尾引导'
    };

    return (
      <div 
        key={key}
        className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {iconMap[key]}
            <span className="font-medium text-gray-900">{nameMap[key]}</span>
          </div>
          <Badge variant={getScoreBadgeVariant(data.score)}>
            {data.score}分
          </Badge>
        </div>
        
        <Progress 
          value={data.score} 
          className="h-2 mb-3"
        />
        
        {data.content && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            "{data.content}"
          </p>
        )}
        
        {data.analysis && (
          <p className="text-xs text-gray-400 italic">
            {data.analysis}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <Play className="h-3 w-3" />
          <span>{data.startTime} - {data.endTime}</span>
        </div>
      </div>
    );
  };

  const renderSuggestion = (suggestion, index) => {
    const priorityColors = {
      high: 'border-l-red-500 bg-red-50',
      medium: 'border-l-yellow-500 bg-yellow-50',
      low: 'border-l-blue-500 bg-blue-50'
    };

    const priorityIcons = {
      high: <AlertTriangle className="h-4 w-4 text-red-500" />,
      medium: <TrendingUp className="h-4 w-4 text-yellow-500" />,
      low: <Lightbulb className="h-4 w-4 text-blue-500" />
    };

    return (
      <div 
        key={index}
        className={`border-l-4 rounded-lg p-4 ${priorityColors[suggestion.priority] || priorityColors.medium}`}
      >
        <div className="flex items-start gap-3">
          {priorityIcons[suggestion.priority]}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">
              {suggestion.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {suggestion.suggestion}
            </p>
            {suggestion.examples && suggestion.examples.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestion.examples.map((example, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {example}
                  </Badge>
                ))}
              </div>
            )}
            {suggestion.impact && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {suggestion.impact}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 输入区域 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-blue-500" />
            视频结构分析
          </CardTitle>
          <CardDescription>
            输入视频转录文本，AI将分析其结构组成并提供优化建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="请粘贴视频转录文本..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-[150px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {transcript.length} 字符
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending || !transcript.trim()}
              className="gap-2"
            >
              {analyzeMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  开始分析
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      {analysis && (
        <div className="space-y-6">
          {/* 总体评分 */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-500 mb-1">综合评分</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}
                    </span>
                    <span className="text-gray-400">/100</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">爆款潜力</p>
                    <Badge 
                      className={getViralPotentialBadge(analysis.viralPotential).className}
                    >
                      {getViralPotentialBadge(analysis.viralPotential).label}
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">节奏评分</p>
                    <span className={`text-lg font-semibold ${getScoreColor(analysis.rhythm?.pace?.score || 50)}`}>
                      {analysis.rhythm?.pace?.score || 50}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 结构分析 */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                结构分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analysis.structure || {}).map(([key, data]) => 
                  renderStructureSection(key, data)
                )}
              </div>
            </CardContent>
          </Card>

          {/* 爆款元素 */}
          {analysis.viralElements && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  爆款元素分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysis.viralElements.emotionalTriggers?.length > 0 && (
                    <div className="bg-pink-50 rounded-xl p-4">
                      <h4 className="font-medium text-pink-700 mb-2 flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        情感触发点
                      </h4>
                      <ul className="space-y-1">
                        {analysis.viralElements.emotionalTriggers.slice(0, 3).map((item, i) => (
                          <li key={i} className="text-sm text-pink-600">
                            • {item.content || item.type}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.viralElements.practicalValue?.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        实用价值
                      </h4>
                      <ul className="space-y-1">
                        {analysis.viralElements.practicalValue.slice(0, 3).map((item, i) => (
                          <li key={i} className="text-sm text-green-600">
                            • {item.content || item.type}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.viralElements.keyFactors?.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 sm:col-span-2">
                      <h4 className="font-medium text-blue-700 mb-2">关键成功因素</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.viralElements.keyFactors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="border-blue-200 text-blue-600">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 优化建议 */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    优化建议
                  </CardTitle>
                  {onApplySuggestions && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleApplySuggestions}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      应用建议
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.suggestions.map((suggestion, index) => 
                    renderSuggestion(suggestion, index)
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoStructureAnalysis;
