/**
 * 令牌管理服务
 * 负责JWT访问令牌和刷新令牌的生成、验证、撤销等操作
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class TokenService {
  constructor() {
    this.refreshTokens = new Map(); // 内存存储刷新令牌
    this.blacklistedTokens = new Set(); // 黑名单存储已撤销的访问令牌
    
    // 启动定时清理任务
    this.startCleanupTask();
  }
  
  /**
   * 启动定时清理任务
   */
  startCleanupTask() {
    // 每小时清理一次过期令牌
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000); // 1小时
    
    // 立即执行一次清理
    setTimeout(() => {
      this.cleanupExpiredTokens();
    }, 10000); // 10秒后执行
  }

  /**
   * 生成访问令牌和刷新令牌
   * @param {Object} payload - JWT载荷数据
   * @param {string} userId - 用户ID
   * @returns {Object} 包含access_token和refresh_token的对象
   */
  generateTokens(payload, userId) {
    // 从环境变量获取配置
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES || '24h';
    const refreshTokenDays = parseInt(process.env.JWT_REFRESH_TOKEN_DAYS) || 7;
    
    // 生成访问令牌
    const accessToken = jwt.sign(
      { ...payload, type: 'access', iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiry }
    );

    // 生成刷新令牌
    const refreshToken = uuidv4();
    const refreshTokenExpiry = Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000;

    // 存储刷新令牌信息
    this.refreshTokens.set(refreshToken, {
      userId,
      payload,
      expiry: refreshTokenExpiry,
      createdAt: Date.now(),
      userAgent: payload.userAgent || 'unknown'
    });

    console.log(`[TokenService] 为用户 ${userId} 生成新的令牌对`);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.parseExpiryTime(accessTokenExpiry)
    };
  }

  /**
   * 解析过期时间字符串为秒数
   * @param {string} timeStr - 时间字符串 (如 '24h', '7d', '30m')
   * @returns {number} 秒数
   */
  parseExpiryTime(timeStr) {
    const match = timeStr.match(/^([0-9]+)([smhd])$/);
    if (!match) return 24 * 60 * 60; // 默认24小时
    
    const [, num, unit] = match;
    const number = parseInt(num);
    
    switch (unit) {
      case 's': return number;
      case 'm': return number * 60;
      case 'h': return number * 60 * 60;
      case 'd': return number * 24 * 60 * 60;
      default: return 24 * 60 * 60;
    }
  }
  
  /**
   * 使用刷新令牌获取新的访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Object|null} 新的令牌对象或null
   */
  refreshAccessToken(refreshToken) {
    const tokenData = this.refreshTokens.get(refreshToken);

    // 检查刷新令牌是否存在
    if (!tokenData) {
      console.warn(`[TokenService] 刷新令牌不存在: ${refreshToken.substring(0, 10)}...`);
      return null;
    }

    // 检查是否过期
    if (tokenData.expiry < Date.now()) {
      console.warn(`[TokenService] 刷新令牌已过期: ${refreshToken.substring(0, 10)}...`);
      this.revokeRefreshToken(refreshToken);
      return null;
    }

    // 生成新的访问令牌
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES || '24h';
    const newAccessToken = jwt.sign(
      { ...tokenData.payload, type: 'access', iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: accessTokenExpiry }
    );

    console.log(`[TokenService] 为用户 ${tokenData.userId} 刷新访问令牌`);
    
    return {
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: this.parseExpiryTime(accessTokenExpiry)
    };
  }

  /**
   * 验证访问令牌
   * @param {string} token - JWT访问令牌
   * @returns {Object|null} 解码后的载荷或null
   */
  verifyAccessToken(token) {
    // 检查是否在黑名单中
    if (this.blacklistedTokens.has(token)) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 验证令牌类型
      if (decoded.type !== 'access') {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * 撤销访问令牌（加入黑名单）
   * @param {string} token - 要撤销的访问令牌
   */
  revokeAccessToken(token) {
    this.blacklistedTokens.add(token);
  }

  /**
   * 撤销刷新令牌
   * @param {string} refreshToken - 要撤销的刷新令牌
   */
  revokeRefreshToken(refreshToken) {
    this.refreshTokens.delete(refreshToken);
  }

  /**
   * 撤销用户的所有令牌
   * @param {string} userId - 用户ID
   */
  revokeAllUserTokens(userId) {
    // 撤销所有该用户的刷新令牌
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }

  /**
   * 清理过期的刷新令牌
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.expiry < now) {
        this.refreshTokens.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[TokenService] 清理了 ${cleanedCount} 个过期的刷新令牌`);
    }
  }

  /**
   * 获取令牌统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      activeRefreshTokens: this.refreshTokens.size,
      blacklistedAccessTokens: this.blacklistedTokens.size
    };
  }
}

// 导出单例实例
module.exports = new TokenService();