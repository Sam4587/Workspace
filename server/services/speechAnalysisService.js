/**
 * 语音分析模块
 * IT-003: 语音分析模块集成
 * 
 * 功能：
 * - 音频特征提取
 * - 语音识别
 * - 情感分析
 * - 语速分析
 */

const logger = require('../utils/logger');
const { infiniteTalkService } = require('./infiniteTalkService');
const fs = require('fs').promises;
const path = require('path');

class SpeechAnalysisService {
  constructor() {
    this.analysisCache = new Map();
    this.maxCacheSize = 100;
    this.supportedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];
  }

  async analyzeAudio(audioPath, options = {}) {
    const analysisId = this.generateAnalysisId();

    try {
      logger.info('[SpeechAnalysis] 开始音频分析', { audioPath, analysisId });

      const ext = path.extname(audioPath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`不支持的音频格式: ${ext}`);
      }

      const stats = await fs.stat(audioPath);
      const fileSize = stats.size;

      const features = await infiniteTalkService.extractAudioFeatures(audioPath, {
        melSpectrogram: options.melSpectrogram !== false,
        wav2vec: options.wav2vec !== false,
        sampleRate: options.sampleRate || 16000
      });

      const speech = await infiniteTalkService.analyzeSpeech(audioPath);

      const analysis = {
        id: analysisId,
        audioPath,
        fileSize,
        createdAt: new Date().toISOString(),
        features: features.success ? features.features : null,
        speech: speech.success ? speech.analysis : null,
        metadata: {
          format: ext,
          analyzed: true
        }
      };

      this.cacheAnalysis(analysisId, analysis);

      return {
        success: true,
        analysisId,
        analysis
      };
    } catch (error) {
      logger.error('[SpeechAnalysis] 音频分析失败', {
        audioPath,
        error: error.message
      });

      return {
        success: false,
        analysisId,
        error: error.message
      };
    }
  }

  async extractFeatures(audioPath, options = {}) {
    try {
      const result = await infiniteTalkService.extractAudioFeatures(audioPath, options);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        features: {
          melSpectrogram: result.features.melSpectrogram,
          wav2vecFeatures: result.features.wav2vecFeatures,
          duration: result.features.duration,
          sampleRate: result.features.sampleRate
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async transcribe(audioPath, options = {}) {
    try {
      const result = await infiniteTalkService.analyzeSpeech(audioPath);

      if (!result.success) {
        throw new Error(result.error);
      }

      const transcription = {
        text: result.analysis.transcription,
        language: result.analysis.language,
        duration: result.analysis.duration,
        wordCount: result.analysis.wordCount,
        confidence: result.analysis.confidence
      };

      if (options.calculateSpeakingRate) {
        transcription.speakingRate = result.analysis.speakingRate;
      }

      return {
        success: true,
        transcription
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async analyzeEmotion(audioPath) {
    try {
      const result = await infiniteTalkService.analyzeSpeech(audioPath);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        emotion: result.analysis.emotion || {
          primary: 'neutral',
          confidence: 0.5,
          scores: {
            happy: 0.1,
            sad: 0.1,
            angry: 0.1,
            neutral: 0.5,
            excited: 0.1,
            calm: 0.1
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async analyzeSpeakingStyle(audioPath) {
    try {
      const result = await infiniteTalkService.analyzeSpeech(audioPath);

      if (!result.success) {
        throw new Error(result.error);
      }

      const analysis = result.analysis;

      return {
        success: true,
        style: {
          speakingRate: analysis.speakingRate || 0,
          duration: analysis.duration || 0,
          wordCount: analysis.wordCount || 0,
          averageWordDuration: analysis.duration && analysis.wordCount
            ? analysis.duration / analysis.wordCount
            : 0,
          language: analysis.language || 'unknown',
          confidence: analysis.confidence || 0
        },
        recommendations: this.generateStyleRecommendations(analysis)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  generateStyleRecommendations(analysis) {
    const recommendations = [];

    if (analysis.speakingRate > 200) {
      recommendations.push({
        type: 'speed',
        message: '语速较快，建议适当放慢以提高清晰度',
        severity: 'info'
      });
    } else if (analysis.speakingRate < 100) {
      recommendations.push({
        type: 'speed',
        message: '语速较慢，可适当加快以提高节奏感',
        severity: 'info'
      });
    }

    if (analysis.confidence < 0.7) {
      recommendations.push({
        type: 'quality',
        message: '语音识别置信度较低，可能存在噪音或发音不清',
        severity: 'warning'
      });
    }

    return recommendations;
  }

  async batchAnalyze(audioPaths, options = {}) {
    const results = [];

    for (const audioPath of audioPaths) {
      try {
        const result = await this.analyzeAudio(audioPath, options);
        results.push({
          audioPath,
          success: result.success,
          analysisId: result.analysisId,
          error: result.error
        });
      } catch (error) {
        results.push({
          audioPath,
          success: false,
          error: error.message
        });
      }
    }

    return {
      total: audioPaths.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async compareAudio(audioPath1, audioPath2) {
    try {
      const [analysis1, analysis2] = await Promise.all([
        this.analyzeAudio(audioPath1),
        this.analyzeAudio(audioPath2)
      ]);

      if (!analysis1.success || !analysis2.success) {
        throw new Error('音频分析失败');
      }

      const comparison = {
        duration: {
          audio1: analysis1.analysis.features?.duration || 0,
          audio2: analysis2.analysis.features?.duration || 0,
          difference: Math.abs(
            (analysis1.analysis.features?.duration || 0) -
            (analysis2.analysis.features?.duration || 0)
          )
        },
        speakingRate: {
          audio1: analysis1.analysis.speech?.speakingRate || 0,
          audio2: analysis2.analysis.speech?.speakingRate || 0
        },
        similarity: this.calculateSimilarity(analysis1.analysis, analysis2.analysis)
      };

      return {
        success: true,
        comparison
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  calculateSimilarity(analysis1, analysis2) {
    let similarity = 0;
    let factors = 0;

    if (analysis1.speech?.language && analysis2.speech?.language) {
      similarity += analysis1.speech.language === analysis2.speech.language ? 1 : 0;
      factors++;
    }

    if (analysis1.speech?.emotion && analysis2.speech?.emotion) {
      similarity += analysis1.speech.emotion.primary === analysis2.speech.emotion.primary ? 1 : 0;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  getAnalysis(analysisId) {
    return this.analysisCache.get(analysisId) || null;
  }

  cacheAnalysis(analysisId, analysis) {
    if (this.analysisCache.size >= this.maxCacheSize) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
    this.analysisCache.set(analysisId, analysis);
  }

  clearCache() {
    this.analysisCache.clear();
    logger.info('[SpeechAnalysis] 缓存已清空');
  }

  generateAnalysisId() {
    return `sa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSupportedFormats() {
    return this.supportedFormats;
  }
}

const speechAnalysisService = new SpeechAnalysisService();

module.exports = {
  SpeechAnalysisService,
  speechAnalysisService
};
