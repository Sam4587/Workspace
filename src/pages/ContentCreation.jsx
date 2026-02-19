import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Video, Mic, Settings, Play, Pause, RotateCcw, Save, Send, Workflow, Zap, Film, VideoIcon, FileVideo } from 'lucide-react';
import ContentTypeSelector from '../components/ContentTypeSelector';
import GenerationForm from '../components/GenerationForm';
import ContentPreview from '../components/ContentPreview';
import WorkflowPanel from '../components/WorkflowPanel';
import TitleOptimizer from '../components/TitleOptimizer';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const ContentCreation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [selectedType, setSelectedType] = useState('article');
  const [formData, setFormData] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('news_report');
  const [optimizedTitle, setOptimizedTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [optimizations, setOptimizations] = useState(['seo', 'readability']);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [useWorkflow, setUseWorkflow] = useState(false);
  const [videoSubType, setVideoSubType] = useState('script');
  const [showSettings, setShowSettings] = useState(false);

  const contentTypes = [
    {
      id: 'article',
      name: '长文章',
      icon: FileText,
      description: '生成深度分析文章',
      color: 'blue'
    },
    {
      id: 'micro',
      name: '微头条',
      icon: FileText,
      description: '生成简短热点内容',
      color: 'green'
    },
    {
      id: 'video',
      name: '视频内容',
      icon: Video,
      description: '生成视频脚本、渲染视频',
      color: 'purple',
      subTypes: [
        { id: 'script', name: '视频脚本', icon: FileVideo },
        { id: 'render', name: '视频渲染', icon: Film },
        { id: 'transcribe', name: '视频转录', icon: VideoIcon }
      ]
    },
    {
      id: 'audio',
      name: '音频脚本',
      icon: Mic,
      description: '生成音频内容脚本',
      color: 'orange'
    }
  ];

  const topic = location.state?.selectedTopic || null;

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.getContentTemplates();
        if (response.success) {
          const templates = response.data.templates || [];
          const styles = response.data.styles || [];
          
          setAvailableTemplates(templates);
          setAvailableStyles(styles);
          
          // 设置默认值
          if (templates.length > 0 && !selectedTemplate) {
            setSelectedTemplate(templates[0].id);
          }
          if (styles.length > 0 && !selectedStyle) {
            setSelectedStyle(styles[0].id);
          }
        } else {
          // 默认模板和样式
          setAvailableTemplates([
            { id: 'news_report', name: '新闻报道' },
            { id: 'analysis', name: '深度分析' },
            { id: 'opinion', name: '观点评论' }
          ]);
          setAvailableStyles([
            { id: 'creative', name: '创意型' },
            { id: 'professional', name: '专业型' },
            { id: 'casual', name: '轻松型' }
          ]);
        }
      } catch (error) {
        console.error('获取模板失败:', error);
        // 设置默认值
        setAvailableTemplates([
          { id: 'news_report', name: '新闻报道' },
          { id: 'analysis', name: '深度分析' },
          { id: 'opinion', name: '观点评论' }
        ]);
        setAvailableStyles([
          { id: 'creative', name: '创意型' },
          { id: 'professional', name: '专业型' },
          { id: 'casual', name: '轻松型' }
        ]);
      }
    };
    
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (topic) {
      setFormData({
        topic: topic.title,
        title: topic.title,
        keywords: topic.keywords?.join(',') || '',
        targetAudience: '',
        tone: 'professional',
        length: 'medium',
        includeData: true,
        includeCase: false,
        includeExpert: false,
        hotTopicId: topic._id
      });
    }
  }, [topic]);

  const generateEnhancedMutation = useMutation({
    mutationFn: async ({ formData }) => {
      const options = {
        template: selectedTemplate,
        style: selectedStyle,
        optimizeFor: optimizations,
        targetPlatform: 'toutiao',
        autoApprove: false,
        sourceType: 'hot_topic',
        sourceId: formData.hotTopicId,
        userId: 'current_user'
      };
      
      const response = await api.generateEnhancedContent(formData, options);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      showSuccess('增强内容生成成功');
    },
    onError: (error) => {
      showError('内容生成失败: ' + error.message);
    }
  });

  const generateMutation = useMutation({
    mutationFn: async ({ formData, type }) => {
      const options = {
        template: selectedTemplate,
        style: selectedStyle,
        optimizeFor: optimizations,
        targetAudience: formData.targetAudience || 'general',
        length: formData.length || 'medium',
        sourceType: 'hot_topic',
        sourceId: formData.hotTopicId,
        userId: 'current_user'
      };
      const response = await api.generateAIContent(formData, type, options);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      showSuccess('增强内容生成成功');
    },
    onError: (error) => {
      showError('内容生成失败: ' + error.message);
    }
  });

  const generateAndSaveMutation = useMutation({
    mutationFn: async ({ formData, type }) => {
      const options = {
        template: selectedTemplate,
        style: selectedStyle,
        optimizeFor: optimizations,
        targetAudience: formData.targetAudience || 'general',
        length: formData.length || 'medium',
        targetPlatform: 'toutiao',
        autoApprove: false,
        sourceType: 'hot_topic',
        sourceId: formData.hotTopicId,
        userId: 'current_user',
        category: topic?.category || 'default',
        tags: topic?.keywords || []
      };
      const response = await api.generateAIContent(formData, type, options);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      showSuccess('内容生成并保存成功');
    },
    onError: (error) => {
      showError('内容生成失败: ' + error.message);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (contentData) => {
      if (generatedContent?._id) {
        const response = await api.updateContent(generatedContent._id, contentData);
        return response.data;
      }
      return null;
    },
    onSuccess: () => {
      showSuccess('内容保存成功');
    },
    onError: (error) => {
      showError('内容保存失败: ' + error.message);
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (contentId) => {
      const response = await api.publishContent(contentId, ['toutiao']);
      return response.data;
    },
    onSuccess: () => {
      showSuccess('内容发布成功');
      navigate('/publish-center');
    },
    onError: (error) => {
      showError('内容发布失败: ' + error.message);
    }
  });

  const handleGenerate = async (formData) => {
    setFormData(formData);
    if (useWorkflow) {
      generateAndSaveMutation.mutate({ formData, type: selectedType });
    } else {
      generateMutation.mutate({ formData, type: selectedType });
    }
  };

  // 更新后的生成函数，包含设置参数
  const handleGenerateWithSettings = async (formData) => {
    const enhancedFormData = {
      ...formData,
      template: selectedTemplate,
      style: selectedStyle,
      optimizeFor: optimizations,
      targetAudience: formData.targetAudience || 'general',
      length: formData.length || 'medium'
    };
    
    setFormData(enhancedFormData);
    if (useWorkflow) {
      generateAndSaveMutation.mutate({ formData: enhancedFormData, type: selectedType });
    } else {
      generateMutation.mutate({ formData: enhancedFormData, type: selectedType });
    }
  };

  const handleSave = async (contentData) => {
    saveMutation.mutate(contentData);
  };

  const handlePublish = async () => {
    if (generatedContent?._id) {
      publishMutation.mutate(generatedContent._id);
    }
  };

  const handleRegenerate = async () => {
    if (formData) {
      if (useWorkflow) {
        generateAndSaveMutation.mutate({ formData, type: selectedType });
      } else {
        generateMutation.mutate({ formData, type: selectedType });
      }
    }
  };

  const handleContentGenerated = (contentId) => {
    api.getContentById(contentId).then(response => {
      if (response.success) {
        setGeneratedContent(response.data);
        showSuccess('工作流执行完成，内容已生成');
      }
    });
  };

  const handleVideoSubAction = (subType) => {
    setVideoSubType(subType);
    if (subType === 'render') {
      navigate('/content-creation', { state: { action: 'render' } });
    } else if (subType === 'transcribe') {
      navigate('/content-creation', { state: { action: 'transcribe' } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">内容创作</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>生成设置</span>
          </button>
          <button
            onClick={() => setUseWorkflow(!useWorkflow)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              useWorkflow
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Workflow className="h-4 w-4" />
            <span>{useWorkflow ? '关闭工作流' : '工作流模式'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentTypeSelector
            types={contentTypes}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />

          {selectedType === 'video' && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">视频操作</h3>
              <div className="grid grid-cols-3 gap-2">
                {contentTypes.find(t => t.id === 'video')?.subTypes?.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleVideoSubAction(sub.id)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      videoSubType === sub.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <sub.icon className="h-4 w-4" />
                    <span className="text-sm">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {formData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">标题优化</h3>
              <TitleOptimizer
                title={formData.title || formData.topic || ''}
                keywords={formData.keywords?.split(',').filter(Boolean) || []}
                targetPlatform="toutiao"
                onSelect={(selectedTitle) => {
                  setOptimizedTitle(selectedTitle);
                  setFormData(prev => ({ ...prev, title: selectedTitle }));
                }}
              />
              {optimizedTitle && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    已选择优化标题: <strong>{optimizedTitle}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          <GenerationForm
            type={selectedType}
            onGenerate={handleGenerateWithSettings}
            isGenerating={useWorkflow ? generateAndSaveMutation.isLoading : generateMutation.isLoading}
            initialData={formData}
          />

          {/* 设置面板 */}
          {showSettings && (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">生成设置</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI模型选择
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableStyles.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容长度
                  </label>
                  <select
                    value={formData?.length || 'medium'}
                    onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="short">短篇 (200-500字)</option>
                    <option value="medium">中篇 (500-1000字)</option>
                    <option value="long">长篇 (1000-2000字)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优化选项
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'seo', label: 'SEO优化' },
                      { id: 'readability', label: '可读性' },
                      { id: 'engagement', label: '互动性' },
                      { id: 'compliance', label: '合规性检查' }
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={optimizations.includes(opt.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOptimizations([...optimizations, opt.id]);
                            } else {
                              setOptimizations(optimizations.filter(id => id !== opt.id));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标受众
                  </label>
                  <select
                    value={formData?.targetAudience || 'general'}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">普通大众</option>
                    <option value="professional">专业人士</option>
                    <option value="student">学生群体</option>
                    <option value="business">商业人士</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    模板选择
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  确认设置
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {useWorkflow && topic && (
            <WorkflowPanel 
              topic={topic}
              onContentGenerated={handleContentGenerated}
            />
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">生成状态</h3>
            
            {useWorkflow ? (
              generateAndSaveMutation.isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">AI正在生成内容并保存...</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>分析热点</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>生成内容</span>
                      <span className="text-blue-600">...</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>保存到内容库</span>
                      <span className="text-gray-400">等待中</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>质量检查</span>
                      <span className="text-gray-400">等待中</span>
                    </div>
                  </div>
                </div>
              ) : generatedContent ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">生成并保存完成</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>字数: {generatedContent.wordCount}</div>
                    <div>预计阅读时间: {generatedContent.readingTime}分钟</div>
                    <div>质量评分: {generatedContent.quality}/100</div>
                    <div>AI模型: {generatedContent.aiModel}</div>
                    <div>内容ID: {generatedContent._id}</div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <button 
                      onClick={handleRegenerate}
                      disabled={generateAndSaveMutation.isLoading}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Zap className="h-3 w-3" />
                      <span>重新生成</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saveMutation.isLoading}
                      className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-3 w-3" />
                      <span>更新</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">选择内容类型并开始生成</p>
                </div>
              )
            ) : generateMutation.isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">AI正在生成内容...</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>分析热点</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>生成大纲</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>撰写内容</span>
                    <span className="text-blue-600">...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>质量检查</span>
                    <span className="text-gray-400">等待中</span>
                  </div>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">生成完成</span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>字数: {generatedContent.wordCount}</div>
                  <div>预计阅读时间: {generatedContent.readingTime}分钟</div>
                  <div>质量评分: {generatedContent.quality}/100</div>
                  <div>AI模型: {generatedContent.aiProvider}</div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <button 
                    onClick={handleRegenerate}
                    disabled={generateMutation.isLoading}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>重新生成</span>
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saveMutation.isLoading}
                    className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-3 w-3" />
                    <span>保存</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">选择内容类型并开始生成</p>
              </div>
            )}
          </div>

          {generatedContent && (
            <div className="space-y-4">
              <ContentPreview 
                content={generatedContent} 
                onSave={handleSave}
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={handlePublish}
                  disabled={publishMutation.isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>{publishMutation.isLoading ? '发布中...' : '立即发布'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCreation;
