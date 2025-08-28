const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入配置和中间件
const connectDB = require('./src/config/database');
const { globalErrorHandler, notFound, logError, handleMongoConnection } = require('./src/middleware/errorHandler');
const { sendResponse } = require('./src/utils/response');
const { generalLimiter, rateLimitLogger } = require('./src/middleware/rateLimit');

// 导入路由
const motorcycleRoutes = require('./src/routes/motorcycles');
const uploadRoutes = require('./src/routes/upload');
const authRoutes = require('./src/routes/auth');
const reviewRoutes = require('./src/routes/reviews');

const app = express();
const PORT = process.env.PORT || 5000;

// 信任代理（用于获取真实IP）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// 日志中间件
app.use(morgan('combined'));

// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// 速率限制和日志
app.use(rateLimitLogger);
app.use('/api/', generalLimiter);

// 请求解析中间件
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ success: false, message: 'JSON格式错误' });
      return;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 响应格式化中间件
app.use(sendResponse);

// 静态文件服务
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true
}));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/motorcycles', motorcycleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);

// API根路径
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '摩托车性能数据库 API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      motorcycles: '/api/motorcycles',
      reviews: '/api/reviews',
      upload: '/api/upload'
    }
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API文档重定向
app.get('/docs', (req, res) => {
  res.redirect('/api');
});

// 错误处理中间件
app.use(logError);
app.use(notFound);
app.use(globalErrorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 设置MongoDB连接事件处理
    handleMongoConnection();
    
    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📱 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API地址: http://localhost:${PORT}/api`);
      console.log(`❤️  健康检查: http://localhost:${PORT}/api/health`);
    });

    // 优雅关闭
    const gracefulShutdown = (signal) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
      
      server.close(() => {
        console.log('HTTP服务器已关闭');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        console.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// 只在非测试环境下启动应用
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;