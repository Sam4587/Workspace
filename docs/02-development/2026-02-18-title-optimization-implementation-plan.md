# AI 标题优化功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在内容创作页面添加 AI 智能标题优化功能，支持生成多个符合平台规范的爆款标题选项

**Architecture:** 后端新增标题优化 API，前端新增 TitleOptimizer 组件，与现有热点-内容关联功能集成

**Tech Stack:** React + Node.js + Express + AI Service

---

## 实施任务清单

### 任务 1: 创建平台规范配置文件

**Files:**
- Create: `server/config/platformRules.js`

**Step 1: 创建平台规范配置文件**

```javascript
// server/config/platformRules.js
const platformRules = {
  toutiao: {
    name: '今日头条',
    maxTitleLength: 30,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%', '顶级', '最强'],
    requiredPatterns: [],
    recommendedPatterns: ['数字+悬念', '对比反差', '热点+观点', '疑问句']
  },
  douyin: {
    name: '抖音',
    maxTitleLength: 30,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%', '顶级', '最强'],
    requiredPatterns: [],
    recommendedPatterns: ['口语化', '疑问句', '情绪化', '话题感']
  },
  xiaohongshu: {
    name: '小红书',
    maxTitleLength: 50,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%'],
    requiredPatterns: [],
    recommendedPatterns: ['种草感', '个人体验', '情感共鸣', '干货型']
  }
};

module.exports = platformRules;
```

**Step 2: 提交**
```bash
git add server/config/platformRules.js
git commit -m "feat: 添加平台标题规范配置"
```

---

### 任务 2: 后端 AI 标题优化服务

**Files:**
- Modify: `server/services/aiService.js` (在文件末尾添加新方法)

**Step 1: 添加标题优化方法到 aiService.js**

在 `module.exports = new AIService();` 之前添加：

```javascript
/**
 * 优化标题 - 生成符合平台规范的爆款标题
 * @param {Object} params - 优化参数
 * @param {string} params.title - 原始标题
 * @param {string[]} params.keywords - 关键词
 * @param {string} params.targetPlatform - 目标平台
 * @param {number} params.count - 生成数量
 */
async optimizeTitle({ title, keywords = [], targetPlatform = 'toutiao', count = 5 }) {
  try {
    const platformRules = require('../config/platformRules');
    const rules = platformRules[targetPlatform] || platformRules.toutiao;
    
    const prompt = `请基于以下主题生成 ${count} 个适合发布到 ${rules.name} 的爆款标题。

主题: ${title}
关键词: ${keywords.join(', ')}

要求：
1. 标题长度控制在 ${rules.maxTitleLength} 字符以内
2. 避免使用以下违禁词：${rules.forbiddenWords.join(', ')}
3. 标题要有吸引力，能引发用户点击
4. 标题应准确反映内容，避免标题党
5. 每个标题需评估爆款潜力 (0-100分)

请以JSON格式返回：
[
  {
    "title": "标题内容",
    "compliance": true/false,
    "reason": "合规性说明",
    "score": 爆款潜力评分
  }
]`;

    const aiResponse = await multiAIService.generateContent(prompt, {
      model: this.defaultModel,
      maxTokens: 1500,
      temperature: 0.8
    });

    // 解析 JSON 响应
    let optimizedTitles = [];
    try {
      const jsonMatch = aiResponse.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        optimizedTitles = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('解析标题优化结果失败:', parseError);
      // 手动解析
      optimizedTitles = this.parseTitleResponse(aiResponse.content, rules);
    }

    return {
      success: true,
      optimizedTitles
    };
  } catch (error) {
    logger.error('标题优化失败:', { error: error.message });
    throw new Error('标题优化失败: ' + error.message);
  }
}

/**
 * 手动解析标题优化响应
 */
parseTitleResponse(response, rules) {
  const titles = [];
  const lines = response.split('\n');
  let currentTitle = null;
  
  for (const line of lines) {
    if (line.includes('"title"') || line.includes("'title'")) {
      const match = line.match(/["']([^"']+)["']/);
      if (match) {
        currentTitle = { title: match[1], compliance: true, score: 75 };
      }
    } else if (line.includes('compliance') && currentTitle) {
      currentTitle.compliance = !line.includes('false');
      currentTitle.reason = currentTitle.compliance ? '符合规范' : '可能不合规';
    } else if (line.includes('score') && currentTitle) {
      const scoreMatch = line.match(/\d+/);
      if (scoreMatch) {
        currentTitle.score = parseInt(scoreMatch[0]);
      }
      titles.push(currentTitle);
      currentTitle = null;
    }
  }
  
  return titles.length > 0 ? titles : [{ title: '标题解析失败', compliance: false, reason: '解析错误', score: 0 }];
}
```

**Step 2: 提交**
```bash
git add server/services/aiService.js
git commit -m "feat: 添加 AI 标题优化方法"
```

---

### 任务 3: 后端 API 路由

**Files:**
- Modify: `server/routes/contents.js` (在文件末尾添加新路由)

**Step 1: 添加标题优化路由**

在 `module.exports = router;` 之前添加：

