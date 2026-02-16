# AI Content Flow 项目文档中心

> 本文档为项目所有指导性文档的统一入口，便于 AI 开发者快速定位所需信息。

## 文档结构

```
docs/
├── README.md                    # 本文档 - 文档索引
├── PROJECT_SUMMARY.md           # 项目概述
├── PROJECT_SEPARATION.md        # 项目分离历史记录
│
├── dev/                         # 开发指南
│   ├── QUICK_START.md          # 快速开始
│   ├── DEV_WORKFLOW.md         # 开发工作流
│   ├── AI_COLLABORATION.md     # AI 协作指南
│   ├── SPEC_STANDARDS.md       # 规格文档标准
│   ├── QUICK_REFERENCE.md      # 快速参考卡
│   ├── ARCHITECTURE.md         # 系统架构
│   ├── API.md                  # API 文档
│   ├── DATA_STORAGE.md         # 数据存储方案
│   └── ISSUE_*.md              # 问题修复记录
│
├── specs/                       # 功能规格文档
│   ├── auto-dev-server/        # 自动开发服务器
│   ├── dark-mode-toggle/       # 深色模式切换
│   ├── video-transcription/    # 视频转录
│   ├── remotion-video-generation/ # 视频生成
│   ├── mcp-publish-platform/   # MCP 发布平台
│   └── litellm-integration/    # LiteLLM 集成
│
├── analysis/                    # 分析文档
│   ├── hot-topics-migration-analysis.md
│   └── toonflow-app-analysis.md
│
├── plans/                       # 计划文档
│   └── 2026-02-15-video-transcription-design.md
│
├── research/                    # 技术研究
│   └── TECH_RESEARCH.md
│
├── roadmap/                     # 路线图
│   └── platform-development-roadmap.md
│
└── mcp/                         # MCP 相关
    └── xiaohongshu-mcp.md
```

## 快速导航

### 新手入门

| 文档 | 说明 | 优先级 |
|------|------|--------|
| [项目概述](PROJECT_SUMMARY.md) | 了解项目目标和功能 | 必读 |
| [快速开始](dev/QUICK_START.md) | 环境搭建和启动 | 必读 |
| [开发工作流](dev/DEV_WORKFLOW.md) | 7 步开发流程 | 必读 |

### AI 开发者必读

| 文档 | 说明 | 优先级 |
|------|------|--------|
| [AI 协作指南](dev/AI_COLLABORATION.md) | 如何与 AI 协作开发 | 必读 |
| [规格文档标准](dev/SPEC_STANDARDS.md) | 规格文档编写规范 | 必读 |
| [快速参考卡](dev/QUICK_REFERENCE.md) | 一页纸速查 | 常用 |

### 技术参考

| 文档 | 说明 |
|------|------|
| [系统架构](dev/ARCHITECTURE.md) | 前后端架构设计 |
| [API 文档](dev/API.md) | 接口规范 |
| [数据存储](dev/DATA_STORAGE.md) | MongoDB/Memory 存储方案 |
| [项目分离记录](PROJECT_SEPARATION.md) | 发布功能独立历史 |

### 问题修复记录

| 文档 | 说明 | 日期 |
|------|------|------|
| [热点 Mock 数据问题](dev/ISSUE_HOT_TOPICS_MOCK_DATA.md) | 硬编码假数据问题修复 | 2026-02-16 |

## 开发规范

### 核心原则

1. **真实数据优先**: 核心功能禁止使用硬编码 Mock 数据
2. **错误透明化**: API 失败时返回 `success: false`，不静默回退假数据
3. **规格驱动开发**: 先写规格文档，再实现功能

### 规格文档格式

每个功能规格包含三个文件：

```
specs/{feature-name}/
├── requirements.md   # 需求文档 (WHEN-THEN-SHALL 格式)
├── design.md         # 设计文档
└── tasklist.md       # 任务清单
```

### 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
refactor: 重构
test: 测试
chore: 构建/工具
```

## 常见问题

### Q: 如何启动项目？

```bash
# 终端1 - 后端
cd server && node server.js

# 终端2 - 前端
npm run dev
```

### Q: 如何添加新功能？

1. 在 `docs/specs/` 创建规格文档
2. 按照 `DEV_WORKFLOW.md` 的 7 步流程开发
3. 更新相关文档

### Q: 遇到问题怎么办？

1. 查看 `docs/dev/ISSUE_*.md` 是否有类似问题记录
2. 检查后端服务是否正常运行
3. 查看浏览器控制台和后端日志

## 文档维护

### 新增文档

1. 确定文档类型，放入对应目录
2. 更新本索引文件
3. 遵循现有文档格式

### 文档命名规范

- 使用大写字母和下划线: `FEATURE_NAME.md`
- 问题记录: `ISSUE_BRIEF_DESCRIPTION.md`
- 规格目录: 小写字母和连字符: `feature-name/`

---

**最后更新**: 2026-02-16  
**维护者**: AI Developer Team
