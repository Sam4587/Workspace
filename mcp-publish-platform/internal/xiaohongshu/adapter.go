package xiaohongshu

import (
	"context"
	"fmt"
	"time"
	
	"github.com/go-rod/rod"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
	"github.com/xpzouying/xiaohongshu-mcp/xiaohongshu"
)

// XiaohongshuAdapter 小红书平台适配器
type XiaohongshuAdapter struct {
	config *platform.PlatformConfig
}

// NewXiaohongshuAdapter 创建小红书适配器
func NewXiaohongshuAdapter() *XiaohongshuAdapter {
	return &XiaohongshuAdapter{
		config: &platform.PlatformConfig{
			ID:           platform.PlatformXiaohongshu,
			Name:         "小红书",
			BaseURL:      "https://www.xiaohongshu.com",
			LoginURL:     "https://www.xiaohongshu.com",
			PublishURL:   "https://creator.xiaohongshu.com/publish/publish",
			UserAgent:    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			Timeout:      60,
			MaxImages:    18,
			MaxVideoSize: 1024,
			SupportedTypes: []string{"image_text", "video"},
			Features: platform.PlatformFeatures{
				SupportImageText: true,
				SupportVideo:     true,
				SupportSchedule:  true,
				SupportTags:      true,
				SupportComment:   true,
				SupportLike:      true,
				SupportCollect:   true,
			},
		},
	}
}

// ID 返回平台ID
func (x *XiaohongshuAdapter) ID() platform.PlatformID {
	return platform.PlatformXiaohongshu
}

// Name 返回平台名称
func (x *XiaohongshuAdapter) Name() string {
	return "小红书"
}

// BaseURL 返回基础URL
func (x *XiaohongshuAdapter) BaseURL() string {
	return "https://www.xiaohongshu.com"
}

// Login 执行登录
func (x *XiaohongshuAdapter) Login(ctx context.Context, page *rod.Page) error {
	return xiaohongshu.Login(page)
}

// CheckLogin 检查登录状态
func (x *XiaohongshuAdapter) CheckLogin(ctx context.Context, page *rod.Page) (bool, error) {
	return true, nil
}

// Logout 退出登录
func (x *XiaohongshuAdapter) Logout(ctx context.Context, page *rod.Page) error {
	return nil
}

// PublishImageText 发布图文
func (x *XiaohongshuAdapter) PublishImageText(ctx context.Context, page *rod.Page, req *platform.ImageTextRequest) (*platform.PublishResponse, error) {
	xhsReq := xiaohongshu.PublishRequest{
		Title:      req.Title,
		Content:    req.Content,
		Images:     req.Images,
		Tags:       req.Tags,
		ScheduleAt: req.ScheduleAt,
	}
	
	err := xiaohongshu.Publish(page, xhsReq)
	if err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}
	
	return &platform.PublishResponse{
		Success: true,
		Message: "发布成功",
	}, nil
}

// PublishVideo 发布视频
func (x *XiaohongshuAdapter) PublishVideo(ctx context.Context, page *rod.Page, req *platform.VideoRequest) (*platform.PublishResponse, error) {
	xhsReq := xiaohongshu.PublishVideoRequest{
		Title:       req.Title,
		Description: req.Description,
		VideoPath:   req.VideoPath,
		CoverPath:   req.CoverPath,
	}
	
	err := xiaohongshu.PublishVideo(page, xhsReq)
	if err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}
	
	return &platform.PublishResponse{
		Success: true,
		Message: "视频发布成功",
	}, nil
}

// GetFeeds 获取内容列表
func (x *XiaohongshuAdapter) GetFeeds(ctx context.Context, page *rod.Page, req *platform.GetFeedsRequest) (*platform.GetFeedsResponse, error) {
	return &platform.GetFeedsResponse{
		Total:    0,
		Page:     req.Page,
		PageSize: req.PageSize,
		Feeds:    []platform.FeedItem{},
	}, nil
}

// GetFeedDetail 获取内容详情
func (x *XiaohongshuAdapter) GetFeedDetail(ctx context.Context, page *rod.Page, feedID string) (*platform.FeedDetail, error) {
	return nil, fmt.Errorf("功能开发中")
}

// Like 点赞
func (x *XiaohongshuAdapter) Like(ctx context.Context, page *rod.Page, feedID string) error {
	return fmt.Errorf("功能开发中")
}

// Comment 评论
func (x *XiaohongshuAdapter) Comment(ctx context.Context, page *rod.Page, feedID string, content string) error {
	return fmt.Errorf("功能开发中")
}

// Collect 收藏
func (x *XiaohongshuAdapter) Collect(ctx context.Context, page *rod.Page, feedID string) error {
	return fmt.Errorf("功能开发中")
}

// GetPlatformConfig 获取平台配置
func (x *XiaohongshuAdapter) GetPlatformConfig() *platform.PlatformConfig {
	return x.config
}
