---
title: AI分析模块增强 - 技术设计
category: 功能规格
tags: [AI分析, 视频转写, 知识库, 抖音运营]
created: 2026-02-20
version: v1.0
---

# AI分析模块增强 - 技术设计

## 一、系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (React)                              │
├─────────────────────────────────────────────────────────────────┤
│  视频分析组件  │  知识库管理  │  内容对话  │  内容创作集成        │
└───────┬───────┴──────┬──────┴─────┬──────┴──────┬───────────────┘
        │              │            │             │
        ▼              ▼            ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Express)                       │
├─────────────────────────────────────────────────────────────────┤
│ /api/video-analysis │ /api/knowledge-base │ /api/content-chat   │
└───────┬─────────────┴──────┬───────────────┴─────┬──────────────┘
        │                    │                     │
        ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        服务层                                    │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ VideoStructure  │ VectorStore     │ ContentChat                 │
│ AnalysisService │ Service         │ Service                     │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ DocumentParser  │ RAGService      │ ContentIndex                │
│ Service         │                 │ Service                     │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        存储层                                    │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ ChromaDB        │ 文件存储        │ MongoDB/内存存储            │
│ (向量数据库)     │ (文档文件)       │ (元数据)                    │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 1.2 技术选型

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| 向量数据库 | ChromaDB | 轻量级本地向量数据库，易于集成 |
| Embedding | text-embedding-3-small | OpenAI嵌入模型，性价比高 |
| 文档解析 | pdf-parse + mammoth | 支持PDF和Word文档 |
| LLM | 复用现有multiAIService | 支持多提供商切换 |
| 流式响应 | SSE (Server-Sent Events) | 实现对话流式输出 |

---

## 二、视频结构化分析设计

### 2.1 分析流程

```
视频转录文本
     │
     ▼
┌─────────────────┐
│ 文本预处理       │ ← 清洗、分段
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 结构识别        │ ← LLM分析
│ (开头钩子)       │
│ (铺垫内容)       │
│ (核心包袱)       │
│ (结尾引导)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 节奏分析        │ ← 时间分布、情感曲线
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 爆款元素识别     │ ← 关键词、情感触发点
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 优化建议生成     │ ← 基于分析结果
└─────────────────┘
```

### 2.2 服务接口设计

```javascript
// server/services/videoStructureAnalysisService.js

class VideoStructureAnalysisService {
  constructor() {
    this.multiAIService = require('./multiAIService');
  }

  /**
   * 分析视频结构
   * @param {string} transcript - 视频转录文本
   * @param {object} metadata - 视频元数据
   * @returns {Promise<object>} 分析结果
   */
  async analyzeStructure(transcript, metadata = {}) {
    const structure = await this._identifyStructure(transcript);
    const rhythm = await this._analyzeRhythm(transcript, structure);
    const viralElements = await this._identifyViralElements(transcript, structure);
    const suggestions = await this._generateSuggestions(structure, rhythm, viralElements);
    
    return {
      structure,
      rhythm,
      viralElements,
      overallScore: this._calculateOverallScore(structure, rhythm, viralElements),
      viralPotential: this._assessViralPotential(viralElements),
      suggestions
    };
  }

  /**
   * 识别视频结构
   */
  async _identifyStructure(transcript) {
    const prompt = `分析以下视频转录文本，识别其结构组成：

转录文本：
${transcript}

请按以下结构进行分析：
1. 开头钩子（hook）：前3-5秒的吸引点
2. 铺垫内容（setup）：背景介绍和情境铺垫
3. 核心包袱（climax）：高潮或反转部分
4. 结尾引导（cta）：互动引导或关注引导

返回JSON格式：
{
  "hook": { "content": "内容", "score": 0-100, "startTime": "00:00", "endTime": "00:05" },
  "setup": { "content": "内容", "score": 0-100, "startTime": "00:05", "endTime": "00:20" },
  "climax": { "content": "内容", "score": 0-100, "startTime": "00:20", "endTime": "00:45" },
  "cta": { "content": "内容", "score": 0-100, "startTime": "00:45", "endTime": "00:50" }
}`;

    const response = await this.multiAIService.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 1000
    });

    return JSON.parse(response.content);
  }

  /**
   * 分析节奏
   */
  async _analyzeRhythm(transcript, structure) {
    // 分析文本长度分布、情感变化、信息密度
    const sections = Object.values(structure);
    const totalLength = transcript.length;
    
    return {
      pace: this._calculatePace(sections, totalLength),
      emotionalCurve: await this._analyzeEmotionalCurve(transcript),
      informationDensity: this._calculateInfoDensity(transcript),
      retentionPoints: await this._identifyRetentionPoints(transcript)
    };
  }

  /**
   * 识别爆款元素
   */
  async _identifyViralElements(transcript, structure) {
    const prompt = `分析以下视频内容，识别可能引发传播的爆款元素：

