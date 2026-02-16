const openai = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ZhipuAI } = require('zhipuai');
const QianfanSDK = require('@baiducloud/qianfan');
const logger = require('../utils/logger');

class AIProviderService {
  constructor() {
    this.providers = new Map();

    // 初始化所有配置的提供商
    this.initializeProviders();
  }

  initializeProviders() {
    // OpenAI / DeepSeek / 兼容 OpenAI API 的提供商
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        name: 'OpenAI',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
        }),
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        enabled: true
      });
    }

    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set('deepseek', {
        name: 'DeepSeek',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: 'https://api.deepseek.com'
        }),
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        enabled: true
      });
    }

    if (process.env.GROQ_API_KEY) {
      this.providers.set('groq', {
        name: 'Groq',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1'
        }),
        model: process.env.GROQ_MODEL || 'llama3-70b-8192',
        enabled: true
      });
    }

    if (process.env.TOGETHER_API_KEY) {
      this.providers.set('together', {
        name: 'Together',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.TOGETHER_API_KEY,
          baseURL: 'https://api.together.xyz/v1'
        }),
        model: process.env.TOGETHER_MODEL || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        enabled: true
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        name: 'Anthropic (Claude)',
        type: 'anthropic',
        client: new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        }),
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        enabled: true
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', {
        name: 'Google Gemini',
        type: 'gemini',
        client: new GoogleGenerativeAI(process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        enabled: true
      });
    }

    if (process.env.QWEN_API_KEY) {
      this.providers.set('qwen', {
        name: 'Alibaba Qwen',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.QWEN_API_KEY,
          baseURL: process.env.QWEN_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        }),
        model: process.env.QWEN_MODEL || 'qwen-plus',
        enabled: true
      });
    }

    if (process.env.ZHIPU_API_KEY) {
      this.providers.set('zhipu', {
        name: 'Zhipu AI (GLM)',
        type: 'zhipu',
        client: new ZhipuAI({
          apiKey: process.env.ZHIPU_API_KEY
        }),
        model: process.env.ZHIPU_MODEL || 'glm-4',
        enabled: true
      });
    }

    if (process.env.QIANFAN_ACCESS_KEY && process.env.QIANFAN_SECRET_KEY) {
      this.providers.set('qianfan', {
        name: 'Baidu Qianfan',
        type: 'qianfan',
        client: new QianfanSDK.Qianfan(process.env.QIANFAN_ACCESS_KEY, process.env.QIANFAN_SECRET_KEY),
        model: process.env.QIANFAN_MODEL || 'ERNIE-4.0-8K',
        enabled: true
      });
    }

    if (process.env.MOONSHOT_API_KEY) {
      this.providers.set('moonshot', {
        name: 'Moonshot AI (Kimi)',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.MOONSHOT_API_KEY,
          baseURL: 'https://api.moonshot.cn/v1'
        }),
        model: process.env.MOONSHOT_MODEL || 'moonshot-v1-8k',
        enabled: true
      });
    }

    if (process.env.BAICHUAN_API_KEY) {
      this.providers.set('baichuan', {
        name: 'Baichuan AI',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.BAICHUAN_API_KEY,
          baseURL: process.env.BAICHUAN_API_BASE || 'https://api.baichuan-ai.com/v1'
        }),
        model: process.env.BAICHUAN_MODEL || 'Baichuan4',
        enabled: true
      });
    }

    if (process.env.MINIMAX_API_KEY) {
      this.providers.set('minimax', {
        name: 'MiniMax',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.MINIMAX_API_KEY,
          baseURL: process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1'
        }),
        model: process.env.MINIMAX_MODEL || 'abab6.5s-chat',
        enabled: true
      });
    }

    if (process.env.SILICONFLOW_API_KEY) {
      this.providers.set('siliconflow', {
        name: 'SiliconFlow',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.SILICONFLOW_API_KEY,
          baseURL: 'https://api.siliconflow.cn/v1'
        }),
        model: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V3',
        enabled: true
      });
    }

    if (process.env.O1_API_KEY) {
      this.providers.set('o1', {
        name: 'O1',
        type: 'openai',
        client: new openai.OpenAI({
          apiKey: process.env.O1_API_KEY,
          baseURL: process.env.O1_API_BASE || 'https://api.o1.com/v1'
        }),
        model: process.env.O1_MODEL || 'o1-1',
        enabled: true
      });
    }

    // 设置默认提供商
    this.defaultProvider = process.env.AI_DEFAULT_PROVIDER || 'deepseek';
    if (!this.providers.has(this.defaultProvider)) {
      const firstEnabled = Array.from(this.providers.keys())[0];
      this.defaultProvider = firstEnabled;
      logger.warn(`默认提供商 ${process.env.AI_DEFAULT_PROVIDER} 未配置，使用 ${firstEnabled}`);
    }
  }

  getProvider(providerId = null) {
    const id = providerId || this.defaultProvider;
    const provider = this.providers.get(id);

    if (!provider) {
      throw new Error(`AI 提供商 ${id} 未配置或不可用`);
    }

    if (!provider.enabled) {
      throw new Error(`AI 提供商 ${id} 已禁用`);
    }

    return provider;
  }

  async chatCompletion(messages, options = {}) {
    const {
      provider = null,
      model = null,
      temperature = 0.3,
      maxTokens = 2000,
      responseFormat = null,
      stream = false
    } = options;

    const providerConfig = this.getProvider(provider);

    try {
      const startTime = Date.now();
      let result;

      switch (providerConfig.type) {
        case 'openai':
          result = await this.openaiCompletion(providerConfig, messages, {
            model: model || providerConfig.model,
            temperature,
            maxTokens,
            responseFormat,
            stream
          });
          break;

        case 'anthropic':
          result = await this.anthropicCompletion(providerConfig, messages, {
            model: model || providerConfig.model,
            temperature,
            maxTokens,
            stream
          });
          break;

        case 'gemini':
          result = await this.geminiCompletion(providerConfig, messages, {
            model: model || providerConfig.model,
            temperature,
            maxTokens
          });
          break;

        case 'zhipu':
          result = await this.zhipuCompletion(providerConfig, messages, {
            model: model || providerConfig.model,
            temperature,
            maxTokens
          });
          break;

        case 'qianfan':
          result = await this.qianfanCompletion(providerConfig, messages, {
            model: model || providerConfig.model,
            temperature,
            maxTokens
          });
          break;

        default:
          throw new Error(`不支持的提供商类型: ${providerConfig.type}`);
      }

      const latency = Date.now() - startTime;
      logger.info(`AI 调用成功`, {
        provider: providerConfig.name,
        model: result.model || model || providerConfig.model,
        latency,
        tokens: result.usage?.total_tokens
      });

      return result;
    } catch (error) {
      logger.error(`AI 调用失败`, {
        provider: providerConfig.name,
        error: error.message
      });
      throw error;
    }
  }

  async openaiCompletion(provider, messages, options) {
    const response = await provider.client.chat.completions.create({
      model: options.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      ...(options.responseFormat && { response_format: options.responseFormat })
    });

    return {
      content: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    };
  }

  async anthropicCompletion(provider, messages, options) {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await provider.client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    });

    return {
      content: response.content[0].text,
      model: response.model,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  }

  async geminiCompletion(provider, messages, options) {
    const model = provider.client.getGenerativeModel({ model: options.model });

    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const prompt = userMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    const generationConfig = {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      responseMimeType: 'text/plain'
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      ...(systemMessage && { systemInstruction: systemMessage.content })
    });

    const response = result.response;
    return {
      content: response.text(),
      model: options.model,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  async zhipuCompletion(provider, messages, options) {
    const response = await provider.client.chat.completions.create({
      model: options.model,
      messages: messages.map(m => ({
        role: m.role === 'system' ? 'system' : 'user',
        content: m.content
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens
    });

    return {
      content: response.choices[0].message.content,
      model: options.model,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      }
    };
  }

  async qianfanCompletion(provider, messages, options) {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await provider.client.chat.completions.create({
      model: options.model,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      system: systemMessage?.content,
      temperature: options.temperature,
      max_output_tokens: options.maxTokens
    });

    return {
      content: response.body.result || response.body.choices?.[0]?.message?.content,
      model: options.model,
      usage: {
        prompt_tokens: response.body.usage?.prompt_tokens || 0,
        completion_tokens: response.body.usage?.completion_tokens || 0,
        total_tokens: response.body.usage?.total_tokens || 0
      }
    };
  }

  async analyzeTopics(topics, options = {}) {
    const {
      provider = null,
      includeTrends = true,
      includeSentiment = true,
      includeKeywords = true,
      includeSummary = false
    } = options;

    if (!topics || topics.length === 0) {
      return null;
    }

    const topicsData = topics.map(t => ({
      title: t.title,
      source: t.source,
      heat: t.heat,
      description: t.description || '',
      keywords: t.keywords || [],
      category: t.category,
      publishedAt: t.publishedAt
    }));

    const prompt = this.buildAnalysisPrompt(topicsData, options);

    try {
      const result = await this.chatCompletion([
        {
          role: 'system',
          content: `你是一个专业的热点话题分析助手。请根据提供的热点话题数据，生成结构化的分析报告。输出格式必须是纯 JSON，不要包含任何 Markdown 格式或额外说明。`
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        provider,
        temperature: 0.3,
        maxTokens: 2000,
        responseFormat: { type: 'json_object' }
      });

      const analysis = JSON.parse(result.content);

      logger.info('AI 分析完成');
      return analysis;
    } catch (error) {
      logger.error('AI 分析失败', {
        error: error.message
      });
      return null;
    }
  }

  buildAnalysisPrompt(topicsData, options) {
    const topicsList = JSON.stringify(topicsData, null, 2);

    let prompt = `请分析以下 ${topicsData.length} 条热点话题数据：

${topicsList}

`;

    if (options.includeTrends) {
      prompt += `

请提供趋势分析：
1. 总体趋势概述（50字内）
2. 上升趋势话题（用 🔺 标记）
3. 下降趋势话题（用 🔻 标记）
4. 爆发热点（用 🔥 标记）
`;
    }

    if (options.includeSentiment) {
      prompt += `

请进行情感分析：
1. 正面话题（用 😊 标记）
2. 负面话题（用 😔 标记）
3. 争议话题（用 ⚠ 标记）
4. 中性话题（用 😐 标记）
`;
    }

    if (options.includeKeywords) {
      prompt += `

请提取高频关键词：
1. 统计出现频率最高的 5-8 个关键词
2. 按照平台分组统计
`;
    }

    if (options.includeSummary) {
      prompt += `

请生成简报：
1. 3 条最重要的热点及简要说明
2. 适合推送的精简内容`;
    }

    prompt += `

请以以下 JSON 格式返回，不要添加任何其他文字：
{
  "trendOverview": "趋势概述",
  "risingTopics": ["话题1", "话题2"],
  "fallingTopics": ["话题1", "话题2"],
  "hotTopics": ["话题1", "话题2"],
  "sentiment": {
    "positive": ["话题1"],
    "negative": ["话题1"],
    "controversial": ["话题1"],
    "neutral": ["话题1"]
  },
  "topKeywords": [
    {"keyword": "关键词", "count": 次数, "sources": ["平台1", "平台2"]}
  ],
  "briefing": ["简报1", "简报2", "简报3"]
}`;

    return prompt;
  }

  async translateMessage(message, targetLanguage = 'English', provider = null) {
    try {
      const result = await this.chatCompletion([
        {
          role: 'system',
          content: `你是一个专业的翻译助手。请将以下内容翻译为 ${targetLanguage}。`
        },
        {
          role: 'user',
          content: message
        }
      ], {
        provider,
        temperature: 0.3,
        maxTokens: 1000
      });

      logger.info('AI 翻译完成');
      return result.content;
    } catch (error) {
      logger.error('AI 翻译失败', { error: error.message });
      return message;
    }
  }

  async generateBrief(topics, options = {}) {
    const {
      maxLength = 300,
      focus = 'important',
      provider = null
    } = options;

    const topicsData = topics.slice(0, 10).map(t => ({
      title: t.title,
      source: t.source,
      heat: t.heat,
      description: t.description || ''
    }));

    const prompt = `请为以下热点话题生成精简推送内容（${maxLength} 字以内），重点：${focus}：

${JSON.stringify(topicsData, null, 2)}

要求：
1. 提取最重要的 3-5 个话题
2. 每个话题一句话描述
3. 使用简洁有力的语言
4. 不要使用 Markdown 格式`;

    try {
      const result = await this.chatCompletion([
        {
          role: 'system',
          content: '你是一个专业的编辑助手。'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        provider,
        temperature: 0.5,
        maxTokens: 500
      });

      logger.info('AI 简报生成完成');
      return result.content;
    } catch (error) {
      logger.error('AI 简报生成失败', { error: error.message });
      return null;
    }
  }

  async checkServiceHealth(providerId = null) {
    const providersToCheck = providerId
      ? [providerId]
      : Array.from(this.providers.keys());

    const results = {};

    for (const id of providersToCheck) {
      try {
        const startTime = Date.now();

        await this.chatCompletion([
          { role: 'user', content: 'ping' }
        ], {
          provider: id,
          maxTokens: 10
        });

        results[id] = {
          healthy: true,
          latency: Date.now() - startTime
        };
      } catch (error) {
        results[id] = {
          healthy: false,
          error: error.message
        };
      }
    }

    return {
      defaultProvider: this.defaultProvider,
      providers: results
    };
  }

  getProviderList() {
    const list = [];

    for (const [id, config] of this.providers.entries()) {
      list.push({
        id,
        name: config.name,
        type: config.type,
        model: config.model,
        enabled: config.enabled,
        isDefault: id === this.defaultProvider
      });
    }

    return list;
  }

  setDefaultProvider(providerId) {
    if (!this.providers.has(providerId)) {
      throw new Error(`提供商 ${providerId} 不存在`);
    }

    this.defaultProvider = providerId;
    logger.info(`默认提供商已设置为 ${providerId}`);
  }
}

module.exports = new AIProviderService();
