import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Flame, MessageCircle } from 'lucide-react';

// 平台来源翻译映射
const SOURCE_TRANSLATIONS = {
  'weibo': '微博热搜',
  'weixin': '微信',
  'zhihu': '知乎',
  'douyin': '抖音',
  'bilibili': '哔哩哔哩',
  'toutiao': '今日头条',
  'xiaohongshu': '小红书',
  'baidu': '百度热搜',
  'tieba': '贴吧热议',
  'thepaper': '澎湃新闻',
  'ifeng': '凤凰网',
  'wallstreetcn-hot': '华尔街见闻',
  'cls-hot': '财联社热门',
  'bilibili-hot-search': 'B站热搜',
  'unknown': '未知'
};

const translateSource = (source) => {
  return SOURCE_TRANSLATIONS[source] || source;
};

export const TopicCard = ({ topic, onClick }) => {
  const getIcon = () => {
    switch (topic.source) {
      case 'weibo':
        return <Flame className="h-4 w-4 text-red-500" />;
      case 'zhihu':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium line-clamp-1">{topic.title}</CardTitle>
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{translateSource(topic.source)}</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {topic.hotScore || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicCard;
