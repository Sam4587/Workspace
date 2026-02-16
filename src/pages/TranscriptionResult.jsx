import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Play, Pause, Volume2, Download, Edit3, Wand2, Copy, Check } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const TranscriptionResult = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [videoInfo, setVideoInfo] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedSegment, setCopiedSegment] = useState(null);

  useEffect(() => {
    loadTranscriptionData();
  }, [videoId]);

  const loadTranscriptionData = async () => {
    try {
      setIsLoading(true);
      
      // 获取视频信息
      const videoResponse = await api.getVideoInfo(videoId);
      setVideoInfo(videoResponse.data);
      
      // 获取转录结果
      const transcriptionResponse = await api.getVideoTranscription(videoId);
      setTranscription(transcriptionResponse.data.transcription);
      
    } catch (error) {
      console.error('加载转录数据失败:', error);
      showError('加载转录数据失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = async (text, segmentIndex = null) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSegment(segmentIndex);
      showSuccess('已复制到剪贴板');
      setTimeout(() => setCopiedSegment(null), 2000);
    } catch (error) {
      showError('复制失败');
    }
  };

  const handleRewriteContent = () => {
    navigate('/content-rewrite', {
      state: {
        transcription: transcription,
        source: 'video',
        videoId: videoId
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载转录结果中...</p>
        </div>
      </div>
    );
  }

  if (!videoInfo || !transcription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">未找到转录结果</h2>
          <p className="text-gray-500 mb-6">该视频可能尚未完成转录</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

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
                <h1 className="text-lg font-semibold text-gray-900">转录结果</h1>
                <p className="text-sm text-gray-500">{videoInfo.title}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleCopyText(transcription.text)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制全文
              </button>
              
              <button
                onClick={handleRewriteContent}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                内容改写
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：视频播放器和基本信息 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 视频播放器 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {videoInfo.localPath ? (
                  <video
                    src={videoInfo.localPath}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <div className="text-white text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>视频文件不可用</p>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2">视频信息</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>平台:</span>
                    <span className="font-medium capitalize">{videoInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>时长:</span>
                    <span className="font-medium">
                      {Math.floor(transcription.duration / 60)}:{String(Math.floor(transcription.duration % 60)).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>语言:</span>
                    <span className="font-medium">{transcription.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>引擎:</span>
                    <span className="font-medium">{transcription.engine}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">转录统计</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {transcription.segments?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">分段数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(transcription.text?.length / 4 || 0)}
                  </div>
                  <div className="text-sm text-gray-500">汉字数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(transcription.processingTime / 1000)}s
                  </div>
                  <div className="text-sm text-gray-500">处理时间</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {transcription.modelSize || '-'}
                  </div>
                  <div className="text-sm text-gray-500">模型大小</div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：转录文本 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* 全文显示 */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    完整转录文本
                  </h2>
                  <button
                    onClick={() => handleCopyText(transcription.text)}
                    className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </button>
                </div>
                
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {transcription.text}
                  </p>
                </div>
              </div>

              {/* 分段显示 */}
              {transcription.segments && transcription.segments.length > 0 && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">分段时间轴</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcription.segments.map((segment, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          currentTime >= segment.start && currentTime <= segment.end
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {Math.floor(segment.start / 60)}:
                                {String(Math.floor(segment.start % 60)).padStart(2, '0')} - 
                                {Math.floor(segment.end / 60)}:
                                {String(Math.floor(segment.end % 60)).padStart(2, '0')}
                              </span>
                              {segment.confidence && (
                                <span className="ml-2 text-xs text-gray-500">
                                  置信度: {(segment.confidence * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700">{segment.text}</p>
                          </div>
                          
                          <button
                            onClick={() => handleCopyText(segment.text, index)}
                            className="ml-3 p-1 text-gray-400 hover:text-blue-500"
                          >
                            {copiedSegment === index ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionResult;