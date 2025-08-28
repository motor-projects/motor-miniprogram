const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-at-least-32-characters-long-for-testing';
process.env.JWT_EXPIRES_IN = '7d';
process.env.JWT_COOKIE_EXPIRE = '7';
process.env.CLIENT_URL = 'http://localhost:3000';

let mongoServer;

// 在测试开始前运行
beforeAll(async () => {
  // 创建内存数据库实例
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // 连接到内存数据库
  await mongoose.connect(mongoUri);
});

// 在每个测试后清理数据
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 在所有测试完成后清理
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

module.exports = {
  mongoServer
};