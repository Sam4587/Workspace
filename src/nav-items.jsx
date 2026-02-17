import { HomeIcon, TrendingUp, FileText, BarChart3, Video, Send } from "lucide-react";
import Index from "./pages/Index.jsx";
import HotTopics from "./pages/HotTopics.jsx";
import ContentGeneration from "./pages/ContentGeneration.jsx";
import Analytics from "./pages/Analytics.jsx";
import VideoGeneration from "./pages/VideoGeneration.jsx";
import TranscriptionResult from "./pages/TranscriptionResult.jsx";
import ContentRewrite from "./pages/ContentRewrite.jsx";
import PublishManagement from "./pages/PublishManagement.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "总览",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "热点监控",
    to: "/hot-topics",
    icon: <TrendingUp className="h-4 w-4" />,
    page: <HotTopics />,
  },
  {
    title: "内容生成",
    to: "/content-generation",
    icon: <FileText className="h-4 w-4" />,
    page: <ContentGeneration />,
  },
  {
    title: "发布管理",
    to: "/publish-management",
    icon: <Send className="h-4 w-4" />,
    page: <PublishManagement />,
  },
  {
    title: "数据分析",
    to: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <Analytics />,
  },
  {
    title: "视频生成",
    to: "/video-generation",
    icon: <Video className="h-4 w-4" />,
    page: <VideoGeneration />,
  },
  // 隐藏路由（不在导航菜单中显示）
  {
    title: "转录结果",
    to: "/transcription/:videoId",
    page: <TranscriptionResult />,
    hidden: true
  },
  {
    title: "内容改写",
    to: "/content-rewrite",
    page: <ContentRewrite />,
    hidden: true
  }
];
