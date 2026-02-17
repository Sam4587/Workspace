package platform

import (
	"context"
	"github.com/go-rod/rod"
)

// Platform 平台抽象接口
// 定义所有平台必须实现的核心方法
type Platform interface {
	// ========== 平台基本信息 ==========
	
	// ID 返回平台唯一标识
	ID() PlatformID
	
	// Name 返回平台名称
	Name() string
	
	// BaseURL 返回平台基础URL
	BaseURL() string
	
	// ========== 登录认证 ==========
	
	// Login 执行登录流程
	Login(ctx context.Context, page *rod.Page) error
	
	// CheckLogin 检查登录状态
	CheckLogin(ctx context.Context, page *rod.Page) (bool, error)
	
	// Logout 退出登录
	Logout(ctx context.Context, page *rod.Page) error
	
	// ========== 内容发布 ==========
	
	// PublishImageText 发布图文内容
	PublishImageText(ctx context.Context, page *rod.Page, req *ImageTextRequest) (*PublishResponse, error)
	
	// PublishVideo 发布视频内容
	PublishVideo(ctx context.Context, page *rod.Page, req *VideoRequest) (*PublishResponse, error)
	
	// ========== 内容管理 ==========
	
	// GetFeeds 获取内容列表
	GetFeeds(ctx context.Context, page *rod.Page, req *GetFeedsRequest) (*GetFeedsResponse, error)
	
	// GetFeedDetail 获取内容详情
	GetFeedDetail(ctx context.Context, page *rod.Page, feedID string) (*FeedDetail, error)
	
	// ========== 互动功能 ==========
	
	// Like 点赞
	Like(ctx context.Context, page *rod.Page, feedID string) error
	
	// Comment 评论
	Comment(ctx context.Context, page *rod.Page, feedID string, content string) error
	
	// Collect 收藏
	Collect(ctx context.Context, page *rod.Page, feedID string) error
	
	// ========== 平台配置 ==========
	
	// GetPlatformConfig 获取平台配置
	GetPlatformConfig() *PlatformConfig
}

// PlatformID 平台标识类型
type PlatformID string

const (
	// PlatformXiaohongshu 小红书
	PlatformXiaohongshu PlatformID = "xiaohongshu"
	// PlatformDouyin 抖音
	PlatformDouyin PlatformID = "douyin"
	// PlatformToutiao 今日头条
	PlatformToutiao PlatformID = "toutiao"
)
