/**
 * 转录结果数据模型
 * 定义标准化的转录结果结构和相关类型
 */

// 转录引擎类型
const TranscriptionEngine = {
  WHISPER_LOCAL: 'whisper-local',
  ALIYUN_ASR: 'aliyun-asr',
  GOOGLE_STT: 'google-stt',
  AZURE_STT: 'azure-stt'
};

// 转录状态
const TranscriptionStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// 语言类型
const LanguageCode = {
  CHINESE_SIMPLIFIED: 'zh-CN',
  CHINESE_TRADITIONAL: 'zh-TW',
  ENGLISH_US: 'en-US',
  ENGLISH_UK: 'en-GB',
  JAPANESE: 'ja-JP',
  KOREAN: 'ko-KR'
};

/**
 * @typedef {Object} TranscriptSegment
 * @property {number} index - 片段索引
 * @property {number} start - 开始时间（秒）
 * @property {number} end - 结束时间（秒）
 * @property {string} text - 文本内容
 * @property {number} [confidence] - 置信度 (0-1)
 * @property {string} [speaker] - 说话者标识
 * @property {Object} [metadata] - 片段元数据
 */

/**
 * @typedef {Object} TranscriptKeyword
 * @property {string} word - 关键词
 * @property {number} frequency - 出现频率
 * @property {number[]} timestamps - 出现时间戳数组
 * @property {number} importance - 重要性评分 (0-1)
 */

/**
 * @typedef {Object} TranscriptMetadata
 * @property {string} engine - 使用的转录引擎
 * @property {string} model - 使用的模型
 * @property {string} language - 识别的语言
 * @property {number} processingTime - 处理耗时（毫秒）
 * @property {string} deviceId - 设备标识
 * @property {Object} [engineSpecific] - 引擎特定的元数据
 * @property {string} [version] - 转录引擎版本
 * @property {Date} createdAt - 创建时间
 * @property {Date} [updatedAt] - 更新时间
 */

/**
 * @typedef {Object} TranscriptAnalysis
 * @property {string} summary - 内容摘要
 * @property {string[]} keyPoints - 关键要点
 * @property {string[]} quotes - 精彩语句
 * @property {string[]} topics - 主题标签
 * @property {Object} sentiment - 情感分析结果
 * @property {string} contentType - 内容类型
 * @property {string[]} suitablePlatforms - 适合的发布平台
 * @property {Object} [statistics] - 统计信息
 */

/**
 * @typedef {Object} TranscriptResult
 * @property {boolean} success - 是否成功
 * @property {string} engine - 转录引擎名称
 * @property {number} duration - 音频时长（秒）
 * @property {string} language - 识别语言
 * @property {string} text - 完整转录文本
 * @property {TranscriptSegment[]} segments - 时间片段
 * @property {TranscriptKeyword[]} keywords - 关键词
 * @property {TranscriptMetadata} metadata - 元数据
 * @property {TranscriptAnalysis} [analysis] - 分析结果
 * @property {string} [error] - 错误信息
 * @property {string} [videoId] - 关联的视频ID
 * @property {string} [taskId] - 关联的任务ID
 */

/**
 * @typedef {Object} TranscriptionTask
 * @property {string} taskId - 任务ID
 * @property {string} videoId - 视频ID
 * @property {string} status - 任务状态
 * @property {number} progress - 进度百分比 (0-100)
 * @property {string} mediaPath - 媒体文件路径
 * @property {Object} options - 转录选项
 * @property {TranscriptResult} [result] - 转录结果
 * @property {string} [error] - 错误信息
 * @property {Date} createdAt - 创建时间
 * @property {Date} [startedAt] - 开始时间
 * @property {Date} [completedAt] - 完成时间
 * @property {Date} [updatedAt] - 更新时间
 */

/**
 * @typedef {Object} TranscriptionConfig
 * @property {string} defaultEngine - 默认引擎
 * @property {Object} engines - 引擎配置
 * @property {Object} fallback - 备用配置
 * @property {Object} task - 任务配置
 * @property {Object} storage - 存储配置
 */

/**
 * 转录结果验证器
 */
class TranscriptValidator {
  /**
   * 验证转录结果的基本结构
   * @param {TranscriptResult} result - 转录结果
   * @returns {boolean}
   */
  static validateBasicStructure(result) {
    return result &&
      typeof result.success === 'boolean' &&
      typeof result.engine === 'string' &&
      typeof result.text === 'string' &&
      Array.isArray(result.segments) &&
      result.metadata &&
      typeof result.metadata.processingTime === 'number';
  }

  /**
   * 验证时间段段结构
   * @param {TranscriptSegment} segment - 时间片段
   * @returns {boolean}
   */
  static validateSegment(segment) {
    return segment &&
      typeof segment.index === 'number' &&
      typeof segment.start === 'number' &&
      typeof segment.end === 'number' &&
      typeof segment.text === 'string' &&
      segment.start >= 0 &&
      segment.end >= segment.start;
  }

