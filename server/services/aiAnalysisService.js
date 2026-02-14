const openai = require('openai');
const { logger } = require('../utils/logger');

class AIAnalysisService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY;
    this.provider = process.env.AI_PROVIDER || 'deepseek';
    this.apiBase = process.env.AI_API_BASE || 'https://api.deepseek.com';
    this.model = process.env.AI_MODEL || 'deepseek-chat';

    this.client = new openai.OpenAI({
      apiKey: this.apiKey,
      baseURL: this.apiBase
    });
  }

  async analyzeTopics(topics, options = {}) {
    const {
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
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的热点话题分析助手。请根据提供的热点话题数据，生成结构化的分析报告。
输出格式必须是纯 JSON，不要包含任何 Markdown 格式或额外说明。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0].message.content;
      const analysis = JSON.parse(content);

      logger.info('AI 分析完成');
      return analysis;
    } catch (error) {
      logger.error('AI 分析失败', {
        error: error.message,
        response: error.response?.data
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

  async translateMessage(message, targetLanguage = 'English') {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的翻译助手。请将以下内容翻译为 ${targetLanguage}。`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const translated = completion.choices[0].message.content;
      logger.info('AI 翻译完成');
      return translated;
    } catch (error) {
      logger.error('AI 翻译失败', { error: error.message });
      return message;
    }
  }

  async generateBrief(topics, options = {}) {
    const {
      maxLength = 300,
      focus = 'important'
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
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的编辑助手。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const brief = completion.choices[0].message.content;
      logger.info('AI 简报生成完成');
      return brief;
    } catch (error) {
      logger.error('AI 简报生成失败', { error: error.message });
      return null;
    }
  }

  async checkServiceHealth() {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10
      });

      logger.info('AI 服务健康检查通过');
      return {
        healthy: true,
        provider: this.provider,
        model: this.model,
        latency: Date.now()
      };
    } catch (error) {
      logger.error('AI 服务健康检查失败', { error: error.message });
      return {
        healthy: false,
        provider: this.provider,
        model: this.model,
        error: error.message
      };
    }
  }
}

module.exports = new AIAnalysisService();
