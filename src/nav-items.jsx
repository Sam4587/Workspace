import { HomeIcon, TrendingUp, FileText, BarChart3, Video } from "lucide-react";
import Index from "./pages/Index.jsx";
import HotTopics from "./pages/HotTopics.jsx";
import ContentGeneration from "./pages/ContentGeneration.jsx";
import Analytics from "./pages/Analytics.jsx";
import VideoGeneration from "./pages/VideoGeneration.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 * 
 * 注：发布管理功能已迁移至独立项目 publisher-tools
 * 详见 PROJECT_SEPARATION.md
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
];
