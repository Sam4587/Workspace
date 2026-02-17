/**
 * 多平台管理器
 * 统一管理所有内容发布平台
 */

class PlatformManager {
  constructor() {
    this.platforms = new Map();
    this.initialized = false;
  }

  /**
   * 注册平台
   */
  registerPlatform(platformId, platformInstance) {
    if (this.platforms.has(platformId)) {
      console.warn(`平台 ${platformId} 已注册，将被覆盖`);
    }
    this.platforms.set(platformId, platformInstance);
    console.log(`✅ 平台注册成功: ${platformId}`);
  }

  /**
   * 获取平台实例
   */
  getPlatform(platformId) {
    if (!this.platforms.has(platformId)) {
      throw new Error(`平台 ${platformId} 未注册`);
    }
    return this.platforms.get(platformId);
  }

  /**
   * 列出所有平台
   */
  listPlatforms() {
    return Array.from(this.platforms.keys());
  }

  /**
   * 获取平台信息
   */
  getPlatformInfo(platformId) {
    const platform = this.getPlatform(platformId);
    return {
      id: platform.id,
      name: platform.name,
      features: platform.features || [],
      loginRequired: platform.loginRequired !== false
    };
  }

  /**
   * 执行平台登录
   */
  async login(platformId, options = {}) {
    const platform = this.getPlatform(platformId);
    if (!platform.login) {
      throw new Error(`平台 ${platformId} 不支持登录功能`);
    }
    return await platform.login(options);
  }

  /**
   * 检查登录状态
   */
  async checkLogin(platformId) {
    const platform = this.getPlatform(platformId);
    if (!platform.checkLogin) {
      return { isLoggedIn: false, message: '平台不支持登录检查' };
    }
    return await platform.checkLogin();
  }

  /**
   * 发布内容
   */
  async publish(platformId, content, options = {}) {
    const platform = this.getPlatform(platformId);
    if (!platform.publish) {
      throw new Error(`平台 ${platformId} 不支持发布功能`);
    }
    
    console.log(`🚀 开始发布到 ${platformId}...`);
    
    try {
      const result = await platform.publish(content, options);
      console.log(`✅ 发布成功: ${platformId}`);
      return {
        success: true,
        platform: platformId,
        data: result
      };
    } catch (error) {
      console.error(`❌ 发布失败: ${platformId}`, error.message);
      return {
        success: false,
        platform: platformId,
        error: error.message
      };
    }
  }

  /**
   * 批量发布到多个平台
   */
  async publishToMany(platformIds, content, options = {}) {
    const results = [];
    
    for (const platformId of platformIds) {
      try {
        const result = await this.publish(platformId, content, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          platform: platformId,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

// 单例模式
const platformManager = new PlatformManager();

module.exports = {
  PlatformManager,
  platformManager
};
