# 视频转录与智能创作功能设计

## 概述

本功能旨在将 AI-Video-Transcriber 开源项目的能力整合到 TrendRadar 平台，实现从热点视频到 AI 转录、内容总结、再到二次创作的完整工作流。

## 需求确认

| 维度 | 决策 |
|------|------|
| **视频来源** | 热点视频链接 + 本地上传（两者都支持） |
| **二次创作功能** | AI总结 + 内容改写 + 素材复用（全部） |
| **优先平台** | 抖音/快手短视频 |
| **转录引擎** | 多引擎支持（本地Whisper + 阿里云ASR备用） |
| **发布平台** | 小红书、抖音、今日头条（聚焦现有能力） |

## 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TrendRadar 内容创作闭环                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   热点监控 ──▶ 视频发现 ──▶ 视频下载 ──▶ AI转录 ──▶ 智能创作 ──▶ 发布    │
│      │            │            │            │            │            │   │
│      ▼            ▼            ▼            ▼            ▼            ▼   │
│   12+平台     抖音/快手     yt-dlp      Whisper      LiteLLM      多平台  │
│   数据源      链接解析     去水印      多引擎        内容生成     发布工具  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 核心模块划分

| 模块 | 职责 | 技术选型 |
|------|------|----------|
| VideoDiscovery | 从热点中识别/提取视频链接 | 链接解析、平台识别 |
| VideoDownloader | 下载视频、去水印 | yt-dlp、第三方API |
| TranscriptionEngine | 语音转文字 | Whisper本地 + 阿里云ASR备用 |
| ContentIntelligence | AI分析、总结、改写 | LiteLLM（复用现有） |
| MaterialExtractor | 精彩片段提取、截图 | FFmpeg |

---

## 模块一：视频下载模块

### 架构设计

```
┌────────────────────────────────────────────────────────────┐
│                    VideoDownloader                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  输入: 热点视频链接 / 用户手动输入链接                        │
│                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ 平台识别器    │───▶│ 链接解析器    │───▶│ 下载执行器    │ │
│  │ URL Pattern  │    │ 获取真实地址   │    │ yt-dlp/API   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                   │        │
│                                                   ▼        │
│                                          ┌──────────────┐  │
│                                          │ 去水印处理    │  │
│                                          │ 第三方API    │  │
│                                          └──────────────┘  │
│                                                            │
│  输出: 无水印视频文件 + 元数据（标题、作者、时长等）           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 技术实现方案

| 平台 | 下载方式 | 去水印方案 | 风险等级 |
|------|----------|------------|----------|
| **抖音** | yt-dlp + 自定义extractor | 第三方API（如 douyin.wtf） | 中 |
| **快手** | yt-dlp + 自定义extractor | 第三方API | 中 |

### 代码结构

```
server/
├── video/
│   ├── index.js                 # 模块入口
│   ├── Downloader.js            # 下载器基类
│   ├── downloaders/
│   │   ├── DouyinDownloader.js  # 抖音下载器
│   │   ├── KuaishouDownloader.js # 快手下载器
│   │   └── GenericDownloader.js # 通用下载器（yt-dlp）
│   ├── WatermarkRemover.js      # 去水印处理
│   └── VideoStorage.js          # 视频存储管理
```

### 应对风险的备选方案

1. **官方API降级** - 当第三方服务不可用时，保留带水印版本
2. **本地缓存** - 下载后的视频本地缓存，避免重复下载
3. **代理池** - 配合现有的 `proxyPool.js` 应对IP限制

---

## 模块二：AI 转录引擎

### 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    TranscriptionEngine                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │ 配置管理器   │  ◀── transcription.config.yaml                │
│  │ 引擎切换     │      default: whisper-local                   │
│  └──────┬──────┘      fallback: aliyun-asr                      │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              BaseTranscriber (抽象基类)                  │   │
│  │  - transcribe(audioPath) → TranscriptResult              │   │
│  │  - getSupportedFormats()                                 │   │
│  │  - getEngineInfo()                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ▲                   ▲                   ▲               │
│         │                   │                   │               │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐        │
│  │ WhisperLocal│    │  AliyunASR  │    │  TencentASR │        │
│  │ (faster-    │    │  (阿里云)    │    │  (腾讯云)    │        │
│  │  whisper)   │    │  (备用引擎)  │    │  (可选)      │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 引擎对比

| 引擎 | 准确度 | 成本 | 速度 | 中文支持 | 适用场景 |
|------|--------|------|------|----------|----------|
| **Whisper本地** | 高 | 免费 | 中等（需GPU） | 优秀 | 批量处理、隐私敏感 |
| **阿里云ASR** | 高 | 按量付费 | 快 | 优秀 | 备用引擎、高并发 |

### 输出数据结构

```javascript
// 转录结果统一格式
{
  success: true,
  engine: 'whisper-local',
  duration: 125.5,           // 音频时长（秒）
  language: 'zh-CN',

  // 完整文本
  text: "完整转录文本...",

  // 分段信息（用于字幕生成）
  segments: [
    {
      index: 1,
      start: 0.0,
      end: 3.5,
      text: "第一句话",
      confidence: 0.95
    }
  ],

  // 关键词提取（可选）
  keywords: ['关键词1', '关键词2'],

  // 元数据
  metadata: {
    modelSize: 'medium',
    processingTime: 45000
  }
}
```

### 配置文件

```yaml
# server/config/transcription.yaml
transcription:
  default_engine: "whisper-local"

  engines:
    whisper-local:
      enabled: true
      model: "medium"          # tiny/base/small/medium/large
      device: "cuda"           # cuda/cpu
      language: "auto"
      output_dir: "./storage/transcripts"

    aliyun-asr:
      enabled: true
      app_key: "${ALIYUN_ASR_APP_KEY}"
      access_key_id: "${ALIYUN_ACCESS_KEY_ID}"
      access_key_secret: "${ALIYUN_ACCESS_KEY_SECRET}"
      region: "cn-shanghai"

  fallback:
    enabled: true
    order: ["aliyun-asr"]
    retry_count: 2
