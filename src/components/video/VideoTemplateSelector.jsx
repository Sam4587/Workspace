import React from 'react';
import { Video, FileText, Clapperboard } from 'lucide-react';

const VideoTemplateSelector = ({ 
  templates, 
  selectedTemplate, 
  onSelect, 
  isLoading 
}) => {
  const getIcon = (category) => {
    switch (category) {
      case 'article':
        return <FileText className="h-6 w-6" />;
      case 'micro':
        return <Video className="h-6 w-6" />;
      default:
        return <Clapperboard className="h-6 w-6" />;
    }
  };

  const getColorClass = (category, isSelected) => {
    if (!isSelected) return 'border-gray-200 hover:border-gray-300';
    switch (category) {
      case 'article':
        return 'border-blue-500 bg-blue-50';
      case 'micro':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">选择视频模板</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">选择视频模板</h3>
      
      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>暂无可用模板</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id;
            
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${getColorClass(template.category, isSelected)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    template.category === 'article' ? 'bg-blue-100 text-blue-600' :
                    template.category === 'micro' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getIcon(template.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
                      <span>比例: {template.aspectRatio}</span>
                      <span>时长: {template.duration}s</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoTemplateSelector;
