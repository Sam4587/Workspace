import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, BookOpen, Target, Image, Send, MessageSquare, TrendingUp } from 'lucide-react';
import { toutiaoGuidelines, reviewStandards, recommendationMechanism, optimizationSuggestions } from '../data/toutiao-guidelines';

const ToutiaoGuidelines = () => {
  const [activeTab, setActiveTab] = useState('requirements');

  const tabs = [
    { id: 'requirements', label: '发文规范', icon: BookOpen },
    { id: 'review', label: '审核标准', icon: CheckCircle },
    { id: 'recommendation', label: '推荐机制', icon: TrendingUp },
    { id: 'optimization', label: '优化建议', icon: Target }
  ];

  const renderRequirements = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
          标题规范
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">要求</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.title.requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">禁止</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.title.forbidden.map((forbidden, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{forbidden}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>长度要求：</strong> {toutiaoGuidelines.title.minLength}-{toutiaoGuidelines.title.maxLength}字
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
          内容规范
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">要求</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.content.requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">禁止</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.content.forbidden.map((forbidden, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{forbidden}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>长度要求：</strong> {toutiaoGuidelines.content.minLength}-{toutiaoGuidelines.content.maxLength}字
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Image className="h-5 w-5 mr-2 text-purple-600" />
          图片规范
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">要求</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.images.requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">禁止</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.images.forbidden.map((forbidden, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{forbidden}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Send className="h-5 w-5 mr-2 text-orange-600" />
          发布规范
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">要求</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.publishing.requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">建议</h4>
            <ul className="space-y-1">
              {toutiaoGuidelines.publishing.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewStandards = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-red-600" />
          审核标准
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-red-600">政治敏感</h4>
            <ul className="space-y-1">
              {reviewStandards.political.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-red-600">违法违规</h4>
            <ul className="space-y-1">
              {reviewStandards.illegal.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-red-600">商业推广</h4>
            <ul className="space-y-1">
              {reviewStandards.commercial.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-red-600">内容质量</h4>
            <ul className="space-y-1">
              {reviewStandards.quality.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          质量评估标准
        </h3>
        <div className="space-y-4">
          {Object.entries(toutiaoGuidelines.quality.scoring).map(([key, value]) => (
            <div key={key} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 capitalize">{key}</h4>
              <p className="text-sm text-gray-600">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecommendation = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          推荐机制
        </h3>
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">冷启动阶段</h4>
            <p className="text-sm text-gray-600 mb-2">{recommendationMechanism.coldStart.description}</p>
            <p className="text-sm text-gray-500 mb-2">持续时间：{recommendationMechanism.coldStart.duration}</p>
            <h5 className="font-medium text-gray-900 mb-1">影响因素：</h5>
            <ul className="space-y-1">
              {recommendationMechanism.coldStart.factors.map((factor, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">正常推荐阶段</h4>
            <p className="text-sm text-gray-600 mb-2">{recommendationMechanism.normal.description}</p>
            <p className="text-sm text-gray-500 mb-2">持续时间：{recommendationMechanism.normal.duration}</p>
            <h5 className="font-medium text-gray-900 mb-1">影响因素：</h5>
            <ul className="space-y-1">
              {recommendationMechanism.normal.factors.map((factor, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">热门推荐阶段</h4>
            <p className="text-sm text-gray-600 mb-2">{recommendationMechanism.hot.description}</p>
            <p className="text-sm text-gray-500 mb-2">持续时间：{recommendationMechanism.hot.duration}</p>
            <h5 className="font-medium text-gray-900 mb-1">影响因素：</h5>
            <ul className="space-y-1">
              {recommendationMechanism.hot.factors.map((factor, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOptimization = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-purple-600" />
          优化建议
        </h3>
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">标题优化</h4>
            <ul className="space-y-1">
              {optimizationSuggestions.title.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">内容优化</h4>
            <ul className="space-y-1">
              {optimizationSuggestions.content.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">发布优化</h4>
            <ul className="space-y-1">
              {optimizationSuggestions.publishing.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">今日头条发文规范</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'requirements' && renderRequirements()}
          {activeTab === 'review' && renderReviewStandards()}
          {activeTab === 'recommendation' && renderRecommendation()}
          {activeTab === 'optimization' && renderOptimization()}
        </div>
      </div>
    </div>
  );
};

export default ToutiaoGuidelines;
