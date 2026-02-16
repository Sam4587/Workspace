package handlers

import (
	"context"
	"fmt"

	"github.com/monkeycode/publisher-core/adapters"
	"github.com/monkeycode/publisher-core/interfaces/publisher"
	"github.com/monkeycode/publisher-core/task"
	"github.com/sirupsen/logrus"
)

type PublishHandler struct {
	factory *adapters.PublisherFactory
}

func NewPublishHandler(factory *adapters.PublisherFactory) *PublishHandler {
	return &PublishHandler{factory: factory}
}

func (h *PublishHandler) Handle(ctx context.Context, t *task.Task) error {
	logrus.Infof("开始执行发布任务: %s, 平台: %s", t.ID, t.Platform)

	// 提取平台信息
	platform, ok := t.Payload["platform"].(string)
	if !ok {
		return fmt.Errorf("invalid platform in payload")
	}

	// 提取内容信息
	title, _ := t.Payload["title"].(string)
	content, _ := t.Payload["content"].(string)
	contentType, _ := t.Payload["type"].(string)

	var images []string
	if imgs, ok := t.Payload["images"].([]interface{}); ok {
		for _, img := range imgs {
			if s, ok := img.(string); ok {
				images = append(images, s)
			}
		}
	}

	video, _ := t.Payload["video"].(string)

	var tags []string
	if ts, ok := t.Payload["tags"].([]interface{}); ok {
		for _, tag := range ts {
			if s, ok := tag.(string); ok {
				tags = append(tags, s)
			}
		}
	}

	logrus.Infof("发布内容: platform=%s, type=%s, title=%s, content_len=%d, images=%d, video=%s, tags=%d",
		platform, contentType, title, len(content), len(images), video, len(tags))

	// 创建发布器
	pub, err := h.factory.Create(platform)
	if err != nil {
		logrus.Errorf("创建发布器失败: %v", err)
		return fmt.Errorf("创建发布器失败: %w", err)
	}

	// 构造发布内容
	publishContent := &publisher.Content{
		Type:       publisher.ContentType(contentType),
		Title:      title,
		Body:       content,
		ImagePaths: images,
		VideoPath:  video,
		Tags:       tags,
	}

	// 执行发布
	result, err := pub.Publish(ctx, publishContent)
	if err != nil {
		logrus.Errorf("发布失败: %v", err)
		t.Result = map[string]interface{}{
			"platform": platform,
			"title":    title,
			"status":   "failed",
			"error":    err.Error(),
		}
		return err
	}

	// 更新任务结果
	t.Result = map[string]interface{}{
		"platform":   platform,
		"title":      title,
		"type":       contentType,
		"task_id":    result.TaskID,
		"status":     string(result.Status),
		"post_id":    result.PostID,
		"post_url":   result.PostURL,
		"created_at": result.CreatedAt,
	}

	if result.FinishedAt != nil {
		t.Result["finished_at"] = result.FinishedAt
	}

	logrus.Infof("发布任务完成: %s, 状态: %s", t.ID, result.Status)
	return nil
}
