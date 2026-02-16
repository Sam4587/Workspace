package collectors

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/monkeycode/publisher-core/analytics"
	"github.com/sirupsen/logrus"
)

// DouyinCollector 抖音数据采集器
type DouyinCollector struct {
	enabled bool
}

// NewDouyinCollector 创建抖音采集器
func NewDouyinCollector() *DouyinCollector {
	return &DouyinCollector{
		enabled: true,
	}
}

// Platform 返回平台名称
func (c *DouyinCollector) Platform() analytics.Platform {
	return analytics.PlatformDouyin
}

// IsEnabled 检查是否启用
func (c *DouyinCollector) IsEnabled() bool {
	return c.enabled
}

// SetEnabled 设置启用状态
func (c *DouyinCollector) SetEnabled(enabled bool) {
	c.enabled = enabled
}

// CollectPostMetrics 采集帖子指标
func (c *DouyinCollector) CollectPostMetrics(ctx context.Context, postID string) (*analytics.PostMetrics, error) {
	if !c.enabled {
		return nil, fmt.Errorf("collector is disabled")
	}

	logrus.Infof("[Douyin] Collecting metrics for post: %s", postID)

	// TODO: 实现真实的数据采集逻辑
	// 需要使用浏览器自动化访问抖音创作者中心
	// 当前返回模拟数据用于测试
	
	rand.Seed(time.Now().UnixNano())
	metrics := &analytics.PostMetrics{
		PostID:      postID,
		Platform:    analytics.PlatformDouyin,
		Title:       fmt.Sprintf("抖音视频 %s", postID),
		Views:       rand.Int63n(100000),
		Likes:       rand.Int63n(10000),
		Comments:    rand.Int63n(1000),
		Shares:      rand.Int63n(500),
		Favorites:   rand.Int63n(800),
		CollectedAt: time.Now(),
		PublishedAt: time.Now().Add(-24 * time.Hour),
	}
	
	metrics.Engagement = analytics.CalculateEngagement(
		metrics.Likes,
		metrics.Comments,
		metrics.Shares,
		metrics.Views,
	)

	logrus.Infof("[Douyin] Collected metrics: views=%d, likes=%d, engagement=%.2f%%",
		metrics.Views, metrics.Likes, metrics.Engagement)

	return metrics, nil
}

// CollectAccountMetrics 采集账号指标
func (c *DouyinCollector) CollectAccountMetrics(ctx context.Context, accountID string) (*analytics.AccountMetrics, error) {
	if !c.enabled {
		return nil, fmt.Errorf("collector is disabled")
	}

	logrus.Infof("[Douyin] Collecting account metrics: %s", accountID)

	// TODO: 实现真实的数据采集逻辑
	// 当前返回模拟数据
	
	rand.Seed(time.Now().UnixNano())
	metrics := &analytics.AccountMetrics{
		AccountID:   accountID,
		Platform:    analytics.PlatformDouyin,
		Username:    fmt.Sprintf("抖音用户%s", accountID),
		Followers:   rand.Int63n(1000000),
		Following:   rand.Int63n(1000),
		Posts:       rand.Int63n(500),
		Likes:       rand.Int63n(10000000),
		CollectedAt: time.Now(),
	}

	logrus.Infof("[Douyin] Collected account: followers=%d, posts=%d",
		metrics.Followers, metrics.Posts)

	return metrics, nil
}
