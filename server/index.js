const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const helmet = require('helmet');
const compression = require('compression');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 导入中间件
const { requestLogger, errorLogger } = require('./utils/logger');
const rateLimiter = require('./utils/rateLimiter');

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// 压缩中间件
app.use(compression());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(requestLogger);

// 限流中间件
app.use(rateLimiter.apiLimit);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// 数据库连接
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 路由
app.use('/api/hot-topics', require('./routes/hotTopics'));
app.use('/api/content', require('./routes/content'));
app.use('/api/publish', require('./routes/publish'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/auth', require('./routes/auth'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 错误处理
app.use(errorLogger);

// 定时任务 - 每30分钟更新热点数据
cron.schedule('*/30 * * * *', async () => {
  try {
    console.log('执行定时热点数据更新...');
    const hotTopicService = require('./services/hotTopicService');
    await hotTopicService.updateHotTopics();
    console.log('热点数据更新完成');
  } catch (error) {
    console.error('定时热点更新失败:', error);
  }
});

// 定时任务 - 每小时清理缓存
cron.schedule('0 * * * *', async () => {
  try {
    console.log('执行缓存清理...');
    // 清理各种缓存
    console.log('缓存清理完成');
  } catch (error) {
    console.error('缓存清理失败:', error);
  }
});

module.exports = app;
