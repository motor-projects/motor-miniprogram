const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT令牌
const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请提供有效的认证令牌'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '令牌无效，用户不存在'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用或暂停'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '令牌格式错误'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期，请重新登录'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误'
    });
  }
};

// 可选的认证（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 静默失败，继续执行
    next();
  }
};

// 角色授权
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问此资源'
      });
    }

    next();
  };
};

// 权限检查
const checkPermission = (action, resource) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    if (!req.user.hasPermission(action, resource)) {
      return res.status(403).json({
        success: false,
        message: `没有权限执行${action}操作`
      });
    }

    next();
  };
};

// 资源所有者检查
const checkOwnership = (resourceModel, userField = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next();
      }

      const Model = require(`../models/${resourceModel}`);
      const resource = await Model.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        });
      }

      if (resource[userField].toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: '只能操作自己的资源'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
};

// 从请求头中获取令牌
const getTokenFromHeader = (req) => {
  const authHeader = req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

// 生成JWT令牌
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// 生成刷新令牌
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// 验证刷新令牌
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  checkPermission,
  checkOwnership,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};