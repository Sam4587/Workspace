# 抖音和今日头条 MCP 发布工具技术设计文档

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP 客户端层                        │
│  (Cherry Studio / AnythingLLM / Custom Client)           │
└────────────────────┬────────────────────────────────────┘
                     │ MCP 协议 (JSON-RPC)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    MCP 协议层                          │
│  (mcp_server.go - 实现标准 JSON-RPC 协议）           │
├─────────────────────────────────────────────────────────────┤
│  - 握手与发现                                       │
│  - 工具调用路由                                       │
│  - 流式响应支持                                       │
│  - 错误处理与重试                                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   HTTP API 层                            │
│  (http_server.go - RESTful API 封装)                    │
├─────────────────────────────────────────────────────────────┤
│  - 平台路由                                         │
│  - 请求验证                                         │
│  - 响应格式化                                       │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  业务服务层                               │
│  (services/ - 平台抽象与实现)                           │
├─────────────────────────────────────────────────────────────┤
│  平台接口 (Platform)                                  │
│  ├── 抖音服务 (DouyinService)                          │
│  └── 今日头条服务 (ToutiaoService)                      │
│  共享模块 (Shared)                                    │
│  ├── 登录管理器 (AuthManager)                         │
│  ├── 浏览器控制器 (BrowserController)                  │
│  ├── 凭证存储 (CredentialStorage)                       │
│  └── 反爬虫控制器 (AntiBotController)                 │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                浏览器自动化层                              │
│  (Rod - 无头浏览器自动化)                              │
├─────────────────────────────────────────────────────────────┤
│  - 页面加载与等待                                     │
│  - DOM 元素定位                                       │
│  - 模拟用户操作 (点击、输入、上传）                       │
│  - Cookie/Token 管理                                   │
│  - 页面截图 (调试用)                                  │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  数据持久化层                              │
│  (存储平台凭证和会话信息)                               │
├─────────────────────────────────────────────────────────────┤
│  - JSON 文件存储                                      │
│  - 加密存储 (可选)                                    │
│  - 配置文件管理                                       │
└─────────────────────────────────────────────────────────────┘
```

### 模块划分

#### 1. 核心模块

##### 1.1 MCP 协议层

**文件**: `mcp_server.go`

**职责**:
- 实现标准 MCP JSON-RPC 协议
- 处理客户端连接和工具调用
- 管理平台切换和多实例

**核心接口**:

```go
// MCP 服务器
type MCPServer struct {
    servers map[string]*PlatformServer  // 平台服务器实例
    currentPlatform string              // 当前激活平台
    httpHandler *HTTPHandler            // HTTP 处理器
}

// 平台服务器接口
type PlatformServer interface {
    Name() string
    Login(ctx context.Context) error
    Publish(ctx context.Context, req *PublishRequest) (*PublishResponse, error)
    GetContents(ctx context.Context, req *GetContentsRequest) (*GetContentsResponse, error)
    GetContentDetail(ctx context.Context, req *GetContentDetailRequest) (*GetContentDetailResponse, error)
    Like(ctx context.Context, req *LikeRequest) error
    Comment(ctx context.Context, req *CommentRequest) (*CommentResponse, error)
    Close() error
}
```

##### 1.2 HTTP API 层

**文件**: `http_server.go`

**职责**:
- 提供 RESTful API 接口
- 处理请求验证和路由
- 格式化 API 响应

**API 路由设计**:

```
POST   /api/{platform}/login                 # 登录
POST   /api/{platform}/publish              # 发布内容
GET    /api/{platform}/contents             # 内容列表
GET    /api/{platform}/contents/{id}        # 内容详情
POST   /api/{platform}/contents/{id}/like   # 点赞
POST   /api/{platform}/contents/{id}/comment # 评论
POST   /api/{platform}/contents/{id}/collect # 收藏
GET    /api/{platform}/status              # 登录状态
GET    /api/platforms                      # 平台列表
```

##### 1.3 业务服务层

**文件目录**: `services/`

**核心文件**:
- `platform.go` - 平台抽象接口定义
- `douyin.go` - 抖音平台实现
- `toutiao.go` - 今日头条平台实现
- `auth_manager.go` - 登录和凭证管理
- `browser_controller.go` - 浏览器自动化控制器
- `credential_storage.go` - 凭证持久化存储
- `anti_bot.go` - 反爬虫和风控应对

**平台抽象接口**:

```go
// 平台接口定义
type Platform interface {
    // 平台标识
    ID() PlatformID

    // 平台名称
    Name() string

    // 登录页 URL
    LoginURL() string

    // 内容发布页 URL
    PublishURL() string

    // 个人主页 URL
    ProfileURL() string

    // 登录
    Login(ctx context.Context, authManager *AuthManager) error

    // 发布图文
    PublishImageText(ctx context.Context, req *PublishImageTextRequest) error

    // 发布视频
    PublishVideo(ctx context.Context, req *PublishVideoRequest) error

    // 获取内容列表
    GetContents(ctx context.Context) ([]*Content, error)

    // 获取内容详情
    GetContentDetail(ctx context.Context, id string) (*Content, error)
}

// 平台枚举
type PlatformID string

const (
    PlatformDouyin  PlatformID = "douyin"
    PlatformToutiao PlatformID = "toutiao"
)
```

#### 2. 共享模块

##### 2.1 登录管理器

**文件**: `services/auth_manager.go`

**职责**:
- 管理登录流程
- 提取和存储凭证
- 验证凭证有效性

**核心功能**:

```go
type AuthManager struct {
    platform   Platform
    browser    *rod.Browser
    storage    *CredentialStorage
    logger     *zap.Logger
}

// 二维码登录
func (am *AuthManager) QRCodeLogin(ctx context.Context) (*QRCodeResult, error) {
    // 1. 打开登录页
    page := am.browser.MustPage(am.platform.LoginURL())

    // 2. 等待二维码加载
    qrCode, err := page.Timeout(30*time.Second).Element(`[data-testid="qrcode"]`)
    if err != nil {
        return nil, fmt.Errorf("二维码加载失败: %w", err)
    }

    // 3. 获取二维码数据
    qrData, err := qrCode.Property("src")
    if err != nil {
        return nil, fmt.Errorf("获取二维码失败: %w", err)
    }

    // 4. 启动登录状态检查
    go am.pollLoginStatus(ctx, page)

    return &QRCodeResult{
        QRCodeURL: qrData.String(),
        ExpiresIn: 300, // 5分钟过期
    }, nil
}

// 轮询登录状态
func (am *AuthManager) pollLoginStatus(ctx context.Context, page *rod.Page) {
    ticker := time.NewTicker(2 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            // 检查登录状态
            status, err := am.checkLoginStatus(page)
            if err != nil {
                continue
            }

            if status == "success" {
                // 提取凭证
                creds, err := am.extractCredentials(page)
                if err != nil {
                    am.logger.Error("提取凭证失败", zap.Error(err))
                    continue
                }

                // 存储凭证
                err = am.storage.Save(am.platform.ID(), creds)
                if err != nil {
                    am.logger.Error("存储凭证失败", zap.Error(err))
                    continue
                }

                am.logger.Info("登录成功", zap.String("platform", am.platform.Name()))
                return
            }

        case <-ctx.Done():
            am.logger.Info("登录超时")
            return
        }
    }
}

// 提取凭证
func (am *AuthManager) extractCredentials(page *rod.Page) (*Credentials, error) {
    // 从 Cookie 中提取关键凭证
    cookies, err := page.Cookies()
    if err != nil {
        return nil, err
    }

    creds := &Credentials{}

    for _, cookie := range cookies {
        switch am.platform.ID() {
        case PlatformDouyin:
            if cookie.Name == "tt_webid" {
                creds.TTWebID = cookie.Value
            }
            if cookie.Name == "passport_auth" {
                creds.PassportAuth = cookie.Value
            }
            if cookie.Name == "csrf_token" {
                creds.CSRFToken = cookie.Value
            }

        case PlatformToutiao:
            if cookie.Name == "sessionid" {
                creds.SessionID = cookie.Value
            }
            if cookie.Name == "passport_auth" {
                creds.PassportAuth = cookie.Value
            }
        }
    }

    return creds, nil
}
```

##### 2.2 浏览器控制器

**文件**: `services/browser_controller.go`

**职责**:
- 封装 Rod 浏览器操作
- 实现反爬虫措施
- 管理浏览器实例

**核心功能**:

```go
type BrowserController struct {
    browser    *rod.Browser
    antiBot    *AntiBotController
    logger     *zap.Logger
}

// 初始化浏览器（无头模式+反爬虫）
func (bc *BrowserController) InitBrowser() error {
    // 1. 创建浏览器实例
    browser, err := rod.New().
        ControlURL(bc.controlURL).
        Headless(true).
        Trace(true).
        MustConnect()

    // 2. 配置反爬虫
    err = bc.antiBot.Configure(browser)
    if err != nil {
        return fmt.Errorf("配置反爬虫失败: %w", err)
    }

    bc.browser = browser
    return nil
}

// 模拟人工操作（延迟+随机性）
func (bc *BrowserController) SimulateHumanAction(action func() error) error {
    // 随机延迟（2-5秒）
    delay := time.Duration(2000+rand.Intn(3000)) * time.Millisecond
    time.Sleep(delay)

    // 执行操作
    return action()
}

// 上传图片
func (bc *BrowserController) UploadImage(page *rod.Page, filePath string, selector string) error {
    // 1. 找到文件输入元素
    fileInput := page.MustElement(selector)

    // 2. 模拟点击（触发文件选择）
    err := bc.SimulateHumanAction(func() error {
        return fileInput.Click()
    })
    if err != nil {
        return err
    }

    // 3. 设置文件
    err = bc.SimulateHumanAction(func() error {
        return fileInput.MustSetFiles(filePath)
    })
    if err != nil {
        return err
    }

    return nil
}

// 上传视频（支持切片和进度）
func (bc *BrowserController) UploadVideo(page *rod.Page, filePath string, selector string, progressChan chan<- int) error {
    // 1. 检查文件大小
    fileInfo, err := os.Stat(filePath)
    if err != nil {
        return err
    }

    // 2. 如果文件过大（>2GB），进行切片
    if fileInfo.Size() > 2*1024*1024*1024 {
        return bc.uploadVideoInChunks(page, filePath, selector, progressChan)
    }

    // 3. 上传文件
    fileInput := page.MustElement(selector)

    // 使用 UploadFile 监控进度
    upload, err := fileInput.UploadFile(filePath)
    if err != nil {
        return err
    }

    // 监听上传进度
    totalSize := fileInfo.Size()
    go func() {
        ticker := time.NewTicker(100 * time.Millisecond)
        defer ticker.Stop()

        for {
            select {
            case <-ticker.C:
                current, err := upload.Progress()
                if err != nil {
                    close(progressChan)
                    return
                }

                progress := int((float64(current) / float64(totalSize)) * 100)
                progressChan <- progress

                if current >= totalSize {
                    close(progressChan)
                    return
                }
            }
        }
    }()

    return nil
}

// 视频切片上传
func (bc *BrowserController) uploadVideoInChunks(page *rod.Page, filePath string, selector string, progressChan chan<- int) error {
    // 实现大文件切片上传逻辑
    // ...

    return nil
}
```

##### 2.3 反爬虫控制器

**文件**: `services/anti_bot.go`

**职责**:
- 配置浏览器指纹
- 实现操作延迟和随机化
- 风控检测和应对

**核心功能**:

```go
type AntiBotController struct {
    userAgentPool []string
    screenSizes   []ScreenSize
    logger       *zap.Logger
}

type ScreenSize struct {
    Width  int
    Height int
}

// 配置反爬虫
func (abc *AntiBotController) Configure(browser *rod.Browser) error {
    // 1. 禁用无头模式指纹
    err := browser.Incognito([]string{"--disable-blink-features=AutomationControlled"}).MustConnect()
    if err != nil {
        return err
    }

    // 2. 设置随机 User-Agent
    userAgent := abc.getRandomUserAgent()
    browser = browser.MustIncognito([]string{
        fmt.Sprintf("--user-agent=%s", userAgent),
    })

    // 3. 设置随机屏幕分辨率
    screenSize := abc.getRandomScreenSize()
    browser = browser.MustIncognito([]string{
        fmt.Sprintf("--window-size=%d,%d", screenSize.Width, screenSize.Height),
    })

    // 4. 设置随机视口大小
    // ...

    return nil
}

// 随机 User-Agent 池
func (abc *AntiBotController) getRandomUserAgent() string {
    userAgents := []string{
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    return userAgents[rand.Intn(len(userAgents))]
}

// 随机屏幕尺寸
func (abc *AntiBotController) getRandomScreenSize() ScreenSize {
    screenSizes := []ScreenSize{
        {1920, 1080},
        {1366, 768},
        {1440, 900},
        {1536, 864},
    }
    return screenSizes[rand.Intn(len(screenSizes))]
}

// 操作延迟（模拟人工）
func (abc *AntiBotController) RandomDelay(minSec, maxSec int) time.Duration {
    delay := minSec + rand.Intn(maxSec-minSec)
    return time.Duration(delay) * time.Second
}

// 操作间隔限制
type OperationInterval struct {
    LastPublishTime time.Time
    MinInterval    time.Duration
}

func (oi *OperationInterval) CanPublish() bool {
    return time.Since(oi.LastPublishTime) >= oi.MinInterval
}
```

##### 2.4 凭证存储

**文件**: `services/credential_storage.go`

**职责**:
- 加密存储平台凭证
- 加载和验证凭证
- 管理多账号凭证

**核心功能**:

```go
type CredentialStorage struct {
    filePath string
    lock     sync.RWMutex
    logger   *zap.Logger
}

type StoredCredentials struct {
    Version      string                    // 版本号
    Platforms    map[PlatformID]*PlatformCreds
    LastUpdated  time.Time
}

type PlatformCreds struct {
    UserID      string
    Cookies     map[string]string  // Cookie 映射
    Tokens      map[string]string  // Token 映射
    ExpiresAt   time.Time           // 过期时间
}

// 加密保存凭证
func (cs *CredentialStorage) Save(platformID PlatformID, creds *Credentials) error {
    cs.lock.Lock()
    defer cs.lock.Unlock()

    // 1. 读取现有数据
    data, err := cs.load()
    if err != nil && !os.IsNotExist(err) {
        return fmt.Errorf("读取凭证失败: %w", err)
    }

    // 2. 更新平台凭证
    if data.Platforms == nil {
        data.Platforms = make(map[PlatformID]*PlatformCreds)
    }

    platformCreds := &PlatformCreds{
        Cookies: make(map[string]string),
        Tokens:  make(map[string]string),
    }

    // 填充凭证数据
    if platformID == PlatformDouyin {
        platformCreds.Cookies["tt_webid"] = creds.TTWebID
        platformCreds.Cookies["passport_auth"] = creds.PassportAuth
        platformCreds.Tokens["csrf_token"] = creds.CSRFToken
    } else if platformID == PlatformToutiao {
        platformCreds.Cookies["sessionid"] = creds.SessionID
        platformCreds.Cookies["passport_auth"] = creds.PassportAuth
    }

    data.Platforms[platformID] = platformCreds
    data.LastUpdated = time.Now()

    // 3. 加密并保存
    encrypted, err := cs.encrypt(data)
    if err != nil {
        return fmt.Errorf("加密失败: %w", err)
    }

    err = os.WriteFile(cs.filePath, encrypted, 0644)
    if err != nil {
        return fmt.Errorf("保存凭证失败: %w", err)
    }

    cs.logger.Info("凭证保存成功", zap.String("platform", platformID))
    return nil
}

// 加载凭证
func (cs *CredentialStorage) Load(platformID PlatformID) (*PlatformCreds, error) {
    cs.lock.RLock()
    defer cs.lock.RUnlock()

    // 1. 读取加密文件
    encrypted, err := os.ReadFile(cs.filePath)
    if err != nil {
        return nil, fmt.Errorf("读取凭证失败: %w", err)
    }

    // 2. 解密
    data, err := cs.decrypt(encrypted)
    if err != nil {
        return nil, fmt.Errorf("解密失败: %w", err)
    }

    // 3. 返回平台凭证
    creds, ok := data.Platforms[platformID]
    if !ok {
        return nil, fmt.Errorf("平台凭证不存在: %s", platformID)
    }

    return creds, nil
}

// 简单加密（生产环境应使用 AES-256）
func (cs *CredentialStorage) encrypt(data *StoredCredentials) ([]byte, error) {
    jsonBytes, err := json.Marshal(data)
    if err != nil {
        return nil, err
    }
    // TODO: 实现加密逻辑
    return jsonBytes, nil
}

// 简单解密
func (cs *CredentialStorage) decrypt(encrypted []byte) (*StoredCredentials, error) {
    // TODO: 实现解密逻辑
    var data StoredCredentials
    err := json.Unmarshal(encrypted, &data)
    if err != nil {
        return nil, err
    }
    return &data, nil
}
```

#### 3. 平台实现

##### 3.1 抖音平台

**文件**: `services/douyin.go`

**职责**:
- 实现抖音平台的具体业务逻辑
- 适配抖音创作者平台的页面结构

**核心功能**:

```go
type DouyinService struct {
    platform Platform
    auth     *AuthManager
    browser  *BrowserController
    storage  *CredentialStorage
    logger   *zap.Logger
}

// 抖音登录
func (ds *DouyinService) Login(ctx context.Context) error {
    // 1. 打开创作者服务平台登录页
    loginURL := "https://creator.douyin.com/creator-micro/home"
    page := ds.browser.MustPage(loginURL)

    // 2. 调用通用二维码登录流程
    return ds.auth.QRCodeLogin(ctx)
}

// 发布图文
func (ds *DouyinService) PublishImageText(ctx context.Context, req *PublishImageTextRequest) error {
    // 1. 打开发布页面
    publishURL := "https://creator.douyin.com/creator-micro/publish/publish/"
    page := ds.browser.MustPage(publishURL)

    // 2. 选择图文类型
    err := ds.browser.SimulateHumanAction(func() error {
        return page.Element(`[data-testid="image-text-mode"]`).MustClick()
    })
    if err != nil {
        return err
    }

    // 3. 上传封面图
    err = ds.browser.UploadImage(page, req.CoverImage, `input[type="file"]`)
    if err != nil {
        return fmt.Errorf("上传封面图失败: %w", err)
    }

    // 4. 上传多张图片
    for _, img := range req.Images {
        err = ds.browser.UploadImage(page, img, `input[type="file"]`)
        if err != nil {
            return fmt.Errorf("上传图片失败: %w", err)
        }
    }

    // 5. 填写标题
    err = ds.browser.SimulateHumanAction(func() error {
        return page.Element(`[data-testid="title-input"]`).MustInput(req.Title)
    })
    if err != nil {
        return err
    }

    // 6. 填写正文
    err = ds.browser.SimulateHumanAction(func() error {
        return page.Element(`[data-testid="content-input"]`).MustInput(req.Content)
    })
    if err != nil {
        return err
    }

    // 7. 添加话题标签
    for _, tag := range req.Tags {
        err = ds.browser.SimulateHumanAction(func() error {
            tagInput := page.Element(`[data-testid="tag-input"]`)
            err := tagInput.MustClick()
            if err != nil {
                return err
            }
            time.Sleep(500 * time.Millisecond)
            return tagInput.MustInput(tag)
        })
        if err != nil {
            ds.logger.Warn("添加话题失败", zap.Error(err))
        }
    }

    // 8. 点击发布按钮
    err = ds.browser.SimulateHumanAction(func() error {
        return page.Element(`[data-testid="publish-button"]`).MustClick()
    })
    if err != nil {
        return err
    }

    // 9. 等待发布结果
    err = ds.waitForPublishResult(page, 60*time.Second)
    if err != nil {
        return fmt.Errorf("发布失败: %w", err)
    }

    // 10. 提取作品 ID
    workID, err := ds.extractWorkID(page)
    if err != nil {
        return fmt.Errorf("提取作品ID失败: %w", err)
    }

    ds.logger.Info("图文发布成功", zap.String("workID", workID))
    return nil
}

// 发布视频
func (ds *DouyinService) PublishVideo(ctx context.Context, req *PublishVideoRequest) error {
    // 1. 打开视频发布页
    publishURL := "https://creator.douyin.com/creator-micro/publish/upload/"
    page := ds.browser.MustPage(publishURL)

    // 2. 选择视频类型
    err := ds.browser.SimulateHumanAction(func() error {
        return page.Element(`[data-testid="video-mode"]`).MustClick()
    })
    if err != nil {
        return err
    }

    // 3. 上传视频
    progressChan := make(chan int, 100)
    go func() {
        for progress := range progressChan {
            ds.logger.Info("视频上传进度", zap.Int("progress", progress))
        }
    }()

    err = ds.browser.UploadVideo(page, req.VideoPath, `input[type="file"]`, progressChan)
    if err != nil {
        return fmt.Errorf("上传视频失败: %w", err)
    }

    // 4. 等待转码完成
    err = ds.waitForTranscoding(page, 5*time.Minute)
    if err != nil {
        return fmt.Errorf("转码失败: %w", err)
    }

    // 5. 填写标题和描述
    // ... (类似图文发布)

    // 6. 点击发布按钮
    // ... (类似图文发布)

    return nil
}

// 获取内容列表
func (ds *DouyinService) GetContents(ctx context.Context) ([]*Content, error) {
    // 1. 打开个人主页
    profileURL := "https://creator.douyin.com/creator-micro/home"
    page := ds.browser.MustPage(profileURL)

    // 2. 等待作品列表加载
    err := page.Timeout(30*time.Second).WaitElements(`[data-testid="content-item"]`)
    if err != nil {
        return nil, fmt.Errorf("加载作品列表失败: %w", err)
    }

    // 3. 解析作品列表
    elements := page.MustElements(`[data-testid="content-item"]`)
    contents := make([]*Content, 0, len(elements))

    for _, element := range elements {
        content, err := ds.parseContentItem(element)
        if err != nil {
            ds.logger.Warn("解析作品项失败", zap.Error(err))
            continue
        }
        contents = append(contents, content)
    }

    return contents, nil
}

// 解析作品项
func (ds *DouyinService) parseContentItem(element *rod.Element) (*Content, error) {
    // 提取作品 ID
    workID, err := element.Attribute("data-work-id").String()
    if err != nil {
        return nil, err
    }

    // 提取标题
    title, err := element.Element(`[data-testid="title"]`).Text()
    if err != nil {
        return nil, err
    }

    // 提取封面图 URL
    coverURL, err := element.Element(`[data-testid="cover"]`).Property("src").String()
    if err != nil {
        return nil, err
    }

    // 提取数据指标
    views, err := element.Element(`[data-testid="views"]`).Text()
    if err != nil {
        views = "0"
    }

    likes, err := element.Element(`[data-testid="likes"]`).Text()
    if err != nil {
        likes = "0"
    }

    // 提取发布时间
    publishTime, err := element.Element(`[data-testid="publish-time"]`).Property("datetime").String()
    if err != nil {
        publishTime = ""
    }

    return &Content{
        ID:          workID,
        Title:       title,
        CoverURL:    coverURL,
        Views:       parseViews(views),
        Likes:       parseLikes(likes),
        PublishTime:  publishTime,
    }, nil
}
```

##### 3.2 今日头条平台

**文件**: `services/toutiao.go`

**职责**:
- 实现今日头条平台的具体业务逻辑
- 适配头条号后台的页面结构

**核心功能**:

```go
type ToutiaoService struct {
    platform Platform
    auth     *AuthManager
    browser  *BrowserController
    storage  *CredentialStorage
    logger   *zap.Logger
}

// 今日头条登录
func (ts *ToutiaoService) Login(ctx context.Context) error {
    // 1. 打开头条号后台登录页
    loginURL := "https://mp.toutiao.com/"
    page := ts.browser.MustPage(loginURL)

    // 2. 调用通用二维码登录流程
    return ts.auth.QRCodeLogin(ctx)
}

// 发布内容
func (ts *ToutiaoService) Publish(ctx context.Context, req *PublishRequest) error {
    // 1. 打开发布页面
    publishURL := "https://mp.toutiao.com/content/publish"
    page := ts.browser.MustPage(publishURL)

    // 2. 选择内容类型（图文/视频）
    switch req.ContentType {
    case "image_text":
        return ts.publishImageText(page, req)
    case "video":
        return ts.publishVideo(page, req)
    default:
        return fmt.Errorf("不支持的内容类型: %s", req.ContentType)
    }
}

// 发布图文
func (ts *ToutiaoService) publishImageText(page *rod.Page, req *PublishRequest) error {
    // 1. 点击图文发布入口
    err := ts.browser.SimulateHumanAction(func() error {
        return page.Element(`[data-testid="image-text-entry"]`).MustClick()
    })
    if err != nil {
        return err
    }

    // 2. 上传封面图
    // ... (类似抖音实现)

    // 3. 上传多张图片（头条支持多图）
    for _, img := range req.Images {
        // ...
    }

    // 4. 填写标题和正文
    // ... (类似抖音实现)

    // 5. 点击发布按钮
    // ...

    return nil
}

// 发布视频
func (ts *ToutiaoService) publishVideo(page *rod.Page, req *PublishRequest) error {
    // 1. 点击视频发布入口
    err := ts.browser.SimulateHumanAction(func() error {
        return page.Element(`[data-testid="video-entry"]`).MustClick()
    })
    if err != nil {
        return err
    }

    // 2. 上传视频
    progressChan := make(chan int, 100)
    err = ts.browser.UploadVideo(page, req.VideoPath, `input[type="file"]`, progressChan)
    if err != nil {
        return fmt.Errorf("上传视频失败: %w", err)
    }

    // 3. 等待转码
    // ...

    // 4. 填写元信息
    // ...

    // 5. 发布
    // ...

    return nil
}

// 获取内容列表
func (ts *ToutiaoService) GetContents(ctx context.Context) ([]*Content, error) {
    // 1. 打开内容管理页
    manageURL := "https://mp.toutiao.com/content/manage"
    page := ts.browser.MustPage(manageURL)

    // 2. 等待内容列表加载
    err := page.Timeout(30*time.Second).WaitElements(`[data-testid="content-item"]`)
    if err != nil {
        return nil, fmt.Errorf("加载内容列表失败: %w", err)
    }

    // 3. 解析内容列表
    // ... (类似抖音实现)

    return nil, nil
}
```

#### 4. MCP 工具定义

**文件**: `mcp_tools.go`

**职责**:
- 定义所有 MCP 工具
- 提供工具描述和参数 Schema

**工具列表**:

```go
// 抖音工具
const (
    ToolDouyinLogin             = "douyin_login"
    ToolDouyinPublishImageText  = "douyin_publish_image_text"
    ToolDouyinPublishVideo     = "douyin_publish_video"
    ToolDouyinGetContents      = "douyin_get_contents"
    ToolDouyinGetContentDetail = "douyin_get_content_detail"
    ToolDouyinLike             = "douyin_like"
    ToolDouyinComment          = "douyin_comment"
)

// 今日头条工具
const (
    ToolToutiaoLogin       = "toutiao_login"
    ToolToutiaoPublish      = "toutiao_publish"
    ToolToutiaoGetContents = "toutiao_get_contents"
    ToolToutiaoGetContentDetail = "toutiao_get_content_detail"
)

// 工具定义
type MCPTool struct {
    Name        string
    Description string
    InputSchema map[string]interface{}
    Handler     func(ctx context.Context, params map[string]interface{}) (interface{}, error)
}

// 获取所有工具
func GetAllMCPTools() []MCPTool {
    return []MCPTool{
        {
            Name:        ToolDouyinLogin,
            Description: "抖音账号登录",
            InputSchema: map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{},
            },
            Handler: handleDouyinLogin,
        },
        {
            Name:        ToolDouyinPublishImageText,
            Description: "发布图文内容到抖音",
            InputSchema: map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{
                    "title": map[string]interface{}{
                        "type":        "string",
                        "description": "内容标题",
                    },
                    "content": map[string]interface{}{
                        "type":        "string",
                        "description": "内容正文",
                    },
                    "images": map[string]interface{}{
                        "type":        "array",
                        "description": "图片文件路径列表",
                        "items": map[string]interface{}{
                            "type": "string",
                        },
                    },
                    "tags": map[string]interface{}{
                        "type":        "array",
                        "description": "话题标签列表",
                        "items": map[string]interface{}{
                            "type": "string",
                        },
                    },
                },
            },
            Handler: handleDouyinPublishImageText,
        },
        // ... 其他工具定义
    }
}
```

#### 5. 数据模型

**文件**: `models/models.go`

**核心数据结构**:

```go
// 登录相关
type LoginRequest struct {
    Platform  PlatformID `json:"platform"`
}

