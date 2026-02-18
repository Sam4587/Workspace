import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Wand2, Sparkles } from 'lucide-react';

const contentTypes = [
  { id: 'article', label: '文章' },
  { id: 'social', label: '社交媒体' },
  { id: 'email', label: '邮件' },
  { id: 'script', label: '视频脚本' },
];

const tones = [
  { id: 'professional', label: '专业' },
  { id: 'casual', label: '轻松' },
  { id: 'humorous', label: '幽默' },
  { id: 'formal', label: '正式' },
];

export const GenerationForm = ({ onGenerate, initialData }) => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('article');
  const [tone, setTone] = useState('professional');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTopic(initialData.topic || initialData.title || '');
      setKeywords(initialData.keywords || '');
      setTone(initialData.tone || 'professional');
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    await onGenerate({
      topic,
      contentType,
      tone,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    });
    
    setIsGenerating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          内容生成
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">主题 / 标题</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="请输入主题或标题..."
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">内容类型</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">语气</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">关键词（用逗号分隔）</label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如：AI, 科技, 未来"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isGenerating || !topic}
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isGenerating ? '生成中...' : '生成内容'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GenerationForm;
