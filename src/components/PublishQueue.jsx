import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Edit, Trash2, BookOpen } from 'lucide-react';
import { toutiaoGuidelines } from '../data/toutiao-guidelines';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const PublishQueue = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  const [selectedContent, setSelectedContent] = useState(null);

  const { data: contents, isLoading } = useQuery({
    queryKey: ['publish-queue'],
    queryFn: async () => {
      try {
        const response = await api.getContents({ status: 'draft' });
        return response.data || [];
      } catch (error) {
        showError('获取发布队列失败');
        return [];
      }
    },
    refetchInterval: 30000, // 30秒自动刷新
  });

  const approveMutation = useMutation({
    mutationFn: (contentId) => api.updateContentStatus(contentId, 'approved'),
    onSuccess: () => {
      showSuccess('内容已通过审核');
      queryClient.invalidateQueries(['publish-queue']);
    },
    onError: () => {
      showError('审核通过失败');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (contentId) => api.updateContentStatus(contentId, 'rejected'),
    onSuccess: () => {
      showSuccess('内容已拒绝');
      queryClient.invalidateQueries(['publish-queue']);
    },
    onError: () => {
      showError('拒绝失败');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteContent,
    onSuccess: () => {
      showSuccess('内容已删除');
      queryClient.invalidateQueries(['publish-queue']);
    },
    onError: () => {
      showError('删除失败');
    }
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
    
    // 检查内容质量
    if (!content.content.includes('。') || content.content.split('。').length < 3) {
      issues.push('内容段落结构不清晰，建议分段');
    }
    
    return issues;
  };

  const handleApprove = (contentId) => {
    approveMutation.mutate(contentId);
  };

  const handleReject = (contentId) => {
    rejectMutation.mutate(contentId);
  };

  const handleDelete = (contentId) => {
    if (window.confirm('确定要删除这个内容吗？')) {
      deleteMutation.mutate(contentId);
    }
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
      {contents && contents.length > 0 ? (
        contents.map((content) => {
          const issues = checkGuidelines(content);
          const hasIssues = issues.length > 0;
          
          return (
            <div key={content._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{content.title}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {content.type === 'article' ? '长文章' : 
                       content.type === 'micro' ? '微头条' : 
                       content.type === 'video' ? '视频脚本' : '音频脚本'}
                    </span>
                    {hasIssues ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        不符合规范
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        符合规范
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>字数: {content.wordCount}</span>
                    <span>质量: {content.quality}/100</span>
                    <span>创建时间: {new Date(content.createdAt).toLocaleString()}</span>
                  </div>
                  
                  {/* 规范检查详情 */}
                  {hasIssues && (
                    <div className="mb-3 p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <h5 className="text-sm font-medium text-red-700">今日头条发文规范问题</h5>
                      </div>
                      <ul className="space-y-1">
                        {issues.map((issue, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-red-600">
                            <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedContent(content)}
                      className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>查看详情</span>
                    </button>
                    
                    <button
                      onClick={() => handleApprove(content._id)}
                      disabled={hasIssues || approveMutation.isLoading}
                      className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                        hasIssues 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      title={hasIssues ? '内容不符合规范，无法通过审核' : '通过审核'}
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>通过</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(content._id)}
                      disabled={rejectMutation.isLoading}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-3 w-3" />
                      <span>拒绝</span>
                    </button>
                    
                    <button
                      onClick={() => handleDelete(content._id)}
                      disabled={deleteMutation.isLoading}
                      className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">发布队列为空</h3>
          <p className="text-gray-500">还没有待审核的内容</p>
        </div>
      )}
      
      {/* 内容详情模态框 */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">内容详情</h3>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedContent.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>字数: {selectedContent.wordCount}</span>
                    <span>质量: {selectedContent.quality}/100</span>
                    <span>创建时间: {new Date(selectedContent.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">内容正文</h5>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedContent.content}
                    </p>
                  </div>
                </div>
                
                {selectedContent.suggestions && selectedContent.suggestions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">优化建议</h5>
                    <ul className="space-y-1">
                      {selectedContent.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
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

export default PublishQueue;
