---
title: AI Content Flow 核心开发计划
category: 项目规划
tags: [开发计划, 进度跟踪, 技术规范]
updated: 2026-02-19
version: v1.0
author: AI开发团队
---

# AI Content Flow 核心开发计划

> **本文档是项目开发的唯一依据，包含所有开发任务、进度跟踪和技术规范。**
> 
> **最后更新**: 2026-02-19 | **版本**: v1.0

---

## 一、项目背景与目标

### 1.1 项目概述

AI Content Flow 是一个全链路AI内容创作系统，实现从热点发现到内容发布的全流程自动化：

```
热点发现 → AI内容生成 → 平台发布 → 数据分析
```

### 1.2 核心目标

| 目标 | 描述 | 状态 |
|------|------|------|
| 热点监控 | 多平台热点数据抓取、分析、可视化 | ✅ 已完成 |
| AI内容生成 | 基于热点自动生成多平台适配内容 | ✅ 已完成 |
| 平台发布 | 支持抖音、今日头条、小红书等平台 | ✅ 已完成 |
| 数据分析 | 发布效果追踪、数据可视化 | ✅ 已完成 |
| 视频创作 | 视频生成、转录、智能创作 | ✅ 已完成 |

### 1.3 项目阶段

**当前阶段**: 核心功能开发完成阶段  
**总体进度**: 95%完成

---

## 二、技术栈选型

### 2.1 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI框架 |
| Vite | 5.4 | 构建工具 |
| TypeScript | 5.x | 类型系统 |
| Tailwind CSS | 3.4 | 样式框架 |
| shadcn/ui | latest | UI组件库 |
| React Router | 6.23 | 路由管理 |
| React Query | 5.x | 状态管理 |
| Recharts | 2.15 | 图表库 |

### 2.2 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | 5.x | Web框架 |
| MongoDB | 可选 | 数据库 |
| Node Cache | 5.1 | 缓存系统 |
| Winston | 3.19 | 日志系统 |
| JWT | 9.0 | 认证系统 |

### 2.3 AI服务

| 服务 | 用途 | 状态 |
|------|------|------|
| OpenRouter | LLM网关 | ✅ 已集成 |
| Groq | 快速推理 | ✅ 已集成 |
| Cerebras | 高性能推理 | ✅ 已集成 |
| DeepSeek | 中文优化 | ✅ 已集成 |
| Ollama | 本地部署 | ✅ 已集成 |
| LiteLLM Gateway | 多提供商统一接口 | ✅ 已集成 |

### 2.4 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务 | 5174 | Vite开发服务器 |
| 后端API服务 | 5001 | Express服务器 |

---

## 三、功能模块划分

### 3.1 模块概览

```
AI Content Flow
├── 热点监控模块 (HotTopics)
│   ├── 多平台数据抓取
│   ├── 热度分析与趋势预测
│   ├── 数据可视化
│   └── 分类管理
├── 内容创作模块 (ContentCreation)
│   ├── AI内容生成
│   ├── 标题优化
│   ├── 多平台适配
│   └── 质量评估
├── 发布中心模块 (PublishCenter)
│   ├── 多平台发布
│   ├── 发布队列
│   └── 状态追踪
├── 数据分析模块 (Analytics)
│   ├── 数据可视化
│   ├── 统计分析
│   └── 报表生成
├── 视频创作模块 (VideoCreation)
│   ├── Remotion视频生成
│   ├── 视频转录
│   └── 智能创作
└── 系统服务模块 (System)
    ├── 认证授权
    ├── 日志监控
    └── 配置管理
```

### 3.2 模块状态详情

| 模块 | 完成度 | 状态 | 主要功能 |
|------|--------|------|----------|
| 热点监控 | 100% | ✅ 已完成 | 11平台数据源、热度分析、趋势预测 |
| 内容创作 | 100% | ✅ 已完成 | AI生成、标题优化、多平台适配 |
| 发布中心 | 100% | ✅ 已完成 | 抖音/头条/小红书发布 |
| 数据分析 | 100% | ✅ 已完成 | 可视化、统计、报表 |
| 视频创作 | 100% | ✅ 已完成 | 视频生成、转录、智能创作 |
| 系统服务 | 100% | ✅ 已完成 | JWT认证、日志、监控 |

