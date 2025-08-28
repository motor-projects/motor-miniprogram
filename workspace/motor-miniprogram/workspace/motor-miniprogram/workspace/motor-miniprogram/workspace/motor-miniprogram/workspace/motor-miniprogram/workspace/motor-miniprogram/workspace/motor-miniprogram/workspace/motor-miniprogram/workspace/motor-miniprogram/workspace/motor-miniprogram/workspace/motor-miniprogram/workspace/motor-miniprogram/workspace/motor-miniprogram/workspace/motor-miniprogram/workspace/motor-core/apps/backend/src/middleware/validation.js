const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 处理验证错误
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errorMessages
    });
  }
  
  next();
};

// 摩托车验证规则
const motorcycleValidation = [
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('品牌不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('品牌长度应在1-50字符之间'),
    
  body('model')
    .trim()
    .notEmpty()
    .withMessage('型号不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('型号长度应在1-100字符之间'),
    
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage('年份必须在1900年到未来2年之间'),
    
  body('category')
    .isIn(['街车', '跑车', '巡航', '越野', '踏板', '复古', '旅行', '竞技'])
    .withMessage('车型类别无效'),
    
  body('price.msrp')
    .optional()
    .isNumeric()
    .withMessage('价格必须为数字')
    .custom(value => value >= 0)
    .withMessage('价格不能为负数'),
    
  body('engine.displacement')
    .optional()
    .isNumeric()
    .withMessage('排量必须为数字')
    .custom(value => value > 0)
    .withMessage('排量必须大于0'),
    
  body('performance.power.hp')
    .optional()
    .isNumeric()
    .withMessage('马力必须为数字')
    .custom(value => value >= 0)
    .withMessage('马力不能为负数'),
    
  body('performance.torque.nm')
    .optional()
    .isNumeric()
    .withMessage('扭矩必须为数字')
    .custom(value => value >= 0)
    .withMessage('扭矩不能为负数'),
    
  body('dimensions.weight.wet')
    .optional()
    .isNumeric()
    .withMessage('重量必须为数字')
    .custom(value => value > 0)
    .withMessage('重量必须大于0'),
    
  body('images')
    .optional()
    .isArray()
    .withMessage('图片列表必须为数组'),
    
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('图片URL格式不正确'),
    
  body('features')
    .optional()
    .isArray()
    .withMessage('功能特色必须为数组'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须为数组'),
    
  handleValidationErrors
];

// 用户注册验证规则
const userRegistrationValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度应在3-30字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
    
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码与密码不匹配');
      }
      return true;
    }),
    
  handleValidationErrors
];

// 用户登录验证规则
const userLoginValidation = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
    
  handleValidationErrors
];

// 评价验证规则
const reviewValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('评价标题不能为空')
    .isLength({ min: 5, max: 100 })
    .withMessage('标题长度应在5-100字符之间'),
    
  body('content')
    .trim()
    .notEmpty()
    .withMessage('评价内容不能为空')
    .isLength({ min: 20, max: 2000 })
    .withMessage('内容长度应在20-2000字符之间'),
    
  body('rating.overall')
    .isInt({ min: 1, max: 5 })
    .withMessage('总体评分必须在1-5之间'),
    
  body('rating.performance')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('性能评分必须在1-5之间'),
    
  body('rating.comfort')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('舒适性评分必须在1-5之间'),
    
  body('rating.reliability')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('可靠性评分必须在1-5之间'),
    
  body('rating.value')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('性价比评分必须在1-5之间'),
    
  body('rating.styling')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('外观评分必须在1-5之间'),
    
  body('motorcycle')
    .isMongoId()
    .withMessage('摩托车ID格式不正确'),
    
  body('pros')
    .optional()
    .isArray()
    .withMessage('优点必须为数组'),
    
  body('cons')
    .optional()
    .isArray()
    .withMessage('缺点必须为数组'),
    
  handleValidationErrors
];

// MongoDB ID 验证
const mongoIdValidation = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('ID格式不正确'),
  handleValidationErrors
];

// 分页验证
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
    
  handleValidationErrors
];

// 搜索和筛选验证
const searchValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度应在1-100字符之间'),
    
  query('brand')
    .optional()
    .isString()
    .withMessage('品牌筛选格式不正确'),
    
  query('category')
    .optional()
    .isString()
    .withMessage('类别筛选格式不正确'),
    
  query('minPrice')
    .optional()
    .isNumeric()
    .withMessage('最低价格必须为数字'),
    
  query('maxPrice')
    .optional()
    .isNumeric()
    .withMessage('最高价格必须为数字'),
    
  query('minPower')
    .optional()
    .isNumeric()
    .withMessage('最低功率必须为数字'),
    
  query('maxPower')
    .optional()
    .isNumeric()
    .withMessage('最高功率必须为数字'),
    
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'year', 'price.msrp', 'performance.power.hp', 'rating.overall'])
    .withMessage('排序字段无效'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序顺序必须为asc或desc'),
    
  handleValidationErrors
];

// 用户资料更新验证
const userProfileValidation = [
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('名字长度不能超过50字符'),
    
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('姓氏长度不能超过50字符'),
    
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('个人简介不能超过500字符'),
    
  body('profile.phone')
    .optional()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('电话号码格式不正确'),
    
  body('preferences.favoriteCategories')
    .optional()
    .isArray()
    .withMessage('喜欢的类别必须为数组'),
    
  body('preferences.favoriteBrands')
    .optional()
    .isArray()
    .withMessage('喜欢的品牌必须为数组'),
    
  handleValidationErrors
];

// 自定义验证器
const customValidators = {
  // 验证摩托车是否存在
  motorcycleExists: async (motorcycleId) => {
    const Motorcycle = require('../models/Motorcycle');
    const motorcycle = await Motorcycle.findById(motorcycleId);
    if (!motorcycle) {
      throw new Error('摩托车不存在');
    }
    return true;
  },
  
  // 验证用户是否已评价过该摩托车
  reviewNotExists: async (motorcycleId, { req }) => {
    const Review = require('../models/Review');
    const existingReview = await Review.findOne({
      user: req.user._id,
      motorcycle: motorcycleId
    });
    if (existingReview) {
      throw new Error('您已经评价过这款摩托车');
    }
    return true;
  },
  
  // 验证价格范围
  priceRange: (maxPrice, { req }) => {
    const minPrice = req.query.minPrice;
    if (minPrice && maxPrice && parseInt(minPrice) > parseInt(maxPrice)) {
      throw new Error('最低价格不能大于最高价格');
    }
    return true;
  }
};

module.exports = {
  handleValidationErrors,
  motorcycleValidation,
  userRegistrationValidation,
  userLoginValidation,
  reviewValidation,
  mongoIdValidation,
  paginationValidation,
  searchValidation,
  userProfileValidation,
  customValidators
};