// Package adapters 提供各平台的发布器适配器实现
package adapters

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/proto"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"

	"github.com/monkeycode/publisher-core/browser"
	"github.com/monkeycode/publisher-core/cookies"
	publisher "github.com/monkeycode/publisher-core/interfaces"
	"github.com/monkeycode/publisher-core/storage"
	"github.com/monkeycode/publisher-core/task"
)

// BaseAdapter 基础适配器
type BaseAdapter struct {
	mu         sync.Mutex
	browser    *browser.Browser
	cookieMgr  *cookies.Manager
	taskMgr    *task.TaskManager
	storage    storage.Storage

	platform   string
	loginURL   string
	publishURL string
	limits     publisher.ContentLimits
	cookieKeys []string
	domain     string

	headless  bool
	cookieDir string
}

// NewBaseAdapter 创建基础适配器
func NewBaseAdapter(platform string, opts *publisher.Options) *BaseAdapter {
	if opts == nil {
		opts = publisher.DefaultOptions()
	}
	if opts.CookieDir == "" {
		opts.CookieDir = "./cookies"
	}

	return &BaseAdapter{
		platform:   platform,
		headless:   opts.Headless,
		cookieDir:  opts.CookieDir,
		cookieMgr:  cookies.NewManager(opts.CookieDir),
		taskMgr:    task.NewTaskManager(task.NewMemoryStorage()),
		storage:    nil, // Storage 可以通过其他方式注入
	}
}

// Platform 返回平台名称
func (a *BaseAdapter) Platform() string {
	return a.platform
}

// initBrowser 初始化浏览器
func (a *BaseAdapter) initBrowser() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.browser == nil {
		a.browser = browser.NewBrowser(&browser.Config{
			Headless: a.headless,
		})
	}
	return nil
}

// Login 执行登录
func (a *BaseAdapter) Login(ctx context.Context) (*publisher.LoginResult, error) {
	if err := a.initBrowser(); err != nil {
		return nil, err
	}

	// 检查是否已登录
	loggedIn, err := a.CheckLoginStatus(ctx)
	if err != nil {
		logrus.Warnf("[%s] 检查登录状态失败: %v", a.platform, err)
	}

	if loggedIn {
		logrus.Infof("[%s] 已登录", a.platform)
		return &publisher.LoginResult{Success: true}, nil
	}

	// 创建页面
	page := a.browser.MustPage()
	defer page.Close()

	// 导航到登录页面
	helper := browser.NewPageHelper(page)
	if err := helper.Navigate(a.loginURL); err != nil {
		return nil, errors.Wrap(err, "导航到登录页面失败")
	}

	// 等待页面加载
	time.Sleep(2 * time.Second)

	// 检查是否需要扫码
	qrcodeURL, err := a.getQrcodeURL(page)
	if err != nil {
		logrus.Warnf("[%s] 获取二维码失败: %v", a.platform, err)
	}

	return &publisher.LoginResult{
		Success:   false,
		QrcodeURL: qrcodeURL,
	}, nil
}

// WaitForLogin 等待登录完成
func (a *BaseAdapter) WaitForLogin(ctx context.Context) error {
	if err := a.initBrowser(); err != nil {
		return err
	}

	page := a.browser.MustPage()
	defer page.Close()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	loginCheckSelector := a.getLoginCheckSelector()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			has, _, _ := page.Has(loginCheckSelector)
			if has {
				// 登录成功，提取并保存 Cookie
				cookiesData, err := page.Cookies([]string{})
				if err != nil {
					return errors.Wrap(err, "获取 Cookie 失败")
				}

				// 提取关键 Cookie
				keyCookies := cookies.ExtractCookies(cookiesData, a.cookieKeys)
				if len(keyCookies) == 0 {
					logrus.Warnf("[%s] 未找到关键 Cookie", a.platform)
					continue
				}

				// 保存 Cookie
				if err := a.cookieMgr.Save(ctx, a.platform, cookiesData); err != nil {
					return errors.Wrap(err, "保存 Cookie 失败")
				}

				logrus.Infof("[%s] 登录成功，已保存 %d 个 Cookie", a.platform, len(keyCookies))
				return nil
			}
		}
	}
}

