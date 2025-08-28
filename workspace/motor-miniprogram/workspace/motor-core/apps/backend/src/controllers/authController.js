const crypto = require('crypto');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

// 发送响应的辅助函数
const sendTokenResponse = (user, statusCode, res, message = '操作成功') => {
  const token = generateToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      expires: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000 // 30天
      )
    })
    .json({
      success: true,
      message,
      token,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
};

// 用户注册
const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // 检查用户是否已存在
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('该邮箱已被注册', 400));
    }
    if (existingUser.username === username) {
      return next(new AppError('该用户名已被使用', 400));
    }
  }

  // 创建用户
  const user = await User.create({
    username,
    email,
    password
  });

  // 生成邮箱验证令牌
  const emailVerificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // TODO: 发送验证邮件
  // await sendVerificationEmail(user.email, emailVerificationToken);

  sendTokenResponse(user, 201, res, '注册成功！请查收邮箱验证邮件。');
});

// 用户登录
const login = asyncHandler(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  // 查找用户
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('邮箱或密码错误', 401));
  }

  // 检查账户状态
  if (user.status !== 'active') {
    return next(new AppError('账户已被禁用或暂停', 401));
  }

  // 更新登录信息
  user.lastLogin = new Date();
  user.loginCount += 1;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, '登录成功');
});

// 用户登出
const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: '登出成功'
  });
});

// 获取当前用户信息
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('favorites', 'brand model year images')
    .populate('reviews', 'motorcycle title rating createdAt');

  res.status(200).json({
    success: true,
    user
  });
});

// 更新用户资料
const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    'profile.firstName': req.body.profile?.firstName,
    'profile.lastName': req.body.profile?.lastName,
    'profile.bio': req.body.profile?.bio,
    'profile.phone': req.body.profile?.phone,
    'profile.location': req.body.profile?.location,
    'preferences.favoriteCategories': req.body.preferences?.favoriteCategories,
    'preferences.favoriteBrands': req.body.preferences?.favoriteBrands,
    'preferences.notifications': req.body.preferences?.notifications
  };

  // 移除undefined值
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: '资料更新成功',
    user
  });
});

// 更改密码
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('当前密码错误', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, '密码更新成功');
});

// 忘记密码
const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('没有找到该邮箱对应的用户', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // TODO: 发送重置密码邮件
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/resetPassword/${resetToken}`;

  const message = `您收到这封邮件是因为您请求重置密码。请访问以下链接：\n\n${resetURL}\n\n如果您没有请求重置密码，请忽略此邮件。`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: '密码重置请求',
    //   message
    // });

    res.status(200).json({
      success: true,
      message: '密码重置邮件已发送'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('发送邮件失败，请稍后再试', 500));
  }
});

// 重置密码
const resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('重置令牌无效或已过期', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, '密码重置成功');
});

// 验证邮箱
const verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken
  });

  if (!user) {
    return next(new AppError('验证令牌无效', 400));
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: '邮箱验证成功'
  });
});

// 重新发送验证邮件
const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.emailVerified) {
    return next(new AppError('邮箱已经验证过了', 400));
  }

  const emailVerificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // TODO: 发送验证邮件
  // await sendVerificationEmail(user.email, emailVerificationToken);

  res.status(200).json({
    success: true,
    message: '验证邮件已重新发送'
  });
});

// 刷新令牌
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('请提供刷新令牌', 400));
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('用户不存在', 401));
    }

    if (user.status !== 'active') {
      return next(new AppError('账户已被禁用', 401));
    }

    sendTokenResponse(user, 200, res, '令牌刷新成功');
  } catch (error) {
    return next(new AppError('刷新令牌无效', 401));
  }
});

// 添加到收藏
const addToFavorites = asyncHandler(async (req, res, next) => {
  const { motorcycleId } = req.params;
  const user = await User.findById(req.user._id);

  if (user.favorites.includes(motorcycleId)) {
    return next(new AppError('已经收藏过这款摩托车', 400));
  }

  user.favorites.push(motorcycleId);
  await user.save();

  res.status(200).json({
    success: true,
    message: '添加收藏成功'
  });
});

// 从收藏中移除
const removeFromFavorites = asyncHandler(async (req, res, next) => {
  const { motorcycleId } = req.params;
  const user = await User.findById(req.user._id);

  const index = user.favorites.indexOf(motorcycleId);
  if (index === -1) {
    return next(new AppError('该摩托车不在收藏列表中', 400));
  }

  user.favorites.splice(index, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: '移除收藏成功'
  });
});

// 获取用户收藏
const getFavorites = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 12 } = req.query;

  const user = await User.findById(req.user._id)
    .populate({
      path: 'favorites',
      options: {
        limit: limit * 1,
        skip: (page - 1) * limit,
        sort: { createdAt: -1 }
      }
    });

  res.status(200).json({
    success: true,
    favorites: user.favorites,
    pagination: {
      currentPage: parseInt(page),
      totalItems: user.favoriteCount
    }
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  addToFavorites,
  removeFromFavorites,
  getFavorites
};