```

---

## 模块三：AI 智能创作模块

### 改写输出格式（聚焦三大平台）

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ContentIntelligence                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  改写输出（聚焦三大平台）:                                           │
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│  │   小红书     │   │    抖音      │   │   今日头条   │              │
│  │  图文笔记    │   │  短视频脚本  │   │   文章/微头条 │              │
│  │             │   │             │   │             │              │
│  │ - 标题≤20字 │   │ - 口播文案  │   │ - 标题≤30字  │              │
│  │ - 正文≤1000 │   │ - 字幕文案  │   │ - 正文≤2000  │              │
│  │ - Emoji风格 │   │ - 悬念钩子  │   │ - 专业风格   │              │
│  │ - 话题标签  │   │ - 互动引导  │   │ - 话题标签   │              │
│  └─────────────┘   └─────────────┘   └─────────────┘              │
│                                                                     │
│  一键发布对接:                                                       │
│  ├── 小红书 → xiaohongshu-publisher (Go CLI)                        │
│  ├── 抖音   → douyin-toutiao (Go CLI)                               │
│  └── 头条   → douyin-toutiao (Go CLI)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Prompt 模板设计

```javascript
// server/services/prompts/videoAnalysis.js
module.exports = {
  // ========== 内容分析（通用）==========
  SUMMARY_PROMPT: `请分析以下视频转录内容，生成：
1. 一段200字以内的核心摘要
2. 3-5个关键观点（带时间戳）
3. 2-3句金句

转录内容：
{transcript}`,

  // ========== 小红书风格 ==========
  XIAOHONGSHU_REWRITE: `基于以下视频内容，创作一篇小红书风格的图文笔记：

要求：
- 标题要有吸引力，最多20字
- 正文口语化，使用emoji，最多1000字
- 开头要有互动感（"姐妹们"、"绝了"等）
- 结尾引导互动（点赞收藏）
- 生成3-5个话题标签

原始内容：
{summary}

输出JSON格式：
{"title": "", "content": "", "tags": []}`,

  // ========== 抖音风格 ==========
  DOUYIN_SCRIPT: `基于以下视频内容，创作一个抖音短视频脚本：

要求：
- 开头3秒钩子（吸引注意力）
- 核心内容60秒内讲完
- 结尾引导互动（点赞关注）
- 适合口播的口语化表达

原始内容：
{summary}

输出JSON格式：
{"hook": "", "mainContent": "", "cta": "", "suggestedDuration": 60}`,

  // ========== 今日头条风格 ==========
  TOUTIAO_ARTICLE: `基于以下视频内容，创作一篇今日头条风格的文章：

要求：
- 标题吸引眼球，最多30字
- 正文专业严谨，最多2000字
- 结构清晰（引言-正文-结语）
- 可选：生成微头条版本（300字以内）

原始内容：
{summary}

输出JSON格式：
{"title": "", "content": "", "microContent": "", "tags": []}`,

  // ========== 批量生成 ==========
  MULTI_PLATFORM: `基于以下视频内容，同时生成小红书、抖音、今日头条三个平台的文案：

原始内容：{summary}

输出JSON格式：
{
  "xiaohongshu": {"title": "", "content": "", "tags": []},
  "douyin": {"hook": "", "mainContent": "", "cta": ""},
  "toutiao": {"title": "", "content": "", "microContent": "", "tags": []}
}`
};
```

### 与现有发布工具对接

```javascript
// server/services/publishIntegration.js
const { exec } = require('child_process');
const path = require('path');

