const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
    phone: String,
    location: String
  },
  preferences: {
    favoriteCategories: [{
      type: String,
      enum: ['街车', '跑车', '巡航', '越野', '踏板', '复古', '旅行', '竞技']
    }],
    favoriteBrands: [String],
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      newMotorcycles: {
        type: Boolean,
        default: false
      },
      priceUpdates: {
        type: Boolean,
        default: false
      }
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorcycle'
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// 虚拟字段
userSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

userSchema.virtual('favoriteCount').get(function() {
  return this.favorites?.length || 0;
});

userSchema.virtual('reviewCount').get(function() {
  return this.reviews?.length || 0;
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 更新登录信息
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.loginCount += 1;
  }
  next();
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 生成密码重置令牌
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10分钟
  
  return resetToken;
};

// 生成邮箱验证令牌
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  return verificationToken;
};

// 检查用户权限
userSchema.methods.hasPermission = function(action, resource) {
  const permissions = {
    admin: ['create', 'read', 'update', 'delete', 'manage'],
    moderator: ['create', 'read', 'update'],
    user: ['read']
  };
  
  return permissions[this.role]?.includes(action) || permissions[this.role]?.includes('manage');
};

module.exports = mongoose.model('User', userSchema);