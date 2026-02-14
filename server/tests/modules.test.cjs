/**
 * 扩展模块测试 - TrendRadar 模块化架构
 * 测试 LiteLLMAdapter, FetcherManager, NotificationDispatcher, ReportGenerator
 */

const assert = require('assert');

// 模拟环境变量
process.env.NODE_ENV = 'test';

console.log('=== 开始扩展模块测试 ===\n');

// 测试计数器
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// ==================== LiteLLMAdapter 测试 ====================

console.log('\n--- LiteLLMAdapter 测试 ---\n');

const { LiteLLMAdapter } = require('../ai/LiteLLMAdapter');
const { AIProvider } = require('../core/types');

test('LiteLLMAdapter - 应正确初始化', () => {
  const adapter = new LiteLLMAdapter({ proxyUrl: 'http://test:4000' });
  assert.strictEqual(adapter.proxyUrl, 'http://test:4000');
});

test('LiteLLMAdapter - 应使用默认配置', () => {
  const adapter = new LiteLLMAdapter();
  assert.ok(adapter.proxyUrl);
  assert.ok(adapter.axiosInstance);
});

test('extractProvider - 应正确识别 OpenAI', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('gpt-4'), AIProvider.OPENAI);
  assert.strictEqual(adapter.extractProvider('gpt-3.5-turbo'), AIProvider.OPENAI);
  assert.strictEqual(adapter.extractProvider('o1-preview'), AIProvider.OPENAI);
});

test('extractProvider - 应正确识别 Claude', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('claude-3-opus'), AIProvider.CLAUDE);
  assert.strictEqual(adapter.extractProvider('claude-2'), AIProvider.CLAUDE);
});

test('extractProvider - 应正确识别 DeepSeek', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('deepseek-chat'), AIProvider.DEEPSEEK);
});

test('extractProvider - 应正确识别 Moonshot', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('moonshot-v1'), AIProvider.MOONSHOT);
});

test('extractProvider - 应正确识别智谱 GLM', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('glm-4'), AIProvider.ZHIPU);
  assert.strictEqual(adapter.extractProvider('zhipu-chat'), AIProvider.ZHIPU);
});

test('extractProvider - 应正确识别通义千问', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('qwen-max'), AIProvider.QWEN);
});

test('extractProvider - 应正确识别百度文心', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('ernie-bot'), AIProvider.BAIDU);
});

test('extractProvider - 应正确识别讯飞星火', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('spark-v3'), AIProvider.XUNFEI);
});

test('extractProvider - 未知模型返回 unknown', () => {
  const adapter = new LiteLLMAdapter();
  assert.strictEqual(adapter.extractProvider('unknown-model'), 'unknown');
});

test('getAvailableProviders - 应返回提供商列表', () => {
  const adapter = new LiteLLMAdapter();
  const providers = adapter.getAvailableProviders();
  assert.ok(Array.isArray(providers));
  assert.ok(providers.includes(AIProvider.OPENAI));
  assert.ok(providers.includes(AIProvider.CLAUDE));
});

test('getCachedHealthStatus - 初始状态应为空', () => {
  const adapter = new LiteLLMAdapter();
  const status = adapter.getCachedHealthStatus();
  assert.ok(status.models);
  assert.strictEqual(Object.keys(status.models).length, 0);
});

// ==================== FetcherManager 测试 ====================

console.log('\n--- FetcherManager 测试 ---\n');

const { FetcherManager } = require('../fetchers/FetcherManager');
const { Source } = require('../core/types');

// 创建模拟 Fetcher
class MockFetcher {
  constructor() {
    this.cache = new Map();
  }
  async fetch() {
    return [
      { title: '测试话题1', source: 'mock', heat: 1000 },
      { title: '测试话题2', source: 'mock', heat: 800 }
    ];
  }
  clearCache() {
    this.cache.clear();
  }
  getStatus() {
    return { name: 'mock', hasCache: this.cache.size > 0 };
  }
}

test('FetcherManager - 应正确初始化', () => {
  const manager = new FetcherManager();
  assert.strictEqual(manager.fetchers.size, 0);
});

test('FetcherManager - 应正确注册 Fetcher', () => {
  const manager = new FetcherManager();
  manager.register('mock', new MockFetcher());
  assert.strictEqual(manager.fetchers.size, 1);
  assert.ok(manager.fetchers.has('mock'));
});

test('FetcherManager - 应正确注销 Fetcher', () => {
  const manager = new FetcherManager();
  manager.register('mock', new MockFetcher());
  manager.unregister('mock');
  assert.strictEqual(manager.fetchers.size, 0);
});

test('FetcherManager - getFetcher 应返回正确的 Fetcher', () => {
  const manager = new FetcherManager();
  const fetcher = new MockFetcher();
  manager.register('mock', fetcher);
  assert.strictEqual(manager.getFetcher('mock'), fetcher);
});

test('FetcherManager - getRegisteredSources 应返回所有已注册的数据源', () => {
  const manager = new FetcherManager();
  manager.register('source1', new MockFetcher());
  manager.register('source2', new MockFetcher());
  const sources = manager.getRegisteredSources();
  assert.ok(sources.includes('source1'));
  assert.ok(sources.includes('source2'));
});

