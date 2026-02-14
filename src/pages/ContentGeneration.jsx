import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Video, Mic, Settings, Play, Pause, RotateCcw, Save, Send } from 'lucide-react';
import ContentTypeSelector from '../components/ContentTypeSelector';
import GenerationForm from '../components/GenerationForm';
import ContentPreview from '../components/ContentPreview';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const ContentGeneration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [selectedType, setSelectedType] = useState('article');
  const [formData, setFormData] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);

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
      name: '视频脚本',
      icon: Video,
      description: '生成视频内容脚本',
      color: 'purple'
    },
    {
      id: 'audio',
      name: '音频脚本',
      icon: Mic,
      description: '生成音频内容脚本',
      color: 'orange'
    }
  ];

  const generateMutation = useMutation({
    mutationFn: async ({ formData, type }) => {
      const response = await api.generateContent(formData, type);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      showSuccess('内容生成成功');
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
      const response = await api.publishToToutiao(contentId);
      return response.data;
    },
    onSuccess: () => {
      showSuccess('内容发布成功');
      navigate('/publishing');
    },
    onError: (error) => {
      showError('内容发布失败: ' + error.message);
    }
  });

  useEffect(() => {
    if (location.state?.selectedTopic) {
      const topic = location.state.selectedTopic;
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
  }, [location.state]);

  const handleGenerate = async (formData) => {
    setFormData(formData);
    generateMutation.mutate({ formData, type: selectedType });
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
      generateMutation.mutate({ formData, type: selectedType });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">内容生成</h1>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="h-4 w-4" />
            <span>生成设置</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentTypeSelector
            types={contentTypes}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />
          
          <GenerationForm
            type={selectedType}
            onGenerate={handleGenerate}
            isGenerating={generateMutation.isLoading}
            initialData={formData}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">生成状态</h3>
            
            {generateMutation.isLoading ? (
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

export default ContentGeneration;
