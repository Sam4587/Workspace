# 常见问题排查指南

> **AI Content Flow 项目常见问题和解决方案**

**版本**: 1.0 | **创建时间**: 2026-02-19 | **最后更新**: 2026-02-19

---

## 一、安装和配置问题

### 1.1 依赖安装失败

#### 问题描述
```bash
npm install
# 错误：ECONNREFUSED 或 ETIMEDOUT
```

#### 可能原因
- 网络连接问题
- npm 镜像源不可用
- Node.js 版本不兼容

#### 解决方案

**方案 1：切换 npm 镜像**
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用官方镜像
npm config set registry https://registry.npmjs.org
```

**方案 2：清理缓存**
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

**方案 3：检查 Node.js 版本**
```bash
# 检查当前版本
node --version

# 应该是 18+，如果不是，升级 Node.js
# 访问 https://nodejs.org/ 下载最新版本
```

---

### 1.2 环境变量配置问题

#### 问题描述
```bash
# 服务启动失败，提示环境变量未定义
Error: JWT_SECRET is not defined
```

#### 可能原因
- .env 文件不存在
- .env 文件格式错误
- 环境变量名称拼写错误

#### 解决方案

**方案 1：检查 .env 文件**
```bash
# 确认 .env 文件存在
ls -la .env

# 查看文件内容
cat .env
```

**方案 2：检查 .env 格式**
```env
# 正确格式
JWT_SECRET=your-secret-key
PORT=5001

# 错误格式（不要有空格）
JWT_SECRET = your-secret-key
PORT = 5001
```

**方案 3：重新加载环境变量**
```bash
# 如果使用 dotenv，确保在应用启动前加载
require('dotenv').config();

# 或者在命令行中设置
export JWT_SECRET=your-secret-key
npm start
```

---

## 二、服务启动问题

### 2.1 端口被占用

#### 问题描述
```bash
Error: listen EADDRINUSE: address already in use :::5001
```

#### 可能原因
- 端口 5001 已被其他进程占用
- 之前的服务未正常关闭

#### 解决方案

**方案 1：查找占用端口的进程**
```bash
# Windows
netstat -ano | findstr :5001

# Linux/Mac
lsof -i :5001
```

**方案 2：终止占用端口的进程**
```bash
# Windows（假设 PID 是 1234）
taskkill /PID 1234 /F

# Linux/Mac
kill -9 1234
```

**方案 3：更改端口**
```env
# 在 .env 文件中修改端口
PORT=5002
```

---

### 2.2 数据库连接失败

#### 问题描述
```bash
Error: MongooseError: Buffering timed out
# 或
Error: connect ECONNREFUSED 127.0.0.1:27017
```

#### 可能原因
- MongoDB 服务未启动
- 连接字符串配置错误
- 网络连接问题

#### 解决方案

**方案 1：检查 MongoDB 服务状态**
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongodb
# 或
sudo service mongodb start
```

**方案 2：检查连接字符串**
```env
# 正确格式
MONGODB_URI=mongodb://localhost:27017/ai-content-flow

# 如果使用认证
MONGODB_URI=mongodb://username:password@localhost:27017/ai-content-flow
```

**方案 3：测试连接**
```bash
# 使用 MongoDB 客户端测试
mongosh mongodb://localhost:27017

# 或使用 mongoose
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/test').then(() => console.log('Connected')).catch(err => console.error(err));"
```

---

## 三、AI 服务问题

### 3.1 Ollama 连接失败

#### 问题描述
```bash
Error: connect ECONNREFUSED 127.0.0.1:11434
```

#### 可能原因
- Ollama 服务未启动
- Ollama 配置错误
- 模型未下载

#### 解决方案

**方案 1：检查 Ollama 服务**
```bash
# Windows/Mac：检查系统托盘中的 Ollama 图标
# Linux：检查服务状态
systemctl status ollama

# 或手动启动
ollama serve
```

**方案 2：检查模型是否已下载**
```bash
# 列出已下载的模型
ollama list

# 如果模型不存在，下载它
ollama pull llama3
```

**方案 3：检查配置**
```env
# 确认 .env 中的配置正确
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

**方案 4：测试连接**
```bash
# 测试 Ollama API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Hello"
}'
```

---

### 3.2 OpenRouter API 调用失败

#### 问题描述
```bash
Error: 401 Unauthorized
# 或
Error: 400 Provider returned error
```

#### 可能原因
- API Key 无效或过期
- 请求格式错误
- 模型名称错误

#### 解决方案

**方案 1：检查 API Key**
```bash
# 确认 API Key 正确
echo $OPENROUTER_API_KEY

# 或查看 .env 文件
cat .env | grep OPENROUTER_API_KEY
```

**方案 2：验证 API Key**
```bash
# 使用 curl 测试
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