// CheckLoginStatus 检查登录状态
func (a *BaseAdapter) CheckLoginStatus(ctx context.Context) (bool, error) {
	// 检查 Cookie 是否存在
	exists, err := a.cookieMgr.Exists(ctx, a.platform)
	if err != nil {
		return false, err
	}

// Logout 登出平台
func (a *BaseAdapter) Logout(ctx context.Context) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	logrus.Infof("[%s] 执行登出操作", a.platform)

	// 删除 Cookie
	if err := a.cookieMgr.Delete(ctx, a.platform); err != nil {
		logrus.Warnf("[%s] 删除 Cookie 失败: %v", a.platform, err)
		return err
	}

	logrus.Infof("[%s] 登出成功", a.platform)
	return nil
}


	if !exists {
		return false, nil
	}

	// 可以进一步验证 Cookie 是否有效
	// 这里简化处理，只检查文件是否存在
	return true, nil
}

// Publish 同步发布
func (a *BaseAdapter) Publish(ctx context.Context, content *publisher.Content) (*publisher.PublishResult, error) {
	if err := a.validateContent(content); err != nil {
		return nil, err
	}

	taskID := fmt.Sprintf("%s_%d", a.platform, time.Now().UnixNano())
	result := &publisher.PublishResult{
		TaskID:    taskID,
		Status:    publisher.StatusProcessing,
		Platform:  a.platform,
		CreatedAt: time.Now(),
	}

	// 执行发布
	err := a.doPublish(ctx, content)
	if err != nil {
		result.Status = publisher.StatusFailed
		result.Error = err.Error()
		return result, err
	}

	result.Status = publisher.StatusSuccess
	now := time.Now()
	result.FinishedAt = &now

	return result, nil
}

// PublishAsync 异步发布
func (a *BaseAdapter) PublishAsync(ctx context.Context, content *publisher.Content) (string, error) {
	if err := a.validateContent(content); err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"title":  content.Title,
		"body":   content.Body,
		"type":   content.Type,
		"images": content.ImagePaths,
		"video":  content.VideoPath,
		"tags":   content.Tags,
	}

	t, err := a.taskMgr.CreateTask("publish", a.platform, payload)
	if err != nil {
		return "", err
	}

	// 异步执行
	go a.taskMgr.Execute(context.Background(), t.ID)

	return t.ID, nil
}

// QueryStatus 查询任务状态
func (a *BaseAdapter) QueryStatus(ctx context.Context, taskID string) (*publisher.PublishResult, error) {
	t, err := a.taskMgr.GetTask(taskID)
	if err != nil {
		return nil, err
	}

	result := &publisher.PublishResult{
		TaskID:    t.ID,
		Platform:  a.platform,
		CreatedAt: t.CreatedAt,
	}

	switch t.Status {
	case task.TaskStatusPending:
		result.Status = publisher.StatusPending
	case task.TaskStatusRunning:
		result.Status = publisher.StatusProcessing
	case task.TaskStatusCompleted:
		result.Status = publisher.StatusSuccess
		if t.FinishedAt != nil {
			result.FinishedAt = t.FinishedAt
		}
	case task.TaskStatusFailed:
		result.Status = publisher.StatusFailed
		result.Error = t.Error
	case task.TaskStatusCancelled:
		result.Status = publisher.StatusFailed
		result.Error = "任务已取消"
	}

	return result, nil
}

// Cancel 取消任务
func (a *BaseAdapter) Cancel(ctx context.Context, taskID string) error {
	return a.taskMgr.Cancel(taskID)
}

// Close 关闭适配器
func (a *BaseAdapter) Close() error {
	if a.browser != nil {
		return a.browser.Close()
	}
	return nil
}

// GetLimits 获取内容限制
func (a *BaseAdapter) GetLimits() publisher.ContentLimits {
	return a.limits
}

func (a *BaseAdapter) validateContent(content *publisher.Content) error {
	if content == nil {
		return fmt.Errorf("内容不能为空")
	}

	if len(content.Title) > a.limits.TitleMaxLength {
		return fmt.Errorf("标题超过最大长度 %d", a.limits.TitleMaxLength)
	}

	if len(content.Body) > a.limits.BodyMaxLength {
		return fmt.Errorf("正文超过最大长度 %d", a.limits.BodyMaxLength)
	}

	if content.Type == publisher.ContentTypeImages && len(content.ImagePaths) == 0 {
		return fmt.Errorf("图文内容必须包含图片")
	}

	if content.Type == publisher.ContentTypeVideo && content.VideoPath == "" {
		return fmt.Errorf("视频内容必须包含视频")
	}

	return nil
}

func (a *BaseAdapter) getQrcodeURL(page *rod.Page) (string, error) {
	// 子类实现
	return "", nil
}

