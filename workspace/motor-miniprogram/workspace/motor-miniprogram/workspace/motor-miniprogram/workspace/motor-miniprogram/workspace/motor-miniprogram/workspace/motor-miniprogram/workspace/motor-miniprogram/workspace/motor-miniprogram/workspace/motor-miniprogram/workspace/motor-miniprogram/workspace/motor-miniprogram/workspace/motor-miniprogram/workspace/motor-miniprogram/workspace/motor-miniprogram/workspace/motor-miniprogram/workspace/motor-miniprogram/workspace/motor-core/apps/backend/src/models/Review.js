const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  motorcycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorcycle',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    performance: {
      type: Number,
      min: 1,
      max: 5
    },
    comfort: {
      type: Number,
      min: 1,
      max: 5
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    styling: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  pros: [String],
  cons: [String],
  images: [{
    url: String,
    caption: String,
    publicId: String
  }],
  ownership: {
    duration: {
      type: String,
      enum: ['less_than_6_months', '6_months_to_1_year', '1_to_2_years', '2_to_5_years', 'more_than_5_years']
    },
    mileage: Number, // 里程数
    usage: {
      type: String,
      enum: ['daily_commute', 'weekend_rides', 'touring', 'track_racing', 'off_road', 'city_riding']
    }
  },
  helpful: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: Boolean
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  verified: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  moderationNotes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
reviewSchema.index({ motorcycle: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ featured: 1, createdAt: -1 });
reviewSchema.index({ user: 1, motorcycle: 1 }, { unique: true }); // 用户只能对每个摩托车评价一次

// 虚拟字段
reviewSchema.virtual('helpfulCount').get(function() {
  return this.helpful?.filter(h => h.isHelpful).length || 0;
});

reviewSchema.virtual('unhelpfulCount').get(function() {
  return this.helpful?.filter(h => !h.isHelpful).length || 0;
});

reviewSchema.virtual('replyCount').get(function() {
  return this.replies?.length || 0;
});

reviewSchema.virtual('averageDetailRating').get(function() {
  const ratings = [
    this.rating.performance,
    this.rating.comfort,
    this.rating.reliability,
    this.rating.value,
    this.rating.styling
  ].filter(r => r != null);
  
  if (ratings.length === 0) return null;
  
  return Number((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1));
});

// 中间件 - 更新摩托车评分
reviewSchema.post('save', async function() {
  await updateMotorcycleRating(this.motorcycle);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateMotorcycleRating(doc.motorcycle);
  }
});

reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateMotorcycleRating(doc.motorcycle);
  }
});

// 更新摩托车评分的辅助函数
async function updateMotorcycleRating(motorcycleId) {
  try {
    const Motorcycle = mongoose.model('Motorcycle');
    const Review = mongoose.model('Review');
    
    const stats = await Review.aggregate([
      { $match: { motorcycle: motorcycleId, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$rating.overall' },
          avgPerformance: { $avg: '$rating.performance' },
          avgComfort: { $avg: '$rating.comfort' },
          avgReliability: { $avg: '$rating.reliability' },
          avgValue: { $avg: '$rating.value' },
          avgStyling: { $avg: '$rating.styling' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const stat = stats[0];
      await Motorcycle.findByIdAndUpdate(motorcycleId, {
        'rating.overall': Number(stat.avgOverall.toFixed(1)),
        'rating.reviews': stat.totalReviews,
        'rating.breakdown.performance': stat.avgPerformance ? Number(stat.avgPerformance.toFixed(1)) : null,
        'rating.breakdown.comfort': stat.avgComfort ? Number(stat.avgComfort.toFixed(1)) : null,
        'rating.breakdown.reliability': stat.avgReliability ? Number(stat.avgReliability.toFixed(1)) : null,
        'rating.breakdown.value': stat.avgValue ? Number(stat.avgValue.toFixed(1)) : null,
        'rating.breakdown.styling': stat.avgStyling ? Number(stat.avgStyling.toFixed(1)) : null
      });
    } else {
      await Motorcycle.findByIdAndUpdate(motorcycleId, {
        'rating.overall': 0,
        'rating.reviews': 0,
        'rating.breakdown.performance': null,
        'rating.breakdown.comfort': null,
        'rating.breakdown.reliability': null,
        'rating.breakdown.value': null,
        'rating.breakdown.styling': null
      });
    }
  } catch (error) {
    console.error('Error updating motorcycle rating:', error);
  }
}

// 静态方法 - 获取用户对摩托车的评价
reviewSchema.statics.findUserReview = function(userId, motorcycleId) {
  return this.findOne({ user: userId, motorcycle: motorcycleId });
};

// 静态方法 - 获取摩托车的评价统计
reviewSchema.statics.getMotorcycleStats = function(motorcycleId) {
  return this.aggregate([
    { $match: { motorcycle: new mongoose.Types.ObjectId(motorcycleId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        avgOverall: { $avg: '$rating.overall' },
        ratingDistribution: {
          $push: '$rating.overall'
        }
      }
    },
    {
      $project: {
        totalReviews: 1,
        avgOverall: { $round: ['$avgOverall', 1] },
        ratingDistribution: {
          5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } },
          4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Review', reviewSchema);