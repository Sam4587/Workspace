const mongoose = require('mongoose');
const hotTopicService = require('./services/hotTopicService');
const app = require('./index');

const PORT = process.env.PORT || 5000;

// 确保数据库连接成功后启动服务器
mongoose.connection.once('open', async () => {
  console.log('数据库连接成功');
  
  // 首次启动时抓取热点数据
  try {
    console.log('开始初始化热点数据...');
    await hotTopicService.updateHotTopics();
    console.log('热点数据初始化完成');
  } catch (error) {
    console.error('热点数据初始化失败:', error.message);
  }
  
  app.listen(PORT, () => {
    console.log(`服务器启动成功，运行在端口 ${PORT}`);
    console.log(`API文档: http://localhost:${PORT}/api/docs`);
  });
});

// 处理数据库连接错误
mongoose.connection.on('error', (err) => {
  console.error('数据库连接失败:', err);
  process.exit(1);
});

// 处理未捕获的异常
process.on('unhandledRejection', (err) => {
  console.error('未处理的Promise拒绝:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});
