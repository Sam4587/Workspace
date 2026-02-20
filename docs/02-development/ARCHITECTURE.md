# 技术架构文档

## 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (React + Vite)                       │
├─────────────────────────────────────────────────────────────────┤
│  Pages: Index | HotTopics | ContentGeneration | Analytics | Video │
│  Components: UI组件库 (shadcn/ui) + 业务组件                       │
│  State: TanStack Query + React Context                           │
│  API Client: Axios (src/lib/api.js)                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端 (Node.js + Express)                     │
├─────────────────────────────────────────────────────────────────┤
│  Routes: hotTopics | content | video | transcription | analytics  │
│  Services: AI服务 | 视频处理 | 转录 | 数据分析                      │
│  Storage: 内存存储 + JSON文件持久化 (轻量级方案)                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   AI 服务     │     │   视频服务    │     │   数据服务    │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ OpenAI        │     │ 视频下载      │     │ 热点抓取      │
│ Groq          │     │ 视频转录      │     │ RSS 订阅      │
│ Cerebras      │     │ Whisper       │     │ JSON文件存储  │
│ 阿里云 ASR    │     │ 阿里云 ASR    │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## 数据存储方案

> **重要说明**：本项目已明确放弃 MongoDB，采用轻量级存储方案。

### 存储策略

| 存储类型 | 方案 | 说明 |
|----------|------|------|
| **热点数据** | 内存缓存 + 定时刷新 | 数据实时性强，无需持久化 |
| **用户数据** | JSON 文件存储 | 轻量级，适合小规模用户 |
| **生成内容** | JSON 文件存储 | 便于备份和迁移 |
| **视频文件** | 本地文件系统 | 按日期分目录存储 |
| **配置数据** | .env + JSON 配置文件 | 环境变量优先 |

### 为什么不使用 MongoDB

1. **资源限制**：当前阶段服务器资源有限，MongoDB 占用内存较高
2. **成本考虑**：优先使用免费方案，降低运营成本
3. **实际需求**：当前数据量小，JSON 文件存储完全满足需求
4. **简化部署**：减少外部依赖，降低部署复杂度

### 数据存储位置

```
server/
├── storage/
│   ├── data/           # JSON 数据文件
│   │   ├── contents.json    # 生成的内容
│   │   ├── users.json       # 用户数据
│   │   └── settings.json    # 系统设置
│   ├── videos/         # 视频文件
│   │   └── YYYY-MM-DD/      # 按日期分目录
│   └── transcripts/    # 转录结果
│       └── YYYY-MM-DD/      # 按日期分目录
```

### 后续扩展方案

当数据量增长到需要数据库时，可考虑：
- **SQLite**：单文件数据库，零配置，适合中小规模
- **LowDB**：基于 JSON 的轻量级数据库
- **PlanetScale / Supabase**：免费额度较大的云数据库服务

---

## 前端架构

### 目录结构
```
src/
├── components/           # 组件
│   ├── ui/              # shadcn/ui 基础组件 (48个)
│   ├── video/           # 视频相关组件
│   └── *.jsx            # 业务组件
├── pages/               # 页面组件
├── lib/                 # 工具库
│   ├── api.js          # API 客户端
│   ├── mockData.js     # Mock 数据
│   └── utils.js        # 工具函数
├── contexts/            # React Context
├── providers/           # Provider
├── data/                # 静态数据
├── App.jsx              # 根组件
├── main.jsx             # 入口文件
└── nav-items.jsx        # 导航配置
```

### 状态管理

使用 TanStack Query 管理服务端状态：

```javascript
// 查询示例
const { data, isLoading, error } = useQuery({
  queryKey: ['hot-topics'],
  queryFn: () => api.getHotTopics(),
  staleTime: 2 * 60 * 1000, // 2分钟缓存
});
```

### 路由配置

在 `src/nav-items.jsx` 中配置：

```javascript
export const navItems = [
  {
    title: "总览",
    to: "/",
    icon: <HomeIcon />,
    page: <Index />,
  },
  // ...
];
```

### UI 组件

使用 shadcn/ui 组件库，位于 `src/components/ui/`：

| 组件 | 用途 |
|------|------|
| button.jsx | 按钮 |
| card.jsx | 卡片 |
| dialog.jsx | 对话框 |
| form.jsx | 表单 |
| table.jsx | 表格 |
| tabs.jsx | 标签页 |
| toast.jsx | 提示 |

---

## 后端架构

