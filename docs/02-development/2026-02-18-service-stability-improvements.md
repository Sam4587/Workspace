# 服务稳定性改进实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 提升后端服务稳定性，修复模块加载失败问题，增强系统健壮性

**Architecture:** 修复现有服务模块加载问题，添加免费LLM支持，完善错误处理机制

**Tech Stack:** Node.js, Express, OpenAI SDK, 百度AI, 讯飞AI

---

## Phase 1: 短期修复（P1 - 高优先级）

### Task 1: 修复 MultiPlatformAdaptationService 加载失败

**问题分析：**
```
[ContentRoute] MultiPlatformAdaptationService 加载失败: Cannot read properties of undefined (reading 'bind')
```

**Files:**
- Modify: `server/services/MultiPlatformAdaptationService.js`
- Test: 启动服务器验证日志

**Step 1: 定位问题**

```bash
# 查找 MultiPlatformAdaptationService 文件
ls server/services/MultiPlatformAdaptationService.js
```

**Step 2: 分析依赖问题**

检查文件中 `bind` 调用的位置，通常是某个依赖模块未正确导出。

**Step 3: 修复依赖或添加 fallback**

在 `server/routes/contents.js` 中添加安全加载：

```javascript
let multiPlatformAdaptationService = null;
try {
  multiPlatformAdaptationService = require('../services/MultiPlatformAdaptationService');
  console.log('[ContentRoute] MultiPlatformAdaptationService 加载成功');
} catch (error) {
  console.warn('[ContentRoute] MultiPlatformAdaptationService 加载失败:', error.message);
  multiPlatformAdaptationService = {
    adaptContent: async (content, platform) => ({ content, platform }),
    getPlatformRules: () => ({})
  };
}
```

**Step 4: 验证修复**

```bash
cd server && node server.js
# 检查日志中是否还有加载失败错误
```

**Step 5: Commit**

```bash
git add server/services/MultiPlatformAdaptationService.js server/routes/contents.js
git commit -m "fix: 修复 MultiPlatformAdaptationService 加载失败问题"
```

---

### Task 2: 创建免费 LLM Gateway 模块

**Files:**
- Create: `server/services/llm.js`
- Test: `server/tests/llm.test.js`（可选）

**Step 1: 创建 LLM Gateway 模块**

```javascript
// server/services/llm.js
const axios = require('axios');

class LLMGateway {
  constructor() {
    this.providers = new Map();
    this.registerProviders();
  }

  registerProviders() {
    // 注册免费 LLM 提供商
    if (process.env.GROQ_API_KEY) {
      this.providers.set('groq', {
        name: 'Groq',
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.1-70b-versatile'
      });
    }
    
    if (process.env.TOGETHER_API_KEY) {
      this.providers.set('together', {
        name: 'Together AI',
        apiKey: process.env.TOGETHER_API_KEY,
        baseUrl: 'https://api.together.xyz/v1',
        model: 'meta-llama/Llama-3-70b-chat-hf'
      });
    }
    
    // 默认使用免费的本地模型（如果配置了 Ollama）
    if (process.env.OLLAMA_BASE_URL) {
      this.providers.set('ollama', {
        name: 'Ollama',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3'
      });
    }
  }

  async generate(messages, options = {}) {
    const provider = this.selectProvider(options.provider);
    
    if (!provider) {
      throw new Error('No LLM provider available');
    }

    switch (provider.name) {
      case 'Groq':
      case 'Together AI':
        return await this.callOpenAICompatible(provider, messages, options);
      case 'Ollama':
        return await this.callOllama(provider, messages, options);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  selectProvider(preferred) {
    if (preferred && this.providers.has(preferred)) {
      return this.providers.get(preferred);
    }
    
    // 优先级: Groq > Together > Ollama
    const priority = ['groq', 'together', 'ollama'];
    for (const name of priority) {
      if (this.providers.has(name)) {
        return this.providers.get(name);
      }
    }
    
    return null;
  }

  async callOpenAICompatible(provider, messages, options) {
    try {
      const response = await axios.post(
        `${provider.baseUrl}/chat/completions`,
        {
          model: provider.model,
          messages,
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        provider: provider.name.toLowerCase(),
        usage: response.data.usage
      };
    } catch (error) {
      throw new Error(`LLM call failed: ${error.message}`);
    }
  }

  async callOllama(provider, messages, options) {
    try {
      const response = await axios.post(
        `${provider.baseUrl}/api/chat`,
        {
          model: provider.model,
          messages,
          stream: false,
          options: {
            num_predict: options.maxTokens || 2000,
            temperature: options.temperature || 0.7
          }
        }
      );

      return {
        content: response.data.message.content,
        model: provider.model,
        provider: 'ollama',
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0
        }
      };
    } catch (error) {
      throw new Error(`Ollama call failed: ${error.message}`);
    }
  }

  getAvailableProviders() {
    return Array.from(this.providers.values()).map(p => ({
      name: p.name,
      model: p.model
    }));
  }

  getModels() {
    return this.getAvailableProviders();
  }
}

module.exports = new LLMGateway();
```

**Step 2: 更新环境变量模板**

