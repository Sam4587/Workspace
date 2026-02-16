package task

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// TaskEvent 任务事件
type TaskEvent struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	Type      string    `json:"type"`      // created, started, progress, completed, failed, cancelled
	Message   string    `json:"message"`
	Progress  int       `json:"progress"`  // 0-100
	Timestamp time.Time `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// TaskTracker 任务跟踪器
type TaskTracker struct {
	mu       sync.RWMutex
	storage  EventStorage
	notifyCh chan TaskEvent
	watchers map[string][]TaskWatcher
}

// TaskWatcher 任务监听器
type TaskWatcher func(event TaskEvent)

// EventStorage 事件存储接口
type EventStorage interface {
	SaveEvent(event *TaskEvent) error
	ListEvents(taskID string, limit int) ([]*TaskEvent, error)
}

// NewTaskTracker 创建任务跟踪器
func NewTaskTracker(storage EventStorage) *TaskTracker {
	return &TaskTracker{
		storage:  storage,
		notifyCh: make(chan TaskEvent, 1000),
		watchers: make(map[string][]TaskWatcher),
	}
}

// RecordEvent 记录事件
func (t *TaskTracker) RecordEvent(event *TaskEvent) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if event.ID == "" {
		event.ID = uuid.New().String()
	}
	event.Timestamp = time.Now()

	// 保存事件
	if t.storage != nil {
		if err := t.storage.SaveEvent(event); err != nil {
			logrus.Warnf("Failed to save task event: %v", err)
		}
	}

	// 发送通知
	select {
	case t.notifyCh <- *event:
	default:
		logrus.Warn("Task event channel full, dropping event")
	}

	// 调用监听器
	if watchers, ok := t.watchers[event.TaskID]; ok {
		for _, watcher := range watchers {
			go watcher(*event)
		}
	}

	return nil
}

// WatchTask 监听任务事件
func (t *TaskTracker) WatchTask(taskID string, watcher TaskWatcher) {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.watchers[taskID] = append(t.watchers[taskID], watcher)
}

// GetTaskHistory 获取任务历史
func (t *TaskTracker) GetTaskHistory(taskID string, limit int) ([]*TaskEvent, error) {
	if t.storage == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	return t.storage.ListEvents(taskID, limit)
}

// Notify 返回事件通道
func (t *TaskTracker) Notify() <-chan TaskEvent {
	return t.notifyCh
}

// JSONEventStorage JSON文件事件存储
type JSONEventStorage struct {
	dataDir string
	mu      sync.RWMutex
}

func NewJSONEventStorage(dataDir string) (*JSONEventStorage, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}
	return &JSONEventStorage{dataDir: dataDir}, nil
}

func (s *JSONEventStorage) SaveEvent(event *TaskEvent) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	dateDir := filepath.Join(s.dataDir, event.Timestamp.Format("2006-01-02"))
	if err := os.MkdirAll(dateDir, 0755); err != nil {
		return err
	}

	filename := fmt.Sprintf("%s_%s.json", event.TaskID, event.ID)
	path := filepath.Join(dateDir, filename)

	data, err := json.MarshalIndent(event, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

func (s *JSONEventStorage) ListEvents(taskID string, limit int) ([]*TaskEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var events []*TaskEvent

	// 查找所有日期目录
	dirs, err := filepath.Glob(filepath.Join(s.dataDir, "*"))
	if err != nil {
		return nil, err
	}

	// 遍历目录查找事件
	for _, dir := range dirs {
		files, err := filepath.Glob(filepath.Join(dir, taskID+"_*.json"))
		if err != nil {
			continue
		}

		for _, file := range files {
			data, err := os.ReadFile(file)
			if err != nil {
				continue
			}

			var event TaskEvent
			if err := json.Unmarshal(data, &event); err != nil {
				continue
			}

			events = append(events, &event)
		}
	}

	// 按时间排序（最新的在前）
	sortEventsByTime(events)

	// 应用限制
	if limit > 0 && len(events) > limit {
		events = events[:limit]
	}

	return events, nil
}

// TaskProgressReporter 任务进度报告器
type TaskProgressReporter struct {
	tracker *TaskTracker
	taskID  string
}

// NewTaskProgressReporter 创建进度报告器
func NewTaskProgressReporter(tracker *TaskTracker, taskID string) *TaskProgressReporter {
	return &TaskProgressReporter{
		tracker: tracker,
		taskID:  taskID,
	}
}

// ReportProgress 报告进度
func (r *TaskProgressReporter) ReportProgress(progress int, message string, metadata map[string]interface{}) error {
	event := &TaskEvent{
		TaskID:   r.taskID,
		Type:     "progress",
		Message:  message,
		Progress: progress,
		Metadata: metadata,
	}
	return r.tracker.RecordEvent(event)
}

// ReportStart 报告开始
func (r *TaskProgressReporter) ReportStart(message string) error {
	event := &TaskEvent{
		TaskID:  r.taskID,
		Type:    "started",
		Message: message,
	}
	return r.tracker.RecordEvent(event)
}

// ReportComplete 报告完成
func (r *TaskProgressReporter) ReportComplete(message string, metadata map[string]interface{}) error {
	event := &TaskEvent{
		TaskID:   r.taskID,
		Type:     "completed",
		Message:  message,
		Progress: 100,
		Metadata: metadata,
	}
	return r.tracker.RecordEvent(event)
}

// ReportError 报告错误
func (r *TaskProgressReporter) ReportError(message string, err error) error {
	event := &TaskEvent{
		TaskID:  r.taskID,
		Type:    "failed",
		Message: message,
		Metadata: map[string]interface{}{
			"error": err.Error(),
		},
	}
	return r.tracker.RecordEvent(event)
}

// sortEventsByTime 按时间排序事件
func sortEventsByTime(events []*TaskEvent) {
	// 简单的冒泡排序（实际项目可使用 sort.Slice）
	for i := 0; i < len(events)-1; i++ {
		for j := 0; j < len(events)-i-1; j++ {
			if events[j].Timestamp.Before(events[j+1].Timestamp) {
				events[j], events[j+1] = events[j+1], events[j]
			}
		}
	}
}
