const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Motorcycle = require('../src/models/Motorcycle');
const User = require('../src/models/User');
const Review = require('../src/models/Review');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motorcycles');
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 示例摩托车数据
const motorcyclesData = [
  {
    brand: '雅马哈',
    model: 'YZF-R6',
    year: 2023,
    category: '跑车',
    price: {
      msrp: 120000,
      currency: 'CNY'
    },
    engine: {
      type: '四缸',
      displacement: 599,
      bore: 67,
      stroke: 42.5,
      compressionRatio: '13.1:1',
      cooling: '水冷',
      fuelSystem: '电喷',
      valvesPerCylinder: 4,
      maxRpm: 16500
    },
    performance: {
      power: {
        hp: 118,
        kw: 88,
        rpm: 14500
      },
      torque: {
        nm: 61.7,
        lbft: 45.5,
        rpm: 10500
      },
      topSpeed: 262,
      acceleration: {
        zeroToSixty: 3.1,
        zeroToHundred: 3.1,
        quarterMile: 10.8
      },
      fuelEconomy: {
        city: 6.5,
        highway: 5.8,
        combined: 6.1
      }
    },
    dimensions: {
      length: 2040,
      width: 695,
      height: 1150,
      wheelbase: 1375,
      seatHeight: 850,
      groundClearance: 130,
      weight: {
        dry: 190,
        wet: 190,
        gvwr: 363
      },
      fuelCapacity: 17
    },
    images: [
      {
        url: 'https://example.com/yamaha-r6-main.jpg',
        alt: '雅马哈 YZF-R6 主图',
        type: 'main'
      }
    ],
    features: ['牵引控制', 'ABS', '滑动离合器', '快速换挡', 'LED大灯'],
    colors: [
      {
        name: '雅马哈蓝',
        hex: '#0066CC'
      },
      {
        name: '哑光黑',
        hex: '#2C2C2C'
      }
    ],
    transmission: {
      type: '手动',
      gears: 6
    },
    suspension: {
      front: '倒立式前叉',
      rear: '单摇臂'
    },
    brakes: {
      front: '双盘式制动器',
      rear: '单盘式制动器',
      abs: true
    },
    wheels: {
      front: {
        size: '120/70 ZR17',
        tire: 'Bridgestone Battlax RS11'
      },
      rear: {
        size: '180/55 ZR17',
        tire: 'Bridgestone Battlax RS11'
      }
    },
    tags: ['超级跑车', '赛道', '高性能', '进口'],
    seo: {
      metaTitle: '雅马哈 YZF-R6 2023款 - 超级跑车',
      metaDescription: '雅马哈YZF-R6是一款高性能超级跑车，配备599cc四缸发动机，最大功率118马力'
    }
  },
  {
    brand: '本田',
    model: 'CB650R',
    year: 2023,
    category: '街车',
    price: {
      msrp: 85000,
      currency: 'CNY'
    },
    engine: {
      type: '四缸',
      displacement: 649,
      bore: 67,
      stroke: 46,
      compressionRatio: '11.6:1',
      cooling: '水冷',
      fuelSystem: '电喷',
      valvesPerCylinder: 4,
      maxRpm: 12000
    },
    performance: {
      power: {
        hp: 95,
        kw: 70.6,
        rpm: 12000
      },
      torque: {
        nm: 64,
        lbft: 47.2,
        rpm: 8500
      },
      topSpeed: 200,
      fuelEconomy: {
        city: 5.2,
        highway: 4.8,
        combined: 5.0
      }
    },
    dimensions: {
      length: 2130,
      width: 780,
      height: 1075,
      wheelbase: 1450,
      seatHeight: 810,
      groundClearance: 140,
      weight: {
        dry: 200,
        wet: 208,
        gvwr: 395
      },
      fuelCapacity: 15.4
    },
    features: ['LED灯组', 'LCD仪表盘', 'USB充电口', 'HSTC牵引控制'],
    transmission: {
      type: '手动',
      gears: 6
    },
    tags: ['街车', '通勤', '四缸', '进口'],
    seo: {
      metaTitle: '本田 CB650R 2023款 - 街车',
      metaDescription: '本田CB650R是一款时尚的街车，配备649cc四缸发动机，兼顾性能与实用性'
    }
  },
  {
    brand: '川崎',
    model: 'Ninja ZX-10R',
    year: 2023,
    category: '跑车',
    price: {
      msrp: 165000,
      currency: 'CNY'
    },
    engine: {
      type: '四缸',
      displacement: 998,
      bore: 76,
      stroke: 55,
      compressionRatio: '13:1',
      cooling: '水冷',
      fuelSystem: '电喷',
      valvesPerCylinder: 4,
      maxRpm: 14000
    },
    performance: {
      power: {
        hp: 203,
        kw: 151.4,
        rpm: 13200
      },
      torque: {
        nm: 114.9,
        lbft: 84.8,
        rpm: 11400
      },
      topSpeed: 299,
      acceleration: {
        zeroToSixty: 2.9,
        zeroToHundred: 2.9,
        quarterMile: 9.9
      }
    },
    dimensions: {
      length: 2085,
      width: 750,
      height: 1185,
      wheelbase: 1450,
      seatHeight: 835,
      weight: {
        wet: 206
      },
      fuelCapacity: 17
    },
    features: ['KTRC牵引控制', 'KIBS ABS', '电子油门', '多种骑行模式'],
    tags: ['超级跑车', '赛道', '大排量', '进口'],
    seo: {
      metaTitle: '川崎 Ninja ZX-10R 2023款 - 超级跑车',
      metaDescription: '川崎Ninja ZX-10R是顶级超级跑车，配备998cc四缸发动机，最大功率203马力'
    }
  }
];

