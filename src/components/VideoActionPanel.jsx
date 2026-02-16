import React, { useState } from 'react';
import { Download, Play, FileText, Edit3, Send, Loader2, CheckCircle, AlertCircle, Video } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const VideoActionPanel = ({ topic, onTranscriptionComplete }) => {
  const { showSuccess, showError } = useNotification();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState(null);
  const [videoId, setVideoId] = useState(null);

  // 提取视频链接
  const extractVideoUrls = (topic) => {
    const urls = [];
    
    // 从内容中提取抖音/快手链接
    const content = topic.content || '';
    const videoPattern = /(https?:\/\/(v\.douyin\.com|www\.kuaishou\.com)[^\s]+)/g;
    const matches = content.match(videoPattern);
    
    if (matches) {
      urls.push(...matches);
    }
    
    // 从相关链接中提取
    if (topic.relatedLinks) {
      topic.relatedLinks.forEach(link => {
        if (link.url && (link.url.includes('douyin.com') || link.url.includes('kuaishou.com'))) {
          urls.push(link.url);
        }
      });
    }
    
    return [...new Set(urls)]; // 去重
  };

  const videoUrls = extractVideoUrls(topic);

  const handleDownload = async (videoUrl) => {
    if (!videoUrl) return;
    
    setIsDownloading(true);
    setDownloadStatus('downloading');
    
    try {
      const response = await api.downloadVideo(videoUrl, {
        removeWatermark: true
      });
      
      if (response.success) {
        setVideoId(response.data.videoId);
        setDownloadStatus('completed');
        showSuccess('视频下载成功');
        
        // 自动开始转录
        setTimeout(() => {
          handleTranscribe(response.data.videoId);
        }, 1000);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('视频下载失败:', error);
      setDownloadStatus('failed');
      showError('视频下载失败: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTranscribe = async (vidId) => {
    const targetVideoId = vidId || videoId;
    if (!targetVideoId) return;
    
    setIsTranscribing(true);
    setTranscriptionStatus('processing');
    
    try {
      const response = await api.transcribeVideo(targetVideoId, {
        engine: 'whisper-local',
        language: 'zh'
      });
      
      if (response.success) {
        // 轮询转录状态
        pollTranscriptionStatus(response.data.taskId);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('转录提交失败:', error);
      setTranscriptionStatus('failed');
      showError('转录提交失败: ' + error.message);
      setIsTranscribing(false);
    }
  };

  const pollTranscriptionStatus = async (taskId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.getTranscriptionStatus(taskId);
        const status = response.data.status;
        
        if (status === 'completed') {
          clearInterval(pollInterval);
          setTranscriptionStatus('completed');
          setIsTranscribing(false);
          showSuccess('视频转录完成');
          
          // 通知父组件转录完成
          if (onTranscriptionComplete) {
            onTranscriptionComplete(response.data.result);
          }
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          setTranscriptionStatus('failed');
          setIsTranscribing(false);
          showError('转录失败: ' + response.data.error);
        }
      } catch (error) {
        console.error('获取转录状态失败:', error);
      }
    }, 3000); // 每3秒检查一次
    
    // 5分钟后超时
    setTimeout(() => {
      clearInterval(pollInterval);
      if (transcriptionStatus !== 'completed') {
        setTranscriptionStatus('timeout');
        setIsTranscribing(false);
        showError('转录超时');
      }
    }, 300000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'downloading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'downloading': return '下载中...';
      case 'processing': return '转录中...';
      case 'completed': return '完成';
      case 'failed': return '失败';
      case 'timeout': return '超时';
      default: return '待处理';
    }
  };

  if (videoUrls.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center text-gray-500">
          <Video className="w-5 h-5 mr-2" />
          <span>该热点暂无检测到视频内容</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 flex items-center">
          <Video className="w-5 h-5 mr-2 text-blue-500" />
          视频转录操作
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          检测到 {videoUrls.length} 个视频链接
        </p>
      </div>
      
      <div className="p-4 space-y-4">
        {/* 视频链接列表 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">检测到的视频:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {videoUrls.map((url, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">{url}</p>
                  <div className="flex items-center mt-1 space-x-4 text-xs">
                    <span className="flex items-center">
                      {getStatusIcon(downloadStatus)}
                      <span className="ml-1">{getStatusText(downloadStatus)}</span>
                    </span>
                    <span className="flex items-center">
                      {getStatusIcon(transcriptionStatus)}
                      <span className="ml-1">{getStatusText(transcriptionStatus)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!videoId && (
                    <button
                      onClick={() => handleDownload(url)}
                      disabled={isDownloading}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          下载中
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-1" />
                          下载
                        </>
                      )}
                    </button>
                  )}
                  
                  {videoId && !transcriptionStatus && (
                    <button
                      onClick={() => handleTranscribe(videoId)}
                      disabled={isTranscribing}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 flex items-center"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          转录中
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 mr-1" />
                          转录
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        {(videoId || transcriptionStatus === 'completed') && (
          <div className="flex space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate(`/transcription/${videoId}`)}
              className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              查看转录结果
            </button>
            
            {transcriptionStatus === 'completed' && (
              <button
                onClick={() => navigate('/content-rewrite', { 
                  state: { 
                    transcription: { /* 转录结果 */ },
                    source: 'video',
                    videoId 
                  } 
                })}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center justify-center"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                内容改写
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoActionPanel;