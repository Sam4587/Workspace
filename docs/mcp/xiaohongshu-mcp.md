# 小红书 MCP 发布工具 - 完整使用文档

## 项目简介

小红书 MCP 发布工具是基于 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 核心功能构建的专用小红书内容发布 CLI 工具。

**项目地址**: `https://github.com/xpzouying/xiaohongshu-publisher-cli`

## 快速开始

### 1. 下载工具

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
wget https://github.com/xpzouying/xiaynshu-mcp/releases/download/v1.2.2/xiaohongshu-login-windows-amd64.exe
```

### 2. 首次登录

```bash
# macOS/Linux
./xiaohongshu-login-darwin-arm64

# Windows
xiaohongshu-login-windows-amd64.exe
```

浏览器会自动打开,使用小红书 App 扫码登录。登录成功后,Cookie 会自动保存到 `~/.cache/xiaohongshu-mcp/cookies/cookies.json`

### 3. 编译工具

```bash
# 使用 Go 编译
go build -o xiaohongshu-publisher .
```

或下载预编译版本:
```bash
# macOS Apple Silicon
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-publisher-darwin-arm64

# Linux x64
wget https://github.com/xxzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-publisher-linux-amd64

# Windows x64
wget https://github.com/xpzouying/xiaohongshu-mcp/releases/download/v1.2.2/xiaohongshu-publisher-windows-amd64.exe
```

## 功能说明

### 1. 登录管理

#### 检查登录状态

```bash
./xiaohongshu-publisher -check
```

**返回**:
- `is_logged_in`: 是否已登录
- `username`: 用户名

#### 退出登录

```bash
./xiaohongshu-mcp/login
```

浏览器会自动打开,提供二维码扫码登录。

---

### 2. 图文发布

```bash
./xiaohongshu-publisher \
  -title "标题" \
  -content "正文内容" \
  -images "img1.jpg,img2.jpg,img3.jpg" \
  -tags "美食,生活"
```

#### 图片格式支持

**本地图片路径** (推荐):
```bash
./xiaohongshu-publisher \
  -title "标题" \
  -content "正文内容" \
  -images "/path/to/image1.jpg,/path/to/image2.jpg"
```

**HTTP 图片链接**:
```bash
./xiaohongshu -publisher \
  -title "标题" \
  - -content "正文内容" \
  - -images "https://example.com/image1.jpg,https://example.com/image2.jpg"
```

#### 注意事项

- **标题限制**: 最多 20 个中文字或英文单词
- **正文限制**: 最多 1000 个字
- **图片数量**: 建议 3-9 张图片
- **图片格式**: 支持 JPG, PNG, WEBP 等常见格式
- **标签格式**: 使用逗号分隔,如 `美食,生活,旅行`

---

### 3. 视频发布

```bash
./xiaohongshu-publisher \
  -title "视频标题" \
  -content "视频描述" \
  -video "/path/to/video.mp4" \
  -tags "生活,美食"
```

#### 注意事项

- **视频格式**: 仅支持 MP4 格式
- **视频大小**: 建议 <500MB
- **时长限制**: 建议 < 5 分钟
- **标签格式**: 使用逗号分隔

---

## 平台限制

### 小红书

| 限制项 | 限制值 |
|--------|---------|
| 标题 | 最多 20 字 |
| 正文 | 最多 1000 字 |
| 图片数量 | 建议 3-9 张 |
| 单张图片大小 | <10MB |
| 视频大小 | < 2GB |
| 视频时长 | < 5 分钟 |
| 视频格式 | 仅 MP4 |
| 图片格式 | JPG, PNG, WEBP |

### 重要性排序 (经验之谈)

根据实战数据,小红书内容运营的重要性排序如下:

#### 第一优先级 (最重要)
- **标题质量**
  - **长度控制**: 严格遵守 20 字限制
  - **吸引力**: 使用数字、标点符号、表情符号
  - **关键词**: 在标题中包含核心关键词
  - **格式**: 使用统一的标题格式

#### 第二优先级
- **封面质量** (图文)
  - **首图**: 选择最有吸引力的图片作为封面
  - **图片质量**: 确保图片清晰度高
  - **图片数量**: 使用 3-9 张图片最佳

#### 第三优先级
- **标签使用**
  - **数量**: 使用 3-5 个标签
  - **相关性**: 标签与内容高度相关
  - **热度标签**: 结合当前热点话题

#### 第四优先级
- **正文质量**
  - **分段清晰**: 使用分段让正文易读
  - **Emoji 使用**: 适当使用 Emoji 增加趣味性
  - **引导性**: 在结尾添加引导关注或互动

---

## 发布流程

### 完整发布流程

```bash
# 1. 检查登录状态
./xiaohongshu-publisher -check

