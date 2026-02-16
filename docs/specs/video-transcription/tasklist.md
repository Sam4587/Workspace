{
  "featureName": "video-transcription",
  "description": "视频转录与智能创作功能",
  "phases": [
    {
      "name": "第一阶段：视频下载模块",
      "duration": "1周",
      "tasks": [
        {
          "id": "VD-001",
          "title": "创建视频模块基础结构",
          "description": "在 server/video/ 目录下创建模块入口和基础类",
          "priority": "high",
          "status": "pending",
          "files": [
            "server/video/index.js",
            "server/video/Downloader.js"
          ]
        },
        {
          "id": "VD-002",
          "title": "实现抖音视频下载器",
          "description": "创建 DouyinDownloader.js，支持抖音链接解析和视频下载",
          "priority": "high",
          "status": "pending",
          "dependencies": ["VD-001"],
          "files": [
            "server/video/downloaders/DouyinDownloader.js"
          ]
        },
        {
          "id": "VD-003",
          "title": "实现快手视频下载器",
          "description": "创建 KuaishouDownloader.js，支持快手链接解析和视频下载",
          "priority": "high",
          "status": "pending",
          "dependencies": ["VD-001"],
          "files": [
            "server/video/downloaders/KuaishouDownloader.js"
          ]
        },
        {
          "id": "VD-004",
          "title": "实现通用视频下载器",
          "description": "创建 GenericDownloader.js，基于 yt-dlp 实现通用下载能力",
          "priority": "medium",
          "status": "pending",
          "dependencies": ["VD-001"],
          "files": [
            "server/video/downloaders/GenericDownloader.js"
          ]
        },
        {
          "id": "VD-005",
          "title": "实现去水印处理",
          "description": "创建 WatermarkRemover.js，对接第三方去水印 API",
          "priority": "medium",
          "status": "pending",
          "files": [
            "server/video/WatermarkRemover.js"
          ]
        },
        {
          "id": "VD-006",
          "title": "实现视频存储管理",
          "description": "创建 VideoStorage.js，管理视频文件的本地存储",
          "priority": "high",
          "status": "pending",
          "files": [
            "server/video/VideoStorage.js"
          ]
        },
        {
          "id": "VD-007",
          "title": "创建视频下载 API 路由",
          "description": "实现 POST /api/video/download 和 GET /api/video/:id/status 接口",
          "priority": "high",
          "status": "pending",
          "dependencies": ["VD-002", "VD-003", "VD-006"],
          "files": [
            "server/routes/video.js"
          ]
        }
      ]
    },
    {
      "name": "第二阶段：转录引擎集成",
      "duration": "1周",
      "tasks": [
        {
          "id": "TE-001",
          "title": "创建转录引擎基础结构",
          "description": "创建 BaseTranscriber 抽象类和引擎管理器",
          "priority": "high",
          "status": "pending",
          "files": [
            "server/transcription/index.js",
            "server/transcription/BaseTranscriber.js",
            "server/transcription/TranscriptionEngine.js"
          ]
        },
        {
          "id": "TE-002",
          "title": "实现 Whisper 本地转录器",
          "description": "创建 WhisperLocalTranscriber.js，集成 faster-whisper",
          "priority": "high",
          "status": "pending",
          "dependencies": ["TE-001"],
          "files": [
            "server/transcription/WhisperLocalTranscriber.js"
          ]
        },
        {
          "id": "TE-003",
          "title": "实现阿里云 ASR 转录器",
          "description": "创建 AliyunASRTranscriber.js，集成阿里云语音服务",
          "priority": "high",
          "status": "pending",
          "dependencies": ["TE-001"],
          "files": [
            "server/transcription/AliyunASRTranscriber.js"
          ]
        },
        {
          "id": "TE-004",
          "title": "创建转录配置文件",
          "description": "创建 transcription.yaml 配置文件，支持引擎切换和降级",
          "priority": "high",
          "status": "pending",
          "files": [
            "server/config/transcription.yaml"
          ]
        },
        {
          "id": "TE-005",
          "title": "实现转录任务队列",
          "description": "创建转录任务队列管理，支持任务状态追踪",
          "priority": "medium",
          "status": "pending",
          "dependencies": ["TE-001"],
          "files": [
            "server/transcription/TaskQueue.js"
          ]
        },
        {
          "id": "TE-006",
          "title": "创建转录 API 路由",
          "description": "实现 POST /api/transcription/submit 和 GET /api/transcription/:taskId 接口",
          "priority": "high",
          "status": "pending",
          "dependencies": ["TE-002", "TE-003", "TE-005"],
          "files": [
            "server/routes/transcription.js"
          ]
        },
        {
          "id": "TE-007",
          "title": "创建转录结果数据模型",
          "description": "创建 MongoDB 数据模型存储转录结果",
          "priority": "high",
          "status": "pending",
          "files": [
            "server/models/Transcription.js"
          ]
        }
      ]
    },
    {
      "name": "第三阶段：智能创作模块",
      "duration": "1周",
      "tasks": [
        {
          "id": "IC-001",
          "title": "创建 Prompt 模板文件",
          "description": "创建各平台的 Prompt 模板（小红书、抖音、头条）",
          "priority": "high",
          "status": "pending",
          "files": [
            "server/services/prompts/videoAnalysis.js"
          ]
        },
        {
          "id": "IC-002",
          "title": "实现视频内容分析服务",
          "description": "创建 VideoAnalysisService.js，实现内容摘要和关键点提取",
          "priority": "high",
          "status": "pending",
          "dependencies": ["IC-001"],
          "files": [
            "server/services/VideoAnalysisService.js"
          ]
        },
        {
          "id": "IC-003",
          "title": "实现内容改写服务",
          "description": "创建 ContentRewriteService.js，支持多平台风格改写",
          "priority": "high",
          "status": "pending",
          "dependencies": ["IC-002"],
          "files": [
            "server/services/ContentRewriteService.js"
          ]
        },
        {
          "id": "IC-004",
          "title": "实现发布集成服务",
          "description": "创建 PublishIntegration.js，对接现有 Go CLI 发布工具",
          "priority": "high",
          "status": "pending",
          "files": [
            "server/services/PublishIntegration.js"
          ]
        },
        {
          "id": "IC-005",
          "title": "创建内容生成 API 路由",
          "description": "实现 POST /api/content/generate 接口",
          "priority": "high",
          "status": "pending",
          "dependencies": ["IC-003"],
          "files": [
            "server/routes/content.js"
          ]
        },
        {
          "id": "IC-006",
          "title": "创建一键发布 API 路由",
          "description": "实现 POST /api/publish/video-derivative 接口",
          "priority": "high",
          "status": "pending",
          "dependencies": ["IC-004"],
          "files": [
            "server/routes/publish.js"
          ]
        }
      ]
    },
    {
      "name": "第四阶段：前端集成",
      "duration": "3天",
      "tasks": [
        {
          "id": "FE-001",
          "title": "热点页面添加视频操作入口",
          "description": "在热点监控页面添加视频下载和转录按钮",
          "priority": "high",
          "status": "pending",
          "files": [
            "src/pages/HotTopics.jsx",
            "src/components/VideoActionPanel.jsx"
          ]
        },
        {
          "id": "FE-002",
          "title": "创建视频转录结果页面",
          "description": "创建转录结果展示页面，支持文本编辑和分段查看",
          "priority": "high",
          "status": "pending",
          "files": [
            "src/pages/TranscriptionResult.jsx",
            "src/components/TranscriptEditor.jsx"
          ]
        },
        {
          "id": "FE-003",
          "title": "创建内容改写界面",
          "description": "创建内容改写页面，支持平台选择和内容预览",
          "priority": "high",
          "status": "pending",
          "files": [
            "src/pages/ContentRewrite.jsx",
            "src/components/PlatformContentPreview.jsx"
          ]
        },
        {
          "id": "FE-004",
          "title": "实现一键发布功能",
          "description": "集成发布功能，支持从改写内容直接发布到平台",
          "priority": "high",
          "status": "pending",
          "dependencies": ["FE-003"],
          "files": [
            "src/components/PublishButton.jsx"
          ]
        },
        {
          "id": "FE-005",
          "title": "完善错误处理和用户体验",
          "description": "添加加载状态、错误提示、操作确认等交互优化",
          "priority": "medium",
          "status": "pending",
          "dependencies": ["FE-001", "FE-002", "FE-003", "FE-004"],
          "files": [
            "src/components/TranscriptionStatus.jsx",
            "src/components/ErrorAlert.jsx"
          ]
        }
      ]
    }
  ],
  "createdAt": "2026-02-15",
  "updatedAt": "2026-02-15"
}
