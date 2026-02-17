# MCP 发布平台测试计划

## 📋 测试目标

验证 MCP 发布平台的核心功能，确保小红书、抖音、今日头条平台的发布功能正常工作。

---

## 🧪 测试环境

### 环境要求

| 软件 | 版本 | 用途 |
|------|------|------|
| Go | ≥ 1.24 | 编译运行 |
| Docker | 最新版 | 容器化测试 |
| Chrome/Chromium | 最新版 | 浏览器自动化 |

### 测试数据

- 测试图片：准备 3-5 张测试图片
- 测试视频：准备 1-2 个测试视频（< 50MB）
- 测试账号：准备测试用的平台账号

---

## 📝 测试用例

### 1. 小红书平台测试

#### TC-XHS-001: 登录功能测试

**前置条件**: 服务已启动

**测试步骤**:
```bash
# 1. 检查登录状态
curl http://localhost:18060/api/xiaohongshu/check_login

# 2. 发起登录请求
curl -X POST http://localhost:18060/api/xiaohongshu/login

# 3. 扫描二维码登录

# 4. 再次检查登录状态
curl http://localhost:18060/api/xiaohongshu/check_login
```

**预期结果**:
- ✅ 登录前返回未登录状态
- ✅ 登录请求返回二维码
- ✅ 扫码后登录状态变为已登录

---

#### TC-XHS-002: 图文发布测试

**前置条件**: 已登录小红书账号

**测试步骤**:
```bash
curl -X POST http://localhost:18060/api/xiaohongshu/publish \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试标题 - MCP 发布平台",
    "content": "这是通过 MCP 发布平台发布的测试内容。\n\n测试时间：'$(date +%Y-%m-%d/%H:%M:%S)'",
    "images": [
      "/path/to/test-image1.jpg",
      "/path/to/test-image2.jpg"
    ],
    "tags": ["测试", "MCP", "自动化"]
  }'
```

**预期结果**:
- ✅ 发布成功返回 feed_id 和 feed_url
- ✅ 小红书 APP 可见发布的内容
- ✅ 图片、标题、内容正确显示

---

#### TC-XHS-003: 视频发布测试

**前置条件**: 已登录小红书账号

**测试步骤**:
```bash
curl -X POST http://localhost:18060/api/xiaohongshu/publish-video \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试视频 - MCP 发布平台",
    "description": "这是测试视频描述",
    "video_path": "/path/to/test-video.mp4"
  }'
```

**预期结果**:
- ✅ 视频上传成功
- ✅ 发布成功返回 feed_id
- ✅ 小红书 APP 可见发布的视频

---

#### TC-XHS-004: 内容列表查询测试

**前置条件**: 已发布至少一条内容

**测试步骤**:
```bash
curl "http://localhost:18060/api/xiaohongshu/feeds?page=1&page_size=10"
```

**预期结果**:
- ✅ 返回内容列表
- ✅ 包含刚发布的内容
- ✅ 数据格式正确

---

### 2. 抖音平台测试（开发中）

#### TC-DY-001: 登录功能测试

**状态**: 🔄 开发中

**测试步骤**:
```bash
# 检查登录状态
curl http://localhost:18060/api/douyin/check_login

# 发起登录请求
curl -X POST http://localhost:18060/api/douyin/login
```

**预期结果**:
- ✅ 支持抖音登录
- ✅ 支持二维码扫码

---

#### TC-DY-002: 视频发布测试

**状态**: 🔄 开发中

**测试步骤**:
```bash
curl -X POST http://localhost:18060/api/douyin/publish-video \
  -H "Content-Type: application/json" \
  -d '{
    "title": "抖音测试视频",
    "description": "测试描述",
    "video_path": "/path/to/video.mp4"
  }'
```

**预期结果**:
- ✅ 视频上传成功
- ✅ 发布到抖音平台

---

### 3. 今日头条平台测试（开发中）

#### TC-TT-001: 登录功能测试

**状态**: 🔄 开发中

**测试步骤**:
```bash
# 检查登录状态
curl http://localhost:18060/api/toutiao/check_login

# 发起登录请求
curl -X POST http://localhost:18060/api/toutiao/login
```

**预期结果**:
- ✅ 支持今日头条登录
- ✅ 支持二维码扫码

---

#### TC-TT-002: 图文发布测试

**状态**: 🔄 开发中

**测试步骤**:
```bash
curl -X POST http://localhost:18060/api/toutiao/publish \
  -H "Content-Type: application/json" \
  -d '{
    "title": "今日头条测试文章",
    "content": "文章内容...",
    "images": ["/path/to/image.jpg"]
  }'
```

**预期结果**:
- ✅ 文章发布成功
- ✅ 返回文章 ID

---

### 4. MCP 协议测试

#### TC-MCP-001: MCP 服务器连接测试

**前置条件**: MCP 客户端已安装（如 Cherry Studio）

**测试步骤**:
1. 打开 Cherry Studio
2. 添加 MCP 服务器：`ws://localhost:18060/mcp`
3. 点击连接

**预期结果**:
- ✅ 连接成功
- ✅ 显示可用工具列表

---

#### TC-MCP-002: MCP 工具调用测试

**前置条件**: MCP 客户端已连接

**测试步骤**:
1. 在 Cherry Studio 中调用 `xiaohongshu_check_login` 工具
2. 调用 `xiaohongshu_publish_note` 工具

**预期结果**:
- ✅ 工具调用成功
- ✅ 返回正确结果

---

## 🔧 自动化测试脚本

### test-all.sh

```bash
#!/bin/bash

# 运行所有测试
echo "开始测试 MCP 发布平台..."

# 测试小红书平台
./test-xiaohongshu.sh

# 测试抖音平台（如果已实现）
./test-douyin.sh

# 测试今日头条平台（如果已实现）
./test-toutiao.sh

echo "所有测试完成！"
```

---

## 📊 测试报告模板

### 测试执行记录

| 测试用例 | 执行时间 | 结果 | 备注 |
|---------|---------|------|------|
| TC-XHS-001 | - | - | - |
| TC-XHS-002 | - | - | - |
| TC-XHS-003 | - | - | - |
| TC-XHS-004 | - | - | - |
| TC-DY-001 | - | - | 待开发 |
| TC-DY-002 | - | - | 待开发 |
| TC-TT-001 | - | - | 待开发 |
| TC-TT-002 | - | - | 待开发 |

### 测试覆盖率

| 模块 | 测试用例数 | 通过数 | 覆盖率 |
|------|-----------|--------|--------|
| 小红书登录 | 1 | - | - |
| 小红书发布 | 2 | - | - |
| 小红书管理 | 1 | - | - |
| 抖音平台 | 2 | - | 待开发 |
| 今日头条 | 2 | - | 待开发 |
| MCP 协议 | 2 | - | - |

---

## 🚨 已知问题

### 问题列表

| ID | 描述 | 严重程度 | 状态 |
|-----|------|---------|------|
| - | - | - | - |

---

## 📝 测试结论

### 总体评价

- [ ] 所有核心功能测试通过
- [ ] 性能测试达标
- [ ] 无严重 Bug
- [ ] 可以发布

### 建议

1. **测试优先级**: 优先测试小红书平台，确保核心功能稳定
2. **自动化测试**: 编写自动化测试脚本，提高测试效率
3. **持续集成**: 集成到 CI/CD 流程，自动运行测试

---

**测试负责人**: 开发团队  
**最后更新**: 2026-02-17