在 `.env.example` 中添加：

```
# 免费 LLM 提供商（可选）
GROQ_API_KEY=your_groq_api_key
TOGETHER_API_KEY=your_together_api_key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

**Step 3: 验证模块加载**

```bash
cd server && node -e "console.log(require('./services/llm').getAvailableProviders())"
```

**Step 4: Commit**

```bash
git add server/services/llm.js .env.example
git commit -m "feat: 添加免费 LLM Gateway 模块支持 Groq/Together/Ollama"
```

---

### Task 3: 添加服务健康检查增强

**Files:**
- Modify: `server/routes/enhancedHealth.js`
- Test: API 测试

**Step 1: 添加依赖服务状态检查**

在健康检查中添加模块加载状态：

```javascript
// 在 health check 响应中添加
const healthCheck = {
  // ... 现有字段
  services: {
    llmGateway: llmGateway ? 'ok' : 'fallback',
    multiPlatformAdaptation: multiPlatformAdaptationService ? 'ok' : 'fallback',
    aiService: 'ok'
  }
};
```

**Step 2: 测试健康检查**

```bash
curl http://localhost:5001/api/health
```

**Step 3: Commit**

```bash
git add server/routes/enhancedHealth.js
git commit -m "feat: 健康检查添加服务模块状态"
```

---

## Phase 2: 中期优化（P2 - 中优先级）

### Task 4: 添加请求重试机制

**Files:**
- Create: `server/utils/retry.js`
- Modify: `server/services/multiAIService.js`

**Step 1: 创建重试工具**

```javascript
// server/utils/retry.js
async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry = () => {}
  } = options;

  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(backoff, i);
        onRetry(i + 1, error, waitTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

module.exports = { retry };
```

**Step 2: 在 AI 服务中应用重试**

```javascript
const { retry } = require('../utils/retry');

// 替换直接的 API 调用
async generateContent(prompt, options = {}) {
  return retry(
    () => this._generateContent(prompt, options),
    {
      maxRetries: 2,
      delay: 500,
      onRetry: (attempt, error) => {
        console.warn(`[MultiAIService] 重试 ${attempt}: ${error.message}`);
      }
    }
  );
}
```

**Step 3: Commit**

```bash
git add server/utils/retry.js server/services/multiAIService.js
git commit -m "feat: 添加 API 请求重试机制"
```

---

### Task 5: 添加请求超时配置

**Files:**
- Modify: `server/server.js`

**Step 1: 配置全局请求超时**

```javascript
// 在 server.js 中添加
app.use((req, res, next) => {
  req.setTimeout(30000); // 30秒超时
  res.setTimeout(30000);
  next();
});
```

**Step 2: Commit**

```bash
git add server/server.js
git commit -m "feat: 添加全局请求超时配置"
```

---

## Phase 3: 长期演进（P3 - 低优先级）

### Task 6: Redis 缓存集成准备

**Files:**
- Create: `server/utils/redisCache.js`
- Modify: `server/utils/CacheManager.js`

**Step 1: 创建 Redis 缓存适配器**

```javascript
// server/utils/redisCache.js
const Redis = require('ioredis');

class RedisCache {
  constructor() {
    this.client = null;
    this.enabled = !!process.env.REDIS_URL;
    
    if (this.enabled) {
      this.client = new Redis(process.env.REDIS_URL);
      this.client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        this.enabled = false;
      });
    }
  }

  async get(key) {
    if (!this.enabled) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.enabled) return;
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('[Redis] Set error:', error.message);
    }
  }
}

module.exports = new RedisCache();
```

**Step 2: 更新 .env.example**

```
# Redis 缓存（可选，用于多实例部署）
REDIS_URL=redis://localhost:6379
```

**Step 3: Commit**

```bash
git add server/utils/redisCache.js .env.example
git commit -m "feat: 添加 Redis 缓存适配器（可选）"
```

---

## 验证清单

完成所有任务后，执行以下验证：

```bash
# 1. 启动服务器
cd server && node server.js

# 2. 检查日志无错误
# 应该看到：
# [ContentRoute] MultiPlatformAdaptationService 加载成功
# [MultiAIService] LLM Gateway 加载成功

# 3. 测试健康检查
curl http://localhost:5001/api/health

# 4. 测试热点 API
curl http://localhost:5001/api/hot-topics?limit=5

# 5. 测试内容生成（需要配置 API Key）
curl -X POST http://localhost:5001/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"测试话题","type":"micro"}'
```

---

## 执行优先级

| Phase | 任务 | 预计时间 | 优先级 |
|-------|------|----------|--------|
| P1 | Task 1: 修复 MultiPlatformAdaptationService | 15分钟 | 高 |
| P1 | Task 2: 创建免费 LLM Gateway | 20分钟 | 高 |
| P1 | Task 3: 健康检查增强 | 10分钟 | 中 |
| P2 | Task 4: 请求重试机制 | 15分钟 | 中 |
| P2 | Task 5: 请求超时配置 | 5分钟 | 中 |
| P3 | Task 6: Redis 缓存准备 | 20分钟 | 低 |

**总计：约 85 分钟**