# 2. 发布图文
./xiaohongshu-publisher \
  -title "测试标题" \
  -content "测试内容" \
  -images "/path/to/images/img1.jpg,/path/to/images/img2.jpg" \
  -tags "美食,生活"

# 3. 检查登录状态 (再次确认)
./xiaohongshu-publisher -check
```

### 发布后验证

1. **打开小红书 App** 或网页版
2. **查看我的发布** 页面
3. **检查内容是否正确显示**
4. **确认数据指标** (播放量、点赞数、收藏数、评论数)

---

## Cookie 管理

### Cookie 存储

**存储位置**:
- Linux/macOS: `~/.cache/xiaohongshu-mcp/cookies/cookies.json`
- Windows: `%USERPROFILE%\.cache\xiaohongshu-mcp\cookies\cookies.json`

### Cookie 管理

#### 清除 Cookie (退出登录)

```bash
./xiaohong-mcp/login
# 浏览器会自动打开,找到退出登录按钮点击
```

#### 手动清除 Cookie

```bash
rm -rf ~/.cache/xiaohongshu-mcp/cookies/cookies.json
```

### Cookie 文件结构

```json
{
  "web_session": "...",
  "webId": "...",
  "a1": "...",
  "webIdBase64": "...",
  "cookie-list": [
    {
      "name": "web_session",
      "value": "...",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": "...",
      "httpOnly": true
    }
  ]
}
```

---

## 反爬虫与风控应对

### 反爬虫策略

#### 1. 随机延迟

```go
// 内部实现
waitTime := time.Duration(300+rand.Intn(700)) * time.Millisecond
time.Sleep(waitTime)
```

**作用**:
- 模拟人工操作速度
- 避免被识别为机器人
- 提高存活率

#### 2. DOM 稳定

```go
// 内部实现
time.Sleep(2 * time.Second)
page.WaitDOMStable(time.Second, 0.1)
```

**作用**:
- 等待 DOM 完全加载
- 确保元素可用
- 避免元素未找到错误

#### 3. 指纹检测

```go
// 内部实现
page = stealth.MustPage(page).MustEvals(`() => {
	return typeof document !== "undefined" &&
	       typeof document.body !== "undefined" &&
	       typeof document.body.querySelector !== "undefined"
	})()`)
```

**作用**:
- 隐藏自动化特征
- 模拟真实浏览器
- 提高过风控成功率

---

## 错误处理

### 常见错误及解决方案

#### 1. Cookie 过期

**错误信息**:
```
登录状态: ✗ 未登录
```

**解决方案**:
```bash
./xiaohongshu-mcp/login
# 扫码重新登录
```

#### 2. 图片上传失败

**错误信息**:
```
上传图片失败: 图片过大或格式不支持
```

**解决方案**:
- 压缩图片到 10MB 以下
- 转换图片格式 (JPG/PNG)
- 使用本地路径而不是 HTTP 链接

#### 3. 发布失败

**错误信息**```
发布失败: 标题过长或正文过长
```

**解决方案**:
- 截断标题到 20 字以内
- 截断正文到 1000 字以内

#### 4. 元素未找到

**错误信息**```
查找元素失败: 未找到发布按钮
```

**解决方案**:
- 使用非无头模式查看: `./xiaohongshu-publisher -headless=false`
- 检查小红书平台是否有更新
- 更新 DOM 选择器

---

## 高级使用技巧

### 1. 批量发布

创建批量发布脚本 `batch-publish.sh`:

```bash
#!/bin/bash

# 抖音批量发布
./douyin-toutiao-mcp -platform douyin \
  -title "批量测试1" \
  -content "批量内容1" \
  -images "img1.jpg" \
  -tags "批量测试"