test('FetcherManager - fetchFromSource 未找到时应返回空数组', async () => {
  const manager = new FetcherManager();
  const result = await manager.fetchFromSource('nonexistent');
  assert.deepStrictEqual(result, []);
});

test('FetcherManager - fetchFromSource 应返回话题列表', async () => {
  const manager = new FetcherManager();
  manager.register('mock', new MockFetcher());
  const result = await manager.fetchFromSource('mock');
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].title, '测试话题1');
});

test('FetcherManager - fetchAll 应合并并排序结果', async () => {
  const manager = new FetcherManager();
  manager.register('mock', new MockFetcher());
  const result = await manager.fetchAll();
  assert.ok(Array.isArray(result));
  // 验证按热度降序
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[i - 1].heat >= result[i].heat);
  }
});

test('FetcherManager - getStatus 应返回所有 Fetcher 状态', () => {
  const manager = new FetcherManager();
  manager.register('mock', new MockFetcher());
  const status = manager.getStatus();
  assert.ok(Array.isArray(status));
  assert.strictEqual(status.length, 1);
});

test('FetcherManager - clearAllCache 应清除所有缓存', () => {
  const manager = new FetcherManager();
  const fetcher = new MockFetcher();
  fetcher.cache.set('key', 'value');
  manager.register('mock', fetcher);
  manager.clearAllCache();
  assert.strictEqual(fetcher.cache.size, 0);
});

// ==================== NotificationDispatcher 测试 ====================

console.log('\n--- NotificationDispatcher 测试 ---\n');

const { NotificationDispatcher } = require('../notification/NotificationDispatcher');
const { NotificationChannel } = require('../core/types');

// 创建模拟 Sender
class MockSender {
  constructor(config = {}) {
    this.config = config;
  }
  isConfigured() {
    return Object.keys(this.config).length > 0;
  }
  async send(message) {
    if (!this.isConfigured()) throw new Error('未配置');
    return { success: true };
  }
  async test() {
    return { success: this.isConfigured(), error: this.isConfigured() ? null : '未配置' };
  }
  getStatus() {
    return { configured: this.isConfigured() };
  }
}

test('NotificationDispatcher - 应正确初始化', () => {
  const dispatcher = new NotificationDispatcher();
  assert.strictEqual(dispatcher.senders.size, 0);
});

test('NotificationDispatcher - 应正确注册发送器', () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('mock', new MockSender({ key: 'value' }));
  assert.strictEqual(dispatcher.senders.size, 1);
});

test('NotificationDispatcher - 应正确注销发送器', () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('mock', new MockSender());
  dispatcher.unregister('mock');
  assert.strictEqual(dispatcher.senders.size, 0);
});

test('NotificationDispatcher - getRegisteredChannels 应返回已注册渠道', () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('channel1', new MockSender());
  dispatcher.register('channel2', new MockSender());
  const channels = dispatcher.getRegisteredChannels();
  assert.ok(channels.includes('channel1'));
  assert.ok(channels.includes('channel2'));
});

test('NotificationDispatcher - getConfiguredChannels 应只返回已配置渠道', () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('configured', new MockSender({ key: 'value' }));
  dispatcher.register('unconfigured', new MockSender());
  const channels = dispatcher.getConfiguredChannels();
  assert.ok(channels.includes('configured'));
  assert.ok(!channels.includes('unconfigured'));
});

test('NotificationDispatcher - sendToChannel 未找到渠道应失败', async () => {
  const dispatcher = new NotificationDispatcher();
  const result = await dispatcher.sendToChannel('test', 'nonexistent');
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('未找到'));
});

test('NotificationDispatcher - sendToChannel 未配置渠道应失败', async () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('unconfigured', new MockSender());
  const result = await dispatcher.sendToChannel('test', 'unconfigured');
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('未配置'));
});

test('NotificationDispatcher - sendToChannel 已配置渠道应成功', async () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('configured', new MockSender({ key: 'value' }));
  const result = await dispatcher.sendToChannel('test', 'configured');
  assert.strictEqual(result.success, true);
});

test('NotificationDispatcher - dispatch 无可用渠道应失败', async () => {
  const dispatcher = new NotificationDispatcher();
  const result = await dispatcher.dispatch('test', []);
  assert.strictEqual(result.success, false);
});

test('NotificationDispatcher - dispatch 应返回各渠道结果', async () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('ch1', new MockSender({ key: 'value' }));
  const result = await dispatcher.dispatch('test', ['ch1']);
  assert.strictEqual(result.success, true);
  assert.ok(result.results['ch1']);
});

test('NotificationDispatcher - formatMessage 应格式化热点消息', () => {
  const dispatcher = new NotificationDispatcher();
  const topics = [
    { title: '热点1', source: '微博', heat: 1000, trend: 'new' },
    { title: '热点2', source: '知乎', heat: 800, trend: 'up' }
  ];
  const message = dispatcher.formatMessage(topics);
  assert.ok(message.includes('热点话题更新'));
  assert.ok(message.includes('热点1'));
  assert.ok(message.includes('热点2'));
});

