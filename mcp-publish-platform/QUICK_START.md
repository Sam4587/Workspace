# 快速开始指南

## ⚡ 5 分钟快速部署

### 前置条件

- ✅ 已安装 Go 1.24+
- ✅ 已安装 Chrome/Chromium
- ✅ 已配置 ROD_BROWSER_BIN 环境变量

### 步骤

```bash
# 1. 进入项目目录
cd mcp-publish-platform

# 2. 运行部署脚本
chmod +x deploy.sh
./deploy.sh

# 3. 启动服务
./bin/mcp-server -port :18060

# 4. 测试服务（新开终端）
curl http://localhost:18060/api/health
```

---

## 🎯 快速测试

### 使用测试脚本

```bash
# 运行自动化测试
chmod +x test-api.sh
./test-api.sh
```

### 手动测试

#### 1. 检查服务状态

```bash
curl http://localhost:18060/api/health
```

#### 2. 登录小红书

```bash
# 发起登录请求
curl -X POST http://localhost:18060/api/xiaohongshu/login

# 会返回二维码，使用小红书 APP 扫码登录
```

#### 3. 发布图文

```bash
curl -X POST http://localhost:18060/api/xiaohongshu/publish \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试标题",
    "content": "这是测试内容",
    "images": ["/path/to/your/image.jpg"]
  }'
```

---

## 🔧 开发模式

### 启用调试日志

```bash
# 设置日志级别
export LOG_LEVEL=debug

# 启动服务
./bin/mcp-server -headless=false
```

### 热重载开发

```bash
# 安装 air 工具
go install github.com/cosmtrek/air@latest

# 启动热重载
air
```

---

## 📱 MCP 客户端连接

### Cherry Studio

1. 打开 Cherry Studio
2. 点击「添加服务器」
3. 服务器地址：`ws://localhost:18060/mcp`
4. 点击「连接」
5. 测试工具调用

### AnythingLLM

1. 打开 AnythingLLM 设置
2. 找到 MCP 配置
3. 端点地址：`http://localhost:18060/mcp`
4. 重启 AnythingLLM
5. 在对话中调用工具

---

## ❓ 常见问题

### Q: 编译失败怎么办？

A: 检查 Go 版本是否 ≥ 1.24

```bash
go version
```

### Q: 浏览器启动失败？

A: 检查 ROD_BROWSER_BIN 环境变量

```bash
echo $ROD_BROWSER_BIN
```

### Q: 端口被占用？

A: 使用其他端口

```bash
./bin/mcp-server -port :18061
```

---

## 📚 下一步

- 查看完整文档: [README_PLATFORM.md](./README_PLATFORM.md)
- 部署指南: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 开发指南: [docs/development-guide.md](./docs/development-guide.md)

---

**祝您使用愉快！** 🎉
