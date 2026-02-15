# 小红书发布工具 CLI

基于 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 核心功能的命令行发布工具。

## 功能

- 图文发布
- 视频发布
- 登录状态检查

## 使用

### 1. 首次登录

下载官方登录工具并扫码登录:
```bash
# macOS Apple Silicon
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-login-darwin-arm64
chmod +x xiaohongshu-login-darwin-arm64
./xiaohongshu-login-darwin-arm64
```

### 2. 检查登录

```bash
./xiaohongshu-publisher -check
```

### 3. 发布内容

```bash
# 图文
./xiaohongshu-publisher -title "标题" -content "内容" -images "img1.jpg,img2.jpg" -tags "美食"

# 视频
./xiaohongshu-publisher -title "标题" -content "内容" -video "video.mp4" -tags "生活"
```

## 参数

- `-headless`: 无头模式 (默认 true)
- `-title`: 标题 (最多20字)
- `-content`: 正文 (最多1000字)
- `-images`: 图片路径,逗号分隔
- `-video`: 视频路径
- `-tags`: 标签,逗号分隔
- `-check`: 检查登录状态

## 注意

1. 首次使用必须先登录
2. Cookie 保存在 `~/.cache/xiaohongshu-mcp/cookies/cookies.json`
3. 标题不超过20字,正文不超过1000字