```javascript
/**
 * POST /api/contents/optimize-title
 * AI 优化标题
 */
router.post('/optimize-title', async (req, res) => {
  try {
    const { title, keywords, targetPlatform = 'toutiao', count = 5 } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '标题不能为空'
      });
    }

    if (!aiService) {
      return res.status(500).json({
        success: false,
        message: 'AI服务不可用'
      });
    }

    const result = await aiService.optimizeTitle({
      title,
      keywords: keywords || [],
      targetPlatform,
      count
    });

    res.json(result);
  } catch (error) {
    logger.error('[ContentAPI] 标题优化失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

**Step 2: 提交**
```bash
git add server/routes/contents.js
git commit -m "feat: 添加标题优化 API 路由"
```

---

### 任务 4: 前端 API 封装

**Files:**
- Modify: `src/lib/api.js`

**Step 1: 添加标题优化 API 方法**

在 `async generateAIContent` 方法之后添加：

```javascript
async optimizeTitle(params) {
  try {
    const response = await this.client.post('/contents/optimize-title', params);
    return response;
  } catch (error) {
    console.error('标题优化失败:', error);
    return {
      success: false,
      message: '标题优化失败'
    };
  }
}
```

**Step 2: 提交**
```bash
git add src/lib/api.js
git commit -m "feat: 添加标题优化 API 方法"
```

---

### 任务 5: 前端 TitleOptimizer 组件

**Files:**
- Create: `src/components/TitleOptimizer.jsx`

**Step 1: 创建标题优化组件**

```javascript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Wand2, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const TitleOptimizer = ({ 
  title, 
  keywords = [], 
  targetPlatform = 'toutiao',
  onSelect,
  disabled = false
}) => {
  const { showError } = useNotification();
  const [optimizedTitles, setOptimizedTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const optimizeMutation = useMutation({
    mutationFn: () => api.optimizeTitle({
      title,
      keywords,
      targetPlatform,
      count: 5
    }),
    onSuccess: (data) => {
      if (data.success && data.optimizedTitles) {
        setOptimizedTitles(data.optimizedTitles);
        setShowOptions(true);
      } else {
        showError(data.message || '标题优化失败');
      }
    },
    onError: (error) => {
      showError('标题优化失败: ' + error.message);
    }
  });

  const handleSelect = (optTitle) => {
    setSelectedTitle(optTitle);
    onSelect?.(optTitle.title);
    setShowOptions(false);
  };

  const platformLabels = {
    toutiao: '今日头条',
    douyin: '抖音',
    xiaohongshu: '小红书'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => optimizeMutation.mutate()}
          disabled={disabled || optimizeMutation.isLoading || !title}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
        >
          {optimizeMutation.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          <span>AI优化标题</span>
        </button>
        {selectedTitle && (
          <span className="text-sm text-green-600">✓ 已选择优化标题</span>
        )}
      </div>

      {showOptions && optimizedTitles.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            为 {platformLabels[targetPlatform]} 生成 {optimizedTitles.length} 个标题选项：
          </p>
          <div className="space-y-2">
            {optimizedTitles.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(opt)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTitle?.title === opt.title
                    ? 'border-blue-500 bg-blue-50'
                    : opt.compliance
                    ? 'border-green-200 hover:border-green-400 bg-white'
                    : 'border-yellow-200 hover:border-yellow-400 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{opt.title}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      {opt.compliance ? (
                        <span className="flex items-center text-xs text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          符合规范
                        </span>
                      ) : (
                        <span className="flex items-center text-xs text-yellow-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {opt.reason || '可能不合规'}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        爆款潜力: {opt.score || 0}/100
                      </span>
                    </div>
                  </div>
                  {selectedTitle?.title === opt.title && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowOptions(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            收起选项
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleOptimizer;
```

**Step 2: 提交**
```bash
git add src/components/TitleOptimizer.jsx
git commit -m "feat: 添加标题优化组件"
```

---

### 任务 6: 集成到 ContentCreation 页面

**Files:**
- Modify: `src/pages/ContentCreation.jsx`

**Step 1: 导入 TitleOptimizer 组件**

在 import 语句中添加：
```javascript
import TitleOptimizer from '../components/TitleOptimizer';
```

**Step 2: 添加状态和优化函数**

在组件中添加状态：
```javascript
const [optimizedTitle, setOptimizedTitle] = useState('');
```

**Step 3: 在 GenerationForm 之前添加标题优化区域**

找到 GenerationForm 组件的位置，在其之前添加：

```jsx
{formData && (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">标题优化</h3>
    <TitleOptimizer
      title={formData.title || formData.topic}
      keywords={formData.keywords?.split(',').filter(Boolean) || []}
      targetPlatform="toutiao"
      onSelect={(selectedTitle) => {
        setOptimizedTitle(selectedTitle);
        setFormData(prev => ({ ...prev, title: selectedTitle }));
      }}
    />
    {optimizedTitle && (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          已选择优化标题: <strong>{optimizedTitle}</strong>
        </p>
      </div>
    )}
  </div>
)}
```

**Step 4: 提交**
```bash
git add src/pages/ContentCreation.jsx
git commit -m "feat: 集成标题优化功能到内容创作页面"
```

---

### 任务 7: 测试与验证

**Step 1: 启动服务测试**
- 确保后端服务运行正常
- 确保前端服务运行正常

**Step 2: 功能验证**
1. 从热点页面跳转，验证主题自动填充
2. 点击"AI优化标题"按钮，验证生成多个选项
3. 验证每个标题显示合规性标签
4. 选择标题后继续生成内容
5. 验证内容生成后可再次优化标题

**Step 3: 提交**
```bash
git add .
git commit -m "test: 标题优化功能测试验证"
```

---

## 实施完成

所有任务完成后，执行最终提交：
```bash
git push origin master
```

---

**Plan complete and saved to `docs/plans/2026-02-18-title-optimization-design.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
