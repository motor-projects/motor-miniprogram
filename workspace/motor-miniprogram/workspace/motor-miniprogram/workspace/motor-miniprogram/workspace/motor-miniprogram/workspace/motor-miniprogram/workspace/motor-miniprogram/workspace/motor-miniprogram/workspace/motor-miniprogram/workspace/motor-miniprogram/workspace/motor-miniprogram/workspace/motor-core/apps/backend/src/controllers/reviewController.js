const Review = require('../models/Review');
const Motorcycle = require('../models/Motorcycle');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// 获取摩托车的所有评价
const getMotorcycleReviews = asyncHandler(async (req, res, next) => {
  const { motorcycleId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    rating,
    verified
  } = req.query;

  // 构建筛选条件
  const filter = {
    motorcycle: motorcycleId,
    status: 'approved'
  };

  if (rating) {
    filter['rating.overall'] = parseInt(rating);
  }

  if (verified === 'true') {
    filter.verified = true;
  }

  // 排序选项
  let sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // 如果是按有用性排序，需要特殊处理
  if (sortBy === 'helpful') {
    sortOptions = { helpfulCount: sortOrder === 'desc' ? -1 : 1 };
  }

  const reviews = await Review.find(filter)
    .populate('user', 'username profile.firstName profile.lastName profile.avatar')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // 计算虚拟字段
  const reviewsWithVirtuals = reviews.map(review => ({
    ...review,
    helpfulCount: review.helpful?.filter(h => h.isHelpful).length || 0,
    unhelpfulCount: review.helpful?.filter(h => !h.isHelpful).length || 0,
    replyCount: review.replies?.length || 0
  }));

  const total = await Review.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  // 获取评分统计
  const stats = await Review.getMotorcycleStats(motorcycleId);

  res.status(200).json({
    success: true,
    reviews: reviewsWithVirtuals,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    stats: stats[0] || {
      totalReviews: 0,
      avgOverall: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  });
});

// 获取单个评价详情
const getReviewById = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'username profile.firstName profile.lastName profile.avatar')
    .populate('motorcycle', 'brand model year images')
    .populate('replies.user', 'username profile.firstName profile.lastName profile.avatar');

  if (!review) {
    return next(new AppError('评价不存在', 404));
  }

  res.status(200).json({
    success: true,
    review
  });
});

// 创建评价
const createReview = asyncHandler(async (req, res, next) => {
  const { motorcycleId } = req.params;

  // 检查摩托车是否存在
  const motorcycle = await Motorcycle.findById(motorcycleId);
  if (!motorcycle) {
    return next(new AppError('摩托车不存在', 404));
  }

  // 检查用户是否已经评价过这款摩托车
  const existingReview = await Review.findOne({
    user: req.user._id,
    motorcycle: motorcycleId
  });

  if (existingReview) {
    return next(new AppError('您已经评价过这款摩托车', 400));
  }

  // 创建评价
  const reviewData = {
    ...req.body,
    user: req.user._id,
    motorcycle: motorcycleId
  };

  const review = await Review.create(reviewData);

  // 填充用户信息
  await review.populate('user', 'username profile.firstName profile.lastName profile.avatar');

  res.status(201).json({
    success: true,
    message: '评价创建成功，等待审核',
    review
  });
});

// 更新评价
const updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('评价不存在', 404));
  }

  // 检查权限（只有作者或管理员可以修改）
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('无权修改此评价', 403));
  }

  // 如果是普通用户修改，重新设置为待审核状态
  if (req.user.role !== 'admin') {
    req.body.status = 'pending';
  }

  review = await Review.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'username profile.firstName profile.lastName profile.avatar');

  res.status(200).json({
    success: true,
    message: '评价更新成功',
    review
  });
});

// 删除评价
const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('评价不存在', 404));
  }

  // 检查权限
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('无权删除此评价', 403));
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: '评价删除成功'
  });
});

// 标记评价为有用/无用
const markHelpful = asyncHandler(async (req, res, next) => {
  const { isHelpful } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('评价不存在', 404));
  }

  // 检查用户是否已经标记过
  const existingMark = review.helpful.find(
    h => h.user.toString() === req.user._id.toString()
  );

  if (existingMark) {
    // 更新现有标记
    existingMark.isHelpful = isHelpful;
  } else {
    // 添加新标记
    review.helpful.push({
      user: req.user._id,
      isHelpful
    });
  }

  await review.save();

  res.status(200).json({
    success: true,
    message: isHelpful ? '标记为有用' : '标记为无用',
    helpfulCount: review.helpful.filter(h => h.isHelpful).length,
    unhelpfulCount: review.helpful.filter(h => !h.isHelpful).length
  });
});

// 回复评价
const replyToReview = asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('评价不存在', 404));
  }

  review.replies.push({
    user: req.user._id,
    content,
    createdAt: new Date()
  });

  await review.save();

  // 填充回复的用户信息
  await review.populate('replies.user', 'username profile.firstName profile.lastName profile.avatar');

  res.status(201).json({
    success: true,
    message: '回复成功',
    reply: review.replies[review.replies.length - 1]
  });
});

// 获取用户的所有评价
const getUserReviews = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const reviews = await Review.find({ user: req.user._id })
    .populate('motorcycle', 'brand model year images')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Review.countDocuments({ user: req.user._id });
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// 管理员审核评价
const moderateReview = asyncHandler(async (req, res, next) => {
  const { status, moderationNotes } = req.body;

  if (!['approved', 'rejected', 'flagged'].includes(status)) {
    return next(new AppError('无效的审核状态', 400));
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      status,
      moderationNotes
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'username email')
    .populate('motorcycle', 'brand model year');

  if (!review) {
    return next(new AppError('评价不存在', 404));
  }

  res.status(200).json({
    success: true,
    message: `评价已${status === 'approved' ? '批准' : status === 'rejected' ? '拒绝' : '标记'}`,
    review
  });
});

// 获取待审核的评价
const getPendingReviews = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'asc'
  } = req.query;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const reviews = await Review.find({ status: 'pending' })
    .populate('user', 'username email profile.firstName profile.lastName')
    .populate('motorcycle', 'brand model year')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Review.countDocuments({ status: 'pending' });
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// 设置评价为精选
const toggleFeatured = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('评价不存在', 404));
  }

  review.featured = !review.featured;
  await review.save();

  res.status(200).json({
    success: true,
    message: review.featured ? '已设为精选评价' : '已取消精选',
    review
  });
});

module.exports = {
  getMotorcycleReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  replyToReview,
  getUserReviews,
  moderateReview,
  getPendingReviews,
  toggleFeatured
};