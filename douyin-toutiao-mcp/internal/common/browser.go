package common

import (
	"context"
	"math/rand"
	"time"

	"github.com/go-rod/rod"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

const (
	DefaultDelayMin = 300  * time.Millisecond
	DefaultDelayMax = 2000 * time.Millisecond
	DOMStableWait = 1 * time.Second
	DOMStableInterval = 100 * time.Millisecond
)

func WaitRandomDelay() {
	delay := time.Duration(DefaultDelayMin + rand.Int63n(int(DefaultDelayMax-DefaultDelayMin))
	logrus.Debugf("随机延迟: %v", delay)
	time.Sleep(delay)
}

func WaitDOMStable(page *rod.Page) error {
	timeout := 30 * time.Second
	interval := DOMStableInterval
	start := time.Now()

	for time.Since(start) < timeout {
		isStable, err := page.Eval(`(() => {
			const elements = document.querySelectorAll('*');
			return elements.length === document.body.querySelectorAll('*').length;
		})()`)

		if err == nil {
			if isStable {
				logrus.Debug("DOM 已稳定")
				return nil
			}
		}

		time.Sleep(interval)
	}

	return errors.New("等待 DOM 稳定超时")
}

func InputWithRandomDelay(page *rod.Page, elem *rod.Element, text string) error {
	if err := elem.Input(text); err != nil {
		return errors.Wrap(err, "输入失败")
	}

	WaitRandomDelay()
	return nil
}

func ClickWithRandomDelay(page *rod.Page, selector string) error {
	elem, err := page.Element(selector)
	if err != nil {
		return errors.Wrap(err, "查找元素失败: "+selector)
	}

	if err := elem.Click("left", 1); err != nil {
		return errors.Wrap(err, "点击元素失败: "+selector)
	}

	WaitRandomDelay()
	return nil
}

func WaitForElement(page *rod.Page, selector string, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			return errors.New("等待元素超时")
		default:
			if elem, err := page.Element(selector); err == nil {
				return nil
			}
			time.Sleep(100 * time.Millisecond)
		}
	}
}

func SafeNavigate(page *rod.Page, url string, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	if err := page.Navigate(url); err != nil {
		return errors.Wrap(err, "导航到页面失败")
	}

	page.Timeout(timeout).MustWaitLoad()
	WaitRandomDelay()

	return nil
}
