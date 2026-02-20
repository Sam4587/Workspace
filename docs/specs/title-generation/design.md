---
title: 智能标题生成功能 - 设计文档
category: 功能规格
tags: [标题生成, 吸引力, 合规性, 内容创作]
created: 2026-02-20
version: v1.0
---

# 智能标题生成功能 - 设计文档

## 一、功能概述

### 1.1 核心目标

智能标题生成功能旨在解决内容创作中的两大核心需求：

| 需求 | 说明 |
|------|------|
| **吸引力** | 提升读者点击率和阅读兴趣 |
| **合规性** | 遵守平台规范与法律法规 |

### 1.2 业务流程

```
热点分析 → 标题生成 → 合规检测 → 吸引力评分 → 用户选择 → 内容创作
```

---

## 二、技术架构

### 2.1 服务层

| 服务 | 文件 | 功能 |
|------|------|------|
| 标题生成服务 | `titleGenerationService.js` | 核心标题生成逻辑 |
| AI服务 | `multiAIService.js` | LLM调用 |
| 热点分析服务 | `enhancedAIAnalysisService.js` | 热点趋势分析 |

### 2.2 API端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/contents/generate-titles` | POST | 生成标题 |
| `/api/contents/optimize-title` | POST | 优化标题 |
| `/api/contents/check-title-compliance` | POST | 合规检查 |
| `/api/contents/title-platforms` | GET | 获取平台规则 |
| `/api/contents/viral-patterns` | GET | 获取爆款模式 |

### 2.3 前端组件

| 组件 | 文件 | 功能 |
|------|------|------|
| 标题生成器 | `TitleGenerator.jsx` | 标题生成界面 |
| 热点转内容 | `HotTopicToContent.jsx` | 热点到内容的完整流程 |

---

## 三、标题生成策略

### 3.1 爆款模式库

| 模式 | 说明 | 评分 |
|------|------|------|
| 数字型 | 用数字增加可信度和吸引力 | 90 |
| 疑问型 | 引发好奇心和点击欲望 | 85 |
| 对比型 | 制造反差，突出价值 | 88 |
| 情感型 | 触发情感共鸣 | 82 |
| 悬念型 | 制造悬念，引发好奇 | 87 |
| 利益型 | 突出实用价值 | 80 |

### 3.2 合规词库

#### 绝对化用语（广告法禁止）
- 最、第一、唯一、绝对、100%、顶级、最强、最好、最大、最小

#### 夸大宣传词
- 震惊、惊呆、疯了、吓死、吓哭、惊爆、曝光、揭秘、内幕

#### 医疗相关
- 治愈、疗效、药效、处方、根治、神药、秘方

#### 金融相关
- 保本、保收益、稳赚、必赚、暴富、躺赚

### 3.3 平台规则

| 平台 | 标题长度 | 推荐模式 | 风格特点 |
|------|---------|---------|---------|
| 今日头条 | 10-30字 | 数字、疑问、对比 | 新闻资讯风格 |
| 抖音 | 5-30字 | 情感、悬念、疑问 | 口语化、接地气 |
| 小红书 | 8-50字 | 利益、情感、数字 | 种草分享风格 |
| 微博 | 5-50字 | 情感、对比、悬念 | 热点评论风格 |
| 哔哩哔哩 | 8-80字 | 数字、疑问、对比 | 年轻化、有趣 |
| 知乎 | 10-50字 | 疑问、对比、利益 | 专业理性风格 |

---

## 四、评分机制

### 4.1 吸引力评分

```javascript
// 评分因素
{
  viralPattern: 0.1,      // 爆款模式匹配
  keywordMatch: 5,        // 关键词匹配（每个）
  emotionalTrigger: 3,    // 情感触发词
  numberIncluded: 5,      // 包含数字
  questionMark: 5,        // 疑问句
  compliance: -20         // 不合规扣分
}
```

### 4.2 总分计算

```
totalScore = viralScore * 0.6 + clickScore * 0.4
```

### 4.3 点击预测

| 总分 | 预测 |
|------|------|
| ≥70 | 高 |
| 50-69 | 中 |
| <50 | 低 |

---

## 五、使用示例

### 5.1 生成标题

```javascript
// API调用
const response = await api.generateTitles({
  topic: '人工智能最新突破',
  keywords: ['AI', 'GPT', '大模型'],
  platform: 'toutiao',
  count: 6,
  style: 'balanced'
});

// 返回结果
{
  success: true,
  titles: [
    {
      title: "5个AI大模型突破，第3个改变了我对AI的认知",
      pattern: "数字型",
      compliance: true,
      viralScore: 92,
      clickScore: 88,
      totalScore: 90,
      clickPrediction: "高"
    },
    // ...
  ]
}
```

### 5.2 合规检查

```javascript
const result = await api.checkTitleCompliance(
  "最强AI大模型震撼发布",
  "toutiao"
);

// 返回结果
{
  compliant: false,
  issues: [
    { type: "forbidden_word", word: "最强", severity: "high" }
  ],
  suggestion: "请替换"最强"，该词属于absolute类违禁词"
}
```

---

## 六、集成到热点分析流程

### 6.1 流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  热点监控    │────▶│  AI分析     │────▶│  标题生成    │
│  (HotTopics) │     │  (趋势/情感) │     │  (吸引力+合规)│
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  发布管理    │◀────│  内容创作    │◀────│  标题选择    │
│  (Publish)  │     │  (Creation) │     │  (用户确认)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 6.2 组件集成

```jsx
// 在热点页面使用
<HotTopicToContent
  topic={selectedTopic}
  onGenerateContent={(data) => {
    navigate('/content-creation', { state: data });
  }}
/>
```

---

## 七、后续优化方向

1. **A/B测试**：跟踪不同标题的实际点击率，优化评分模型
2. **个性化推荐**：根据用户历史偏好推荐标题风格
3. **实时热点融合**：将热点关键词自动融入标题
4. **多语言支持**：支持生成英文、日文等多语言标题
