const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 健康检查端点
router.get('/db-health', async (req, res) => {
  try {
    // 检查数据库连接状态
    if (mongoose.connection.readyState === 1) {
      // 数据库连接正常
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      res.json({
        status: 'healthy',
        database: mongoose.connection.db.databaseName,
        collections: collections.map(c => c.name),
        connected: true
      });
    } else {
      res.status(503).json({ 
        status: 'unhealthy', 
        message: 'Database not connected',
        connected: false 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      connected: false
    });
  }
});

module.exports = router;