import React from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

const VideoConfigPanel = ({ template, config, onChange }) => {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    onChange('images', [...config.images, ...imageUrls]);
  };

  const removeImage = (index) => {
    const newImages = [...config.images];
    newImages.splice(index, 1);
    onChange('images', newImages);
  };

  const renderFields = () => {
    switch (template.id) {
      case 'article-video':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">视频标题</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="输入视频标题"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtitle">副标题</Label>
              <Input
                id="subtitle"
                value={config.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                placeholder="输入副标题（可选）"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">文章内容</Label>
              <Textarea
                id="content"
                value={config.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="输入文章内容，每行一段"
                rows={6}
              />
              <p className="text-xs text-gray-500">支持多行，每行作为独立的显示段落</p>
            </div>
          </>
        );

      case 'micro-video':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="text">热点内容</Label>
              <Textarea
                id="text"
                value={config.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="输入热点内容"
                rows={4}
              />
              <p className="text-xs text-gray-500">建议 50 字以内</p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">配置视频内容</h3>
      
      <div className="space-y-4">
        {renderFields()}
        
        <div className="space-y-2">
          <Label>配图</Label>
          <div className="grid grid-cols-3 gap-2">
            {config.images.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  alt={`配图 ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <label className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 h-24">
              <div className="text-center">
                <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-gray-500 mt-1">添加图片</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backgroundMusic">背景音乐</Label>
          <Input
            id="backgroundMusic"
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleChange('backgroundMusic', URL.createObjectURL(file));
              }
            }}
          />
          {config.backgroundMusic && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">已选择背景音乐</span>
              <button
                onClick={() => handleChange('backgroundMusic', null)}
                className="text-red-500 text-sm hover:underline"
              >
                移除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConfigPanel;
