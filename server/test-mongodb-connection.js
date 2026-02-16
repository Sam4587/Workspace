const mongoose = require('mongoose');

async function testMongoDBConnection() {
  const uri = 'mongodb+srv://samchun_db_user:giYV52cszlM5OnEP@cluster0.crysxgx.mongodb.net/?appName=Cluster0';
  
  console.log('正在连接 MongoDB...');
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB 连接成功！');
    console.log('数据库名称:', mongoose.connection.db.databaseName);
    
    // 测试基本操作
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('集合列表:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await mongoose.disconnect();
    console.log('连接已关闭');
  }
}

testMongoDBConnection();