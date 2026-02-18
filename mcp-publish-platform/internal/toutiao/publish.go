package toutiao

import (
	"context"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
	"github.com/go-rod/rod/lib/proto"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

type PublishAction struct {
	page *rod.Page
}

func NewPublishArticleAction(page *rod.Page) (*PublishAction, error) {
	pp := page.Timeout(300 * time.Second)

	logrus.Info("正在导航到今日头条文章发布页面...")
	if err := pp.Navigate(toutiaoArticleURL); err != nil {
		return nil, errors.Wrap(err, "导航到文章发布页面失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	if err := pp.WaitDOMStable(time.Second, 0.1); err != nil {
		logrus.Warnf("等待 DOM 稳定出现问题: %v", err)
	}

	time.Sleep(1 * time.Second)

	return &PublishAction{
		page: pp,
	}, nil
}

type PublishArticleContent struct {
	Title      string
	Content    string
	Tags       []string
	ImagePaths []string
	CoverPath  string
	Category   string
}

func (p *PublishAction) PublishArticle(ctx context.Context, content PublishArticleContent) error {
	if content.Title == "" {
		return errors.New("标题不能为空")
	}

	if content.Content == "" {
		return errors.New("内容不能为空")
	}

	page := p.page.Context(ctx)

	logrus.Info("开始填写文章标题...")
	if err := inputArticleTitle(page, content.Title); err != nil {
		return errors.Wrap(err, "填写标题失败")
	}

	time.Sleep(500 * time.Millisecond)

	logrus.Info("开始填写文章内容...")
	if err := inputArticleContent(page, content.Content); err != nil {
		return errors.Wrap(err, "填写内容失败")
	}

	time.Sleep(500 * time.Millisecond)

	if len(content.ImagePaths) > 0 {
		logrus.Info("开始上传图片...")
		if err := uploadArticleImages(page, content.ImagePaths); err != nil {
			logrus.Warnf("上传图片失败: %v", err)
		}
	}

	time.Sleep(500 * time.Millisecond)

	if len(content.Tags) > 0 {
		logrus.Info("开始添加标签...")
		if err := inputArticleTags(page, content.Tags); err != nil {
			logrus.Warnf("添加标签失败: %v", err)
		}
	}

	time.Sleep(1 * time.Second)

	logrus.Info("开始提交文章...")
	if err := submitArticle(page); err != nil {
		return errors.Wrap(err, "提交文章失败")
	}

	logrus.Info("今日头条文章发布成功！")
	return nil
}

func inputArticleTitle(page *rod.Page, title string) error {
	titleSelectors := []string{
		`input[placeholder*="标题"]`,
		`input[placeholder*="填写标题"]`,
		`.title-input input`,
		`[class*="title"] input`,
		`#title`,
	}

	var titleElem *rod.Element
	var err error
	for _, selector := range titleSelectors {
		titleElem, err = page.Element(selector)
		if err == nil && titleElem != nil {
			break
		}
	}

	if titleElem == nil {
		return errors.New("查找标题输入框失败")
	}

	if err := titleElem.Input(title); err != nil {
		return errors.Wrap(err, "输入标题失败")
	}

	logrus.Info("标题输入完成")
	return nil
}

func inputArticleContent(page *rod.Page, content string) error {
	contentSelectors := []string{
		`#content`,
		`textarea[placeholder*="正文"]`,
		`textarea[placeholder*="内容"]`,
		`.content-input textarea`,
		`.ql-editor`,
		`[contenteditable="true"]`,
	}

	var contentElem *rod.Element
	var err error
	for _, selector := range contentSelectors {
		contentElem, err = page.Element(selector)
		if err == nil && contentElem != nil {
			break
		}
	}

	if contentElem == nil {
		return errors.New("查找内容输入框失败")
	}

	if err := contentElem.Input(content); err != nil {
		return errors.Wrap(err, "输入内容失败")
	}

	logrus.Info("内容输入完成")
	return nil
}

func uploadArticleImages(page *rod.Page, imagePaths []string) error {
	validPaths := make([]string, 0, len(imagePaths))
	for _, path := range imagePaths {
		if _, err := os.Stat(path); os.IsNotExist(err) {
			logrus.Warnf("图片文件不存在: %s", path)
			continue
		}
		validPaths = append(validPaths, path)
	}

	if len(validPaths) == 0 {
		return nil
	}

	for i, path := range validPaths {
		selector := `input[type="file"]`
		uploadInput, err := page.Element(selector)
		if err != nil {
			return errors.Wrapf(err, "查找上传输入框失败(第%d张)", i+1)
		}

		if err := uploadInput.SetFiles([]string{path}); err != nil {
			return errors.Wrapf(err, "上传第%d张图片失败", i+1)
		}

		logrus.Infof("图片已提交上传: 第%d张", i+1)
		time.Sleep(1 * time.Second)
	}

	return nil
}

func inputArticleTags(page *rod.Page, tags []string) error {
	for _, tag := range tags {
		tag = strings.TrimLeft(tag, "#")

		tagSelectors := []string{
			`input[placeholder*="标签"]`,
			`input[placeholder*="话题"]`,
			`.tag-input input`,
			`[class*="tag"] input`,
		}

		var tagInput *rod.Element
		var err error
		for _, selector := range tagSelectors {
			tagInput, err = page.Element(selector)
			if err == nil && tagInput != nil {
				break
			}
		}

		if tagInput == nil {
			logrus.Warnf("未找到标签输入框，跳过标签: %s", tag)
			continue
		}

		if err := tagInput.Input(tag); err != nil {
			logrus.Warnf("输入标签失败: %s, %v", tag, err)
			continue
		}

		time.Sleep(300 * time.Millisecond)

		enterActions, err := tagInput.KeyActions()
		if err == nil {
			enterActions.Press(input.Enter).Do()
		}

		logrus.Infof("成功添加标签: %s", tag)
		time.Sleep(200 * time.Millisecond)
	}

	return nil
}

func submitArticle(page *rod.Page) error {
	publishSelectors := []string{
		`button[class*="publish"]`,
		`button[class*="submit"]`,
		`.publish-btn`,
		`.submit-btn`,
		`button:contains("发布")`,
		`button:contains("发表")`,
	}

	var publishBtn *rod.Element
	var err error
	for _, selector := range publishSelectors {
		publishBtn, err = page.Element(selector)
		if err == nil && publishBtn != nil {
			break
		}
	}

	if publishBtn == nil {
		return errors.New("查找发布按钮失败")
	}

	clickEmptyPositionToutiao(page)

	if err := publishBtn.Click(proto.InputMouseButtonLeft, 1); err != nil {
		return errors.Wrap(err, "点击发布按钮失败")
	}

	logrus.Info("已点击发布按钮")

	time.Sleep(3 * time.Second)

	return nil
}

func clickEmptyPositionToutiao(page *rod.Page) {
	x := 380 + rand.Intn(100)
	y := 20 + rand.Intn(60)
	page.Mouse.MustMoveTo(float64(x), float64(y)).MustClick(proto.InputMouseButtonLeft)
}

type VideoPublishAction struct {
	page *rod.Page
}

func NewPublishVideoAction(page *rod.Page) (*VideoPublishAction, error) {
	pp := page.Timeout(600 * time.Second)

	logrus.Info("正在导航到今日头条视频发布页面...")
	if err := pp.Navigate(toutiaoVideoURL); err != nil {
		return nil, errors.Wrap(err, "导航到视频发布页面失败")
	}

	if err := pp.WaitLoad(); err != nil {
		logrus.Warnf("等待页面加载出现问题: %v", err)
	}

	time.Sleep(2 * time.Second)

	return &VideoPublishAction{
		page: pp,
	}, nil
}

type PublishVideoContent struct {
	Title       string
	Description string
	Tags        []string
	VideoPath   string
	CoverPath   string
}

func (p *VideoPublishAction) PublishVideo(ctx context.Context, content PublishVideoContent) error {
	if content.VideoPath == "" {
		return errors.New("视频路径不能为空")
	}

	if _, err := os.Stat(content.VideoPath); os.IsNotExist(err) {
		return errors.Wrapf(err, "视频文件不存在: %s", content.VideoPath)
	}

	page := p.page.Context(ctx)

	logrus.Info("开始上传视频...")
	if err := uploadVideoToutiao(page, content.VideoPath); err != nil {
		return errors.Wrap(err, "上传视频失败")
	}

	logrus.Info("等待视频处理完成...")
	if err := waitForVideoProcessingToutiao(page); err != nil {
		return errors.Wrap(err, "视频处理失败")
	}

	logrus.Infof("填写视频信息: title=%s", content.Title)

	if err := fillVideoInfoToutiao(page, content.Title, content.Description, content.Tags); err != nil {
		return errors.Wrap(err, "填写视频信息失败")
	}

	logrus.Info("今日头条视频发布成功！")
	return nil
}

func uploadVideoToutiao(page *rod.Page, videoPath string) error {
	selectors := []string{
		`input[type="file"]`,
		`.upload-input`,
		`[class*="upload"] input[type="file"]`,
	}

	var uploadInput *rod.Element
	var err error
	for _, selector := range selectors {
		uploadInput, err = page.Element(selector)
		if err == nil && uploadInput != nil {
			break
		}
	}

	if uploadInput == nil {
		return errors.New("查找视频上传输入框失败")
	}

	if err := uploadInput.SetFiles([]string{videoPath}); err != nil {
		return errors.Wrap(err, "上传视频失败")
	}

	logrus.Info("视频已提交上传")
	return nil
}

func waitForVideoProcessingToutiao(page *rod.Page) error {
	maxWaitTime := 10 * time.Minute
	checkInterval := 3 * time.Second
	start := time.Now()

	for time.Since(start) < maxWaitTime {
		successSelectors := []string{
			`.video-preview`,
			`.upload-success`,
			`[class*="success"]`,
			`[class*="complete"]`,
		}

		for _, selector := range successSelectors {
			has, _, err := page.Has(selector)
			if err == nil && has {
				logrus.Info("视频处理完成")
				return nil
			}
		}

		time.Sleep(checkInterval)
	}

	return errors.New("视频处理超时(10分钟)")
}

func fillVideoInfoToutiao(page *rod.Page, title, description string, tags []string) error {
	titleSelectors := []string{
		`input[placeholder*="标题"]`,
		`input[placeholder*="填写标题"]`,
		`.title-input input`,
		`[class*="title"] input`,
	}

	var titleElem *rod.Element
	var err error
	for _, selector := range titleSelectors {
		titleElem, err = page.Element(selector)
		if err == nil && titleElem != nil {
			break
		}
	}

	if titleElem != nil {
		if err := titleElem.Input(title); err != nil {
			logrus.Warnf("输入标题失败: %v", err)
		} else {
			logrus.Info("标题输入完成")
		}
	}

	time.Sleep(500 * time.Millisecond)

	if description != "" {
		descSelectors := []string{
			`textarea[placeholder*="描述"]`,
			`textarea[placeholder*="简介"]`,
			`.desc-input textarea`,
			`[class*="desc"] textarea`,
		}

		var descElem *rod.Element
		for _, selector := range descSelectors {
			descElem, err = page.Element(selector)
			if err == nil && descElem != nil {
				break
			}
		}

		if descElem != nil {
			if err := descElem.Input(description); err != nil {
				logrus.Warnf("输入描述失败: %v", err)
			} else {
				logrus.Info("描述输入完成")
			}
		}
	}

	time.Sleep(500 * time.Millisecond)

	if len(tags) > 0 {
		if err := inputArticleTags(page, tags); err != nil {
			logrus.Warnf("添加标签失败: %v", err)
		}
	}

	time.Sleep(1 * time.Second)

	publishSelectors := []string{
		`button[class*="publish"]`,
		`button[class*="submit"]`,
		`.publish-btn`,
		`button:contains("发布")`,
	}

	var publishBtn *rod.Element
	for _, selector := range publishSelectors {
		publishBtn, err = page.Element(selector)
		if err == nil && publishBtn != nil {
			break
		}
	}

	if publishBtn != nil {
		clickEmptyPositionToutiao(page)
		if err := publishBtn.Click(proto.InputMouseButtonLeft, 1); err != nil {
			logrus.Warnf("点击发布按钮失败: %v", err)
		} else {
			logrus.Info("已点击发布按钮")
		}
	}

	time.Sleep(3 * time.Second)

	return nil
}

func (t *ToutiaoPlatform) PublishImageText(ctx context.Context, page *rod.Page, req *platform.ImageTextRequest) (*platform.PublishResponse, error) {
	publishAction, err := NewPublishArticleAction(page)
	if err != nil {
		return nil, err
	}

	content := PublishArticleContent{
		Title:      req.Title,
		Content:    req.Content,
		Tags:       req.Tags,
		ImagePaths: req.Images,
	}

	if err := publishAction.PublishArticle(ctx, content); err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}

	return &platform.PublishResponse{
		Success: true,
		Message: "今日头条文章发布成功",
	}, nil
}

func (t *ToutiaoPlatform) PublishVideo(ctx context.Context, page *rod.Page, req *platform.VideoRequest) (*platform.PublishResponse, error) {
	publishAction, err := NewPublishVideoAction(page)
	if err != nil {
		return nil, err
	}

	content := PublishVideoContent{
		Title:       req.Title,
		Description: req.Description,
		Tags:        req.Tags,
		VideoPath:   req.VideoPath,
		CoverPath:   req.CoverPath,
	}

	if err := publishAction.PublishVideo(ctx, content); err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}

	return &platform.PublishResponse{
		Success: true,
		Message: "今日头条视频发布成功",
	}, nil
}
