package xiaohongshu

import (
	"context"
	"fmt"

	"github.com/go-rod/rod"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
	xhs "github.com/xpzouying/xiaohongshu-mcp/xiaohongshu"
)

type XiaohongshuAdapter struct {
	config *platform.PlatformConfig
}

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

func (x *XiaohongshuAdapter) ID() platform.PlatformID {
	return platform.PlatformXiaohongshu
}

func (x *XiaohongshuAdapter) Name() string {
	return "小红书"
}

func (x *XiaohongshuAdapter) BaseURL() string {
	return "https://www.xiaohongshu.com"
}

func (x *XiaohongshuAdapter) Login(ctx context.Context, page *rod.Page) error {
	loginAction := xhs.NewLogin(page)
	return loginAction.Login(ctx)
}

func (x *XiaohongshuAdapter) CheckLogin(ctx context.Context, page *rod.Page) (bool, error) {
	loginAction := xhs.NewLogin(page)
	return loginAction.CheckLoginStatus(ctx)
}

func (x *XiaohongshuAdapter) Logout(ctx context.Context, page *rod.Page) error {
	return nil
}

func (x *XiaohongshuAdapter) PublishImageText(ctx context.Context, page *rod.Page, req *platform.ImageTextRequest) (*platform.PublishResponse, error) {
	publishAction, err := xhs.NewPublishImageAction(page)
	if err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}

	content := xhs.PublishImageContent{
		Title:      req.Title,
		Content:    req.Content,
		ImagePaths: req.Images,
		Tags:       req.Tags,
	}

	if req.ScheduleAt != "" {
		// TODO: parse schedule time
	}

	if err := publishAction.Publish(ctx, content); err != nil {
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

func (x *XiaohongshuAdapter) PublishVideo(ctx context.Context, page *rod.Page, req *platform.VideoRequest) (*platform.PublishResponse, error) {
	publishAction, err := xhs.NewPublishVideoAction(page)
	if err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}

	content := xhs.PublishVideoContent{
		Title:     req.Title,
		Content:   req.Description,
		VideoPath: req.VideoPath,
		Tags:      req.Tags,
	}

	if err := publishAction.PublishVideo(ctx, content); err != nil {
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

func (x *XiaohongshuAdapter) GetFeeds(ctx context.Context, page *rod.Page, req *platform.GetFeedsRequest) (*platform.GetFeedsResponse, error) {
	return &platform.GetFeedsResponse{
		Total:    0,
		Page:     req.Page,
		PageSize: req.PageSize,
		Feeds:    []platform.FeedItem{},
	}, nil
}

func (x *XiaohongshuAdapter) GetFeedDetail(ctx context.Context, page *rod.Page, feedID string) (*platform.FeedDetail, error) {
	return nil, fmt.Errorf("功能开发中")
}

func (x *XiaohongshuAdapter) Like(ctx context.Context, page *rod.Page, feedID string) error {
	return fmt.Errorf("功能开发中")
}

func (x *XiaohongshuAdapter) Comment(ctx context.Context, page *rod.Page, feedID string, content string) error {
	return fmt.Errorf("功能开发中")
}

func (x *XiaohongshuAdapter) Collect(ctx context.Context, page *rod.Page, feedID string) error {
	return fmt.Errorf("功能开发中")
}

func (x *XiaohongshuAdapter) GetPlatformConfig() *platform.PlatformConfig {
	return x.config
}
