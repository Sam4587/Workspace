// Package adapters 提供各平台的发布器适配器实现
package adapters

import (
	"context"
	"fmt"
	"sync"
	"time"

	publisher "github.com/monkeycode/publisher-core/interfaces"
	"github.com/monkeycode/publisher-core/storage"
	"github.com/monkeycode/publisher-core/task"
)

// DouyinAdapter 抖音发布器适配器
type DouyinAdapter struct {
	page       interface{} // rod.Page
	cookieDir  string
	headless   bool
	taskMgr    *task.TaskManager
	storage    storage.Storage

	mu         sync.Mutex
	loginURL   string
	publishURL string
	limits     publisher.ContentLimits
}

// DouyinConfig 抖音配置
type DouyinConfig struct {
	CookieDir string
	Headless  bool
	Storage   storage.Storage
}

// NewDouyinAdapter 创建抖音适配器
func NewDouyinAdapter(cfg *DouyinConfig) *DouyinAdapter {
	if cfg == nil {
		cfg = &DouyinConfig{}
	}
	if cfg.CookieDir == "" {
		cfg.CookieDir = "./cookies"
	}

	return &DouyinAdapter{
		cookieDir:  cfg.CookieDir,
		headless:   cfg.Headless,
		loginURL:   "https://creator.douyin.com/creator-micro/content/publish",
		publishURL: "https://creator.douyin.com/creator-micro/content/publish",
		limits: publisher.ContentLimits{
			TitleMaxLength:      30,
			BodyMaxLength:       2000,
			MaxImages:           12,
			MaxVideoSize:        4 * 1024 * 1024 * 1024, // 4GB
			MaxTags:             5,
			AllowedVideoFormats: []string{".mp4", ".mov", ".avi", ".mkv"},
			AllowedImageFormats: []string{".jpg", ".jpeg", ".png", ".webp"},
		},
		taskMgr: task.NewTaskManager(task.NewMemoryStorage()),
		storage: cfg.Storage,
	}
}

// Platform 返回平台名称
func (a *DouyinAdapter) Platform() string {
	return "douyin"
}

// Login 执行登录
func (a *DouyinAdapter) Login(ctx context.Context) (*publisher.LoginResult, error) {
	// 检查是否已登录
	loggedIn, err := a.CheckLoginStatus(ctx)
	if err != nil {
		return nil, err
	}

	if loggedIn {
		return &publisher.LoginResult{
			Success: true,
		}, nil
	}

	// 返回二维码信息(实际实现需要调用 rod 浏览器)
	return &publisher.LoginResult{
		Success:   false,
		QrcodeURL: a.loginURL,
	}, nil
}

// WaitForLogin 等待登录完成
func (a *DouyinAdapter) WaitForLogin(ctx context.Context) error {
	// 轮询检查登录状态
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			loggedIn, _ := a.CheckLoginStatus(ctx)
			if loggedIn {
				return nil
			}
		}
	}
}

// CheckLoginStatus 检查登录状态
func (a *DouyinAdapter) CheckLoginStatus(ctx context.Context) (bool, error) {
	// 检查 Cookie 是否存在
	cookiePath := fmt.Sprintf("%s/douyin_cookies.json", a.cookieDir)
	if a.storage != nil {
		exists, err := a.storage.Exists(ctx, cookiePath)
		if err != nil {
			return false, nil
		}
		return exists, nil
	}
	return false, nil
}

// Publish 同步发布
func (a *DouyinAdapter) Publish(ctx context.Context, content *publisher.Content) (*publisher.PublishResult, error) {
	// 验证内容
	if err := a.validateContent(content); err != nil {
		return nil, err
	}

	// 创建任务
	taskID := fmt.Sprintf("douyin_%d", time.Now().UnixNano())

	result := &publisher.PublishResult{
		TaskID:    taskID,
		Status:    publisher.StatusProcessing,
		Platform:  a.Platform(),
		CreatedAt: time.Now(),
	}

	// 实际发布逻辑(需要调用 rod 浏览器)
	// 这里是占位实现
	err := a.doPublish(ctx, content)
	if err != nil {
		result.Status = publisher.StatusFailed
		result.Error = err.Error()
		return result, err
	}

	result.Status = publisher.StatusSuccess
	now := time.Now()
	result.FinishedAt = &now

	return result, nil
}

// PublishAsync 异步发布
func (a *DouyinAdapter) PublishAsync(ctx context.Context, content *publisher.Content) (string, error) {
	// 验证内容
	if err := a.validateContent(content); err != nil {
		return "", err
	}

	// 创建任务
	payload := map[string]interface{}{
		"title":   content.Title,
		"body":    content.Body,
		"type":    content.Type,
		"images":  content.ImagePaths,
		"video":   content.VideoPath,
		"tags":    content.Tags,
	}

	t, err := a.taskMgr.CreateTask("publish", "douyin", payload)
	if err != nil {
		return "", err
	}

	// 异步执行
	go a.taskMgr.Execute(context.Background(), t.ID)

	return t.ID, nil
}