func (a *BaseAdapter) getLoginCheckSelector() string {
	// 子类实现
	return ""
}

func (a *BaseAdapter) doPublish(ctx context.Context, content *publisher.Content) error {
	// 子类实现
	return nil
}

// ============== 抖音适配器 ==============

// DouyinAdapter 抖音发布器适配器
type DouyinAdapter struct {
	BaseAdapter
}

// NewDouyinAdapter 创建抖音适配器
func NewDouyinAdapter(opts *publisher.Options) *DouyinAdapter {
	base := NewBaseAdapter("douyin", opts)
	base.loginURL = "https://creator.douyin.com/creator-micro/content/publish"
	base.publishURL = "https://creator.douyin.com/creator-micro/content/publish"
	base.domain = ".douyin.com"
	base.cookieKeys = cookies.DouyinCookieKeys
	base.limits = publisher.ContentLimits{
		TitleMaxLength:      30,
		BodyMaxLength:       2000,
		MaxImages:           12,
		MaxVideoSize:        4 * 1024 * 1024 * 1024,
		MaxTags:             5,
		AllowedVideoFormats: []string{".mp4", ".mov", ".avi", ".mkv"},
		AllowedImageFormats: []string{".jpg", ".jpeg", ".png", ".webp"},
	}

	return &DouyinAdapter{BaseAdapter: *base}
}

func (a *DouyinAdapter) getQrcodeURL(page *rod.Page) (string, error) {
	// 检查是否已登录
	has, elem, err := page.Has(".login-avatar")
	if err == nil && has {
		return "", nil
	}

	// 获取二维码
	elem, err = page.Element(".qrcode-img")
	if err != nil {
		return "", errors.Wrap(err, "查找二维码元素失败")
	}

	src, err := elem.Attribute("src")
	if err != nil || src == nil {
		return "", errors.New("获取二维码链接失败")
	}

	return *src, nil
}

func (a *DouyinAdapter) getLoginCheckSelector() string {
	return ".login-avatar"
}

func (a *DouyinAdapter) doPublish(ctx context.Context, content *publisher.Content) error {
	if err := a.initBrowser(); err != nil {
		return err
	}

	// 加载 Cookie
	cookieParams, err := a.cookieMgr.LoadAsProto(ctx, a.platform, a.domain)
	if err != nil {
		return errors.Wrap(err, "加载 Cookie 失败")
	}

	page := a.browser.MustPage()
	defer page.Close()

	// 设置 Cookie
	if len(cookieParams) > 0 {
		if err := page.SetCookies(cookieParams); err != nil {
			logrus.Warnf("[%s] 设置 Cookie 失败: %v", a.platform, err)
		}
	}

	helper := browser.NewPageHelper(page)

	// 导航到发布页面
	if err := helper.Navigate(a.publishURL); err != nil {
		return errors.Wrap(err, "导航到发布页面失败")
	}

	time.Sleep(3 * time.Second)

	// 检查登录状态
	has, _, _ := page.Has(".login-avatar")
	if !has {
		return errors.New("未登录，请先执行登录")
	}

	// 上传文件
	if content.Type == publisher.ContentTypeVideo {
		if err := a.uploadVideo(page, content.VideoPath); err != nil {
			return errors.Wrap(err, "上传视频失败")
		}
	} else {
		if err := a.uploadImages(page, content.ImagePaths); err != nil {
			return errors.Wrap(err, "上传图片失败")
		}
	}

	// 填写内容
	if err := a.fillContent(page, content); err != nil {
		return errors.Wrap(err, "填写内容失败")
	}

	// 发布
	if err := a.submitPublish(page); err != nil {
		return errors.Wrap(err, "发布失败")
	}

	logrus.Infof("[%s] 发布成功", a.platform)
	return nil
}

func (a *DouyinAdapter) uploadVideo(page *rod.Page, videoPath string) error {
	// 检查文件是否存在
	if _, err := os.Stat(videoPath); os.IsNotExist(err) {
		return fmt.Errorf("视频文件不存在: %s", videoPath)
	}

	logrus.Infof("[%s] 上传视频: %s", a.platform, videoPath)

	// 查找视频上传输入框
	fileInput, err := page.Element("input[type='file'][accept*='video']")
	if err != nil {
		return errors.Wrap(err, "查找视频上传输入框失败")
	}

	if err := fileInput.SetFiles([]string{videoPath}); err != nil {
		return errors.Wrap(err, "设置视频文件失败")
	}

	logrus.Infof("[%s] 等待视频上传...", a.platform)
	time.Sleep(5 * time.Second)

	return nil
}

