const { NewsNowFetcher, newsNowFetcher } = require('../fetchers/NewsNowFetcher');

// 中文到英文的分类映射
const CATEGORY_MAP = {
  '娱乐': 'entertainment',
  '科技': 'tech',
  '财经': 'finance',
  '体育': 'sports',
  '社会': 'social',
  '国际': 'international',
  '其他': 'other',
  '生活': 'other',
  '教育': 'social',
  '游戏': 'entertainment'
};

const VALID_CATEGORIES = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international', 'other'];
const MAIN_CATEGORIES = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international'];

async function fixCategories() {
  console.log('========================================');
  console.log('分类数据修复工具');
  console.log('========================================');

  try {
    console.log('\n1. 从 NewsNow API 获取新数据...');
    const topics = await newsNowFetcher.fetch();

    if (!topics || topics.length === 0) {
      console.log('❌ 未获取到数据');
      return;
    }

    console.log(`✓ 获取到 ${topics.length} 条数据`);

    console.log('\n2. 验证分类值...');
    let hasInvalidCategory = false;
    for (let i = 0; i < Math.min(10, topics.length); i++) {
      const topic = topics[i];
      const isValid = VALID_CATEGORIES.includes(topic.category);
      if (!isValid) {
        hasInvalidCategory = true;
      }
      console.log(`  ${i + 1}. "${topic.title.substring(0, 30)}..." -> category: "${topic.category}" ${isValid ? '✓' : '✗'}`);
    }

    if (hasInvalidCategory) {
      console.log('\n3. 发现无效分类值，正在修复...');
      for (const topic of topics) {
        if (!VALID_CATEGORIES.includes(topic.category)) {
          if (CATEGORY_MAP[topic.category]) {
            topic.category = CATEGORY_MAP[topic.category];
            console.log(`  修复: "${topic.title.substring(0, 30)}..." -> "${topic.category}"`);
          } else {
            topic.category = 'other';
            console.log(`  设为其他: "${topic.title.substring(0, 30)}..." -> "other"`);
          }
        }
      }
    }

    console.log('\n4. 统计各分类数据量...');
    const categoryCounts = {};
    for (const cat of VALID_CATEGORIES) {
      categoryCounts[cat] = 0;
    }

    let invalidCount = 0;
    for (const topic of topics) {
      if (VALID_CATEGORIES.includes(topic.category)) {
        categoryCounts[topic.category]++;
      } else {
        invalidCount++;
        console.log(`  ⚠️  无效分类: "${topic.title.substring(0, 40)}" -> "${topic.category}"`);
      }
    }

    console.log('\n分类统计:');
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`  ${category}: ${count} 条`);
    }

    const mainCount = MAIN_CATEGORIES.reduce((sum, cat) => sum + (categoryCounts[cat] || 0), 0);
    const otherCount = categoryCounts['other'] || 0;
    const total = topics.length;

    console.log('\n========================================');
    console.log('统计总结:');
    console.log(`  主分类总数: ${mainCount}`);
    console.log(`  其他分类: ${otherCount}`);
    console.log(`  无效分类: ${invalidCount}`);
    console.log(`  总计: ${total}`);
    console.log(`  数据一致性: ${total === (mainCount + otherCount + invalidCount) ? '✓ 通过' : '✗ 失败'}`);
    console.log(`  其他分类占比: ${((otherCount / total) * 100).toFixed(1)}%`);
    console.log('========================================');

    if (otherCount === total) {
      console.log('\n⚠️ 警告：所有数据都在"其他"分类！');
      console.log('可能原因:');
      console.log('  1. 数据中的分类值不是有效的英文值');
      console.log('  2. 分类方法没有正确工作');
    } else if (otherCount > total * 0.3) {
      console.log('\n⚠️ 注意："其他"分类数据较多 (超过30%)');
      console.log('这可能是正常的，但建议检查分类关键词是否足够全面');
    } else {
      console.log('\n✓ 数据分类正常！');
    }

    console.log('\n========================================');
    console.log('修复完成！');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.error(error.stack);
  }
}

fixCategories();
