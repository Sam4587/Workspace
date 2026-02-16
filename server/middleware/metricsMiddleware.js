/**
 * 性能指标收集中间件
 * 收集请求响应时间、错误率、吞吐量等关键性能指标
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      responseTimes: [],
      activeConnections: 0,
      statusCodeCounts: {},
      endpointMetrics: {}
    };
    
    // 定期清理历史数据，保持最近1000个数据点
    setInterval(() => {
      this.cleanupHistoricalData();
    }, 300000); // 每5分钟清理一次
  }

  /**
   * Express中间件函数
   */
  collectRequestMetrics = (req, res, next) => {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    // 增加请求数和活跃连接数
    this.metrics.requestCount++;
    this.metrics.activeConnections++;
    
    // 初始化端点指标
    if (!this.metrics.endpointMetrics[endpoint]) {
      this.metrics.endpointMetrics[endpoint] = {
        count: 0,
        totalResponseTime: 0,
        errorCount: 0,
        statusCodeCounts: {}
      };
    }
    
    // 监听响应结束事件
    const originalSend = res.send;
    res.send = (body) => {
      const duration = Date.now() - startTime;
      
      // 更新总体指标
      this.metrics.totalResponseTime += duration;
      this.metrics.responseTimes.push(duration);
      
      // 更新端点指标
      const endpointMetrics = this.metrics.endpointMetrics[endpoint];
      endpointMetrics.count++;
      endpointMetrics.totalResponseTime += duration;
      
      // 统计状态码
      const statusCode = res.statusCode;
      this.metrics.statusCodeCounts[statusCode] = 
        (this.metrics.statusCodeCounts[statusCode] || 0) + 1;
      endpointMetrics.statusCodeCounts[statusCode] = 
        (endpointMetrics.statusCodeCounts[statusCode] || 0) + 1;
      
      // 统计错误
      if (statusCode >= 400) {
        this.metrics.errorCount++;
        endpointMetrics.errorCount++;
      }
      
      return originalSend.call(res, body);
    };
    
    // 监听响应完成事件
    res.on('finish', () => {
      this.metrics.activeConnections--;
    });
    
    // 监听响应错误事件
    res.on('error', (error) => {
      this.metrics.errorCount++;
      this.metrics.endpointMetrics[endpoint].errorCount++;
    });
    
    next();
  };

  /**
   * 获取总体性能指标
   */
  getOverallMetrics() {
    const totalRequests = this.metrics.requestCount;
    const totalErrors = this.metrics.errorCount;
    const responseTimes = this.metrics.responseTimes;
    
    return {
      timestamp: new Date().toISOString(),
      requestCount: totalRequests,
      errorCount: totalErrors,
      activeConnections: this.metrics.activeConnections,
      errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: responseTimes.length > 0 
        ? (this.metrics.totalResponseTime / responseTimes.length).toFixed(2) + 'ms'
        : '0ms',
      statusCodeDistribution: { ...this.metrics.statusCodeCounts }
    };
  }

  /**
   * 获取端点级别的性能指标
   */
  getEndpointMetrics() {
    const endpointData = {};
    
    for (const [endpoint, metrics] of Object.entries(this.metrics.endpointMetrics)) {
      const avgResponseTime = metrics.count > 0 
        ? (metrics.totalResponseTime / metrics.count).toFixed(2) + 'ms'
        : '0ms';
      
      const errorRate = metrics.count > 0 
        ? ((metrics.errorCount / metrics.count) * 100).toFixed(2) + '%'
        : '0%';
      
      endpointData[endpoint] = {
        requestCount: metrics.count,
        errorCount: metrics.errorCount,
        avgResponseTime,
        errorRate,
        statusCodeDistribution: { ...metrics.statusCodeCounts }
      };
    }
    
    return {
      timestamp: new Date().toISOString(),
      endpoints: endpointData
    };
  }

  /**
   * 获取百分位响应时间
   */
  getPercentileMetrics(percentiles = [50, 90, 95, 99]) {
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const result = {};
    
    percentiles.forEach(p => {
      const index = Math.floor((p / 100) * sortedTimes.length);
      result[`p${p}`] = sortedTimes[index] 
        ? sortedTimes[index].toFixed(2) + 'ms'
        : '0ms';
    });
    
    return {
      timestamp: new Date().toISOString(),
      percentiles: result
    };
  }

  /**
   * 重置指标（用于测试或特定场景）
   */
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      responseTimes: [],
      activeConnections: 0,
      statusCodeCounts: {},
      endpointMetrics: {}
    };
  }

  /**
   * 清理历史数据，保持性能
   */
  cleanupHistoricalData() {
    // 保持最近1000个响应时间数据点
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
    
    // 重置累计计数器，避免数值过大
    if (this.metrics.requestCount > 1000000) {
      this.metrics.requestCount = 0;
      this.metrics.errorCount = 0;
      this.metrics.totalResponseTime = 0;
    }
  }

  /**
   * 获取系统负载指标
   */
  getSystemLoadMetrics() {
    const os = require('os');
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      uptime: os.uptime()
    };
  }
}

// 创建单例实例
const metricsCollector = new MetricsCollector();

module.exports = { metricsCollector };