const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// Prompt 模板 Schema
const PromptTemplateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['analysis', 'summary', 'translation', 'custom', 'notification', 'report', 'other'],
    default: 'custom'
  },
  description: {
    type: String
  },
  template: {
    type: String,
    required: true
  },
  variables: [{
    name: String,
    type: {
      type: String,
      enum: ['string', 'number', 'array', 'object', 'boolean'],
      default: 'string'
    },
    description: String,
    required: {
      type: Boolean,
      default: false
    },
    default: mongoose.Schema.Types.Mixed
  }],
  language: {
    type: String,
    default: 'zh-CN',
    enum: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR']
  },
  tags: [String],
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  updatedBy: {
    type: String
  }
}, {
  timestamps: true
});

PromptTemplateSchema.index({ category: 1, isActive: 1 });
PromptTemplateSchema.index({ tags: 1 });
PromptTemplateSchema.index({ isSystem: 1, isActive: 1 });

const PromptTemplate = mongoose.model('PromptTemplate', PromptTemplateSchema);

// Prompt 使用历史 Schema
const PromptUsageSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    index: true
  },
  templateName: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  variables: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  result: {
    type: String
  },
  success: {
    type: Boolean,
    required: true
  },
  error: {
    type: String
  },
  latency: {
    type: Number
  },
  tokensUsed: {
    type: Number
  },
  userId: {
    type: String
  }
}, {
  timestamps: true
});

PromptUsageSchema.index({ templateId: 1, createdAt: -1 });
PromptUsageSchema.index({ provider: 1, createdAt: -1 });

const PromptUsage = mongoose.model('PromptUsage', PromptUsageSchema);

