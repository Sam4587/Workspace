package douyin

import (
	"context"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/proto"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"github.com/xpzouying/xiaohongshu-mcp/internal/platform"
)

type PublishAction struct {
	page *rod.Page
}

func NewPublishImageAction(page *rod.Page) (*PublishAction, error) {
	pp := page.Timeout(300 * time.Second)

	logrus.Info("正在导航到抖音发布页面...")
	if err := pp.Navigate(douyinPublishURL); err != nil {
		return nil, errors.Wrap(err, "导航到发布页面失败")
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

type PublishImageContent struct {
	Title        string
	Content      string
	Tags         []string
	ImagePaths   []string
	ScheduleTime *time.Time
}

func (p *PublishAction) Publish(ctx context.Context, content PublishImageContent) error {
	if len(content.ImagePaths) == 0 {
		return errors.New("图片不能为空")
	}

	page := p.page.Context(ctx)

	logrus.Info("开始上传图片...")
	if err := uploadImagesDouyin(page, content.ImagePaths); err != nil {
		return errors.Wrap(err, "抖音上传图片失败")
	}

	tags := content.Tags
	if len(tags) > 5 {
		logrus.Warnf("抖音标签数量超过5，截取前5个标签")
		tags = tags[:5]
	}

	logrus.Infof("发布内容: title=%s, images=%d, tags=%v", content.Title, len(content.ImagePaths), tags)

	if err := submitPublishDouyin(page, content.Title, content.Content, tags); err != nil {
		return errors.Wrap(err, "抖音发布失败")
	}

	logrus.Info("抖音图文发布成功！")
	return nil
}

func uploadImagesDouyin(page *rod.Page, imagePaths []string) error {
	validPaths := make([]string, 0, len(imagePaths))
	for _, path := range imagePaths {
		if _, err := os.Stat(path); os.IsNotExist(err) {
			logrus.Warnf("图片文件不存在: %s", path)
			continue
		}
		validPaths = append(validPaths, path)
		logrus.Infof("有效图片: %s", path)
	}

	if len(validPaths) == 0 {
		return errors.New("没有有效的图片文件")
	}

	for i, path := range validPaths {
		selector := `input[type="file"]`
		if i == 0 {
			selectors := []string{
				`.upload-input`,
				`input[type="file"]`,
				`.upload-btn input`,
				`[class*="upload"] input[type="file"]`,
			}
			for _, s := range selectors {
				has, elem, err := page.Has(s)
				if err == nil && has && elem != nil {
					selector = s
					break
				}
			}
		}

		uploadInput, err := page.Element(selector)
		if err != nil {
			return errors.Wrapf(err, "查找上传输入框失败(第%d张)", i+1)
		}

		if err := uploadInput.SetFiles([]string{path}); err != nil {
			return errors.Wrapf(err, "上传第%d张图片失败", i+1)
		}

		logrus.Infof("图片已提交上传: 第%d张, 路径: %s", i+1, path)

		if err := waitForDouyinUploadComplete(page, i+1); err != nil {
			return errors.Wrapf(err, "第%d张图片上传超时", i+1)
		}

		time.Sleep(1 * time.Second)
	}

	return nil
}

func waitForDouyinUploadComplete(page *rod.Page, expectedCount int) error {
	maxWaitTime := 60 * time.Second
	checkInterval := 500 * time.Millisecond
	start := time.Now()

	selectors := []string{
		`.image-preview`,
		`.preview-image`,
		`.upload-preview img`,
		`[class*="preview"] img`,
		`[class*="image-item"]`,
	}

	for time.Since(start) < maxWaitTime {
		for _, selector := range selectors {
			elements, err := page.Elements(selector)
			if err != nil {
				continue
			}

			currentCount := len(elements)
			if currentCount >= expectedCount {
				logrus.Infof("图片上传完成: %d张", currentCount)
				return nil
			}
		}

		time.Sleep(checkInterval)
	}

	return errors.Errorf("第%d张图片上传超时(60s)", expectedCount)
}

func submitPublishDouyin(page *rod.Page, title, content string, tags []string) error {
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

	if titleElem == nil {
		return errors.New("查找标题输入框失败")
	}

	if err := titleElem.Input(title); err != nil {
		return errors.Wrap(err, "输入标题失败")
	}

	logrus.Info("标题输入完成")

	time.Sleep(500 * time.Millisecond)

	contentSelectors := []string{
		`textarea[placeholder*="描述"]`,
		`textarea[placeholder*="内容"]`,
		`.content-input textarea`,
		`[class*="desc"] textarea`,
		`.ql-editor`,
	}

	var contentElem *rod.Element
	for _, selector := range contentSelectors {
		contentElem, err = page.Element(selector)
		if err == nil && contentElem != nil {
			break
		}
	}

	if contentElem != nil {
		if err := contentElem.Input(content); err != nil {
			logrus.Warnf("输入内容失败: %v", err)
		} else {
			logrus.Info("内容输入完成")
		}
	}

	time.Sleep(500 * time.Millisecond)

	if len(tags) > 0 {
		if err := inputTagsDouyin(page, tags); err != nil {
			logrus.Warnf("添加标签失败: %v", err)
		}
	}

	time.Sleep(1 * time.Second)

	publishSelectors := []string{
		`button[class*="publish"]`,
		`button[class*="submit"]`,
		`.publish-btn`,
		`.submit-btn`,
		`button:contains("发布")`,
		`button:contains("发表")`,
	}

	var publishBtn *rod.Element
	for _, selector := range publishSelectors {
		publishBtn, err = page.Element(selector)
		if err == nil && publishBtn != nil {
			break
		}
	}

	if publishBtn == nil {
		return errors.New("查找发布按钮失败")
	}

	clickEmptyPositionDouyin(page)

	if err := publishBtn.Click(proto.InputMouseButtonLeft, 1); err != nil {
		return errors.Wrap(err, "点击发布按钮失败")
	}

	logrus.Info("已点击发布按钮")

	time.Sleep(3 * time.Second)

	return nil
}

func inputTagsDouyin(page *rod.Page, tags []string) error {
	for _, tag := range tags {
		tag = strings.TrimLeft(tag, "#")

		tagSelectors := []string{
			`input[placeholder*="话题"]`,
			`input[placeholder*="标签"]`,
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

		if err := tagInput.Input("#" + tag); err != nil {
			logrus.Warnf("输入标签失败: %s, %v", tag, err)
			continue
		}

		time.Sleep(500 * time.Millisecond)

		topicSelectors := []string{
			`.topic-item`,
			`.tag-item`,
			`[class*="topic"] li`,
			`[class*="suggestion"] li`,
		}

		var firstItem *rod.Element
		for _, selector := range topicSelectors {
			firstItem, err = page.Element(selector)
			if err == nil && firstItem != nil {
				break
			}
		}

		if firstItem != nil {
			if err := firstItem.Click(proto.InputMouseButtonLeft, 1); err != nil {
				logrus.Warnf("点击标签选项失败: %v", err)
			} else {
				logrus.Infof("成功添加标签: #%s", tag)
			}
		}

		time.Sleep(300 * time.Millisecond)
	}

	return nil
}

func clickEmptyPositionDouyin(page *rod.Page) {
	x := 380 + rand.Intn(100)
	y := 20 + rand.Intn(60)
	page.Mouse.MustMoveTo(float64(x), float64(y)).MustClick(proto.InputMouseButtonLeft)
}

type VideoPublishAction struct {
	page *rod.Page
}

func NewPublishVideoAction(page *rod.Page) (*VideoPublishAction, error) {
	pp := page.Timeout(600 * time.Second)

	logrus.Info("正在导航到抖音视频发布页面...")
	if err := pp.Navigate(douyinVideoPublish); err != nil {
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
	Title        string
	Description  string
	Tags         []string
	VideoPath    string
	CoverPath    string
	ScheduleTime *time.Time
}

func (p *VideoPublishAction) Publish(ctx context.Context, content PublishVideoContent) error {
	if content.VideoPath == "" {
		return errors.New("视频路径不能为空")
	}

	if _, err := os.Stat(content.VideoPath); os.IsNotExist(err) {
		return errors.Wrapf(err, "视频文件不存在: %s", content.VideoPath)
	}

	page := p.page.Context(ctx)

	logrus.Info("开始上传视频...")
	if err := uploadVideoDouyin(page, content.VideoPath); err != nil {
		return errors.Wrap(err, "抖音上传视频失败")
	}

	logrus.Info("等待视频处理完成...")
	if err := waitForVideoProcessing(page); err != nil {
		return errors.Wrap(err, "视频处理失败")
	}

	logrus.Infof("填写视频信息: title=%s", content.Title)

	if err := fillVideoInfo(page, content.Title, content.Description, content.Tags); err != nil {
		return errors.Wrap(err, "填写视频信息失败")
	}

	logrus.Info("抖音视频发布成功！")
	return nil
}

func uploadVideoDouyin(page *rod.Page, videoPath string) error {
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

func waitForVideoProcessing(page *rod.Page) error {
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

		processingSelectors := []string{
			`.uploading`,
			`.processing`,
			`[class*="progress"]`,
		}

		for _, selector := range processingSelectors {
			has, elem, err := page.Has(selector)
			if err == nil && has && elem != nil {
				text, _ := elem.Text()
				logrus.Debugf("视频处理中: %s", text)
			}
		}

		time.Sleep(checkInterval)
	}

	return errors.New("视频处理超时(10分钟)")
}

func fillVideoInfo(page *rod.Page, title, description string, tags []string) error {
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
		if err := inputTagsDouyin(page, tags); err != nil {
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
		clickEmptyPositionDouyin(page)
		if err := publishBtn.Click(proto.InputMouseButtonLeft, 1); err != nil {
			logrus.Warnf("点击发布按钮失败: %v", err)
		} else {
			logrus.Info("已点击发布按钮")
		}
	}

	time.Sleep(3 * time.Second)

	return nil
}

func (d *DouyinPlatform) PublishImageText(ctx context.Context, page *rod.Page, req *platform.ImageTextRequest) (*platform.PublishResponse, error) {
	publishAction, err := NewPublishImageAction(page)
	if err != nil {
		return nil, err
	}

	content := PublishImageContent{
		Title:      req.Title,
		Content:    req.Content,
		Tags:       req.Tags,
		ImagePaths: req.Images,
	}

	if req.ScheduleAt != "" {
		t, err := time.Parse(time.RFC3339, req.ScheduleAt)
		if err == nil {
			content.ScheduleTime = &t
		}
	}

	if err := publishAction.Publish(ctx, content); err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}

	return &platform.PublishResponse{
		Success: true,
		Message: "抖音图文发布成功",
	}, nil
}

func (d *DouyinPlatform) PublishVideo(ctx context.Context, page *rod.Page, req *platform.VideoRequest) (*platform.PublishResponse, error) {
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

	if req.ScheduleAt != "" {
		t, err := time.Parse(time.RFC3339, req.ScheduleAt)
		if err == nil {
			content.ScheduleTime = &t
		}
	}

	if err := publishAction.Publish(ctx, content); err != nil {
		return &platform.PublishResponse{
			Success: false,
			Error:   err.Error(),
		}, err
	}

	return &platform.PublishResponse{
		Success: true,
		Message: "抖音视频发布成功",
	}, nil
}
