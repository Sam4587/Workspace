# Requirements Document

## Introduction

本文档描述了 LiteLLM 多提供商集成功能，旨在整合 free-llm-api-resources 项目中的免费和试用额度 LLM API 服务，为 AI 内容创作系统提供稳定、多样化的 AI 能力支持。

## Glossary

- **LLM**: Large Language Model，大语言模型
- **LiteLLM**: 统一的多 LLM 提供商封装库
- **免费提供商**: 完全免费使用的 LLM API 服务
- **试用额度提供商**: 提供初始免费额度，后续需付费的 LLM API 服务
- **Rate Limit**: API 调用频率限制

## Provider Categories

### 免费提供商 (Free Providers)

| 提供商 | 说明 | 限制 |
|--------|------|------|
| OpenRouter | 聚合多个免费模型 | 20 req/min, 50 req/day |
| Google AI Studio | Gemini 系列模型 | 250K tokens/min |
| NVIDIA NIM | 多种开源模型 | 40 req/min |
| Mistral La Plateforme | Mistral 模型 | 1 req/s, 500K tokens/min |
| HuggingFace Inference | 开源模型 | $0.10/月额度 |
| Groq | 高速推理 | 因模型而异 |
| Cerebras | 超高速推理 | 30 req/min |
| Cohere | Command 系列 | 20 req/min, 1K req/month |
| Cloudflare Workers AI | 开源模型 | 10K neurons/day |

### 试用额度提供商 (Providers with Trial Credits)

| 提供商 | 试用额度 | 说明 |
|--------|----------|------|
| Fireworks | $1 | 多种开源模型 |
| Baseten | $30 | 按计算时间付费 |
| Nebius | $1 | 多种开源模型 |
| Novita | $0.5/年 | 多种开源模型 |
| AI21 | $10/3个月 | Jamba 系列模型 |
| Upstage | $10/3个月 | Solar 系列模型 |
| Hyperbolic | $1 | 多种开源模型 |
| SambaNova Cloud | $5/3个月 | 多种开源模型 |

## Requirements

### Requirement 1: 提供商管理

**User Story:** AS 系统管理员，我想要统一管理多个 LLM 提供商，以便灵活切换和使用

#### Acceptance Criteria

1. WHEN 系统启动，THEN SHALL 初始化所有已配置的 LLM 提供商
2. IF 提供商 API Key 未配置，THEN SHALL 将该提供商标记为不可用
3. IF 提供商调用失败，THEN SHALL 自动切换到备用提供商
4. IF 所有提供商都不可用，THEN SHALL 返回错误信息

### Requirement 2: 模型列表管理

**User Story:** AS 开发者，我想要获取所有可用模型的列表，以便选择合适的模型

#### Acceptance Criteria

1. WHEN 用户请求模型列表，THEN SHALL 返回所有可用模型的信息
2. IF 模型属于免费提供商，THEN SHALL 标记为 free
3. IF 模型属于试用额度提供商，THEN SHALL 显示试用额度信息
4. IF 模型有速率限制，THEN SHALL 显示限制信息

### Requirement 3: 统一调用接口

**User Story:** AS 开发者，我想要使用统一的接口调用不同的 LLM 提供商，以便简化集成

#### Acceptance Criteria

1. WHEN 用户调用 generateContent，THEN SHALL 根据配置选择提供商并发起请求
2. IF 主提供商不可用，THEN SHALL 自动切换到备用提供商
3. IF 请求超时，THEN SHALL 重试最多 3 次
4. IF 重试失败，THEN SHALL 返回错误信息

### Requirement 4: 负载均衡

**User Story:** AS 系统管理员，我想要在多个提供商之间实现负载均衡，以优化性能和成本

#### Acceptance Criteria

1. WHEN 请求到达，THEN SHALL 根据配置策略选择提供商（轮询/随机/最低延迟）
2. IF 当前提供商达到速率限制，THEN SHALL 自动切换到下一个提供商
3. IF 提供商可用率低于阈值，THEN SHALL 记录告警

### Requirement 5: 成本追踪

**User Story:** AS 系统管理员，我想要追踪各提供商的调用成本，以便优化费用

#### Acceptance Criteria

1. WHEN 完成一次 API 调用，THEN SHALL 记录调用信息（提供商、模型、tokens）
2. WHEN 用户请求成本统计，THEN SHALL 返回按提供商/模型分组的统计信息
3. IF 试用额度即将用完，THEN SHALL 发送告警通知

### Requirement 6: 健康检查

**User Story:** AS 系统管理员，我想要监控各提供商的状态，以便及时发现问题

#### Acceptance Criteria

1. WHEN 用户请求健康状态，THEN SHALL 返回所有提供商的可用性状态
2. IF 提供商响应时间超过阈值，THEN SHALL 标记为慢
3. IF 提供商连续失败 3 次，THEN SHALL 标记为不可用
