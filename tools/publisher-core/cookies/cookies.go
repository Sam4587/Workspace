// Package cookies 提供 Cookie 管理功能
package cookies

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/go-rod/rod/lib/proto"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

// Manager Cookie 管理器
type Manager struct {
	mu       sync.RWMutex
	cache    map[string]map[string]string // platform -> cookies
	cacheDir string
}

// DefaultCacheDir 默认缓存目录
const DefaultCacheDir = "./cookies"

// NewManager 创建 Cookie 管理器
func NewManager(cacheDir string) *Manager {
	if cacheDir == "" {
		cacheDir = DefaultCacheDir
	}

	m := &Manager{
		cache:    make(map[string]map[string]string),
		cacheDir: cacheDir,
	}

	// 确保目录存在
	os.MkdirAll(cacheDir, 0755)

	return m
}

// Save 保存 Cookie
func (m *Manager) Save(ctx context.Context, platform string, cookies []*proto.NetworkCookie) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 转换为 map
	cookieMap := make(map[string]string)
	for _, c := range cookies {
		cookieMap[c.Name] = c.Value
	}

	// 更新缓存
	m.cache[platform] = cookieMap

	// 保存到文件
	filePath := m.getCookiePath(platform)
	data, err := json.MarshalIndent(cookieMap, "", "  ")
	if err != nil {
		return errors.Wrap(err, "序列化 Cookie 失败")
	}

	if err := os.WriteFile(filePath, data, 0600); err != nil {
		return errors.Wrap(err, "保存 Cookie 文件失败")
	}

	logrus.Infof("[%s] Cookie 已保存: %d 个", platform, len(cookieMap))
	return nil
}

// Load 加载 Cookie
func (m *Manager) Load(ctx context.Context, platform string) (map[string]string, error) {
	m.mu.RLock()
	// 先检查缓存
	if cookies, ok := m.cache[platform]; ok {
		m.mu.RUnlock()
		return cookies, nil
	}
	m.mu.RUnlock()

	// 从文件加载
	filePath := m.getCookiePath(platform)
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil // 文件不存在，返回 nil
		}
		return nil, errors.Wrap(err, "读取 Cookie 文件失败")
	}

	var cookieMap map[string]string
	if err := json.Unmarshal(data, &cookieMap); err != nil {
		return nil, errors.Wrap(err, "解析 Cookie 失败")
	}

	// 更新缓存
	m.mu.Lock()
	m.cache[platform] = cookieMap
	m.mu.Unlock()

	logrus.Debugf("[%s] Cookie 已加载: %d 个", platform, len(cookieMap))
	return cookieMap, nil
}

// LoadAsProto 加载 Cookie 为 proto.NetworkCookieParam 格式
func (m *Manager) LoadAsProto(ctx context.Context, platform string, domain string) ([]*proto.NetworkCookieParam, error) {
	cookieMap, err := m.Load(ctx, platform)
	if err != nil {
		return nil, err
	}

	if cookieMap == nil {
		return nil, nil
	}

	var cookies []*proto.NetworkCookieParam
	for name, value := range cookieMap {
		cookies = append(cookies, &proto.NetworkCookieParam{
			Name:   name,
			Value:  value,
			Domain: domain,
			Path:   "/",
		})
	}

	return cookies, nil
}

// Delete 删除 Cookie
func (m *Manager) Delete(ctx context.Context, platform string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 清除缓存
	delete(m.cache, platform)

	// 删除文件
	filePath := m.getCookiePath(platform)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return errors.Wrap(err, "删除 Cookie 文件失败")
	}

	logrus.Infof("[%s] Cookie 已删除", platform)
	return nil
}

// Exists 检查 Cookie 是否存在
func (m *Manager) Exists(ctx context.Context, platform string) (bool, error) {
	m.mu.RLock()
	if _, ok := m.cache[platform]; ok {
		m.mu.RUnlock()
		return true, nil
	}
	m.mu.RUnlock()

	filePath := m.getCookiePath(platform)
	_, err := os.Stat(filePath)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, errors.Wrap(err, "检查 Cookie 文件失败")
	}

	return true, nil
}

// List 列出所有已保存的平台
func (m *Manager) List(ctx context.Context) ([]string, error) {
	files, err := os.ReadDir(m.cacheDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, errors.Wrap(err, "读取 Cookie 目录失败")
	}

	var platforms []string
	for _, f := range files {
		if !f.IsDir() && filepath.Ext(f.Name()) == ".json" {
			// 移除 _cookies.json 后缀
			name := f.Name()
			name = name[:len(name)-len("_cookies.json")]
			platforms = append(platforms, name)
		}
	}

	return platforms, nil
}

func (m *Manager) getCookiePath(platform string) string {
	return filepath.Join(m.cacheDir, platform+"_cookies.json")
}

// 平台特定的 Cookie 关键字段

// DouyinCookieKeys 抖音关键 Cookie 字段
var DouyinCookieKeys = []string{
	"tt_webid",
	"passport_auth",
	"csrf_token",
	"ttcid",
	"sessionid",
}

// ToutiaoCookieKeys 今日头条关键 Cookie 字段
var ToutiaoCookieKeys = []string{
	"sessionid",
	"passport_auth",
	"tt_token",
	"tt_webid",
}

// XiaohongshuCookieKeys 小红书关键 Cookie 字段
var XiaohongshuCookieKeys = []string{
	"web_session",
	"webId",
	"websectiga",
	"sec_poison_id",
}

// ExtractCookies 提取关键 Cookie
func ExtractCookies(cookies []*proto.NetworkCookie, keys []string) map[string]string {
	result := make(map[string]string)
	keySet := make(map[string]bool)
	for _, k := range keys {
		keySet[k] = true
	}

	for _, c := range cookies {
		if keySet[c.Name] {
			result[c.Name] = c.Value
		}
	}

	return result
}
