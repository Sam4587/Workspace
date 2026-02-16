# 监控告警体系规范

## 📅 文档版本
**版本**: 1.0  
**最后更新**: 2026年2月16日  
**作者**: AI开发团队

## 🎯 目标
建立完善的系统监控和告警机制，实现服务健康状态实时监控、异常自动告警和性能指标跟踪。

## 📋 监控维度

### 1. 基础设施监控
```
- CPU使用率
- 内存使用率
- 磁盘空间使用
- 网络IO流量
- 系统负载
```

### 2. 应用服务监控
```
- 服务可用性（心跳检测）
- 响应时间（RTT）
- 请求成功率
- 并发连接数
- 错误率统计
```

### 3. 业务指标监控
```
- API调用次数
- 用户活跃度
- 数据处理量
- 任务执行状态
- 缓存命中率
```

### 4. 资源监控
```
- 数据库连接池
- Redis内存使用
- 文件句柄数量
- 线程池状态
```

## 🚨 告警级别定义

### Critical（严重）
- 服务完全不可用
- 数据库连接失败
- 核心功能异常
- 系统资源耗尽

### High（高）
- 服务响应时间超过阈值
- 错误率超过5%
- 关键API失败率高
- 资源使用率超过80%

### Medium（中）
- 性能下降明显
- 非核心功能异常
- 资源使用率超过60%
- 重复性错误增加

### Low（低）
- 轻微性能波动
- 个别请求超时
- 警告级别日志增加

## 🔧 监控实现方案

### 1. 健康检查端点
```javascript
// server/routes/health.js
const express = require('express');
const router = express.Router();
const os = require('os');
const process = require('process');

router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: os.totalmem(),
      free: os.freemem()
    },
    cpu: os.loadavg(),
    disk: getDiskUsage() // 需要实现
  };
  
  res.status(200).json(healthCheck);
});

router.get('/health/database', async (req, res) => {
  try {
    // 检查数据库连接
    await checkDatabaseConnection();
    res.status(200).json({ status: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'disconnected', error: error.message });
  }
});

module.exports = router;
```

### 2. 性能监控中间件
```javascript
// server/middleware/metricsMiddleware.js
class MetricsCollector {
  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimes: [],
      activeConnections: 0
    };
  }

  collectRequestMetrics(req, res, next) {
    const startTime = Date.now();
    this.metrics.requestCount++;
    this.metrics.activeConnections++;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.metrics.responseTimes.push(duration);
      this.metrics.activeConnections--;
      
      if (res.statusCode >= 400) {
        this.metrics.errorCount++;
      }
    });

    next();
  }

  getMetrics() {
    const responseTimes = this.metrics.responseTimes;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b) / responseTimes.length 
      : 0;

    return {
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      errorRate: this.metrics.requestCount > 0 
        ? (this.metrics.errorCount / this.metrics.requestCount * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      activeConnections: this.metrics.activeConnections,
      timestamp: new Date().toISOString()
    };
  }
}

const metricsCollector = new MetricsCollector();
module.exports = { metricsCollector };
```

### 3. 告警通知服务
```javascript
// server/services/alertService.js
class AlertService {
  constructor() {
    this.alerts = [];
    this.notificationChannels = {
      email: require('./notifications/emailNotifier'),
      webhook: require('./notifications/webhookNotifier'),
      slack: require('./notifications/slackNotifier')
    };
  }

  async checkThresholds(metrics) {
    const alerts = [];

    // 响应时间告警
    if (metrics.avgResponseTime > 2000) {
      alerts.push({
        level: 'high',
        message: `平均响应时间过高: ${metrics.avgResponseTime}`,
        metric: 'response_time',
        value: metrics.avgResponseTime
      });
    }

    // 错误率告警
    if (parseFloat(metrics.errorRate) > 5) {
      alerts.push({
        level: 'high',
        message: `错误率过高: ${metrics.errorRate}`,
        metric: 'error_rate',
        value: metrics.errorRate
      });
    }

    // 发送告警
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  async sendAlert(alert) {
    this.alerts.push({
      ...alert,
      timestamp: new Date().toISOString(),
      sent: false
    });

    // 通过多个渠道发送告警
    try {
      await Promise.all([
        this.notificationChannels.email.send(alert),
        this.notificationChannels.webhook.send(alert),
        this.notificationChannels.slack.send(alert)
      ]);
      
      // 标记为已发送
      this.alerts[this.alerts.length - 1].sent = true;
    } catch (error) {
      console.error('告警发送失败:', error);
    }
  }

  getRecentAlerts(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => new Date(alert.timestamp) > cutoff);
  }
}

module.exports = new AlertService();
```

