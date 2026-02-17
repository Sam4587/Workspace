package platform

import (
	"fmt"
	"sync"
)

// PlatformRegistry 平台注册中心
// 管理所有平台的注册和获取
type PlatformRegistry struct {
	mu       sync.RWMutex
	platforms map[PlatformID]Platform
}

// 全局平台注册中心实例
var globalRegistry = &PlatformRegistry{
	platforms: make(map[PlatformID]Platform),
}

// Register 注册平台
func (r *PlatformRegistry) Register(p Platform) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	if _, exists := r.platforms[p.ID()]; exists {
		return fmt.Errorf("platform %s already registered", p.ID())
	}
	
	r.platforms[p.ID()] = p
	return nil
}

// Get 获取平台
func (r *PlatformRegistry) Get(id PlatformID) (Platform, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	p, exists := r.platforms[id]
	if !exists {
		return nil, fmt.Errorf("platform %s not found", id)
	}
	
	return p, nil
}

// List 列出所有平台
func (r *PlatformRegistry) List() []PlatformID {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	ids := make([]PlatformID, 0, len(r.platforms))
	for id := range r.platforms {
		ids = append(ids, id)
	}
	return ids
}

// 全局函数

// RegisterPlatform 注册平台到全局注册中心
func RegisterPlatform(p Platform) error {
	return globalRegistry.Register(p)
}

// GetPlatform 从全局注册中心获取平台
func GetPlatform(id PlatformID) (Platform, error) {
	return globalRegistry.Get(id)
}

// ListPlatforms 列出所有已注册平台
func ListPlatforms() []PlatformID {
	return globalRegistry.List()
}
