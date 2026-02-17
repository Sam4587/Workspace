package main

import (
	"net/http"
	
	"github.com/gin-gonic/gin"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

// HandleListPlatforms 处理列出平台请求
func HandleListPlatforms(s *MultiPlatformService) gin.HandlerFunc {
	return func(c *gin.Context) {
		platforms := s.ListPlatforms()
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"platforms": platforms,
				"count":     len(platforms),
			},
		})
	}
}

// HandlePlatformLogin 处理平台登录请求
func HandlePlatformLogin(s *MultiPlatformService) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))
		
		// TODO: 实现登录逻辑
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "登录功能开发中",
			"platform": platformID,
		})
	}
}

// HandlePlatformPublish 处理平台发布请求
func HandlePlatformPublish(s *MultiPlatformService) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))
		
		var req platform.ImageTextRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}
		
		// TODO: 实现发布逻辑
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "发布功能开发中",
			"platform": platformID,
			"request":  req,
		})
	}
}