## 📊 监控面板设计

### 1. 实时监控面板
```
┌─────────────────────────────────────────────┐
│           系统监控面板                       │
├─────────────────────────────────────────────┤
│ CPU: 25%    内存: 45%    磁盘: 60%          │
│ 请求量: 1,234  错误率: 0.5%  RTT: 45ms      │
│ 活跃连接: 23  数据库: ✓  Redis: ✓           │
└─────────────────────────────────────────────┘
```

### 2. 告警历史面板
```
┌─────────────────────────────────────────────┐
│           最近告警                          │
├─────────────────────────────────────────────┤
│ ⚠️  [HIGH] 响应时间过高 (2.3s)  15:30       │
│ ❌  [CRITICAL] 数据库连接失败  14:45        │
│ ⚠️  [MEDIUM] 内存使用率 75%    14:20        │
└─────────────────────────────────────────────┘
```

## 🚀 实施步骤

### 1. 基础监控实现
```bash
# 创建监控相关目录
mkdir -p server/{routes,middleware,services}/monitoring
mkdir -p server/services/notifications
```

### 2. 集成到主服务
```javascript
// server/server.js
const healthRoutes = require('./routes/health');
const { metricsCollector } = require('./middleware/metricsMiddleware');
const alertService = require('./services/alertService');

// 添加监控路由
app.use('/api/monitoring', healthRoutes);

// 添加指标收集中间件
app.use(metricsCollector.collectRequestMetrics);

// 定期检查指标并发送告警
setInterval(async () => {
  const metrics = metricsCollector.getMetrics();
  await alertService.checkThresholds(metrics);
}, 60000); // 每分钟检查一次
```

### 3. 配置告警阈值
```javascript
// server/config/monitoring.js
module.exports = {
  thresholds: {
    responseTime: {
      critical: 5000,  // 5秒
      high: 2000,      // 2秒
      medium: 1000     // 1秒
    },
    errorRate: {
      critical: 20,    // 20%
      high: 5,         // 5%
      medium: 1        // 1%
    },
    memoryUsage: {
      critical: 90,    // 90%
      high: 80,        // 80%
      medium: 70       // 70%
    }
  },
  
  checkIntervals: {
    health: 30000,    // 30秒
    metrics: 60000,   // 1分钟
    alerts: 300000    // 5分钟
  }
};
```

## ✅ 验证清单

### 功能验证
- [ ] 健康检查端点正常响应
- [ ] 性能指标正确收集
- [ ] 告警阈值检测准确
- [ ] 多渠道告警发送正常
- [ ] 监控数据持久化

### 性能验证
- [ ] 监控本身不影响主服务性能
- [ ] 指标收集开销在可接受范围内
- [ ] 告警发送不会造成服务阻塞

### 可靠性验证
- [ ] 监控服务具备故障自愈能力
- [ ] 告警去重和抑制机制有效
- [ ] 监控数据备份和恢复机制完善

## 📚 相关文档

- [环境变量标准化](ENVIRONMENT_VARIABLES_STANDARD.md)
- [日志系统标准化](LOGGING_SYSTEM_STANDARD.md)
- [标准化端口配置](STANDARD_PORT_CONFIGURATION.md)

---
**维护者**: AI开发团队  
**联系方式**: dev-team@example.com