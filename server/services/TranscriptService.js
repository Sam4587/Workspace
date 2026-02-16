/**
 * 转录结果服务
 * 处理转录结果的存储、检索、分析等业务逻辑
 */

const logger = require('../utils/logger');
const { TranscriptValidator, TranscriptProcessor } = require('../models/TranscriptModel');
const { Transcript, TranscriptionTask } = require('../models/TranscriptDBModel');

class TranscriptService {
  /**
   * 保存转录结果
   * @param {Object} transcriptData - 转录数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 保存的结果
   */
  async saveTranscript(transcriptData, options = {}) {
    try {
      // 验证数据结构
      if (!TranscriptValidator.validateBasicStructure(transcriptData)) {
        throw new Error('Invalid transcript data structure');
      }

      // 标准化数据
      const standardizedData = TranscriptProcessor.standardize(
        transcriptData, 
        transcriptData.engine
      );

      // 如果使用数据库
      if (options.useDatabase !== false && Transcript) {
        const transcript = new Transcript(standardizedData);
        const savedTranscript = await transcript.save();
        
        logger.info('[TranscriptService] 转录结果已保存到数据库', {
          transcriptId: savedTranscript._id,
          videoId: savedTranscript.videoId,
          engine: savedTranscript.engine
        });
        
        return savedTranscript.toObject();
      }

      // 如果不使用数据库，返回标准化数据
      logger.info('[TranscriptService] 转录结果已处理', {
        videoId: standardizedData.videoId,
        engine: standardizedData.engine
      });

      return standardizedData;
    } catch (error) {
      logger.error('[TranscriptService] 保存转录结果失败', {
        error: error.message,
        videoId: transcriptData.videoId
      });
      throw error;
    }
  }

  /**
   * 获取转录结果
   * @param {string} videoId - 视频ID
   * @param {Object} options - 选项
   * @returns {Promise<Object|null>}
   */
  async getTranscript(videoId, options = {}) {
    try {
      // 如果使用数据库
      if (options.useDatabase !== false && Transcript) {
        const transcript = await Transcript.findByVideoId(videoId);
        if (transcript) {
          logger.debug('[TranscriptService] 从数据库获取转录结果', { videoId });
          return transcript.toObject();
        }
      }

      // 如果没有数据库或未找到，返回null
      logger.debug('[TranscriptService] 未找到转录结果', { videoId });
      return null;
    } catch (error) {
      logger.error('[TranscriptService] 获取转录结果失败', {
        error: error.message,
        videoId
      });
      throw error;
    }
  }

  /**
   * 更新转录结果
   * @param {string} videoId - 视频ID
   * @param {Object} updateData - 更新数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async updateTranscript(videoId, updateData, options = {}) {
    try {
      // 如果使用数据库
      if (options.useDatabase !== false && Transcript) {
        const updatedTranscript = await Transcript.findOneAndUpdate(
          { videoId },
          { $set: updateData, updatedAt: new Date() },
          { new: true, runValidators: true }
        );

        if (updatedTranscript) {
          logger.info('[TranscriptService] 转录结果已更新', { videoId });
          return updatedTranscript.toObject();
        }
      }

      // 如果没有数据库，抛出错误
      throw new Error('Transcript not found');
    } catch (error) {
      logger.error('[TranscriptService] 更新转录结果失败', {
        error: error.message,
        videoId
      });
      throw error;
    }
  }

  /**
   * 删除转录结果
   * @param {string} videoId - 视频ID
   * @param {Object} options - 选项
   * @returns {Promise<boolean>}
   */
  async deleteTranscript(videoId, options = {}) {
    try {
      // 如果使用数据库
      if (options.useDatabase !== false && Transcript) {
        const result = await Transcript.deleteOne({ videoId });
        const deleted = result.deletedCount > 0;
        
        if (deleted) {
          logger.info('[TranscriptService] 转录结果已删除', { videoId });
        }
        
        return deleted;
      }

      return false;
    } catch (error) {
      logger.error('[TranscriptService] 删除转录结果失败', {
        error: error.message,
        videoId
      });
      throw error;
    }
  }