func (a *DouyinAdapter) uploadImages(page *rod.Page, imagePaths []string) error {
	helper := browser.NewPageHelper(page)

	for i, imgPath := range imagePaths {
		if _, err := os.Stat(imgPath); os.IsNotExist(err) {
			return fmt.Errorf("图片文件不存在: %s", imgPath)
		}

		logrus.Infof("[%s] 上传图片 %d/%d: %s", a.platform, i+1, len(imagePaths), imgPath)

		fileInput, err := page.Element("input[type='file'][accept*='image']")
		if err != nil {
			return errors.Wrap(err, "查找图片上传输入框失败")
		}

		if err := fileInput.SetFiles([]string{imgPath}); err != nil {
			return errors.Wrap(err, "设置图片文件失败")
		}

		helper.RandomDelay(1, 2)
	}

	return nil
}

func (a *DouyinAdapter) fillContent(page *rod.Page, content *publisher.Content) error {
	helper := browser.NewPageHelper(page)

	// 填写标题
	titleInput, err := page.Element("input[placeholder*='标题']")
	if err == nil {
		if err := titleInput.Input(content.Title); err != nil {
			logrus.Warnf("[%s] 输入标题失败: %v", a.platform, err)
		}
		helper.RandomDelay(0.5, 1)
	}

	// 填写正文
	contentInput, err := page.Element("textarea[placeholder*='正文']")
	if err == nil {
		if err := contentInput.Input(content.Body); err != nil {
			logrus.Warnf("[%s] 输入正文失败: %v", a.platform, err)
		}
		helper.RandomDelay(0.5, 1)
	}

	// 填写标签
	for _, tag := range content.Tags {
		tagInput, err := page.Element("input[placeholder*='话题']")
		if err != nil {
			logrus.Warnf("[%s] 查找话题输入框失败: %v", a.platform, err)
			continue
		}

		tagInput.Input("#" + tag)
		time.Sleep(500 * time.Millisecond)
		helper.RandomDelay(0.3, 0.7)
	}

	return nil
}

func (a *DouyinAdapter) submitPublish(page *rod.Page) error {
	helper := browser.NewPageHelper(page)

	// 查找发布按钮
	publishBtn, err := page.Element("button[type='submit']")
	if err != nil {
		return errors.Wrap(err, "查找发布按钮失败")
	}

	vis, err := publishBtn.Visible()
	if err != nil || !vis {
		return errors.New("发布按钮不可见")
	}

	helper.RandomDelay(1, 2)

	if err := publishBtn.Click(proto.InputMouseButtonLeft, 1); err != nil {
		return errors.Wrap(err, "点击发布按钮失败")
	}

	logrus.Infof("[%s] 已点击发布按钮，等待完成...", a.platform)
	time.Sleep(5 * time.Second)

	return nil
}

// ============== 今日头条适配器 ==============

// ToutiaoAdapter 今日头条发布器适配器
type ToutiaoAdapter struct {
	DouyinAdapter
}

// NewToutiaoAdapter 创建今日头条适配器
func NewToutiaoAdapter(opts *publisher.Options) *ToutiaoAdapter {
	base := NewBaseAdapter("toutiao", opts)
	base.loginURL = "https://mp.toutiao.com/"
	base.publishURL = "https://mp.toutiao.com/profile_v4/pub_article"
	base.domain = ".toutiao.com"
	base.cookieKeys = cookies.ToutiaoCookieKeys

	return &ToutiaoAdapter{DouyinAdapter: DouyinAdapter{BaseAdapter: *base}}
}

func (a *ToutiaoAdapter) getLoginCheckSelector() string {
	return ".user-avatar"
}

func (a *ToutiaoAdapter) getQrcodeURL(page *rod.Page) (string, error) {
	has, elem, err := page.Has(".user-avatar")
	if err == nil && has {
		return "", nil
	}

	elem, err = page.Element(".qrcode-img, .qr-code")
	if err != nil {
		return "", errors.Wrap(err, "查找二维码元素失败")
	}

	src, err := elem.Attribute("src")
	if err != nil || src == nil {
		return "", errors.New("获取二维码链接失败")
	}

	return *src, nil
}

// ============== 小红书适配器 ==============

// XiaohongshuAdapter 小红书发布器适配器
type XiaohongshuAdapter struct {
	BaseAdapter
}

