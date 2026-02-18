import React from 'react';
import { Button } from './ui/button';

const defaultContentTypes = [
  { id: 'article', name: '文章', icon: '📄' },
  { id: 'video', name: '视频脚本', icon: '🎬' },
  { id: 'social', name: '社交媒体', icon: '💬' },
  { id: 'email', name: '邮件', icon: '📧' },
];

export const ContentTypeSelector = ({ types, selectedType, onTypeChange }) => {
  const contentTypesToUse = types || defaultContentTypes;
  
  const renderIcon = (icon) => {
    if (typeof icon === 'string') {
      return <span className="text-2xl">{icon}</span>;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent className="h-8 w-8" />;
    }
    return null;
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {contentTypesToUse.map((type) => (
        <Button
          key={type.id}
          variant={selectedType === type.id ? 'default' : 'outline'}
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => onTypeChange(type.id)}
        >
          {renderIcon(type.icon)}
          <span>{type.name || type.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default ContentTypeSelector;
