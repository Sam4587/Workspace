const { NewsNowFetcher, newsNowFetcher } = require('../fetchers/NewsNowFetcher');

const VALID_CATEGORIES = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international', 'other'];
const MAIN_CATEGORIES = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international'];

async function analyzeCategories() {
  console.log('========================================');
  console.log('分类数据详细分析工具');
  console.log('========================================');

  try {
    console.log('\n1. 从 NewsNow API 获取新数据...');
    const topics = await newsNowFetcher.fetch();

    if (!topics || topics.length === 0) {
      console.log('❌ 未获取到数据');
      return;
    }

    console.log(`✓ 获取到 ${topics.length} 条数据\n`);

    console.log('2. 检查每条数据的分类值...');
    const categoryCounts = {};
    const undefinedTopics = [];
    const invalidTopics = [];

    for (const cat of VALID_CATEGORIES) {
      categoryCounts[cat] = 0;
    }

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const category = topic.category;

      if (category === undefined || category === null) {
        undefinedTopics.push({ index: i, title: topic.title, category: category });
        console.log(`  [${i + 1}] UNDEFINED: "${topic.title.substring(0, 40)}"`);
      } else if (!VALID_CATEGORIES.includes(category)) {
        invalidTopics.push({ index: i, title: topic.title, category: category });
        console.log(`  [${i + 1}] INVALID: "${topic.title.substring(0, 40)}" -> "${category}"`);
      } else {
        categoryCounts[category]++;
      }
    }

    console.log('\n3. 分类统计结果:');
    console.log('========================================');
    
    let totalClassified = 0;
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`  ${category.padEnd(15)} : ${count} 条`);
      totalClassified += count;
    }
    
    console.log('----------------------------------------');
    console.log(`  有效分类总数   : ${totalClassified} 条`);
    console.log(`  undefined 分类 : ${undefinedTopics.length} 条`);
    console.log(`  无效分类       : ${invalidTopics.length} 条`);
    console.log(`  总计           : ${topics.length} 条`);
    console.log('========================================');

    const difference = topics.length - totalClassified;
    console.log(`\n⚠️  数据差异: ${difference} 条`);

    if (undefinedTopics.length > 0) {
      console.log('\n4. undefined 分类的数据详情:');
      console.log('========================================');
      undefinedTopics.forEach((item, idx) => {
        console.log(`  [${idx + 1}] "${item.title}"`);
      });
    }

    if (invalidTopics.length > 0) {
      console.log('\n5. 无效分类的数据详情:');
      console.log('========================================');
      invalidTopics.forEach((item, idx) => {
        console.log(`  [${idx + 1}] "${item.title}" -> category: "${item.category}"`);
      });
    }

    console.log('\n========================================');
    console.log('分析完成！');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 分析失败:', error.message);
    console.error(error.stack);
  }
}

analyzeCategories();