转录文本：
${transcript}

结构分析：
${JSON.stringify(structure, null, 2)}

请识别：
1. 情感触发点（引发共鸣的内容）
2. 争议点（可能引发讨论的内容）
3. 实用价值（对观众有帮助的内容）
4. 娱乐元素（有趣或吸引人的内容）
5. 传播动机（观众分享的理由）

返回JSON格式：
{
  "emotionalTriggers": [],
  "controversyPoints": [],
  "practicalValue": [],
  "entertainmentElements": [],
  "sharingMotivations": [],
  "viralScore": 0-100
}`;

    const response = await this.multiAIService.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 800
    });

    return JSON.parse(response.content);
  }

  /**
   * 生成优化建议
   */
  async _generateSuggestions(structure, rhythm, viralElements) {
    const suggestions = [];
    
    // 基于结构评分生成建议
    if (structure.hook.score < 70) {
      suggestions.push({
        type: 'hook',
        priority: 'high',
        suggestion: '开头钩子吸引力不足，建议在前3秒加入更强的吸引元素',
        examples: ['使用悬念开头', '提出问题', '展示惊人数据']
      });
    }
    
    if (structure.cta.score < 60) {
      suggestions.push({
        type: 'cta',
        priority: 'medium',
        suggestion: '结尾引导不够明确，建议添加清晰的互动引导',
        examples: ['点赞关注引导', '评论互动引导', '分享转发引导']
      });
    }
    
    // 基于爆款元素生成建议
    if (viralElements.viralScore < 50) {
      suggestions.push({
        type: 'viral',
        priority: 'high',
        suggestion: '爆款潜力较低，建议增加传播动机',
        examples: ['添加争议性观点', '增加情感共鸣点', '提供实用价值']
      });
    }
    
    return suggestions;
  }
}

module.exports = new VideoStructureAnalysisService();
```

### 2.3 API设计

```javascript
// server/routes/videoAnalysis.js

const express = require('express');
const router = express.Router();
const videoStructureAnalysisService = require('../services/videoStructureAnalysisService');

/**
 * POST /api/video-analysis/structure
 * 分析视频结构
 */
router.post('/structure', async (req, res) => {
  try {
    const { transcript, metadata } = req.body;
    
    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: '缺少转录文本'
      });
    }
    
    const result = await videoStructureAnalysisService.analyzeStructure(transcript, metadata);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '分析失败: ' + error.message
    });
  }
});

/**
 * POST /api/video-analysis/batch
 * 批量分析视频
 */
router.post('/batch', async (req, res) => {
  try {
    const { videos } = req.body;
    
    const results = await Promise.all(
      videos.map(video => 
        videoStructureAnalysisService.analyzeStructure(video.transcript, video.metadata)
      )
    );
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量分析失败: ' + error.message
    });
  }
});

module.exports = router;
```

---

## 三、私有知识库设计

### 3.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     知识库管理服务                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 文档上传     │  │ 文档解析     │  │ 向量化存储   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   文档处理流水线                      │   │
│  │  上传 → 解析 → 分块 → 向量化 → 存储                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     向量存储服务                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ ChromaDB    │  │ Embedding   │  │ 检索服务     │         │
│  │ 向量数据库   │  │ API         │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 向量存储服务