---

## 四、任务分解与状态

### 4.1 任务状态统计

| 类别 | 总计 | 已完成 | 进行中 | 待开始 |
|------|------|--------|--------|--------|
| 安全问题 (P0) | 9 | 9 | 0 | 0 |
| 高优先级 (P1) | 3 | 3 | 0 | 0 |
| 中优先级 (P2) | 2 | 2 | 0 | 0 |
| 低优先级 (P3) | 1 | 0 | 0 | 1 |
| **总计** | **15** | **14** | **0** | **1** |

### 4.2 P0 - 安全问题（已全部完成）

| 任务ID | 任务名称 | 状态 | 完成日期 |
|--------|----------|------|----------|
| SEC-001 | 移除硬编码密钥 | ✅ | 2026-02-17 |
| SEC-002 | 完善JWT认证（刷新令牌） | ✅ | 2026-02-17 |
| SEC-003 | API速率限制 | ✅ | 2026-02-17 |
| SEC-004 | 请求验证中间件 | ✅ | 2026-02-17 |
| SEC-005 | 清理.env硬编码密钥 | ✅ | 2026-02-17 |
| SEC-006 | 移除默认密码 | ✅ | 2026-02-17 |
| SEC-007 | 创建.env.example模板 | ✅ | 2026-02-17 |
| SEC-008 | 端口配置优化（5000→5001） | ✅ | 2026-02-17 |
| SEC-009 | 热点监控安全机制 | ✅ | 2026-02-17 |

### 4.3 P1 - 高优先级任务（已全部完成）

| 任务ID | 任务名称 | 状态 | 完成日期 | 规格文档 |
|--------|----------|------|----------|----------|
| P1-001 | Auto Dev Server | ✅ | 2026-02-16 | [specs/auto-dev-server](specs/auto-dev-server/) |
| P1-002 | 深色模式切换 | ✅ | 2026-02-16 | [specs/dark-mode-toggle](specs/dark-mode-toggle/) |
| P1-003 | Remotion视频生成 | ✅ | 2026-02-16 | [specs/remotion-video-generation](specs/remotion-video-generation/) |

### 4.4 P2 - 中优先级任务（已全部完成）

| 任务ID | 任务名称 | 状态 | 完成日期 | 规格文档 |
|--------|----------|------|----------|----------|
| P2-001 | LiteLLM多提供商集成 | ✅ | 2026-02-18 | [specs/litellm-integration](specs/litellm-integration/) |
| P2-002 | 视频转录功能 | ✅ | 2026-02-17 | [specs/video-transcription](specs/video-transcription/) |

### 4.5 P3 - 低优先级任务

| 任务ID | 任务名称 | 状态 | 预估工时 | 规格文档 |
|--------|----------|------|----------|----------|
| P3-001 | MCP发布平台扩展 | ❌ 待开始 | 60+小时 | [specs/mcp-publish-platform](specs/mcp-publish-platform/) |

**P3-001 子任务**:
- [ ] 平台适配器架构设计
- [ ] 今日头条发布适配器
- [ ] 抖音发布适配器
- [ ] 小红书发布适配器
- [ ] 微信公众号发布适配器
- [ ] 发布队列管理
- [ ] 发布状态追踪
- [ ] 前端发布中心界面

---

## 五、API接口定义

