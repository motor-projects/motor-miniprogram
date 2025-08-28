// 标准化API响应格式

class ApiResponse {
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    this.timestamp = new Date().toISOString();
    
    if (data !== null) {
      this.data = data;
    }
    
    if (meta !== null) {
      this.meta = meta;
    }
  }

  static success(message = '操作成功', data = null, meta = null) {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message = '操作失败', data = null) {
    return new ApiResponse(false, message, data);
  }

  static paginated(data, pagination, message = '获取成功') {
    return new ApiResponse(true, message, data, { pagination });
  }
}

// 响应中间件
const sendResponse = (req, res, next) => {
  res.success = (message, data, meta) => {
    return res.json(ApiResponse.success(message, data, meta));
  };

  res.error = (message, statusCode = 400, data = null) => {
    return res.status(statusCode).json(ApiResponse.error(message, data));
  };

  res.paginated = (data, pagination, message) => {
    return res.json(ApiResponse.paginated(data, pagination, message));
  };

  next();
};

// 分页帮助函数
const getPagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (currentPage - 1) * pageSize;

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems: total,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    offset
  };
};

// 排序帮助函数
const getSortOptions = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const allowedSortFields = [
    'createdAt', 'updatedAt', 'year', 'price.msrp', 
    'performance.power.hp', 'rating.overall', 'brand', 'model'
  ];
  
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
  
  const sortOptions = {};
  sortOptions[sortField] = order === 'desc' ? -1 : 1;
  
  return sortOptions;
};

// 构建查询过滤器
const buildFilter = (queryParams) => {
  const filter = {};
  const {
    brand,
    category,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minYear,
    maxYear,
    status = 'active',
    search
  } = queryParams;

  // 基本状态过滤
  if (status) {
    filter.status = status;
  }

  // 品牌过滤
  if (brand) {
    const brands = Array.isArray(brand) ? brand : brand.split(',');
    filter.brand = { $in: brands };
  }

  // 类别过滤
  if (category) {
    const categories = Array.isArray(category) ? category : category.split(',');
    filter.category = { $in: categories };
  }

  // 价格范围过滤
  if (minPrice || maxPrice) {
    filter['price.msrp'] = {};
    if (minPrice) filter['price.msrp'].$gte = parseFloat(minPrice);
    if (maxPrice) filter['price.msrp'].$lte = parseFloat(maxPrice);
  }

  // 功率范围过滤
  if (minPower || maxPower) {
    filter['performance.power.hp'] = {};
    if (minPower) filter['performance.power.hp'].$gte = parseFloat(minPower);
    if (maxPower) filter['performance.power.hp'].$lte = parseFloat(maxPower);
  }

  // 年份范围过滤
  if (minYear || maxYear) {
    filter.year = {};
    if (minYear) filter.year.$gte = parseInt(minYear);
    if (maxYear) filter.year.$lte = parseInt(maxYear);
  }

  // 搜索过滤
  if (search && search.trim()) {
    filter.$or = [
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
      { features: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  return filter;
};

// 字段选择帮助函数
const getSelectFields = (fields) => {
  if (!fields) return '';
  
  const allowedFields = [
    'brand', 'model', 'year', 'category', 'price', 'images', 
    'rating', 'engine.displacement', 'performance.power.hp',
    'dimensions.weight.wet', 'createdAt', 'updatedAt'
  ];
  
  const requestedFields = fields.split(',');
  const validFields = requestedFields.filter(field => 
    allowedFields.includes(field.trim())
  );
  
  return validFields.join(' ');
};

// 数据清理函数
const sanitizeData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    // 移除敏感字段
    if (['password', 'passwordResetToken', 'emailVerificationToken'].includes(key)) {
      continue;
    }
    
    // 递归清理嵌套对象
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeData(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// 缓存键生成器
const generateCacheKey = (prefix, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = params[key];
      return sorted;
    }, {});
  
  const paramsString = JSON.stringify(sortedParams);
  return `${prefix}:${Buffer.from(paramsString).toString('base64')}`;
};

module.exports = {
  ApiResponse,
  sendResponse,
  getPagination,
  getSortOptions,
  buildFilter,
  getSelectFields,
  sanitizeData,
  generateCacheKey
};