# 抖音/今日头条 MCP 发布工具

复刻小红书 MCP 架构实现的多平台发布工具，支持抖音和今日头条。

## 功能特性

| 功能 | 抖音 | 今日头条 |
|------|------|---------|
| 二维码登录 | 可用 | 可用 |
| Cookie 管理 | 可用 | 可用 |
| 图文发布 | 可用 | 可用 |
| 视频发布 | 可用 | 可用 |
| 登录状态检查 | 可用 | 可用 |
| 话题标签 | 可用 | 可用 |

## 快速开始

### 1. 编译

```bash
cd tools/douyin-toutiao
go build -o publisher .
```

### 2. 登录

**抖音登录：**
```bash
./publisher -platform douyin -login
```

**今日头条登录：**
```bash
./publisher -platform toutiao -login
```

### 3. 检查登录状态

```bash
# 检查抖音
./publisher -platform douyin -check

# 检查今日头条
./publisher -platform toutiao -check
```

### 4. 发布内容

**抖音图文：**
```bash
./publisher -platform douyin \
  -title "美食分享" \
  -content "今天分享一道超级好吃的..." \
  -images "photo1.jpg,photo2.jpg" \
  -tags "美食,生活"
```

**抖音视频：**
```bash
./publisher -platform douyin \
  -title "旅行记录" \
  -content "这次旅行的精彩瞬间..." \
  -video "travel.mp4" \
  -tags "旅行,vlog"
```

**今日头条图文：**
```bash
./publisher -platform toutiao \
  -title "科技资讯" \
  -content "最新科技动态..." \
  -images "tech1.jpg,tech2.jpg" \
  -tags "科技,数码"
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `-platform` | string | douyin | 平台选择：douyin 或 toutiao |
| `-headless` | bool | true | 是否使用无头模式 |
| `-login` | bool | false | 执行登录操作 |
| `-check` | bool | false | 检查登录状态 |
| `-title` | string | - | 内容标题 |
| `-content` | string | - | 正文内容 |
| `-images` | string | - | 图片路径，逗号分隔 |
| `-video` | string | - | 视频路径 |
| `-tags` | string | - | 话题标签，逗号分隔 |

## 平台限制

### 抖音

| 项目 | 限制 |
|------|------|
| 标题 | 最多 30 字 |
| 正文 | 最多 2000 字 |
| 图片 | 建议不超过 12 张 |
| 视频 | ≤2GB, MP4 格式 |
| 登录页 | creator.douyin.com |

### 今日头条

| 项目 | 限制 |
|------|------|
| 标题 | 最多 30 字 |
| 正文 | 最多 2000 字 |
| 图片 | 建议不超过 20 张 |
| 视频 | MP4 格式 |
| 登录页 | mp.toutiao.com |

## Cookie 管理

### 存储位置
- 抖音：`./cookies/douyin_cookies.json`
- 今日头条：`./cookies/toutiao_cookies.json`

### 关键字段

**抖音：**
- `tt_webid` - 用户标识
- `passport_auth` - 认证信息
- `csrf_token` - 安全令牌
- `ttcid` - 客户端标识

**今日头条：**
- `sessionid` - 会话标识
- `passport_auth` - 认证信息
- `tt_token` - 访问令牌
- `tt_webid` - 用户标识

## 反爬虫策略

工具内置了以下反爬虫措施：

1. **随机延迟**
   - 操作间隔：0.3-2 秒随机延迟
   - 避免被识别为机器人

2. **DOM 稳定等待**
   - 等待页面加载完成
   - 确保元素可操作

3. **无头/有头模式**
   - 调试时使用有头模式
   - 生产环境使用无头模式

4. **操作模拟**
   - 模拟人工输入
   - 随机化操作时间

## 代码架构

```
douyin-toutiao/
├── main.go              # CLI 入口
├── go.mod               # Go 模块定义
├── browser/             # 浏览器管理
│   └── browser.go       # Rod 浏览器封装
├── cookies/             # Cookie 存储
│   └── cookies.go       # 持久化存储
├── configs/             # 配置管理
│   └── config.go        # 全局配置
├── errors/              # 错误定义
│   └── errors.go        # 错误类型
├── douyin/              # 抖音平台
│   ├── login.go         # 登录实现
│   └── publish.go       # 发布实现
├── toutiao/             # 今日头条平台
│   ├── login.go         # 登录实现
│   └── publish.go       # 发布实现
└── internal/            # 内部模块
    └── common/          # 公共工具
        └── browser.go   # 辅助函数
```

## 与小红书 MCP 的复用关系

本工具复用了小红书 MCP 的核心架构：

| 模块 | 复用度 | 说明 |
|------|--------|------|
| 浏览器管理 | 100% | 完全复用 Rod 框架 |
| Cookie 管理 | 100% | 相同的存储逻辑 |
| 登录流程 | 90% | 平台 URL 不同 |
| 发布流程 | 90% | DOM 选择器不同 |
| 反爬策略 | 100% | 完全复用 |

**整体复用率：约 92%**

## 使用建议

1. **发布间隔**：建议每次发布间隔 5 分钟以上
2. **账号安全**：不要在多个网页端同时登录
3. **内容合规**：遵守平台社区规范
4. **风控意识**：抖音/头条风控较严格，注意操作频率

## 风险提示

| 风险类型 | 说明 | 应对措施 |
|---------|------|---------|
| Cookie 过期 | 需要定期重新登录 | 检查状态后自动提醒 |
| DOM 变化 | 网页改版导致失效 | 选择器抽象配置 |
| 风控限制 | 高频操作触发限流 | 控制发布频率 |
| 账号风险 | 违规可能导致封号 | 遵守社区规范 |

## 常见问题

### Q: 抖音发布失败？
A: 抖音风控较严格，建议：
1. 降低发布频率
2. 使用有头模式观察
3. 确保内容符合规范

### Q: 今日头条登录二维码找不到？
A: 确保使用 `-headless=false` 模式查看页面。

### Q: Cookie 提取失败？
A: 检查登录是否成功，可能需要重新登录。

## 更新日志

### v1.0.0 (2026-02-15)
- 初始版本
- 支持抖音/今日头条双平台
- 复用小红书 MCP 架构
- 图文和视频发布功能
