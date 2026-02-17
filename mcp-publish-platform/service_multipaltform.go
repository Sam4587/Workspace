package main

import (
	"context"
	"github.com/go-rod/rod"
	"github.com/sirupsen/logrus"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

// MultiPlatformService 多平台服务
type MultiPlatformService struct {
	platformManager *platform.PlatformManager
}

// NewMultiPlatformService 创建多平台服务
func NewMultiPlatformService(pm *platform.PlatformManager) *MultiPlatformService {
	return &MultiPlatformService{
		platformManager: pm,
	}
}

// Login 登录平台
func (s *MultiPlatformService) Login(ctx context.Context, platformID platform.PlatformID, page *rod.Page) error {
	logrus.Infof("开始登录平台: %s", platformID)
	return s.platformManager.Login(ctx, platformID, page)
}

// CheckLogin 检查登录状态
func (s *MultiPlatformService) CheckLogin(ctx context.Context, platformID platform.PlatformID, page *rod.Page) (bool, error) {
	return s.platformManager.CheckLogin(ctx, platformID, page)
}

// PublishImageText 发布图文
func (s *MultiPlatformService) PublishImageText(ctx context.Context, platformID platform.PlatformID, page *rod.Page, req *platform.ImageTextRequest) (*platform.PublishResponse, error) {
	logrus.Infof("发布图文到平台: %s", platformID)
	return s.platformManager.PublishImageText(ctx, platformID, page, req)
}

// PublishVideo 发布视频
func (s *MultiPlatformService) PublishVideo(ctx context.Context, platformID platform.PlatformID, page *rod.Page, req *platform.VideoRequest) (*platform.PublishResponse, error) {
	logrus.Infof("发布视频到平台: %s", platformID)
	return s.platformManager.PublishVideo(ctx, platformID, page, req)
}

// GetFeeds 获取内容列表
func (s *MultiPlatformService) GetFeeds(ctx context.Context, platformID platform.PlatformID, page *rod.Page, req *platform.GetFeedsRequest) (*platform.GetFeedsResponse, error) {
	return s.platformManager.GetFeeds(ctx, platformID, page, req)
}

// GetFeedDetail 获取内容详情
func (s *MultiPlatformService) GetFeedDetail(ctx context.Context, platformID platform.PlatformID, page *rod.Page, feedID string) (*platform.FeedDetail, error) {
	return s.platformManager.GetFeedDetail(ctx, platformID, page, feedID)
}

// ListPlatforms 列出所有平台
func (s *MultiPlatformService) ListPlatforms() []platform.PlatformID {
	return s.platformManager.ListPlatforms()
}