test('NotificationDispatcher - getStatus 应返回所有渠道状态', () => {
  const dispatcher = new NotificationDispatcher();
  dispatcher.register('mock', new MockSender({ key: 'value' }));
  const status = dispatcher.getStatus();
  assert.ok(status['mock']);
  assert.strictEqual(status['mock'].configured, true);
});

// ==================== ReportGenerator 测试 ====================

console.log('\n--- ReportGenerator 测试 ---\n');

const { ReportGenerator } = require('../reports/ReportGenerator');

test('ReportGenerator - 应正确初始化', () => {
  const generator = new ReportGenerator();
  assert.ok(generator.builtInTemplates);
  assert.ok(generator.builtInTemplates.daily);
  assert.ok(generator.builtInTemplates.weekly);
  assert.ok(generator.builtInTemplates.content);
});

test('ReportGenerator - generateDailyReport 应生成日报', async () => {
  const generator = new ReportGenerator();
  const topics = [
    { title: '测试热点1', source: '微博', heat: 1000, category: 'tech', keywords: ['AI'] },
    { title: '测试热点2', source: '知乎', heat: 800, category: 'entertainment', keywords: ['电影'] }
  ];
  const result = await generator.generateDailyReport(topics);
  assert.ok(result.html);
  assert.ok(result.markdown);
  assert.ok(result.data);
  assert.ok(result.html.includes('热点日报'));
});

test('ReportGenerator - generateWeeklyReport 应生成周报', async () => {
  const generator = new ReportGenerator();
  const weeklyData = {
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    topics: [],
    totalTopics: 100,
    newTopics: 20,
    hotTopics: 10
  };
  const result = await generator.generateWeeklyReport(weeklyData);
  assert.ok(result.html);
  assert.ok(result.markdown);
  assert.ok(result.data);
});

test('ReportGenerator - generateContentReport 应生成内容报告', async () => {
  const generator = new ReportGenerator();
  const contents = [
    { title: '内容1', views: 1000, likes: 100 },
    { title: '内容2', views: 500, likes: 50 }
  ];
  const analytics = { totalContent: 2, published: 2, totalViews: 1500 };
  const result = await generator.generateContentReport(contents, analytics);
  assert.ok(result.html);
  assert.ok(result.markdown);
  assert.ok(result.data);
});

test('ReportGenerator - groupBySource 应按来源分组', () => {
  const generator = new ReportGenerator();
  const topics = [
    { source: '微博', heat: 100 },
    { source: '微博', heat: 200 },
    { source: '知乎', heat: 150 }
  ];
  const groups = generator.groupBySource(topics);
  assert.strictEqual(groups['微博'], 2);
  assert.strictEqual(groups['知乎'], 1);
});

test('ReportGenerator - groupByCategory 应按分类分组', () => {
  const generator = new ReportGenerator();
  const topics = [
    { category: 'tech' },
    { category: 'tech' },
    { category: 'entertainment' }
  ];
  const groups = generator.groupByCategory(topics);
  assert.strictEqual(groups['tech'], 2);
  assert.strictEqual(groups['entertainment'], 1);
});

test('ReportGenerator - extractTopKeywords 应提取热门关键词', () => {
  const generator = new ReportGenerator();
  const topics = [
    { keywords: ['AI', 'GPT', '科技'] },
    { keywords: ['AI', '创新'] },
    { keywords: ['GPT', '突破'] }
  ];
  const keywords = generator.extractTopKeywords(topics, 5);
  assert.ok(Array.isArray(keywords));
  assert.ok(keywords.includes('AI'));
  assert.ok(keywords.includes('GPT'));
});

test('ReportGenerator - formatDate 应格式化日期', () => {
  const generator = new ReportGenerator();
  const date = new Date('2024-01-15');
  const formatted = generator.formatDate(date);
  assert.ok(formatted.includes('2024'));
});

test('ReportGenerator - formatNumber 应格式化数字', () => {
  const generator = new ReportGenerator();
  assert.strictEqual(generator.formatNumber(500), '500');
  assert.strictEqual(generator.formatNumber(1500), '1.5k');
  assert.strictEqual(generator.formatNumber(15000), '1.5w');
});

test('ReportGenerator - toMarkdown 应生成 Markdown 格式', async () => {
  const generator = new ReportGenerator();
  const topics = [{ title: '测试', source: '微博', heat: 100, category: 'tech' }];
  const result = await generator.generateDailyReport(topics);
  assert.ok(result.markdown.includes('#'));
  assert.ok(result.markdown.includes('热点日报'));
});

test('ReportGenerator - render 不存在的模板应抛出错误', async () => {
  const generator = new ReportGenerator();
  try {
    await generator.render('nonexistent', {});
    assert.fail('应该抛出错误');
  } catch (error) {
    assert.ok(error.message.includes('模板不存在'));
  }
});

// ==================== 输出结果 ====================

console.log('\n=== 测试结果 ===');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n所有测试通过！');
