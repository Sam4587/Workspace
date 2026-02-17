package platform

import "time"

// ========== 发布相关类型 ==========

// ImageTextRequest 图文发布请求
type ImageTextRequest struct {
	Title      string   `json:"title" binding:"required"`       // 标题（必填）
	Content    string   `json:"content" binding:"required"`     // 内容（必填）
	Images     []string `json:"images" binding:"required,min=1"` // 图片列表（必填，至少1张）
	Tags       []string `json:"tags,omitempty"`                 // 标签列表（可选）
	ScheduleAt string   `json:"schedule_at,omitempty"`          // 定时发布时间 ISO8601（可选）
}

// VideoRequest 视频发布请求
type VideoRequest struct {
	Title       string   `json:"title" binding:"required"`        // 标题（必填）
	Description string   `json:"description" binding:"required"`  // 描述（必填）
	VideoPath   string   `json:"video_path" binding:"required"`   // 视频文件路径（必填）
	CoverPath   string   `json:"cover_path,omitempty"`            // 封面图路径（可选）
	Tags        []string `json:"tags,omitempty"`                  // 标签列表（可选）
	ScheduleAt  string   `json:"schedule_at,omitempty"`           // 定时发布时间（可选）
}

// PublishResponse 发布响应
type PublishResponse struct {
	Success  bool   `json:"success"`              // 是否成功
	FeedID   string `json:"feed_id,omitempty"`    // 内容ID
	FeedURL  string `json:"feed_url,omitempty"`   // 内容URL
	Error    string `json:"error,omitempty"`      // 错误信息
	Message  string `json:"message,omitempty"`    // 提示信息
}

// ========== 内容管理相关类型 ==========

// GetFeedsRequest 获取内容列表请求
type GetFeedsRequest struct {
	Page     int    `json:"page" form:"page"`           // 页码
	PageSize int    `json:"page_size" form:"page_size"` // 每页数量
	Status   string `json:"status" form:"status"`       // 状态筛选
	SortBy   string `json:"sort_by" form:"sort_by"`     // 排序字段
}

// GetFeedsResponse 获取内容列表响应
type GetFeedsResponse struct {
	Total      int          `json:"total"`       // 总数
	Page       int          `json:"page"`        // 当前页
	PageSize   int          `json:"page_size"`   // 每页数量
	Feeds      []FeedItem   `json:"feeds"`       // 内容列表
	TotalPages int          `json:"total_pages"` // 总页数
}

// FeedItem 内容项
type FeedItem struct {
	FeedID       string    `json:"feed_id"`        // 内容ID
	FeedType     string    `json:"feed_type"`      // 内容类型：image_text, video
	Title        string    `json:"title"`          // 标题
	CoverURL     string    `json:"cover_url"`      // 封面URL
	PublishedAt  time.Time `json:"published_at"`   // 发布时间
	ViewCount    int       `json:"view_count"`     // 浏览量
	LikeCount    int       `json:"like_count"`     // 点赞数
	CommentCount int       `json:"comment_count"`  // 评论数
	ShareCount   int       `json:"share_count"`    // 分享数
	CollectCount int       `json:"collect_count"`  // 收藏数
	Status       string    `json:"status"`         // 状态：published, draft, deleted
}

// FeedDetail 内容详情
type FeedDetail struct {
	FeedItem
	Content      string        `json:"content"`       // 正文内容
	Tags         []string      `json:"tags"`          // 标签列表
	Images       []string      `json:"images"`        // 图片列表
	VideoURL     string        `json:"video_url"`     // 视频URL
	PublishTime  time.Time     `json:"publish_time"`  // 发布时间
	UpdateTime   time.Time     `json:"update_time"`   // 更新时间
	Metrics      FeedMetrics   `json:"metrics"`       // 详细数据指标
}

// FeedMetrics 内容指标
type FeedMetrics struct {
	ViewCount    int `json:"view_count"`     // 浏览量
	LikeCount    int `json:"like_count"`     // 点赞数
	CommentCount int `json:"comment_count"`  // 评论数
	ShareCount   int `json:"share_count"`    // 分享数
	CollectCount int `json:"collect_count"`  // 收藏数
	ForwardCount int `json:"forward_count"`  // 转发数
}

// ========== 平台配置类型 ==========

// PlatformConfig 平台配置
type PlatformConfig struct {
	ID             PlatformID     `json:"id"`              // 平台ID
	Name           string         `json:"name"`            // 平台名称
	BaseURL        string         `json:"base_url"`        // 基础URL
	LoginURL       string         `json:"login_url"`       // 登录URL
	PublishURL     string         `json:"publish_url"`     // 发布URL
	UserAgent      string         `json:"user_agent"`      // User-Agent
	Timeout        int            `json:"timeout"`         // 超时时间(秒)
	MaxImages      int            `json:"max_images"`      // 最大图片数
	MaxVideoSize   int64          `json:"max_video_size"`  // 最大视频大小(MB)
	SupportedTypes []string       `json:"supported_types"` // 支持的内容类型
	Features       PlatformFeatures `json:"features"`      // 功能特性
}

// PlatformFeatures 平台功能特性
type PlatformFeatures struct {
	SupportImageText bool `json:"support_image_text"` // 支持图文
	SupportVideo     bool `json:"support_video"`      // 支持视频
	SupportSchedule  bool `json:"support_schedule"`   // 支持定时发布
	SupportTags      bool `json:"support_tags"`       // 支持标签
	SupportComment   bool `json:"support_comment"`    // 支持评论
	SupportLike      bool `json:"support_like"`       // 支持点赞
	SupportCollect   bool `json:"support_collect"`    // 支持收藏
}
