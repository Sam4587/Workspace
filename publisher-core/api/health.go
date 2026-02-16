package api

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"

	"github.com/sirupsen/logrus"
)

// HealthStatus 健康状态
type HealthStatus struct {
	Status      string            `json:"status"` // healthy, unhealthy, degraded
	Timestamp   time.Time         `json:"timestamp"`
	Version     string            `json:"version"`
	Uptime      int64             `json:"uptime_seconds"`
	Services    map[string]ServiceHealth `json:"services"`
	System      SystemHealth      `json:"system"`
}

// ServiceHealth 服务健康状态
type ServiceHealth struct {
	Status    string    `json:"status"`
	Message   string    `json:"message,omitempty"`
	Latency   int64     `json:"latency_ms,omitempty"`
	LastCheck time.Time `json:"last_check"`
}

// SystemHealth 系统健康状态
type SystemHealth struct {
	GoVersion    string `json:"go_version"`
	NumGoroutine int    `json:"num_goroutine"`
	NumCPU       int    `json:"num_cpu"`
	MemAllocMB   uint64 `json:"mem_alloc_mb"`
	MemTotalMB   uint64 `json:"mem_total_mb"`
	MemSysMB     uint64 `json:"mem_sys_mb"`
}

// HealthChecker 健康检查器
type HealthChecker struct {
	startTime time.Time
	version   string
	checks    map[string]HealthCheck
}

// HealthCheck 健康检查函数
type HealthCheck func() ServiceHealth

// NewHealthChecker 创建健康检查器
func NewHealthChecker(version string) *HealthChecker {
	return &HealthChecker{
		startTime: time.Now(),
		version:   version,
		checks:    make(map[string]HealthCheck),
	}
}

// RegisterCheck 注册健康检查
func (h *HealthChecker) RegisterCheck(name string, check HealthCheck) {
	h.checks[name] = check
	logrus.Infof("Health check registered: %s", name)
}

// Check 执行健康检查
func (h *HealthChecker) Check() HealthStatus {
	overallStatus := "healthy"
	services := make(map[string]ServiceHealth)

	// 执行所有健康检查
	for name, check := range h.checks {
		serviceHealth := check()
		services[name] = serviceHealth

		if serviceHealth.Status == "unhealthy" {
			overallStatus = "unhealthy"
		} else if serviceHealth.Status == "degraded" && overallStatus == "healthy" {
			overallStatus = "degraded"
		}
	}

	// 获取系统信息
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	systemHealth := SystemHealth{
		GoVersion:    runtime.Version(),
		NumGoroutine: runtime.NumGoroutine(),
		NumCPU:       runtime.NumCPU(),
		MemAllocMB:   m.Alloc / 1024 / 1024,
		MemTotalMB:   m.TotalAlloc / 1024 / 1024,
		MemSysMB:     m.Sys / 1024 / 1024,
	}

	return HealthStatus{
		Status:    overallStatus,
		Timestamp: time.Now(),
		Version:   h.version,
		Uptime:    int64(time.Since(h.startTime).Seconds()),
		Services:  services,
		System:    systemHealth,
	}
}

// HealthHandler 健康检查处理器
func (s *Server) healthCheckHandler(checker *HealthChecker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := checker.Check()

		statusCode := http.StatusOK
		if status.Status == "unhealthy" {
			statusCode = http.StatusServiceUnavailable
		} else if status.Status == "degraded" {
			statusCode = http.StatusOK // degraded仍然返回200，但标记状态
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(status)
	}
}

// LivenessProbe 存活探针
func (s *Server) livenessProbe(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// ReadinessProbe 就绪探针
func (s *Server) readinessProbe(checker *HealthChecker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := checker.Check()

		if status.Status == "unhealthy" {
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte("Not Ready"))
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Ready"))
	}
}
