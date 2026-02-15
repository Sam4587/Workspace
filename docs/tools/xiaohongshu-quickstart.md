# 小红书发布工具 - 快速开始

## 5 分钟快速上手

### 步骤 1: 下载登录工具 (首次使用)

选择适合你平台的登录工具:

```bash
# macOS Apple Silicon
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-login-darwin-arm64
chmod +x xiaohongshu-login-darwin-arm64

# macOS Intel
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-login-darwin-amd64
chmod +x xiaohongshu-login-darwin-amd64

# Linux x64
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-login-linux-amd64
chmod +x xiaohongshu-login-linux-amd64

# Windows x64
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-login-windows-amd64.exe
```

### 步骤 2: 扫码登录

```bash
# macOS
./xiaohongshu-login-darwin-arm64

# Linux
./xiaohongshu-login-linux-amd64

# Windows
xiaohongshu-login-windows-amd64.exe
```

浏览器会自动打开,使用小红书 App 扫码登录。

### 步骤 3: 验证登录

```bash
./xiaohongshu-publisher -check
```

如果看到 `✓ 已登录`,说明登录成功!

### 步骤 4: 发布第一条内容

```bash
# 图文示例
./xiaohongshu-publisher \
  -title "我的第一条笔记" \
  -content "这是测试内容,使用小红书发布工具发布" \
  -images "/path/to/image.jpg" \
  -tags "生活,测试"

# 视频示例
./xiaohongshu-publisher \
  -title "我的第一个视频" \
  -content "这是测试视频" \
  -video "/path/to/video.mp4" \
  -tags "生活"
```

## 常见问题

### Q: Cookie 过期怎么办?

A: 重新运行登录工具:

```bash
./xiaohongshu-login-darwin-arm64
```

### Q: 如何查看已发布的内容?

A: 登录小红书 App 或网页端查看。

### Q: 标题或正文太长怎么办?

A: 工具会自动截断:
- 标题: 最多 20 字
- 正文: 最多 1000 字

### Q: 可以发布多张图片吗?

A: 可以,用逗号分隔:

```bash
./xiaohongshu-publisher \
  -title "多图测试" \
  -content "测试多张图片" \
  -images "img1.jpg,img2.jpg,img3.jpg"
```

## 下一步

- 阅读 [README.md](README.md) 了解完整功能
- 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解 Docker 部署
- 阅读 [SUMMARY.md](SUMMARY.md) 了解技术细节

## 技巧

1. **批量发布**: 创建 shell 脚本批量发布
2. **定时任务**: 使用 cron 或系统任务计划器
3. **图片处理**: 提前处理好图片格式和大小
4. **标签优化**: 研究热门标签提升曝光

## 安全提示

1. 不要分享 Cookie 文件
2. 不要在多个网页端同时登录
3. 定期更换密码
4. 注意小红书社区规范
