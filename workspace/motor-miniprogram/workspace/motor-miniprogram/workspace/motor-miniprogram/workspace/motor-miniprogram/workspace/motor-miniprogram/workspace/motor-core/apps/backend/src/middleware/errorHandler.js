const mongoose = require('mongoose');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 异步错误捕获包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 处理Cast错误（无效的ObjectId）
const handleCastErrorDB = (err) => {
  const message = `无效的${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// 处理重复字段错误
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field}: '${value}' 已存在，请使用其他值`;
  return new AppError(message, 400);
};

// 处理验证错误
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `数据验证失败: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// 处理JWT错误
const handleJWTError = () =>
  new AppError('无效的令牌，请重新登录', 401);

// 处理JWT过期错误
const handleJWTExpiredError = () =>
  new AppError('令牌已过期，请重新登录', 401);

// 发送开发环境错误信息
const sendErrorDev = (err, req, res) => {
  // API错误
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // 渲染错误页面（如果有前端渲染）
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    success: false,
    message: '出现了错误！',
    error: err
  });
};

// 发送生产环境错误信息
const sendErrorProd = (err, req, res) => {
  // API错误
  if (req.originalUrl.startsWith('/api')) {
    // 可操作的，受信任的错误：发送消息给客户端
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    }

    // 编程或其他未知错误：不泄露错误详情
    console.error('ERROR 💥', err);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }

  // 可操作的，受信任的错误：发送消息给客户端
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // 编程或其他未知错误：不泄露错误详情
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    message: '出现了错误，请稍后再试'
  });
};

// 全局错误处理中间件
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // MongoDB Cast错误
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    
    // MongoDB重复字段错误
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    
    // MongoDB验证错误
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    
    // JWT错误
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    
    // JWT过期错误
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

// 未捕获的路由处理
const notFound = (req, res, next) => {
  const message = `未找到路由 ${req.originalUrl}`;
  next(new AppError(message, 404));
};

// 日志错误中间件
const logError = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user._id : null,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    },
    body: req.body,
    params: req.params,
    query: req.query
  };

  // 在生产环境中，这里应该使用专业的日志服务
  console.error('API Error:', JSON.stringify(errorLog, null, 2));

  // 如果有日志服务（如Winston, Bunyan等），在这里记录
  // logger.error(errorLog);

  next(err);
};

// MongoDB连接错误处理
const handleMongoConnection = () => {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB连接错误:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB连接断开');
  });

  // 处理进程终止
  process.on('SIGINT', async () => {
    console.log('正在关闭MongoDB连接...');
    await mongoose.connection.close();
    console.log('MongoDB连接已关闭');
    process.exit(0);
  });
};

// 未处理的Promise拒绝
process.on('unhandledRejection', (err, promise) => {
  console.error('未处理的Promise拒绝:', err.name, err.message);
  console.error('关闭服务器...');
  
  // 记录详细错误信息
  console.error('Promise:', promise);
  console.error('Error Stack:', err.stack);
  
  // 优雅关闭服务器
  process.exit(1);
});

// 未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err.name, err.message);
  console.error('Error Stack:', err.stack);
  console.error('关闭应用...');
  process.exit(1);
});

// SIGTERM信号处理
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，优雅关闭服务器');
  process.exit(0);
});

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFound,
  logError,
  handleMongoConnection
};