### 5.1 热点监控API

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/hot-topics` | GET | 热点列表 | ✅ |
| `/api/hot-topics/:id` | GET | 热点详情 | ✅ |
| `/api/hot-topics/refresh` | POST | 刷新热点 | ✅ |
| `/api/hot-topics/newsnow/sources` | GET | 数据源列表 | ✅ |
| `/api/hot-topics/trends/new` | GET | 新增热点 | ✅ |
| `/api/hot-topics/ai/analyze` | POST | AI分析 | ✅ |

### 5.2 内容创作API

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/content/generate` | POST | 生成内容 | ✅ |
| `/api/content/optimize-title` | POST | 优化标题 | ✅ |
| `/api/content/adapt` | POST | 平台适配 | ✅ |
| `/api/content/assess` | POST | 质量评估 | ✅ |

### 5.3 发布中心API

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/publish/platforms` | GET | 平台列表 | ✅ |
| `/api/publish/publish` | POST | 发布内容 | ✅ |
| `/api/publish/status/:id` | GET | 发布状态 | ✅ |

### 5.4 认证API

| 端点 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/auth/login` | POST | 用户登录 | ✅ |
| `/api/auth/refresh` | POST | 刷新令牌 | ✅ |
| `/api/auth/logout` | POST | 用户登出 | ✅ |

---

## 六、数据源配置

### 6.1 热点数据源（11个平台）

| 平台 | 数据源ID | 备用Fetcher | 状态 |
|------|----------|-------------|------|
| 微博热搜 | weibo | WeiboFetcher | ✅ |
| 知乎热榜 | zhihu | ZhihuFetcher | ✅ |
| 今日头条 | toutiao | ToutiaoFetcher | ✅ |
| 百度热搜 | baidu | BaiduFetcher | ✅ |
| 抖音热点 | douyin | DouyinFetcher | ✅ |
| B站热门 | bilibili-hot-search | BilibiliFetcher | ✅ |
| 贴吧热议 | tieba | TiebaFetcher | ✅ |
| 澎湃新闻 | thepaper | ThepaperFetcher | ✅ |
| 凤凰网 | ifeng | IfengFetcher | ✅ |
| 华尔街见闻 | wallstreetcn-hot | WallstreetcnFetcher | ✅ |
| 财联社 | cls-hot | ClsFetcher | ✅ |

---

## 七、文档更新机制

### 7.1 更新规则

1. **任务完成时**: 立即更新对应任务状态
2. **新增功能时**: 添加功能描述和API定义
3. **修改接口时**: 更新API文档部分
4. **每日结束时**: 更新"最后更新"日期

### 7.2 状态标识

| 标识 | 含义 |
|------|------|
| ✅ | 已完成 |
| 🔄 | 进行中 |
| ❌ | 待开始 |
| ⚠️ | 有风险 |
| 🚫 | 已取消 |

### 7.3 版本规范

- **主版本号**: 重大架构变更
- **次版本号**: 新增功能模块
- **修订号**: Bug修复和小改进

### 7.4 更新记录

| 日期 | 版本 | 更新内容 | 更新人 |
|------|------|----------|--------|
| 2026-02-19 | v1.0 | 创建核心开发计划文档，整合多个开发文档 | AI助手 |
| 2026-02-18 | - | 完成热点-内容关联、AI标题优化 | AI助手 |
| 2026-02-17 | - | 完成所有安全问题修复 | AI助手 |
| 2026-02-16 | - | 完成Remotion视频生成、视频转录 | AI助手 |

---

## 八、开发规范

### 8.1 代码规范

- 使用ESLint进行代码检查
- 遵循项目既有的代码风格
- 禁止使用Mock数据（除非明确说明）
- 所有API必须有错误处理

### 8.2 提交规范

```
<type>(<scope>): <subject>

type: feat|fix|docs|style|refactor|test|chore
scope: hot-topics|content|publish|analytics|video|system
```

### 8.3 分支规范

- `main` - 生产分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 紧急修复分支

---

## 九、相关文档索引

