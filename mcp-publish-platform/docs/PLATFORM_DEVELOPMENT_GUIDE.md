# 平台开发指南

## 📋 概述

本文档提供详细的平台开发指南，帮助开发者快速实现新的内容发布平台。

---

## 🏗️ 架构说明

### 核心接口

所有平台必须实现 `platform.Platform` 接口：

```go
type Platform interface {
    // 平台信息
    ID() PlatformID
    Name() string
    BaseURL() string
    
    // 登录认证
    Login(ctx context.Context, page *rod.Page) error
    CheckLogin(ctx context.Context, page *rod.Page) (bool, error)
    Logout(ctx context.Context, page *rod.Page) error
    
    // 内容发布
    PublishImageText(ctx context.Context, page *rod.Page, req *ImageTextRequest) (*PublishResponse, error)
    PublishVideo(ctx context.Context, page *rod.Page, req *VideoRequest) (*PublishResponse, error)
    
    // 内容管理
    GetFeeds(ctx context.Context, page *rod.Page, req *GetFeedsRequest) (*GetFeedsResponse, error)
    GetFeedDetail(ctx context.Context, page *rod.Page, feedID string) (*FeedDetail, error)
    
    // 互动功能
    Like(ctx context.Context, page *rod.Page, feedID string) error
    Comment(ctx context.Context, page *rod.Page, feedID string, content string) error
    Collect(ctx context.Context, page *rod.Page, feedID string) error
    
    // 配置
    GetPlatformConfig() *PlatformConfig
}
```

---

## 🚀 快速开始

### 步骤 1：创建平台目录

```bash
mkdir -p internal/新平台名称
```

### 步骤 2：实现 Platform 接口

创建文件 `internal/新平台名称/新平台名称.go`：

```go
package 新平台名称

import (
    "context"
    "github.com/go-rod/rod"
    "github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

type NewPlatform struct {
    config *platform.PlatformConfig
}

func New() *NewPlatform {
    return &NewPlatform{
        config: &platform.PlatformConfig{
            ID:      platform.PlatformID("新平台id"),
            Name:    "新平台名称",
            BaseURL: "https://平台地址",
            // ... 其他配置
        },
    }
}

// 实现所有接口方法...
```

### 步骤 3：注册平台

在 `main.go` 中注册新平台：

```go
import (
    "github.com/xpzouying/xiaohongshu-mcp/internal/新平台名称"
    "github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

func main() {
    // 注册平台
    platform.RegisterPlatform(新平台名称.New())
    
    // 启动服务...
}
```

---

## 📝 实现指南

### 1. 登录功能

#### 二维码登录

```go
func (p *Platform) Login(ctx context.Context, page *rod.Page) error {
    // 1. 打开登录页面
    err := page.Navigate(p.config.LoginURL).WaitLoad()
    if err != nil {
        return err
    }
    
    // 2. 等待二维码出现
    qrCode := page.MustElement("二维码选择器")
    
    // 3. 提取二维码图片
    qrImage := qrCode.MustAttribute("src")
    
    // 4. 等待用户扫码
    time.Sleep(30 * time.Second)
    
    // 5. 检查登录状态
    // ...
    
    return nil
}
```

### 2. 图文发布

```go
func (p *Platform) PublishImageText(ctx context.Context, page *rod.Page, req *platform.ImageTextRequest) (*platform.PublishResponse, error) {
    // 1. 打开发布页面
    page.Navigate(p.config.PublishURL).WaitLoad()
    
    // 2. 上传图片
    for _, imgPath := range req.Images {
        uploadBtn := page.MustElement("上传按钮选择器")
        uploadBtn.MustSetFiles(imgPath)
        time.Sleep(1 * time.Second)
    }
    
    // 3. 填写标题
    titleInput := page.MustElement("标题输入框选择器")
    titleInput.MustInput(req.Title)
    
    // 4. 填写内容
    contentInput := page.MustElement("内容输入框选择器")
    contentInput.MustInput(req.Content)
    
    // 5. 添加标签
    for _, tag := range req.Tags {
        tagInput := page.MustElement("标签输入框选择器")
        tagInput.MustInput(tag)
        // 点击添加按钮
    }
    
    // 6. 提交发布
    publishBtn := page.MustElement("发布按钮选择器")
    publishBtn.MustClick()
    
    // 7. 等待发布完成
    time.Sleep(3 * time.Second)
    
    // 8. 提取发布结果
    feedID := "提取的Feed ID"
    feedURL := "提取的Feed URL"
    
    return &platform.PublishResponse{
        Success: true,
        FeedID:  feedID,
        FeedURL: feedURL,
    }, nil
}
```

