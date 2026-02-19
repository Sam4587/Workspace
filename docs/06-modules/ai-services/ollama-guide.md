---
title: Ollama 本地部署指南
category: AI服务
tags: [Ollama, 本地部署, AI分析]
updated: 2026-02-19
version: 1.0
author: AI开发团队
---

# Ollama 本地部署指南

> **使用本地部署的 Ollama 进行 AI 分析**

**版本**: 1.0 | **创建时间**: 2026-02-19 | **最后更新**: 2026-02-19

---

## 一、概述

Ollama 是一个开源的大语言模型运行工具，允许你在本地运行各种 LLM 模型。AI Content Flow 项目已集成 Ollama 支持，可以使用本地模型进行 AI 分析，无需依赖外部 API。

### 优势

- ✅ **隐私保护**: 数据不离开本地
- ✅ **成本节约**: 无需支付 API 费用
- ✅ **离线可用**: 无需网络连接
- ✅ **高性能**: 本地推理速度快

---

## 二、安装 Ollama

### 2.1 系统要求

| 系统 | 最低配置 | 推荐配置 |
|------|----------|----------|
| Windows | Windows 10+ | Windows 11 |
| macOS | macOS 11+ | macOS 13+ |
| Linux | 内核 5.10+ | 内核 6.0+ |

| 硬件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 4 核 | 8 核+ |
| 内存 | 8GB | 16GB+ |
| 存储 | 10GB 可用空间 | 20GB+ 可用空间 |
| GPU | 无 | NVIDIA GPU（可选） |

### 2.2 安装步骤

#### Windows

