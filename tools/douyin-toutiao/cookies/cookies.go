package cookies

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

var cookieCache struct {
	sync.RWMutex
	data map[string]string
}

const CookieDir = "./cookies"
const CookieFile = "cookies.json"

func init() {
	cookieCache.data = make(map[string]string)
}

func InitCookieDir() error {
	if err := os.MkdirAll(CookieDir, 0755); err != nil {
		return errors.Wrap(err, "创建 cookie 目录失败")
	}
	return nil
}

func SaveCookies(cookies map[string]string, platform string) error {
	cookieCache.Lock()
	defer cookieCache.Unlock()

	for k, v := range cookies {
		cookieCache.data[platform+"_"+k] = v
	}

	cookiePath := filepath.Join(CookieDir, platform+"_"+CookieFile)
	if err := os.WriteFile(cookiePath, []byte(toJSON(cookies)), 0644); err != nil {
		return errors.Wrap(err, "保存 cookie 失败")
	}

	logrus.Infof("Cookie 已保存: %s", cookiePath)
	return nil
}

func LoadCookies(platform string) (map[string]string, error) {
	cookieCache.RLock()
	defer cookieCache.RUnlock()

	cookiePath := filepath.Join(CookieDir, platform+"_"+CookieFile)
	if _, err := os.Stat(cookiePath); os.IsNotExist(err) {
		return nil, nil
	}

	data, err := os.ReadFile(cookiePath)
	if err != nil {
		return nil, errors.Wrap(err, "读取 cookie 失败")
	}

	var cookies map[string]string
	if err := json.Unmarshal(data, &cookies); err != nil {
		return nil, errors.Wrap(err, "解析 cookie 失败")
	}

	logrus.Infof("Cookie 已加载: %d 个", len(cookies))
	return cookies, nil
}

func DeleteCookies(platform string) error {
	cookieCache.Lock()
	defer cookieCache.Unlock()

	cookiePath := filepath.Join(CookieDir, platform+"_"+CookieFile)
	if err := os.Remove(cookiePath); err != nil && !os.IsNotExist(err) {
		return errors.Wrap(err, "删除 cookie 失败")
	}

	prefix := platform + "_"
	for k := range cookieCache.data {
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			delete(cookieCache.data, k)
		}
	}

	logrus.Infof("Cookie 已删除: %s", cookiePath)
	return nil
}

func toJSON(v interface{}) string {
	data, _ := json.Marshal(v)
	return string(data)
}
