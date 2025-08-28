const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis客户端（如果配置了Redis）
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.log('Redis服务器拒绝连接');
        return new Error('Redis服务器拒绝连接');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        console.log('Redis重试时间超时');
        return new Error('Redis重试时间超时');
      }
      if (options.attempt > 10) {
        console.log('Redis重试次数超限');
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis连接成功');
  });
}

// 创建速率限制存储
const createStore = () => {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    });
  }
  return undefined; // 使用默认内存存储
};

// 通用速率限制配置
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    store: createStore(),
    windowMs: 15 * 60 * 1000, // 15分钟
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(options.windowMs / 1000) || 900
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000) || 900
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// API通用限制：每15分钟100个请求
const generalLimiter = createRateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: {
    success: false,
    message: 'API请求过于频繁，请稍后再试'
  }
});

// 认证相关限制：每15分钟5次尝试
const authLimiter = createRateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: '登录尝试过于频繁，请稍后再试'
  }
});

// 创建用户限制：每天10个账户
const createAccountLimiter = createRateLimit({
  max: 10,
  windowMs: 24 * 60 * 60 * 1000,
  message: {
    success: false,
    message: '今日注册账户已达上限，请明天再试'
  }
});

// 上传文件限制：每小时20次
const uploadLimiter = createRateLimit({
  max: 20,
  windowMs: 60 * 60 * 1000,
  message: {
    success: false,
    message: '文件上传过于频繁，请稍后再试'
  }
});

// 评价创建限制：每天10条评价
const reviewLimiter = createRateLimit({
  max: 10,
  windowMs: 24 * 60 * 60 * 1000,
  message: {
    success: false,
    message: '今日评价已达上限，请明天再试'
  }
});

// 搜索限制：每分钟30次
const searchLimiter = createRateLimit({
  max: 30,
  windowMs: 60 * 1000,
  message: {
    success: false,
    message: '搜索过于频繁，请稍后再试'
  }
});

// 管理员操作限制：每分钟10次
const adminLimiter = createRateLimit({
  max: 10,
  windowMs: 60 * 1000,
  message: {
    success: false,
    message: '管理操作过于频繁，请稍后再试'
  }
});

// 请求减速中间件
const speedLimiter = slowDown({
  store: createStore(),
  windowMs: 15 * 60 * 1000, // 15分钟
  delayAfter: 50, // 超过50个请求后开始延迟
  delayMs: () => 500, // 每个请求延迟500ms
  maxDelayMs: 20000, // 最大延迟20秒
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  validate: {
    delayMs: false // 禁用 delayMs 警告
  }
});

// 动态速率限制（根据用户角色调整）
const dynamicLimiter = (req, res, next) => {
  let maxRequests = 100; // 默认限制
  
  if (req.user) {
    switch (req.user.role) {
      case 'admin':
        maxRequests = 1000;
        break;
      case 'moderator':
        maxRequests = 500;
        break;
      case 'user':
        maxRequests = 200;
        break;
      default:
        maxRequests = 100;
    }
  }

  const limiter = createRateLimit({
    max: maxRequests,
    windowMs: 15 * 60 * 1000,
    keyGenerator: (req) => {
      return req.user ? `user_${req.user._id}` : req.ip;
    }
  });

  return limiter(req, res, next);
};

// IP白名单中间件
const whitelist = (ips = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (ips.includes(clientIP)) {
      return next();
    }
    
    // 应用默认限制
    return generalLimiter(req, res, next);
  };
};

// 监控和日志中间件
const rateLimitLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 429) {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  createAccountLimiter,
  uploadLimiter,
  reviewLimiter,
  searchLimiter,
  adminLimiter,
  speedLimiter,
  dynamicLimiter,
  whitelist,
  rateLimitLogger,
  createRateLimit
};