import React, { useState, useEffect } from 'react';
import { Wand2, Target, Clock, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { toutiaoGuidelines } from '../data/toutiao-guidelines';

const GenerationForm = ({ type, onGenerate, isGenerating, initialData }) => {
  const [formData, setFormData] = useState({
    topic: '',
    title: '',
    keywords: '',
    targetAudience: '',
    tone: 'professional',
    length: 'medium',
    includeData: true,
    includeCase: false,
    includeExpert: false
  });

  const [guidelinesCheck, setGuidelinesCheck] = useState({
    title: { valid: true, issues: [] },
    content: { valid: true, issues: [] }
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // 检查标题规范
  useEffect(() => {
    if (formData.title) {
      const issues = [];
      
      // 检查长度
      if (formData.title.length < toutiaoGuidelines.title.minLength) {
        issues.push(`标题长度不能少于${toutiaoGuidelines.title.minLength}字`);
      }
      if (formData.title.length > toutiaoGuidelines.title.maxLength) {
        issues.push(`标题长度不能超过${toutiaoGuidelines.title.maxLength}字`);
      }
      
      // 检查禁用词
      const forbiddenWords = ['最', '第一', '唯一', '绝对', '100%'];
      forbiddenWords.forEach(word => {
        if (formData.title.includes(word)) {
          issues.push(`标题中避免使用"${word}"等绝对化用语`);
        }
      });
      
      setGuidelinesCheck(prev => ({
        ...prev,
        title: {
          valid: issues.length === 0,
          issues
        }
      }));
    }
  }, [formData.title]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 检查规范
    const hasIssues = !guidelinesCheck.title.valid;
    if (hasIssues) {
      alert('请根据今日头条发文规范修改标题后再提交');
      return;
    }
    
    onGenerate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getFormFields = () => {
    const baseFields = (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            热点话题 *
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => handleInputChange('topic', e.target.value)}
            placeholder="输入或选择热点话题"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            内容标题 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="输入内容标题"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {/* 标题规范检查 */}
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                今日头条标题规范检查
              </h4>
              {guidelinesCheck.title.valid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            {guidelinesCheck.title.issues.length > 0 ? (
              <ul className="space-y-1">
                {guidelinesCheck.title.issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-red-600">
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600">标题符合今日头条发文规范</p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              要求：{toutiaoGuidelines.title.minLength}-{toutiaoGuidelines.title.maxLength}字，避免标题党和绝对化用语
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            关键词
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => handleInputChange('keywords', e.target.value)}
            placeholder="用逗号分隔关键词"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </>
    );

    const typeSpecificFields = {
      article: (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文章长度
            </label>
            <select
              value={formData.length}
              onChange={(e) => handleInputChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="short">短文章 (500-800字)</option>
              <option value="medium">中等文章 (800-1500字)</option>
              <option value="long">长文章 (1500-3000字)</option>
            </select>
          </div>
        </>
      ),
      micro: (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容风格
            </label>
            <select
              value={formData.tone}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="casual">轻松活泼</option>
              <option value="professional">专业严谨</option>
              <option value="emotional">情感共鸣</option>
            </select>
          </div>
        </>
      ),
      video: (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              视频时长
            </label>
            <select
              value={formData.length}
              onChange={(e) => handleInputChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="short">短视频 (1-3分钟)</option>
              <option value="medium">中等视频 (3-5分钟)</option>
              <option value="long">长视频 (5-10分钟)</option>
            </select>
          </div>
        </>
      ),
      audio: (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音频时长
            </label>
            <select
              value={formData.length}
              onChange={(e) => handleInputChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="short">短音频 (2-5分钟)</option>
              <option value="medium">中等音频 (5-10分钟)</option>
              <option value="long">长音频 (10-20分钟)</option>
            </select>
          </div>
        </>
      )
    };

    return (
      <>
        {baseFields}
        {typeSpecificFields[type]}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            目标受众
          </label>
          <input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => handleInputChange('targetAudience', e.target.value)}
            placeholder="描述目标受众特征"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            <Target className="inline h-4 w-4 mr-1" />
            内容要求
          </label>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeData}
                onChange={(e) => handleInputChange('includeData', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">包含数据支撑</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeCase}
                onChange={(e) => handleInputChange('includeCase', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">包含实际案例</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeExpert}
                onChange={(e) => handleInputChange('includeExpert', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">包含专家观点</span>
            </label>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">生成设置</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {getFormFields()}
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>预计生成时间: 2-5分钟</span>
          </div>
          
          <button
            type="submit"
            disabled={isGenerating || !formData.topic || !formData.title}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Wand2 className="h-4 w-4" />
            <span>{isGenerating ? '生成中...' : '开始生成'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default GenerationForm;
