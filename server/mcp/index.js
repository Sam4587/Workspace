/**
 * AI Content Flow MCP Server
 * 提供标准化工具函数供AI调用
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

const server = new McpServer({
  name: "ai-content-flow",
  version: "1.0.0"
});

// ==================== 热点查询工具 ====================

server.tool(
  "get_trending_topics",
  {
    title: "获取热点话题列表",
    description: "获取多平台热点话题列表，支持按平台筛选",
    inputSchema: z.object({
      source: z.enum(["weibo", "toutiao", "zhihu", "douyin", "bilibili", "all"]).default("all").describe("数据源平台"),
      limit: z.number().min(1).max(100).default(20).describe("返回数量限制"),
      category: z.string().optional().describe("分类筛选")
    })
  },
  async ({ source, limit, category }) => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (source !== "all") params.append("source", source);
      if (category) params.append("category", category);
      
      const response = await apiClient.get(`/hot-topics?${params}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `获取热点失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "search_news",
  {
    title: "搜索新闻内容",
    description: "根据关键词搜索新闻内容",
    inputSchema: z.object({
      keyword: z.string().describe("搜索关键词"),
      limit: z.number().min(1).max(50).default(10).describe("返回数量")
    })
  },
  async ({ keyword, limit }) => {
    try {
      const response = await apiClient.get(`/hot-topics/search?q=${encodeURIComponent(keyword)}&limit=${limit}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `搜索失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "get_hot_topics_by_platform",
  {
    title: "按平台获取热点",
    description: "获取指定平台的热点话题",
    inputSchema: z.object({
      platform: z.enum(["weibo", "toutiao", "zhihu", "douyin", "bilibili", "baidu"]).describe("平台名称"),
      limit: z.number().min(1).max(50).default(20).describe("返回数量")
    })
  },
  async ({ platform, limit }) => {
    try {
      const response = await apiClient.get(`/hot-topics?source=${platform}&limit=${limit}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `获取${platform}热点失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "analyze_topic",
  {
    title: "AI分析热点话题",
    description: "使用AI深度分析热点话题",
    inputSchema: z.object({
      topic_id: z.string().describe("话题ID"),
      analysis_type: z.enum(["summary", "sentiment", "trend", "full"]).default("full").describe("分析类型")
    })
  },
  async ({ topic_id, analysis_type }) => {
    try {
      const response = await apiClient.get(`/hot-topics/${topic_id}/analyze?type=${analysis_type}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `分析失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// ==================== 内容生成工具 ====================

server.tool(
  "generate_content",
  {
    title: "AI生成内容",
    description: "基于热点话题生成内容",
    inputSchema: z.object({
      topic: z.string().describe("热点话题或标题"),
      content_type: z.enum(["article", "micro_post", "video_script", "audio_script"]).default("article").describe("内容类型"),
      style: z.enum(["professional", "casual", "humorous", "formal"]).default("professional").describe("内容风格"),
      length: z.number().min(100).max(5000).default(1000).describe("目标字数"),
      keywords: z.array(z.string()).optional().describe("关键词列表")
    })
  },
  async ({ topic, content_type, style, length, keywords }) => {
    try {
      const response = await apiClient.post("/content/generate", {
        formData: {
          topic,
          type: content_type,
          style,
          length,
          keywords: keywords || []
        },
        type: content_type
      });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `内容生成失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "optimize_title",
  {
    title: "优化标题",
    description: "使用AI优化文章标题",
    inputSchema: z.object({
      title: z.string().describe("原标题"),
      style: z.enum(["clickbait", "professional", "emotional", "question"]).default("professional").describe("标题风格"),
      platform: z.enum(["toutiao", "weibo", "wechat", "douyin"]).default("toutiao").describe("目标平台")
    })
  },
  async ({ title, style, platform }) => {
    try {
      const response = await apiClient.post("/content/optimize-title", {
        title,
        style,
        platform
      });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `标题优化失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "adapt_platform",
  {
    title: "平台适配",
    description: "将内容适配到不同平台",
    inputSchema: z.object({
      content_id: z.string().describe("内容ID"),
      target_platform: z.enum(["toutiao", "weibo", "wechat", "douyin", "xiaohongshu"]).describe("目标平台"),
      preserve_style: z.boolean().default(true).describe("是否保留原风格")
    })
  },
  async ({ content_id, target_platform, preserve_style }) => {
    try {
      const response = await apiClient.post("/content/adapt", {
        contentId: content_id,
        platform: target_platform,
        preserveStyle: preserve_style
      });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `平台适配失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// ==================== 发布管理工具 ====================

server.tool(
  "publish_to_platform",
  {
    title: "发布到平台",
    description: "发布内容到指定平台",
    inputSchema: z.object({
      content_id: z.string().describe("内容ID"),
      platform: z.enum(["toutiao", "douyin", "weibo", "xiaohongshu"]).describe("目标平台"),
      scheduled_time: z.string().optional().describe("定时发布时间(ISO 8601格式)")
    })
  },
  async ({ content_id, platform, scheduled_time }) => {
    try {
      const data = { contentId: content_id };
      if (scheduled_time) data.scheduledTime = scheduled_time;
      
      const response = await apiClient.post(`/publish/${platform}`, data);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `发布失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "get_publish_status",
  {
    title: "获取发布状态",
    description: "查询内容发布状态",
    inputSchema: z.object({
      publish_id: z.string().describe("发布记录ID")
    })
  },
  async ({ publish_id }) => {
    try {
      const response = await apiClient.get(`/publish/status/${publish_id}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `查询状态失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "get_publish_queue",
  {
    title: "获取发布队列",
    description: "查看待发布内容队列",
    inputSchema: z.object({
      page: z.number().min(1).default(1).describe("页码"),
      limit: z.number().min(1).max(50).default(20).describe("每页数量")
    })
  },
  async ({ page, limit }) => {
    try {
      const response = await apiClient.get(`/publish/queue?page=${page}&limit=${limit}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `获取队列失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// ==================== 数据分析工具 ====================

server.tool(
  "analyze_trends",
  {
    title: "分析趋势",
    description: "分析热点趋势数据",
    inputSchema: z.object({
      days: z.number().min(1).max(30).default(7).describe("统计天数"),
      category: z.string().optional().describe("分类筛选")
    })
  },
  async ({ days, category }) => {
    try {
      let url = `/analytics/trends?days=${days}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      
      const response = await apiClient.get(url);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `趋势分析失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "get_analytics_report",
  {
    title: "获取分析报告",
    description: "获取数据分析报告",
    inputSchema: z.object({
      report_type: z.enum(["daily", "weekly", "monthly"]).default("daily").describe("报告类型"),
      format: z.enum(["json", "markdown"]).default("json").describe("输出格式")
    })
  },
  async ({ report_type, format }) => {
    try {
      const response = await apiClient.get(`/analytics/report?type=${report_type}&format=${format}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `获取报告失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "get_top_content",
  {
    title: "获取热门内容排行",
    description: "获取表现最好的内容排行",
    inputSchema: z.object({
      metric: z.enum(["views", "engagement", "shares"]).default("views").describe("排序指标"),
      limit: z.number().min(1).max(50).default(10).describe("返回数量"),
      period: z.enum(["today", "week", "month"]).default("week").describe("时间范围")
    })
  },
  async ({ metric, limit, period }) => {
    try {
      const response = await apiClient.get(`/analytics/top-content?metric=${metric}&limit=${limit}&period=${period}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `获取排行失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// ==================== 系统管理工具 ====================

server.tool(
  "check_version",
  {
    title: "检查版本",
    description: "检查系统版本信息",
    inputSchema: z.object({})
  },
  async () => {
    try {
      const response = await apiClient.get("/health");
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            version: response.data.version || "1.0.0",
            status: response.data.status,
            uptime: response.data.uptime
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `检查版本失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "get_system_status",
  {
    title: "获取系统状态",
    description: "获取系统运行状态",
    inputSchema: z.object({})
  },
  async () => {
    try {
      const response = await apiClient.get("/health/detailed");
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `获取状态失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// ==================== LLM工具 ====================

server.tool(
  "list_llm_providers",
  {
    title: "列出AI提供商",
    description: "获取可用的AI提供商列表",
    inputSchema: z.object({})
  },
  async () => {
    try {
      const response = await apiClient.get("/llm/providers");
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `获取提供商失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "chat_with_ai",
  {
    title: "AI对话",
    description: "与AI进行对话",
    inputSchema: z.object({
      message: z.string().describe("用户消息"),
      system_prompt: z.string().optional().describe("系统提示词"),
      model: z.string().optional().describe("指定模型(格式: provider/model)"),
      temperature: z.number().min(0).max(2).default(0.7).describe("温度参数")
    })
  },
  async ({ message, system_prompt, model, temperature }) => {
    try {
      const response = await apiClient.post("/llm/chat", {
        message,
        system: system_prompt,
        model,
        temperature
      });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `AI对话失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// ==================== 启动服务器 ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Content Flow MCP Server 已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
