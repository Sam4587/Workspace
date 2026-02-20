---
title: AI Content Flow 文档中心
category: 文档索引
tags: [文档中心, 导航, 索引]
updated: 2026-02-20
version: 2.0
author: AI开发团队
---

# AI Content Flow 文档中心

> **项目文档总索引** | **最后更新**: 2026-02-20

欢迎来到 AI Content Flow 项目文档中心！本文档帮助你快速找到所需信息。

---

## 📚 文档导航

### 按角色查找

| 角色 | 推荐文档 | 快速链接 |
|------|----------|----------|
| **新手** | 快速开始、安装指南 | [快速开始](01-getting-started/quick-start.md) |
| **开发者** | API 文档、架构设计、开发规范 | [开发指南](02-development/) |
| **运维** | 部署指南、监控、故障排查 | [部署运维](07-deployment/) |
| **管理者** | 项目规划、进度跟踪、决策记录 | [项目规划](02-development/DEVELOPMENT_PLAN.md) |

### 按主题查找

| 主题 | 文档位置 | 状态 |
|------|----------|------|
| 热点监控 | [06-modules/hot-topics/](06-modules/hot-topics/) | ✅ |
| 内容创作 | [06-modules/content-creation/](06-modules/content-creation/) | ✅ |
| 平台发布 | [06-modules/publish-center/](06-modules/publish-center/) | ✅ |
| 数据分析 | [06-modules/analytics/](06-modules/analytics/) | ✅ |
| 视频创作 | [06-modules/video-creation/](06-modules/video-creation/) | ✅ |
| AI 服务 | [06-modules/ai-services/](06-modules/ai-services/) | ✅ |
| 认证授权 | [06-modules/authentication/](06-modules/authentication/) | ✅ |

---

## 📂 文档目录结构

```
docs/
├── 01-getting-started/          # 快速开始
│   └── quick-start.md              # 环境配置和启动指南
├── 02-development/              # 开发指南
│   ├── workflow.md                # 开发工作流
│   ├── DEVELOPMENT_PLAN.md        # 开发计划
│   ├── API.md                      # API 文档
│   ├── ARCHITECTURE.md            # 架构文档
│   └── ... (其他开发文档)
├── 03-architecture/             # 架构设计
│   └── adr-template.md            # 技术决策记录模板
├── 04-technical-standards/     # 技术规范
│   ├── index.md                  # 技术标准总览
│   ├── DOCUMENTATION_STANDARDS.md # 文档标准规范
│   ├── ENVIRONMENT_VARIABLES_STANDARD.md
│   ├── LOGGING_SYSTEM_STANDARD.md
│   ├── MONITORING_ALERT_SYSTEM.md
│   └── ... (其他技术规范)
├── 05-api/                   # API 文档（预留）
├── 06-modules/                # 功能模块文档
│   └── ai-services/             # AI 服务模块
├── 07-deployment/             # 部署运维（预留）
├── 08-troubleshooting/        # 故障排查
│   ├── common-issues.md         # 常见问题
│   └── SERVICE_LAUNCHER_TEST_PLAN.md
├── 09-reference/              # 参考资料
│   ├── QUICK_REFERENCE.md        # 快速参考
│   ├── AI-SERVICES-COMPARISON.md # AI服务对比
│   └── ... (其他参考资料)
├── 10-archive/               # 归档文档
│   ├── old-plans/             # 旧计划
│   ├── old-reports/           # 旧报告
│   ├── PROJECT_SEPARATION.md   # 归档项目
│   └── changelog-template.md    # 变更日志模板
├── specs/                    # 功能规格文档
│   ├── ai-analysis-enhancement/
│   ├── auto-dev-server/
│   ├── dark-mode-toggle/
│   ├── data-analytics/
│   ├── litellm-integration/
│   ├── mcp-publish-platform/
│   ├── remotion-video-generation/
│   ├── title-generation/
│   └── video-transcription/
└── INDEX.md
```

---

## 🚀 快速开始

### 新手入门
1. 阅读 [快速开始指南](01-getting-started/quick-start.md)
2. 配置开发环境
3. 启动项目服务
4. 了解基本概念

### 开发者入门
1. 阅读 [开发工作流](02-development/workflow.md)
2. 查看 [系统架构](03-architecture/system-architecture.md)
3. 学习 [API 文档](05-api/api-reference.md)
4. 遵循 [代码规范](02-development/coding-standards.md)

### 运维入门
1. 阅读 [部署指南](07-deployment/deployment-guide.md)
2. 配置 [监控系统](07-deployment/monitoring.md)
3. 学习 [故障排查](08-troubleshooting/common-issues.md)

---

## 🔍 文档搜索

### 按关键词搜索

