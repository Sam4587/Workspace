# MCP 发布工具升级指南

本文档说明如何将原有的分散发布工具升级为统一的 Publisher Core 架构。

## 升级概述

### 原有架构问题

1. **代码重复**：每个平台有独立的实现，登录/发布逻辑相似
2. **接口不统一**：不同平台的方法签名和返回值不同
3. **缺乏异步支持**：耗时操作阻塞执行
4. **文件处理分散**：Cookie、媒体文件管理不统一

### 新架构优势

```
┌─────────────────────────────────────────────────────────────┐
│                      Publisher Core                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│   统一接口层     │   任务管理层     │   存储抽象层             │
│  (interfaces)   │    (task)       │     (storage)           │
├─────────────────┼─────────────────┼─────────────────────────┤
│ 抖音适配器      │ 今日头条适配器    │ 小红书适配器             │
│ (douyin)       │   (toutiao)     │   (xiaohongshu)         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 升级步骤

### 第一步：理解新接口

```go
// 原有方式（分散实现）
loginAction := douyin.NewLogin(page)
qrcodeURL, isLoggedIn, _ := loginAction.FetchQrcodeImage(ctx)
publishAction, _ := douyin.NewPublishAction(page)
publishAction.PublishImages(ctx, content)

// 新方式（统一接口）
pub, _ := factory.Create("douyin")
result, _ := pub.Login(ctx)          // 统一登录
result, _ := pub.Publish(ctx, content) // 统一发布
```

### 第二步：迁移登录逻辑

```go
// 原有登录逻辑
func handleDouyin(ctx context.Context, page *rod.Page, ...) {
    loginAction := douyin.NewLogin(page)
    qrcodeURL, isLoggedIn, err := loginAction.FetchQrcodeImage(ctx)
    // ...
}

// 新登录逻辑
func handleDouyin(ctx context.Context) {
    pub, _ := factory.Create("douyin")
    result, _ := pub.Login(ctx)
    if result.QrcodeURL != "" {
        // 显示二维码
    }
    pub.WaitForLogin(ctx)
}
```

### 第三步：迁移发布逻辑

```go
// 原有发布逻辑
func publishImages(ctx context.Context, publishAction interface{}, ...) {
    switch action := publishAction.(type) {
    case *douyin.PublishAction:
        action.PublishImages(ctx, douyinContent)
    case *toutiao.PublishAction:
        action.PublishImages(ctx, toutiaoContent)
    }
}

// 新发布逻辑
func publishImages(ctx context.Context, platform string, content *publisher.Content) {
    pub, _ := factory.Create(platform)
    result, _ := pub.Publish(ctx, content)
}
```

### 第四步：添加异步支持

```go
// 异步发布
taskID, _ := pub.PublishAsync(ctx, content)

// 轮询状态
for {
    result, _ := pub.QueryStatus(ctx, taskID)
    if result.Status == publisher.StatusSuccess {
        break
    }
    time.Sleep(2 * time.Second)
}
```

## API 对照表

| 功能 | 原有接口 | 新接口 |
|------|----------|--------|
| 平台名称 | 硬编码 | `pub.Platform()` |
| 登录 | `loginAction.FetchQrcodeImage()` | `pub.Login(ctx)` |
| 检查登录 | `loginAction.CheckLoginStatus()` | `pub.CheckLoginStatus(ctx)` |
| 发布图文 | `publishAction.PublishImages()` | `pub.Publish(ctx, content)` |
| 发布视频 | `publishAction.PublishVideo()` | `pub.Publish(ctx, content)` |
| Cookie管理 | `cookies.SaveCookies()` | 内置于适配器 |

## 部署方式

### 方式一：独立服务

```bash
# 启动 API 服务
./publisher-server -port 8080

# 客户端调用
curl -X POST http://localhost:8080/api/v1/publish/async \
  -H "Content-Type: application/json" \
  -d '{"platform":"douyin","type":"images",...}'
```

### 方式二：命令行工具

```bash
# 登录
./publisher -platform douyin -login

# 发布
./publisher -platform douyin -title "标题" -images "img.jpg" -async
```

### 方式三：集成到应用

```go
import "github.com/monkeycode/publisher-core/adapters"

func main() {
    factory := adapters.DefaultFactory()
    pub, _ := factory.Create("douyin")
    // 使用发布器...
}
```

## 注意事项

1. **向后兼容**：原有 CLI 工具仍可继续使用，新架构提供额外功能
2. **渐进迁移**：可以逐个平台迁移，不必一次性全部升级
3. **测试验证**：升级后务必测试登录和发布功能
4. **Cookie 迁移**：Cookie 文件格式不变，可直接复用