// QueryStatus 查询任务状态
func (a *DouyinAdapter) QueryStatus(ctx context.Context, taskID string) (*publisher.PublishResult, error) {
	t, err := a.taskMgr.GetTask(taskID)
	if err != nil {
		return nil, err
	}

	result := &publisher.PublishResult{
		TaskID:    t.ID,
		Platform:  a.Platform(),
		CreatedAt: t.CreatedAt,
	}

	switch t.Status {
	case task.TaskStatusPending:
		result.Status = publisher.StatusPending
	case task.TaskStatusRunning:
		result.Status = publisher.StatusProcessing
	case task.TaskStatusCompleted:
		result.Status = publisher.StatusSuccess
		if t.FinishedAt != nil {
			result.FinishedAt = t.FinishedAt
		}
	case task.TaskStatusFailed:
		result.Status = publisher.StatusFailed
		result.Error = t.Error
	case task.TaskStatusCancelled:
		result.Status = publisher.StatusFailed
		result.Error = "任务已取消"
	}

	return result, nil
}

// Cancel 取消任务
func (a *DouyinAdapter) Cancel(ctx context.Context, taskID string) error {
	return a.taskMgr.Cancel(taskID)
}

// Close 关闭适配器
func (a *DouyinAdapter) Close() error {
	return nil
}

// GetLimits 获取内容限制
func (a *DouyinAdapter) GetLimits() publisher.ContentLimits {
	return a.limits
}

func (a *DouyinAdapter) validateContent(content *publisher.Content) error {
	if content == nil {
		return fmt.Errorf("内容不能为空")
	}

	if len(content.Title) > a.limits.TitleMaxLength {
		return fmt.Errorf("标题超过最大长度 %d", a.limits.TitleMaxLength)
	}

	if len(content.Body) > a.limits.BodyMaxLength {
		return fmt.Errorf("正文超过最大长度 %d", a.limits.BodyMaxLength)
	}

	if content.Type == publisher.ContentTypeImages && len(content.ImagePaths) == 0 {
		return fmt.Errorf("图文内容必须包含图片")
	}

	if content.Type == publisher.ContentTypeVideo && content.VideoPath == "" {
		return fmt.Errorf("视频内容必须包含视频")
	}

	return nil
}

func (a *DouyinAdapter) doPublish(ctx context.Context, content *publisher.Content) error {
	// 实际发布实现需要调用 rod 浏览器
	// 这里是占位实现
	return nil
}

// ToutiaoAdapter 今日头条发布器适配器
type ToutiaoAdapter struct {
	DouyinAdapter
}

// NewToutiaoAdapter 创建今日头条适配器
func NewToutiaoAdapter(cfg *DouyinConfig) *ToutiaoAdapter {
	adapter := NewDouyinAdapter(cfg)
	adapter.loginURL = "https://mp.toutiao.com/"
	adapter.publishURL = "https://mp.toutiao.com/profile_v4/pub_article"
	return &ToutiaoAdapter{DouyinAdapter: *adapter}
}

// Platform 返回平台名称
func (a *ToutiaoAdapter) Platform() string {
	return "toutiao"
}

// XiaohongshuAdapter 小红书发布器适配器
type XiaohongshuAdapter struct {
	DouyinAdapter
}

// NewXiaohongshuAdapter 创建小红书适配器
func NewXiaohongshuAdapter(cfg *DouyinConfig) *XiaohongshuAdapter {
	adapter := NewDouyinAdapter(cfg)
	adapter.loginURL = "https://creator.xiaohongshu.com/"
	adapter.publishURL = "https://creator.xiaohongshu.com/publish/publish"
	adapter.limits = publisher.ContentLimits{
		TitleMaxLength:      20,
		BodyMaxLength:       1000,
		MaxImages:           18,
		MaxVideoSize:        500 * 1024 * 1024, // 500MB
		MaxTags:             5,
		AllowedVideoFormats: []string{".mp4", ".mov"},
		AllowedImageFormats: []string{".jpg", ".jpeg", ".png", ".webp"},
	}
	return &XiaohongshuAdapter{DouyinAdapter: *adapter}
}

// Platform 返回平台名称
func (a *XiaohongshuAdapter) Platform() string {
	return "xiaohongshu"
}

// PublisherFactory 发布器工厂
type PublisherFactory struct {
	adapters map[string]func() publisher.Publisher
}

// NewPublisherFactory 创建工厂
func NewPublisherFactory() *PublisherFactory {
	return &PublisherFactory{
		adapters: make(map[string]func() publisher.Publisher),
	}
}

// Register 注册平台适配器
func (f *PublisherFactory) Register(platform string, creator func() publisher.Publisher) {
	f.adapters[platform] = creator
}

// Create 创建发布器
func (f *PublisherFactory) Create(platform string, opts ...publisher.Option) (publisher.Publisher, error) {
	creator, exists := f.adapters[platform]
	if !exists {
		return nil, fmt.Errorf("不支持的平台: %s", platform)
	}
	return creator(), nil
}

// SupportedPlatforms 返回支持的平台列表
func (f *PublisherFactory) SupportedPlatforms() []string {
	platforms := make([]string, 0, len(f.adapters))
	for p := range f.adapters {
		platforms = append(platforms, p)
	}
	return platforms
}

// DefaultFactory 默认工厂
func DefaultFactory() *PublisherFactory {
	f := NewPublisherFactory()

	f.Register("douyin", func() publisher.Publisher {
		return NewDouyinAdapter(nil)
	})

	f.Register("toutiao", func() publisher.Publisher {
		return NewToutiaoAdapter(nil)
	})

	f.Register("xiaohongshu", func() publisher.Publisher {
		return NewXiaohongshuAdapter(nil)
	})

	return f
}