type LoginResponse struct {
    Success   bool   `json:"success"`
    QRCode    string `json:"qrcode,omitempty"`
    ExpiresIn int    `json:"expires_in,omitempty"`
}

// 发布相关
type PublishRequest struct {
    ContentType string   `json:"content_type"` // image_text, video
    Title       string   `json:"title"`
    Content     string   `json:"content"`
    Images      []string `json:"images"`
    VideoPath   string   `json:"video_path,omitempty"`
    Tags        []string `json:"tags"`
    PublishTime string   `json:"publish_time,omitempty"` // ISO 8601 格式
}

type PublishResponse struct {
    Success   bool   `json:"success"`
    ContentID string `json:"content_id"`
    ContentURL string `json:"content_url"`
    Message   string `json:"message,omitempty"`
}

// 内容相关
type Content struct {
    ID          string `json:"id"`
    Title       string `json:"title"`
    ContentType string `json:"content_type"`
    CoverURL    string `json:"cover_url"`
    PublishTime string `json:"publish_time"`
    Views       int    `json:"views"`
    Likes       int    `json:"likes"`
    Comments    int    `json:"comments"`
    Shares      int    `json:"shares"`
}

type GetContentsRequest struct {
    Page  int `json:"page"`
    Limit int `json:"limit"`
}

