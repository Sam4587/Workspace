import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3, TrendingUp, Globe, Share2 } from 'lucide-react';

export const CrossPlatformAnalysis = ({ data = [] }) => {
  const platforms = [
    { id: 'weibo', name: 'Weibo', color: 'bg-red-500', icon: '🔥' },
    { id: 'zhihu', name: 'Zhihu', color: 'bg-blue-500', icon: '💬' },
    { id: 'toutiao', name: 'Toutiao', color: 'bg-red-600', icon: '📰' },
    { id: 'baidu', name: 'Baidu', color: 'bg-blue-600', icon: '🔍' },
    { id: 'douyin', name: 'Douyin', color: 'bg-black', icon: '🎵' },
    { id: 'bilibili', name: 'Bilibili', color: 'bg-pink-500', icon: '📺' },
  ];

  const getPlatformData = (platformId) => {
    return data.find(d => d.platform === platformId) || { count: 0, trending: 0 };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4" />
          Cross-Platform Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => {
            const platformData = getPlatformData(platform.id);
            const hasData = platformData.count > 0;

            return (
              <div key={platform.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center text-white text-sm`}>
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{platform.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {platformData.count} topics
                      </span>
                      {hasData && (
                        <span className="flex items-center text-xs text-green-500">
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                          {platformData.trending}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className={`${platform.color} h-1.5 rounded-full transition-all`}
                      style={{ width: `${Math.min((platformData.count / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              Total Coverage
            </span>
            <span className="font-medium">
              {data.reduce((sum, d) => sum + d.count, 0)} topics across {platforms.filter(p => getPlatformData(p.id).count > 0).length} platforms
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrossPlatformAnalysis;
