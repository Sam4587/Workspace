package sources

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/monkeycode/publisher-core/hotspot"
	"github.com/sirupsen/logrus"
)

// BaiduSource 百度热搜数据源
type BaiduSource struct {
	name        string
	displayName string
	enabled     bool
	client      *http.Client
}

// NewBaiduSource 创建百度数据源
func NewBaiduSource() *BaiduSource {
	return &BaiduSource{
		name:        "baidu",
		displayName: "百度热搜",
		enabled:     true,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Name 返回数据源名称
func (s *BaiduSource) Name() string {
	return s.name
}

// DisplayName 返回显示名称
func (s *BaiduSource) DisplayName() string {
	return s.displayName
}

// IsEnabled 检查是否启用
func (s *BaiduSource) IsEnabled() bool {
	return s.enabled
}

// SetEnabled 设置启用状态
func (s *BaiduSource) SetEnabled(enabled bool) {
	s.enabled = enabled
}

// Fetch 抓取数据
func (s *BaiduSource) Fetch(ctx context.Context, maxItems int) ([]hotspot.Topic, error) {
	if !s.enabled {
		return nil, fmt.Errorf("source is disabled")
	}

	logrus.Infof("[Baidu] Fetching hot topics, maxItems=%d", maxItems)

	// TODO: 实现真实的百度热搜抓取
	// 可以使用百度API或网页抓取
	
	topics := s.generateMockTopics(maxItems)
	
	logrus.Infof("[Baidu] Fetched %d topics", len(topics))
	return topics, nil
}

// generateMockTopics 生成模拟数据
func (s *BaiduSource) generateMockTopics(count int) []hotspot.Topic {
	var topics []hotspot.Topic
	
	mockData := []struct {
		title string
		heat  int
		url   string
	}{
		{"百度热搜榜", 999999, "https://top.baidu.com/board?tab=realtime"},
		{"科技新闻热点", 888888, "https://top.baidu.com/board?tab=tech"},
		{"娱乐八卦新闻", 777777, "https://top.baidu.com/board?tab=ent"},
		{"社会民生事件", 666666, "https://top.baidu.com/board?tab=soc"},
		{"财经股市动态", 555555, "https://top.baidu.com/board?tab=finance"},
	}

	for i := 0; i < count && i < len(mockData); i++ {
		topics = append(topics, hotspot.Topic{
			ID:          fmt.Sprintf("baidu_%d", time.Now().UnixNano()+int64(i)),
			Title:       mockData[i].title,
			Description: fmt.Sprintf("百度热搜话题：%s", mockData[i].title),
			Category:    hotspot.CategoryNews,
			Heat:        mockData[i].heat,
			Trend:       "up",
			Source:      "baidu",
			SourceURL:   mockData[i].url,
			Keywords:    []string{"百度", "热搜", "热点"},
			PublishedAt: time.Now(),
			CreatedAt:   time.Now(),
		})
	}

	return topics
}
