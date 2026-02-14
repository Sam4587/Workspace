/**
 * 集成测试 - TrendRadar 模块化架构
 */

const assert = require('assert');

// 模拟环境变量
process.env.NODE_ENV = 'test';

// 导入模块
const { topicAnalyzer } = require('../core/TopicAnalyzer');
const { trendAnalyzer } = require('../core/TrendAnalyzer');
const { Category, Trend, AIProvider } = require('../core/types');

console.log('=== 开始集成测试 ===\n');

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

// ==================== TopicAnalyzer 测试 ====================

console.log('--- TopicAnalyzer 测试 ---\n');

test('categorize - 应正确分类科技话题', () => {
  const result = topicAnalyzer.categorize('OpenAI 发布 GPT-5 模型');
  assert.strictEqual(result, Category.TECH);
});

test('categorize - 应正确分类娱乐话题', () => {
  const result = topicAnalyzer.categorize('某明星新电影票房破亿');
  assert.strictEqual(result, Category.ENTERTAINMENT);
});

test('categorize - 应正确分类财经话题', () => {
  const result = topicAnalyzer.categorize('股市大跌，投资者关注市场走势');
  assert.strictEqual(result, Category.FINANCE);
});

test('categorize - 空输入应返回 OTHER', () => {
  const result = topicAnalyzer.categorize('');
  assert.strictEqual(result, Category.OTHER);
});

test('extractKeywords - 应正确提取关键词', () => {
  const result = topicAnalyzer.extractKeywords('OpenAI发布GPT-5人工智能模型，科技行业震动');
  assert.ok(Array.isArray(result));
  assert.ok(result.length > 0);
});

test('extractKeywords - 应过滤停用词', () => {
  const result = topicAnalyzer.extractKeywords('这是一个很好的测试');
  assert.ok(!result.includes('一个'));
  assert.ok(!result.includes('这个'));
});

test('calculateSuitability - 应计算适配度分数', () => {
  const result = topicAnalyzer.calculateSuitability('重磅！OpenAI 发布最新 GPT-5 模型');
  assert.ok(result >= 0 && result <= 100);
});

test('calculateSuitability - 包含时效性关键词应加分', () => {
  const score1 = topicAnalyzer.calculateSuitability('普通新闻标题');
  const score2 = topicAnalyzer.calculateSuitability('突发！重大新闻事件');
  assert.ok(score2 > score1);
});

test('analyzeSentiment - 应分析正面情感', () => {
  const result = topicAnalyzer.analyzeSentiment('这是一个优秀的创新突破，取得了巨大成功');
  assert.strictEqual(result.sentiment, 'positive');
});

test('analyzeSentiment - 应分析负面情感', () => {
  const result = topicAnalyzer.analyzeSentiment('这是一个糟糕的失败，问题严重');
  assert.strictEqual(result.sentiment, 'negative');
});

test('analyzeSentiment - 应分析中性情感', () => {
  const result = topicAnalyzer.analyzeSentiment('今天天气一般');
  assert.strictEqual(result.sentiment, 'neutral');
});

// ==================== TrendAnalyzer 测试 ====================

console.log('\n--- TrendAnalyzer 测试 ---\n');

test('analyzeTrend - 应分析上升趋势', () => {
  const history = [
    { heat: 1000, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { heat: 1500, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { heat: 2500, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { heat: 4000, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    { heat: 6000, timestamp: new Date() }
  ];
  const result = trendAnalyzer.analyzeTrend(history);
  assert.ok(['hot_rising', 'rising'].includes(result.trend));
  assert.ok(result.growthRate > 0);
});

test('analyzeTrend - 应分析下降趋势', () => {
  const history = [
    { heat: 10000, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { heat: 8000, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    { heat: 6000, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { heat: 4000, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    { heat: 2000, timestamp: new Date() }
  ];
  const result = trendAnalyzer.analyzeTrend(history);
  assert.strictEqual(result.trend, 'declining');
  assert.ok(result.growthRate < 0);
});

test('analyzeTrend - 数据不足应返回 unknown', () => {
  const history = [
    { heat: 1000, timestamp: new Date() }
  ];
  const result = trendAnalyzer.analyzeTrend(history);
  assert.strictEqual(result.trend, 'unknown');
});

test('calculateGrowthRate - 应正确计算增长率', () => {
  const heats = [100, 120, 144];
  const result = trendAnalyzer.calculateGrowthRate(heats);
  assert.ok(result > 0);
});

test('findRelatedTopics - 应找到相关话题', () => {
  const keywords = ['AI', 'GPT', '人工智能'];
  const topics = [
    { id: '1', title: 'GPT-5 发布', keywords: ['GPT', 'AI', '科技'] },
    { id: '2', title: '足球比赛', keywords: ['足球', '体育'] },
    { id: '3', title: '人工智能突破', keywords: ['人工智能', '创新'] }
  ];
  const result = trendAnalyzer.findRelatedTopics(keywords, topics);
  assert.ok(result.length > 0);
  assert.ok(result[0].id === '1' || result[0].id === '3');
});

test('predictViralTopics - 应预测爆发话题', () => {
  const topics = [
    { id: '1', trend: 'hot_rising', growthRate: 2.0, sourceCount: 4 },
    { id: '2', trend: 'declining', growthRate: -0.5, sourceCount: 1 },
    { id: '3', trend: 'rising', growthRate: 0.8, sourceCount: 2 }
  ];
  const result = trendAnalyzer.predictViralTopics(topics);
  assert.ok(result.some(t => t.id === '1'));
});

test('getTrendStats - 应统计趋势分布', () => {
  const topics = [
    { trend: 'hot_rising' },
    { trend: 'rising' },
    { trend: 'rising' },
    { trend: 'stable' },
    { trend: 'declining' }
  ];
  const result = trendAnalyzer.getTrendStats(topics);
  assert.strictEqual(result.total, 5);
  assert.strictEqual(result.hot_rising, 1);
  assert.strictEqual(result.rising, 2);
});

// ==================== 类型定义测试 ====================

console.log('\n--- 类型定义测试 ---\n');

test('Category - 应包含所有分类', () => {
  assert.ok(Category.TECH);
  assert.ok(Category.ENTERTAINMENT);
  assert.ok(Category.FINANCE);
  assert.ok(Category.SPORTS);
  assert.ok(Category.SOCIETY);
  assert.ok(Category.INTERNATIONAL);
  assert.ok(Category.OTHER);
});

test('Trend - 应包含所有趋势类型', () => {
  assert.ok(Trend.UP);
  assert.ok(Trend.DOWN);
  assert.ok(Trend.NEW);
  assert.ok(Trend.STABLE);
});

test('AIProvider - 应包含所有提供商', () => {
  assert.ok(AIProvider.OPENAI);
  assert.ok(AIProvider.CLAUDE);
  assert.ok(AIProvider.DEEPSEEK);
  assert.ok(AIProvider.MOONSHOT);
  assert.ok(AIProvider.QWEN);
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
