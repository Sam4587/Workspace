/**
 * 告警服务
 * 监控系统指标并在超出阈值时发送告警通知
 */

const enhancedLogger = require('../utils/enhancedLogger');

class AlertService {
  constructor() {
    this.alerts = [];
    this.alertHistory = [];
    this.thresholds = {
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
      },
      activeConnections: {
        critical: 1000,  // 1000个连接
        high: 500,       // 500个连接
        medium: 200      // 200个连接
      }
    };
    
    this.notificationChannels = {
      console: this.consoleNotifier.bind(this),
      // 后续可以添加email、webhook、slack等通知渠道
    };
    
    this.suppressedAlerts = new Set(); // 防止告警轰炸
  }

  /**
   * 检查各项指标并触发相应告警
   */
  async checkMetrics(metrics, systemMetrics) {
    const newAlerts = [];
    
    // 检查响应时间
    const avgResponseTime = parseFloat(metrics.avgResponseTime);
    if (avgResponseTime > this.thresholds.responseTime.critical) {
      newAlerts.push(this.createAlert('critical', 'RESPONSE_TIME_CRITICAL', 
        `平均响应时间严重超标: ${avgResponseTime}ms > ${this.thresholds.responseTime.critical}ms`, 
        { metric: 'responseTime', value: avgResponseTime }));
    } else if (avgResponseTime > this.thresholds.responseTime.high) {
      newAlerts.push(this.createAlert('high', 'RESPONSE_TIME_HIGH',
        `平均响应时间偏高: ${avgResponseTime}ms > ${this.thresholds.responseTime.high}ms`,
        { metric: 'responseTime', value: avgResponseTime }));
    }
    
    // 检查错误率
    const errorRate = parseFloat(metrics.errorRate);
    if (errorRate > this.thresholds.errorRate.critical) {
      newAlerts.push(this.createAlert('critical', 'ERROR_RATE_CRITICAL',
        `错误率严重超标: ${errorRate}% > ${this.thresholds.errorRate.critical}%`,
        { metric: 'errorRate', value: errorRate }));
    } else if (errorRate > this.thresholds.errorRate.high) {
      newAlerts.push(this.createAlert('high', 'ERROR_RATE_HIGH',
        `错误率偏高: ${errorRate}% > ${this.thresholds.errorRate.high}%`,
        { metric: 'errorRate', value: errorRate }));
    }
    
    // 检查内存使用率
    if (systemMetrics && systemMetrics.memory) {
      const memoryUsage = parseFloat(systemMetrics.memory.percentage);
      if (memoryUsage > this.thresholds.memoryUsage.critical) {
        newAlerts.push(this.createAlert('critical', 'MEMORY_USAGE_CRITICAL',
          `内存使用率严重超标: ${memoryUsage}% > ${this.thresholds.memoryUsage.critical}%`,
          { metric: 'memoryUsage', value: memoryUsage }));
      } else if (memoryUsage > this.thresholds.memoryUsage.high) {
        newAlerts.push(this.createAlert('high', 'MEMORY_USAGE_HIGH',
          `内存使用率偏高: ${memoryUsage}% > ${this.thresholds.memoryUsage.high}%`,
          { metric: 'memoryUsage', value: memoryUsage }));
      }
    }
    
    // 检查活跃连接数
    const activeConnections = metrics.activeConnections;
    if (activeConnections > this.thresholds.activeConnections.critical) {
      newAlerts.push(this.createAlert('critical', 'ACTIVE_CONNECTIONS_CRITICAL',
        `活跃连接数严重超标: ${activeConnections} > ${this.thresholds.activeConnections.critical}`,
        { metric: 'activeConnections', value: activeConnections }));
    } else if (activeConnections > this.thresholds.activeConnections.high) {
      newAlerts.push(this.createAlert('high', 'ACTIVE_CONNECTIONS_HIGH',
        `活跃连接数偏高: ${activeConnections} > ${this.thresholds.activeConnections.high}`,
        { metric: 'activeConnections', value: activeConnections }));
    }
    
    // 发送新告警
    for (const alert of newAlerts) {
      await this.sendAlert(alert);
    }
    
    return newAlerts;
  }

  /**
   * 创建告警对象
   */
  createAlert(level, type, message, details = {}) {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };
  }

  /**
   * 发送告警通知
   */
  async sendAlert(alert) {
    // 检查是否需要抑制该告警
    if (this.shouldSuppressAlert(alert)) {
      enhancedLogger.debug('告警被抑制', { alertId: alert.id, type: alert.type });
      return;
    }
    
    // 记录告警
    this.alerts.push(alert);
    this.alertHistory.push({
      ...alert,
      sent: true
    });
    
    // 通过所有通知渠道发送
    const channels = Object.values(this.notificationChannels);
    const sendPromises = channels.map(channel => 
      channel(alert).catch(error => {
        enhancedLogger.error('告警发送失败', { 
          alertId: alert.id, 
          error: error.message 
        });
      })
    );
    
    await Promise.all(sendPromises);
    
    // 记录日志
    enhancedLogger[alert.level === 'critical' ? 'error' : 'warn'](
      '告警触发', 
      { 
        alertId: alert.id,
        level: alert.level,
        type: alert.type,
        message: alert.message
      }
    );
    
    // 添加到抑制列表（防止短时间内重复告警）
    this.suppressAlert(alert);
  }

  /**
   * 控制台通知器
   */
  async consoleNotifier(alert) {
    const levelColors = {
      critical: '\x1b[31m', // 红色
      high: '\x1b[33m',     // 黄色
      medium: '\x1b[36m',   // 青色
      low: '\x1b[37m'       // 白色
    };
    
    const resetColor = '\x1b[0m';
    const color = levelColors[alert.level] || resetColor;
    
    console.log(`${color}🚨 [${alert.level.toUpperCase()}] ${alert.message}${resetColor}`);
    console.log(`${color}   时间: ${alert.timestamp}${resetColor}`);
    console.log(`${color}   ID: ${alert.id}${resetColor}`);
    
    if (Object.keys(alert.details).length > 0) {
      console.log(`${color}   详情: ${JSON.stringify(alert.details)}${resetColor}`);
    }
    console.log('');
  }

  /**
   * 检查是否应该抑制告警
   */
  shouldSuppressAlert(alert) {
    const suppressKey = `${alert.type}_${alert.level}`;
    return this.suppressedAlerts.has(suppressKey);
  }

  /**
   * 抑制告警（防止告警轰炸）
   */
  suppressAlert(alert) {
    const suppressKey = `${alert.type}_${alert.level}`;
    this.suppressedAlerts.add(suppressKey);
    
    // 5分钟后解除抑制
    setTimeout(() => {
      this.suppressedAlerts.delete(suppressKey);
    }, 300000);
  }

  /**
   * 获取当前活跃告警
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * 获取告警历史
   */
  getAlertHistory(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alertHistory.filter(alert => new Date(alert.timestamp) > cutoff);
  }

  /**
   * 确认告警
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      enhancedLogger.info('告警已确认', { alertId });
    }
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId) {
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1) {
      const alert = this.alerts[alertIndex];
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      
      // 从活跃告警列表中移除
      this.alerts.splice(alertIndex, 1);
      
      enhancedLogger.info('告警已解决', { alertId });
    }
  }

  /**
   * 获取告警统计信息
   */
  getAlertStats() {
    const activeAlerts = this.getActiveAlerts();
    const stats = {
      total: this.alertHistory.length,
      active: activeAlerts.length,
      byLevel: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {}
    };
    
    // 统计各级别告警数量
    activeAlerts.forEach(alert => {
      stats.byLevel[alert.level]++;
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * 清理过期的历史告警
   */
  cleanupOldAlerts(days = 7) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const initialLength = this.alertHistory.length;
    
    this.alertHistory = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) > cutoff
    );
    
    enhancedLogger.info('清理过期告警', { 
      cleaned: initialLength - this.alertHistory.length,
      remaining: this.alertHistory.length
    });
  }
}

// 创建单例实例
const alertService = new AlertService();

// 定期清理过期告警
setInterval(() => {
  alertService.cleanupOldAlerts();
}, 24 * 60 * 60 * 1000); // 每24小时清理一次

module.exports = alertService;