// 示例用户数据
const usersData = [
  {
    username: 'admin',
    email: 'admin@motorcycledb.com',
    password: 'admin123456',
    role: 'admin',
    profile: {
      firstName: '管理员',
      lastName: '账户'
    },
    emailVerified: true
  },
  {
    username: 'moderator',
    email: 'moderator@motorcycledb.com',
    password: 'moderator123456',
    role: 'moderator',
    profile: {
      firstName: '版主',
      lastName: '账户'
    },
    emailVerified: true
  },
  {
    username: 'testuser',
    email: 'user@example.com',
    password: 'user123456',
    role: 'user',
    profile: {
      firstName: '测试',
      lastName: '用户'
    },
    emailVerified: true,
    preferences: {
      favoriteCategories: ['跑车', '街车'],
      favoriteBrands: ['雅马哈', '本田']
    }
  }
];

// 清空数据库
const clearDatabase = async () => {
  try {
    await Promise.all([
      Review.deleteMany({}),
      Motorcycle.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('数据库清空完成');
  } catch (error) {
    console.error('清空数据库失败:', error);
    throw error;
  }
};

// 创建用户
const createUsers = async () => {
  try {
    const users = [];
    
    for (const userData of usersData) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      users.push({
        ...userData,
        password: hashedPassword
      });
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`创建了 ${createdUsers.length} 个用户`);
    return createdUsers;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
};

// 创建摩托车
const createMotorcycles = async () => {
  try {
    const createdMotorcycles = await Motorcycle.insertMany(motorcyclesData);
    console.log(`创建了 ${createdMotorcycles.length} 款摩托车`);
    return createdMotorcycles;
  } catch (error) {
    console.error('创建摩托车失败:', error);
    throw error;
  }
};

// 创建评价
const createReviews = async (users, motorcycles) => {
  try {
    const reviewsData = [
      {
        user: users[2]._id, // testuser
        motorcycle: motorcycles[0]._id, // YZF-R6
        title: '令人惊艳的超级跑车',
        content: '作为一款中量级超级跑车，YZF-R6的表现真的很出色。动力输出线性，操控精准，刹车系统也很给力。唯一的缺点就是座椅稍微有点硬，长距离骑行会比较累。',
        rating: {
          overall: 5,
          performance: 5,
          comfort: 3,
          reliability: 5,
          value: 4,
          styling: 5
        },
        pros: ['动力强劲', '操控精准', '外观时尚', '品质可靠'],
        cons: ['座椅偏硬', '价格较高'],
        ownership: {
          duration: '6_months_to_1_year',
          mileage: 5000,
          usage: 'weekend_rides'
        },
        status: 'approved',
        verified: true
      },
      {
        user: users[2]._id, // testuser
        motorcycle: motorcycles[1]._id, // CB650R
        title: '完美的日常通勤选择',
        content: '这款街车非常适合日常通勤使用。动力够用，油耗经济，坐姿舒适。四缸发动机的声浪也很悦耳。总的来说性价比很高。',
        rating: {
          overall: 4,
          performance: 4,
          comfort: 5,
          reliability: 5,
          value: 5,
          styling: 4
        },
        pros: ['燃油经济', '坐姿舒适', '性价比高', '质量可靠'],
        cons: ['动力一般', '后座空间小'],
        ownership: {
          duration: '1_to_2_years',
          mileage: 15000,
          usage: 'daily_commute'
        },
        status: 'approved'
      }
    ];
    
    const createdReviews = await Review.insertMany(reviewsData);
    console.log(`创建了 ${createdReviews.length} 条评价`);
    return createdReviews;
  } catch (error) {
    console.error('创建评价失败:', error);
    throw error;
  }
};

// 主函数
const seedDatabase = async () => {
  try {
    console.log('开始填充数据库...');
    
    await clearDatabase();
    
    const users = await createUsers();
    const motorcycles = await createMotorcycles();
    const reviews = await createReviews(users, motorcycles);
    
    console.log('\\n数据库填充完成！');
    console.log('==================');
    console.log(`用户数量: ${users.length}`);
    console.log(`摩托车数量: ${motorcycles.length}`);
    console.log(`评价数量: ${reviews.length}`);
    console.log('==================');
    console.log('\\n测试账户信息:');
    console.log('管理员账户: admin@motorcycledb.com / admin123456');
    console.log('版主账户: moderator@motorcycledb.com / moderator123456');
    console.log('普通用户: user@example.com / user123456');
    
  } catch (error) {
    console.error('数据库填充失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\\n数据库连接已关闭');
    process.exit(0);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = {
  seedDatabase,
  clearDatabase,
  createUsers,
  createMotorcycles,
  createReviews
};