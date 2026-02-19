# AI Content Flow 文档中心

欢迎来到 AI Content Flow 项目的完整文档中心！

## 核心文档

### 开发计划（唯一依据）

**[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)** - 项目核心开发计划

这是项目开发的**唯一依据文档**，包含：
- 项目背景与目标
- 技术栈选型
- 功能模块划分
- 任务分解与状态
- API接口定义
- 数据源配置
- 文档更新机制
- 开发规范

---

## 文档结构

### 01 - 入门指南
帮助新手快速上手项目开发
- [快速开始](01-getting-started/quick-start.md) - 环境配置、启动服务、基本使用

### 02 - 开发指南
开发者日常工作参考手册
- [开发工作流](02-development/workflow.md) - 标准开发流程

### 03 - 功能规格
各功能模块的详细规格文档
- `specs/auto-dev-server/` - 自动化开发服务器
- `specs/dark-mode-toggle/` - 深色模式切换
- `specs/data-analytics/` - 数据分析功能
- `specs/litellm-integration/` - LiteLLM集成
- `specs/mcp-publish-platform/` - MCP发布平台
- `specs/remotion-video-generation/` - Remotion视频生成
- `specs/video-transcription/` - 视频转录功能

### 04 - 技术标准
项目技术规范和最佳实践
- [技术标准规范](04-technical-standards/index.md) - 统一的技术标准文档

### 05 - 开发文档
详细的开发参考文档
- [AI协作指南](dev/AI_COLLABORATION.md) - AI辅助开发规范
- [AI开发准则](dev/AI_DEVELOPER_GUIDELINES.md) - AI开发最佳实践
- [API参考](dev/API.md) - 接口规范说明
- [架构设计](dev/ARCHITECTURE.md) - 系统架构详解
- [自动开发服务器指南](dev/AUTO_DEV_SERVER_GUIDE.md) - 自动化开发工具
- [数据存储](dev/DATA_STORAGE.md) - 数据存储方案
- [优化计划](dev/OPTIMIZATION_PLAN.md) - 性能优化计划
- [快速参考](dev/QUICK_REFERENCE.md) - 常用命令速查
- [规格标准](dev/SPEC_STANDARDS.md) - 规格文档编写标准

### 06 - 分析文档
项目分析和技术调研
- [AI服务对比](analysis/AI-SERVICES-COMPARISON.md) - AI服务选型分析
- [架构分析](analysis/ARCHITECTURE.md) - 系统架构分析
- [后端架构分析](analysis/BACKEND_ARCHITECTURE_ANALYSIS.md) - 后端架构详解
- [下一步计划](analysis/NEXT-DEV-PLAN.md) - 近期开发计划
- [测试报告](analysis/TEST-REPORT.md) - 测试结果报告
- [热点迁移分析](analysis/hot-topics-migration-analysis.md) - 热点数据迁移分析

### 07 - 计划文档
项目规划和设计文档
- [架构重组设计](plans/2026-02-18-architecture-reorganization-design.md)
- [服务稳定性改进](plans/2026-02-18-service-stability-improvements.md)
- [标题优化设计](plans/2026-02-18-title-optimization-design.md)
- [标题优化实施计划](plans/2026-02-18-title-optimization-implementation-plan.md)

### 08 - 研究文档
技术研究报告
- [技术研究](research/TECH_RESEARCH.md) - 技术调研报告

### 09 - 安全文档
安全相关的设计和实施文档
- [JWT刷新令牌实施报告](security/JWT_REFRESH_TOKEN_IMPLEMENTATION_REPORT.md)
- [快速安全指南](security/QUICK_SECURITY_GUIDE.md)
- [SEC-004实施报告](security/SEC-004_IMPLEMENTATION_REPORT.md)
- [安全加固计划](security/SECURITY_HARDENING_PLAN.md)

### 10 - 归档文档
已归档的历史文档
- [项目分离文档](archive/PROJECT_SEPARATION.md)
- `archive/old-plans/` - 已整合的旧开发计划文档

### 11 - 项目管理
项目进度跟踪和规划文档
- [数据获取安全指南](DATA_FETCHING_SECURITY_GUIDE.md)
- [文档优化报告](DOCUMENTATION_OPTIMIZATION_REPORT.md)
- [文档标准](DOCUMENTATION_STANDARDS.md)
- [环境变量标准](ENVIRONMENT_VARIABLES_STANDARD.md)
- [热点数据分析](HOT_TOPICS_DATA_ANALYSIS.md)
- [日志系统标准](LOGGING_SYSTEM_STANDARD.md)
- [监控告警系统](MONITORING_ALERT_SYSTEM.md)
- [项目分离](PROJECT_SEPARATION.md)
- [项目概述](PROJECT_SUMMARY.md)
- [标准端口配置](STANDARD_PORT_CONFIGURATION.md)

---

## 文档使用指南

### 新手开发者
1. 从 [快速开始](01-getting-started/quick-start.md) 开始
2. 阅读 [核心开发计划](DEVELOPMENT_PLAN.md) 了解项目全貌
3. 参考 [开发工作流](02-development/workflow.md) 了解标准流程

### 资深开发者
1. 直接查阅 [核心开发计划](DEVELOPMENT_PLAN.md) 了解任务状态
2. 参考 [架构设计](dev/ARCHITECTURE.md) 进行系统设计
3. 查看 [API参考](dev/API.md) 了解接口规范

### 产品经理/设计师
1. 查看 [项目概述](PROJECT_SUMMARY.md) 了解产品定位
2. 参考 [核心开发计划](DEVELOPMENT_PLAN.md) 了解进度
3. 查看各功能规格文档了解具体功能设计

---

## 文档维护规范

### 更新原则
- **及时性**: 代码变更后及时更新相关文档
- **准确性**: 确保文档内容与实际实现一致
- **完整性**: 重要功能必须配有相应文档
- **易读性**: 使用清晰的结构和通俗的语言

### 核心文档更新机制

**[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)** 是项目开发的唯一依据：

1. **任务完成时**: 立即更新对应任务状态
2. **新增功能时**: 添加功能描述和API定义
3. **修改接口时**: 更新API文档部分
4. **每日结束时**: 更新"最后更新"日期

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

## 快速查找

### 按主题查找
| 主题 | 文档位置 |
|------|----------|
| 开发计划 | [核心开发计划](DEVELOPMENT_PLAN.md) |
| 环境配置 | [快速开始](01-getting-started/quick-start.md) |
| 开发流程 | [开发工作流](02-development/workflow.md) |
| API接口 | [API参考](dev/API.md) |
| 技术规范 | [技术标准](04-technical-standards/index.md) |
| 安全相关 | [安全文档目录](security/) |
| 架构设计 | [架构分析](analysis/ARCHITECTURE.md) |

### 按角色查找
| 角色 | 推荐文档 |
|------|----------|
| 开发人员 | 核心开发计划 + 01、02、03、04、05目录 |
| 项目经理 | 核心开发计划 + 06、11目录 |
| 运维人员 | 04技术标准 + security目录 |
| 新团队成员 | 01入门指南 + 核心开发计划 |

---

## 获取帮助

如果文档中有不清楚的地方：
1. 在文档对应的GitHub Issue中提问
2. 联系文档维护者
3. 在团队技术分享会上讨论

---

**文档版本**: v4.0  
**最后更新**: 2026年2月19日  
**维护团队**: AI开发团队
