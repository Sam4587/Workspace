package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-rod/rod"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/sirupsen/logrus"
	"github.com/xpzouying/headless_browser"
	"github.com/xpzouying/xiaohongshu-mcp/configs"
	"github.com/xpzouying/xiaohongshu-mcp/cookies"
)

type AppServer struct {
	xiaohongshuService   *XiaohongshuService
	multiPlatformService *MultiPlatformService
	mcpServer            *mcp.Server
	router               *gin.Engine
	httpServer           *http.Server
	browser              *headless_browser.Browser
}

func NewAppServer(xiaohongshuService *XiaohongshuService) *AppServer {
	appServer := &AppServer{
		xiaohongshuService: xiaohongshuService,
	}

	appServer.mcpServer = InitMCPServer(appServer)

	return appServer
}

func NewMultiPlatformAppServer(multiPlatformService *MultiPlatformService) *AppServer {
	appServer := &AppServer{
		multiPlatformService: multiPlatformService,
	}

	appServer.mcpServer = InitMCPServer(appServer)

	return appServer
}

func (s *AppServer) Start(port string) error {
	s.initBrowser()

	s.router = s.setupRoutes()

	s.httpServer = &http.Server{
		Addr:    port,
		Handler: s.router,
	}

	go func() {
		logrus.Infof("启动 HTTP 服务器: %s", port)
		logrus.Infof("API 文档: http://localhost%s/api/health", port)
		logrus.Infof("平台列表: http://localhost%s/api/platforms", port)
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Errorf("服务器启动失败: %v", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Infof("正在关闭服务器...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.httpServer.Shutdown(ctx); err != nil {
		logrus.Warnf("等待连接关闭超时，强制退出: %v", err)
	} else {
		logrus.Infof("服务器已优雅关闭")
	}

	if s.browser != nil {
		s.browser.Close()
	}

	return nil
}

func (s *AppServer) initBrowser() {
	opts := []headless_browser.Option{
		headless_browser.WithHeadless(configs.IsHeadless()),
	}

	binPath := configs.GetBinPath()
	if binPath != "" {
		opts = append(opts, headless_browser.WithChromeBinPath(binPath))
	}

	cookiePath := cookies.GetCookiesFilePath()
	cookieLoader := cookies.NewLoadCookie(cookiePath)

	if data, err := cookieLoader.LoadCookies(); err == nil {
		opts = append(opts, headless_browser.WithCookies(string(data)))
		logrus.Debug("已加载 cookies")
	} else {
		logrus.Warnf("加载 cookies 失败: %v", err)
	}

	s.browser = headless_browser.New(opts...)
	logrus.Info("浏览器初始化完成")
}

func (s *AppServer) getBrowserPage() (*rod.Page, error) {
	if s.browser == nil {
		return nil, nil
	}
	return s.browser.NewPage(), nil
}

func (s *AppServer) setupRoutes() *gin.Engine {
	r := gin.Default()

	r.Use(corsMiddleware())

	if s.multiPlatformService != nil {
		SetupMultiPlatformRoutes(r, s.multiPlatformService, s.getBrowserPage)
	}

	if s.xiaohongshuService != nil {
		setupXiaohongshuRoutes(r, s)
	}

	return r
}

func setupXiaohongshuRoutes(r *gin.Engine, s *AppServer) {
	api := r.Group("/api/v1")
	{
		api.GET("/login/status", s.checkLoginStatusHandler)
		api.GET("/login/qrcode", s.getLoginQrcodeHandler)
		api.DELETE("/login/cookies", s.deleteCookiesHandler)

		api.POST("/publish", s.publishHandler)
		api.POST("/publish/video", s.publishVideoHandler)

		api.GET("/feeds", s.listFeedsHandler)
		api.POST("/feeds/search", s.searchFeedsHandler)
		api.GET("/feeds/search", s.searchFeedsHandler)
		api.POST("/feeds/detail", s.getFeedDetailHandler)

		api.POST("/user/profile", s.userProfileHandler)
		api.GET("/user/me", s.myProfileHandler)

		api.POST("/comment", s.postCommentHandler)
		api.POST("/comment/reply", s.replyCommentHandler)

		api.GET("/health", healthHandler)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
