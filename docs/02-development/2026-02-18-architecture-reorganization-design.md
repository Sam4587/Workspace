# 架构重组设计文档

## 概述

本文档描述了 AI Content Flow 项目的前端架构重组方案，旨在统一内容创作入口、优化用户导航体验、并建立与独立微服务的清晰边界。

## 背景

### 当前问题

1. **导航结构分散**：内容生成和视频生成功能重叠，用户需要在多个页面间跳转
2. **功能定位模糊**：发布管理页面与独立的 mcp-publish-platform 服务关系不清晰
3. **业务流程断裂**：热点→内容生成→发布→数据分析的闭环未完全打通

### 决策依据

经过与用户讨论，确认以下决策：

| 问题 | 决策 |
|------|------|
| 发布功能定位 | 保留前端页面，作为 mcp-publish-platform 的管理界面 |
| 视频生成页面 | 合并到内容生成页面 |
| 数据分析优先级 | 中优先级，先完成架构重组 |

## 目标架构

### 新的导航结构

```
1. 总览 (/) - 仪表盘
   - 热点可视化
   - 最近活动
   - 工作流面板

2. 热点监控 (/hot-topics) - 数据源入口
   - 热点列表
   - 筛选和搜索
   - AI分析
   - 趋势可视化

3. 内容创作 (/content-creation) - 统一创作中心 ⭐ 重命名
   ├── 图文生成
   │   ├── 长文章
   │   └── 微头条
   ├── 视频生成 ← 合并原视频生成
   │   ├── 视频脚本
   │   ├── 视频渲染（Remotion）
   │   └── 视频转录
   └── 音频生成
       └── 音频脚本

4. 发布中心 (/publish-center) - 重命名
   - 平台登录管理
   - 内容发布
   - 发布状态监控
   - 调用 mcp-publish-platform REST API

5. 数据分析 (/analytics) - 效果追踪
   - 概览统计
   - 趋势分析
   - 用户行为
   - 内容质量
   - 预测分析

隐藏功能页：
- /transcription/:id - 视频转录结果
- /content-rewrite - 内容改写
```

### 页面职责

| 页面 | 职责 | 数据来源 |
|------|------|----------|
| 总览 | 快速了解系统状态 | 热点服务、工作流引擎 |
| 热点监控 | 发现和筛选热点 | NewsNow API、RSS |
| 内容创作 | 统一的内容生产 | AI服务、Remotion |
| 发布中心 | 多平台发布管理 | mcp-publish-platform API |
| 数据分析 | 效果追踪和优化 | 分析服务 |

## 技术设计

### 1. 路由重构

**修改文件**: `src/nav-items.jsx`

```jsx
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
    title: "内容创作",  // 重命名
    to: "/content-creation",  // 路由变更
    icon: <FileText className="h-4 w-4" />,
    page: <ContentCreation />,  // 组件重命名
  },
  {
    title: "发布中心",  // 重命名
    to: "/publish-center",  // 路由变更
    icon: <Send className="h-4 w-4" />,
    page: <PublishCenter />,  // 组件重命名
  },
  {
    title: "数据分析",
    to: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <Analytics />,
  },
  // 移除视频生成页面
];
```

### 2. 内容创作页面增强

**修改文件**: `src/pages/ContentGeneration.jsx` → `src/pages/ContentCreation.jsx`

新增内容类型：

```jsx
const contentTypes = [
  {
    id: 'article',
    name: '长文章',
    icon: FileText,
    description: '生成深度分析文章',
    color: 'blue'
  },
  {
    id: 'micro',
    name: '微头条',
    icon: FileText,
    description: '生成简短热点内容',
    color: 'green'
  },
  {
    id: 'video',  // 增强视频类型
    name: '视频内容',
    icon: Video,
    description: '生成视频脚本、渲染视频',
    color: 'purple',
    subTypes: ['script', 'render', 'transcribe']
  },
  {
    id: 'audio',
    name: '音频脚本',
    icon: Mic,
    description: '生成音频内容脚本',
    color: 'orange'
  }
];
```

### 3. 发布中心 API 对接

**修改文件**: `src/pages/PublishManagement.jsx` → `src/pages/PublishCenter.jsx`

API 端点配置：

```jsx
const MCP_PUBLISH_API = import.meta.env.VITE_MCP_PUBLISH_API || 'http://localhost:8080';

const publishApi = {
  checkLogin: (platform) => 
    fetch(`${MCP_PUBLISH_API}/api/${platform}/check_login`),
  
  login: (platform) => 
    fetch(`${MCP_PUBLISH_API}/api/${platform}/login`, { method: 'POST' }),
  
  publish: (platform, data) => 
    fetch(`${MCP_PUBLISH_API}/api/${platform}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  
  search: (platform, keyword) => 
    fetch(`${MCP_PUBLISH_API}/api/${platform}/search?keyword=${keyword}`),
};
```

### 4. 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 重命名 | `src/pages/ContentGeneration.jsx` → `ContentCreation.jsx` | 统一命名 |
| 重命名 | `src/pages/PublishManagement.jsx` → `PublishCenter.jsx` | 统一命名 |
| 删除 | `src/pages/VideoGeneration.jsx` | 功能已合并 |
| 修改 | `src/nav-items.jsx` | 更新导航配置 |
| 修改 | `src/App.jsx` | 更新路由配置 |
| 修改 | `src/lib/api.js` | 添加发布中心API |

## 实施计划

### 阶段一：路由重构（预计1小时）

1. 重命名 `ContentGeneration.jsx` → `ContentCreation.jsx`
2. 重命名 `PublishManagement.jsx` → `PublishCenter.jsx`
3. 更新 `nav-items.jsx` 导航配置
4. 更新 `App.jsx` 路由配置

### 阶段二：功能合并（预计2小时）

1. 在 `ContentCreation.jsx` 中增强视频内容类型
2. 添加视频渲染和转录功能入口
3. 删除 `VideoGeneration.jsx`

### 阶段三：API对接（预计2小时）

1. 配置 mcp-publish-platform API 端点
2. 更新发布中心页面的 API 调用
3. 添加错误处理和状态管理

### 阶段四：测试验证（预计1小时）

1. 验证所有页面路由正常
2. 验证内容创作功能完整
3. 验证发布中心 API 对接
4. 验证隐藏路由正常工作

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 路由变更导致书签失效 | 中 | 添加路由重定向 |
| API 对接失败 | 高 | 保留本地 API 作为备用 |
| 功能合并遗漏 | 中 | 详细测试视频相关功能 |

## 后续优化

1. **数据分析闭环**：打通发布数据回流，实现完整的数据分析
2. **工作流自动化**：热点→一键生成→自动发布
3. **多平台适配**：内容自动适配不同平台格式

## 参考文档

- [mcp-publish-platform 设计文档](../specs/mcp-publish-platform/design.md)
- [Remotion 视频生成设计](../specs/remotion-video-generation/design.md)
- [项目架构分析](../analysis/ARCHITECTURE.md)
