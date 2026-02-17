package main

import (
	"flag"
	"os"

	"github.com/sirupsen/logrus"
	"github.com/xpzouying/xiaohongshu-mcp/configs"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
	"github.com/xpzouying/xiaohongshu-mcp/internal/xiaohongshu"
	"github.com/xpzouying/xiaohongshu-mcp/internal/douyin"
	"github.com/xpzouying/xiaohongshu-mcp/internal/toutiao"
)

func main() {
	var (
		headless bool
		binPath  string
		port     string
	)
	flag.BoolVar(&headless, "headless", true, "是否无头模式")
	flag.StringVar(&binPath, "bin", "", "浏览器二进制文件路径")
	flag.StringVar(&port, "port", ":18060", "端口")
	flag.Parse()

	if len(binPath) == 0 {
		binPath = os.Getenv("ROD_BROWSER_BIN")
	}

	configs.InitHeadless(headless)
	configs.SetBinPath(binPath)

	// 初始化平台管理器
	platformManager := platform.GetPlatformManager()
	
	// 注册平台
	logrus.Info("开始注册平台...")
	
	// 注册小红书平台
	if err := platformManager.RegisterPlatform(xiaohongshu.NewXiaohongshuAdapter()); err != nil {
		logrus.Errorf("注册小红书平台失败: %v", err)
	}
	
	// 注册抖音平台
	if err := platformManager.RegisterPlatform(douyin.New()); err != nil {
		logrus.Warnf("注册抖音平台失败: %v", err)
	}
	
	// 注册今日头条平台
	if err := platformManager.RegisterPlatform(toutiao.New()); err != nil {
		logrus.Warnf("注册今日头条平台失败: %v", err)
	}
	
	// 列出所有已注册平台
	platforms := platformManager.ListPlatforms()
	logrus.Infof("已注册平台: %v", platforms)

	// 初始化服务
	service := NewMultiPlatformService(platformManager)

	// 创建并启动应用服务器
	appServer := NewAppServer(service)
	if err := appServer.Start(port); err != nil {
		logrus.Fatalf("failed to run server: %v", err)
	}
}
