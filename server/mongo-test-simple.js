const mongoose = require('mongoose');

console.log('开始测试 MongoDB 连接...');

// 使用 Mongoose 连接
mongoose.connect('mongodb+srv://samchun_db_user:giYV52cszlM5OnEP@cluster0.crysxgx.mongodb.net/?appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('✅ MongoDB 连接成功！');
  console.log('数据库:', mongoose.connection.db.databaseName);
  
  // 简单测试
  return mongoose.connection.db.collection('test').insertOne({ test: 'connection' });
})
.then(result => {
  console.log('✅ 插入测试数据成功:', result.insertedId);
  return mongoose.connection.db.collection('test').findOne({ test: 'connection' });
})
.then(doc => {
  console.log('✅ 查询测试数据成功:', doc);
})
.catch(error => {
  console.error('❌ 连接失败:', error.message);
  if (error.code === 'ENOTFOUND') {
    console.error('错误：无法解析域名，请检查网络连接');
  }
})
.finally(() => {
  mongoose.disconnect();
  console.log('连接已关闭');
});