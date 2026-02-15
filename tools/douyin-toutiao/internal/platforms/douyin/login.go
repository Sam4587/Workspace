package platforms

import (
	"context"
	"time"

	"github.com/go-rod/rod"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"monkeycode/ouyin-toutiao-mcp/internal/common"
	"monkeycode/ouyin-toutiao-mcp/internal/platform"
)

const (
	douyinLoginURL    = "https://creator.douyin.com/creator-micro/content/publish"
	douyinPublishURL  = "https://creator.douyin.com/creator-micro/content/publish"
	toutiaoLoginURL   = "https://mp.toutiao.com/"
	toutiaoPublishURL = "https://mp.toutiao.com/profile_v4/pub_article"
)

type DouyinPlatform struct{}

func (p *DouyinPlatform) Name() string {
	return "douyin"
}

func (p *DouyinPlatform) Version() string {
	return "1.0.0"
}

func (p *DouyinPlatform) NewLogin(page *rod.Page) platform.LoginAction {
	return &DouyinLoginAction{page: page}
}

func (p *DouyinPlatform) NewPublishAction(page *rod.Page) (platform.PublishAction, error) {
	return &DouyinPublishAction{page: page}
}

type DouyinLoginAction struct {
	page *rod.Page
}

func (a *DouyinLoginAction) CheckLoginStatus(ctx context.Context) (bool, error) {
	return common.CheckLoginWithRetry(ctx, a.checkLoginStatus, 3)
}

func (a *DouyinLoginAction) FetchQrcodeImage(ctx context.Context) (string, bool, error) {
	qrcodeURL, isLoggedIn, err := a.fetchQrcode(ctx)
	if err != nil {
		return "", false, err
	}

	if isLoggedIn {
		return qrcodeURL, true, nil
	}

	return qrcodeURL, false, nil
}

func (a *DouyinLoginAction) WaitForLogin(ctx context.Context) bool {
	return common.CheckLoginWithRetry(ctx, a.waitForLogin, 120)
}

func (a *DouyinLoginAction) ExtractCookies(ctx context.Context) (map[string]string, error) {
	return common.ExtractCookiesWithRetry(ctx, a.extractCookies, 3)
}

func (a *DouyinLoginAction) checkLoginStatus(ctx context.Context) (bool, error) {
	pp := a.page.Context(ctx)

	if err := pp.Navigate(douyinLoginURL); err != nil {
		return false, errors.Wrap(err, "导航到登录页面失败")
	}

	pp.MustWaitLoad()
	time.Sleep(2 * time.Second)

	exists, _, err := pp.Has(".login-avatar, .user-avatar")
	if err != nil {
		return false, errors.Wrap(err, "检查登录状态失败")
	}

	return exists, nil
}

func (a *DouyinLoginAction) fetchQrcode(ctx context.Context) (string, error) {
	pp := a.page.Context(ctx)

	if err := pp.Navigate(douyinLoginURL); err != nil {
		return "", errors.Wrap(err, "导航到登录页面失败")
	}

	pp.MustWaitLoad()
	time.Sleep(2 * time.Second)

	if exists, _, _ := pp.Has(".login-avatar, .user-avatar"); exists {
		return "", false, nil
	}

	qrcodeElem, err := pp.Element(".qrcode-img, .qr-code")
	if err != nil {
		return "", errors.Wrap(err, "查找二维码元素失败")
	}

	qrcodeSrc, err := qrcodeElem.Attribute("src")
	if err != nil {
		return "", errors.Wrap(err, "获取二维码链接失败")
	}

	if qrcodeSrc == nil || *qrcodeSrc == "" {
		return "", errors.New("二维码链接为空")
	}

	return *qrcodeSrc, nil
}

func (a *DouyinLoginAction) waitForLogin(ctx context.Context) bool {
	pp := a.page.Context(ctx)
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return false
		case <-ticker.C:
			el, err := pp.Element(".login-avatar, .user-avatar")
			if err == nil && el != nil {
				return true
			}
		}
	}
}

func (a *DouyinLoginAction) extractCookies(ctx context.Context) (map[string]string, error) {
	pp := a.page.Context(ctx)

	cookiesMap := make(map[string]string)

	cookies, err := pp.Cookies()
	if err != nil {
		return nil, errors.Wrap(err, "获取 cookies 失败")
	}

	for _, cookie := range cookies {
		switch cookie.Name {
		case "tt_webid", "passport_auth", "csrf_token", "ttcid":
			cookiesMap[cookie.Name] = cookie.Value
		}
	}

	if len(cookiesMap) == 0 {
		return nil, errors.New("未找到有效的 cookies")
	}

	logrus.Infof("提取到 %d 个 cookies", len(cookiesMap))
	return cookiesMap, nil
}

type DouyinPublishAction struct {
	page *rod.Page
}