1. 访问 [Ollama 官网](https://ollama.com/download/windows)
2. 下载 Windows 安装程序
3. 运行安装程序
4. 安装完成后，Ollama 会自动启动

#### macOS

1. 访问 [Ollama 官网](https://ollama.com/download/mac)
2. 下载 macOS 安装程序
3. 运行安装程序
4. 安装完成后，Ollama 会自动启动

#### Linux

```bash
# 使用官方安装脚本
curl -fsSL https://ollama.com/install.sh | sh

# 或使用包管理器
# Ubuntu/Debian
sudo apt-get install ollama

# Fedora/RHEL
sudo dnf install ollama
```

### 2.3 验证安装

```bash
# 检查 Ollama 版本
ollama --version

# 检查 Ollama 服务状态
ollama ps
```

---

## 三、下载模型

### 3.1 可用模型

| 模型 | 大小 | 用途 | 推荐度 |
|------|------|------|--------|
| llama3 | 4.7GB | 通用对话 | ⭐⭐⭐⭐⭐ |
| llama2 | 3.8GB | 通用对话 | ⭐⭐⭐⭐ |
| qwen2.5 | 4.6GB | 中文优化 | ⭐⭐⭐⭐⭐ |
| deepseek-r1 | 4.7GB | 推理能力强 | ⭐⭐⭐⭐ |
| mistral | 4.1GB | 通用对话 | ⭐⭐⭐ |

### 3.2 下载模型

```bash
# 下载 Llama 3（推荐）
ollama pull llama3

# 下载 Qwen 2.5（中文优化）
ollama pull qwen2.5

# 下载 DeepSeek R1（推理能力强）
ollama pull deepseek-r1

# 下载 Mistral
ollama pull mistral
```

### 3.3 查看已下载模型

```bash
# 列出所有已下载的模型
ollama list

# 查看模型详细信息
ollama show llama3
```

---

## 四、配置项目

### 4.1 环境变量配置

在项目根目录的 `.env` 文件中添加以下配置：

```env
# AI 提供商配置
AI_DEFAULT_PROVIDER=ollama

# Ollama（本地部署）
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### 4.2 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `AI_DEFAULT_PROVIDER` | 默认 AI 提供商 | `ollama` |
| `OLLAMA_ENABLED` | 是否启用 Ollama | `true` |
| `OLLAMA_BASE_URL` | Ollama 服务地址 | `http://localhost:11434` |
| `OLLAMA_MODEL` | 使用的模型名称 | `llama3` |

### 4.3 切换模型

如果需要使用不同的模型，修改 `OLLAMA_MODEL` 配置：

```env
# 使用 Qwen 2.5
OLLAMA_MODEL=qwen2.5

# 使用 DeepSeek R1
OLLAMA_MODEL=deepseek-r1

# 使用 Mistral
OLLAMA_MODEL=mistral
```

---

## 五、使用 Ollama

### 5.1 启动 Ollama 服务

#### Windows/Mac

Ollama 安装后会自动启动，可以在系统托盘中找到 Ollama 图标。

#### Linux

```bash
# 启动 Ollama 服务
ollama serve

# 或使用 systemd（推荐）
sudo systemctl start ollama
sudo systemctl enable ollama
```

### 5.2 测试连接

使用项目提供的测试脚本：

```bash
cd server
node test-ollama.js
```

预期输出：
```
=== Ollama 测试 ===

1. 检查 AI 提供商配置...
可用提供商: ollama
✓ Ollama 已配置
  地址: 已配置模型

2. 测试 Ollama 连接...
✓ Ollama 连接成功！
响应: 你好！我是 Llama 3，一个由 Meta AI 开发的大型语言模型...
```

### 5.3 在代码中使用

#### 直接调用

```javascript
const aiProviderService = require('./services/aiProviderService');

const result = await aiProviderService.chatCompletion([
  { role: 'user', content: '你好，请介绍一下你自己' }
], {
  provider: 'ollama',
  maxTokens: 100
});

console.log(result.content);
```

#### AI 分析

```javascript
const analysis = await aiProviderService.analyzeTopics(topics, {
  provider: 'ollama',
  includeTrends: true,
  includeSentiment: true,
  includeKeywords: true,
  includeSummary: true,
  maxTopics: 50
});
```

---

## 六、高级配置

### 6.1 自定义模型参数

在 `server/services/aiProviderService.js` 中修改 `ollamaCompletion` 方法：

```javascript
async ollamaCompletion(provider, messages, options) {
  try {
    const response = await axios.post(
      `${provider.baseUrl}/api/chat`,
      {
        model: options.model,
        messages,
        stream: false,
        options: {
          num_predict: options.maxTokens || 2000,  // 最大生成 token 数
          temperature: options.temperature || 0.7,  // 温度参数
          top_p: 0.9,  // Top-p 采样
          top_k: 40,  // Top-k 采样
          repeat_penalty: 1.1,  // 重复惩罚
        }
      },
      {
        timeout: 120000  // 超时时间（毫秒）
      }
    );

    return {
      content: response.data.message.content,
      model: options.model,
      usage: {
        prompt_tokens: response.data.prompt_eval_count || 0,
        completion_tokens: response.data.eval_count || 0,
        total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
      }
    };
  } catch (error) {
    throw new Error(`Ollama 调用失败: ${error.message}`);
  }
}
```

### 6.2 使用 GPU 加速

如果你有 NVIDIA GPU，可以启用 GPU 加速：

```bash
# 检查 GPU 是否可用
nvidia-smi

# Ollama 会自动检测并使用 GPU
# 如果没有自动检测，可以手动指定
CUDA_VISIBLE_DEVICES=0 ollama serve
```

### 6.3 多模型切换

在代码中动态切换模型：

```javascript
const result1 = await aiProviderService.chatCompletion(messages, {
  provider: 'ollama',
  model: 'llama3'
});

const result2 = await aiProviderService.chatCompletion(messages, {
  provider: 'ollama',
  model: 'qwen2.5'
});
```

---

## 七、故障排查

### 7.1 常见问题

#### 问题 1: 连接被拒绝

**错误信息**:
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

**解决方案**:
1. 检查 Ollama 服务是否运行
2. 在 Windows/Mac 上检查系统托盘中的 Ollama 图标
3. 在 Linux 上运行 `systemctl status ollama`
4. 如果服务未运行，启动 Ollama 服务

#### 问题 2: 模型未找到

**错误信息**:
```
Error: model 'llama3' not found
```

**解决方案**:
1. 检查模型是否已下载：`ollama list`
2. 如果模型不存在，下载模型：`ollama pull llama3`
3. 检查 `.env` 文件中的模型名称是否正确

#### 问题 3: 内存不足

**错误信息**:
```
Error: out of memory
```

**解决方案**:
1. 关闭其他占用内存的程序
2. 使用更小的模型（如 `llama2`）
3. 减少 `maxTokens` 参数
4. 增加系统内存

#### 问题 4: 响应速度慢

**解决方案**:
1. 使用 GPU 加速
2. 使用更小的模型
3. 减少 `maxTokens` 参数
4. 检查系统资源使用情况

### 7.2 调试模式

启用详细日志：

```bash
# 在 .env 文件中添加
DEBUG=ollama:*

# 或在启动命令中设置
DEBUG=ollama:* npm start
```

---

## 八、性能优化

### 8.1 模型选择建议

| 场景 | 推荐模型 | 原因 |
|------|----------|------|
| 通用对话 | llama3 | 性能平衡 |
| 中文任务 | qwen2.5 | 中文优化 |
| 推理任务 | deepseek-r1 | 推理能力强 |
| 资源受限 | llama2 | 模型较小 |

### 8.2 参数调优

#### Temperature（温度）

| 值 | 效果 | 适用场景 |
|----|------|----------|
| 0.1-0.3 | 输出确定、一致 | 代码生成、数据分析 |
| 0.4-0.7 | 平衡创造性和一致性 | 内容生成、对话 |
| 0.8-1.0 | 输出随机、创造性 | 创意写作、头脑风暴 |

#### Max Tokens（最大生成长度）

| 任务 | 推荐值 | 说明 |
|------|--------|------|
| 简单问答 | 500-1000 | 短答案 |
| 内容生成 | 2000-3000 | 长内容 |
| 代码生成 | 1000-2000 | 代码片段 |

### 8.3 缓存策略

项目已内置缓存机制，可以减少重复计算：

```javascript
// 缓存配置在 server/utils/cache.js
const cache = require('./utils/cache');

// 设置缓存
cache.set('key', value, 3600); // 缓存 1 小时

// 获取缓存
const value = cache.get('key');
```

---

## 九、与云端 API 对比

| 特性 | Ollama | 云端 API |
|------|--------|----------|
| 成本 | 免费 | 按使用付费 |
| 隐私 | 数据本地 | 数据上传 |
| 性能 | 取决于硬件 | 云端高性能 |
| 离线 | 支持 | 不支持 |
| 维护 | 需要维护 | 无需维护 |
| 模型更新 | 手动更新 | 自动更新 |

---

## 十、最佳实践

### 10.1 开发环境

- ✅ 使用 Ollama 进行开发和测试
- ✅ 使用较小的模型（如 `llama2`）
- ✅ 启用调试日志

### 10.2 生产环境

- ⚠️ 评估硬件资源是否足够
- ⚠️ 考虑使用云端 API 作为备份
- ⚠️ 监控性能和资源使用

### 10.3 混合使用

```javascript
// 优先使用 Ollama，失败时切换到云端 API
async function smartAIAnalysis(topics) {
  try {
    return await aiProviderService.analyzeTopics(topics, {
      provider: 'ollama'
    });
  } catch (error) {
    console.warn('Ollama 失败，切换到云端 API');
    return await aiProviderService.analyzeTopics(topics, {
      provider: 'openrouter'
    });
  }
}
```

---

## 十一、相关文档

| 文档 | 说明 |
|------|------|
| [Ollama 官方文档](https://ollama.com/docs) | Ollama 完整文档 |
| [Ollama 模型库](https://ollama.com/library) | 可用模型列表 |
| [LiteLLM 集成](../../specs/litellm-integration/) | 多提供商集成 |
| [AI 服务对比](../../analysis/AI-SERVICES-COMPARISON.md) | AI 服务对比分析 |

---

## 十二、附录

### 12.1 命令速查

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull llama3

# 列出模型
ollama list

# 运行模型
ollama run llama3

# 删除模型
ollama rm llama3

# 查看模型信息
ollama show llama3

# 检查服务状态
ollama ps

# 查看版本
ollama --version
```

### 12.2 环境变量完整列表

```env
# AI 提供商配置
AI_DEFAULT_PROVIDER=ollama

# Ollama 配置
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# 备用提供商（可选）
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=deepseek/deepseek-chat-v3:free

DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_MODEL=deepseek-chat

GROQ_API_KEY=gsk_xxx
GROQ_MODEL=llama-3.3-70b-versatile
```

---

**文档维护者**: AI 开发团队
**创建时间**: 2026-02-19
**最后更新**: 2026-02-19
