# 项目文件清理备份清单

## 清理日期
2026-02-19

## 清理目的
- 整理项目MD文档，建立统一的文档管理体系
- 清理过时、不再使用的冗余文件
- 提升项目整洁度和维护效率

---

## 一、临时工作文件（已备份到 backup/docs-cleanup-2026-02-19/）

| 文件 | 原位置 | 说明 | 清理原因 |
|------|--------|------|----------|
| findings.md | 根目录 | 项目分析发现文档 | 临时工作文档，内容已归档到docs |
| progress.md | 根目录 | 进度记录文档 | 临时工作文档，内容已归档到docs |
| task_plan.md | 根目录 | 任务计划文档 | 临时工作文档，内容已归档到docs |

---

## 二、日志文件（已备份到 backup/logs-2026-02-19/）

| 文件 | 原位置 | 说明 |
|------|--------|------|
| logs/*.log | logs/ | 根目录日志文件 |
| server/logs/*.log | server/logs/ | 服务器日志文件 |

---

## 三、文档分类整理

### 保留的核心文档（docs/）

#### 1. 入门指南 (01-getting-started/)
- quick-start.md - 快速开始指南

#### 2. 开发指南 (02-development/)
- workflow.md - 开发工作流

#### 3. 技术标准 (04-technical-standards/)
- index.md - 技术标准索引

#### 4. 分析文档 (analysis/)
- AI-SERVICES-COMPARISON.md
- ARCHITECTURE.md
- BACKEND_ARCHITECTURE_ANALYSIS.md
- DEVELOPMENT-PLAN.md
- DEVELOPMENT.md
- NEXT-DEV-PLAN.md
- TEST-REPORT.md
- hot-topics-migration-analysis.md

#### 5. 开发文档 (dev/)
- AI_COLLABORATION.md
- AI_DEVELOPER_GUIDELINES.md
- API.md
- ARCHITECTURE.md
- AUTO_DEV_SERVER_GUIDE.md
- DATA_STORAGE.md
- ISSUE_HOT_TOPICS_MOCK_DATA.md
- OPTIMIZATION_PLAN.md
- QUICK_REFERENCE.md
- SPEC_STANDARDS.md

#### 6. 计划文档 (plans/)
- 2026-02-18-architecture-reorganization-design.md
- 2026-02-18-service-stability-improvements.md
- 2026-02-18-title-optimization-design.md
- 2026-02-18-title-optimization-implementation-plan.md

#### 7. 研究文档 (research/)
- TECH_RESEARCH.md

#### 8. 安全文档 (security/)
- JWT_REFRESH_TOKEN_IMPLEMENTATION_REPORT.md
- QUICK_SECURITY_GUIDE.md
- SEC-004_IMPLEMENTATION_REPORT.md
- SECURITY_HARDENING_PLAN.md

#### 9. 规格文档 (specs/)
- auto-dev-server/
- dark-mode-toggle/
- data-analytics/
- litellm-integration/
- mcp-publish-platform/
- remotion-video-generation/
- video-transcription/

#### 10. 归档文档 (archive/)
- PROJECT_SEPARATION.md

---

## 四、清理建议

### 可删除的临时文件
1. 根目录的 findings.md、progress.md、task_plan.md（已备份）
2. logs/ 目录下的旧日志文件（已备份）
3. server/logs/ 目录下的旧日志文件（已备份）

### 需要合并的重复文档
1. docs/ARCHITECTURE.md 与 docs/dev/ARCHITECTURE.md
2. docs/DEVELOPMENT_PLAN.md 与 docs/analysis/DEVELOPMENT-PLAN.md

### 需要更新的文档
1. INDEX.md - 需要更新文档索引
2. PROJECT_SUMMARY.md - 需要更新项目摘要

---

## 五、恢复方法

如需恢复被清理的文件，请从以下目录复制：
- 文档备份：backup/docs-cleanup-2026-02-19/
- 日志备份：backup/logs-2026-02-19/
- 脚本备份：backup/scripts-2026-02-19/

---

## 六、清理执行记录

- [x] 创建备份目录
- [x] 备份临时工作文件
- [x] 备份日志文件
- [x] 删除临时工作文件（findings.md, progress.md, task_plan.md）
- [x] 清理旧日志文件（logs/目录）
- [x] 更新文档索引（docs/INDEX.md）
- [x] 创建文档管理规范

## 七、清理完成总结

### 清理的文件
1. 根目录临时工作文件：3个（已备份后删除）
2. 根目录日志文件：5个（已备份后清理）

### 保留的文档结构
- docs/ 目录下的所有文档按功能分类整理
- 共11个文档分类目录
- 更新了完整的文档索引

### 备份位置
- backup/docs-cleanup-2026-02-19/ - 文档备份
- backup/logs-2026-02-19/ - 日志备份
- backup/scripts-2026-02-19/ - 脚本备份

### 清理日期
2026-02-19

---

## 八、文档整合优化记录（2026-02-19）

### 整合目标
将多个分散的开发计划文档整合为单一核心文档，建立标准化的文档结构与内容规范。

### 整合的文档

| 原文档 | 原位置 | 处理方式 |
|--------|--------|----------|
| DEVELOPMENT_PLAN.md | docs/ | 重写为核心开发计划 |
| DEVELOPMENT-PLAN.md | docs/analysis/ | 移动到 archive/old-plans/ |
| DEVELOPMENT.md | docs/analysis/ | 移动到 archive/old-plans/ |
| PROJECT_TASK_STATUS_OVERVIEW.md | docs/ | 移动到 archive/old-plans/ |
| UNIMPLEMENTED_TASKS.md | docs/ | 移动到 archive/old-plans/ |

### 核心文档结构

**docs/DEVELOPMENT_PLAN.md** 现在包含：
1. 项目背景与目标
2. 技术栈选型
3. 功能模块划分
4. 任务分解与状态
5. API接口定义
6. 数据源配置
7. 文档更新机制
8. 开发规范
9. 相关文档索引

### 文档更新机制

建立了标准化的文档更新规则：
- 任务完成时：立即更新对应任务状态
- 新增功能时：添加功能描述和API定义
- 修改接口时：更新API文档部分
- 每日结束时：更新"最后更新"日期

### 归档位置

旧文档已移动到：`docs/archive/old-plans/`

### 整合日期
2026-02-19
