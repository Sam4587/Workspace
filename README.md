# 抖音/今日头条 MCP 发布工具

基于小红书 MCP 核心架构实现的抖音和今日头条发布工具。

## 技术架构

完全复用小红书 MCP 的技术框架:
- **Go 1.21+** - 主要开发语言
- **Rod** - 浏览器自动化框架
- **HTTP/MCP 协议** - 统一的接口封装

## 功能特性

### 抖音
- ✅ 二维码登录
- ✅ Cookie 管理 (tt_webid, passport_auth, csrf_token, ttcid)
- ✅ 图文发布
- ✅ 视频发布
- ✅ 登录状态检查
- ✅ 话题标签支持
- ✅ 反爬虫应对 (随机延迟,UA 模拟)

### 今日头条
- ✅ 二维码登录
- ✅ Cookie 管理 (sessionid, passport_auth, tt_token, tt_webid)
- ✅ 图文发布
- ✅ 视频发布
- ✅ 登录状态检查
- ✅ 话题标签支持
- ✅ 反爬虫应对

## 快速开始

### 1. 编译

```bash
go build -o douyin-toutiao-mcp .
```

### 2. 登录

**抖音登录**:
```bash
./douyin-toutiao-mcp -platform douyin -login
```

**今日头条登录**:
```bash
./douyin-toutiao-mcp -platform toutiao -login
```

### 3. 检查登录状态

```bash
# 抖音
./douyin-toutiao-mcp -platform douyin -check

# 今日头条
./douyin-toutiao-mcp -platform toutiao -check
```

### 4. 发布内容

**抖音图文**:
```bash
./douyin-toutiao-mcp -platform douyin \
  -title "标题" \
  -content "内容" \
  -images "img1.jpg,img2.jpg" \
  -tags "美食,生活"
```

**抖音视频**:
```bash
./douyin-toutiao-mcp -platform douyin \
  -title "标题" \
  -content "内容" \
  -video "video.mp4" \
  -tags "生活"
```

**今日头条图文**:
```bash
./douyin-toutiao-mcp -platform toutiao \
  -title "标题" \
  -content "内容" \
  -images "img1.jpg,img2.jpg" \
  -tags "科技,数码"
```

## 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `-platform` | 平台选择: douyin 或 toutiao | `-platform douyin` |
| `-headless` | 是否无头模式 (默认: true) | `-headless=false` |
| `-title` | 内容标题 (抖音/头条≤30字) | `-title "测试标题"` |
| `-content` | 正文内容 (抖音/头条≤2000字) | `-content "测试内容"` |
| `-images` | 图片路径,逗号分隔 | `-images "img1.jpg,img2.jpg"` |
| `-video` | 视频路径 (仅本地) | `-video "video.mp4"` |
| `-tags` | 话题标签,逗号分隔 | `-tags "美食,生活"` |
| `-check` | 检查登录状态 | `-check` |
| `-login` | 登录 | `-login` |

## Cookie 管理

Cookie 存储位置:
- 抖音: `./cookies/douyin_cookies.json`
- 今日头条: `./cookies/toutiao_cookies.json`

Cookie 包含的关键字段:
- 抖音: `tt_webid`, `passport_auth`, `csrf_token`, `ttcid`
- 今日头条: `sessionid`, `passport_auth`, `tt_token`, `tt_webid`

## 反爬虫策略

1. **随机延迟**: 每次操作后随机等待 0.3-2 秒
2. **无头模式**: 可选的有头模式,便于调试
3. **操作间隔**: 发布间隔建议 ≥5 分钟
4. **DOM 稳定**: 等待 DOM 加载完成再操作

## 平台适配说明

### 抖音
- **登录页**: `https://creator.douyin.com/creator-micro/content/publish`
- **发布页**: `https://creator.douyin.com/creator-micro/content/publish`
- **视频限制**: 大小 ≤2GB, 格式 MP4
- **标题限制**: 最多 30 字
- **正文限制**: 最多 2000 字

### 今日头条
- **登录页**: `https://mp.toutiao.com/`
- **发布页**: `https://mp.toutiao.com/profile_v4/pub_article`
- **视频限制**: 格式 MP4
- **标题限制**: 最多 30 字
- **正文限制**: 最多 2000 字

## 技术实现亮点

1. **零重写核心逻辑** - 完全复用小红书 MCP 的成熟架构
2. **平台抽象** - 统一的登录/发布接口
3. **错误处理** - 完善的错误包装和提示
4. **日志记录** - 详细的操作日志
5. **Cookie 持久化** - 自动保存和加载登录状态
6. **模块化设计** - 浏览器/Cookie/配置分离

## 风险说明

1. **风控风险** - 抖音/头条的风控比小红书更严格
2. **Cookie 过期** - 需要定期重新登录
3. **DOM 变化** - 网页改版需要更新选择器
4. **接口限制** - 高频发布可能触发限流

## 后续优化方向

1. **MCP 协议支持** - 实现标准 MCP 协议
2. **HTTP API** - 提供 RESTful 接口
3. **批量发布** - 支持配置文件批量导入
4. **定时发布** - 支持定时任务
5. **内容模板** - 支持内容模板管理
6. **多账号** - 支持账号切换和管理
7. **数据统计** - 发布数据统计和分析

## 开源参考

参考的开源项目:
- 抖音自动化: https://github.com/Hunter-python/douyin-tiktok-api
- 头条号操作: https://github.com/Jack-Cherish/python-spider

## 许可证

MIT License