  /**
   * 验证关键词结构
   * @param {TranscriptKeyword} keyword - 关键词
   * @returns {boolean}
   */
  static validateKeyword(keyword) {
    return keyword &&
      typeof keyword.word === 'string' &&
      typeof keyword.frequency === 'number' &&
      Array.isArray(keyword.timestamps) &&
      typeof keyword.importance === 'number' &&
      keyword.importance >= 0 && keyword.importance <= 1;
  }

  /**
   * 验证任务结构
   * @param {TranscriptionTask} task - 转录任务
   * @returns {boolean}
   */
  static validateTask(task) {
    return task &&
      typeof task.taskId === 'string' &&
      typeof task.videoId === 'string' &&
      typeof task.status === 'string' &&
      typeof task.progress === 'number' &&
      typeof task.mediaPath === 'string';
  }
}

/**
 * 转录结果处理器
 */
class TranscriptProcessor {
  /**
   * 标准化转录结果
   * @param {Object} rawResult - 原始转录结果
   * @param {string} engine - 引擎名称
   * @returns {TranscriptResult}
   */
  static standardize(rawResult, engine) {
    return {
      success: rawResult.success ?? true,
      engine: engine,
      duration: rawResult.duration ?? 0,
      language: rawResult.language ?? 'zh-CN',
      text: rawResult.text ?? '',
      segments: this.standardizeSegments(rawResult.segments ?? []),
      keywords: this.standardizeKeywords(rawResult.keywords ?? []),
      metadata: this.standardizeMetadata(rawResult.metadata ?? {}, engine),
      analysis: rawResult.analysis,
      error: rawResult.error,
      videoId: rawResult.videoId,
      taskId: rawResult.taskId
    };
  }

  /**
   * 标准化时间段段
   * @param {Array} segments - 原始时间段段数组
   * @returns {TranscriptSegment[]}
   */
  static standardizeSegments(segments) {
    return segments.map((segment, index) => ({
      index: segment.index ?? index,
      start: segment.start ?? 0,
      end: segment.end ?? 0,
      text: segment.text ?? '',
      confidence: segment.confidence ?? 1.0,
      speaker: segment.speaker ?? 'unknown',
      metadata: segment.metadata ?? {}
    }));
  }

  /**
   * 标准化关键词
   * @param {Array} keywords - 原始关键词数组
   * @returns {TranscriptKeyword[]}
   */
  static standardizeKeywords(keywords) {
    return keywords.map(keyword => ({
      word: typeof keyword === 'string' ? keyword : keyword.word ?? '',
      frequency: keyword.frequency ?? 1,
      timestamps: keyword.timestamps ?? [],
      importance: keyword.importance ?? 0.5
    }));
  }

  /**
   * 标准化元数据
   * @param {Object} metadata - 原始元数据
   * @param {string} engine - 引擎名称
   * @returns {TranscriptMetadata}
   */
  static standardizeMetadata(metadata, engine) {
    return {
      engine: engine,
      model: metadata.model ?? 'default',
      language: metadata.language ?? 'zh-CN',
      processingTime: metadata.processingTime ?? 0,
      deviceId: metadata.deviceId ?? 'local',
      engineSpecific: metadata.engineSpecific ?? {},
      version: metadata.version ?? '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * 合并多个转录结果
   * @param {TranscriptResult[]} results - 转录结果数组
   * @returns {TranscriptResult}
   */
  static mergeResults(results) {
    if (!results || results.length === 0) {
      return this.createEmptyResult();
    }

    if (results.length === 1) {
      return results[0];
    }

    // 合并文本（按时间排序）
    const sortedSegments = results
      .flatMap(result => result.segments || [])
      .sort((a, b) => a.start - b.start);

    const mergedText = sortedSegments.map(s => s.text).join(' ');

    // 合并关键词
    const allKeywords = results.flatMap(result => result.keywords || []);
    const keywordMap = new Map();
    
    allKeywords.forEach(kw => {
      if (keywordMap.has(kw.word)) {
        const existing = keywordMap.get(kw.word);
        keywordMap.set(kw.word, {
          ...kw,
          frequency: existing.frequency + kw.frequency,
          timestamps: [...existing.timestamps, ...kw.timestamps],
          importance: Math.max(existing.importance, kw.importance)
        });
      } else {
        keywordMap.set(kw.word, kw);
      }
    });

    return {
      success: results.every(r => r.success),
      engine: 'merged',
      duration: Math.max(...results.map(r => r.duration || 0)),
      language: results[0].language,
      text: mergedText,
      segments: sortedSegments,
      keywords: Array.from(keywordMap.values()),
      metadata: {
        engine: 'merged',
        processingTime: results.reduce((sum, r) => sum + (r.metadata?.processingTime || 0), 0),
        createdAt: new Date()
      },
      error: results.find(r => r.error)?.error
    };
  }

  /**
   * 创建空的转录结果
   * @returns {TranscriptResult}
   */
  static createEmptyResult() {
    return {
      success: false,
      engine: 'none',
      duration: 0,
      language: 'zh-CN',
      text: '',
      segments: [],
      keywords: [],
      metadata: {
        engine: 'none',
        processingTime: 0,
        createdAt: new Date()
      }
    };
  }
}

module.exports = {
  TranscriptionEngine,
  TranscriptionStatus,
  LanguageCode,
  TranscriptValidator,
  TranscriptProcessor
};