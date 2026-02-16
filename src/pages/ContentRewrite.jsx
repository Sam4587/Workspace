import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Copy, Check, Send, Loader2, FileText, Video, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const ContentRewrite = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const { transcription, source, videoId } = location.state || {};
  
  const [inputText, setInputText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['xiaohongshu', 'douyin', 'toutiao']);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('input');

  // 平台配置
  const platforms = [
    { id: 'xiaohongshu', name: '小红书', icon: '📕', color: 'bg-red-100 text-red-800' },
    { id: 'douyin', name: '抖音', icon: '🎵', color: 'bg-pink-100 text-pink-800' },
    { id: 'toutiao', name: '今日头条', icon: '📰', color: 'bg-blue-100 text-blue-800' },
    { id: 'weibo', name: '微博', icon: '🔵', color: 'bg-yellow-100 text-yellow-800' }
  ];

  useEffect(() => {
    if (transcription?.text) {
      setInputText(transcription.text);
    }
  }, [transcription]);

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleRewrite = async () => {
    if (!inputText.trim()) {
      showError('请输入要改写的内容');
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      showError('请至少选择一个平台');
      return;
    }

    setIsRewriting(true);
    
    try {
      const response = await api.rewriteVideoContent(inputText, selectedPlatforms);
      
      if (response.success) {
        setRewrittenContent(response.data);
        setActiveTab('results');
        showSuccess('内容改写完成');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('内容改写失败:', error);
      showError('改写失败: ' + error.message);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopy = async (text, identifier) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(identifier);
      showSuccess('已复制到剪贴板');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      showError('复制失败');
    }
  };

  const handlePublish = async (platform, content) => {
    try {
      const response = await api.publishContent(platform, content);
      
      if (response.success) {
        showSuccess(`${platform}发布请求已发送`);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('发布失败:', error);
      showError(`${platform}发布失败: ` + error.message);
    }
  };

  const PlatformContentCard = ({ platform, content }) => {
    const platformInfo = platforms.find(p => p.id === platform);
    
    if (!content) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg mr-2">{platformInfo?.icon || '📝'}</span>
            <h3 className="font-medium text-gray-900">{platformInfo?.name || platform}</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleCopy(
                `${content.title || ''}\n\n${content.content || ''}`, 
                `${platform}-all`
              )}
              className="p-1 text-gray-400 hover:text-blue-500"
            >
              {copiedItem === `${platform}-all` ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handlePublish(platform, content)}
              className="p-1 text-gray-400 hover:text-green-500"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {content.title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
              <div className="flex items-start">
                <p className="flex-1 bg-gray-50 p-3 rounded border border-gray-200 text-gray-700">
                  {content.title}
                </p>
                <button
                  onClick={() => handleCopy(content.title, `${platform}-title`)}
                  className="ml-2 p-2 text-gray-400 hover:text-blue-500"
                >
                  {copiedItem === `${platform}-title` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {content.hook && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开场钩子</label>
              <div className="flex items-start">
                <p className="flex-1 bg-gray-50 p-3 rounded border border-gray-200 text-gray-700">
                  {content.hook}
                </p>
                <button
                  onClick={() => handleCopy(content.hook, `${platform}-hook`)}
                  className="ml-2 p-2 text-gray-400 hover:text-blue-500"
                >
                  {copiedItem === `${platform}-hook` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {content.mainContent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">主要内容</label>
              <div className="flex">
                <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-200 text-gray-700 whitespace-pre-wrap">
                  {content.mainContent}
                </div>
                <button
                  onClick={() => handleCopy(content.mainContent, `${platform}-main`)}
                  className="ml-2 p-2 text-gray-400 hover:text-blue-500 self-start"
                >
                  {copiedItem === `${platform}-main` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {content.content && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">正文内容</label>
              <div className="flex">
                <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-200 text-gray-700 whitespace-pre-wrap">
                  {content.content}
                </div>
                <button
                  onClick={() => handleCopy(content.content, `${platform}-content`)}
                  className="ml-2 p-2 text-gray-400 hover:text-blue-500 self-start"
                >
                  {copiedItem === `${platform}-content` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {content.cta && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结尾引导</label>
              <div className="flex items-start">
                <p className="flex-1 bg-gray-50 p-3 rounded border border-gray-200 text-gray-700">
                  {content.cta}
                </p>
                <button
                  onClick={() => handleCopy(content.cta, `${platform}-cta`)}
                  className="ml-2 p-2 text-gray-400 hover:text-blue-500"
                >
                  {copiedItem === `${platform}-cta` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {content.tags && content.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">话题标签</label>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded text-xs font-medium ${platformInfo?.color}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">内容改写</h1>
                <p className="text-sm text-gray-500">
                  {source === 'video' ? '视频转录内容改写' : '文本内容改写'}
                </p>
              </div>
            </div>
            
            {source === 'video' && videoId && (
              <button
                onClick={() => navigate(`/transcription/${videoId}`)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                查看原文
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧：输入区域和平台选择 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 平台选择 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">选择平台</h2>
              <div className="space-y-3">
                {platforms.map(platform => (
                  <label key={platform.id} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={() => togglePlatform(platform.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 flex items-center">
                      <span className="text-lg mr-2">{platform.icon}</span>
                      <span className="text-gray-700">{platform.name}</span>
                    </span>
                  </label>
                ))}
              </div>
              
              <button
                onClick={handleRewrite}
                disabled={isRewriting || !inputText.trim() || selectedPlatforms.length === 0}
                className="w-full mt-6 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isRewriting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    改写中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    一键改写
                  </>
                )}
              </button>
            </div>

            {/* 统计信息 */}
            {rewrittenContent && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-3">改写统计</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>平台数量:</span>
                    <span className="font-medium">{selectedPlatforms.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>字符总数:</span>
                    <span className="font-medium">
                      {Object.values(rewrittenContent.results || {}).reduce((sum, content) => 
                        sum + (content.content?.length || content.mainContent?.length || 0), 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：内容区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tab导航 */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('input')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === 'input'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      输入内容
                    </div>
                  </button>
                  
                  {rewrittenContent && (
                    <button
                      onClick={() => setActiveTab('results')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === 'results'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Wand2 className="w-4 h-4 mr-2" />
                        改写结果
                      </div>
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab内容 */}
              <div className="p-6">
                {activeTab === 'input' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      输入要改写的内容
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入视频转录内容或任何需要改写的文本..."
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      字符数: {inputText.length}
                    </div>
                  </div>
                )}

                {activeTab === 'results' && rewrittenContent && (
                  <div className="space-y-6">
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        改写结果概览
                      </h3>
                      <p className="text-gray-600 mb-6">
                        基于您的原始内容，已为 {selectedPlatforms.length} 个平台生成了定制化内容：
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      {Object.entries(rewrittenContent.results || {}).map(([platform, content]) => (
                        <PlatformContentCard 
                          key={platform} 
                          platform={platform} 
                          content={content} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentRewrite;