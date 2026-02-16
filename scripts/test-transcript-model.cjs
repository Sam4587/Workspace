const TranscriptService = require('../../server/services/TranscriptService');
const { TranscriptValidator, TranscriptProcessor } = require('../../server/models/TranscriptModel');

async function testTranscriptModel() {
  console.log('🧪 测试转录数据模型...\n');
  
  try {
    // 测试数据结构验证
    console.log('1. 测试数据结构验证...');
    
    const validTranscript = {
      success: true,
      engine: 'whisper-local',
      duration: 120,
      language: 'zh-CN',
      text: '这是一个测试转录文本内容，用于验证数据模型的正确性。',
      segments: [
        {
          index: 0,
          start: 0,
          end: 5,
          text: '这是一个测试转录文本内容',
          confidence: 0.95
        },
        {
          index: 1,
          start: 5,
          end: 10,
          text: '用于验证数据模型的正确性',
          confidence: 0.88
        }
      ],
      keywords: [
        { word: '测试', frequency: 2, timestamps: [0, 5], importance: 0.9 },
        { word: '转录', frequency: 1, timestamps: [2], importance: 0.8 }
      ],
      metadata: {
        processingTime: 15000,
        model: 'medium'
      }
    };

    const isValid = TranscriptValidator.validateBasicStructure(validTranscript);
    console.log('✅ 数据结构验证:', isValid ? '通过' : '失败');

    // 测试数据标准化
    console.log('\n2. 测试数据标准化...');
    
    const rawResult = {
      success: true,
      duration: 120,
      text: '原始转录文本',
      segments: [
        { start: 0, end: 5, text: '第一段' },
        { start: 5, end: 10, text: '第二段' }
      ],
      keywords: ['关键词1', '关键词2']
    };

    const standardized = TranscriptProcessor.standardize(rawResult, 'whisper-local');
    console.log('✅ 数据标准化:');
    console.log('   - 引擎:', standardized.engine);
    console.log('   - 片段数:', standardized.segments.length);
    console.log('   - 关键词数:', standardized.keywords.length);

    // 测试结果合并
    console.log('\n3. 测试结果合并...');
    
    const result1 = {
      success: true,
      engine: 'whisper-local',
      text: '第一个结果的文本',
      segments: [{ index: 0, start: 0, end: 5, text: '第一段' }],
      keywords: [{ word: '关键词1', frequency: 1, timestamps: [0], importance: 0.8 }]
    };

    const result2 = {
      success: true,
      engine: 'aliyun-asr',
      text: '第二个结果的文本',
      segments: [{ index: 0, start: 5, end: 10, text: '第二段' }],
      keywords: [{ word: '关键词2', frequency: 1, timestamps: [5], importance: 0.7 }]
    };

    const merged = TranscriptProcessor.mergeResults([
      TranscriptProcessor.standardize(result1, 'whisper-local'),
      TranscriptProcessor.standardize(result2, 'aliyun-asr')
    ]);

    console.log('✅ 结果合并:');
    console.log('   - 合并后文本:', merged.text);
    console.log('   - 合并后片段数:', merged.segments.length);
    console.log('   - 合并后关键词数:', merged.keywords.length);

    // 测试服务层功能（模拟）
    console.log('\n4. 测试服务层功能...');
    
    try {
      // 模拟保存转录结果
      const savedResult = await TranscriptService.saveTranscript(
        standardized,
        { useDatabase: false } // 不使用实际数据库
      );
      console.log('✅ 保存转录结果: 成功');
      
      // 测试分析功能
      const analysis = await TranscriptService.performAnalysis(savedResult);
      console.log('✅ 内容分析:');
      console.log('   - 摘要:', analysis.summary.substring(0, 50) + '...');
      console.log('   - 关键点数:', analysis.keyPoints.length);
      console.log('   - 内容类型:', analysis.contentType);
      console.log('   - 推荐平台:', analysis.suitablePlatforms);
      
    } catch (error) {
      console.log('⚠️  服务层测试:', error.message);
    }

    // 测试验证器
    console.log('\n5. 测试各种验证器...');
    
    const validSegment = { index: 0, start: 0, end: 5, text: '测试' };
    const validKeyword = { word: '测试', frequency: 1, timestamps: [0], importance: 0.8 };
    const validTask = { taskId: 'test_123', videoId: 'vid_456', status: 'pending', progress: 0, mediaPath: '/test.mp4' };

    console.log('✅ 片段验证:', TranscriptValidator.validateSegment(validSegment) ? '通过' : '失败');
    console.log('✅ 关键词验证:', TranscriptValidator.validateKeyword(validKeyword) ? '通过' : '失败');
    console.log('✅ 任务验证:', TranscriptValidator.validateTask(validTask) ? '通过' : '失败');

    console.log('\n🎉 转录数据模型测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testTranscriptModel();