/**
 * 健康检查和监控路由
 * 提供系统状态、性能指标和健康诊断功能
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const process = require('process');
const path = require('path');
const fs = require('fs');

// 模拟数据库连接检查（实际项目中需要替换为真实的数据库检查）
async function checkDatabaseConnection() {
  // 这里应该实际检查数据库连接状态
  return Promise.resolve(true);
}

// 获取磁盘使用情况
function getDiskUsage() {
  try {
    const rootPath = process.platform === 'win32' ? 'C:' : '/';
    const stats = fs.statSync(rootPath);
    const total = stats.blocks * stats.blksize;
    const free = stats.bfree * stats.blksize;
    const used = total - free;
    
    return {
      total: formatBytes(total),
      used: formatBytes(used),
      free: formatBytes(free),
      percentage: ((used / total) * 100).toFixed(2)
    };
  } catch (error) {
    return { error: 'Unable to get disk usage' };
  }
}

// 格式化字节大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取系统信息
function getSystemInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
    uptime: process.uptime(),
    memory: {
      rss: formatBytes(process.memoryUsage().rss),
      heapTotal: formatBytes(process.memoryUsage().heapTotal),
      heapUsed: formatBytes(process.memoryUsage().heapUsed),
      external: formatBytes(process.memoryUsage().external)
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
      model: os.cpus()[0]?.model || 'Unknown'
    },
    network: {
      hostname: os.hostname(),
      interfaces: Object.keys(os.networkInterfaces())
    },
    disk: getDiskUsage()
  };
}

/**
 * 基础健康检查
 * GET /api/monitoring/health
 */
router.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthStatus);
});

/**
 * 详细健康检查
 * GET /api/monitoring/health/detailed
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: getSystemInfo(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      checks: {
        database: 'unknown', // 需要在实际应用中实现
        redis: 'unknown',    // 需要在实际应用中实现
        externalAPIs: 'unknown' // 需要在实际应用中实现
      }
    };

    // 检查数据库连接
    try {
      await checkDatabaseConnection();
      detailedHealth.checks.database = 'healthy';
    } catch (error) {
      detailedHealth.checks.database = 'unhealthy';
      detailedHealth.status = 'degraded';
    }

    res.status(200).json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * 数据库健康检查
 * GET /api/monitoring/health/database
 */
router.get('/health/database', async (req, res) => {
  try {
    await checkDatabaseConnection();
    res.status(200).json({
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Redis健康检查
 * GET /api/monitoring/health/redis
 */
router.get('/health/redis', (req, res) => {
  // 这里应该实际检查Redis连接状态
  res.status(200).json({
    status: 'connected', // 或 'disconnected'
    timestamp: new Date().toISOString()
  });
});

/**
 * 系统资源监控
 * GET /api/monitoring/system
 */
router.get('/system', (req, res) => {
  const systemMetrics = {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: os.loadavg(),
      cores: os.cpus().length,
      arch: os.arch()
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    },
    uptime: os.uptime(),
    platform: os.platform()
  };

  res.status(200).json(systemMetrics);
});

/**
 * 应用性能指标
 * GET /api/monitoring/metrics
 */
router.get('/metrics', (req, res) => {
  // 这里应该从指标收集器获取实际数据
  const mockMetrics = {
    timestamp: new Date().toISOString(),
    requests: {
      total: 1234,
      errors: 12,
      successRate: '99.03%'
    },
    performance: {
      avgResponseTime: '45ms',
      p95ResponseTime: '120ms',
      p99ResponseTime: '300ms'
    },
    resources: {
      activeConnections: 23,
      threadPool: {
        used: 8,
        available: 12
      }
    }
  };

  res.status(200).json(mockMetrics);
});

/**
 * 服务依赖检查
 * GET /api/monitoring/dependencies
 */
router.get('/dependencies', (req, res) => {
  const dependencies = {
    timestamp: new Date().toISOString(),
    services: [
      {
        name: 'MongoDB',
        status: 'healthy',
        endpoint: process.env.DB_HOST || 'localhost:27017',
        responseTime: '15ms'
      },
      {
        name: 'Redis',
        status: 'healthy',
        endpoint: process.env.REDIS_HOST || 'localhost:6379',
        responseTime: '2ms'
      },
      {
        name: 'External API',
        status: 'degraded',
        endpoint: 'https://api.external-service.com',
        responseTime: '2.5s',
        lastCheck: new Date().toISOString()
      }
    ]
  };

  res.status(200).json(dependencies);
});

/**
 * 告警状态
 * GET /api/monitoring/alerts
 */
router.get('/alerts', (req, res) => {
  const alerts = {
    timestamp: new Date().toISOString(),
    active: [
      {
        id: 'alert_001',
        level: 'warning',
        message: 'High memory usage detected',
        service: 'backend-api',
        triggeredAt: new Date(Date.now() - 300000).toISOString() // 5分钟前
      }
    ],
    recent: [
      {
        id: 'alert_002',
        level: 'info',
        message: 'Service restarted successfully',
        service: 'backend-api',
        resolvedAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前
        duration: '2m 30s'
      }
    ]
  };

  res.status(200).json(alerts);
});

module.exports = router;