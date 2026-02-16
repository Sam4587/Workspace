# 📚 AI Content Flow 文档中心

欢迎来到 AI Content Flow 项目的完整文档中心！

## 🗂️ 文档结构

### 📖 01 - 入门指南
帮助新手快速上手项目开发
- [快速开始](01-getting-started/quick-start.md) - 环境配置、启动服务、基本使用

### 🛠️ 02 - 开发指南  
开发者日常工作参考手册
- [开发工作流](02-development/workflow.md) - 标准7步开发流程
- [架构设计](dev/ARCHITECTURE.md) - 系统架构详解 *(待迁移)*
- [API参考](dev/API.md) - 接口规范说明 *(待更新)*

### 📋 03 - 功能规格
各功能模块的详细规格文档
- `specs/auto-dev-server/` - 自动化开发服务器
- `specs/dark-mode-toggle/` - 深色模式切换
- `specs/remotion-video-generation/` - Remotion视频生成
- `specs/video-transcription/` - 视频转录功能
- `specs/litellm-integration/` - LiteLLM集成
- `specs/mcp-publish-platform/` - MCP发布平台 *(待开发)*

### 🔧 04 - 技术标准
项目技术规范和最佳实践
- [技术标准规范](04-technical-standards/index.md) - 统一的技术标准文档

### 📊 05 - 项目管理
项目进度跟踪和规划文档
- [任务状态汇总](PROJECT_TASK_STATUS_OVERVIEW.md) - 当前项目进度
- [开发计划](DEVELOPMENT_PLAN.md) - 未来开发规划
- [项目概述](PROJECT_SUMMARY.md) - 项目背景和目标

### 🔒 Security - 安全文档
安全相关的设计和实施文档
- 安全加固计划
- JWT实施报告
- 数据保护规范

---

## 🎯 文档使用指南

### 👶 新手开发者
1. 从 [快速开始](01-getting-started/quick-start.md) 开始
2. 阅读 [开发工作流](02-development/workflow.md) 了解标准流程
3. 参考对应功能的规格文档进行开发

### 👨‍💻 资深开发者
1. 直接查阅 [技术标准](04-technical-standards/index.md)
2. 参考 [架构设计](dev/ARCHITECTURE.md) 进行系统设计
3. 查看 [任务状态](PROJECT_TASK_STATUS_OVERVIEW.md) 了解项目进展

### 🎨 产品经理/设计师
1. 查看 [项目概述](PROJECT_SUMMARY.md) 了解产品定位
2. 参考 [开发计划](DEVELOPMENT_PLAN.md) 了解路线图
3. 查看各功能规格文档了解具体功能设计

---

## 📝 文档维护规范

### 更新原则
- **及时性**: 代码变更后及时更新相关文档
- **准确性**: 确保文档内容与实际实现一致
- **完整性**: 重要功能必须配有相应文档
- **易读性**: 使用清晰的结构和通俗的语言

### 贡献流程
1. 修改文档前先创建功能分支
2. 更新相关内容并自检
3. 提交PR并请求审查
4. 合并后通知团队成员

### 文档格式标准
- 使用Markdown格式编写
- 遵循统一的标题层级
- 代码示例要有明确的说明
- 重要信息使用适当的强调标记

---

## 🔍 快速查找

### 按主题查找
- **环境配置**: [快速开始](01-getting-started/quick-start.md)
- **开发流程**: [开发工作流](02-development/workflow.md)  
- **API接口**: [API参考](dev/API.md)
- **技术规范**: [技术标准](04-technical-standards/index.md)
- **项目进度**: [任务状态](PROJECT_TASK_STATUS_OVERVIEW.md)

### 按角色查找
- **开发人员**: 01、02、03、04目录
- **项目经理**: 05目录 + specs目录
- **运维人员**: 04技术标准 + security目录
- **新团队成员**: 01入门指南

---

## 🆘 获取帮助

如果文档中有不清楚的地方：
1. 在文档对应的GitHub Issue中提问
2. 联系文档维护者
3. 在团队技术分享会上讨论

---
**文档版本**: v2.0  
**最后更新**: 2026年2月16日  
**维护团队**: AI开发团队