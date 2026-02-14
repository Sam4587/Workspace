import React, { useState, useEffect } from 'react';
import { Eye, Edit, Download, Share, CheckCircle, AlertCircle, BookOpen, XCircle } from 'lucide-react';
import { toutiaoGuidelines } from '../data/toutiao-guidelines';

const ContentPreview = ({ content }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content.content);
  const [guidelinesCheck, setGuidelinesCheck] = useState({
    title: { valid: true, issues: [] },
    content: { valid: true, issues: [] }
  });

  useEffect(() => {
    setEditedContent(content.content);
    
    // 检查内容规范
    checkContentGuidelines();
  }, [content]);

  const checkContentGuidelines = () => {
    const titleIssues = [];
    const contentIssues = [];
    
    // 检查标题
    if (content.title.length < toutiaoGuidelines.title.minLength) {
      titleIssues.push(`标题长度不能少于${toutiaoGuidelines.title.minLength}字`);
    }
    if (content.title.length > toutiaoGuidelines.title.maxLength) {
      titleIssues.push(`标题长度不能超过${toutiaoGuidelines.title.maxLength}字`);
    }
    
    // 检查标题禁用词
    const forbiddenWords = ['最', '第一', '唯一', '绝对', '100%'];
    forbiddenWords.forEach(word => {
      if (content.title.includes(word)) {
        titleIssues.push(`标题中避免使用"${word}"等绝对化用语`);
      }
    });
    
    // 检查内容
    if (content.content.length < toutiaoGuidelines.content.minLength) {
      contentIssues.push(`内容长度不能少于${toutiaoGuidelines.content.minLength}字`);
    }
    if (content.content.length > toutiaoGuidelines.content.maxLength) {
      contentIssues.push(`内容长度不能超过${toutiaoGuidelines.content.maxLength}字`);
    }
    
    // 检查内容质量
    if (!content.content.includes('。') || content.content.split('。').length < 3) {
      contentIssues.push('内容段落结构不清晰，建议分段');
    }
    
    // 检查是否包含数据支撑
    if (!content.content.includes('数据') && !content.content.includes('研究') && !content.content.includes('统计')) {
      contentIssues.push('内容缺乏数据支撑，建议添加相关数据');
    }
    
    // 检查是否包含案例
    if (!content.content.includes('案例') && !content.content.includes('实例') && !content.content.includes('例子')) {
      contentIssues.push('内容缺乏实际案例，建议添加具体案例说明');
    }
    
    setGuidelinesCheck({
      title: {
        valid: titleIssues.length === 0,
        issues: titleIssues
      },
      content: {
        valid: contentIssues.length === 0,
        issues: contentIssues
      }
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    // 这里可以添加保存逻辑
  };

  const getQualityColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score) => {
    if (score >= 85) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 70) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const overallValid = guidelinesCheck.title.valid && guidelinesCheck.content.valid;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">内容预览</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-3 w-3" />
            <span>{isEditing ? '取消编辑' : '编辑'}</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
            <Download className="h-3 w-3" />
            <span>导出</span>
          </button>
        </div>
      </div>

      {/* 今日头条规范检查 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            今日头条发文规范检查
          </h4>
          {overallValid ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">标题检查</h5>
            {guidelinesCheck.title.valid ? (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>符合规范</span>
              </div>
            ) : (
              <ul className="space-y-1">
                {guidelinesCheck.title.issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-red-600">
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">内容检查</h5>
            {guidelinesCheck.content.valid ? (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>符合规范</span>
              </div>
            ) : (
              <ul className="space-y-1">
                {guidelinesCheck.content.issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-red-600">
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {!overallValid && (
          <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
            内容不符合今日头条发文规范，建议修改后再发布
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-900 mb-2">{content.title}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>字数: {content.wordCount}</span>
            <span>阅读时间: {content.readingTime}分钟</span>
            <div className="flex items-center space-x-1">
              {getQualityIcon(content.quality)}
              <span className={getQualityColor(content.quality)}>
                质量: {content.quality}/100
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-900">内容正文</h5>
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                保存
              </button>
            )}
          </div>
          
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {content.content}
              </p>
            </div>
          )}
        </div>

        {content.suggestions && content.suggestions.length > 0 && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-2">优化建议</h5>
            <ul className="space-y-1">
              {content.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                <Share className="h-3 w-3" />
                <span>分享</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
                <Eye className="h-3 w-3" />
                <span>预览发布</span>
              </button>
            </div>
            
            <button 
              className={`px-4 py-2 rounded text-sm transition-colors ${
                overallValid 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!overallValid}
              title={overallValid ? '提交审核' : '请先修改不符合规范的内容'}
            >
              提交审核
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPreview;
