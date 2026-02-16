# 项目分离说明

## 分离时间
- 日期：2025-02-16
- 操作者：MonkeyCode AI

## 项目概述

TrendRadar（热点监控与内容运营系统）已完成项目分离，将多平台发布工具系统独立为单独的项目。

## 分离原因

### 1. 独立的业务域
- **TrendRadar（本项目）**：专注于热点监控、AI内容生成、数据分析、视频生成
- **Publisher Tools（独立项目）**：专注于多平台内容发布自动化

### 2. 独立的技术栈
- **TrendRadar**：Node.js + React + MongoDB
- **Publisher Tools**：Go + React (独立前端)

### 3. 独立的部署需求
- 发布工具需要独立部署、独立扩展
- 便于后续微服务化架构演进

## 已移除的组件

### 目录
- `tools/` - 已迁移至独立项目分支 `publisher-tools`

### 文件
- `server/services/PublishIntegration.js` - 发布集成服务
- `server/routes/publish.js` - 发布路由
- `src/pages/Publishing.jsx` - 发布管理页面

### 路由
- `/api/publish/*` - 所有发布相关 API
- `/publishing` - 发布管理前端页面

## 对功能的影响

### 保留功能
- ✅ 热点监控（微博、知乎、头条、RSS）
- ✅ AI 内容生成
- ✅ 内容改写
- ✅ 视频下载与转录
- ✅ 数据分析
- ✅ 视频生成

### 移除功能
- ❌ 多平台发布（抖音、头条、小红书）
- ❌ 账号管理
- ❌ 发布任务管理

## 后续开发方向

### 短期目标

1. **热点监控增强**
   - 增加更多数据源
   - 优化热点算法
   - 实时推送通知

2. **AI 内容生成优化**
   - 多模型支持
   - 内容质量评估
   - 风格定制

3. **数据分析深化**
   - 趋势预测
   - 用户画像
   - 效果追踪

### 中期目标

1. **视频生成增强**
   - AI 视频剪辑
   - 模板系统
   - 批量生成

2. **工作流自动化**
   - 热点 → 内容生成 → 审核
   - 定时任务
   - 规则引擎

### 长期目标

1. **微服务架构**
   - 服务拆分
   - API Gateway
   - 消息队列

2. **发布功能重集成**
   - 作为独立服务调用 Publisher Tools
   - REST API 集成
   - Webhook 支持

## 如何恢复发布功能

如果需要恢复发布功能，有以下选项：

### 选项 1：独立部署 Publisher Tools
```bash
# 切换到 publisher-tools 分支
git checkout publisher-tools

# 构建
make build

# 启动服务
./bin/publisher-server -port 8080
```

### 选项 2：API 集成
在本项目中添加 Publisher Tools 的 API 客户端，通过 HTTP 调用独立部署的发布服务。

## 项目分支

| 分支 | 说明 |
|------|------|
| `master` | TrendRadar 主分支（当前） |
| `publisher-tools` | 发布工具独立项目 |

## 相关文档

- [Publisher Tools 项目文档](./tools/PROJECT_SEPARATION.md) - 在 publisher-tools 分支中
- [项目总结](./docs/PROJECT_SUMMARY.md)
- [API 文档](./docs/api/)

## 联系方式

如有问题，请在项目 Issue 中反馈。
