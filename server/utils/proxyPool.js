const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const NodeCache = require('node-cache');

class ProxyPool {
  constructor() {
    this.proxyCache = new NodeCache({ stdTTL: 300 }); // 5分钟缓存
    this.proxyList = [
      // 这里可以配置代理服务器列表
      // 'http://username:password@proxy1.example.com:8080',
      // 'http://username:password@proxy2.example.com:8080',
    ];
    this.currentProxyIndex = 0;
    this.failedProxies = new Set();
  }
  
  // 获取下一个可用代理
  getNextProxy() {
    if (this.proxyList.length === 0) {
      return null;
    }
    
    let attempts = 0;
    while (attempts < this.proxyList.length) {
      const proxy = this.proxyList[this.currentProxyIndex];
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
      
      if (!this.failedProxies.has(proxy)) {
        return proxy;
      }
      attempts++;
    }
    
    // 如果所有代理都失败了，清除失败记录并重试
    this.failedProxies.clear();
    return this.proxyList[this.currentProxyIndex];
  }
  
  // 标记代理失败
  markProxyFailed(proxy) {
    this.failedProxies.add(proxy);
    console.log(`代理 ${proxy} 标记为失败`);
  }
  
  // 创建带代理的axios实例
  createAxiosWithProxy(url) {
    const proxy = this.getNextProxy();
    
    if (!proxy) {
      return null; // 不使用代理
    }
    
    const agent = url.startsWith('https') 
      ? new HttpsProxyAgent(proxy)
      : new HttpProxyAgent(proxy);
    
    return {
      proxy,
      agent
    };
  }
  
  // 获取随机User-Agent
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
  
  // 获取随机延迟时间
  getRandomDelay(min = 1000, max = 5000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = new ProxyPool();