**方案 3：检查模型名称**
```env
# 确保使用有效的模型名称
OPENROUTER_MODEL=deepseek/deepseek-chat-v3:free

# 查看可用模型
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

**方案 4：检查请求格式**
```javascript
// 确保请求格式正确
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'AI Content Generator'
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-chat-v3:free',
    messages: messages
  })
});
```

---

### 3.3 AI 分析返回空结果

#### 问题描述
```javascript
const analysis = await aiProviderService.analyzeTopics(topics);
console.log(analysis); // null
```

#### 可能原因
- AI 服务调用失败
- 响应解析错误
- 数据格式不正确

#### 解决方案

**方案 1：检查日志**
```bash
# 查看服务器日志
tail -f logs/server.log

# 或查看控制台输出
npm start
```

**方案 2：启用调试模式**
```env
# 在 .env 中启用调试
DEBUG=ai-provider:*
```

**方案 3：验证数据格式**
```javascript
// 确保传入的数据格式正确
const topics = [
  {
    title: '话题标题',
    source: '来源',
    heat: 100,
    description: '描述',
    keywords: ['关键词'],
    category: '分类',
    publishedAt: '2026-02-19'
  }
];

// 检查数据
console.log('Topics:', topics);
console.log('Topics length:', topics.length);
```

**方案 4：测试 AI 服务**
```javascript
// 直接测试 AI 服务
const result = await aiProviderService.chatCompletion([
  { role: 'user', content: '测试消息' }
], {
  provider: 'ollama'
});

console.log('Result:', result);
```

---

## 四、热点数据问题

### 4.1 热点数据获取失败

#### 问题描述
```bash
Error: Failed to fetch hot topics
# 或
Error: Timeout exceeded
```

#### 可能原因
- 数据源网站不可用
- 网络连接问题
- 反爬虫机制

#### 解决方案

**方案 1：检查网络连接**
```bash
# 测试网络连接
ping google.com

# 测试数据源网站
curl https://weibo.com
```

**方案 2：检查数据源配置**
```javascript
// 确认数据源配置正确
const sources = [
  'weibo',
  'zhihu',
  'toutiao',
  // ...
];

console.log('Sources:', sources);
```

**方案 3：使用缓存数据**
```javascript
// 如果实时获取失败，使用缓存
const cachedTopics = await cache.get('hot-topics');
if (cachedTopics) {
  console.log('Using cached data');
  return cachedTopics;
}
```

**方案 4：增加超时时间**
```javascript
// 增加请求超时时间
const response = await axios.get(url, {
  timeout: 30000 // 30 秒
});
```

---

### 4.2 热点数据为空

#### 问题描述
```javascript
const topics = await hotTopicsService.getTopics();
console.log(topics); // []
```

#### 可能原因
- 数据源返回空数据
- 数据解析错误
- 缓存问题

#### 解决方案

**方案 1：检查数据源响应**
```javascript
// 查看原始响应
const response = await axios.get(url);
console.log('Raw response:', response.data);
```

**方案 2：清除缓存**
```javascript
// 清除热点数据缓存
await cache.del('hot-topics');

// 或清除所有缓存
await cache.flushAll();
```

**方案 3：检查数据解析逻辑**
```javascript
// 确保数据解析正确
function parseTopics(data) {
  try {
    const topics = data.items || [];
    console.log('Parsed topics:', topics);
    return topics;
  } catch (error) {
    console.error('Parse error:', error);
    return [];
  }
}
```

**方案 4：使用备用数据源**
```javascript
// 如果主数据源失败，使用备用数据源
const sources = ['weibo', 'zhihu', 'toutiao'];
let topics = [];

for (const source of sources) {
  try {
    topics = await fetchTopics(source);
    if (topics.length > 0) break;
  } catch (error) {
    console.error(`${source} failed:`, error);
  }
}
```

---

## 五、前端问题

### 5.1 前端无法连接后端

#### 问题描述
```javascript
// 浏览器控制台错误
Error: Network Error
// 或
Error: Request failed with status code 404
```

#### 可能原因
- 后端服务未启动
- CORS 配置错误
- API 地址配置错误

#### 解决方案

**方案 1：检查后端服务**
```bash
# 检查后端是否运行
curl http://localhost:5001/api/health

# 或查看进程
ps aux | grep node
```

**方案 2：检查 CORS 配置**
```javascript
// 确保后端配置了 CORS
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));
```

**方案 3：检查 API 地址配置**
```javascript
// 确认前端配置的 API 地址正确
const API_BASE_URL = 'http://localhost:5001/api';

// 或使用环境变量
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

**方案 4：检查网络请求**
```javascript
// 使用浏览器开发者工具查看请求
fetch('http://localhost:5001/api/hot-topics')
  .then(response => {
    console.log('Response:', response);
    return response.json();
  })
  .then(data => {
    console.log('Data:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

### 5.2 前端构建失败

#### 问题描述
```bash
npm run build
# 错误：Module not found 或 Syntax error
```

#### 可能原因
- 依赖版本冲突
- 代码语法错误
- TypeScript 类型错误

#### 解决方案

**方案 1：清理构建缓存**
```bash
# 清理构建缓存
rm -rf dist build

