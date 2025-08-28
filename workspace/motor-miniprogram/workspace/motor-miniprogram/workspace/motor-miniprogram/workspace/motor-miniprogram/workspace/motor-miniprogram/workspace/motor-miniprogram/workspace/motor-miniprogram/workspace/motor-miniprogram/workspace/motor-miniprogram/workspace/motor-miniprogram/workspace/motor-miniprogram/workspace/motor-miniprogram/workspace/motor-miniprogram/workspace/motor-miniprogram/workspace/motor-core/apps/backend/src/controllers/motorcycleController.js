const Motorcycle = require('../models/Motorcycle');
const Review = require('../models/Review');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// 获取所有摩托车
const getAllMotorcycles = asyncHandler(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      brand,
      category,
      minPrice,
      maxPrice,
      minPower,
      maxPower,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const filter = {};
    
    // 构建查询条件
    if (brand) filter.brand = { $in: brand.split(',') };
    if (category) filter.category = { $in: category.split(',') };
    if (minPrice || maxPrice) {
      filter['price.msrp'] = {};
      if (minPrice) filter['price.msrp'].$gte = parseInt(minPrice);
      if (maxPrice) filter['price.msrp'].$lte = parseInt(maxPrice);
    }
    if (minPower || maxPower) {
      filter['performance.power.hp'] = {};
      if (minPower) filter['performance.power.hp'].$gte = parseInt(minPower);
      if (maxPower) filter['performance.power.hp'].$lte = parseInt(maxPower);
    }
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const motorcycles = await Motorcycle.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Motorcycle.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      motorcycles,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        applied: { brand, category, minPrice, maxPrice, minPower, maxPower, search },
        available: await getAvailableFilters()
      }
    });
  } catch (error) {
    return next(new AppError('获取摩托车列表失败', 500));
  }
});

