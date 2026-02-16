/**
 * 内容版本管理和历史记录服务
 * 提供内容版本控制、变更跟踪、历史恢复等功能
 */

const logger = require('../utils/logger');

class ContentVersioningService {
  constructor() {
    this.versionHistory = new Map(); // 内容ID -> 版本历史数组
    this.changeTrackers = new Map(); // 内容ID -> 变更跟踪器
    this.maxVersionsPerContent = 50; // 每个内容最大版本数
  }

  /**
   * 创建新版本
   */
  async createVersion(contentId, contentData, userId, changeDescription = '') {
    try {
      logger.info('[Versioning] 创建新版本', { 
        contentId, 
        userId,
        changeDescription 
      });

      const timestamp = new Date().toISOString();
      const versionNumber = this.getNextVersionNumber(contentId);
      
      const version = {
        versionId: `ver_${contentId}_${versionNumber}_${Date.now()}`,
        contentId,
        versionNumber,
        content: { ...contentData }, // 深拷贝内容
        author: userId,
        changeDescription: changeDescription || this.generateChangeDescription(contentData),
        timestamp,
        size: JSON.stringify(contentData).length
      };

      // 保存版本
      this.saveVersion(version);
      
      // 更新变更跟踪
      this.trackChanges(contentId, version, contentData);
      
      logger.info('[Versioning] 版本创建成功', { 
        versionId: version.versionId,
        versionNumber 
      });

      return {
        success: true,
        version: version,
        message: `版本 ${versionNumber} 创建成功`
      };
    } catch (error) {
      logger.error('[Versioning] 创建版本失败', { 
        error: error.message,
        contentId,
        userId
      });
      throw error;
    }
  }

  /**
   * 获取内容的所有版本
   */
  async getContentVersions(contentId, options = {}) {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        includeContent = false 
      } = options;
      
      const versions = this.versionHistory.get(contentId) || [];
      
      // 排序：最新版本在前
      const sortedVersions = [...versions].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // 分页
      const paginatedVersions = sortedVersions.slice(offset, offset + limit);
      
      // 如果不需要内容详情，移除content字段
      if (!includeContent) {
        paginatedVersions.forEach(version => {
          delete version.content;
        });
      }
      
