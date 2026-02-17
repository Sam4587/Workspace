import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Send, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ImageIcon,
  Video,
  FileText
} from 'lucide-react';

export default function PublishManagement() {
  const [selectedPlatform, setSelectedPlatform] = useState('xiaohongshu');
  const [platforms, setPlatforms] = useState([]);
  const [loginStatus, setLoginStatus] = useState({});
  const [publishType, setPublishType] = useState('image_text');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // 表单数据
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [videoPath, setVideoPath] = useState('');
  const [tags, setTags] = useState('');

  // 获取平台列表
  useEffect(() => {
    fetchPlatforms();
    checkLoginStatus();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      const data = await response.json();
      if (data.success) {
        setPlatforms(data.data.platforms || ['xiaohongshu', 'douyin', 'toutiao']);
      }
    } catch (error) {
      console.log('使用默认平台列表');
      setPlatforms(['xiaohongshu', 'douyin', 'toutiao']);
    }
  };

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/xiaohongshu/check_login');
      const data = await response.json();
      setLoginStatus({ xiaohongshu: data.is_logged_in || false });
    } catch (error) {
      setLoginStatus({ xiaohongshu: false });
    }
  };

  const handleLogin = async (platform) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${platform}/login`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.img) {
        toast.info('请扫描二维码登录');
        // 显示二维码（实际应用中可以显示在模态框中）
        console.log('QR Code available');
      }
      
      toast.success('登录请求已发送，请扫描二维码');
    } catch (error) {
      toast.error('登录请求失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }

    setPublishing(true);
    try {
      const publishData = {
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
      };

      if (publishType === 'image_text') {
        publishData.images = images.filter(img => img);
      } else {
        publishData.video_path = videoPath;
      }

      const response = await fetch(`/api/${selectedPlatform}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('发布成功！');
        // 清空表单
        setTitle('');
        setContent('');
        setTags('');
        setImages([]);
        setVideoPath('');
      } else {
        toast.error('发布失败: ' + (data.error || data.message));
      }
    } catch (error) {
      toast.error('发布失败: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  const getPlatformName = (id) => {
    const names = {
      xiaohongshu: '小红书',
      douyin: '抖音',
      toutiao: '今日头条'
    };
    return names[id] || id;
  };

  const getPlatformColor = (id) => {
    const colors = {
      xiaohongshu: 'bg-red-500',
      douyin: 'bg-black',
      toutiao: 'bg-blue-500'
    };
    return colors[id] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">发布管理</h1>
          <p className="text-muted-foreground">多平台内容发布一站式管理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：平台选择和状态 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>选择平台</CardTitle>
              <CardDescription>选择要发布内容的平台</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platforms.map((platform) => (
                <div
                  key={platform}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPlatform === platform 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlatform(platform)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getPlatformColor(platform)} flex items-center justify-center text-white font-bold`}>
                        {getPlatformName(platform).charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{getPlatformName(platform)}</div>
                        <div className="text-sm text-muted-foreground">
                          {loginStatus[platform] ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> 已登录
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> 未登录
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedPlatform === platform && (
                      <Badge>已选</Badge>
                    )}
                  </div>
                </div>
              ))}

              <Button 
                className="w-full" 
                onClick={() => handleLogin(selectedPlatform)}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录 {getPlatformName(selectedPlatform)}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>发布类型</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={publishType} onValueChange={setPublishType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image_text">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    图文
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Video className="mr-2 h-4 w-4" />
                    视频
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：发布表单 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>发布内容</CardTitle>
              <CardDescription>
                发布到 {getPlatformName(selectedPlatform)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  placeholder="请输入标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  placeholder="请输入内容"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>

              {publishType === 'image_text' && (
                <div className="space-y-2">
                  <Label>图片路径（每行一个）</Label>
                  <Textarea
                    placeholder="/path/to/image1.jpg&#10;/path/to/image2.png"
                    value={images.join('\n')}
                    onChange={(e) => setImages(e.target.value.split('\n').filter(img => img.trim()))}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    请输入本地图片的绝对路径，每行一个
                  </p>
                </div>
              )}

              {publishType === 'video' && (
                <div className="space-y-2">
                  <Label htmlFor="video">视频路径</Label>
                  <Input
                    id="video"
                    placeholder="/path/to/video.mp4"
                    value={videoPath}
                    onChange={(e) => setVideoPath(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  placeholder="标签1, 标签2, 标签3"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  多个标签用逗号分隔
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    发布到 {getPlatformName(selectedPlatform)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