// 获取可用的筛选选项
const getAvailableFilters = asyncHandler(async (req, res, next) => {
  try {
    const [brands, categories, priceRange, powerRange] = await Promise.all([
      Motorcycle.distinct('brand'),
      Motorcycle.distinct('category'),
      Motorcycle.aggregate([
        { $group: { _id: null, min: { $min: '$price.msrp' }, max: { $max: '$price.msrp' } } }
      ]),
      Motorcycle.aggregate([
        { $group: { _id: null, min: { $min: '$performance.power.hp' }, max: { $max: '$performance.power.hp' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      filters: {
        brands: brands.sort(),
        categories: categories.sort(),
        priceRange: priceRange[0] || { min: 0, max: 0 },
        powerRange: powerRange[0] || { min: 0, max: 0 }
      }
    });
  } catch (error) {
    return next(new AppError('获取筛选选项失败', 500));
  }
});

// 根据 ID 获取摩托车
const getMotorcycleById = asyncHandler(async (req, res, next) => {
  try {
    const motorcycle = await Motorcycle.findById(req.params.id);
    if (!motorcycle) {
      return next(new AppError('摩托车不存在', 404));
    }

    // 获取评价统计
    const reviewStats = await Review.getMotorcycleStats(req.params.id);
    
    // 获取相关摩托车（同品牌或同类别）
    const relatedMotorcycles = await Motorcycle.find({
      $and: [
        { _id: { $ne: req.params.id } },
        {
          $or: [
            { brand: motorcycle.brand },
            { category: motorcycle.category }
          ]
        }
      ]
    }).limit(4).select('brand model year price images rating');

    // 检查是否在用户收藏中（如果用户已登录）
    let isFavorite = false;
    if (req.user) {
      const user = await require('../models/User').findById(req.user._id);
      isFavorite = user.favorites.includes(req.params.id);
    }

    res.status(200).json({
      success: true,
      motorcycle: {
        ...motorcycle.toObject(),
        reviewStats: reviewStats[0] || null,
        isFavorite
      },
      relatedMotorcycles
    });
  } catch (error) {
    return next(new AppError('获取摩托车详情失败', 500));
  }
});

// 根据 slug 获取摩托车
const getMotorcycleBySlug = asyncHandler(async (req, res, next) => {
  try {
    const motorcycle = await Motorcycle.findOne({ 'seo.slug': req.params.slug });
    if (!motorcycle) {
      return next(new AppError('摩托车不存在', 404));
    }

    // 获取评价统计
    const reviewStats = await Review.getMotorcycleStats(motorcycle._id);
    
    // 获取相关摩托车
    const relatedMotorcycles = await Motorcycle.find({
      $and: [
        { _id: { $ne: motorcycle._id } },
        {
          $or: [
            { brand: motorcycle.brand },
            { category: motorcycle.category }
          ]
        }
      ]
    }).limit(4).select('brand model year price images rating');

    // 检查是否在用户收藏中
    let isFavorite = false;
    if (req.user) {
      const user = await require('../models/User').findById(req.user._id);
      isFavorite = user.favorites.includes(motorcycle._id);
    }

    res.status(200).json({
      success: true,
      motorcycle: {
        ...motorcycle.toObject(),
        reviewStats: reviewStats[0] || null,
        isFavorite
      },
      relatedMotorcycles
    });
  } catch (error) {
    return next(new AppError('获取摩托车详情失败', 500));
  }
});

// 创建摩托车
const createMotorcycle = asyncHandler(async (req, res, next) => {
  try {
    const motorcycle = new Motorcycle({
      ...req.body,
      createdBy: req.user._id
    });
    await motorcycle.save();
    
    res.status(201).json({
      success: true,
      message: '摩托车创建成功',
      motorcycle
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('该摩托车已存在', 400));
    }
    return next(new AppError('创建摩托车失败', 500));
  }
});

// 更新摩托车
const updateMotorcycle = asyncHandler(async (req, res, next) => {
  try {
    const motorcycle = await Motorcycle.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!motorcycle) {
      return next(new AppError('摩托车不存在', 404));
    }

    res.status(200).json({
      success: true,
      message: '摩托车更新成功',
      motorcycle
    });
  } catch (error) {
    return next(new AppError('更新摩托车失败', 500));
  }
});

// 删除摩托车
const deleteMotorcycle = asyncHandler(async (req, res, next) => {
  try {
    const motorcycle = await Motorcycle.findByIdAndDelete(req.params.id);
    
    if (!motorcycle) {
      return next(new AppError('摩托车不存在', 404));
    }

    // 删除相关评价
    await Review.deleteMany({ motorcycle: req.params.id });

    // TODO: 删除相关图片文件

    res.status(200).json({
      success: true,
      message: '摩托车删除成功'
    });
  } catch (error) {
    return next(new AppError('删除摩托车失败', 500));
  }
});

// 获取统计数据
const getStatistics = asyncHandler(async (req, res, next) => {
  try {
    const stats = await Promise.all([
      Motorcycle.countDocuments(),
      Motorcycle.distinct('brand').then(brands => brands.length),
      Motorcycle.distinct('category').then(categories => categories.length),
      Motorcycle.aggregate([
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Motorcycle.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const totalReviews = await Review.countDocuments({ status: 'approved' });
    const avgRating = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating.overall' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: stats[0],
        brands: stats[1],
        categories: stats[2],
        topBrands: stats[3],
        categoryDistribution: stats[4],
        totalReviews,
        avgRating: avgRating[0]?.avg || 0
      }
    });
  } catch (error) {
    return next(new AppError('获取统计数据失败', 500));
  }
});

// 搜索摩托车
const searchMotorcycles = asyncHandler(async (req, res, next) => {
  const {
    q, // 搜索关键词
    page = 1,
    limit = 12,
    sortBy = 'relevance',
    sortOrder = 'desc'
  } = req.query;

  if (!q || q.trim().length < 2) {
    return next(new AppError('搜索关键词至少需要2个字符', 400));
  }

  const searchQuery = {
    $or: [
      { brand: { $regex: q, $options: 'i' } },
      { model: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
      { features: { $in: [new RegExp(q, 'i')] } },
      { 'seo.metaTitle': { $regex: q, $options: 'i' } },
      { 'seo.metaDescription': { $regex: q, $options: 'i' } }
    ],
    status: 'active'
  };

  let sortOptions = {};
  if (sortBy === 'relevance') {
    // MongoDB文本搜索评分
    sortOptions = { score: { $meta: 'textScore' } };
  } else {
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  const motorcycles = await Motorcycle.find(searchQuery)
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('brand model year price images rating category');

  const total = await Motorcycle.countDocuments(searchQuery);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    query: q,
    motorcycles,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// 获取品牌列表
const getBrands = asyncHandler(async (req, res, next) => {
  const brands = await Motorcycle.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$brand',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price.msrp' },
        categories: { $addToSet: '$category' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    brands: brands.map(brand => ({
      name: brand._id,
      count: brand.count,
      avgPrice: brand.avgPrice,
      categories: brand.categories
    }))
  });
});

// 获取类别列表
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Motorcycle.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price.msrp' },
        brands: { $addToSet: '$brand' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    categories: categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      avgPrice: cat.avgPrice,
      brands: cat.brands
    }))
  });
});

// 比较摩托车
const compareMotorcycles = asyncHandler(async (req, res, next) => {
  const { ids } = req.query;
  
  if (!ids) {
    return next(new AppError('请提供要比较的摩托车ID', 400));
  }

  const motorcycleIds = ids.split(',').slice(0, 4); // 最多比较4辆
  
  if (motorcycleIds.length < 2) {
    return next(new AppError('至少需要选择2辆摩托车进行比较', 400));
  }

  const motorcycles = await Motorcycle.find({
    _id: { $in: motorcycleIds },
    status: 'active'
  });

  if (motorcycles.length !== motorcycleIds.length) {
    return next(new AppError('部分摩托车不存在或已下架', 400));
  }

  res.status(200).json({
    success: true,
    motorcycles,
    comparisonFields: [
      'price.msrp',
      'engine.displacement',
      'performance.power.hp',
      'performance.torque.nm',
      'dimensions.weight.wet',
      'performance.topSpeed',
      'performance.fuelEconomy.combined',
      'rating.overall'
    ]
  });
});

// 批量更新
const batchUpdate = asyncHandler(async (req, res, next) => {
  const { ids, updateData } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new AppError('请提供要更新的摩托车ID列表', 400));
  }

  const result = await Motorcycle.updateMany(
    { _id: { $in: ids } },
    {
      ...updateData,
      updatedBy: req.user._id,
      updatedAt: new Date()
    }
  );

  res.status(200).json({
    success: true,
    message: `成功更新 ${result.modifiedCount} 辆摩托车`,
    modifiedCount: result.modifiedCount
  });
});