| 文档 | 位置 | 说明 |
|------|------|------|
| 文档中心 | [INDEX.md](INDEX.md) | 文档总索引 |
| 快速开始 | [01-getting-started/quick-start.md](01-getting-started/quick-start.md) | 环境配置指南 |
| 开发工作流 | [02-development/workflow.md](02-development/workflow.md) | 标准开发流程 |
| 文档标准 | [DOCUMENTATION_STANDARDS.md](DOCUMENTATION_STANDARDS.md) | 文档编写规范 |
| API参考 | [05-api/api-reference.md](05-api/api-reference.md) | 完整API文档 |
| 架构设计 | [03-architecture/system-architecture.md](03-architecture/system-architecture.md) | 系统架构说明 |
| 安全指南 | [security/QUICK_SECURITY_GUIDE.md](security/QUICK_SECURITY_GUIDE.md) | 安全开发规范 |
| 环境变量 | [ENVIRONMENT_VARIABLES_STANDARD.md](ENVIRONMENT_VARIABLES_STANDARD.md) | 环境配置标准 |

---

## 十、文档整合计划

### 10.1 文档整合目标

1. 建立清晰的文档分类体系
2. 统一文档命名和格式规范
3. 优化文档组织结构
4. 提升文档检索效率
5. 建立文档维护机制

### 10.2 文档分类体系

#### 按用途分类
- **01-getting-started/**: 快速开始指南
- **02-development/**: 开发指南和规范
- **03-architecture/**: 架构设计文档
- **04-standards/**: 技术规范标准
- **05-api/**: API 完整文档
- **06-modules/**: 功能模块详细说明
- **07-deployment/**: 部署运维指南
- **08-troubleshooting/**: 故障排查文档
- **09-reference/**: 参考资料和术语
- **10-archive/**: 归档和历史文档

#### 按受众分类
- **新手**: 快速开始、安装指南、基础教程
- **开发者**: API 文档、架构设计、开发规范
- **运维**: 部署指南、监控、故障排查
- **管理者**: 项目规划、进度跟踪、决策记录

### 10.3 文档命名规范

#### 文件命名规则
- 使用小写字母
- 使用连字符（-）分隔单词
- 使用描述性名称
- 避免缩写（除非广泛认知）

#### 示例
- ✅ `quick-start.md`
- ✅ `api-reference.md`
- ✅ `deployment-guide.md`
- ❌ `quickstart.md`
- ❌ `api_ref.md`
- ❌ `deploy.md`

### 10.4 文档格式规范

#### 元数据头部
每个文档应包含：
```markdown
---
title: 文档标题
category: 分类
tags: [标签1, 标签2]
updated: 2026-02-19
version: 1.0
author: 作者名称
---
```

#### 标题层级
```markdown
# 文档标题（每个文档只有一个）
## 主要章节
### 子章节
#### 详细说明
```

### 10.5 待完成文档

#### 高优先级
- [ ] 03-architecture/system-architecture.md - 系统架构文档
- [ ] 05-api/api-reference.md - API 完整参考
- [ ] 06-modules/ 目录下的所有模块文档

#### 中优先级
- [ ] 02-development/coding-standards.md - 代码规范
- [ ] 02-development/testing-guide.md - 测试指南
- [ ] 07-deployment/deployment-guide.md - 部署指南
- [ ] 08-troubleshooting/common-issues.md - 常见问题

#### 低优先级
- [ ] 09-reference/ 目录下的所有文档
- [ ] 10-archive/deprecated-features.md - 已弃用功能

### 10.6 文档维护机制

#### 更新频率
- **核心文档**: 每次功能发布时更新
- **API 文档**: 每次 API 变更时更新
- **架构文档**: 重大架构调整时更新
- **故障排查**: 发现新问题时更新

#### 审查流程
- 每月进行一次文档审查
- 检查链接有效性
- 更新过时内容
- 收集用户反馈

#### 贡献指南
1. 遵循文档标准规范
2. 使用清晰的标题层级
3. 提供代码示例
4. 添加必要的图表和说明
5. 更新相关索引

---

**文档维护者**: AI开发团队  
**创建时间**: 2026-02-19  
**最后更新**: 2026-02-19
