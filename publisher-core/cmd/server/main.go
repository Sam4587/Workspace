// Package main 提供统一的发布服务入口
package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/monkeycode/publisher-core/adapters"
	"github.com/monkeycode/publisher-core/analytics"
	"github.com/monkeycode/publisher-core/api"
	"github.com/monkeycode/publisher-core/hotspot"
	"github.com/monkeycode/publisher-core/hotspot/sources"
	"github.com/monkeycode/publisher-core/storage"
	"github.com/monkeycode/publisher-core/task"
	"github.com/monkeycode/publisher-core/task/handlers"
	"github.com/sirupsen/logrus"
)

var (
	port       int
	headless   bool
	cookieDir  string
	storageDir string
	dataDir    string
	baseURL    string
	debug      bool
)

func init() {
	flag.IntVar(&port, "port", 8080, "API服务端口")
	flag.BoolVar(&headless, "headless", true, "浏览器无头模式")
	flag.StringVar(&cookieDir, "cookie-dir", "./cookies", "Cookie存储目录")
	flag.StringVar(&storageDir, "storage-dir", "./uploads", "文件存储目录")
	flag.StringVar(&dataDir, "data-dir", "./data", "数据存储目录")
	flag.StringVar(&baseURL, "base-url", "", "文件访问基础URL")
	flag.BoolVar(&debug, "debug", false, "调试模式")
}

func main() {
	flag.Parse()

	// 配置日志
	setupLogger()

	// 创建存储
	store, err := storage.NewLocalStorage(storageDir, baseURL)
	if err != nil {
		logrus.Fatalf("创建存储失败: %v", err)
	}

	// 创建任务管理器
	taskMgr := task.NewTaskManager(task.NewMemoryStorage())

	// 创建发布器工厂
	factory := adapters.DefaultFactory()

	// 注册任务处理器
	publishHandler := handlers.NewPublishHandler(factory)
	taskMgr.RegisterHandler("publish", publishHandler.Handle)

	// 创建API服务器
	server := api.NewServer()
	server.WithMiddleware(api.LoggingMiddleware)
	server.WithMiddleware(api.CORSMiddleware)

	// 创建服务实现
	publisherService := &PublisherService{
		factory: factory,
		taskMgr: taskMgr,
	}
	storageService := &StorageService{
		storage: store,
	}
	taskService := &TaskService{
		taskMgr: taskMgr,
	}

	server.WithPublisher(publisherService)
	server.WithStorage(storageService)
	server.WithTaskManager(taskService)

	// 创建热点服务
	hotspotStorage, err := hotspot.NewJSONStorage(dataDir)
	if err != nil {
		logrus.Fatalf("创建热点存储失败: %v", err)
	}
	hotspotService := hotspot.NewService(hotspotStorage)

	// 注册真实数据源
	for _, src := range sources.CreateAllSources() {
		hotspotService.RegisterSource(src)
	}

	// 注册模拟数据源 (用于测试)
	hotspotService.RegisterSource(sources.NewMockSource("mock", "测试数据源"))

	// 注册热点 API 路由
	hotspotAPI := hotspot.NewAPIHandler(hotspotService)
	hotspotAPI.RegisterRoutes(server.Router())

	// 创建分析服务
	analyticsStorage, err := analytics.NewJSONStorage(dataDir + "/analytics")
	if err != nil {
		logrus.Warnf("创建分析存储失败: %v", err)
	}
	analyticsService := analytics.NewService(analyticsStorage)

	// 注册分析 API 路由
	analyticsAPI := analytics.NewAPIHandler(analyticsService)
	analyticsAPI.RegisterRoutes(server.Router())

	// 启动服务器
	go func() {
		addr := fmt.Sprintf(":%d", port)
		if err := server.Start(addr); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("启动服务器失败: %v", err)
		}
	}()

	logrus.Info("发布服务已启动")
	logrus.Infof("API地址: http://localhost:%d", port)
	logrus.Infof("支持平台: %v", factory.SupportedPlatforms())
	logrus.Info("热点服务已启用")

	// 等待退出信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("正在关闭服务...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(); err != nil {
		logrus.Errorf("关闭服务器失败: %v", err)
	}

	select {
	case <-ctx.Done():
		logrus.Warn("服务关闭超时")
	default:
		logrus.Info("服务已关闭")
	}
}

func setupLogger() {
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	if debug {
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		logrus.SetLevel(logrus.InfoLevel)
	}
}

// PublisherService 发布器服务实现
type PublisherService struct {
	factory *adapters.PublisherFactory
	taskMgr *task.TaskManager
}

func (s *PublisherService) GetPlatforms() []string {
	return s.factory.SupportedPlatforms()
}

func (s *PublisherService) GetPlatformInfo(platform string) (interface{}, error) {
	pub, err := s.factory.Create(platform)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"platform": pub.Platform(),
		"message":  fmt.Sprintf("平台 %s 已就绪", platform),
	}, nil
}

func (s *PublisherService) Login(platform string) (interface{}, error) {
	pub, err := s.factory.Create(platform)
	if err != nil {
		return nil, err
	}

	result, err := pub.Login(context.Background())
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *PublisherService) CheckLogin(platform string) (interface{}, error) {
	pub, err := s.factory.Create(platform)
	if err != nil {
		return nil, err
	}

	loggedIn, err := pub.CheckLoginStatus(context.Background())
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"platform":  platform,
		"logged_in": loggedIn,
	}, nil
}

// StorageService 存储服务实现
type StorageService struct {
	storage storage.Storage
}

func (s *StorageService) Upload(file []byte, path string) (string, error) {
	if err := s.storage.Write(context.Background(), path, file); err != nil {
		return "", err
	}
	return s.storage.GetURL(context.Background(), path)
}

func (s *StorageService) Download(path string) ([]byte, error) {
	return s.storage.Read(context.Background(), path)
}

func (s *StorageService) List(prefix string) ([]string, error) {
	return s.storage.List(context.Background(), prefix)
}

func (s *StorageService) Delete(path string) error {
	return s.storage.Delete(context.Background(), path)
}

// TaskService 任务服务实现
type TaskService struct {
	taskMgr *task.TaskManager
}

func (s *TaskService) CreateTask(taskType string, platform string, payload map[string]interface{}) (interface{}, error) {
	t, err := s.taskMgr.CreateTask(taskType, platform, payload)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"id":         t.ID,
		"type":       t.Type,
		"status":     t.Status,
		"platform":   t.Platform,
		"payload":    t.Payload,
		"progress":   t.Progress,
		"created_at": t.CreatedAt,
	}, nil
}

func (s *TaskService) GetTask(taskID string) (interface{}, error) {
	return s.taskMgr.GetTask(taskID)
}

func (s *TaskService) ListTasks(status string, platform string, limit int) (interface{}, error) {
	filter := task.TaskFilter{
		Status:   task.TaskStatus(status),
		Platform: platform,
		Limit:    limit,
	}
	return s.taskMgr.ListTasks(filter)
}

func (s *TaskService) CancelTask(taskID string) error {
	return s.taskMgr.Cancel(taskID)
}
