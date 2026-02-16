# AI Content Flow 开发计划

> 本文档汇总项目待落地任务，为后续 AI 开发者提供清晰的执行路线。

## 当前状态

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 热点发现 | 80% | 基本可用 |
| 内容生成 | 70% | 基本可用 |
| 数据分析 | 40% | 待完善 |
| Remotion视频生成 | 50% | 进行中 |
| 视频转录 | 0% | 未开始 |
| MCP发布平台 | 0% | 未开始 |
| LiteLLM集成 | 0% | 未开始 |
| Auto Dev Server | 0% | 未开始 |
| 深色模式切换 | 0% | 未开始 |

## 优先级任务列表

### P0 - 紧急（安全问题）

| 任务 | 说明 | 状态 |
|------|------|------|
| SEC-001: 移除硬编码密钥 | 全面扫描并移除代码中的硬编码凭证 | ✅ 已完成 |
| SEC-002: 完善JWT认证 | 增强JWT安全性，实现刷新令牌机制 | ✅ 已完成 |
| SEC-003: API速率限制 | 配置和优化请求频率限制 | ✅ 已完成 |
| SEC-004: 请求验证中间件 | 实现输入验证和防护机制 | ⚠️ 进行中 |
| 清理 .env 中的硬编码密钥 | 已移除 QWEN_API_KEY、OPENROUTER_API_KEY | ✅ 已完成 |
| 移除默认密码 | 已移除 ADMIN_PASSWORD 默认值 | ✅ 已完成 |
| 创建 .env.example | 已创建配置模板 | ✅ 已完成 |
| 端口配置优化 | 后端服务端口 5000→5001 | ✅ 已完成 |
| 热点监控安全机制 | 15分钟安全更新频率配置 | ✅ 已完成 |

### P1 - 高优先级

| 任务 | 规格文档 | 预估工时 | 状态 |
|------|----------|----------|------|
| Auto Dev Server | [specs/auto-dev-server](specs/auto-dev-server/) | 4小时 | 待开始 |
| 深色模式切换 | [specs/dark-mode-toggle](specs/dark-mode-toggle/) | 2小时 | 待开始 |
| Remotion视频生成（剩余） | [specs/remotion-video-generation](specs/remotion-video-generation/) | 8-12小时 | 50%完成 |

### P2 - 中优先级

| 任务 | 规格文档 | 预估工时 | 状态 |
|------|----------|----------|------|
| LiteLLM多提供商集成 | [specs/litellm-integration](specs/litellm-integration/) | 10-12小时 | 待开始 |
| 视频转录功能 | [specs/video-transcription](specs/video-transcription/) | 3周 | 待开始 |

### P3 - 低优先级

| 任务 | 规格文档 | 预估工时 | 状态 |
|------|----------|----------|------|
| MCP发布平台 | [specs/mcp-publish-platform](specs/mcp-publish-platform/) | 大项目 | 待开始 |

## 详细任务清单

### 1. Auto Dev Server（4小时）

**目标**: 实现前后端服务一键启动

**任务列表**:
- [x] 创建技能目录结构
- [x] 实现 ConfigManager（配置管理器）
- [x] 实现 ProcessManager（进程管理器）
- [x] 实现 AutoDevServer 主控制器
- [x] 创建 CLI 入口
- [x] 编写测试和文档
- [x] 集成到主项目 npm scripts

**规格文档**: `docs/specs/auto-dev-server/tasklist.md`

### 2. 深色模式切换（2小时）

**目标**: 实现深色/浅色主题切换

**任务列表**:
- [ ] 安装 next-themes 依赖
- [ ] 创建 CSS 变量定义
- [ ] 配置 ThemeProvider
- [ ] 创建 ThemeToggle 组件
- [ ] 集成到导航栏
- [ ] 测试功能

**规格文档**: `docs/specs/dark-mode-toggle/tasklist.md`

### 3. Remotion视频生成（剩余36个子任务）

**目标**: 完成视频生成功能

**已完成**:
- 基础架构
- 模板系统
- 渲染服务

**待完成**:
- 更多视频模板
- 批量生成
- 性能优化
- 错误处理

**规格文档**: `docs/specs/remotion-video-generation/tasklist.md`

### 4. LiteLLM多提供商集成（10-12小时）

**目标**: 整合多个免费 LLM API

**任务列表**:
- [ ] 创建 LLM 服务目录结构
- [ ] 实现 BaseProvider 基类
- [ ] 实现 OpenRouter 适配器
- [ ] 实现 Groq 适配器
- [ ] 实现 Cerebras 适配器
- [ ] 实现 LLMGateway 主控制器
- [ ] 创建 API 路由
- [ ] 编写测试

**规格文档**: `docs/specs/litellm-integration/tasklist.md`

### 5. 视频转录功能（3周）

**目标**: 实现视频语音转文字

**任务列表**:
- [ ] 阶段1: 基础设施
- [ ] 阶段2: Whisper本地转录
- [ ] 阶段3: 云服务集成
- [ ] 阶段4: API和前端

**规格文档**: `docs/specs/video-transcription/tasklist.md`

## 执行建议

### 推荐顺序

1. **Auto Dev Server** - 提升开发效率，后续开发更便捷
2. **深色模式切换** - 快速完成，提升用户体验
3. **LiteLLM集成** - 增强 AI 能力，支持更多模型
4. **Remotion视频生成** - 完成剩余功能
5. **视频转录** - 大功能，需要较长时间

### 开发流程

1. 阅读对应规格文档的 `requirements.md`
2. 参考 `design.md` 了解技术方案
3. 按照 `tasklist.md` 逐项完成
4. 完成后更新任务状态

### 注意事项

1. **禁止使用 Mock 数据** - 参考 `docs/dev/AI_DEVELOPER_GUIDELINES.md`
2. **先咨询后行动** - 重大决策需确认
3. **保持文档同步** - 完成功能后更新文档

## 相关文档

- [AI 开发者准则](dev/AI_DEVELOPER_GUIDELINES.md)
- [开发工作流](dev/DEV_WORKFLOW.md)
- [规格文档标准](dev/SPEC_STANDARDS.md)
- [问题修复记录](dev/ISSUE_HOT_TOPICS_MOCK_DATA.md)
- [未落地任务清单](UNIMPLEMENTED_TASKS.md) ← 新增：详细任务分解和优先级排序

---

**创建时间**: 2026-02-16
**最后更新**: 2026-02-16
