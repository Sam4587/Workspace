import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ImageIcon,
  Video,
  ExternalLink,
  Settings
} from 'lucide-react';

const MCP_PUBLISH_API = import.meta.env.VITE_MCP_PUBLISH_API || 'http://localhost:8080';

const publishApi = {
  checkLogin: async (platform) => {
    try {
      const response = await fetch(`${MCP_PUBLISH_API}/api/${platform}/check_login`);
      return await response.json();
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return { is_logged_in: false };
    }
  },
  
  login: async (platform) => {
    try {
      const response = await fetch(`${MCP_PUBLISH_API}/api/${platform}/login`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('登录请求失败:', error);
      throw error;
    }
  },
  
  publish: async (platform, data) => {
    try {
      const response = await fetch(`${MCP_PUBLISH_API}/api/${platform}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('发布请求失败:', error);
      throw error;
    }
  },
  
  search: async (platform, keyword) => {
    try {
      const response = await fetch(`${MCP_PUBLISH_API}/api/${platform}/search?keyword=${encodeURIComponent(keyword)}`);
      return await response.json();
    } catch (error) {
      console.error('搜索请求失败:', error);
      return { notes: [] };
    }
  }
};

const localApi = {
  checkLogin: async (platform) => {
    try {
      const response = await fetch(`/api/${platform}/check_login`);
      return await response.json();
    } catch (error) {
      return { is_logged_in: false };
    }
  },
  
  login: async (platform) => {
    try {
      const response = await fetch(`/api/${platform}/login`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  
  publish: async (platform, data) => {
    try {
      const response = await fetch(`/api/${platform}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

export default function PublishCenter() {
  const [selectedPlatform, setSelectedPlatform] = useState('xiaohongshu');
  const [platforms, setPlatforms] = useState([]);
  const [loginStatus, setLoginStatus] = useState({});
  const [publishType, setPublishType] = useState('image_text');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [useMcpApi, setUseMcpApi] = useState(true);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [videoPath, setVideoPath] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchPlatforms();
    checkAllLoginStatus();
  }, []);

  const fetchPlatforms = async () => {
    setPlatforms(['xiaohongshu', 'douyin', 'toutiao']);
  };

  const checkAllLoginStatus = async () => {
    const api = useMcpApi ? publishApi : localApi;
    const status = {};
    for (const platform of ['xiaohongshu', 'douyin', 'toutiao']) {
      try {
        const result = await api.checkLogin(platform);
        status[platform] = result.is_logged_in || false;
      } catch {
        status[platform] = false;
      }
    }
    setLoginStatus(status);
  };

  const handleLogin = async (platform) => {
    setLoading(true);
    const api = useMcpApi ? publishApi : localApi;
    try {
      const data = await api.login(platform);
      
      if (data.img) {
        toast.info('请扫描二维码登录');
      }
      
      toast.success('登录请求已发送，请扫描二维码');
      setTimeout(() => checkAllLoginStatus(), 2000);
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
    const api = useMcpApi ? publishApi : localApi;
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

      const data = await api.publish(selectedPlatform, publishData);

      if (data.success) {
        toast.success('发布成功！');
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
          <h1 className="text-3xl font-bold">发布中心</h1>
          <p className="text-muted-foreground">多平台内容发布一站式管理</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">API模式:</span>
            <button
              onClick={() => setUseMcpApi(!useMcpApi)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                useMcpApi 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {useMcpApi ? 'MCP服务' : '本地API'}
            </button>
          </div>
          {useMcpApi && (
            <a
              href={`${MCP_PUBLISH_API}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">MCP服务状态</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