| 关键词 | 相关文档 |
|--------|----------|
| **安装** | [快速开始](01-getting-started/quick-start.md), [部署指南](07-deployment/deployment-guide.md) |
| **配置** | [环境变量](04-technical-standards/ENVIRONMENT_VARIABLES_STANDARD.md), [快速参考](09-reference/QUICK_REFERENCE.md) |
| **API** | [API 参考](05-api/api-reference.md), [开发 API](02-development/API.md) |
| **认证** | [认证模块](06-modules/authentication/), [安全指南](04-technical-standards/QUICK_SECURITY_GUIDE.md) |
| **热点** | [热点监控](06-modules/hot-topics/), [热点数据](10-archive/old-reports/HOT_TOPICS_DATA_ANALYSIS.md) |
| **AI** | [AI 服务](06-modules/ai-services/), [AI 服务对比](09-reference/AI-SERVICES-COMPARISON.md) |
| **视频** | [视频创作](06-modules/video-creation/), [Remotion](specs/remotion-video-generation/) |
| **发布** | [发布中心](06-modules/publish-center/), [MCP 平台](specs/mcp-publish-platform/) |
| **安全** | [安全指南](04-technical-standards/QUICK_SECURITY_GUIDE.md), [安全加固](04-technical-standards/SECURITY_HARDENING_PLAN.md) |
| **监控** | [监控系统](04-technical-standards/MONITORING_ALERT_SYSTEM.md), [日志系统](04-technical-standards/LOGGING_SYSTEM_STANDARD.md) |
| **Ollama** | [LLM Gateway](server/services/llm.js), [LiteLLM 集成](specs/litellm-integration/) |
| **测试** | [测试计划](08-troubleshooting/SERVICE_LAUNCHER_TEST_PLAN.md), [测试指南](02-development/testing-guide.md) |

### 按任务类型搜索

| 任务类型 | 推荐文档 |
|---------|----------|
| 添加新功能 | [开发工作流](02-development/workflow.md), [规格标准](02-development/SPEC_STANDARDS.md) |
| 修复 Bug | [故障排查](08-troubleshooting/), [测试报告](09-reference/TEST-REPORT.md) |
| 优化性能 | [优化计划](02-development/OPTIMIZATION_PLAN.md), [性能调优](08-troubleshooting/performance-tuning.md) |
| 集成服务 | [架构设计](03-architecture/), [技术标准](04-technical-standards/) |
| 部署上线 | [部署指南](07-deployment/deployment-guide.md), [监控](04-technical-standards/MONITORING_ALERT_SYSTEM.md) |

---

## 📊 文档状态

### 完成度统计

| 分类 | 文档数 | 完成度 |
|------|--------|--------|
| 快速开始 | 1/2 | 50% |
| 开发指南 | 1/3 | 33% |
| 架构设计 | 0/3 | 0% |
| 技术规范 | 1/3 | 33% |
| API 文档 | 0/6 | 0% |
| 功能模块 | 0/7 | 0% |
| 部署运维 | 1/3 | 33% |
| 故障排查 | 0/3 | 0% |
| 参考资料 | 0/3 | 0% |
| **总计** | **4/36** | **11%** |

### 待创建文档

**高优先级**:
- [ ] 03-architecture/system-architecture.md
- [ ] 05-api/api-reference.md
- [ ] 06-modules/ 目录下的所有模块文档

**中优先级**:
- [ ] 02-development/coding-standards.md
- [ ] 02-development/testing-guide.md
- [ ] 07-deployment/deployment-guide.md
- [ ] 08-troubleshooting/common-issues.md

**低优先级**:
- [ ] 09-reference/ 目录下的所有文档
- [ ] 10-archive/deprecated-features.md

---

## 📝 文档维护

### 更新频率
- **核心文档**: 每次功能发布时更新
- **API 文档**: 每次 API 变更时更新
- **架构文档**: 重大架构调整时更新
- **故障排查**: 发现新问题时更新

### 贡献指南
1. 遵循 [文档标准规范](04-technical-standards/DOCUMENTATION_STANDARDS.md)
2. 使用清晰的标题层级
3. 提供代码示例
4. 添加必要的图表和说明
5. 更新相关索引

### 文档审查
- 每月进行一次文档审查
- 检查链接有效性
- 更新过时内容
- 收集用户反馈

---

## 🔗 相关资源

### 外部文档
- [Ollama 官方文档](https://ollama.com/docs)
- [OpenRouter API 文档](https://openrouter.ai/docs)
- [React 文档](https://react.dev)
- [Express 文档](https://expressjs.com)
- [MongoDB 文档](https://www.mongodb.com/docs)

### 项目资源
- [GitHub 仓库](https://github.com/your-org/ai-content-flow)
- [Issue 追踪](https://github.com/your-org/ai-content-flow/issues)
- [讨论区](https://github.com/your-org/ai-content-flow/discussions)

---

## 📞 获取帮助

### 文档问题
如果发现文档问题：
1. 检查 [常见问题](08-troubleshooting/common-issues.md)
2. 搜索 [Issue 追踪](https://github.com/your-org/ai-content-flow/issues)
3. 提交新的 Issue

### 技术支持
- 开发问题: [GitHub Discussions](https://github.com/your-org/ai-content-flow/discussions)
- 安全问题: security@example.com
- 商业咨询: contact@example.com

---

**文档维护者**: AI 开发团队
**创建时间**: 2026-02-19
**最后更新**: 2026-02-19