```javascript
// server/services/vectorStoreService.js

const { ChromaClient } = require('chromadb');
const OpenAI = require('openai');

class VectorStoreService {
  constructor() {
    this.client = new ChromaClient({ path: 'http://localhost:8000' });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.collection = null;
  }

  /**
   * 初始化集合
   */
  async initialize(knowledgeBaseId) {
    this.collection = await this.client.getOrCreateCollection({
      name: `kb_${knowledgeBaseId}`,
      metadata: { description: `Knowledge base ${knowledgeBaseId}` }
    });
    return this.collection;
  }

  /**
   * 生成文本嵌入
   */
  async generateEmbedding(text) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }

  /**
   * 添加文档
   */
  async addDocuments(documents) {
    const ids = documents.map(d => d.id);
    const texts = documents.map(d => d.content);
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    const metadatas = documents.map(d => ({
      source: d.source,
      page: d.page,
      knowledgeBaseId: d.knowledgeBaseId
    }));

    await this.collection.add({
      ids,
      embeddings,
      documents: texts,
      metadatas
    });
  }

  /**
   * 相似度检索
   */
  async similaritySearch(query, k = 5) {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: k
    });

    return results.documents[0].map((doc, i) => ({
      content: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i]
    }));
  }

  /**
   * 删除文档
   */
  async deleteDocuments(ids) {
    await this.collection.delete({ ids });
  }

  /**
   * 删除集合
   */
  async deleteCollection() {
    await this.client.deleteCollection({ name: this.collection.name });
  }
}

module.exports = new VectorStoreService();
```

### 3.3 文档解析服务

```javascript
// server/services/documentParserService.js

const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

class DocumentParserService {
  /**
   * 解析文档
   */
  async parse(filePath, fileType) {
    const buffer = await fs.readFile(filePath);
    
    switch (fileType) {
      case 'pdf':
        return this.parsePDF(buffer);
      case 'docx':
        return this.parseDOCX(buffer);
      case 'txt':
        return this.parseTXT(buffer);
      case 'md':
        return this.parseMarkdown(buffer);
      default:
        throw new Error(`不支持的文件类型: ${fileType}`);
    }
  }

  /**
   * 解析PDF
   */
  async parsePDF(buffer) {
    const data = await pdf(buffer);
    return {
      text: data.text,
      pages: data.numpages,
      metadata: data.info
    };
  }

  /**
   * 解析Word文档
   */
  async parseDOCX(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      messages: result.messages
    };
  }

  /**
   * 解析纯文本
   */
  async parseTXT(buffer) {
    return {
      text: buffer.toString('utf-8')
    };
  }

  /**
   * 解析Markdown
   */
  async parseMarkdown(buffer) {
    const text = buffer.toString('utf-8');
    return {
      text,
      headings: this.extractHeadings(text)
    };
  }

  /**
   * 文档分块
   */
  chunkText(text, options = {}) {
    const {
      chunkSize = 500,
      overlap = 50,
      separator = '\n\n'
    } = options;

    const chunks = [];
    const paragraphs = text.split(separator);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          // 保留重叠部分
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + paragraph;
        } else {
          // 单个段落超过chunkSize，按句子分割
          const sentences = paragraph.match(/[^。！？.!?]+[。！？.!?]+/g) || [paragraph];
          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > chunkSize) {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
        }
      } else {
        currentChunk += separator + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * 提取标题
   */
  extractHeadings(markdown) {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2]
      });
    }

    return headings;
  }
}

module.exports = new DocumentParserService();
```

---

## 四、全库AI对话设计

### 4.1 对话流程

```
用户问题
    │
    ▼
┌─────────────────┐
│ 问题理解        │ ← LLM分析意图
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 语义检索        │ ← 向量检索相关内容
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 上下文构建      │ ← 组装检索结果
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM生成回答     │ ← 流式输出
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 引用追踪        │ ← 标注来源
└─────────────────┘
```

### 4.2 对话服务

