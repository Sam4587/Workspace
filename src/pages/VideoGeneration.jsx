import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Video, FileText, Settings, Play, Download, RefreshCw, CheckCircle, XCircle, Layers } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
import VideoTemplateSelector from '../components/video/VideoTemplateSelector';
import VideoConfigPanel from '../components/video/VideoConfigPanel';
import VideoPreview from '../components/video/VideoPreview';
import BatchGeneration from '../components/video/BatchGeneration';

const VideoGeneration = () => {
  const location = useLocation();
  const { showSuccess, showError } = useNotification();
  
  const [activeTab, setActiveTab] = useState('single');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [videoConfig, setVideoConfig] = useState({
    title: '',
    subtitle: '',
    content: '',
    images: [],
    backgroundMusic: null,
  });
  const [renderTaskId, setRenderTaskId] = useState(null);
  const [renderStatus, setRenderStatus] = useState(null);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['video-templates'],
    queryFn: async () => {
      const response = await api.getVideoTemplates();
      return response.data || [];
    },
  });

  useEffect(() => {
    if (location.state?.selectedTopic) {
      const topic = location.state.selectedTopic;
      setVideoConfig(prev => ({
        ...prev,
        title: topic.title || '',
        content: topic.description || '',
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (renderTaskId && renderStatus !== 'completed' && renderStatus !== 'failed') {
      const interval = setInterval(async () => {
        try {
          const response = await api.getRenderStatus(renderTaskId);
          if (response.success) {
            setRenderStatus(response.data.status);
            if (response.data.status === 'completed') {
              showSuccess('视频渲染完成');
              clearInterval(interval);
            } else if (response.data.status === 'failed') {
              showError('视频渲染失败');
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Failed to check render status:', error);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [renderTaskId, renderStatus, showSuccess, showError]);

  const renderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.renderVideo({
        templateId: selectedTemplate?.id,
        props: videoConfig,
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success) {
        setRenderTaskId(data.data.taskId);
        setRenderStatus('pending');
        showSuccess('渲染任务已提交');
      } else {
        showError(data.message || '提交渲染任务失败');
      }
    },
    onError: (error) => {
      showError('提交渲染任务失败: ' + error.message);
    },
  });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setVideoConfig(prev => ({
      ...prev,
      ...template.defaultProps,
    }));
  };

  const handleConfigChange = (key, value) => {
    setVideoConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderVideo = () => {
    if (!selectedTemplate) {
      showError('请先选择视频模板');
      return;
    }
    renderMutation.mutate();
  };

  const templateCategories = [
    { value: 'all', label: '全部' },
    { value: 'article', label: '文章' },
    { value: 'micro', label: '短视频' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">视频生成</h1>
        <p className="text-gray-600 mt-1">选择模板并配置内容，生成专业视频</p>
      </div>

      <div className="mb-4 flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('single')}
          className={`pb-2 px-1 ${activeTab === 'single' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <div className="flex items-center space-x-2">
            <Video className="h-4 w-4" />
            <span>单个生成</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`pb-2 px-1 ${activeTab === 'batch' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span>批量生成</span>
          </div>
        </button>
      </div>

      {activeTab === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <VideoTemplateSelector
              templates={templates || []}
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
              isLoading={templatesLoading}
            />

            {selectedTemplate && (
              <VideoConfigPanel
                template={selectedTemplate}
                config={videoConfig}
                onChange={handleConfigChange}
              />
            )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setVideoConfig({
                  title: '',
                  subtitle: '',
                  content: '',
                  images: [],
                  backgroundMusic: null,
                });
                setRenderTaskId(null);
                setRenderStatus(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              重置
            </button>
            <button
              onClick={renderVideo}
              disabled={!selectedTemplate || renderMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {renderMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>渲染中...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>生成视频</span>
                </>
              )}
            </button>
          </div>

          {renderTaskId && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">渲染状态</h3>
              <div className="flex items-center space-x-3">
                {renderStatus === 'pending' && (
                  <>
                    <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                    <span className="text-yellow-600">等待渲染...</span>
                  </>
                )}
                {renderStatus === 'rendering' && (
                  <>
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                    <span className="text-blue-600">渲染中...</span>
                  </>
                )}
                {renderStatus === 'completed' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600">渲染完成</span>
                    <a
                      href={`/api${renderStatus}`}
                      download
                      className="ml-4 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>下载</span>
                    </a>
                  </>
                )}
                {renderStatus === 'failed' && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-600">渲染失败</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <VideoPreview
            template={selectedTemplate}
            config={videoConfig}
          />
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BatchGeneration templates={templates || []} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGeneration;
