import React, { useState } from 'react';
import { Video, FileText, Sparkles, History, Settings, HelpCircle } from 'lucide-react';
import VideoStructureAnalysis from '../components/VideoStructureAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const VideoAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('structure');

  const handleApplySuggestions = (suggestions) => {
    console.log('应用优化建议:', suggestions);
  };

  const sampleTranscripts = [
    {
      id: 1,
      title: '产品介绍类视频',
      transcript: `今天给大家介绍一款超级好用的产品！首先呢，这个产品它有一个非常独特的设计，你看它的外观，是不是很漂亮？然后它的功能也很强大，可以帮你解决很多问题。比如说你平时工作忙，没时间整理文件，它就可以帮你自动分类。最后，如果你觉得好用的话，记得点赞关注哦！`
    },
    {
      id: 2,
      title: '知识分享类视频',
      transcript: `你知道吗？其实90%的人都不知道这个技巧！今天我就来告诉你。首先，我们要明白一个道理，那就是...好，现在重点来了，这个技巧的核心就是三个字：快、准、狠。什么意思呢？快就是效率要高，准就是目标要明确，狠就是执行力要强。学会了记得评论区告诉我！`
    },
    {
      id: 3,
      title: '情感故事类视频',
      transcript: `我永远不会忘记那一天...那天我遇到了一个人，他改变了我的一生。故事要从三年前说起，那时候我刚毕业，什么都不懂。然后有一天，我在地铁上遇到了一位老人...他说了一句话，让我至今难忘："年轻人，不要怕失败，要怕的是不敢尝试。"从那以后，我的人生彻底改变了。如果这个故事触动了你，请点个赞。`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>
                视频内容分析
              </h1>
              <p className="mt-2 text-gray-500">
                AI驱动的视频结构分析与优化建议
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                使用帮助
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                历史记录
              </Button>
            </div>
          </div>
        </div>

        {/* 功能标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200 p-1 rounded-xl">
            <TabsTrigger 
              value="structure" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg gap-2"
            >
              <Sparkles className="h-4 w-4" />
              结构分析
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg gap-2"
            >
              <FileText className="h-4 w-4" />
              示例模板
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 主分析区域 */}
              <div className="lg:col-span-2">
                <VideoStructureAnalysis 
                  onApplySuggestions={handleApplySuggestions}
                />
              </div>

              {/* 侧边栏 */}
              <div className="space-y-6">
                {/* 快速提示 */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      分析提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 border-amber-200 text-amber-700">1</Badge>
                      <p className="text-sm text-gray-600">
                        粘贴完整的视频转录文本，获得更准确的分析结果
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 border-amber-200 text-amber-700">2</Badge>
                      <p className="text-sm text-gray-600">
                        分析结果包含结构评分、爆款元素和优化建议
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 border-amber-200 text-amber-700">3</Badge>
                      <p className="text-sm text-gray-600">
                        点击"应用建议"可将优化建议应用到内容创作
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 结构说明 */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">结构说明</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <span className="text-lg">🎣</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">开头钩子</h4>
                        <p className="text-sm text-gray-500">前3-5秒的吸引点</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-lg">📖</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">铺垫内容</h4>
                        <p className="text-sm text-gray-500">背景介绍和情境铺垫</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <span className="text-lg">💥</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">核心包袱</h4>
                        <p className="text-sm text-gray-500">高潮或反转部分</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-lg">📢</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">结尾引导</h4>
                        <p className="text-sm text-gray-500">互动引导或关注引导</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 性能指标 */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-500" />
                      分析能力
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/50 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">4</p>
                        <p className="text-xs text-gray-500">结构维度</p>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-xl">
                        <p className="text-2xl font-bold text-purple-600">5+</p>
                        <p className="text-xs text-gray-500">爆款元素</p>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-xl">
                        <p className="text-2xl font-bold text-green-600">AI</p>
                        <p className="text-xs text-gray-500">智能分析</p>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-xl">
                        <p className="text-2xl font-bold text-amber-600">秒级</p>
                        <p className="text-xs text-gray-500">响应速度</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleTranscripts.map((sample) => (
                <Card 
                  key={sample.id} 
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      <FileText className="h-4 w-4" />
                      {sample.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-4 mb-4">
                      {sample.transcript}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                    >
                      使用此模板
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VideoAnalysisPage;
