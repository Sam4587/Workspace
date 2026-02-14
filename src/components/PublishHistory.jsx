import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Eye, Heart, MessageCircle, Share, ExternalLink, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { toutiaoGuidelines } from '../data/toutiao-guidelines';
import api from '../lib/api';

const PublishHistory = () => {
  const [selectedContent, setSelectedContent] = useState(null);

  const { data: publishRecords, isLoading } = useQuery({
    queryKey: ['publish-history'],
    queryFn: async () => {
      try {
        const response = await api.getPublishRecords();
        return response.data || [];
      } catch (error) {
        console.error('获取发布历史失败:', error);
        return [];
      }
    },
    refetchInterval: 60000, // 1分钟自动刷新
  });

  const checkGuidelines = (content) => {
    const issues = [];
    
    // 检查标题
    if (content.title.length < toutiaoGuidelines.title.minLength) {
      issues.push(`标题长度不能少于${toutiaoGuidelines.title.minLength}字`);
    }
    if (content.title.length > toutiaoGuidelines.title.maxLength) {
      issues.push(`标题长度不能超过${toutiaoGuidelines.title.maxLength}字`);
    }
    
    // 检查标题禁用词
    const forbiddenWords = ['最', '第一', '唯一', '绝对', '100%'];
    forbiddenWords.forEach(word => {
      if (content.title.includes(word)) {
        issues.push(`标题中避免使用"${word}"等绝对化用语`);
      }
    });
    
    // 检查内容
    if (content.content.length < toutiaoGuidelines.content.minLength) {
      issues.push(`内容长度不能少于${toutiaoGuidelines.content.minLength}字`);
    }
    if (content.content.length > toutiaoGuidelines.content.maxLength) {
      issues.push(`内容长度不能超过${toutiaoGuidelines.content.maxLength}字`);
    }
    
    return issues;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse border rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {publishRecords && publishRecords.length > 0 ? (
        publishRecords.map((record) => {
          const issues = checkGuidelines(record.content);
          const hasIssues = issues.length > 0;
          
          return (
            <div key={record._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{record.content.title}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {record.content.type === 'article' ? '长文章' : 
                       record.content.type === 'micro' ? '微头条' : 
                       record.content.type === 'video' ? '视频脚本' : '音频脚本'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'success' ? 'bg-green-100 text-green-800' : 
                      record.status === 'failed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status === 'success' ? '发布成功' : 
                       record.status === 'failed' ? '发布失败' : '发布中'}
                    </span>
                    {hasIssues && (
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                        发布时不符合规范
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>发布时间: {new Date(record.publishTime).toLocaleString()}</span>
                    <span>平台: {record.platform}</span>
                  </div>
                  
                  {/* 规范检查详情 */}
                  {hasIssues && (
                    <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <h5 className="text-sm font-medium text-orange-700">发布时今日头条发文规范问题</h5>
                      </div>
                      <ul className="space-y-1">
                        {issues.map((issue, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-orange-600">
                            <span className="text-orange-500 mt-0.5">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* 发布数据 */}
                  {record.metrics && (
                    <div className="flex items-center space-x-6 text-sm mb-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span>{(record.metrics.views || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span>{record.metrics.likes || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                        <span>{record.metrics.comments || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share className="h-4 w-4 text-gray-400" />
                        <span>{record.metrics.shares || 0}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedContent(record)}
                      className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>查看详情</span>
                    </button>
                    
                    {record.platformUrl && (
                      <a
                        href={record.platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>查看原文</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无发布历史</h3>
          <p className="text-gray-500">还没有发布过的内容</p>
        </div>
      )}
      
      {/* 内容详情模态框 */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">发布详情</h3>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedContent.content.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>字数: {selectedContent.content.wordCount}</span>
                    <span>质量: {selectedContent.content.quality}/100</span>
                    <span>发布时间: {new Date(selectedContent.publishTime).toLocaleString()}</span>
                    <span>平台: {selectedContent.platform}</span>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">内容正文</h5>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedContent.content.content}
                    </p>
                  </div>
                </div>
                
                {selectedContent.metrics && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">发布数据</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">浏览量</div>
                        <div className="text-xl font-bold text-blue-600">
                          {(selectedContent.metrics.views || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">点赞数</div>
                        <div className="text-xl font-bold text-green-600">
                          {selectedContent.metrics.likes || 0}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">评论数</div>
                        <div className="text-xl font-bold text-purple-600">
                          {selectedContent.metrics.comments || 0}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">分享数</div>
                        <div className="text-xl font-bold text-orange-600">
                          {selectedContent.metrics.shares || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishHistory;