class PublishIntegration {
  constructor() {
    this.toolsPath = {
      xiaohongshu: path.join(__dirname, '../../tools/xiaohongshu-publisher/xhs-publisher'),
      douyin: path.join(__dirname, '../../tools/douyin-toutiao/publisher'),
      toutiao: path.join(__dirname, '../../tools/douyin-toutiao/publisher')
    };
  }

  async publishToXiaohongshu(content) {
    // 标题≤20字，正文≤1000字
    const cmd = `${this.toolsPath.xiaohongshu} ` +
      `-title "${content.title.slice(0, 20)}" ` +
      `-content "${content.content.slice(0, 1000)}" ` +
      `-images "${content.images.join(',')}"`;
    return this.execCommand(cmd);
  }

  async publishToDouyin(content) {
    // 标题≤30字，正文≤2000字
    const cmd = `${this.toolsPath.douyin} ` +
      `-platform douyin ` +
      `-title "${content.title.slice(0, 30)}" ` +
      `-content "${content.mainContent.slice(0, 2000)}"`;
    return this.execCommand(cmd);
  }

  async publishToToutiao(content) {
    const cmd = `${this.toolsPath.toutiao} ` +
      `-platform toutiao ` +
      `-title "${content.title.slice(0, 30)}" ` +
      `-content "${content.content.slice(0, 2000)}"`;
    return this.execCommand(cmd);
  }
}
```

---

## 实施计划

### 第一阶段：视频下载模块（1周）

1. 实现抖音/快手链接识别
2. 集成 yt-dlp 下载能力
3. 对接去水印第三方API
4. 实现视频本地存储管理

### 第二阶段：转录引擎集成（1周）

1. 搭建 Whisper 本地环境
2. 实现转录引擎抽象层
3. 集成阿里云 ASR 作为备用
4. 实现转录任务队列

### 第三阶段：智能创作模块（1周）

1. 设计 Prompt 模板（三平台）
2. 集成现有 LiteLLM 服务
3. 实现内容生成流程
4. 对接现有发布工具

### 第四阶段：前端集成（3天）

1. 热点监控页面添加视频操作入口
2. 创建视频转录结果展示页
3. 实现一键改写与发布功能
4. 完善用户体验与错误处理

---

## API 设计

### 视频下载

```
POST /api/video/download
Request:  { "url": "https://v.douyin.com/xxx" }
Response: { "videoId": "xxx", "status": "downloading" }

GET /api/video/:id/status
Response: { "status": "completed", "videoPath": "/storage/videos/xxx.mp4" }
```

### 视频转录

```
POST /api/transcription/submit
Request:  { "videoId": "xxx", "engine": "whisper-local" }
Response: { "taskId": "xxx", "status": "processing" }

GET /api/transcription/:taskId
Response: { "status": "completed", "result": { ... } }
```

### 智能创作

```
POST /api/content/generate
Request:  {
  "transcriptionId": "xxx",
  "platforms": ["xiaohongshu", "douyin", "toutiao"]
}
Response: {
  "xiaohongshu": { "title": "...", "content": "...", "tags": [...] },
  "douyin": { "hook": "...", "mainContent": "...", "cta": "..." },
  "toutiao": { "title": "...", "content": "...", "tags": [...] }
}
```

### 一键发布

```
POST /api/publish/video-derivative
Request:  {
  "contentId": "xxx",
  "platform": "xiaohongshu",
  "images": ["img1.jpg"]
}
Response: { "publishId": "xxx", "status": "success", "url": "..." }
```

---

## 参考资源

- [AI-Video-Transcriber](https://github.com/wendy7756/AI-Video-Transcriber) - 开源转录项目参考
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - 视频下载工具
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) - 高效 Whisper 推理
- [阿里云ASR](https://www.aliyun.com/product/nls) - 云端语音识别服务