// 批量删除
const batchDelete = asyncHandler(async (req, res, next) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new AppError('请提供要删除的摩托车ID列表', 400));
  }

  // 删除摩托车
  const deleteResult = await Motorcycle.deleteMany({ _id: { $in: ids } });
  
  // 删除相关评价
  await Review.deleteMany({ motorcycle: { $in: ids } });

  res.status(200).json({
    success: true,
    message: `成功删除 ${deleteResult.deletedCount} 辆摩托车`,
    deletedCount: deleteResult.deletedCount
  });
});

// 数据导入
const importData = asyncHandler(async (req, res, next) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return next(new AppError('请提供有效的数据数组', 400));
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const item of data) {
      try {
        const motorcycle = new Motorcycle({
          ...item,
          createdBy: req.user._id
        });
        await motorcycle.save();
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          item: item.brand + ' ' + item.model,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
      results
    });
  } catch (error) {
    return next(new AppError('数据导入失败', 500));
  }
});

// 数据导出
const exportData = asyncHandler(async (req, res, next) => {
  const { format = 'json', fields } = req.query;
  
  const motorcycles = await Motorcycle.find({ status: 'active' });
  
  if (format === 'csv') {
    // CSV导出逻辑
    const csvData = motorcycles.map(m => ({
      brand: m.brand,
      model: m.model,
      year: m.year,
      category: m.category,
      price: m.price?.msrp,
      displacement: m.engine?.displacement,
      power: m.performance?.power?.hp,
      weight: m.dimensions?.weight?.wet
    }));
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=motorcycles.csv');
    
    // 这里需要实现CSV转换逻辑
    res.status(200).send(JSON.stringify(csvData));
  } else {
    res.status(200).json({
      success: true,
      data: motorcycles,
      count: motorcycles.length,
      exportedAt: new Date().toISOString()
    });
  }
});

module.exports = {
  getAllMotorcycles,
  getMotorcycleById,
  getMotorcycleBySlug,
  createMotorcycle,
  updateMotorcycle,
  deleteMotorcycle,
  getStatistics,
  getAvailableFilters,
  searchMotorcycles,
  getBrands,
  getCategories,
  compareMotorcycles,
  batchUpdate,
  batchDelete,
  importData,
  exportData
};