      return {
        success: true,
        versions: paginatedVersions,
        totalCount: versions.length,
        hasMore: offset + limit < versions.length
      };
    } catch (error) {
      logger.error('[Versioning] 获取内容版本失败', { 
        error: error.message,
        contentId
      });
      throw error;
    }
  }

  /**
   * 获取特定版本
   */
  async getVersionByVersionId(versionId) {
    try {
      for (const versions of this.versionHistory.values()) {
        const version = versions.find(v => v.versionId === versionId);
        if (version) {
          return {
            success: true,
            version
          };
        }
      }
      
      return {
        success: false,
        error: '版本不存在'
      };
    } catch (error) {
      logger.error('[Versioning] 获取版本失败', { 
        error: error.message,
        versionId
      });
      throw error;
    }
  }

  /**
   * 比较两个版本的差异
   */
  async compareVersions(versionId1, versionId2) {
    try {
      const result1 = await this.getVersionByVersionId(versionId1);
      const result2 = await this.getVersionByVersionId(versionId2);
      
      if (!result1.success || !result2.success) {
        return {
          success: false,
          error: '一个或两个版本不存在'
        };
      }
      
      const version1 = result1.version;
      const version2 = result2.version;
      
      if (version1.contentId !== version2.contentId) {
        return {
          success: false,
          error: '不能比较不同内容的版本'
        };
      }
      
      const differences = this.calculateDifferences(version1.content, version2.content);
      
      return {
        success: true,
        differences,
        version1: {
          versionId: version1.versionId,
          versionNumber: version1.versionNumber,
          timestamp: version1.timestamp,
          author: version1.author
        },
        version2: {
          versionId: version2.versionId,
          versionNumber: version2.versionNumber,
          timestamp: version2.timestamp,
          author: version2.author
        }
      };
    } catch (error) {
      logger.error('[Versioning] 版本比较失败', { 
        error: error.message,
        versionId1,
        versionId2
      });
      throw error;
    }
  }

  /**
   * 恢复到指定版本
   */
  async restoreVersion(versionId, userId) {
    try {
      const result = await this.getVersionByVersionId(versionId);
      if (!result.success) {
        return result;
      }
      
      const version = result.version;
      
      // 创建新的恢复版本
      const restoreResult = await this.createVersion(
        version.contentId,
        version.content,
        userId,
        `恢复到版本 ${version.versionNumber}`
      );
      
      if (restoreResult.success) {
        logger.info('[Versioning] 版本恢复成功', { 
          contentId: version.contentId,
          restoredVersion: version.versionNumber,
          newVersion: restoreResult.version.versionNumber
        });
      }
      
      return restoreResult;
    } catch (error) {
      logger.error('[Versioning] 版本恢复失败', { 
        error: error.message,
        versionId,
        userId
      });
      throw error;
    }
  }

  /**
   * 获取变更历史
   */
  async getChangeHistory(contentId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const tracker = this.changeTrackers.get(contentId);
      if (!tracker) {
        return {
          success: true,
          changes: [],
          totalCount: 0
        };
      }
      
      const changes = [...tracker.changes].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      const paginatedChanges = changes.slice(offset, offset + limit);
      
      return {
        success: true,
        changes: paginatedChanges,
        totalCount: changes.length,
        hasMore: offset + limit < changes.length
      };
    } catch (error) {
      logger.error('[Versioning] 获取变更历史失败', { 
        error: error.message,
        contentId
      });
      throw error;
    }
  }

  /**
   * 获取内容统计信息
   */
  async getContentStats(contentId) {
    try {
      const versions = this.versionHistory.get(contentId) || [];
      const tracker = this.changeTrackers.get(contentId);
      
      if (versions.length === 0) {
        return {
          success: true,
          stats: {
            versionCount: 0,
            totalSize: 0,
            lastModified: null,
            authors: [],
            changeCount: 0
          }
        };
      }
      
      const totalSize = versions.reduce((sum, version) => sum + version.size, 0);
      const authors = [...new Set(versions.map(v => v.author))];
      const lastModified = versions.reduce((latest, version) => 
        new Date(version.timestamp) > new Date(latest) ? version.timestamp : latest,
        versions[0].timestamp
      );
      
      return {
        success: true,
        stats: {
          versionCount: versions.length,
          totalSize,
          averageSize: Math.round(totalSize / versions.length),
          lastModified,
          authors,
          changeCount: tracker ? tracker.changes.length : 0,
          firstCreated: versions[versions.length - 1].timestamp
        }
      };
    } catch (error) {
      logger.error('[Versioning] 获取内容统计失败', { 
        error: error.message,
        contentId
      });
      throw error;
    }
  }

  /**
   * 清理旧版本
   */
  async cleanupOldVersions(contentId, keepCount = 10) {
    try {
      const versions = this.versionHistory.get(contentId);
      if (!versions || versions.length <= keepCount) {
        return {
          success: true,
          message: '无需清理'
        };
      }
      
      // 保留最新的keepCount个版本
      const sortedVersions = [...versions].sort((a, b) => 
        b.versionNumber - a.versionNumber
      );
      
      const versionsToKeep = sortedVersions.slice(0, keepCount);
      const versionsToRemove = sortedVersions.slice(keepCount);
      
      this.versionHistory.set(contentId, versionsToKeep);
      
      logger.info('[Versioning] 旧版本清理完成', { 
        contentId,
        kept: versionsToKeep.length,
        removed: versionsToRemove.length
      });
      
      return {
        success: true,
        kept: versionsToKeep.length,
        removed: versionsToRemove.length
      };
    } catch (error) {
      logger.error('[Versioning] 清理旧版本失败', { 
        error: error.message,
        contentId
      });
      throw error;
    }
  }

  /**
   * 辅助方法
   */
  
  getNextVersionNumber(contentId) {
    const versions = this.versionHistory.get(contentId) || [];
    if (versions.length === 0) {
      return 1;
    }
    
    const maxVersion = Math.max(...versions.map(v => v.versionNumber));
    return maxVersion + 1;
  }

  saveVersion(version) {
    const versions = this.versionHistory.get(version.contentId) || [];
    versions.push(version);
    
    // 限制版本数量
    if (versions.length > this.maxVersionsPerContent) {
      versions.shift(); // 移除最早的版本
    }
    
    this.versionHistory.set(version.contentId, versions);
  }

  trackChanges(contentId, version, contentData) {
    if (!this.changeTrackers.has(contentId)) {
      this.changeTrackers.set(contentId, {
        contentId,
        changes: [],
        createdAt: new Date().toISOString()
      });
    }
    
    const tracker = this.changeTrackers.get(contentId);
    const change = {
      changeId: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      versionId: version.versionId,
      versionNumber: version.versionNumber,
      author: version.author,
      changeDescription: version.changeDescription,
      timestamp: version.timestamp,
      fieldChanges: this.detectFieldChanges(contentData)
    };
    
    tracker.changes.push(change);
    
    // 限制变更记录数量
    if (tracker.changes.length > 100) {
      tracker.changes.shift();
    }
  }

  detectFieldChanges(contentData) {
    // 简单的字段变更检测
    const changes = [];
    
    if (contentData.title) {
      changes.push({
        field: 'title',
        type: 'modified'
      });
    }
    
    if (contentData.content) {
      changes.push({
        field: 'content',
        type: 'modified'
      });
    }
    
    return changes;
  }

  generateChangeDescription(contentData) {
    const changes = [];
    
    if (contentData.title) changes.push('标题');
    if (contentData.content) changes.push('内容');
    if (contentData.tags) changes.push('标签');
    
    return changes.length > 0 
      ? `修改了${changes.join('、')}` 
      : '内容更新';
  }

  calculateDifferences(content1, content2) {
    const differences = [];
    
    // 比较标题
    if (content1.title !== content2.title) {
      differences.push({
        field: 'title',
        oldValue: content1.title,
        newValue: content2.title,
        type: 'modified'
      });
    }
    
    // 比较内容
    if (content1.content !== content2.content) {
      differences.push({
        field: 'content',
        oldValue: content1.content,
        newValue: content2.content,
        type: 'modified'
      });
    }
    
    // 比较标签
    const tags1 = content1.tags || [];
    const tags2 = content2.tags || [];
    if (JSON.stringify(tags1) !== JSON.stringify(tags2)) {
      differences.push({
        field: 'tags',
        oldValue: tags1,
        newValue: tags2,
        type: 'modified'
      });
    }
    
    return differences;
  }

  /**
   * 获取系统统计
   */
  getSystemStats() {
    let totalVersions = 0;
    let totalContents = 0;
    let totalChanges = 0;
    
    for (const versions of this.versionHistory.values()) {
      totalVersions += versions.length;
      totalContents += 1;
    }
    
    for (const tracker of this.changeTrackers.values()) {
      totalChanges += tracker.changes.length;
    }
    
    return {
      totalContents,
      totalVersions,
      totalChanges,
      averageVersionsPerContent: totalContents > 0 ? (totalVersions / totalContents).toFixed(2) : 0
    };
  }

  /**
   * 导出版本历史
   */
  exportVersionHistory(contentId) {
    const versions = this.versionHistory.get(contentId) || [];
    const tracker = this.changeTrackers.get(contentId);
    
    return {
      contentId,
      versions: versions.map(v => ({
        versionId: v.versionId,
        versionNumber: v.versionNumber,
        author: v.author,
        changeDescription: v.changeDescription,
        timestamp: v.timestamp,
        size: v.size
      })),
      changes: tracker ? tracker.changes : [],
      exportTime: new Date().toISOString()
    };
  }
}

module.exports = new ContentVersioningService();