### 目录结构
```
server/
├── routes/              # API 路由
│   ├── hotTopics.js    # 热点数据
│   ├── hotTopicsMemory.js # 内存模式
│   ├── content.js      # 内容管理
│   ├── contentRewrite.js # 内容改写
│   ├── video.js        # 视频处理
│   ├── videoDownload.js # 视频下载
│   ├── transcription.js # 转录服务
│   ├── analytics.js    # 数据分析
│   ├── auth.js         # 认证
│   └── llm.js          # LLM 集成
├── services/            # 业务服务
│   ├── aiService.js    # AI 服务
│   ├── aiProviderService.js # AI 提供商
│   ├── hotTopicService.js # 热点业务
│   ├── ContentRewriteService.js # 改写服务
│   ├── multiAIService.js # 多模型集成
│   ├── multiPlatformService.js # 多平台
│   ├── notificationService.js # 通知
│   ├── llm/            # LLM 子模块
│   └── prompts/        # Prompt 模板
├── video/              # 视频模块
│   └── downloaders/    # 下载器
├── transcription/      # 转录模块
├── fetchers/           # 数据抓取
├── models/             # 数据模型
├── utils/              # 工具函数
├── simple-server.js    # 开发服务器
└── index.js            # 生产服务器
```

### 开发 vs 生产

| 特性 | 开发模式 | 生产模式 |
|------|----------|----------|
| 入口 | simple-server.js | simple-server.js |
| 数据存储 | 内存存储 + JSON文件 | 内存存储 + JSON文件 |
| 热重载 | 支持 | 不支持 |
| Mock 数据 | 是 | 否 |

> **注意**：本项目统一使用轻量级存储方案，不再区分开发/生产环境的数据库配置。

### API 路由结构

```javascript
// 注册路由
app.use('/api/hot-topics', require('./routes/hotTopicsMemory'));
app.use('/api/content', require('./routes/contentRewrite'));
app.use('/api/video', require('./routes/video'));
app.use('/api/transcription', require('./routes/transcription'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/llm', require('./routes/llm'));
```

---

## 数据流

### 热点监控流程
```
用户请求 → 前端 → API /hot-topics
                    ↓
              hotTopicService
                    ↓
              fetchers (微博/知乎/头条)
                    ↓
              数据处理 & 缓存
                    ↓
              返回前端展示
```

### 内容生成流程
```
用户输入话题 → API /content/generate
                    ↓
              aiService → AI 模型
                    ↓
              内容处理 & 平台适配
                    ↓
              返回生成结果
```

### 视频处理流程
```
视频URL → API /video/download
                ↓
          下载器 (平台识别)
                ↓
          存储视频文件
                ↓
          API /transcription/submit
                ↓
          转录引擎 (Whisper/ASR)
                ↓
          返回文本结果
                ↓
          API /content/video-rewrite
                ↓
          多平台改写
```

---

## AI 服务集成

### 支持的模型

| 提供商 | 模型 | 用途 |
|--------|------|------|
| OpenAI | GPT-4, GPT-3.5 | 内容生成 |
| Groq | Llama, Mixtral | 快速生成 |
| Cerebras | Llama | 高速推理 |
| 阿里云 | ASR | 语音转录 |
| 百度 | 千帆 | 中文生成 |

### 配置方式

```env
# .env
OPENAI_API_KEY=sk-xxx
GROQ_API_KEY=gsk_xxx
ALIYUN_ASR_ACCESS_KEY=xxx
```

---

## 扩展指南

### 添加新页面

1. 创建组件 `src/pages/NewPage.jsx`
2. 在 `src/nav-items.jsx` 添加导航项
3. 在 `src/App.jsx` 添加路由（如需要）

### 添加新 API

1. 创建路由 `server/routes/newRoute.js`
2. 创建服务 `server/services/newService.js`
3. 在 `server/simple-server.js` 注册路由

### 添加新 UI 组件

使用 shadcn/ui CLI：
```bash
npx shadcn@latest add component-name
```

### 添加新 AI 模型

1. 在 `server/services/aiProviderService.js` 添加配置
2. 在 `server/services/llm/providers/` 创建适配器

---

## 性能优化

### 前端
- 使用 TanStack Query 缓存
- Vite 代码分割
- 图片懒加载

### 后端
- 内存缓存热点数据
- 异步任务处理
- JSON 文件读写优化（按需加载、增量写入）

---

## 安全考虑

- CORS 配置
- Rate Limiting
- 输入验证
- XSS 防护
- 认证 Token 过期