```javascript
// server/services/contentChatService.js

const multiAIService = require('./multiAIService');
const vectorStoreService = require('./vectorStoreService');

class ContentChatService {
  constructor() {
    this.conversationHistory = new Map();
  }

  /**
   * 对话
   */
  async chat(userId, question, options = {}) {
    const { knowledgeBaseId, stream = false } = options;

    // 1. 获取对话历史
    const history = this.getHistory(userId);

    // 2. 检索相关内容
    const relevantContent = await this.retrieveRelevantContent(
      question,
      knowledgeBaseId
    );

    // 3. 构建上下文
    const context = this.buildContext(relevantContent);

    // 4. 生成回答
    const prompt = this.buildPrompt(question, context, history);

    if (stream) {
      return this.streamResponse(userId, prompt, relevantContent);
    }

    const response = await multiAIService.generateContent(prompt, {
      temperature: 0.7,
      maxTokens: 1000
    });

    // 5. 更新历史
    this.updateHistory(userId, question, response.content);

    // 6. 返回结果（包含引用）
    return {
      answer: response.content,
      sources: relevantContent.map(c => ({
        id: c.id,
        content: c.content.slice(0, 100) + '...',
        metadata: c.metadata
      }))
    };
  }

  /**
   * 检索相关内容
   */
  async retrieveRelevantContent(question, knowledgeBaseId) {
    await vectorStoreService.initialize(knowledgeBaseId);
    return vectorStoreService.similaritySearch(question, 5);
  }

  /**
   * 构建提示词
   */
  buildPrompt(question, context, history) {
    return `你是一个内容创作助手，可以基于用户的历史内容回答问题。

相关内容：
${context}

对话历史：
${history.map(h => `用户: ${h.question}\n助手: ${h.answer}`).join('\n')}

当前问题：${question}

请基于相关内容回答问题，并在回答中引用来源。如果相关内容中没有答案，请说明。`;
  }

  /**
   * 构建上下文
   */
  buildContext(relevantContent) {
    return relevantContent
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');
  }

  /**
   * 流式响应
   */
  async *streamResponse(userId, prompt, relevantContent) {
    const stream = await multiAIService.streamGenerate(prompt);

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      yield { type: 'chunk', content: chunk };
    }

    // 更新历史
    this.updateHistory(userId, prompt.split('当前问题：')[1].split('\n')[0], fullResponse);

    // 发送来源
    yield {
      type: 'sources',
      sources: relevantContent.map(c => ({
        id: c.id,
        content: c.content.slice(0, 100) + '...',
        metadata: c.metadata
      }))
    };
  }

  /**
   * 获取历史
   */
  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * 更新历史
   */
  updateHistory(userId, question, answer) {
    const history = this.getHistory(userId);
    history.push({ question, answer, timestamp: Date.now() });
    // 保留最近10轮对话
    if (history.length > 10) {
      history.shift();
    }
    this.conversationHistory.set(userId, history);
  }
}

module.exports = new ContentChatService();
```

---

## 五、前端组件设计

### 5.1 视频分析组件

```jsx
// src/components/VideoStructureAnalysis.jsx

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import api from '../lib/api';

const VideoStructureAnalysis = ({ transcript, onApplySuggestions }) => {
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeVideoStructure(transcript),
    onSuccess: (data) => setAnalysis(data)
  });

  const renderStructureSection = (name, data, icon) => (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium flex items-center gap-2">
          {icon} {name}
        </span>
        <Badge variant={data.score >= 70 ? 'success' : data.score >= 50 ? 'warning' : 'destructive'}>
          {data.score}分
        </Badge>
      </div>
      <Progress value={data.score} />
      <p className="text-sm text-gray-600">{data.content}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>视频结构分析</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <Button onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}>
            开始分析
          </Button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {renderStructureSection('开头钩子', analysis.structure.hook, '🎣')}
              {renderStructureSection('铺垫内容', analysis.structure.setup, '📖')}
              {renderStructureSection('核心包袱', analysis.structure.climax, '💥')}
              {renderStructureSection('结尾引导', analysis.structure.cta, '📢')}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">优化建议</h4>
              <ul className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant={s.priority === 'high' ? 'destructive' : 'secondary'}>
                      {s.priority}
                    </Badge>
                    <span>{s.suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={() => onApplySuggestions(analysis.suggestions)}>
              应用优化建议
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoStructureAnalysis;
```

---

## 六、部署配置

### 6.1 ChromaDB部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/chroma/chroma
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000

volumes:
  chromadb_data:
```

### 6.2 环境变量

```env
# .env
CHROMADB_URL=http://localhost:8000
OPENAI_API_KEY=sk-xxx
EMBEDDING_MODEL=text-embedding-3-small
```

---

## 七、性能优化

### 7.1 向量检索优化

- 使用HNSW索引加速检索
- 批量嵌入减少API调用
- 缓存常用查询结果

### 7.2 对话优化

- 流式响应提升体验
- 对话历史压缩
- 上下文窗口管理

### 7.3 文档处理优化

- 异步处理大文件
- 增量索引更新
- 文档分块并行处理
