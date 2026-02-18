package main

import (
	"github.com/gin-gonic/gin"
	"github.com/go-rod/rod"
)

func SetupMultiPlatformRoutes(r *gin.Engine, service *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) {
	api := r.Group("/api")
	{
		api.GET("/platforms", HandleListPlatforms(service))

		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "ok",
				"message": "MCP 多平台发布服务运行正常",
			})
		})

		platformGroup := api.Group("/platform/:platform")
		{
			platformGroup.POST("/login", HandlePlatformLogin(service, getBrowserPage))
			platformGroup.GET("/check-login", HandleCheckLogin(service, getBrowserPage))
			platformGroup.POST("/publish", HandlePlatformPublish(service, getBrowserPage))
			platformGroup.POST("/publish-video", HandlePlatformPublishVideo(service, getBrowserPage))
			platformGroup.GET("/feeds", HandlePlatformGetFeeds(service, getBrowserPage))
			platformGroup.GET("/feeds/:feed_id", HandlePlatformGetFeedDetail(service, getBrowserPage))
		}
	}
}
