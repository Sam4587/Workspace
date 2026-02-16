package handlers

import (
	"context"
	"fmt"

	"github.com/monkeycode/publisher-core/adapters"
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

	platform, ok := t.Payload["platform"].(string)
	if !ok {
		return fmt.Errorf("invalid platform in payload")
	}

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

	t.Result = map[string]interface{}{
		"platform":     platform,
		"title":        title,
		"type":         contentType,
		"images_count": len(images),
		"tags_count":   len(tags),
		"status":       "processed",
		"message":      "发布任务已处理（模拟）",
	}

	logrus.Infof("发布任务处理完成: %s", t.ID)
	return nil
}
