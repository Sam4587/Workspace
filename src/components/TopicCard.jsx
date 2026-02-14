import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, Target, ExternalLink } from 'lucide-react';

const TopicCard = ({ topic }) => {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'up':
        return '上升';
      case 'down':
        return '下降';
      default:
        return '稳定';
    }
  };

  const getSuitabilityColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {topic.title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {topic.category}
            </span>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{topic.time}</span>
            </div>
            <span className="text-xs">{topic.source}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {getTrendIcon(topic.trend)}
          <span className="text-sm text-gray-600">
            {getTrendText(topic.trend)}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {topic.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">热度:</span>
            <span className="text-lg font-bold text-red-600">
              {topic.heat}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">适配度:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${getSuitabilityColor(topic.suitability)}`}>
              {topic.suitability}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {topic.keywords.map((keyword, index) => (
          <span
            key={index}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
          >
            #{keyword}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm">查看详情</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
            收藏
          </button>
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            生成内容
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
