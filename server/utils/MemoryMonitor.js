const os = require('os');
const v8 = require('v8');
const logger = require('./logger');

class MemoryMonitor {
  constructor(options = {}) {
    this.warningThreshold = options.warningThreshold || 0.7;
    this.criticalThreshold = options.criticalThreshold || 0.85;
    this.maxHeapMB = options.maxHeapMB || parseInt(process.env.MAX_MEMORY_MB) || 1024;
    this.checkInterval = options.checkInterval || 30000;
    this.historySize = options.historySize || 60;
    this.history = [];
    this.alertCallbacks = [];
    this.isMonitoring = false;
    this.lastAlertTime = 0;
    this.alertCooldown = options.alertCooldown || 5 * 60 * 1000;
  }

  start() {
    if (this.isMonitoring) {
      logger.warn('[MemoryMonitor] 监控已在运行');
      return;
    }

    this.isMonitoring = true;
    this.interval = setInterval(() => this.check(), this.checkInterval);
    this.interval.unref();
    logger.info('[MemoryMonitor] 内存监控已启动', {
      checkInterval: this.checkInterval / 1000 + 's',
      warningThreshold: (this.warningThreshold * 100).toFixed(0) + '%',
      criticalThreshold: (this.criticalThreshold * 100).toFixed(0) + '%',
      maxHeapMB: this.maxHeapMB + 'MB',
    });
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isMonitoring = false;
    logger.info('[MemoryMonitor] 内存监控已停止');
  }

  check() {
    const snapshot = this.takeSnapshot();
    this.history.push(snapshot);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }

    const heapRatio = snapshot.heapUsedMB / this.maxHeapMB;
    const systemMemoryRatio = snapshot.systemMemory.used / snapshot.systemMemory.total;

    if (heapRatio > this.criticalThreshold) {
      this.triggerAlert('critical', snapshot, heapRatio);
    } else if (heapRatio > this.warningThreshold) {
      this.triggerAlert('warning', snapshot, heapRatio);
    }

    return snapshot;
  }

  takeSnapshot() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    return {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      process: {
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: (memUsage.rss / 1024 / 1024).toFixed(2),
        externalMB: (memUsage.external / 1024 / 1024).toFixed(2),
        arrayBuffersMB: (memUsage.arrayBuffers / 1024 / 1024).toFixed(2),
      },
      heap: {
        totalHeapSizeMB: (heapStats.total_heap_size / 1024 / 1024).toFixed(2),
        totalExecutableSizeMB: (heapStats.total_executable_size / 1024 / 1024).toFixed(2),
        totalPhysicalSizeMB: (heapStats.total_physical_size / 1024 / 1024).toFixed(2),
        usedHeapSizeMB: (heapStats.used_heap_size / 1024 / 1024).toFixed(2),
        heapSizeLimitMB: (heapStats.heap_size_limit / 1024 / 1024).toFixed(2),
        mallocedMemoryMB: (heapStats.malloced_memory / 1024 / 1024).toFixed(2),
      },
      systemMemory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      uptime: {
        process: process.uptime(),
        system: os.uptime(),
      },
    };
  }

  triggerAlert(level, snapshot, heapRatio) {
    const now = Date.now();
    if (now - this.lastAlertTime < this.alertCooldown) {
      return;
    }

    this.lastAlertTime = now;

    const alertData = {
      level,
      timestamp: snapshot.timestamp,
      heapUsedMB: snapshot.process.heapUsedMB,
      heapRatio: (heapRatio * 100).toFixed(2) + '%',
      maxHeapMB: this.maxHeapMB,
      systemMemoryUsage: snapshot.systemMemory.usagePercent + '%',
      message: level === 'critical' 
        ? `内存严重警告: 堆内存使用 ${snapshot.process.heapUsedMB}MB (${(heapRatio * 100).toFixed(1)}%)`
        : `内存警告: 堆内存使用 ${snapshot.process.heapUsedMB}MB (${(heapRatio * 100).toFixed(1)}%)`,
    };

    if (level === 'critical') {
      logger.error('[MemoryMonitor]', alertData.message, alertData);
    } else {
      logger.warn('[MemoryMonitor]', alertData.message, alertData);
    }

    for (const callback of this.alertCallbacks) {
      try {
        callback(alertData);
      } catch (err) {
        logger.error('[MemoryMonitor] 告警回调执行失败', { error: err.message });
      }
    }
  }

  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  removeAlert(callback) {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  getStats() {
    const current = this.history[this.history.length - 1];
    if (!current) {
      return this.takeSnapshot();
    }
    return current;
  }

  getHistory() {
    return [...this.history];
  }

  getTrend() {
    if (this.history.length < 2) {
      return { trend: 'unknown', change: 0 };
    }

    const recent = this.history.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const change = last.process.heapUsedMB - first.process.heapUsedMB;

    let trend = 'stable';
    if (change > 50) trend = 'increasing';
    else if (change < -50) trend = 'decreasing';

    return {
      trend,
      change: change.toFixed(2) + 'MB',
      period: 'last ' + recent.length + ' checks',
    };
  }

  getReport() {
    const current = this.getStats();
    const trend = this.getTrend();
    const heapRatio = current.process.heapUsedMB / this.maxHeapMB;

    return {
      status: heapRatio > this.criticalThreshold ? 'critical' 
        : heapRatio > this.warningThreshold ? 'warning' 
        : 'healthy',
      current: {
        heapUsedMB: current.process.heapUsedMB,
        heapTotalMB: current.process.heapTotalMB,
        rssMB: current.process.rssMB,
        heapRatio: (heapRatio * 100).toFixed(2) + '%',
      },
      limits: {
        maxHeapMB: this.maxHeapMB,
        warningThreshold: (this.warningThreshold * 100).toFixed(0) + '%',
        criticalThreshold: (this.criticalThreshold * 100).toFixed(0) + '%',
      },
      trend,
      system: {
        memoryUsage: current.systemMemory.usagePercent + '%',
        freeMemoryMB: (current.systemMemory.free / 1024 / 1024).toFixed(0) + 'MB',
        loadAverage: current.cpu.loadAverage.map(l => l.toFixed(2)),
      },
      uptime: {
        process: Math.floor(current.uptime.process / 60) + ' minutes',
        system: Math.floor(current.uptime.system / 3600) + ' hours',
      },
      historySize: this.history.length,
    };
  }

  forceGC() {
    if (global.gc) {
      global.gc();
      logger.info('[MemoryMonitor] 手动触发垃圾回收');
      return true;
    }
    logger.warn('[MemoryMonitor] 垃圾回收不可用，请使用 --expose-gc 启动');
    return false;
  }
}

const memoryMonitor = new MemoryMonitor();

module.exports = memoryMonitor;