type GetContentsResponse struct {
    Success    bool     `json:"success"`
    Data       []*Content `json:"data"`
    Pagination *Pagination `json:"pagination,omitempty"`
}

// 互动相关
type LikeRequest struct {
    ContentID string `json:"content_id"`
}

type CommentRequest struct {
    ContentID string `json:"content_id"`
    Comment   string `json:"comment"`
}

type InteractionResponse struct {
    Success bool   `json:"success"`
    Message string `json:"message,omitempty"`
}
```

## 配置管理

### 配置文件结构

```json
{
  "version": "1.0.0",
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "mcp_port": 3000,
    "log_level": "info"
  },
  "browser": {
    "headless": true,
    "disable_images": false,
    "user_agent_pool": [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ],
    "screen_sizes": [
      [1920, 1080],
      [1366, 768],
      [1440, 900]
    ]
  },
  "anti_bot": {
    "enabled": true,
    "min_operation_delay": 2000,
    "max_operation_delay": 5000,
    "publish_interval": 300000,
    "max_retry": 3
  },
  "platforms": {
    "douyin": {
      "enabled": true,
      "login_url": "https://creator.douyin.com/creator-micro/home",
      "publish_url": "https://creator.douyin.com/creator-micro/publish/publish/",
      "profile_url": "https://creator.douyin.com/creator-micro/home"
    },
    "toutiao": {
      "enabled": true,
      "login_url": "https://mp.toutiao.com/",
      "publish_url": "https://mp.toutiao.com/content/publish",
      "profile_url": "https://mp.toutiao.com/content/manage"
    }
  },
  "storage": {
    "credentials_file": "credentials.json",
    "encrypt_credentials": false,
    "backup_enabled": true
  }
}
```

## 部署架构

### 可执行文件结构

```
mcp-publish-platform/
├── bin/                          # 可执行文件目录
│   ├── mcp-publish-linux-amd64       # Linux 可执行文件
│   ├── mcp-publish-linux-arm64       # Linux ARM 可执行文件
│   ├── mcp-publish-darwin-amd64       # macOS 可执行文件
│   ├── mcp-publish-darwin-arm64       # macOS ARM 可执行文件
│   ├── mcp-publish-windows-amd64.exe   # Windows 可执行文件
│   └── mcp-publish-windows-arm64.exe   # Windows ARM 可执行文件
├── config/                        # 配置文件目录
│   ├── config.json                  # 默认配置
│   └── config.example.json           # 配置示例
├── docs/                          # 文档目录
│   ├── API.md                       # API 文档
│   ├── MCP.md                       # MCP 协议文档
│   └── DEPLOYMENT.md                 # 部署文档
└── README.md                       # 使用说明
```

### 启动脚本

**Linux/macOS**: `start.sh`

```bash
#!/bin/bash

