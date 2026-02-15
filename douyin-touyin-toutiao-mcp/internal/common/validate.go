package common

import (
	"context"

	"github.com/go-rod/rod"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

func CheckLoginWithRetry(ctx context.Context, checker func() (bool, error), maxRetries int) (bool, error) {
	for i := 0; i < maxRetries; i++ {
		loggedIn, err := checker()
		if err != nil {
			logrus.Warnf("检查登录状态失败 (尝试 %d/%d): %v", i+1, maxRetries, err)
			if i < maxRetries-1 {
				time.Sleep(time.Duration(2+i) * time.Second)
				continue
			}
			return false, err
		}
		return loggedIn, nil
	}

	return loggedIn, nil
}

func ExtractCookiesWithRetry(ctx context.Context, extractor func() (map[string]string, error), maxRetries int) (map[string]string, error) {
	for i := 0; i < maxRetries; i++ {
		cookies, err := extractor()
		if err != nil {
			logrus.Warnf("提取 cookies 失败 (尝试 %d/%d): %v", i+1, maxRetries, err)
			if i < maxRetries-1 {
				time.Sleep(time.Duration(2+i) * time.Second)
				continue
			}
			return nil, err
		}
		return cookies, nil
	}

func PublishWithRetry(ctx context.Context, publisher func() error, maxRetries int) error {
	for i := 0; i < maxRetries; i++ {
		err := publisher()
		if err != nil {
			logrus.Warnf("发布失败 (尝试 %d/%d): %v", i+1, maxRetries, err)
			if i < maxRetries-1 {
				time.Sleep(time.Duration(3+i) * time.Second)
				continue
			}
			return err
		}
		return nil
	}
}

func ValidateTitle(title string, maxLen int) error {
	if len(title) > maxLen {
		logrus.Warnf("标题超长,将被截断: %d -> %d", len(title), maxLen)
		return errors.New("标题超过限制")
	}
	return nil
}

func ValidateContent(content string, maxLen int) error {
	if len(content) > maxLen {
		logrus.Warnf("正文超长,将被截断: %d -> %d", len(content), maxLen)
		return errors.New("正文超过限制")
	}
	return nil
}

func ValidateVideoPath(path string) error {
	if path == "" {
		return errors.New("视频路径不能为空")
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		return errors.Wrapf(err, "视频文件不存在: %s", path)
	}

	return nil
}

func ValidateImagePaths(paths []string) error {
	if len(paths) == 0 {
		return errors.New("图片路径列表不能为空")
	}

	for _, path := range paths {
		if _, err := os.Stat(path); os.IsNotExist(err) {
			return errors.Wrapf(err, "图片文件不存在: %s", path)
		}
	}

	return nil
}

func TruncateTitle(title string, maxLen int) string {
	if len(title) > maxLen {
		logrus.Warnf("标题超长,将被截断")
		return title[:maxLen]
	}
	return title
}

func TruncateContent(content string, maxLen int) string {
	if len(content) > maxLen {
		logrus.Warnf("正文超长,将被截断")
		return content[:maxLen]
	}
	return content
}
