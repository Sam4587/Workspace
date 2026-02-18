package toutiao

import (
	"context"
	"fmt"
	"time"

	"github.com/go-rod/rod"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

const (
	toutiaoCreatorHome = "https://mp.toutiao.com/"
	toutiaoPublishURL  = "https://mp.toutiao.com/publish"
	toutiaoArticleURL  = "https://mp.toutiao.com/publish/article"
	toutiaoVideoURL    = "https://mp.toutiao.com/publish/video"
)

type LoginAction struct {
	page *rod.Page
}

func NewLogin(page *rod.Page) *LoginAction {
	return &LoginAction{page: page}
}

func (a *LoginAction) CheckLoginStatus(ctx context.Context) (bool, error) {
	pp := a.page.Context(ctx)

	logrus.Info("正在检查今日头条登录状态...")
	if err := pp.Navigate(toutiaoCreatorHome); err != nil {
		return false, errors.Wrap(err, "导航到今日头条创作者中心失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	loginBtnSelectors := []string{
		`.login-button`,
		`.login-btn`,
		`[class*="login"]`,
		`button:contains("登录")`,
	}

	for _, selector := range loginBtnSelectors {
		has, _, err := pp.Has(selector)
		if err == nil && has {
			logrus.Info("检测到登录按钮，用户未登录")
			return false, nil
		}
	}

	userInfoSelectors := []string{
		`.user-info`,
		`.user-name`,
		`.avatar`,
		`[class*="user"]`,
		`[class*="account"]`,
	}

	for _, selector := range userInfoSelectors {
		has, _, err := pp.Has(selector)
		if err == nil && has {
			logrus.Info("检测到用户信息，已登录")
			return true, nil
		}
	}

	qrcodeSelectors := []string{
		`.qrcode`,
		`[class*="qrcode"]`,
		`[class*="qr-code"]`,
	}

	for _, selector := range qrcodeSelectors {
		has, _, err := pp.Has(selector)
		if err == nil && has {
			logrus.Info("检测到二维码，用户未登录")
			return false, nil
		}
	}

	currentURL := pp.MustInfo().URL
	if currentURL != "" && containsString(currentURL, "mp.toutiao.com") && !containsString(currentURL, "login") {
		logrus.Info("URL已跳转到创作者中心，假设已登录")
		return true, nil
	}

	logrus.Info("无法确定登录状态，假设未登录")
	return false, nil
}

func (a *LoginAction) Login(ctx context.Context) error {
	pp := a.page.Context(ctx)

	logrus.Info("正在导航到今日头条创作者中心...")
	if err := pp.Navigate(toutiaoCreatorHome); err != nil {
		return errors.Wrap(err, "导航到今日头条创作者中心失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	loggedIn, _ := a.CheckLoginStatus(ctx)
	if loggedIn {
		logrus.Info("已经登录，无需重新登录")
		return nil
	}

	logrus.Info("等待用户扫码登录...")
	logrus.Info("请在浏览器中扫描二维码完成登录")

	if err := a.WaitForLogin(ctx); err != nil {
		return errors.Wrap(err, "等待登录超时")
	}

	logrus.Info("今日头条登录成功！")
	return nil
}

func (a *LoginAction) FetchQrcodeImage(ctx context.Context) (string, bool, error) {
	pp := a.page.Context(ctx)

	logrus.Info("正在导航到今日头条创作者中心...")
	if err := pp.Navigate(toutiaoCreatorHome); err != nil {
		return "", false, errors.Wrap(err, "导航到今日头条创作者中心失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	loggedIn, _ := a.CheckLoginStatus(ctx)
	if loggedIn {
		logrus.Info("已经登录")
		return "", true, nil
	}

	qrcodeSelectors := []string{
		`.qrcode img`,
		`[class*="qrcode"] img`,
		`.login-qrcode img`,
		`canvas`,
	}

	for _, selector := range qrcodeSelectors {
		has, elem, err := pp.Has(selector)
		if err != nil {
			continue
		}
		if has && elem != nil {
			src, err := elem.Attribute("src")
			if err == nil && src != nil && len(*src) > 0 {
				logrus.Info("成功获取二维码图片")
				return *src, false, nil
			}
		}
	}

	screenshot, err := pp.Screenshot(false, nil)
	if err != nil {
		return "", false, errors.Wrap(err, "截图失败")
	}

	logrus.Info("使用页面截图作为二维码")
	return fmt.Sprintf("data:image/png;base64,%s", encodeBase64(screenshot)), false, nil
}

func (a *LoginAction) WaitForLogin(ctx context.Context) error {
	pp := a.page.Context(ctx)

	timeout := time.After(5 * time.Minute)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return errors.New("登录被取消")
		case <-timeout:
			return errors.New("等待登录超时（5分钟）")
		case <-ticker.C:
			loggedIn, err := a.checkLoginSuccess(pp)
			if err != nil {
				logrus.Debugf("检查登录状态失败: %v", err)
				continue
			}
			if loggedIn {
				return nil
			}
		}
	}
}

func (a *LoginAction) checkLoginSuccess(page *rod.Page) (bool, error) {
	loginIndicators := []string{
		`.user-info`,
		`.user-name`,
		`.avatar-wrapper`,
		`[class*="user-info"]`,
		`[class*="userName"]`,
		`[class*="account"]`,
	}

	for _, selector := range loginIndicators {
		has, _, err := page.Has(selector)
		if err != nil {
			continue
		}
		if has {
			logrus.Info("检测到登录成功标志")
			return true, nil
		}
	}

	currentURL := page.MustInfo().URL
	if currentURL != "" &&
		!containsString(currentURL, "login") &&
		containsString(currentURL, "mp.toutiao.com") {
		logrus.WithField("url", currentURL).Debug("URL已跳转到创作者中心")
		return true, nil
	}

	return false, nil
}

func encodeBase64(data []byte) string {
	const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
	result := make([]byte, 0, (len(data)+2)/3*4)

	for i := 0; i < len(data); i += 3 {
		var n uint32
		remaining := len(data) - i

		if remaining >= 3 {
			n = uint32(data[i])<<16 | uint32(data[i+1])<<8 | uint32(data[i+2])
			result = append(result, base64Chars[n>>18&0x3F], base64Chars[n>>12&0x3F], base64Chars[n>>6&0x3F], base64Chars[n&0x3F])
		} else if remaining == 2 {
			n = uint32(data[i])<<16 | uint32(data[i+1])<<8
			result = append(result, base64Chars[n>>18&0x3F], base64Chars[n>>12&0x3F], base64Chars[n>>6&0x3F], '=')
		} else {
			n = uint32(data[i]) << 16
			result = append(result, base64Chars[n>>18&0x3F], base64Chars[n>>12&0x3F], '=', '=')
		}
	}

	return string(result)
}

func containsString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
