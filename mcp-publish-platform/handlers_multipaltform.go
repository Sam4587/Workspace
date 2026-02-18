package main

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-rod/rod"
	"github.com/sirupsen/logrus"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

type PlatformHandler struct {
	service        *MultiPlatformService
	getBrowserPage func() (*rod.Page, error)
}

func NewPlatformHandler(service *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) *PlatformHandler {
	return &PlatformHandler{
		service:        service,
		getBrowserPage: getBrowserPage,
	}
}

func HandleListPlatforms(s *MultiPlatformService) gin.HandlerFunc {
	return func(c *gin.Context) {
		platforms := s.ListPlatforms()

		platformInfos := make([]gin.H, 0, len(platforms))
		for _, pID := range platforms {
			platformInfos = append(platformInfos, gin.H{
				"id":   string(pID),
				"name": getPlatformName(pID),
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"platforms": platformInfos,
				"count":     len(platforms),
			},
		})
	}
}

func getPlatformName(id platform.PlatformID) string {
	switch id {
	case platform.PlatformXiaohongshu:
		return "小红书"
	case platform.PlatformDouyin:
		return "抖音"
	case platform.PlatformToutiao:
		return "今日头条"
	default:
		return string(id)
	}
}

func HandlePlatformLogin(s *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))

		logrus.Infof("收到登录请求: platform=%s", platformID)

		page, err := getBrowserPage()
		if err != nil {
			logrus.Errorf("获取浏览器页面失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "获取浏览器页面失败: " + err.Error(),
			})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Minute)
		defer cancel()

		if err := s.Login(ctx, platformID, page); err != nil {
			logrus.Errorf("登录失败: %v", err)
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":  true,
			"message":  "登录成功",
			"platform": string(platformID),
		})
	}
}

func HandleCheckLogin(s *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))

		logrus.Infof("收到检查登录状态请求: platform=%s", platformID)

		page, err := getBrowserPage()
		if err != nil {
			logrus.Errorf("获取浏览器页面失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "获取浏览器页面失败: " + err.Error(),
			})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
		defer cancel()

		loggedIn, err := s.CheckLogin(ctx, platformID, page)
		if err != nil {
			logrus.Errorf("检查登录状态失败: %v", err)
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"logged_in": loggedIn,
			"platform":  string(platformID),
		})
	}
}

func HandlePlatformPublish(s *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))

		logrus.Infof("收到发布请求: platform=%s", platformID)

		var req platform.ImageTextRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "请求参数错误: " + err.Error(),
			})
			return
		}

		page, err := getBrowserPage()
		if err != nil {
			logrus.Errorf("获取浏览器页面失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "获取浏览器页面失败: " + err.Error(),
			})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Minute)
		defer cancel()

		resp, err := s.PublishImageText(ctx, platformID, page, &req)
		if err != nil {
			logrus.Errorf("发布失败: %v", err)
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":  resp.Success,
			"message":  resp.Message,
			"feed_id":  resp.FeedID,
			"feed_url": resp.FeedURL,
			"platform": string(platformID),
		})
	}
}

func HandlePlatformPublishVideo(s *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))

		logrus.Infof("收到视频发布请求: platform=%s", platformID)

		var req platform.VideoRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "请求参数错误: " + err.Error(),
			})
			return
		}

		page, err := getBrowserPage()
		if err != nil {
			logrus.Errorf("获取浏览器页面失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "获取浏览器页面失败: " + err.Error(),
			})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Minute)
		defer cancel()

		resp, err := s.PublishVideo(ctx, platformID, page, &req)
		if err != nil {
			logrus.Errorf("视频发布失败: %v", err)
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":  resp.Success,
			"message":  resp.Message,
			"feed_id":  resp.FeedID,
			"feed_url": resp.FeedURL,
			"platform": string(platformID),
		})
	}
}

func HandlePlatformGetFeeds(s *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))

		logrus.Infof("收到获取内容列表请求: platform=%s", platformID)

		var req platform.GetFeedsRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "请求参数错误: " + err.Error(),
			})
			return
		}

		if req.Page == 0 {
			req.Page = 1
		}
		if req.PageSize == 0 {
			req.PageSize = 20
		}

		page, err := getBrowserPage()
		if err != nil {
			logrus.Errorf("获取浏览器页面失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "获取浏览器页面失败: " + err.Error(),
			})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 1*time.Minute)
		defer cancel()

		resp, err := s.GetFeeds(ctx, platformID, page, &req)
		if err != nil {
			logrus.Errorf("获取内容列表失败: %v", err)
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":  true,
			"data":     resp,
			"platform": string(platformID),
		})
	}
}

func HandlePlatformGetFeedDetail(s *MultiPlatformService, getBrowserPage func() (*rod.Page, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		platformID := platform.PlatformID(c.Param("platform"))
		feedID := c.Param("feed_id")

		logrus.Infof("收到获取内容详情请求: platform=%s, feed_id=%s", platformID, feedID)

		page, err := getBrowserPage()
		if err != nil {
			logrus.Errorf("获取浏览器页面失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "获取浏览器页面失败: " + err.Error(),
			})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
		defer cancel()

		detail, err := s.GetFeedDetail(ctx, platformID, page, feedID)
		if err != nil {
			logrus.Errorf("获取内容详情失败: %v", err)
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success":  true,
			"data":     detail,
			"platform": string(platformID),
		})
	}
}
