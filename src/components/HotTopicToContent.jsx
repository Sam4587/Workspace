import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  TrendingUp, Brain, Sparkles, ArrowRight, FileText, 
  Zap, Target, Clock, BarChart3, ChevronRight, Wand2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import TitleGenerator from './TitleGenerator';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const HotTopicToContent = ({
  topic,
  onGenerateContent,
  className = ''
}) => {
  const { showSuccess, showError } = useNotification();
  const [analysis, setAnalysis] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [step, setStep] = useState(1);

  const analyzeMutation = useMutation({
    mutationFn: async (topicData) => {
      const response = await api.client.post('/ai-analysis/analyze-topic', {
        title: topicData.title,
        content: topicData.summary || topicData.title,
        source: topicData.source,
        heat: topicData.heat
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        setAnalysis(data.analysis);
        setStep(2);
        showSuccess('热点分析完成');
      }
    },
    onError: (error) => {
      showError('分析失败: ' + error.message);
    }
  });

  useEffect(() => {
    if (topic) {
      analyzeMutation.mutate(topic);
    }
  }, [topic]);

  const handleTitleSelect = (title, titleObj) => {
    setSelectedTitle({ title, ...titleObj });
    setStep(3);
  };

  const handleGenerateContent = () => {
    if (onGenerateContent && selectedTitle) {
      onGenerateContent({
        topic: topic.title,
        title: selectedTitle.title,
        analysis,
        keywords: topic.keywords || [],
        hotTopicId: topic._id
      });
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'declining':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendLabel = (trend) => {
    const labels = {
      rising: '上升趋势',
      stable: '稳定',
      declining: '下降趋势'
    };
    return labels[trend] || '未知';
  };

  const getOpportunityBadge = (timing) => {
    const variants = {
      immediate: { label: '立即介入', className: 'bg-green-500' },
      watch: { label: '建议观望', className: 'bg-yellow-500' },
      passed: { label: '已过时机', className: 'bg-red-500' }
    };
    return variants[timing] || variants.watch;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center gap-4">
        {[
          { num: 1, label: '热点分析', icon: Brain },
          { num: 2, label: '标题生成', icon: Sparkles },
          { num: 3, label: '内容创作', icon: FileText }
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s.num ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                {step > s.num ? <Zap className="h-4 w-4" /> : s.num}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            {i < 2 && <ChevronRight className="h-4 w-4 text-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* 步骤1: 热点分析 */}
      {step >= 1 && topic && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-500" />
              热点分析
            </CardTitle>
            <CardDescription>
              分析热点趋势与创作机会
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 热点信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{topic.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>来源: {topic.source}</span>
                <span>热度: {topic.heat}</span>
              </div>
            </div>

            {analyzeMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3 text-gray-500">分析中...</span>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                {/* 趋势评分 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">趋势评分</span>
                      {getTrendIcon(analysis.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analysis.score || 75}
                    </div>
                    <Progress value={analysis.score || 75} className="h-2 mt-2" />
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">创作时机</span>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <Badge className={getOpportunityBadge(analysis.timing).className}>
                      {getOpportunityBadge(analysis.timing).label}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-2">
                      {analysis.timingReason || '基于趋势分析'}
                    </p>
                  </div>
                </div>

                {/* 分析建议 */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      创作建议
                    </h4>
                    <ul className="space-y-1">
                      {analysis.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 下一步按钮 */}
                <Button
                  onClick={() => setStep(2)}
                  className="w-full gap-2"
                >
                  下一步: 生成标题
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* 步骤2: 标题生成 */}
      {step >= 2 && analysis && (
        <TitleGenerator
          topic={topic.title}
          keywords={topic.keywords || []}
          platform="toutiao"
          onSelect={handleTitleSelect}
          onGenerated={(titles) => {
            showSuccess(`生成了 ${titles.length} 个标题`);
          }}
        />
      )}

      {/* 步骤3: 确认创作 */}
      {step >= 3 && selectedTitle && (
        <Card className="border-0 shadow-lg border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <Wand2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                准备就绪
              </h3>
              <p className="text-sm text-gray-600">
                已选择标题: <span className="font-medium">{selectedTitle.title}</span>
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  重新选择标题
                </Button>
                <Button
                  onClick={handleGenerateContent}
                  className="gap-2 bg-gradient-to-r from-green-600 to-blue-600"
                >
                  <FileText className="h-4 w-4" />
                  开始创作内容
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HotTopicToContent;
