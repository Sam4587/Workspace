import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Video, Wand2 } from 'lucide-react';

const VideoGeneration = () => {
  const [script, setScript] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate video generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">视频生成</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            创建视频
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">视频标题</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入视频标题..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">脚本</label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="请输入视频脚本..."
              rows={6}
            />
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !title || !script}
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isGenerating ? '生成中...' : '生成视频'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoGeneration;
