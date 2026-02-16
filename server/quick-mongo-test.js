const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('正在测试 MongoDB 连接...');
  
  // 使用最简单的连接方式
  const client = new MongoClient();
  
  try {
    // 尝试连接（使用您的凭据）
    await client.connect('mongodb+srv://samchun_db_user:giYV52cszlM5OnEP@cluster0.crysxgx.mongodb.net/?appName=Cluster0', {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ MongoDB 连接成功！');
    console.log('数据库名称:', client.db().databaseName);
    
    // 测试基本操作
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('集合数量:', collections.length);
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('网络问题：无法解析或连接到 MongoDB Atlas');
    }
  } finally {
    await client.close();
    console.log('连接已关闭');
  }
}

testConnection();