### 3. 视频发布

```go
func (p *Platform) PublishVideo(ctx context.Context, page *rod.Page, req *platform.VideoRequest) (*platform.PublishResponse, error) {
    // 1. 打开视频发布页面
    page.Navigate(p.config.PublishURL + "/video").WaitLoad()
    
    // 2. 上传视频
    uploadInput := page.MustElement("视频上传输入框")
    uploadInput.MustSetFiles(req.VideoPath)
    
    // 3. 等待上传完成（可能需要很长时间）
    for i := 0; i < 60; i++ {
        time.Sleep(5 * time.Second)
        // 检查上传进度
        progress := page.MustElement("进度条选择器").MustText()
        if progress == "100%" {
            break
        }
    }
    
    // 4. 填写标题和描述
    page.MustElement("标题输入框").MustInput(req.Title)
    page.MustElement("描述输入框").MustInput(req.Description)
    
    // 5. 提交发布
    page.MustElement("发布按钮").MustClick()
    
    return &platform.PublishResponse{
        Success: true,
        FeedID:  "视频ID",
        FeedURL: "视频URL",
    }, nil
}
```

---

## 🔧 调试技巧

### 1. 使用无头模式调试

```bash
# 启动服务（不使用无头模式）
./bin/mcp-server -headless=false
```

### 2. 截图调试

```go
// 在关键步骤截图
page.MustScreenshot("debug-screenshot.png")
```

### 3. 打印页面内容

```go
// 打印页面 HTML
html := page.MustHTML()
fmt.Println(html)
```

### 4. 等待元素出现

```go
// 等待元素出现（带超时）
err := page.Timeout(10 * time.Second).MustElement("选择器")
if err != nil {
    return fmt.Errorf("元素未出现: %w", err)
}
```

---

## ⚠️ 注意事项

### 1. 元素选择器

- 使用稳定的 CSS 选择器
- 避免使用动态生成的 ID 或 class
- 优先使用 data 属性

### 2. 等待时间

- 使用合理的等待时间
- 避免固定 sleep，优先使用条件等待
- 考虑网络延迟和服务器响应

### 3. 错误处理

- 捕获所有可能的错误
- 提供清晰的错误信息
- 记录详细的日志

### 4. 反爬虫

- 随机化操作间隔
- 模拟真实用户行为
- 使用随机 User-Agent

---

## 📚 参考资料

### Rod 文档

- [Rod 官方文档](https://github.com/go-rod/rod)
- [Rod 示例](https://github.com/go-rod/rod/tree/main/lib/examples)

### Chrome DevTools Protocol

- [CDP 文档](https://chromedevtools.github.io/devtools-protocol/)

---

## 🎯 最佳实践

### 1. 代码组织

```
internal/平台名称/
├── 平台名称.go      # 主文件，实现接口
├── login.go         # 登录相关
├── publish.go       # 发布相关
├── feeds.go         # 内容管理
└── utils.go         # 工具函数
```

### 2. 配置管理

使用配置文件管理平台配置：

```yaml
platforms:
  - id: douyin
    name: 抖音
    base_url: https://creator.douyin.com
    max_images: 35
    max_video_size: 2048
```

### 3. 日志记录

```go
import "github.com/sirupsen/logrus"

func (p *Platform) Login(ctx context.Context, page *rod.Page) error {
    logrus.Info("开始登录")
    
    // 登录逻辑...
    
    logrus.Info("登录成功")
    return nil
}
```

---

**文档维护**: 开发团队  
**最后更新**: 2026-02-17