// NewXiaohongshuAdapter 创建小红书适配器
func NewXiaohongshuAdapter(opts *publisher.Options) *XiaohongshuAdapter {
	base := NewBaseAdapter("xiaohongshu", opts)
	base.loginURL = "https://creator.xiaohongshu.com/"
	base.publishURL = "https://creator.xiaohongshu.com/publish/publish"
	base.domain = ".xiaohongshu.com"
	base.cookieKeys = cookies.XiaohongshuCookieKeys
	base.limits = publisher.ContentLimits{
		TitleMaxLength:      20,
		BodyMaxLength:       1000,
		MaxImages:           18,
		MaxVideoSize:        500 * 1024 * 1024,
		MaxTags:             5,
		AllowedVideoFormats: []string{".mp4", ".mov"},
		AllowedImageFormats: []string{".jpg", ".jpeg", ".png", ".webp"},
	}

	return &XiaohongshuAdapter{BaseAdapter: *base}
}

func (a *XiaohongshuAdapter) getLoginCheckSelector() string {
	return ".avatar-wrapper, .user-info"
}

func (a *XiaohongshuAdapter) getQrcodeURL(page *rod.Page) (string, error) {
	has, _, err := page.Has(".avatar-wrapper, .user-info")
	if err == nil && has {
		return "", nil
	}

	elem, err := page.Element(".qrcode-img, img[class*='qrcode']")
	if err != nil {
		return "", errors.Wrap(err, "查找二维码元素失败")
	}

	src, err := elem.Attribute("src")
	if err != nil || src == nil {
		return "", errors.New("获取二维码链接失败")
	}

	return *src, nil
}

func (a *XiaohongshuAdapter) doPublish(ctx context.Context, content *publisher.Content) error {
	if err := a.initBrowser(); err != nil {
		return err
	}

	cookieParams, err := a.cookieMgr.LoadAsProto(ctx, a.platform, a.domain)
	if err != nil {
		return errors.Wrap(err, "加载 Cookie 失败")
	}

	page := a.browser.MustPage()
	defer page.Close()

	if len(cookieParams) > 0 {
		if err := page.SetCookies(cookieParams); err != nil {
			logrus.Warnf("[%s] 设置 Cookie 失败: %v", a.platform, err)
		}
	}

	helper := browser.NewPageHelper(page)

	if err := helper.Navigate(a.publishURL); err != nil {
		return errors.Wrap(err, "导航到发布页面失败")
	}

	time.Sleep(3 * time.Second)

	// 检查登录状态
	has, _, _ := page.Has(".avatar-wrapper, .user-info")
	if !has {
		return errors.New("未登录，请先执行登录")
	}

	// 上传文件
	if content.Type == publisher.ContentTypeVideo {
		if err := a.uploadVideo(page, content.VideoPath); err != nil {
			return errors.Wrap(err, "上传视频失败")
		}
	} else {
		if err := a.uploadImages(page, content.ImagePaths); err != nil {
			return errors.Wrap(err, "上传图片失败")
		}
	}

	// 填写内容
	if err := a.fillContent(page, content); err != nil {
		return errors.Wrap(err, "填写内容失败")
	}

	// 发布
	if err := a.submitPublish(page); err != nil {
		return errors.Wrap(err, "发布失败")
	}

	logrus.Infof("[%s] 发布成功", a.platform)
	return nil
}

func (a *XiaohongshuAdapter) uploadVideo(page *rod.Page, videoPath string) error {
	if _, err := os.Stat(videoPath); os.IsNotExist(err) {
		return fmt.Errorf("视频文件不存在: %s", videoPath)
	}

	logrus.Infof("[%s] 上传视频: %s", a.platform, videoPath)

	fileInput, err := page.Element("input[type='file'][accept*='video']")
	if err != nil {
		return errors.Wrap(err, "查找视频上传输入框失败")
	}

	if err := fileInput.SetFiles([]string{videoPath}); err != nil {
		return errors.Wrap(err, "设置视频文件失败")
	}

	logrus.Infof("[%s] 等待视频上传...", a.platform)
	time.Sleep(5 * time.Second)

	return nil
}

func (a *XiaohongshuAdapter) uploadImages(page *rod.Page, imagePaths []string) error {
	helper := browser.NewPageHelper(page)

	for i, imgPath := range imagePaths {
		if _, err := os.Stat(imgPath); os.IsNotExist(err) {
			return fmt.Errorf("图片文件不存在: %s", imgPath)
		}

		logrus.Infof("[%s] 上传图片 %d/%d: %s", a.platform, i+1, len(imagePaths), imgPath)

		fileInput, err := page.Element("input[type='file'][accept*='image']")
		if err != nil {
			return errors.Wrap(err, "查找图片上传输入框失败")
		}

		if err := fileInput.SetFiles([]string{imgPath}); err != nil {
			return errors.Wrap(err, "设置图片文件失败")
		}

		helper.RandomDelay(1, 2)
	}

	return nil
}