  /**
   * 搜索转录结果
   * @param {Object} query - 查询条件
   * @param {Object} options - 选项
   * @returns {Promise<Array>}
   */
  async searchTranscripts(query = {}, options = {}) {
    try {
      const {
        keyword,
        engine,
        status,
        language,
        dateFrom,
        dateTo,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // 构建查询条件
      const searchQuery = {};

      if (keyword) {
        searchQuery.$or = [
          { text: { $regex: keyword, $options: 'i' } },
          { 'keywords.word': { $regex: keyword, $options: 'i' } }
        ];
      }

      if (engine) searchQuery.engine = engine;
      if (status) searchQuery.status = status;
      if (language) searchQuery.language = language;

      if (dateFrom || dateTo) {
        searchQuery.createdAt = {};
        if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
      }

      // 如果使用数据库
      if (options.useDatabase !== false && Transcript) {
        const transcripts = await Transcript.find(searchQuery)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(offset)
          .limit(limit)
          .lean();

        logger.debug('[TranscriptService] 搜索转录结果', {
          query: searchQuery,
          count: transcripts.length
        });

        return transcripts;
      }

      // 如果没有数据库，返回空数组
      return [];
    } catch (error) {
      logger.error('[TranscriptService] 搜索转录结果失败', {
        error: error.message,
        query: options
      });
      throw error;
    }
  }

  /**
   * 分析转录结果
   * @param {string} videoId - 视频ID
   * @param {Object} analysisOptions - 分析选项
   * @returns {Promise<Object>}
   */
  async analyzeTranscript(videoId, analysisOptions = {}) {
    try {
      const transcript = await this.getTranscript(videoId, analysisOptions);
      
      if (!transcript) {
        throw new Error('Transcript not found');
      }

      // 执行分析
      const analysis = await this.performAnalysis(transcript, analysisOptions);

      // 保存分析结果
      await this.updateTranscript(
        videoId,
        { analysis },
        analysisOptions
      );

      logger.info('[TranscriptService] 转录分析完成', { videoId });
      return analysis;
    } catch (error) {
      logger.error('[TranscriptService] 分析转录结果失败', {
        error: error.message,
        videoId
      });
      throw error;
    }
  }

  /**
   * 执行具体的分析逻辑
   * @param {Object} transcript - 转录数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async performAnalysis(transcript, options = {}) {
    const { text, segments, keywords } = transcript;
    
    // 基础统计
    const wordCount = text ? text.split(/\s+/).length : 0;
    const sentenceCount = text ? text.split(/[.!?。！？]/).length : 0;
    
    // 关键词分析
    const sortedKeywords = keywords 
      ? [...keywords].sort((a, b) => b.importance - a.importance).slice(0, 10)
      : [];

    // 情感分析（简化版）
    const sentimentScore = this.calculateSentiment(text);
    
    return {
      summary: this.generateSummary(text, options.summaryLength || 200),
      keyPoints: this.extractKeyPoints(segments, options.keyPointCount || 5),
      quotes: this.extractQuotes(text, options.quoteCount || 3),
      topics: sortedKeywords.map(k => k.word),
      sentiment: {
        polarity: sentimentScore > 0.1 ? 'positive' : 
                  sentimentScore < -0.1 ? 'negative' : 'neutral',
        score: sentimentScore
      },
      contentType: this.classifyContentType(text),
      suitablePlatforms: this.suggestPlatforms(text),
      statistics: {
        wordCount,
        sentenceCount,
        averageSentenceLength: sentenceCount > 0 ? wordCount / sentenceCount : 0
      }
    };
  }

  /**
   * 生成摘要
   * @param {string} text - 文本
   * @param {number} maxLength - 最大长度
   * @returns {string}
   */
  generateSummary(text, maxLength) {
    if (!text) return '';
    
    // 简单的摘要生成：取前maxLength个字符
    const sentences = text.split(/[.!?。！？]/);
    let summary = '';
    let currentLength = 0;
    
    for (const sentence of sentences) {
      if (currentLength + sentence.length <= maxLength) {
        summary += sentence + '.';
        currentLength += sentence.length + 1;
      } else {
        break;
      }
    }
    
    return summary.trim() || text.substring(0, maxLength) + '...';
  }

  /**
   * 提取关键点
   * @param {Array} segments - 时间片段
   * @param {number} count - 数量
   * @returns {Array}
   */
  extractKeyPoints(segments, count) {
    if (!segments || segments.length === 0) return [];
    
    // 按置信度排序，取前几个
    return segments
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, count)
      .map(s => s.text);
  }

