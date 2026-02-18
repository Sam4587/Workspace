# AI 标题优化功能设计方案

## 1. 需求概述

在内容创作页面添加 **AI智能标题优化** 功能：
- 支持从热点监控页面跳转时带来热点数据
- 用户确认主题后，调用 AI 生成多个符合平台规范的爆款标题选项
- 内容生成后可再次优化标题

## 2. 平台规范数据（使用现有文件）

| 平台 | 标题长度限制 | 禁用词汇 |
|------|-------------|----------|
| 今日头条 | ≤30字符 | 最、第一、唯一、绝对、100% |
| 抖音 | ≤30字符 | 同上 |
| 小红书 | 无明确限制 | 违禁词库 |

## 3. 系统架构

### 3.1 后端新增 API

```
POST /api/contents/optimize-title
   输入: { title, keywords, targetPlatform }
   输出: {
     success: true,
     data: {
       optimizedTitles: [
         { title: "xxx", compliance: true, reason: "符合规范" },
         { title: "xxx", compliance: false, reason: "包含违禁词" }
       ]
     }
   }
```

### 3.2 前端新增组件

```
src/components/
  └── TitleOptimizer.jsx      # 标题优化组件（新增）
```

### 3.3 现有文件修改

| 文件 | 修改内容 |
|------|----------|
| `server/services/aiService.js` | 新增 optimizeTitle 方法 |
| `server/routes/contents.js` | 新增 /optimize-title 路由 |
| `src/pages/ContentCreation.jsx` | 集成标题优化功能 |
| `src/lib/api.js` | 新增 optimizeTitle API 方法 |

## 4. 功能流程

### 4.1 主流程

```
┌─────────────────┐
│  热点跳转带来   │
│  热点数据       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  用户确认主题   │
│  (可修改)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ 点击"AI优化标题" │────▶│ 调用AI生成      │
│                 │     │ 3-5个标题选项   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ 选择标题        │◀────│ 显示选项+合规  │
│ 继续生成内容    │     │ 性标签          │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ AI生成内容      │────▶│ 可选：再次     │
│                 │     │ 优化标题        │
└─────────────────┘     └─────────────────┘
```

### 4.2 标题优化 Prompt 设计

```prompt
请基于以下主题生成 {n} 个适合发布到 {platform} 的爆款标题。

主题: {title}
关键词: {keywords}

要求：
1. 标题长度控制在 {maxLength} 字符以内
2. 避免使用以下违禁词：{forbiddenWords}
3. 标题要有吸引力，能引发用户点击
4. 标题应准确反映内容，避免标题党
5. 每个标题需标注是否符合规范

请以JSON格式返回：
[
  {
    "title": "标题内容",
    "compliance": true/false,
    "reason": "合规性说明"
  }
]
```

## 5. 数据模型

### 5.1 标题优化请求

```javascript
{
  title: string,          // 用户输入的原始标题
  keywords: string[],     // 关键词数组
  targetPlatform: string, // 目标平台 (toutiao/douyin/xiaohongshu)
  count: number           // 生成数量 (默认5)
}
```

### 5.2 标题优化响应

```javascript
{
  optimizedTitles: [
    {
      title: string,
      compliance: boolean,
      reason: string,
      score: number // 爆款潜力评分 0-100
    }
  ]
}
```

## 6. 平台规范配置

```javascript
// server/config/platformRules.js (新建)
const platformRules = {
  toutiao: {
    maxTitleLength: 30,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%'],
    recommendedPatterns: ['数字+悬念', '对比反差', '热点+观点']
  },
  douyin: {
    maxTitleLength: 30,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%'],
    recommendedPatterns: ['口语化', '疑问句', '情绪化']
  },
  xiaohongshu: {
    maxTitleLength: 50,
    forbiddenWords: ['违规词库'],
    recommendedPatterns: ['种草感', '个人体验', '情感共鸣']
  }
};
```

## 7. 实施计划

### Phase 1: 后端 API
- [ ] 创建平台规范配置文件
- [ ] 在 aiService.js 中新增标题优化方法
- [ ] 新增 /optimize-title 路由
- [ ] 前端 API 方法封装

### Phase 2: 前端组件
- [ ] 创建 TitleOptimizer 组件
- [ ] 在 ContentCreation 页面集成

### Phase 3: 功能增强
- [ ] 支持内容生成后再次优化标题
- [ ] 优化用户体验和加载状态
- [ ] 添加缓存减少 API 调用

## 8. 验收标准

1. ✅ 从热点页面跳转后，主题自动填充
2. ✅ 点击"AI优化标题"生成3-5个选项
3. ✅ 每个标题显示合规性标签
4. ✅ 用户选择标题后继续生成内容
5. ✅ 内容生成后可再次优化标题
