const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const process = require('process');
const v8 = require('v8');

let llmGateway = null;
let multiPlatformAdaptationService = null;
let cacheManager = null;

try {
  llmGateway = require('../services/llm');
} catch (e) {}

try {
  multiPlatformAdaptationService = require('../services/multiPlatformAdaptationService');
} catch (e) {}

try {
  cacheManager = require('../utils/CacheManager');
} catch (e) {}

router.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    cachedTopics: global.cachedTopics?.length || 0,
    lastFetchTime: global.lastFetchTime?.toISOString() || null,
    checks: {
      database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      memory: process.memoryUsage(),
      cpu: {
        usage: process.cpuUsage(),
        cores: os.cpus().length
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    },
    services: {
      llmGateway: llmGateway?.hasProviders?.() ? 'available' : (llmGateway ? 'no_providers' : 'unavailable'),
      multiPlatformAdaptation: multiPlatformAdaptationService ? 'available' : 'unavailable',
      cacheManager: cacheManager ? 'available' : 'unavailable'
    }
  };

  const isHealthy = healthCheck.checks.database === 'healthy';
  res.status(isHealthy ? 200 : 503).json(healthCheck);
});

// 详细健康检查
router.get('/health/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      hostname: os.hostname(),
      
      // 系统信息
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        release: os.release(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      },
      
      // Node.js 信息
      node: {
        version: process.version,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        versions: process.versions
      },
      
      // 数据库状态
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        databaseName: mongoose.connection.readyState === 1 ? mongoose.connection.db.databaseName : null,
        readyState: mongoose.connection.readyState
      },
      
      // 进程信息
      process: {
        pid: process.pid,
        ppid: process.ppid,
        execPath: process.execPath,
        argv: process.argv
      }
    };

    res.json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 系统资源监控
router.get('/system', (req, res) => {
  try {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      
      // CPU信息
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
        model: os.cpus()[0]?.model || 'Unknown'
      },
      
      // 内存信息
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      
      // 系统信息
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        userInfo: os.userInfo()
      },
      
      // 网络接口
      networkInterfaces: os.networkInterfaces()
    };

    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 性能指标
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      
      // V8引擎统计
      v8: {
        heapStats: v8.getHeapStatistics(),
        heapSpaceStats: v8.getHeapSpaceStatistics()
      },
      
      // Node.js性能
      node: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        resourceUsage: process.resourceUsage ? process.resourceUsage() : null
      },
      
      // 系统性能
      system: {
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
        freemem: os.freemem(),
        totalmem: os.totalmem()
      }
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 服务依赖检查
router.get('/dependencies', async (req, res) => {
  try {
    const dependencies = {
      timestamp: new Date().toISOString(),
      
      // 数据库连接
      database: {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        databaseName: mongoose.connection.readyState === 1 ? mongoose.connection.db.databaseName : null
      },
      
      // Redis连接（如果配置了）
      redis: {
        status: 'unknown', // 需要在实际项目中实现
        host: process.env.REDIS_HOST || 'localhost'
      },
      
      // 外部API服务
      externalServices: {
        // 可以在这里添加对外部服务的健康检查
      }
    };

    res.json(dependencies);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 告警状态
router.get('/alerts', (req, res) => {
  // 这里应该从告警服务获取当前活动的告警
  const alerts = {
    timestamp: new Date().toISOString(),
    activeAlerts: [],
    alertSummary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  };

  res.json(alerts);
});

router.get('/version', (req, res) => {
  const versionInfo = {
    name: 'AI Content Flow Platform',
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    timestamp: new Date().toISOString()
  };

  res.json(versionInfo);
});

router.get('/memory', (req, res) => {
  try {
    const memoryMonitor = require('../utils/MemoryMonitor');
    const report = memoryMonitor.getReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/memory/history', (req, res) => {
  try {
    const memoryMonitor = require('../utils/MemoryMonitor');
    const history = memoryMonitor.getHistory();
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/cache', (req, res) => {
  try {
    const cacheManager = require('../utils/CacheManager');
    const stats = cacheManager.getAllStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/cache/health', (req, res) => {
  try {
    const cacheManager = require('../utils/CacheManager');
    const health = cacheManager.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/cache/flush', (req, res) => {
  try {
    const cacheManager = require('../utils/CacheManager');
    const { name } = req.body;
    if (name) {
      cacheManager.flush(name);
    } else {
      cacheManager.flushAll();
    }
    res.json({
      success: true,
      message: name ? `缓存 ${name} 已清空` : '所有缓存已清空'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/cache/memory', (req, res) => {
  try {
    const cacheManager = require('../utils/CacheManager');
    const usage = cacheManager.getMemoryUsage();
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;