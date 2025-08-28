const mongoose = require('mongoose');

const motorcycleSchema = new mongoose.Schema({
  // 基本信息
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 2
  },
  category: {
    type: String,
    required: true,
    enum: ['街车', '跑车', '巡航', '越野', '踏板', '复古', '旅行', '竞技']
  },
  price: {
    msrp: Number, // 建议零售价
    currency: {
      type: String,
      default: 'CNY'
    }
  },

  // 发动机规格
  engine: {
    type: {
      type: String,
      enum: ['单缸', '双缸', '三缸', '四缸', '六缸', '电动']
    },
    displacement: Number, // 排量 (cc)
    bore: Number, // 缸径 (mm)
    stroke: Number, // 行程 (mm)
    compressionRatio: String, // 压缩比
    cooling: {
      type: String,
      enum: ['风冷', '水冷', '油冷']
    },
    fuelSystem: {
      type: String,
      enum: ['化油器', '电喷', '电动']
    },
    valvesPerCylinder: Number,
    maxRpm: Number
  },

  // 性能数据
  performance: {
    power: {
      hp: Number, // 马力
      kw: Number, // 千瓦
      rpm: Number // 转速
    },
    torque: {
      nm: Number, // 牛米
      lbft: Number, // 磅英尺
      rpm: Number // 转速
    },
    topSpeed: Number, // 最高速度 (km/h)
    acceleration: {
      zeroToSixty: Number, // 0-60 mph (秒)
      zeroToHundred: Number, // 0-100 km/h (秒)
      quarterMile: Number // 1/4英里 (秒)
    },
    fuelEconomy: {
      city: Number, // L/100km
      highway: Number,
      combined: Number
    }
  },

  // 尺寸数据
  dimensions: {
    length: Number, // 长度 (mm)
    width: Number, // 宽度 (mm)
    height: Number, // 高度 (mm)
    wheelbase: Number, // 轴距 (mm)
    seatHeight: Number, // 座椅高度 (mm)
    groundClearance: Number, // 离地间隙 (mm)
    weight: {
      dry: Number, // 干重 (kg)
      wet: Number, // 湿重 (kg)
      gvwr: Number // 总重 (kg)
    },
    fuelCapacity: Number // 油箱容量 (L)
  },

  // 附加信息
  images: [{
    url: String,
    alt: String,
    type: {
      type: String,
      enum: ['main', 'side', 'rear', 'engine', 'interior', 'detail']
    }
  }],
  
  features: [String], // 功能特色
  
  colors: [{
    name: String,
    hex: String,
    imageUrl: String
  }],
  
  rating: {
    overall: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviews: {
      type: Number,
      default: 0
    },
    breakdown: {
      performance: Number,
      comfort: Number,
      reliability: Number,
      value: Number,
      styling: Number
    }
  },

  // 技术规格
  transmission: {
    type: {
      type: String,
      enum: ['手动', '自动', 'CVT', '双离合']
    },
    gears: Number
  },
  
  suspension: {
    front: String,
    rear: String
  },
  
  brakes: {
    front: String,
    rear: String,
    abs: Boolean
  },
  
  wheels: {
    front: {
      size: String,
      tire: String
    },
    rear: {
      size: String,
      tire: String
    }
  },

  // 元数据
  status: {
    type: String,
    enum: ['active', 'discontinued', 'concept'],
    default: 'active'
  },
  
  tags: [String],
  
  seo: {
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    metaTitle: String,
    metaDescription: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
motorcycleSchema.index({ brand: 1, model: 1, year: 1 });
motorcycleSchema.index({ category: 1 });
motorcycleSchema.index({ 'price.msrp': 1 });
motorcycleSchema.index({ 'engine.displacement': 1 });
motorcycleSchema.index({ 'performance.power.hp': 1 });
motorcycleSchema.index({ 'seo.slug': 1 });
motorcycleSchema.index({ tags: 1 });

// 虚拟字段
motorcycleSchema.virtual('fullName').get(function() {
  return `${this.year} ${this.brand} ${this.model}`;
});

motorcycleSchema.virtual('powerToWeight').get(function() {
  if (this.performance?.power?.hp && this.dimensions?.weight?.wet) {
    return (this.performance.power.hp / this.dimensions.weight.wet * 1000).toFixed(2);
  }
  return null;
});

// 中间件 - 生成 slug
motorcycleSchema.pre('save', function(next) {
  if (!this.seo.slug) {
    this.seo.slug = `${this.year}-${this.brand}-${this.model}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('Motorcycle', motorcycleSchema);