class PromptManagementService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.createSystemTemplates();
      this.initialized = true;
      logger.info('Prompt 管理服务初始化完成');
    } catch (error) {
      logger.error('Prompt 管理服务初始化失败', { error: error.message });
    }
  }

  async createSystemTemplates() {
    const systemTemplates = [
      {
        id: 'hot-topic-analysis',
        name: '热点话题分析',
        category: 'analysis',
        description: '分析热点话题的总体趋势、情感倾向和关键词',
        template: `请分析以下 {{count}} 条热点话题数据：

{{topicsData}}

{{#if includeTrends}}
请提供趋势分析：
1. 总体趋势概述（50字内）
2. 上升趋势话题（用 🔺 标记）
3. 下降趋势话题（用 🔻 标记）
4. 爆发热点（用 🔥 标记）
{{/if}}

{{#if includeSentiment}}
请进行情感分析：
1. 正面话题（用 😊 标记）
2. 负面话题（用 😔 标记）
3. 争议话题（用 ⚠ 标记）
4. 中性话题（用 😐 标记）
{{/if}}

{{#if includeKeywords}}
请提取高频关键词：
1. 统计出现频率最高的 5-8 个关键词
2. 按照平台分组统计
{{/if}}

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
  ]
}`,
        variables: [
          { name: 'topicsData', type: 'string', description: '热点话题数据（JSON 字符串）', required: true },
          { name: 'count', type: 'number', description: '话题数量', default: 10 },
          { name: 'includeTrends', type: 'boolean', description: '是否包含趋势分析', default: true },
          { name: 'includeSentiment', type: 'boolean', description: '是否包含情感分析', default: true },
          { name: 'includeKeywords', type: 'boolean', description: '是否包含关键词提取', default: true }
        ],
        language: 'zh-CN',
        tags: ['热点', '分析', '趋势', '情感'],
        isSystem: true
      },
      {
        id: 'hot-topic-brief',
        name: '热点话题简报',
        category: 'summary',
        description: '生成热点话题的精简推送内容',
        template: `请为以下热点话题生成精简推送内容（{{maxLength}} 字以内），重点：{{focus}}：

{{topicsData}}

要求：
1. 提取最重要的 {{importantCount}} 个话题
2. 每个话题一句话描述
3. 使用简洁有力的语言
4. 不要使用 Markdown 格式`,
        variables: [
          { name: 'topicsData', type: 'string', description: '热点话题数据（JSON 字符串）', required: true },
          { name: 'maxLength', type: 'number', description: '最大字数', default: 300 },
          { name: 'focus', type: 'string', description: '重点方向', default: 'important' },
          { name: 'importantCount', type: 'number', description: '重要话题数量', default: 3 }
        ],
        language: 'zh-CN',
        tags: ['热点', '简报', '推送'],
        isSystem: true
      },
      {
        id: 'hot-topic-translation',
        name: '热点话题翻译',
        category: 'translation',
        description: '将热点话题内容翻译为指定语言',
        template: `请将以下内容翻译为 {{targetLanguage}}：

{{content}}

要求：
1. 保持原有的格式和结构
2. 准确传达原意
3. 使用自然的表达方式`,
        variables: [
          { name: 'content', type: 'string', description: '待翻译内容', required: true },
          { name: 'targetLanguage', type: 'string', description: '目标语言', default: 'English' }
        ],
        language: 'zh-CN',
        tags: ['翻译', '多语言'],
        isSystem: true
      },
      {
        id: 'notification-message',
        name: '通知消息格式化',
        category: 'notification',
        description: '格式化通知消息内容',
        template: `## {{title}}

{{#if description}}
{{description}}
{{/if}}

{{#each items}}
{{@index}}. {{this.title}}
   来源: {{this.source}} | 热度: {{this.heat}}
   {{#if this.url}}[查看详情]({{this.url}}){{/if}}

{{/each}}

---
更新时间: {{timestamp}}`,
        variables: [
          { name: 'title', type: 'string', description: '消息标题', required: true },
          { name: 'description', type: 'string', description: '消息描述' },
          { name: 'items', type: 'array', description: '消息项列表', required: true },
          { name: 'timestamp', type: 'string', description: '时间戳', default: '当前时间' }
        ],
        language: 'zh-CN',
        tags: ['通知', '格式化'],
        isSystem: true
      },
      {
        id: 'daily-report',
        name: '每日热点报告',
        category: 'report',
        description: '生成每日热点分析报告',
        template: `# 每日热点报告

## {{date}}

## 概述
{{overview}}

## 热门话题排行
{{#each topTopics}}
{{@index}}. **{{this.title}}** (热度: {{this.heat}})
   - 平台: {{this.source}}
   - 描述: {{this.description}}
{{/each}}

## 趋势分析
{{trendAnalysis}}

## 情感分析
- 正面话题: {{positiveCount}} 条
- 负面话题: {{negativeCount}} 条
- 争议话题: {{controversialCount}} 条
- 中性话题: {{neutralCount}} 条

## 关键词
{{#each keywords}}
{{this.keyword}} (出现 {{this.count}} 次)
{{/each}}

---
报告生成时间: {{generatedAt}}`,
        variables: [
          { name: 'date', type: 'string', description: '报告日期', required: true },
          { name: 'overview', type: 'string', description: '总体概述', required: true },
          { name: 'topTopics', type: 'array', description: '热门话题列表', required: true },
          { name: 'trendAnalysis', type: 'string', description: '趋势分析', required: true },
          { name: 'positiveCount', type: 'number', description: '正面话题数', default: 0 },
          { name: 'negativeCount', type: 'number', description: '负面话题数', default: 0 },
          { name: 'controversialCount', type: 'number', description: '争议话题数', default: 0 },
          { name: 'neutralCount', type: 'number', description: '中性话题数', default: 0 },
          { name: 'keywords', type: 'array', description: '关键词列表', required: true },
          { name: 'generatedAt', type: 'string', description: '生成时间', default: '当前时间' }
        ],
        language: 'zh-CN',
        tags: ['报告', '每日', '热点'],
        isSystem: true
      }
    ];

    for (const template of systemTemplates) {
      try {
        await PromptTemplate.findOneAndUpdate(
          { id: template.id },
          { $setOnInsert: template },
          { upsert: true, new: true }
        );
      } catch (error) {
        if (error.code !== 11000) {
          logger.error(`创建系统模板失败: ${template.id}`, { error: error.message });
        }
      }
    }
  }

  async createTemplate(data) {
    try {
      const template = new PromptTemplate({
        ...data,
        id: data.id || `custom_${Date.now()}`,
        isSystem: false
      });

      await template.save();

      logger.info(`创建 Prompt 模板: ${template.id}`);
      return template;
    } catch (error) {
      logger.error('创建 Prompt 模板失败', { error: error.message });
      throw error;
    }
  }

  async updateTemplate(id, data, updatedBy = 'system') {
    try {
      const template = await PromptTemplate.findOne({ id });

      if (!template) {
        throw new Error(`模板 ${id} 不存在`);
      }

      if (template.isSystem) {
        throw new Error('系统模板不允许修改');
      }

      Object.assign(template, data, {
        version: template.version + 1,
        updatedBy
      });

      await template.save();

      logger.info(`更新 Prompt 模板: ${id}`);
      return template;
    } catch (error) {
      logger.error('更新 Prompt 模板失败', { error: error.message });
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      const template = await PromptTemplate.findOne({ id });

      if (!template) {
        throw new Error(`模板 ${id} 不存在`);
      }

      if (template.isSystem) {
        throw new Error('系统模板不允许删除');
      }

      await PromptTemplate.deleteOne({ id });

      logger.info(`删除 Prompt 模板: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('删除 Prompt 模板失败', { error: error.message });
      throw error;
    }
  }

  async getTemplate(id) {
    try {
      const template = await PromptTemplate.findOne({ id });

      if (!template) {
        throw new Error(`模板 ${id} 不存在`);
      }

      return template;
    } catch (error) {
      logger.error('获取 Prompt 模板失败', { error: error.message });
      throw error;
    }
  }

  async listTemplates(filters = {}) {
    try {
      const {
        category,
        isActive,
        isSystem,
        tags,
        language,
        search
      } = filters;

      const query = { isActive: isActive !== false };

      if (category) query.category = category;
      if (isSystem !== undefined) query.isSystem = isSystem;
      if (tags && tags.length > 0) query.tags = { $in: tags };
      if (language) query.language = language;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const templates = await PromptTemplate.find(query)
        .sort({ isSystem: -1, createdAt: -1 });

      return templates;
    } catch (error) {
      logger.error('获取 Prompt 模板列表失败', { error: error.message });
      throw error;
    }
  }

  async renderTemplate(id, variables = {}) {
    try {
      const template = await this.getTemplate(id);

      if (!template.isActive) {
        throw new Error(`模板 ${id} 已禁用`);
      }

      // 验证必需变量
      for (const variable of template.variables) {
        if (variable.required && !(variable.name in variables)) {
          throw new Error(`缺少必需变量: ${variable.name}`);
        }
      }

      // 应用默认值
      for (const variable of template.variables) {
        if (!(variable.name in variables) && variable.default !== undefined) {
          variables[variable.name] = variable.default;
        }
      }

      // 简单的模板变量替换
      let rendered = template.template;

      // 替换简单变量 {{variable}}
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, String(value));

        // 替换条件块 {{#if variable}}...{{/if}}
        if (typeof value === 'boolean') {
          const conditionRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g');
          if (value) {
            rendered = rendered.replace(conditionRegex, '$1');
          } else {
            rendered = rendered.replace(conditionRegex, '');
          }
        }
      }

      // 处理数组循环 {{#each items}}...{{/each}}
      rendered = rendered.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, varName, content) => {
        const array = variables[varName];
        if (!Array.isArray(array)) return '';

        return array.map((item, index) => {
          let itemContent = content;

          // 替换 {{this}}
          itemContent = itemContent.replace(/{{this}}/g, JSON.stringify(item));

          // 替换 {{this.property}}
          if (typeof item === 'object') {
            for (const [key, value] of Object.entries(item)) {
              itemContent = itemContent.replace(new RegExp(`{{this\\.${key}}}`, 'g'), String(value || ''));
            }
          }

          // 替换 {{@index}} 和 {{@indexPlusOne}}
          itemContent = itemContent.replace(/{{@index}}/g, String(index));
          itemContent = itemContent.replace(/{{@indexPlusOne}}/g, String(index + 1));

          return itemContent;
        }).join('\n');
      });

      // 清理剩余的未解析变量
      rendered = rendered.replace(/{{.*?}}/g, '');

      // 更新使用统计
      await PromptTemplate.updateOne(
        { id },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: new Date() }
        }
      );

      return rendered;
    } catch (error) {
      logger.error('渲染 Prompt 模板失败', { error: error.message });
      throw error;
    }
  }

  async recordUsage(data) {
    try {
      const {
        templateId,
        templateName,
        provider,
        model,
        variables,
        result,
        success,
        error,
        latency,
        tokensUsed,
        userId
      } = data;

      const usage = new PromptUsage({
        templateId,
        templateName,
        provider,
        model,
        variables: new Map(Object.entries(variables || {})),
        result: success ? result : undefined,
        success,
        error: !success ? error : undefined,
        latency,
        tokensUsed,
        userId
      });

      await usage.save();
    } catch (err) {
      logger.error('记录 Prompt 使用失败', { error: err.message });
    }
  }

  async getUsageHistory(templateId, limit = 50) {
    try {
      const history = await PromptUsage.find({ templateId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return history;
    } catch (error) {
      logger.error('获取使用历史失败', { error: error.message });
      throw error;
    }
  }

  async getUsageStats(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await PromptUsage.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$templateId',
            templateName: { $first: '$templateName' },
            totalCalls: { $sum: 1 },
            successCalls: { $sum: { $cond: ['$success', 1, 0] } },
            avgLatency: { $avg: '$latency' },
            totalTokens: { $sum: '$tokensUsed' }
          }
        },
        { $sort: { totalCalls: -1 } }
      ]);

      return stats;
    } catch (error) {
      logger.error('获取使用统计失败', { error: error.message });
      throw error;
    }
  }

  async getTags() {
    try {
      const tags = await PromptTemplate.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return tags.map(t => t._id);
    } catch (error) {
      logger.error('获取标签列表失败', { error: error.message });
      throw error;
    }
  }

  async getCategories() {
    try {
      const categories = await PromptTemplate.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return categories.map(c => c._id);
    } catch (error) {
      logger.error('获取分类列表失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = new PromptManagementService();
