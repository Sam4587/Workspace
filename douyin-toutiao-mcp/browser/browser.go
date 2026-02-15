package browser

import (
	"sync"

	"github.com/sirupsen/logrus"
	"github.com/xpzouying/headless_browser"
)

var (
	instance *headless_browser.Browser
	once     sync.Once
	headless bool
)

func NewBrowser(isHeadless bool) *headless_browser.Browser {
	once.Do(func() {
		headless = isHeadless
		opts := []headless_browser.Option{}
		if isHeadless {
			opts = append(opts, headless_browser.Headless(true))
		}
		instance = headless_browser.New(opts...)
		logrus.Info("浏览器初始化成功")
	})
	return instance
}

func GetBrowser() *headless_browser.Browser {
	if instance == nil {
		NewBrowser(true)
	}
	return instance
}

func Close() {
	if instance != nil {
		instance.Close()
		instance = nil
		logrus.Info("浏览器已关闭")
	}
}
