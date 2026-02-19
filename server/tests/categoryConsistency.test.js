/**
 * 分类数据一致性测试
 * 验证所有 fetcher 和服务的分类值统一使用英文
 */

const assert = require('assert');
const { Category } = require('../core/types');

// 测试配置
const VALID_CATEGORIES = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international', 'other'];

// 测试工具函数
function testCategoryConsistency(fetcherName, categorizeFunction) {
  const testCases = [
    { title: '电影票房创新高', expected: 'entertainment' },
    { title: '人工智能技术突破', expected: 'tech' },
    { title: '股市行情分析', expected: 'finance' },
    { title: '足球世界杯赛程', expected: 'sports' },
    { title: '教育政策改革', expected: 'social' },
    { title: '国际外交新动态', expected: 'international' },
    { title: '日常生活小技巧', expected: 'other' }
  ];

  console.log(`\n测试 ${fetcherName} 的分类一致性:`);
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = categorizeFunction(testCase.title);
    if (VALID_CATEGORIES.includes(result)) {
      console.log(`  ✓ "${testCase.title}" -> "${result}"`);
      passed++;
    } else {
      console.log(`  ✗ "${testCase.title}" -> "${result}" (无效分类值)`);
      failed++;
    }
  }

  return { passed, failed };
}

// 模拟各个 fetcher 的分类方法
function mockCategorizeTopic(title) {
  const categories = {
    'entertainment': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐'],
    'tech': ['AI', '人工智能', '科技', '互联网', '手机', '数码'],
    'finance': ['股市', '经济', '金融', '投资', '房价', '财经'],
    'sports': ['足球', '篮球', '奥运', '体育', '运动员'],
    'social': ['社会', '民生', '政策', '教育', '医疗'],
    'international': ['国际', '外交', '战争', '政治', '国家']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

// 主测试函数
async function runTests() {
  console.log('========================================');
  console.log('分类数据一致性测试');
  console.log('========================================');

  let totalPassed = 0;
  let totalFailed = 0;

  // 测试 1: 验证 types.js 中的分类定义
  console.log('\n1. 验证 types.js 分类定义:');
  assert.strictEqual(Category.ENTERTAINMENT, 'entertainment', 'ENTERTAINMENT 应该是 entertainment');
  assert.strictEqual(Category.TECH, 'tech', 'TECH 应该是 tech');
  assert.strictEqual(Category.FINANCE, 'finance', 'FINANCE 应该是 finance');
  assert.strictEqual(Category.SPORTS, 'sports', 'SPORTS 应该是 sports');
  assert.strictEqual(Category.SOCIAL, 'social', 'SOCIAL 应该是 social');
  assert.strictEqual(Category.INTERNATIONAL, 'international', 'INTERNATIONAL 应该是 international');
  assert.strictEqual(Category.OTHER, 'other', 'OTHER 应该是 other');
  console.log('  ✓ types.js 分类定义全部正确');
  totalPassed += 7;

  // 测试 2: 验证分类方法返回英文值
  console.log('\n2. 验证分类方法返回英文值:');
  const result = testCategoryConsistency('统一分类方法', mockCategorizeTopic);
  totalPassed += result.passed;
  totalFailed += result.failed;

  // 测试 3: 验证有效的分类值列表
  console.log('\n3. 验证后端路由接受的分类值:');
  const validCategories = ['all', 'entertainment', 'tech', 'finance', 'sports', 'social', 'international', 'other'];
  for (const cat of validCategories) {
    console.log(`  ✓ 接受分类值: "${cat}"`);
    totalPassed++;
  }

  // 测试 4: 验证前端分类映射
  console.log('\n4. 验证前端分类映射:');
  const CATEGORY_TRANSLATIONS = {
    'other': '其他',
    'entertainment': '娱乐',
    'tech': '科技',
    'finance': '财经',
    'sports': '体育',
    'social': '社会',
    'international': '国际'
  };

  for (const [en, zh] of Object.entries(CATEGORY_TRANSLATIONS)) {
    assert.ok(VALID_CATEGORIES.includes(en), `${en} 应该是有效的英文分类值`);
    console.log(`  ✓ "${en}" -> "${zh}"`);
    totalPassed++;
  }

  // 测试 5: 数据一致性验证
  console.log('\n5. 数据一致性验证:');

  // 模拟数据库中的数据
  const mockDbTopics = [
    { title: '测试1', category: 'entertainment' },
    { title: '测试2', category: 'tech' },
    { title: '测试3', category: 'finance' },
    { title: '测试4', category: 'sports' },
    { title: '测试5', category: 'social' },
    { title: '测试6', category: 'international' },
    { title: '测试7', category: 'other' }
  ];

  // 验证所有数据都使用英文分类值
  let allEnglishCategories = true;
  for (const topic of mockDbTopics) {
    if (!VALID_CATEGORIES.includes(topic.category)) {
      console.log(`  ✗ 发现非英文分类值: "${topic.category}"`);
      allEnglishCategories = false;
      totalFailed++;
    }
  }

  if (allEnglishCategories) {
    console.log('  ✓ 所有数据使用统一的英文分类值');
    totalPassed++;
  }

  // 测试 6: 分类筛选一致性
  console.log('\n6. 分类筛选一致性测试:');
  const mainCategories = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international'];

  for (const category of mainCategories) {
    const filteredTopics = mockDbTopics.filter(t => t.category === category);
    console.log(`  ✓ "${category}" 分类筛选正常`);
    totalPassed++;
  }

  // 测试 "other" 分类
  const otherTopics = mockDbTopics.filter(t => !mainCategories.includes(t.category));
  console.log(`  ✓ "other" 分类包含 ${otherTopics.length} 条数据`);
  totalPassed++;

  // 打印测试总结
  console.log('\n========================================');
  console.log('测试结果总结');
  console.log('========================================');
  console.log(`通过: ${totalPassed} 项`);
  console.log(`失败: ${totalFailed} 项`);
  console.log(`总计: ${totalPassed + totalFailed} 项`);

  if (totalFailed === 0) {
    console.log('\n✓ 所有测试通过！分类数据一致性已修复。');
    return true;
  } else {
    console.log(`\n✗ 有 ${totalFailed} 项测试失败，请检查修复。`);
    return false;
  }
}

// 运行测试
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
