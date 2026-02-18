package toutiao

import (
	"context"
	"fmt"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/proto"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

type ToutiaoPlatform struct {
	config *platform.PlatformConfig
}

func New() *ToutiaoPlatform {
	return &ToutiaoPlatform{
		config: &platform.PlatformConfig{
			ID:           platform.PlatformToutiao,
			Name:         "今日头条",
			BaseURL:      "https://mp.toutiao.com",
			LoginURL:     "https://mp.toutiao.com/",
			PublishURL:   "https://mp.toutiao.com/publish",
			UserAgent:    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			Timeout:      60,
			MaxImages:    20,
			MaxVideoSize: 1024,
			SupportedTypes: []string{"article", "video"},
			Features: platform.PlatformFeatures{
				SupportImageText: true,
				SupportVideo:     true,
				SupportSchedule:  true,
				SupportTags:      true,
				SupportComment:   true,
				SupportLike:      true,
				SupportCollect:   true,
			},
		},
	}
}

func (t *ToutiaoPlatform) ID() platform.PlatformID {
	return platform.PlatformToutiao
}

func (t *ToutiaoPlatform) Name() string {
	return "今日头条"
}

func (t *ToutiaoPlatform) BaseURL() string {
	return "https://mp.toutiao.com"
}

func (t *ToutiaoPlatform) Login(ctx context.Context, page *rod.Page) error {
	loginAction := NewLogin(page)
	return loginAction.Login(ctx)
}

func (t *ToutiaoPlatform) CheckLogin(ctx context.Context, page *rod.Page) (bool, error) {
	loginAction := NewLogin(page)
	return loginAction.CheckLoginStatus(ctx)
}

func (t *ToutiaoPlatform) Logout(ctx context.Context, page *rod.Page) error {
	logrus.Info("今日头条退出登录...")

	pp := page.Context(ctx)

	if err := pp.Navigate("https://mp.toutiao.com/logout"); err != nil {
		return errors.Wrap(err, "导航到退出页面失败")
	}

	time.Sleep(2 * time.Second)

	logrus.Info("今日头条已退出登录")
	return nil
}

func (t *ToutiaoPlatform) GetFeeds(ctx context.Context, page *rod.Page, req *platform.GetFeedsRequest) (*platform.GetFeedsResponse, error) {
	logrus.Info("获取今日头条内容列表...")

	pp := page.Context(ctx)

	manageURL := "https://mp.toutiao.com/content/manage"
	if err := pp.Navigate(manageURL); err != nil {
		return nil, errors.Wrap(err, "导航到内容管理页面失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	feedSelectors := []string{
		`.content-item`,
		`.article-item`,
		`[class*="content"] [class*="item"]`,
		`[class*="article-list"] [class*="item"]`,
	}

	var feeds []platform.FeedItem

	for _, selector := range feedSelectors {
		elements, err := pp.Elements(selector)
		if err != nil {
			continue
		}

		if len(elements) > 0 {
			logrus.Infof("找到 %d 个内容项", len(elements))

			for _, elem := range elements {
				feed := parseToutiaoFeedItem(elem)
				if feed.FeedID != "" {
					feeds = append(feeds, feed)
				}
			}
			break
		}
	}

	if len(feeds) == 0 {
		logrus.Info("未找到内容项，返回空列表")
	}

	return &platform.GetFeedsResponse{
		Total:    len(feeds),
		Page:     req.Page,
		PageSize: req.PageSize,
		Feeds:    feeds,
	}, nil
}

func parseToutiaoFeedItem(elem *rod.Element) platform.FeedItem {
	feed := platform.FeedItem{}

	titleSelectors := []string{
		`.title`,
		`[class*="title"]`,
		`h3`,
		`h4`,
	}

	for _, selector := range titleSelectors {
		titleElem, err := elem.Element(selector)
		if err == nil && titleElem != nil {
			text, err := titleElem.Text()
			if err == nil && text != "" {
				feed.Title = text
				break
			}
		}
	}

	idSelectors := []string{
		`[data-id]`,
		`[data-article-id]`,
		`[data-content-id]`,
	}

	for _, selector := range idSelectors {
		idElem, err := elem.Element(selector)
		if err == nil && idElem != nil {
			id, err := idElem.Attribute("data-id")
			if err == nil && id != nil {
				feed.FeedID = *id
				break
			}
			id, _ = idElem.Attribute("data-article-id")
			if id != nil {
				feed.FeedID = *id
				break
			}
			id, _ = idElem.Attribute("data-content-id")
			if id != nil {
				feed.FeedID = *id
				break
			}
		}
	}

	feed.FeedType = "article"
	feed.Status = "published"

	return feed
}

func (t *ToutiaoPlatform) GetFeedDetail(ctx context.Context, page *rod.Page, feedID string) (*platform.FeedDetail, error) {
	logrus.Infof("获取今日头条内容详情: %s", feedID)

	pp := page.Context(ctx)

	detailURL := fmt.Sprintf("https://mp.toutiao.com/content/detail?article_id=%s", feedID)
	if err := pp.Navigate(detailURL); err != nil {
		return nil, errors.Wrap(err, "导航到内容详情页面失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	detail := &platform.FeedDetail{
		FeedItem: platform.FeedItem{
			FeedID:   feedID,
			FeedType: "article",
			Status:   "published",
		},
	}

	titleSelectors := []string{
		`.article-title`,
		`[class*="title"]`,
		`h1`,
		`h2`,
	}

	for _, selector := range titleSelectors {
		titleElem, err := pp.Element(selector)
		if err == nil && titleElem != nil {
			text, err := titleElem.Text()
			if err == nil && text != "" {
				detail.Title = text
				break
			}
		}
	}

	return detail, nil
}

func (t *ToutiaoPlatform) Like(ctx context.Context, page *rod.Page, feedID string) error {
	logrus.Infof("今日头条点赞: %s", feedID)

	pp := page.Context(ctx)

	articleURL := fmt.Sprintf("https://www.toutiao.com/article/%s", feedID)
	if err := pp.Navigate(articleURL); err != nil {
		return errors.Wrap(err, "导航到文章页面失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	likeSelectors := []string{
		`.like-button`,
		`[class*="like"]`,
		`[class*="digg"]`,
	}

	for _, selector := range likeSelectors {
		likeBtn, err := pp.Element(selector)
		if err == nil && likeBtn != nil {
			if err := likeBtn.Click(proto.InputMouseButtonLeft, 1); err == nil {
				logrus.Info("点赞成功")
				return nil
			}
		}
	}

	return errors.New("未找到点赞按钮")
}

func (t *ToutiaoPlatform) Comment(ctx context.Context, page *rod.Page, feedID string, content string) error {
	logrus.Infof("今日头条评论: %s", feedID)

	pp := page.Context(ctx)

	articleURL := fmt.Sprintf("https://www.toutiao.com/article/%s", feedID)
	if err := pp.Navigate(articleURL); err != nil {
		return errors.Wrap(err, "导航到文章页面失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	commentInputSelectors := []string{
		`textarea[placeholder*="评论"]`,
		`[class*="comment"] input`,
		`[class*="comment"] textarea`,
	}

	var commentInput *rod.Element
	var err error
	for _, selector := range commentInputSelectors {
		commentInput, err = pp.Element(selector)
		if err == nil && commentInput != nil {
			break
		}
	}

	if commentInput == nil {
		return errors.New("未找到评论输入框")
	}

	if err := commentInput.Input(content); err != nil {
		return errors.Wrap(err, "输入评论失败")
	}

	time.Sleep(500 * time.Millisecond)

	submitSelectors := []string{
		`[class*="comment"] button[type="submit"]`,
		`[class*="comment"] button`,
		`button:contains("发送")`,
		`button:contains("发布")`,
	}

	for _, selector := range submitSelectors {
		submitBtn, err := pp.Element(selector)
		if err == nil && submitBtn != nil {
			if err := submitBtn.Click(proto.InputMouseButtonLeft, 1); err == nil {
				logrus.Info("评论成功")
				return nil
			}
		}
	}

	return errors.New("未找到评论提交按钮")
}

func (t *ToutiaoPlatform) Collect(ctx context.Context, page *rod.Page, feedID string) error {
	logrus.Infof("今日头条收藏: %s", feedID)

	pp := page.Context(ctx)

	articleURL := fmt.Sprintf("https://www.toutiao.com/article/%s", feedID)
	if err := pp.Navigate(articleURL); err != nil {
		return errors.Wrap(err, "导航到文章页面失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	collectSelectors := []string{
		`.collect-button`,
		`[class*="collect"]`,
		`[class*="favorite"]`,
		`[class*="bookmark"]`,
	}

	for _, selector := range collectSelectors {
		collectBtn, err := pp.Element(selector)
		if err == nil && collectBtn != nil {
			if err := collectBtn.Click(proto.InputMouseButtonLeft, 1); err == nil {
				logrus.Info("收藏成功")
				return nil
			}
		}
	}

	return errors.New("未找到收藏按钮")
}

func (t *ToutiaoPlatform) GetPlatformConfig() *platform.PlatformConfig {
	return t.config
}
