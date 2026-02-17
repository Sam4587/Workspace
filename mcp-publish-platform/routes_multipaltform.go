package main

import (
	"github.com/gin-gonic/gin"
)

// SetupMultiPlatformRoutes 设置多平台路由
func SetupMultiPlatformRoutes(r *gin.Engine, service *MultiPlatformService) {
	// 平台管理路由
	api := r.Group("/api")
	{
		// 列出所有平台
		api.GET("/platforms", HandleListPlatforms(service))
		
		// 平台操作路由
		platformGroup := api.Group("/platform/:platform")
		{
			// 登录
			platformGroup.POST("/login", HandlePlatformLogin(service))
			
			// 发布
			platformGroup.POST("/publish", HandlePlatformPublish(service))
			
			// TODO: 添加更多路由
			// platformGroup.GET("/check-login", HandleCheckLogin(service))
			// platformGroup.POST("/publish-video", HandlePublishVideo(service))
			// platformGroup.GET("/feeds", HandleGetFeeds(service))
		}
	}
	
	// 健康检查
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "MCP 多平台发布服务运行正常",
		})
	})
}
