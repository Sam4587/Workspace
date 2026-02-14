const RateLimiterRedis = require('rate-limiter-flexible');
const Redis = require('redis');

class RateLimiter {
  constructor() {
    this.redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    // API请求限流
    this.apiLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'api_limit',
      points: 100, // 100次请求
      duration: 60, // 每分钟
      blockDuration: 60 * 5 // 超出限制后封禁5分钟
    });
    
    // 热点抓取限流
    this.scrapeLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'scrape_limit',
      points: 30, // 30次请求
      duration: 60, // 每分钟
      blockDuration: 60 * 10 // 超出限制后封禁10分钟
    });
    
    // IP防封策略
    this.ipLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'ip_limit',
      points: 1000, // 1000次请求
      duration: 3600, // 每小时
      blockDuration: 3600 * 2 // 超出限制后封禁2小时
    });
  }
  
  // API请求限流中间件
  async apiLimit(req, res, next) {
    try {
      const key = req.ip;
      await this.apiLimiter.consume(key);
      next();
    } catch (rejRes) {
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1
      });
    }
  }
  
  // 热点抓取限流
  async scrapeLimit(source) {
    try {
      await this.scrapeLimiter.consume(source);
      return true;
    } catch (rejRes) {
      throw new Error(`抓取频率过高，请等待 ${Math.round(rejRes.msBeforeNext / 1000)} 秒后重试`);
    }
  }
  
  // IP防封检查
  async checkIP(ip) {
    try {
      await this.ipLimiter.consume(ip);
      return true;
    } catch (rejRes) {
      throw new Error(`IP访问频率过高，已被临时封禁`);
    }
  }
  
  // 获取限流状态
  async getLimitStatus(key) {
    const apiStatus = await this.apiLimiter.get(key);
    const ipStatus = await this.ipLimiter.get(key);
    
    return {
      api: {
        remaining: apiStatus?.remainingPoints || 0,
        resetTime: apiStatus?.msBeforeNext || 0
      },
      ip: {
        remaining: ipStatus?.remainingPoints || 0,
        resetTime: ipStatus?.msBeforeNext || 0
      }
    };
  }
}

module.exports = new RateLimiter();