# 检查配置文件
if [ ! -f "config/config.json" ]; then
    echo "配置文件不存在，从示例复制..."
    cp config/config.example.json config/config.json
fi

# 启动 MCP 服务器
./bin/mcp-publish-$(uname -s | tr '[:upper:]' '[:lower:]')-amd64 \
    --config=config/config.json \
    --log=info
```

**Windows**: `start.bat`

```batch
@echo off

REM 检查配置文件
if not exist "config\config.json" (
    echo 配置文件不存在，从示例复制...
    copy config\config.example.json config\config.json
)

REM 启动 MCP 服务器
bin\mcp-publish-windows-amd64.exe ^
    --config=config\config.json ^
    --log=info

pause
```

## 测试验证方案

### 1. 功能测试

#### 测试目标
验证所有核心功能正常工作

#### 测试用例

1. **登录功能测试**
   - [ ] 测试抖音二维码登录
   - [ ] 测试今日头条二维码登录
   - [ ] 验证凭证存储和加载
   - [ ] 验证登录状态检查接口

2. **图文发布测试**
   - [ ] 测试抖音图文发布（单图）
   - [ ] 测试抖音图文发布（多图）
   - [ ] 测试今日头条图文发布
   - [ ] 验证图片上传进度回调
   - [ ] 验证话题标签添加

3. **视频发布测试**
   - [ ] 测试抖音视频发布（小文件）
   - [ ] 测试抖音视频发布（大文件切片）
   - [ ] 测试今日头条视频发布
   - [ ] 验证视频上传进度回调
   - [ ] 验证转码等待逻辑

4. **内容管理测试**
   - [ ] 测试获取抖音内容列表
   - [ ] 测试获取今日头条内容列表
   - [ ] 测试获取内容详情
   - [ ] 验证分页功能

5. **互动操作测试**
   - [ ] 测试抖音点赞功能
   - [ ] 测试抖音评论功能
   - [ ] 测试今日头条收藏功能

6. **MCP 协议测试**
   - [ ] 测试 MCP 连接
   - [ ] 测试工具列表获取
   - [ ] 测试工具调用
   - [ ] 测试流式响应
   - [ ] 测试错误处理

### 2. 平台兼容性测试

#### 测试目标
验证在不同平台环境下的兼容性

#### 测试环境

1. **操作系统**
   - [ ] Ubuntu 20.04 LTS
   - [ ] Ubuntu 22.04 LTS
   - [ ] macOS 12 (Monterey)
   - [ ] macOS 13 (Ventura)
   - [ ] Windows 10
   - [ ] Windows 11

2. **浏览器依赖**
   - [ ] Chrome/Chromium 版本兼容性
   - [ ] Rod 库版本稳定性
   - [ ] 无头浏览器配置

3. **网络环境**
   - [ ] 国内网络环境
   - [ ] 海外网络环境（代理）

### 3. 集成测试

#### 测试目标
验证与 MCP 客户端和 HTTP API 的集成

#### 测试客户端

1. **Cherry Studio**
   - [ ] 测试连接和工具列表显示
   - [ ] 测试抖音工具调用
   - [ ] 测试今日头条工具调用
   - [ ] 测试平台切换功能

2. **AnythingLLM**
   - [ ] 测试 MCP 连接
   - [ ] 测试工具调用和参数传递
   - [ ] 测试返回值解析

3. **自定义 HTTP 客户端**
   - [ ] 测试所有 API 接口
   - [ ] 测试错误处理
   - [ ] 测试响应格式

### 4. 性能测试

#### 测试目标
验证系统性能和资源使用

#### 测试指标

1. **登录性能**
   - [ ] 二维码生成时间 < 3 秒
   - [ ] 登录检测响应时间 < 2 秒

2. **发布性能**
   - [ ] 图文发布时间 < 30 秒
   - [ ] 视频上传速度 > 1MB/s
   - [ ] 操作响应时间 < 500ms

3. **资源使用**
   - [ ] 内存使用 < 500MB（无头模式）
   - [ ] CPU 使用 < 50%（空闲时）
   - [ ] 浏览器实例释放正常

### 5. 风控和反爬虫测试

#### 测试目标
验证反爬虫机制的有效性

#### 测试场景

1. **操作频率测试**
   - [ ] 测试高频请求限制
   - [ ] 测试操作间隔控制
   - [ ] 验证发布间隔≥5 分钟

2. **指纹模拟测试**
   - [ ] 测试 User-Agent 随机化
   - [ ] 测试屏幕尺寸随机化
   - [ ] 测试无头模式配置

3. **风控应对测试**
   - [ ] 测试验证码处理
   - [ ] 测试账号限制处理
   - [ ] 测试临时封禁应对

### 6. 稳定性测试

#### 测试目标
长时间运行验证系统稳定性

#### 测试场景

1. **长时间运行测试**
   - [ ] 持续运行 24 小时
   - [ ] 内存泄漏检测
   - [ ] 浏览器实例检测

2. **并发测试**
   - [ ] 测试多账号同时登录
   - [ ] 测试多平台并发操作
   - [ ] 测试 API 并发请求

3. **异常恢复测试**
   - [ ] 模拟网络断开
   - [ ] 模拟平台服务异常
   - [ ] 测试自动重连机制

## 技术栈总结

- **编程语言**: Go 1.21+
- **浏览器自动化**: Rod (go-rod/rod)
- **日志库**: Zap (uber-go/zap)
- **HTTP 服务器**: 标准库 net/http
- **JSON 处理**: 标准库 encoding/json
- **配置管理**: 标准库 encoding/json
- **加密库**: (可选）crypto/aes
- **并发控制**: 标准库 sync
- **MCP 协议**: JSON-RPC 2.0

## 扩展性设计

### 平台扩展接口

```go
// 新增平台只需实现此接口
type Platform interface {
    ID() PlatformID
    Name() string
    LoginURL() string
    // ... 其他方法
}

// 注册新平台
func RegisterPlatform(platform Platform) {
    mcpServer.servers[platform.ID()] = NewPlatformServer(platform)
}
```

### 功能扩展点

1. **支持更多平台**
   - 小红书（参考实现）
   - 微博
   - 微信公众号
   - B站

2. **支持更多功能**
   - 直播功能
   - 私信功能
   - 数据分析导出
   - 内容模板管理

3. **支持更多客户端**
   - 自定义 MCP 客户端
   - 移动端 App
   - Web 管理后台

## 安全考虑

### 1. 凭证安全

- 加密存储敏感凭证
- 定期更新凭证
- 支持多账号隔离

### 2. 通信安全

- HTTPS 支持（可选）
- API 接口鉴权
- MCP 连接认证（可选）

### 3. 日志安全

- 敏感信息脱敏
- 日志级别控制
- 日志轮转和归档