  /**
   * 提取精彩语句
   * @param {string} text - 文本
   * @param {number} count - 数量
   * @returns {Array}
   */
  extractQuotes(text, count) {
    if (!text) return [];
    
    const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
    
    // 简单选择较长的句子作为精彩语句
    return sentences
      .sort((a, b) => b.length - a.length)
      .slice(0, count)
      .map(s => s.trim() + '.');
  }

  /**
   * 计算情感分数
   * @param {string} text - 文本
   * @returns {number}
   */
  calculateSentiment(text) {
    if (!text) return 0;
    
    const positiveWords = ['好', '棒', '优秀', '赞', '喜欢', '开心', '满意'];
    const negativeWords = ['坏', '差', '糟糕', '讨厌', '难过', '失望', '不满'];
    
    let score = 0;
    const lowerText = text.toLowerCase();
    
    positiveWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      score += matches * 0.1;
    });
    
    negativeWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      score -= matches * 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * 分类内容类型
   * @param {string} text - 文本
   * @returns {string}
   */
  classifyContentType(text) {
    if (!text) return 'other';
    
    const classifiers = {
      'education': ['学习', '知识', '教程', '教学', '课程', '技能'],
      'entertainment': ['娱乐', '搞笑', '有趣', '好玩', '轻松'],
      'news': ['新闻', '报道', '事件', '最新', '突发'],
      'technology': ['科技', '技术', '创新', '产品', '开发']
    };
    
    let bestMatch = 'other';
    let maxMatches = 0;
    
    Object.entries(classifiers).forEach(([type, keywords]) => {
      const matches = keywords.reduce((count, keyword) => {
        return count + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = type;
      }
    });
    
    return bestMatch;
  }

  /**
   * 推荐适合的平台
   * @param {string} text - 文本
   * @returns {Array}
   */
  suggestPlatforms(text) {
    const platforms = [];
    
    if (text && text.length > 50) {
      platforms.push('article'); // 长文章适合详细内容
    }
    
    if (text && text.length < 200) {
      platforms.push('micro_post'); // 短内容适合微头条
    }
    
    // 根据内容特征推荐
    if (text && (text.includes('教程') || text.includes('教学'))) {
      platforms.push('tutorial');
    }
    
    if (text && text.includes('新闻')) {
      platforms.push('news');
    }
    
    return platforms.length > 0 ? platforms : ['general'];
  }

  /**
   * 获取统计数据
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>}
   */
  async getStatistics(filters = {}) {
    try {
      if (Transcript) {
        const stats = await Transcript.getStatistics(filters);
        return stats;
      }
      
      return {
        total: 0,
        avgProcessingTime: 0,
        avgDuration: 0,
        byEngine: [],
        byStatus: []
      };
    } catch (error) {
      logger.error('[TranscriptService] 获取统计失败', { error: error.message });
      throw error;
    }
  }
}

// 单例实例
const transcriptService = new TranscriptService();

module.exports = transcriptService;