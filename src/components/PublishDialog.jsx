import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle, XCircle, Send, ExternalLink } from 'lucide-react';
import api from '../lib/api';

/**
 * 发布对话框组件
 * 用于选择平台并发布内容
 */
export default function PublishDialog({
  open,
  onClose,
  content,
  onPublishSuccess
}) {
  const [platforms, setPlatforms] = useState([
    { id: 'xiaohongshu', name: '小红书', checked: false, loggedIn: false },
    { id: 'douyin', name: '抖音', checked: false, loggedIn: false },
    { id: 'toutiao', name: '今日头条', checked: false, loggedIn: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState([]);
  const [publishStatus, setPublishStatus] = useState('idle'); // idle, publishing, success, partial, failed

  // 检查各平台登录状态
  useEffect(() => {
    if (open) {
      checkAllLoginStatus();
    }
  }, [open]);

  const checkAllLoginStatus = async () => {
    setLoading(true);
    const updatedPlatforms = await Promise.all(
      platforms.map(async (platform) => {
        try {
          const result = await api.checkPlatformLogin(platform.id);
          return { ...platform, loggedIn: result.isLoggedIn || false };
        } catch {
          return { ...platform, loggedIn: false };
        }
      })
    );
    setPlatforms(updatedPlatforms);
    setLoading(false);
  };

  const handlePlatformToggle = (platformId) => {
    setPlatforms(platforms.map(p =>
      p.id === platformId ? { ...p, checked: !p.checked } : p
    ));
  };

  const selectedPlatforms = platforms.filter(p => p.checked);
  const canPublish = selectedPlatforms.length > 0 && selectedPlatforms.every(p => p.loggedIn);

  // 执行发布
  const handlePublish = async () => {
    if (!content || selectedPlatforms.length === 0) return;

    setPublishing(true);
    setPublishStatus('publishing');
    setPublishResults([]);

    const results = [];
    for (const platform of selectedPlatforms) {
      try {
        const result = await api.publishToMcp(platform.id, {
          title: content.title,
          content: content.content,
          images: content.images || [],
          tags: content.tags || [],
          publishType: content.publishType || 'image_text'
        });
        results.push({
          platform: platform.id,
          platformName: platform.name,
          success: result.success,
          feedId: result.feedId,
          feedUrl: result.feedUrl,
          error: result.error || result.message
        });
      } catch (error) {
        results.push({
          platform: platform.id,
          platformName: platform.name,
          success: false,
          error: error.message
        });
      }
    }

    setPublishResults(results);
    setPublishing(false);

    const successCount = results.filter(r => r.success).length;
    if (successCount === results.length) {
      setPublishStatus('success');
    } else if (successCount > 0) {
      setPublishStatus('partial');
    } else {
      setPublishStatus('failed');
    }

    if (successCount > 0 && onPublishSuccess) {
      onPublishSuccess(results.filter(r => r.success));
    }
  };

  const getStatusBadge = () => {
    switch (publishStatus) {
      case 'publishing':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />发布中...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />发布成功</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-orange-500"><CheckCircle className="w-3 h-3 mr-1" />部分成功</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />发布失败</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            发布内容
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            选择要发布的平台，确保已登录目标平台
          </DialogDescription>
        </DialogHeader>

        {/* 内容预览 */}
        {content && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">{content.title}</h4>
            <p className="text-xs text-gray-500 line-clamp-2">{content.content}</p>
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {content.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 平台选择 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">选择发布平台</Label>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    platform.checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  } ${!platform.loggedIn ? 'opacity-60' : 'cursor-pointer hover:border-blue-300'}`}
                  onClick={() => platform.loggedIn && handlePlatformToggle(platform.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={platform.id}
                      checked={platform.checked}
                      disabled={!platform.loggedIn}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <Label htmlFor={platform.id} className="cursor-pointer">
                      {platform.name}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    {platform.loggedIn ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        已登录
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        未登录
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 发布结果 */}
        {publishResults.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">发布结果</Label>
            <div className="space-y-2">
              {publishResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 border rounded ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">{result.platformName}</span>
                  </div>
                  {result.success && result.feedUrl && (
                    <a
                      href={result.feedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {!result.success && (
                    <span className="text-xs text-red-600">{result.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          {publishStatus === 'idle' && (
            <Button
              onClick={handlePublish}
              disabled={!canPublish || publishing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              发布到 {selectedPlatforms.length} 个平台
            </Button>
          )}
          {publishStatus !== 'idle' && publishStatus !== 'publishing' && (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
