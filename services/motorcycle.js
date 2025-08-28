// services/motorcycle.js
const { api } = require('../utils/request')

// 摩托车服务
const motorcycleService = {
  // 获取摩托车列表
  getMotorcycles: (params = {}) => {
    return api.get('/motorcycles', params)
  },

  // 根据ID获取摩托车详情
  getMotorcycleById: (id) => {
    return api.get(`/motorcycles/${id}`)
  },

  // 根据slug获取摩托车详情
  getMotorcycleBySlug: (slug) => {
    return api.get(`/motorcycles/slug/${slug}`)
  },

  // 搜索摩托车
  searchMotorcycles: (keyword, filters = {}) => {
    return api.get('/motorcycles', {
      search: keyword,
      ...filters
    })
  },

  // 获取热门摩托车
  getHotMotorcycles: (limit = 10) => {
    return api.get('/motorcycles', {
      sortBy: 'popularity',
      sortOrder: 'desc',
      limit
    })
  },

  // 获取推荐摩托车
  getRecommendedMotorcycles: (limit = 10) => {
    return api.get('/motorcycles', {
      featured: true,
      limit
    })
  },

  // 获取品牌列表
  getBrands: () => {
    return api.get('/motorcycles/brands')
  },

  // 获取分类列表
  getCategories: () => {
    return api.get('/motorcycles/categories')
  },

  // 获取筛选选项
  getFilterOptions: () => {
    return api.get('/motorcycles/filters')
  },

  // 获取统计数据
  getStatistics: () => {
    return api.get('/motorcycles/stats')
  },

  // 获取对比数据
  getCompareData: (ids) => {
    return api.post('/motorcycles/compare', { ids })
  }
}

module.exports = motorcycleService