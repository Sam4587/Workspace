import { HomeIcon, TrendingUp, FileText, BarChart3, Send } from "lucide-react";
import Index from "./pages/Index.jsx";
import HotTopics from "./pages/HotTopics.jsx";
import ContentCreation from "./pages/ContentCreation.jsx";
import Analytics from "./pages/Analytics.jsx";
import TranscriptionResult from "./pages/TranscriptionResult.jsx";
import ContentRewrite from "./pages/ContentRewrite.jsx";
import PublishCenter from "./pages/PublishCenter.jsx";

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
    title: "内容创作",
    to: "/content-creation",
    icon: <FileText className="h-4 w-4" />,
    page: <ContentCreation />,
  },
  {
    title: "发布中心",
    to: "/publish-center",
    icon: <Send className="h-4 w-4" />,
    page: <PublishCenter />,
  },
  {
    title: "数据分析",
    to: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <Analytics />,
  },
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
