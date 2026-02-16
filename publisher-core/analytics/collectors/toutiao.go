package collectors

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/monkeycode/publisher-core/analytics"
	"github.com/sirupsen/logrus"
)

// ToutiaoCollector 今日头条数据采集器
type ToutiaoCollector struct {
	enabled bool
}

// NewToutiaoCollector 创建头条采集器
func NewToutiaoCollector() *ToutiaoCollector {
	return &ToutiaoCollector{
		enabled: true,
	}
}

// Platform 返回平台名称
func (c *ToutiaoCollector) Platform() analytics.Platform {
	return analytics.PlatformToutiao
}

// IsEnabled 检查是否启用
func (c *ToutiaoCollector) IsEnabled() bool {
	return c.enabled
}

// SetEnabled 设置启用状态
func (c *ToutiaoCollector) SetEnabled(enabled bool) {
	c.enabled = enabled
}

// CollectPostMetrics 采集帖子指标
func (c *ToutiaoCollector) CollectPostMetrics(ctx context.Context, postID string) (*analytics.PostMetrics, error) {
	if !c.enabled {
		return nil, fmt.Errorf("collector is disabled")
	}

	logrus.Infof("[Toutiao] Collecting metrics for post: %s", postID)

	// TODO: 实现真实的数据采集逻辑
	// 需要使用浏览器自动化访问头条号后台
	// 当前返回模拟数据用于测试
	
	rand.Seed(time.Now().UnixNano())
	metrics := &analytics.PostMetrics{
		PostID:      postID,
		Platform:    analytics.PlatformToutiao,
		Title:       fmt.Sprintf("头条文章 %s", postID),
		Views:       rand.Int63n(200000),
		Likes:       rand.Int63n(20000),
		Comments:    rand.Int63n(2000),
		Shares:      rand.Int63n(1000),
		Favorites:   rand.Int63n(1500),
		CollectedAt: time.Now(),
		PublishedAt: time.Now().Add(-24 * time.Hour),
	}
	
	metrics.Engagement = analytics.CalculateEngagement(
		metrics.Likes,
		metrics.Comments,
		metrics.Shares,
		metrics.Views,
	)

	logrus.Infof("[Toutiao] Collected metrics: views=%d, likes=%d, engagement=%.2f%%",
		metrics.Views, metrics.Likes, metrics.Engagement)

	return metrics, nil
}

// CollectAccountMetrics 采集账号指标
func (c *ToutiaoCollector) CollectAccountMetrics(ctx context.Context, accountID string) (*analytics.AccountMetrics, error) {
	if !c.enabled {
		return nil, fmt.Errorf("collector is disabled")
	}

	logrus.Infof("[Toutiao] Collecting account metrics: %s", accountID)

	// TODO: 实现真实的数据采集逻辑
	// 当前返回模拟数据
	
	rand.Seed(time.Now().UnixNano())
	metrics := &analytics.AccountMetrics{
		AccountID:   accountID,
		Platform:    analytics.PlatformToutiao,
		Username:    fmt.Sprintf("头条用户%s", accountID),
		Followers:   rand.Int63n(2000000),
		Following:   rand.Int63n(2000),
		Posts:       rand.Int63n(1000),
		Likes:       rand.Int63n(20000000),
		CollectedAt: time.Now(),
	}

	logrus.Infof("[Toutiao] Collected account: followers=%d, posts=%d",
		metrics.Followers, metrics.Posts)

	return metrics, nil
}