# 清理 node_modules
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install
```

**方案 2：检查 TypeScript 错误**
```bash
# 运行 TypeScript 检查
npx tsc --noEmit

# 修复类型错误
```

**方案 3：检查依赖版本**
```bash
# 检查依赖版本
npm ls

# 更新依赖
npm update

# 或使用特定版本
npm install package@version
```

**方案 4：检查代码语法**
```bash
# 使用 ESLint 检查
npm run lint

# 修复 lint 错误
npm run lint:fix
```

---

## 六、性能问题

### 6.1 响应速度慢

#### 问题描述
- API 响应时间过长
- 页面加载缓慢
- AI 分析耗时过长

#### 可能原因
- 数据库查询慢
- 网络延迟
- AI 服务响应慢
- 未使用缓存

#### 解决方案

**方案 1：使用缓存**
```javascript
// 缓存频繁访问的数据
const cache = require('./utils/cache');

async function getHotTopics() {
  const cached = await cache.get('hot-topics');
  if (cached) {
    return cached;
  }

  const topics = await fetchTopics();
  await cache.set('hot-topics', topics, 3600); // 缓存 1 小时
  return topics;
}
```

**方案 2：优化数据库查询**
```javascript
// 使用索引
const schema = new mongoose.Schema({
  title: { type: String, index: true },
  createdAt: { type: Date, index: true }
});

// 使用投影
const topics = await Topic.find({}, { title: 1, heat: 1 });

// 使用限制
const topics = await Topic.find().limit(50);
```

**方案 3：使用更快的 AI 模型**
```javascript
// 使用较小的模型
const result = await aiProviderService.chatCompletion(messages, {
  provider: 'ollama',
  model: 'llama2', // 比 llama3 更快
  maxTokens: 1000 // 减少 token 数量
});
```

**方案 4：启用压缩**
```javascript
// 使用 gzip 压缩
const compression = require('compression');
app.use(compression());
```

---

### 6.2 内存占用过高

#### 问题描述
- Node.js 进程内存占用过高
- 应用崩溃或重启

#### 可能原因
- 内存泄漏
- 大量数据缓存
- 未释放资源

#### 解决方案

**方案 1：监控内存使用**
```javascript
// 定期输出内存使用情况
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory:', {
    rss: Math.round(used.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
  });
}, 60000); // 每分钟
```

**方案 2：限制缓存大小**
```javascript
// 使用 LRU 缓存
const LRU = require('lru-cache');
const cache = new LRU({
  max: 500, // 最多缓存 500 项
  maxAge: 1000 * 60 * 60 // 1 小时过期
});
```

**方案 3：及时释放资源**
```javascript
// 使用后及时关闭连接
const connection = await createConnection();
try {
  // 使用连接
} finally {
  connection.close();
}
```

**方案 4：使用流式处理**
```javascript
// 使用流处理大文件
const fs = require('fs');
const stream = fs.createReadStream('large-file.json');
stream.pipe(response);
```

---

## 七、日志和调试

### 7.1 启用调试日志

```bash
# 启用所有调试日志
DEBUG=* npm start

# 启用特定模块的日志
DEBUG=hot-topics:* npm start

# 启用 AI 服务日志
DEBUG=ai-provider:* npm start
```

### 7.2 查看日志文件

```bash
# 查看最新日志
tail -f logs/server.log

# 查看错误日志
tail -f logs/error.log

# 搜索特定错误
grep "Error" logs/server.log
```

### 7.3 使用浏览器开发者工具

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页的错误
3. 查看 Network 标签页的请求
4. 查看 Application 标签页的存储

---

## 八、获取帮助

### 8.1 查看文档

- [文档中心](../INDEX.md)
- [快速参考](../QUICK_REFERENCE.md)
- [API 文档](../05-api/api-reference.md)
- [架构设计](../03-architecture/system-architecture.md)

### 8.2 搜索问题

- [GitHub Issues](https://github.com/your-org/ai-content-flow/issues)
- [GitHub Discussions](https://github.com/your-org/ai-content-flow/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ai-content-flow)

### 8.3 联系支持

- 开发问题: [GitHub Discussions](https://github.com/your-org/ai-content-flow/discussions)
- 安全问题: security@example.com
- 商业咨询: contact@example.com

---

## 九、预防措施

### 9.1 定期维护

- [ ] 定期更新依赖
- [ ] 定期检查日志
- [ ] 定期备份数据
- [ ] 定期测试备份

### 9.2 监控和告警

- [ ] 设置服务监控
- [ ] 配置错误告警
- [ ] 监控性能指标
- [ ] 监控资源使用

### 9.3 文档更新

- [ ] 及时更新文档
- [ ] 记录新问题
- [ ] 分享解决方案
- [ ] 审查文档准确性

---

**文档维护者**: AI 开发团队
**创建时间**: 2026-02-19
**最后更新**: 2026-02-19
**版本**: 1.0
