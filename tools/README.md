# MCP 发布工具集

本目录包含多平台内容发布工具，支持小红书、抖音、今日头条等平台。

## 工具列表

| 工具 | 平台 | 状态 |
|------|------|------|
| `xiaohongshu-publisher` | 小红书 | 可用 |
| `douyin-toutiao` | 抖音/今日头条 | 可用 |

## 编译

```bash
# 编译所有工具
make build

# 或单独编译
cd xiaohongshu-publisher && go build -o xhs-publisher .
cd douyin-toutiao && go build -o publisher .
```

## 小红书发布工具

### 功能
- 二维码登录
- Cookie 管理
- 图文发布
- 视频发布
- 登录状态检查

### 使用方法

```bash
# 检查登录状态
./xhs-publisher -check

# 发布图文
./xhs-publisher -title "标题" -content "正文" -images "img1.jpg,img2.jpg" -tags "美食,生活"

# 发布视频
./xhs-publisher -title "标题" -content "正文" -video "video.mp4" -tags "生活"

# 非无头模式（调试用）
./xhs-publisher -headless=false -login
```

### 限制
- 标题：最多 20 字
- 正文：最多 1000 字
- 图片：支持本地路径和 HTTP 链接

## 抖音/今日头条发布工具

### 功能
- 二维码登录
- Cookie 管理
- 图文发布
- 视频发布
- 登录状态检查

### 使用方法

```bash
# 抖音登录
./publisher -platform douyin -login

# 今日头条登录
./publisher -platform toutiao -login

# 检查登录状态
./publisher -platform douyin -check

# 发布抖音图文
./publisher -platform douyin -title "标题" -content "正文" -images "img1.jpg,img2.jpg" -tags "美食"

# 发布抖音视频
./publisher -platform douyin -title "标题" -content "正文" -video "video.mp4" -tags "生活"

# 发布今日头条图文
./publisher -platform toutiao -title "标题" -content "正文" -images "img1.jpg"
```

### 限制

| 平台 | 标题 | 正文 | 视频 |
|------|------|------|------|
| 抖音 | 最多 30 字 | 最多 2000 字 | ≤2GB, MP4 |
| 今日头条 | 最多 30 字 | 最多 2000 字 | MP4 |

## Cookie 管理

### 存储位置
- 小红书：`./cookies/xiaohongshu_cookies.json`
- 抖音：`./cookies/douyin_cookies.json`
- 今日头条：`./cookies/toutiao_cookies.json`

### Cookie 字段

| 平台 | 关键字段 |
|------|---------|
| 小红书 | `web_session`, `webId` |
| 抖音 | `tt_webid`, `passport_auth`, `csrf_token`, `ttcid` |
| 今日头条 | `sessionid`, `passport_auth`, `tt_token`, `tt_webid` |

## 反爬虫策略

所有工具都实现了以下反爬虫策略：
1. 随机延迟（0.3-2 秒）
2. DOM 稳定等待
3. 无头/有头模式切换
4. 模拟人工操作

## 注意事项

1. **首次使用**：必须先执行登录操作
2. **Cookie 过期**：需要定期重新登录
3. **发布间隔**：建议间隔 ≥5 分钟
4. **内容规范**：遵守各平台社区规范
5. **风控风险**：高频操作可能触发限流

## 技术架构

```
工具架构
├── main.go           # CLI 入口
├── browser/          # 浏览器管理
├── cookies/          # Cookie 存储
├── configs/          # 配置管理
├── errors/           # 错误定义
├── douyin/           # 抖音平台实现
│   ├── login.go
│   └── publish.go
├── toutiao/          # 今日头条平台实现
│   ├── login.go
│   └── publish.go
└── xiaohongshu/      # 小红书平台实现（外部依赖）
```

## 开源依赖

- [go-rod/rod](https://github.com/go-rod/rod) - 浏览器自动化
- [xpzouying/xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) - 小红书 MCP 核心

## 许可证

MIT License
