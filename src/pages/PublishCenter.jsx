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
  RefreshCw,
  Settings
} from 'lucide-react';
import api from '../lib/api';
import QrCodeModal from '../components/QrCodeModal';

const MCP_PUBLISH_API = import.meta.env.VITE_MCP_PUBLISH_API || 'http://localhost:18060';

export default function PublishCenter() {
  const [selectedPlatform, setSelectedPlatform] = useState('xiaohongshu');
  const [platforms, setPlatforms] = useState([
    { id: 'xiaohongshu', name: '小红书', color: 'bg-red-500' },
    { id: 'douyin', name: '抖音', color: 'bg-black' },
    { id: 'toutiao', name: '今日头条', color: 'bg-blue-500' }
  ]);
  const [loginStatus, setLoginStatus] = useState({});
  const [publishType, setPublishType] = useState('image_text');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [useBackendApi, setUseBackendApi] = useState(true);

  // 二维码弹窗状态
  const [showQrModal, setShowQrModal] = useState(false);
  const [loginPlatform, setLoginPlatform] = useState(null);

  // MCP 服务状态
  const [mcpStatus, setMcpStatus] = useState({ available: false, baseUrl: '' });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [videoPath, setVideoPath] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    checkMcpStatus();
    checkAllLoginStatus();
  }, []);

  // 检查 MCP 服务状态
  const checkMcpStatus = async () => {
    try {
      const result = await api.getMcpStatus();
      setMcpStatus(result.data || { available: false, baseUrl: '' });
    } catch (error) {
      console.error('检查 MCP 服务状态失败:', error);
    }
  };

  // 检查所有平台登录状态
  const checkAllLoginStatus = async () => {
    setLoading(true);
    const status = {};
    for (const platform of platforms) {
      try {
        const result = await api.checkPlatformLogin(platform.id);
        status[platform.id] = result.isLoggedIn || false;
      } catch {
        status[platform.id] = false;
      }
    }
    setLoginStatus(status);
    setLoading(false);
  };

  // 处理登录
  const handleLogin = (platform) => {
    setLoginPlatform(platform);
    setShowQrModal(true);
  };

  // 登录成功回调
  const handleLoginSuccess = (platform) => {
    toast.success(`${getPlatformName(platform)} 登录成功！`);
    setLoginStatus(prev => ({ ...prev, [platform]: true }));
    setShowQrModal(false);
  };

  // 发布内容
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }

    if (!loginStatus[selectedPlatform]) {
      toast.error('请先登录目标平台');
      return;
    }

    setPublishing(true);
    try {
      const publishData = {
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        publishType,
        images: publishType === 'image_text' ? images.filter(img => img) : [],
        videoPath: publishType === 'video' ? videoPath : ''
      };

      const result = await api.publishToMcp(selectedPlatform, publishData);

      if (result.success) {
        toast.success('发布成功！');
        if (result.feedUrl) {
          toast.info(`查看内容: ${result.feedUrl}`, { duration: 5000 });
        }
        // 清空表单
        setTitle('');
        setContent('');
        setTags('');
        setImages([]);
        setVideoPath('');
      } else {
        toast.error('发布失败: ' + (result.error || result.message));
      }
    } catch (error) {
      toast.error('发布失败: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  const getPlatformName = (id) => {
    const platform = platforms.find(p => p.id === id);
    return platform?.name || id;
  };

  const getPlatformColor = (id) => {
    const platform = platforms.find(p => p.id === id);
    return platform?.color || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">发布中心</h1>
          <p className="text-muted-foreground">多平台内容发布一站式管理</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* MCP 服务状态 */}
          <div className="flex items-center space-x-2">
            <Badge variant={mcpStatus.available ? "default" : "secondary"} className={mcpStatus.available ? "bg-green-600" : ""}>
              {mcpStatus.available ? 'MCP 服务在线' : 'MCP 服务离线'}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={checkAllLoginStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：平台选择 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>选择平台</CardTitle>
              <CardDescription>选择要发布内容的平台</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPlatform === platform.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white font-bold`}>
                        {platform.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{platform.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {loginStatus[platform.id] ? (
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
                    {selectedPlatform === platform.id && (
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

          {/* 发布类型 */}
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

        {/* 右侧：发布内容 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>发布内容</CardTitle>
              <CardDescription>
                发布到 {getPlatformName(selectedPlatform)}
                {!loginStatus[selectedPlatform] && (
                  <span className="text-red-500 ml-2">(请先登录)</span>
                )}
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
                disabled={publishing || !loginStatus[selectedPlatform]}
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

      {/* 二维码登录弹窗 */}
      <QrCodeModal
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        platform={loginPlatform}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
