const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // 维护最多10个socket连接
      serverSelectionTimeoutMS: 5000, // 在5秒后超时
      socketTimeoutMS: 45000, // 在45秒后关闭socket
      family: 4 // 使用IPv4，跳过IPv6
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // 优雅关闭
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;