func (p *DouyinPublishAction) PublishImages(ctx context.Context, content platform.PublishImageContent) error {
	if len(content.ImagePaths) == 0 {
		return errors.New("图片不能为空")
	}

	pp := p.page.Context(ctx)

	if err := common.ValidateImagePaths(content.ImagePaths); err != nil {
		return err
	}

	if err := common.SafeNavigate(pp, douyinPublishURL, 60*time.Second); err != nil {
		return err
	}

	if err := common.WaitDOMStable(pp); err != nil {
		return errors.Wrap(err, "等待 DOM 稳定失败")
	}

	if err := p.uploadImages(pp, content.ImagePaths); err != nil {
		return errors.Wrap(err, "上传图片失败")
	}

	if err := p.fillContent(pp, content.Title, content.Content, content.Tags); err != nil {
		return errors.Wrap(err, "填写内容失败")
	}

	if err := p.submitPublish(pp); err != nil {
		return errors.Wrap(err, "提交发布失败")
	}

	return nil
}

func (p *DouyinPublishAction) PublishVideo(ctx context.Context, content platform.PublishVideoContent) error {
	if content.VideoPath == "" {
		return errors.New("视频不能为空")
	}

	pp := p.page.Context(ctx)

	if err := common.ValidateVideoPath(content.VideoPath); err != nil {
		return err
	}

	if err := common.SafeNavigate(pp, douyinPublishURL, 60*time.Second); err != nil {
		return err
	}

	if err := common.WaitDOMStable(pp); err != nil {
		return errors.Wrap(err, "等待 DOM 稳定失败")
	}

	if err := p.uploadVideo(pp, content.VideoPath); err != nil {
		return errors.Wrap(err, "上传视频失败")
	}

	if err := p.fillContent(pp, content.Title, content.Content, content.Tags); err != nil {
		return errors.Wrap(err, "填写内容失败")
	}

	if err := p.submitPublish(pp); err != nil {
		return errors.Wrap(err, "提交发布失败")
	}

	return nil
}

func (p *DouyinPublishAction) uploadImages(page *rod.Page, imagePaths []string) error {
	for i, imagePath := range imagePaths {
		logrus.Infof("上传图片 %d/%d: %s", i+1, len(imagePaths), imagePath)

		fileInput, err := page.Element("input[type='file'][accept*='image']")
		if err != nil {
			return errors.Wrap(err, "查找图片上传输入框失败")
		}

		fileInput.MustSetFiles(imagePath)

		common.WaitRandomDelay()
	}

	return nil
}

func (p *DouyinPublishAction) uploadVideo(page *rod.Page, videoPath string) error {
	logrus.Infof("上传视频: %s", videoPath)

	fileInput, err := page.Element("input[type='file'][accept*='video']")
	if err != nil {
		return errors.Wrap(err, "查找视频上传输入框失败")
	}

	fileInput.MustSetFiles(videoPath)

	logrus.Info("等待视频上传完成...")
	time.Sleep(3 * time.Second)

	return nil
}

func (p *DouyinPublishAction) fillContent(page *rod.Page, title, content string, tags []string) error {
	titleInput, err := page.Element("input[placeholder*='标题'], input[name*='title']")
	if err != nil {
		return errors.Wrap(err, "查找标题输入框失败")
	}

	if err := common.InputWithRandomDelay(page, titleInput, title); err != nil {
		return err
	}

	contentInput, err := page.Element("textarea[placeholder*='正文'], textarea[name*='content']")
	if err != nil {
		return errors.Wrap(err, "查找正文输入框失败")
	}

	if err := contentInput.Input(content); err != nil {
		return errors.Wrap(err, "输入正文失败")
	}

	common.WaitRandomDelay()

	if len(tags) > 0 {
		if err := p.inputTags(page, tags); err != nil {
			return errors.Wrap(err, "输入标签失败")
		}
	}

	return nil
}

func (p *DouyinPublishAction) inputTags(page *rod.Page, tags []string) error {
	for _, tag := range tags {
		tagInput, err := page.Element("input[placeholder*='话题'], input[name*='tag']")
		if err != nil {
			logrus.Warnf("查找话题输入框失败: %v", err)
			continue
		}

		if err := tagInput.Input("#" + tag); err != nil {
			logrus.Warnf("输入话题失败: %v", err)
			continue
		}

		tagInput.MustType("Enter")

		common.WaitRandomDelay()
	}

	return nil
}

func (p *DouyinPublishAction) submitPublish(page *rod.Page) error {
	publishBtn, err := page.Element("button[type='submit'], .publish-btn")
	if err != nil {
		return errors.Wrap(err, "查找发布按钮失败")
	}

	vis, err := publishBtn.Visible()
	if err != nil {
		return errors.Wrap(err, "检查按钮可见性失败")
	}

	if !vis {
		return errors.New("发布按钮不可见")
	}

	common.WaitRandomDelay()

	if err := publishBtn.Click("left", 1); err != nil {
		return errors.Wrap(err, "点击发布按钮失败")
	}

	time.Sleep(3 * time.Second)

	return nil
}
