package platform

import (
	"context"
	"fmt"
	"sync"

	"github.com/go-rod/rod"
	"github.com/sirupsen/logrus"
)

// PlatformManager 平台管理器
type PlatformManager struct {
	mu       sync.RWMutex
	registry *PlatformRegistry
	browser  *rod.Browser
}

// NewPlatformManager 创建平台管理器
func NewPlatformManager() *PlatformManager {
	return &PlatformManager{
		registry: &PlatformRegistry{
			platforms: make(map[PlatformID]Platform),
		},
	}
}

// RegisterPlatform 注册平台
func (pm *PlatformManager) RegisterPlatform(p Platform) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	
	if err := pm.registry.Register(p); err != nil {
		return err
	}
	
	logrus.Infof("平台注册成功: %s (%s)", p.Name(), p.ID())
	return nil
}

// GetPlatform 获取平台
func (pm *PlatformManager) GetPlatform(id PlatformID) (Platform, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	
	return pm.registry.Get(id)
}

// ListPlatforms 列出所有平台
func (pm *PlatformManager) ListPlatforms() []PlatformID {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	
	return pm.registry.List()
}

// SetBrowser 设置浏览器实例
func (pm *PlatformManager) SetBrowser(browser *rod.Browser) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.browser = browser
}

// GetBrowser 获取浏览器实例
func (pm *PlatformManager) GetBrowser() *rod.Browser {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	return pm.browser
}

// Login 执行登录
func (pm *PlatformManager) Login(ctx context.Context, platformID PlatformID, page *rod.Page) error {
	p, err := pm.GetPlatform(platformID)
	if err != nil {
		return fmt.Errorf("获取平台失败: %w", err)
	}
	
	logrus.Infof("开始登录平台: %s", p.Name())
	return p.Login(ctx, page)
}

// CheckLogin 检查登录状态
func (pm *PlatformManager) CheckLogin(ctx context.Context, platformID PlatformID, page *rod.Page) (bool, error) {
	p, err := pm.GetPlatform(platformID)
	if err != nil {
		return false, fmt.Errorf("获取平台失败: %w", err)
	}
	
	return p.CheckLogin(ctx, page)
}

// PublishImageText 发布图文
func (pm *PlatformManager) PublishImageText(ctx context.Context, platformID PlatformID, page *rod.Page, req *ImageTextRequest) (*PublishResponse, error) {
	p, err := pm.GetPlatform(platformID)
	if err != nil {
		return nil, fmt.Errorf("获取平台失败: %w", err)
	}
	
	logrus.Infof("开始发布图文到平台: %s", p.Name())
	return p.PublishImageText(ctx, page, req)
}

// PublishVideo 发布视频
func (pm *PlatformManager) PublishVideo(ctx context.Context, platformID PlatformID, page *rod.Page, req *VideoRequest) (*PublishResponse, error) {
	p, err := pm.GetPlatform(platformID)
	if err != nil {
		return nil, fmt.Errorf("获取平台失败: %w", err)
	}
	
	logrus.Infof("开始发布视频到平台: %s", p.Name())
	return p.PublishVideo(ctx, page, req)
}

// GetFeeds 获取内容列表
func (pm *PlatformManager) GetFeeds(ctx context.Context, platformID PlatformID, page *rod.Page, req *GetFeedsRequest) (*GetFeedsResponse, error) {
	p, err := pm.GetPlatform(platformID)
	if err != nil {
		return nil, fmt.Errorf("获取平台失败: %w", err)
	}
	
	return p.GetFeeds(ctx, page, req)
}

// GetFeedDetail 获取内容详情
func (pm *PlatformManager) GetFeedDetail(ctx context.Context, platformID PlatformID, page *rod.Page, feedID string) (*FeedDetail, error) {
	p, err := pm.GetPlatform(platformID)
	if err != nil {
		return nil, fmt.Errorf("获取平台失败: %w", err)
	}
	
	return p.GetFeedDetail(ctx, page, feedID)
}

// 全局平台管理器实例
var globalManager *PlatformManager
var once sync.Once

// GetPlatformManager 获取全局平台管理器
func GetPlatformManager() *PlatformManager {
	once.Do(func() {
		globalManager = NewPlatformManager()
	})
	return globalManager
}
