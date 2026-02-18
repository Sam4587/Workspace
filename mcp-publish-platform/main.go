package main

import (
	"flag"
	"os"

	"github.com/sirupsen/logrus"
	"github.com/xpzouying/xiaohongshu-mcp/configs"
	"github.com/xpzouying/xiaohongshu-mcp/internal/douyin"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
	"github.com/xpzouying/xiaohongshu-mcp/internal/toutiao"
	"github.com/xpzouying/xiaohongshu-mcp/internal/xiaohongshu"
)

func main() {
	var (
		headless   bool
		binPath    string
		port       string
		multiMode  bool
	)
	flag.BoolVar(&headless, "headless", true, "是否无头模式")
	flag.StringVar(&binPath, "bin", "", "浏览器二进制文件路径")
	flag.StringVar(&port, "port", ":18060", "端口")
	flag.BoolVar(&multiMode, "multi", false, "启用多平台模式")
	flag.Parse()

	if len(binPath) == 0 {
		binPath = os.Getenv("ROD_BROWSER_BIN")
	}

	configs.InitHeadless(headless)
	configs.SetBinPath(binPath)

	logrus.Info("========================================")
	logrus.Info("MCP 多平台发布服务启动中...")
	logrus.Info("========================================")

	if multiMode {
		logrus.Info("多平台模式已启用")
		startMultiPlatformMode(port)
	} else {
		logrus.Info("小红书单平台模式")
		startXiaohongshuMode(port)
	}
}

func startXiaohongshuMode(port string) {
	xiaohongshuService := NewXiaohongshuService()
	appServer := NewAppServer(xiaohongshuService)
	if err := appServer.Start(port); err != nil {
		logrus.Fatalf("服务器启动失败: %v", err)
	}
}

func startMultiPlatformMode(port string) {
	platformManager := platform.GetPlatformManager()

	logrus.Info("开始注册平台...")

	if err := platformManager.RegisterPlatform(xiaohongshu.NewXiaohongshuAdapter()); err != nil {
		logrus.Errorf("注册小红书平台失败: %v", err)
	} else {
		logrus.Info("✓ 小红书平台注册成功")
	}

	if err := platformManager.RegisterPlatform(douyin.New()); err != nil {
		logrus.Warnf("注册抖音平台失败: %v", err)
	} else {
		logrus.Info("✓ 抖音平台注册成功")
	}

	if err := platformManager.RegisterPlatform(toutiao.New()); err != nil {
		logrus.Warnf("注册今日头条平台失败: %v", err)
	} else {
		logrus.Info("✓ 今日头条平台注册成功")
	}

	platforms := platformManager.ListPlatforms()
	logrus.Infof("已注册平台数量: %d", len(platforms))
	for _, p := range platforms {
		logrus.Infof("  - %s", p)
	}

	service := NewMultiPlatformService(platformManager)
	appServer := NewMultiPlatformAppServer(service)
	if err := appServer.Start(port); err != nil {
		logrus.Fatalf("服务器启动失败: %v", err)
	}
}
