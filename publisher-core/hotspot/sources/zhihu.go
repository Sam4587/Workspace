package sources

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/monkeycode/publisher-core/hotspot"
	"github.com/sirupsen/logrus"
)

// ZhihuSource 知乎热榜数据源
type ZhihuSource struct {
	name        string
	displayName string
	enabled     bool
	client      *http.Client
}

// NewZhihuSource 创建知乎数据源
func NewZhihuSource() *ZhihuSource {
	return &ZhihuSource{
		name:        "zhihu",
		displayName: "知乎热榜",
		enabled:     true,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Name 返回数据源名称
func (s *ZhihuSource) Name() string {
	return s.name
}

// DisplayName 返回显示名称
func (s *ZhihuSource) DisplayName() string {
	return s.displayName
}

// IsEnabled 检查是否启用
func (s *ZhihuSource) IsEnabled() bool {
	return s.enabled
}

// SetEnabled 设置启用状态
func (s *ZhihuSource) SetEnabled(enabled bool) {
	s.enabled = enabled
}

// Fetch 抓取数据
func (s *ZhihuSource) Fetch(ctx context.Context, maxItems int) ([]hotspot.Topic, error) {
	if !s.enabled {
		return nil, fmt.Errorf("source is disabled")
	}

	logrus.Infof("[Zhihu] Fetching hot topics, maxItems=%d", maxItems)

	// TODO: 实现真实的知乎热榜抓取
	// 可以使用知乎官方API或网页抓取
	
	topics := s.generateMockTopics(maxItems)
	
	logrus.Infof("[Zhihu] Fetched %d topics", len(topics))
	return topics, nil
}

// generateMockTopics 生成模拟数据
func (s *ZhihuSource) generateMockTopics(count int) []hotspot.Topic {
	var topics []hotspot.Topic
	
	mockData := []struct {
		title string
		heat  int
		url   string
	}{
		{"知乎热榜更新", 999999, "https://www.zhihu.com/hot"},
		{"技术讨论话题", 888888, "https://www.zhihu.com/question/tech"},
		{"职场经验分享", 777777, "https://www.zhihu.com/question/career"},
		{"生活经验问答", 666666, "https://www.zhihu.com/question/life"},
		{"学术研究讨论", 555555, "https://www.zhihu.com/question/academic"},
	}

	for i := 0; i < count && i < len(mockData); i++ {
		topics = append(topics, hotspot.Topic{
			ID:          fmt.Sprintf("zhihu_%d", time.Now().UnixNano()+int64(i)),
			Title:       mockData[i].title,
			Description: fmt.Sprintf("知乎热榜话题：%s", mockData[i].title),
			Category:    hotspot.CategoryTech,
			Heat:        mockData[i].heat,
			Trend:       "up",
			Source:      "zhihu",
			SourceURL:   mockData[i].url,
			Keywords:    []string{"知乎", "热榜", "问答"},
			PublishedAt: time.Now(),
			CreatedAt:   time.Now(),
		})
	}

	return topics
}
