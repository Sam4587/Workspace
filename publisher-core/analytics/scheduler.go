package analytics

import (
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// ScheduledCollector 定时采集器
type ScheduledCollector struct {
	mu         sync.RWMutex
	service    *AnalyticsService
	interval   time.Duration
	ticker     *time.Ticker
	running    bool
	taskQueue  []CollectionTask
	maxWorkers int
}

// CollectionTask 采集任务
type CollectionTask struct {
	ID         string
	Platform   Platform
	Type       string // "post" or "account"
	TargetID   string
	Priority   int
	CreatedAt  time.Time
	LastError  string
	Retries    int
	MaxRetries int
}

// NewScheduledCollector 创建定时采集器
func NewScheduledCollector(service *AnalyticsService, interval time.Duration) *ScheduledCollector {
	return &ScheduledCollector{
		service:    service,
		interval:   interval,
		taskQueue:  make([]CollectionTask, 0),
		maxWorkers: 3,
	}
}

// Start 启动定时采集
func (sc *ScheduledCollector) Start(ctx context.Context) error {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	if sc.running {
		return nil
	}

	sc.running = true
	sc.ticker = time.NewTicker(sc.interval)

	go sc.run(ctx)

	logrus.Info("Scheduled collector started")
	return nil
}

// Stop 停止定时采集
func (sc *ScheduledCollector) Stop() {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	if !sc.running {
		return
	}

	sc.running = false
	if sc.ticker != nil {
		sc.ticker.Stop()
	}

	logrus.Info("Scheduled collector stopped")
}

// run 运行采集循环
func (sc *ScheduledCollector) run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			sc.Stop()
			return
		case <-sc.ticker.C:
			sc.executeTasks(ctx)
		}
	}
}

// executeTasks 执行采集任务
func (sc *ScheduledCollector) executeTasks(ctx context.Context) {
	sc.mu.RLock()
	tasks := make([]CollectionTask, len(sc.taskQueue))
	copy(tasks, sc.taskQueue)
	sc.mu.RUnlock()

	if len(tasks) == 0 {
		logrus.Debug("No collection tasks to execute")
		return
	}

	logrus.Infof("Executing %d collection tasks", len(tasks))

	// 使用工作池并发执行
	taskChan := make(chan CollectionTask, len(tasks))
	resultChan := make(chan error, len(tasks))

	// 启动工作goroutine
	for i := 0; i < sc.maxWorkers; i++ {
		go sc.worker(ctx, taskChan, resultChan)
	}

	// 发送任务
	for _, task := range tasks {
		taskChan <- task
	}
	close(taskChan)

	// 等待结果
	for i := 0; i < len(tasks); i++ {
		if err := <-resultChan; err != nil {
			logrus.Warnf("Task execution failed: %v", err)
		}
	}
}

// worker 工作goroutine
func (sc *ScheduledCollector) worker(ctx context.Context, tasks <-chan CollectionTask, results chan<- error) {
	for task := range tasks {
		var err error

		switch task.Type {
		case "post":
			_, err = sc.service.CollectPostMetrics(ctx, task.Platform, task.TargetID)
		case "account":
			_, err = sc.service.CollectAccountMetrics(ctx, task.Platform, task.TargetID)
		default:
			err = fmt.Errorf("unknown task type: %s", task.Type)
		}

		if err != nil {
			task.LastError = err.Error()
			task.Retries++
			if task.Retries < task.MaxRetries {
				// 重新加入队列
				sc.mu.Lock()
				sc.taskQueue = append(sc.taskQueue, task)
				sc.mu.Unlock()
			}
		}

		results <- err
	}
}

// AddTask 添加采集任务
func (sc *ScheduledCollector) AddTask(task CollectionTask) {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	if task.ID == "" {
		task.ID = uuid.New().String()
	}
	task.CreatedAt = time.Now()
	if task.MaxRetries == 0 {
		task.MaxRetries = 3
	}

	sc.taskQueue = append(sc.taskQueue, task)
	logrus.Infof("Collection task added: %s - %s", task.Platform, task.Type)
}

// RemoveTask 移除采集任务
func (sc *ScheduledCollector) RemoveTask(taskID string) {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	for i, task := range sc.taskQueue {
		if task.ID == taskID {
			sc.taskQueue = append(sc.taskQueue[:i], sc.taskQueue[i+1:]...)
			break
		}
	}
}

// GetQueueLength 获取队列长度
func (sc *ScheduledCollector) GetQueueLength() int {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	return len(sc.taskQueue)
}

// IsRunning 检查是否运行中
func (sc *ScheduledCollector) IsRunning() bool {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	return sc.running
}
