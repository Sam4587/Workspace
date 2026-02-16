package ai

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ContentHistory 内容历史记录
type ContentHistory struct {
	ID           string                 `json:"id"`
	Platform     string                 `json:"platform"`
	Type         string                 `json:"type"` // generated, rewritten, transcribed
	Title        string                 `json:"title"`
	Content      string                 `json:"content"`
	OriginalText string                 `json:"original_text,omitempty"`
	Prompt       string                 `json:"prompt,omitempty"`
	Template     string                 `json:"template,omitempty"`
	Provider     string                 `json:"provider"`
	Model        string                 `json:"model"`
	Tokens       TokenUsage             `json:"tokens"`
	Rating       int                    `json:"rating"` // 1-5星
	Tags         []string               `json:"tags"`
	Metadata     map[string]interface{} `json:"metadata"`
	CreatedAt    time.Time              `json:"created_at"`
	PublishedAt  *time.Time             `json:"published_at,omitempty"`
}

// TokenUsage Token使用量
type TokenUsage struct {
	Input  int `json:"input"`
	Output int `json:"output"`
	Total  int `json:"total"`
}

// HistoryManager 历史管理器
type HistoryManager struct {
	mu      sync.RWMutex
	storage HistoryStorage
}

// HistoryStorage 历史存储接口
type HistoryStorage interface {
	Save(history *ContentHistory) error
	Load(id string) (*ContentHistory, error)
	List(filter HistoryFilter) ([]*ContentHistory, error)
	Delete(id string) error
	GetStats(platform string, days int) (*HistoryStats, error)
}

// HistoryFilter 历史过滤器
type HistoryFilter struct {
	Platform string
	Type     string
	StartDate *time.Time
	EndDate   *time.Time
	Limit    int
	Offset   int
}

// HistoryStats 历史统计
type HistoryStats struct {
	TotalGenerated   int            `json:"total_generated"`
	TotalPublished   int            `json:"total_published"`
	TotalTokens      TokenUsage     `json:"total_tokens"`
	AvgRating        float64        `json:"avg_rating"`
	PlatformStats    map[string]int `json:"platform_stats"`
	TypeStats        map[string]int `json:"type_stats"`
	TopModels        []ModelUsage   `json:"top_models"`
}

// ModelUsage 模型使用统计
type ModelUsage struct {
	Model     string `json:"model"`
	Count     int    `json:"count"`
	AvgRating int    `json:"avg_rating"`
}

// NewHistoryManager 创建历史管理器
func NewHistoryManager(storage HistoryStorage) *HistoryManager {
	return &HistoryManager{
		storage: storage,
	}
}

// SaveHistory 保存历史记录
func (hm *HistoryManager) SaveHistory(history *ContentHistory) error {
	hm.mu.Lock()
	defer hm.mu.Unlock()

	if history.ID == "" {
		history.ID = uuid.New().String()
	}
	if history.CreatedAt.IsZero() {
		history.CreatedAt = time.Now()
	}

	if hm.storage != nil {
		return hm.storage.Save(history)
	}
	return nil
}

// GetHistory 获取历史记录
func (hm *HistoryManager) GetHistory(id string) (*ContentHistory, error) {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	if hm.storage == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	return hm.storage.Load(id)
}

// ListHistory 列出历史记录
func (hm *HistoryManager) ListHistory(filter HistoryFilter) ([]*ContentHistory, error) {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	if hm.storage == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	return hm.storage.List(filter)
}

// DeleteHistory 删除历史记录
func (hm *HistoryManager) DeleteHistory(id string) error {
	hm.mu.Lock()
	defer hm.mu.Unlock()

	if hm.storage == nil {
		return fmt.Errorf("storage not initialized")
	}
	return hm.storage.Delete(id)
}

// RateHistory 评分历史记录
func (hm *HistoryManager) RateHistory(id string, rating int) error {
	if rating < 1 || rating > 5 {
		return fmt.Errorf("rating must be between 1 and 5")
	}

	history, err := hm.GetHistory(id)
	if err != nil {
		return err
	}

	history.Rating = rating
	return hm.SaveHistory(history)
}

