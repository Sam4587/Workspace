import { HomeIcon, TrendingUp, FileText, Send, BarChart3 } from "lucide-react";
import Index from "./pages/Index.jsx";
import HotTopics from "./pages/HotTopics.jsx";
import ContentGeneration from "./pages/ContentGeneration.jsx";
import Publishing from "./pages/Publishing.jsx";
import Analytics from "./pages/Analytics.jsx";

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
    to: "/publishing",
    icon: <Send className="h-4 w-4" />,
    page: <Publishing />,
  },
  {
    title: "数据分析",
    to: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <Analytics />,
  },
];
