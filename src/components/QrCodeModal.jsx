import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../lib/api';

/**
 * 二维码登录弹窗组件
 * 用于展示平台登录二维码并轮询登录状态
 */
export default function QrCodeModal({
  open,
  onClose,
  platform,
  onLoginSuccess
}) {
  const [qrcodeImage, setQrcodeImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [loginStatus, setLoginStatus] = useState('pending'); // pending, success, timeout, error
  const [error, setError] = useState(null);

  const platformNames = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    toutiao: '今日头条',
    weibo: '微博',
    bilibili: 'B站'
  };

  // 获取二维码
  const fetchQrcode = useCallback(async () => {
    if (!platform) return;

    setLoading(true);
    setError(null);
    setLoginStatus('pending');

    try {
      const result = await api.getLoginQrcode(platform);
      if (result.success && result.qrcodeImage) {
        setQrcodeImage(result.qrcodeImage);
        // 开始轮询登录状态
        startPolling();
      } else {
        setError(result.message || '获取二维码失败');
        setLoginStatus('error');
      }
    } catch (err) {
      setError(err.message || '获取二维码失败');
      setLoginStatus('error');
    } finally {
      setLoading(false);
    }
  }, [platform]);

  // 开始轮询登录状态
  const startPolling = useCallback(() => {
    setPolling(true);
  }, []);

  // 轮询登录状态
  useEffect(() => {
    if (!polling || !platform) return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await api.checkPlatformLogin(platform);
        if (result.isLoggedIn) {
          setLoginStatus('success');
          setPolling(false);
          // 通知父组件登录成功
          if (onLoginSuccess) {
            onLoginSuccess(platform);
          }
        }
      } catch (err) {
        console.error('检查登录状态失败:', err);
      }
    }, 3000); // 每3秒检查一次

    // 设置超时
    const timeout = setTimeout(() => {
      if (loginStatus === 'pending') {
        setLoginStatus('timeout');
        setPolling(false);
      }
    }, 120000); // 2分钟超时

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [polling, platform, loginStatus, onLoginSuccess]);

  // 弹窗打开时获取二维码
  useEffect(() => {
    if (open && platform) {
      fetchQrcode();
    }
  }, [open, platform, fetchQrcode]);

  // 关闭弹窗时重置状态
  useEffect(() => {
    if (!open) {
      setQrcodeImage(null);
      setPolling(false);
      setLoginStatus('pending');
      setError(null);
    }
  }, [open]);

  const handleRefresh = () => {
    fetchQrcode();
  };

  const getStatusMessage = () => {
    switch (loginStatus) {
      case 'pending':
        return { text: '请使用手机APP扫描二维码登录', icon: null };
      case 'success':
        return { text: '登录成功!', icon: <CheckCircle className="w-6 h-6 text-green-500" /> };
      case 'timeout':
        return { text: '登录超时，请重新扫码', icon: <XCircle className="w-6 h-6 text-orange-500" /> };
      case 'error':
        return { text: error || '登录失败，请重试', icon: <XCircle className="w-6 h-6 text-red-500" /> };
      default:
        return { text: '', icon: null };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>登录 {platformNames[platform] || platform}</DialogTitle>
          <DialogDescription>
            使用{platformNames[platform] || platform}手机APP扫描下方二维码完成登录
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {/* 二维码区域 */}
          <div className="relative w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">正在获取二维码...</span>
              </div>
            ) : qrcodeImage ? (
              <img
                src={qrcodeImage}
                alt="登录二维码"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-sm text-gray-500">暂无二维码</span>
            )}
          </div>

          {/* 状态提示 */}
          <div className="flex items-center space-x-2">
            {statusInfo.icon}
            <span className={`text-sm ${
              loginStatus === 'success' ? 'text-green-600' :
              loginStatus === 'error' || loginStatus === 'timeout' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {statusInfo.text}
            </span>
          </div>

          {/* 轮询状态指示器 */}
          {polling && loginStatus === 'pending' && (
            <div className="flex items-center space-x-2 text-sm text-blue-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>等待扫码登录...</span>
            </div>
          )}

          {/* 刷新按钮 */}
          {(loginStatus === 'timeout' || loginStatus === 'error') && (
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新二维码
            </Button>
          )}

          {/* 成功后的操作 */}
          {loginStatus === 'success' && (
            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              完成
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