// GetStats 获取统计信息
func (hm *HistoryManager) GetStats(platform string, days int) (*HistoryStats, error) {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	if hm.storage == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	return hm.storage.GetStats(platform, days)
}

// JSONHistoryStorage JSON文件存储实现
type JSONHistoryStorage struct {
	dataDir string
	mu      sync.RWMutex
}

func NewJSONHistoryStorage(dataDir string) (*JSONHistoryStorage, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}
	return &JSONHistoryStorage{dataDir: dataDir}, nil
}

func (s *JSONHistoryStorage) Save(history *ContentHistory) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	dateDir := filepath.Join(s.dataDir, history.CreatedAt.Format("2006-01-02"))
	if err := os.MkdirAll(dateDir, 0755); err != nil {
		return err
	}

	path := filepath.Join(dateDir, history.ID+".json")
	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func (s *JSONHistoryStorage) Load(id string) (*ContentHistory, error) {
	// 需要在所有日期目录中查找
	files, err := filepath.Glob(filepath.Join(s.dataDir, "*", id+".json"))
	if err != nil || len(files) == 0 {
		return nil, fmt.Errorf("history not found: %s", id)
	}

	data, err := os.ReadFile(files[0])
	if err != nil {
		return nil, err
	}

	var history ContentHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, err
	}
	return &history, nil
}

func (s *JSONHistoryStorage) List(filter HistoryFilter) ([]*ContentHistory, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var histories []*ContentHistory

	// 遍历日期目录
	dirs, err := filepath.Glob(filepath.Join(s.dataDir, "*"))
	if err != nil {
		return nil, err
	}

	for _, dir := range dirs {
		files, err := filepath.Glob(filepath.Join(dir, "*.json"))
		if err != nil {
			continue
		}

		for _, file := range files {
			data, err := os.ReadFile(file)
			if err != nil {
				continue
			}

			var h ContentHistory
			if err := json.Unmarshal(data, &h); err != nil {
				continue
			}

			// 应用过滤条件
			if filter.Platform != "" && h.Platform != filter.Platform {
				continue
			}
			if filter.Type != "" && h.Type != filter.Type {
				continue
			}
			if filter.StartDate != nil && h.CreatedAt.Before(*filter.StartDate) {
				continue
			}
			if filter.EndDate != nil && h.CreatedAt.After(*filter.EndDate) {
				continue
			}

			histories = append(histories, &h)
		}
	}

	// 应用分页
	if filter.Offset > 0 && filter.Offset < len(histories) {
		histories = histories[filter.Offset:]
	}
	if filter.Limit > 0 && filter.Limit < len(histories) {
		histories = histories[:filter.Limit]
	}

	return histories, nil
}

func (s *JSONHistoryStorage) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	files, err := filepath.Glob(filepath.Join(s.dataDir, "*", id+".json"))
	if err != nil || len(files) == 0 {
		return fmt.Errorf("history not found: %s", id)
	}

	return os.Remove(files[0])
}

func (s *JSONHistoryStorage) GetStats(platform string, days int) (*HistoryStats, error) {
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)

	filter := HistoryFilter{
		Platform:  platform,
		StartDate: &startDate,
		EndDate:   &endDate,
		Limit:     1000,
	}

	histories, err := s.List(filter)
	if err != nil {
		return nil, err
	}

	stats := &HistoryStats{
		PlatformStats: make(map[string]int),
		TypeStats:     make(map[string]int),
	}

	for _, h := range histories {
		stats.TotalGenerated++
		if h.PublishedAt != nil {
			stats.TotalPublished++
		}
		stats.TotalTokens.Input += h.Tokens.Input
		stats.TotalTokens.Output += h.Tokens.Output
		stats.TotalTokens.Total += h.Tokens.Total
		stats.Rating += h.Rating

		stats.PlatformStats[h.Platform]++
		stats.TypeStats[h.Type]++
	}

	if stats.TotalGenerated > 0 {
		stats.AvgRating = float64(stats.Rating) / float64(stats.TotalGenerated)
	}

	return stats, nil
}