func (a *XiaohongshuAdapter) fillContent(page *rod.Page, content *publisher.Content) error {
	helper := browser.NewPageHelper(page)

	// 小红书标题限制20字
	title := content.Title
	if len(title) > 20 {
		title = title[:20]
	}

	// 填写标题
	titleInput, err := page.Element("input[placeholder*='标题'], input[name*='title']")
	if err == nil {
		if err := titleInput.Input(title); err != nil {
			logrus.Warnf("[%s] 输入标题失败: %v", a.platform, err)
		}
		helper.RandomDelay(0.5, 1)
	}

	// 小红书正文限制1000字
	body := content.Body
	if len(body) > 1000 {
		body = body[:1000]
	}

	// 填写正文
	contentInput, err := page.Element("textarea[placeholder*='正文'], textarea[name*='content']")
	if err == nil {
		if err := contentInput.Input(body); err != nil {
			logrus.Warnf("[%s] 输入正文失败: %v", a.platform, err)
		}
		helper.RandomDelay(0.5, 1)
	}

	// 填写标签
	for _, tag := range content.Tags {
		tagInput, err := page.Element("input[placeholder*='标签'], input[placeholder*='话题']")
		if err != nil {
			logrus.Warnf("[%s] 查找标签输入框失败: %v", a.platform, err)
			continue
		}

		tagInput.Input("#" + tag)
		time.Sleep(500 * time.Millisecond)
		helper.RandomDelay(0.3, 0.7)
	}

	return nil
}

func (a *XiaohongshuAdapter) submitPublish(page *rod.Page) error {
	helper := browser.NewPageHelper(page)

	publishBtn, err := page.Element("button[type='submit'], .publish-btn, button[class*='publish']")
	if err != nil {
		return errors.Wrap(err, "查找发布按钮失败")
	}

	vis, err := publishBtn.Visible()
	if err != nil || !vis {
		return errors.New("发布按钮不可见")
	}

	helper.RandomDelay(1, 2)

	if err := publishBtn.Click(proto.InputMouseButtonLeft, 1); err != nil {
		return errors.Wrap(err, "点击发布按钮失败")
	}

	logrus.Infof("[%s] 已点击发布按钮，等待完成...", a.platform)
	time.Sleep(5 * time.Second)

	return nil
}

// ============== 工厂 ==============

// PublisherFactory 发布器工厂
type PublisherFactory struct {
	adapters map[string]func(*publisher.Options) publisher.Publisher
}

// NewPublisherFactory 创建工厂
func NewPublisherFactory() *PublisherFactory {
	return &PublisherFactory{
		adapters: make(map[string]func(*publisher.Options) publisher.Publisher),
	}
}

// Register 注册平台适配器
func (f *PublisherFactory) Register(platform string, creator func(*publisher.Options) publisher.Publisher) {
	f.adapters[platform] = creator
}

// Create 创建发布器
func (f *PublisherFactory) Create(platform string, opts ...publisher.Option) (publisher.Publisher, error) {
	creator, exists := f.adapters[platform]
	if !exists {
		return nil, fmt.Errorf("不支持的平台: %s", platform)
	}

	cfg := publisher.DefaultOptions()
	for _, opt := range opts {
		opt(cfg)
	}

	return creator(cfg), nil
}

// SupportedPlatforms 返回支持的平台列表
func (f *PublisherFactory) SupportedPlatforms() []string {
	platforms := make([]string, 0, len(f.adapters))
	for p := range f.adapters {
		platforms = append(platforms, p)
	}
	return platforms
}

// DefaultFactory 默认工厂
func DefaultFactory() *PublisherFactory {
	f := NewPublisherFactory()

	f.Register("douyin", func(opts *publisher.Options) publisher.Publisher {
		return NewDouyinAdapter(opts)
	})

	f.Register("toutiao", func(opts *publisher.Options) publisher.Publisher {
		return NewToutiaoAdapter(opts)
	})

	f.Register("xiaohongshu", func(opts *publisher.Options) publisher.Publisher {
		return NewXiaohongshuAdapter(opts)
	})

	return f
}
