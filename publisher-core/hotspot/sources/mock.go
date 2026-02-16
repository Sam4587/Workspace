package sources

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/monkeycode/publisher-core/hotspot"
)

type MockSource struct {
	id      string
	name    string
	enabled bool
}

func NewMockSource(id, name string) *MockSource {
	return &MockSource{
		id:      id,
		name:    name,
		enabled: true,
	}
}

func (s *MockSource) ID() string {
	return s.id
}

func (s *MockSource) Name() string {
	return s.name
}

func (s *MockSource) IsEnabled() bool {
	return s.enabled
}

func (s *MockSource) SetEnabled(enabled bool) {
	s.enabled = enabled
}

func (s *MockSource) Fetch(ctx context.Context, maxItems int) ([]hotspot.Topic, error) {
	if !s.enabled {
		return nil, nil
	}

	now := time.Now()
	topics := []hotspot.Topic{
		{
			ID:        uuid.New().String(),
			Title:     "测试热点1: 这是一个模拟的热点话题",
			Category:  hotspot.CategoryTech,
			Heat:      95,
			Trend:     hotspot.TrendHot,
			Source:    s.id,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:        uuid.New().String(),
			Title:     "测试热点2: AI 技术发展趋势分析",
			Category:  hotspot.CategoryTech,
			Heat:      88,
			Trend:     hotspot.TrendUp,
			Source:    s.id,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:        uuid.New().String(),
			Title:     "测试热点3: 科技创新驱动未来",
			Category:  hotspot.CategoryTech,
			Heat:      75,
			Trend:     hotspot.TrendNew,
			Source:    s.id,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	if maxItems > 0 && len(topics) > maxItems {
		topics = topics[:maxItems]
	}

	return topics, nil
}
