package platform

import (
	"context"

	"github.com/go-rod/rod"
)

type Platform interface {
	Name() string
	Version() string
	NewLogin(page *rod.Page) LoginAction
	NewPublishAction(page *rod.Page) (PublishAction, error)
	NewLoginAction(page *rod.Page) LoginAction
}

type LoginAction interface {
	CheckLoginStatus(ctx context.Context) (bool, error)
	FetchQrcodeImage(ctx context.Context) (string, bool, error)
	WaitForLogin(ctx context.Context) bool
	ExtractCookies(ctx context.Context) (map[string]string, error)
}

type PublishAction interface {
	PublishImages(ctx context.Context, content PublishImageContent) error
	PublishVideo(ctx context.Context, content PublishVideoContent) error
}

type PublishImageContent struct {
	Title        string
	Content      string
	ImagePaths   []string
	Tags         []string
	ScheduleTime *context.Context
}

type PublishVideoContent struct {
	Title        string
	Content      string
	VideoPath    string
	Tags         []string
	ScheduleTime *context.Context
}

type PlatformConfig struct {
	Name         string
	LoginURL     string
	PublishURL   string
	CookieFields []string
	Limits       Limits
}

type Limits struct {
	TitleMax      int
	ContentMax    int
	VideoMaxSize  int64
	ImageCountMax int
}

type Selectors struct {
	Avatar       string
	Qrcode       string
	TitleInput   string
	ContentInput string
	TagInput     string
	FileInput    string
	SubmitBtn    string
}