sleep 30

./douyin-toutiao-mcp -platform douyin \
  -title "批量测试2" \
  -content "批量内容2" \
  -  -images "img2.jpg" \
  -tags "批量测试"
```

**注意**: 控制发布频率,建议间隔 ≥5 分钟

### 2. 内容模板管理

创建 `templates/` 目录,存放内容模板:

```
templates/
├── food/
│   ├── recipe_post.json
│   └── restaurant_review.json
└── travel/
    ├── city_guide.json
    └── attraction_review.json
```

模板格式 (JSON):
```json
{
  "title": "模板标题",
  "content": "模板正文内容",
  "images": ["图片路径1.jpg"],
  "tags": ["标签1", "标签2"],
  "default_title_limit": 20,
  "default_content_limit": 1000
}
```

### 3. 数据统计

创建 `stats/` 目录,记录发布数据:

```
stats/
├── published.json
├── engagement.json
└── analytics.json
```

---

## MCP 协议集成

### 支持 MCP 的客户端

| 客户端 | 配置方式 |
|------|----------|
| Cherry Studio | MCP Settings → Add Server → http://localhost:18060/mcp |
| AnythingLLM | Settings → MCP → Add Server → http://localhost: 18060/mcp |
| VS Code | Settings → Extensions → MCP → Add Server → http://localhost:18060/mcp |
| Cursor | Settings → Extensions → MCP → Add Server → http://localhost: 18060/mcp |

### MCP 工具列表

**登录相关**:
- `check_login_status` - 检查登录状态
- `fetch_qrcode_image` - 获取登录二维码

**内容发布**:
- `publish_content` - 发布图文内容
- `publish_with_video` - 发布视频内容

**内容管理**:
- `list_feeds` - 获取推荐列表
- `search_feeds` - 搜索内容
- `get_feed_detail` - 获取帖子详情
- `post_comment_to_feed` - 发表评论
- `like_feed` - 点赞帖子
- `favorite_feed` - 收藏帖子
- `user_profile` - 获取用户主页

### MCP 使用示例

#### 检查登录状态
```json
{
  "method": "tools/call",
  "params": {
    "name": "check_login_status",
    "arguments": {}
  }
}
```

#### 发布图文内容
```json
{
  "method": "tools/call",
  "params": {
    "name": "publish_content",
    "arguments": {
      "title": "标题",
      "content": "正文内容",
      "images": [
        "/path/to/image1.jpg",
        "/path/to/image2.jpg"
      ],
      "tags": ["美食", "生活"]
    }
  }
}
```

#### 发布视频内容
```json
{
  "method": "tools/call",
  "params": {
    "name": "publish_with_video",
    "arguments": {
      "title": "视频标题",
      "content": "视频描述",
      "video": "/path/to/video.mp4",
      "tags": ["生活"]
    }
  }
}
```

---

## Docker 部署

### Docker Compose 配置

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  xiaohongshu-mcp:
    image: xpzouying/xiaohongshu-mcp
    container_name: xiaohongshu-publisher
    ports:
      - "18060:18060"
    volumes:
      - ./data/cookies:/app/cookies
      - ./data/images:/app/images
    restart: unless-stopped
```

创建数据目录:

```bash
mkdir -p data/cookies data/images
```

启动服务:

```bash
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 测试与验证

### 1. 功能测试

- [ ] 登录功能正常
- [ ] 图文发布正常
- [ ] 视频发布正常
- [ ] 登录状态检查正常
- [ ] Cookie 管理正常

### 2. 错误处理测试

- [ ] 图片格式验证
- [ ] 长度限制验证
- [ ] 文件路径验证
- [ ] 网络错误处理
- [ ] Cookie 过期处理

### 3. 集成测试

- [ ] MCP 连接测试
- [ ] Docker 部署测试
- [ ] CLI 参数验证
- [ ] Cookie 长期测试

---

## 常见问题 (FAQ)

### Q1: 如何更换小红书账号?

**A**: 使用登录工具重新登录:

```bash
./xiaohongshu-mcp/login
```

### Q2: 如何发布长视频?

**A**: 小红书推荐视频长度 < 5 分钟,大视频建议分集发布

### Q3: 如何提高曝光率?

**A**: 
1. 优化标题 (20 字内)
2. 使用高质量封面
3. 使用热门标签
4. 发布时段 (19:00-23:00 效果最佳)
5. 适当的互动

### Q4: 如何避免风控?

**A**: 
1. 控制发布频率 (建议 ≥5 分钟/次)
2. 避免高频发布相同内容
3. 使用官方登录方式
4. 模拟人工操作速度
5. 避免同时登录多个网页端

### Q5: 为什么登录失败?

**A**: 
1. 检查网络连接
2. 检查浏览器版本
3. 清除旧的 Cookie 文件
4. 重新运行登录工具

### Q6: 如何获取作品 ID?

**A**: 成功发布后,返回结果中包含作品 ID:

```json
{
  "title": "标题",
  "status": "success",
  "post_id": "作品 ID"
}
```

### Q7: Cookie 过期怎么处理?

**A**: 

```bash
# 方式 1: 使用登录工具重新登录
./xiaohongshu-mcp/login

# 方式 2: 删除 Cookie 后重新登录
rm -rf ~/.cache/xiaohongshu-mcp/cookies/cookies.json
./xiaohongshu-mcp/login
```

---

## 开发指南

### 项目结构

```
xiaohongshu-publisher-cli/
├── main.go              # 主程序
├── xiaohongshu-publisher  # 编译后的可执行文件
└── cookies/            # Cookie 存储
```

### 编译

```bash
# 本地编译
go build -o xiaohongshu-publisher .

# 交叉编译
# Linux
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o xiaohongshongshu-publisher-linux .

# macOS Apple Silicon
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o xiaohongshu-publisher-darwin-arm64

# macOS Intel
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o xiaohongshu-publisher-darwin-amd64

# Windows
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o xiaohongshu-publisher-windows-amd64.exe
```

### 测试

```bash
# 编译
go build -o xiaohongshu-publisher .

# 检查帮助
./xiaohongshu-publisher -h

# 检查登录状态
./xiaohongshu-publisher -check

# 发布测试
./xiaohongshu-publisher \
  -title "测试" \
  -content "测试内容" \
  -images "/path/to/image.jpg"
  -tags "测试"
```

### 调试

```bash
# 启用调试日志
export RUST_LOG=debug

# 启动非无头模式
./xiaohongshu-publisher -headless=false
```

---

## 版本历史

### v1.2.2 (当前版本)

- 基于 xiaohongshu-mcp v1.2.2
- 完全复用核心功能
- 添加 CLI 工具
- 优化错误处理
- 完善文档

---

## 支持与反馈

### 技术支持

- GitHub Issues: https://github.com/xpzouying/xiaohongshu-mcp/issues
- 开源协议: MIT License

### 问题反馈

如果遇到问题:

1. 先查看 [常见问题](#常见问题faq) 章节
2. 搜索 GitHub Issues
3. 在 GitHub 提交新的 Issue

### 贡献

欢迎通过以下方式贡献:

1. Fork 项目
2. 创建功能分支
3. 提交 Pull Request
4. 报告 Bug
5. 提交功能请求

---

## 许可证

MIT License

Copyright (c) 2024 xiaohongshu-mcp contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

1. The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software;
2. All modifications to the Software must be made by clearly visible comments or other clear documentation;
3. The name of the copyright holder(s) and any substantial contributors shall be included;
4. The Software is provided "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE COPYRIGHT HOLDER(S) OR COPYRIGHT HOLDER(S) BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
   IN NO EVENT SHALL THE COPYRIGHT HOLDER(S) OR COPYRIGHT HOLDER(S) OR ANY DISTRIBUTOR, SUPPLIER OR SUBSIDIARY WHO HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES

**第三方依赖许可证**: 小红书 MCP 使用以下第三方库,每个依赖都有各自的许可证:

- **Rod (Go 浏览器自动化)**: MIT License
- **Logrus (日志库)**: MIT License
- **errors (错误处理)**: MIT License
- **stealth (反爬虫)**: Apache 2.0 License

---

## 致谢

感谢 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 提供了成熟的技术框架。

感谢开源社区的测试和反馈。
