# 小红书 MCP 发布工具

基于 [xpzouying/xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 开源项目封装的命令行发布工具。

## 功能特性

| 功能 | 状态 | 说明 |
|------|------|------|
| 二维码登录 | 可用 | 扫码登录小红书创作者账号 |
| Cookie 管理 | 可用 | 自动保存和加载登录状态 |
| 图文发布 | 可用 | 支持多图发布 |
| 视频发布 | 可用 | 支持本地视频文件 |
| 登录状态检查 | 可用 | 快速验证登录状态 |
| 话题标签 | 可用 | 支持添加话题标签 |

## 快速开始

### 1. 编译

```bash
cd tools/xiaohongshu-publisher
go build -o xhs-publisher .
```

### 2. 登录

```bash
# 无头模式登录（默认）
./xhs-publisher -login

# 有头模式登录（可视化调试）
./xhs-publisher -headless=false -login
```

执行后会显示二维码，使用小红书 App 扫码登录。

### 3. 检查登录状态

```bash
./xhs-publisher -check
```

### 4. 发布内容

**发布图文：**
```bash
./xhs-publisher \
  -title "今日美食分享" \
  -content "今天做了一道超级美味的红烧肉..." \
  -images "photo1.jpg,photo2.jpg,photo3.jpg" \
  -tags "美食,家常菜,红烧肉"
```

**发布视频：**
```bash
./xhs-publisher \
  -title "旅行Vlog" \
  -content "记录一下这次旅行的美好时光..." \
  -video "travel.mp4" \
  -tags "旅行,vlog,日常生活"
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `-headless` | bool | true | 是否使用无头模式 |
| `-login` | bool | false | 执行登录操作 |
| `-check` | bool | false | 检查登录状态 |
| `-title` | string | - | 内容标题（最多20字） |
| `-content` | string | - | 正文内容（最多1000字） |
| `-images` | string | - | 图片路径，逗号分隔 |
| `-video` | string | - | 视频路径（仅本地） |
| `-tags` | string | - | 话题标签，逗号分隔 |

## Cookie 管理

### 存储位置
- Cookie 文件：`./cookies/xiaohongshu_cookies.json`

### 关键字段
- `web_session` - 会话标识
- `webId` - 用户标识

### 过期处理
- Cookie 有效期通常为 7-30 天
- 过期后需要重新登录
- 可通过 `-check` 参数验证状态

## 内容限制

| 类型 | 限制 |
|------|------|
| 标题 | 最多 20 字 |
| 正文 | 最多 1000 字 |
| 图片 | 最多 18 张，支持 JPG/PNG |
| 视频 | 建议不超过 500MB |
| 标签 | 建议不超过 5 个 |

## 反爬虫策略

工具内置了以下反爬虫措施：
1. **随机延迟**：每次操作后等待 0.3-2 秒
2. **DOM 稳定**：等待页面加载完成
3. **模式切换**：支持有头/无头模式
4. **模拟操作**：模拟人工输入行为

## 使用建议

1. **发布间隔**：建议每次发布间隔 5 分钟以上
2. **内容原创**：发布原创内容，避免侵权
3. **账号安全**：不要在多个设备同时登录
4. **调试模式**：首次使用建议用 `-headless=false` 观察操作过程

## 常见问题

### Q: 登录后提示"未登录"？
A: Cookie 可能已过期，请重新执行 `-login` 登录。

### Q: 图片上传失败？
A: 检查图片格式和大小，建议使用 JPG 格式，单张不超过 5MB。

### Q: 发布一直失败？
A: 使用 `-headless=false` 模式观察具体错误，可能是 DOM 选择器失效。

## 技术实现

本工具是对 `github.com/xpzouying/xiaohongshu-mcp` 的封装：

```go
import (
    "github.com/xpzouying/xiaohongshu-mcp/browser"
    "github.com/xpzouying/xiaohongshu-mcp/xiaohongshu"
)

// 使用浏览器模块
browserInstance := browser.NewBrowser(headless)
page := browserInstance.MustPage()

// 使用登录模块
loginAction := xiaohongshu.NewLogin(page)
loginAction.CheckLoginStatus(ctx)

// 使用发布模块
publishAction, _ := xiaohongshu.NewPublishImageAction(page)
publishAction.Publish(ctx, content)
```

## 更新日志

### v1.0.0 (2026-02-15)
- 初始版本
- 支持登录、图文发布、视频发布
- Cookie 持久化存储
- 命令行参数支持
