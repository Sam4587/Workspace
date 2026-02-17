import React from 'react';
import { Button } from './ui/button';

const contentTypes = [
  { id: 'article', label: '文章', icon: '📄' },
  { id: 'video', label: '视频脚本', icon: '🎬' },
  { id: 'social', label: '社交媒体', icon: '💬' },
  { id: 'email', label: '邮件', icon: '📧' },
];

export const ContentTypeSelector = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {contentTypes.map((type) => (
        <Button
          key={type.id}
          variant={selected === type.id ? 'default' : 'outline'}
          className="h-24 flex flex-col items-center justify-center gap-2"
          onClick={() => onSelect(type.id)}
        >
          <span className="text-2xl">{type.icon}</span>
          <span>{type.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default ContentTypeSelector;
