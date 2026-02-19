/**
 * 身份保持机制服务
 * IT-006: 身份保持机制
 * 
 * 功能：
 * - 人物特征提取
 * - 特征跟踪
 * - 一致性校验
 * - 人物特征库管理
 */

const logger = require('../utils/logger');
const NodeCache = require('node-cache');

class IdentityPreservationService {
  constructor() {
    this.featureCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
    this.identityLibrary = new Map();
    this.trackingHistory = [];
    this.maxHistorySize = 500;

    this.config = {
      featureDimensions: 512,
      similarityThreshold: 0.85,
      maxIdentities: 1000,
      trackingWindowSize: 30
    };
  }

  async extractFeatures(imagePath, options = {}) {
    const extractionId = this.generateId();

    try {
      logger.info('[Identity] 开始特征提取', { imagePath, extractionId });

      const features = {
        extractionId,
        imagePath,
        timestamp: new Date().toISOString(),
        embedding: this.generateMockEmbedding(),
        landmarks: this.generateMockLandmarks(),
        attributes: await this.extractAttributes(imagePath),
        quality: this.assessImageQuality(imagePath)
      };

      this.featureCache.set(extractionId, features);

      return {
        success: true,
        extractionId,
        features: {
          embedding: features.embedding,
          landmarks: features.landmarks,
          attributes: features.attributes,
          quality: features.quality
        }
      };
    } catch (error) {
      logger.error('[Identity] 特征提取失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  generateMockEmbedding() {
    const embedding = [];
    for (let i = 0; i < this.config.featureDimensions; i++) {
      embedding.push(Math.random() * 2 - 1);
    }
    return embedding;
  }

  generateMockLandmarks() {
    return {
      face: [
        { x: 0.3, y: 0.4, type: 'left_eye' },
        { x: 0.7, y: 0.4, type: 'right_eye' },
        { x: 0.5, y: 0.5, type: 'nose' },
        { x: 0.4, y: 0.7, type: 'mouth_left' },
        { x: 0.6, y: 0.7, type: 'mouth_right' }
      ],
      confidence: 0.95
    };
  }

  async extractAttributes(imagePath) {
    return {
      age: Math.floor(Math.random() * 40) + 20,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      ethnicity: 'asian',
      expression: 'neutral',
      glasses: Math.random() > 0.8,
      beard: Math.random() > 0.7,
      hairColor: 'black',
      confidence: 0.9 + Math.random() * 0.1
    };
  }

  assessImageQuality(imagePath) {
    return {
      resolution: '1080p',
      brightness: 0.7 + Math.random() * 0.2,
      contrast: 0.6 + Math.random() * 0.3,
      sharpness: 0.8 + Math.random() * 0.15,
      faceVisibility: 0.9 + Math.random() * 0.1,
      overallScore: 0.85 + Math.random() * 0.1
    };
  }

  async registerIdentity(identityId, features, metadata = {}) {
    try {
      if (this.identityLibrary.size >= this.config.maxIdentities) {
        this.evictOldestIdentity();
      }

      const identity = {
        id: identityId,
        features,
        metadata: {
          name: metadata.name || `Identity_${identityId}`,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          usageCount: 0,
          tags: metadata.tags || []
        },
        variants: []
      };

      this.identityLibrary.set(identityId, identity);

      logger.info('[Identity] 身份已注册', { identityId });

      return {
        success: true,
        identityId,
        message: '身份注册成功'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async trackIdentity(identityId, frames) {
    const trackingId = this.generateId();

    try {
      logger.info('[Identity] 开始身份跟踪', { identityId, frameCount: frames.length });

      const identity = this.identityLibrary.get(identityId);
      if (!identity) {
        throw new Error('身份不存在');
      }

      const trackingResults = [];

      for (let i = 0; i < frames.length; i++) {
        const frameFeatures = await this.extractFeatures(frames[i]);
        const similarity = this.calculateSimilarity(identity.features.embedding, frameFeatures.features.embedding);

        trackingResults.push({
          frameIndex: i,
          detected: similarity > this.config.similarityThreshold,
          similarity,
          boundingBox: this.generateBoundingBox(),
          landmarks: frameFeatures.features.landmarks
        });
      }

      const consistencyScore = this.calculateConsistency(trackingResults);

      this.addToTrackingHistory({
        trackingId,
        identityId,
        frameCount: frames.length,
        consistencyScore,
        timestamp: new Date().toISOString()
      });

      identity.metadata.usageCount++;
      identity.metadata.lastUpdated = new Date().toISOString();

      return {
        success: true,
        trackingId,
        results: trackingResults,
        consistencyScore,
        summary: {
          totalFrames: frames.length,
          detectedFrames: trackingResults.filter(r => r.detected).length,
          avgSimilarity: trackingResults.reduce((sum, r) => sum + r.similarity, 0) / frames.length
        }
      };
    } catch (error) {
      logger.error('[Identity] 跟踪失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  calculateConsistency(trackingResults) {
    if (trackingResults.length === 0) return 0;

    const detectedCount = trackingResults.filter(r => r.detected).length;
    const detectionRate = detectedCount / trackingResults.length;

    const similarities = trackingResults.map(r => r.similarity);
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    const variance = similarities.reduce((sum, s) => sum + Math.pow(s - avgSimilarity, 2), 0) / similarities.length;
    const stability = 1 - Math.min(variance * 4, 1);

    return detectionRate * 0.5 + avgSimilarity * 0.3 + stability * 0.2;
  }

  generateBoundingBox() {
    return {
      x: 0.2 + Math.random() * 0.1,
      y: 0.1 + Math.random() * 0.1,
      width: 0.5 + Math.random() * 0.1,
      height: 0.6 + Math.random() * 0.1,
      confidence: 0.9 + Math.random() * 0.1
    };
  }

  async verifyIdentity(identityId, imagePath) {
    try {
      const identity = this.identityLibrary.get(identityId);
      if (!identity) {
        throw new Error('身份不存在');
      }

      const features = await this.extractFeatures(imagePath);
      if (!features.success) {
        throw new Error(features.error);
      }

      const similarity = this.calculateSimilarity(
        identity.features.embedding,
        features.features.embedding
      );

      const isMatch = similarity > this.config.similarityThreshold;

      return {
        success: true,
        identityId,
        isMatch,
        similarity,
        threshold: this.config.similarityThreshold,
        confidence: isMatch ? similarity : 1 - similarity
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async compareIdentities(identityId1, identityId2) {
    try {
      const identity1 = this.identityLibrary.get(identityId1);
      const identity2 = this.identityLibrary.get(identityId2);

      if (!identity1 || !identity2) {
        throw new Error('身份不存在');
      }

      const similarity = this.calculateSimilarity(
        identity1.features.embedding,
        identity2.features.embedding
      );

      const attributeComparison = this.compareAttributes(
        identity1.features.attributes,
        identity2.features.attributes
      );

      return {
        success: true,
        similarity,
        isSamePerson: similarity > this.config.similarityThreshold,
        attributeComparison
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  compareAttributes(attrs1, attrs2) {
    const comparison = {};

    if (attrs1.gender && attrs2.gender) {
      comparison.gender = attrs1.gender === attrs2.gender;
    }

    if (attrs1.age && attrs2.age) {
      comparison.ageDiff = Math.abs(attrs1.age - attrs2.age);
      comparison.ageMatch = comparison.ageDiff < 10;
    }

    return comparison;
  }

  getIdentity(identityId) {
    const identity = this.identityLibrary.get(identityId);
    if (!identity) return null;

    return {
      id: identity.id,
      metadata: identity.metadata,
      featureQuality: identity.features.quality
    };
  }

  listIdentities(options = {}) {
    let identities = Array.from(this.identityLibrary.values());

    if (options.tags && options.tags.length > 0) {
      identities = identities.filter(i =>
        options.tags.some(tag => i.metadata.tags.includes(tag))
      );
    }

    if (options.limit) {
      identities = identities.slice(0, options.limit);
    }

    return identities.map(i => ({
      id: i.id,
      name: i.metadata.name,
      createdAt: i.metadata.createdAt,
      usageCount: i.metadata.usageCount
    }));
  }

  deleteIdentity(identityId) {
    const deleted = this.identityLibrary.delete(identityId);
    return {
      success: deleted,
      message: deleted ? '身份已删除' : '身份不存在'
    };
  }

  addToTrackingHistory(entry) {
    this.trackingHistory.unshift(entry);

    if (this.trackingHistory.length > this.maxHistorySize) {
      this.trackingHistory = this.trackingHistory.slice(0, this.maxHistorySize);
    }
  }

  getTrackingHistory(options = {}) {
    let history = [...this.trackingHistory];

    if (options.identityId) {
      history = history.filter(h => h.identityId === options.identityId);
    }

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  getStats() {
    return {
      totalIdentities: this.identityLibrary.size,
      totalTrackings: this.trackingHistory.length,
      avgConsistency: this.trackingHistory.length > 0
        ? this.trackingHistory.reduce((sum, h) => sum + h.consistencyScore, 0) / this.trackingHistory.length
        : 0,
      cacheSize: this.featureCache.keys().length
    };
  }

  evictOldestIdentity() {
    let oldest = null;
    let oldestTime = Date.now();

    this.identityLibrary.forEach((identity, id) => {
      const created = new Date(identity.metadata.createdAt).getTime();
      if (created < oldestTime && identity.metadata.usageCount === 0) {
        oldest = id;
        oldestTime = created;
      }
    });

    if (oldest) {
      this.identityLibrary.delete(oldest);
      logger.info('[Identity] 淘汰未使用身份', { identityId: oldest });
    }
  }

  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return { ...this.config };
  }
}

const identityPreservationService = new IdentityPreservationService();

module.exports = {
  IdentityPreservationService,
  identityPreservationService
};
