// services/user.js
const { api } = require('../utils/request')

// 用户服务
const userService = {
  // 微信登录
  wxLogin: (code) => {
    return api.post('/auth/wechat', { code })
  },

  // 获取用户信息
  getUserInfo: () => {
    return api.get('/user/profile')
  },

  // 更新用户信息
  updateUserInfo: (data) => {
    return api.put('/user/profile', data)
  },

  // 获取收藏列表
  getFavorites: (params = {}) => {
    return api.get('/user/favorites', params)
  },

  // 添加收藏
  addFavorite: (motorcycleId, notes = '') => {
    return api.post('/user/favorites', { motorcycleId, notes })
  },

  // 取消收藏
  removeFavorite: (motorcycleId) => {
    return api.delete(`/user/favorites/${motorcycleId}`)
  },

  // 检查是否已收藏
  checkFavorite: (motorcycleId) => {
    return api.get(`/user/favorites/check/${motorcycleId}`)
  },

  // 获取浏览历史
  getHistory: (params = {}) => {
    return api.get('/user/history', params)
  },

  // 添加浏览历史
  addHistory: (motorcycleId) => {
    return api.post('/user/history', { motorcycleId })
  },

  // 清空浏览历史
  clearHistory: () => {
    return api.delete('/user/history')
  },

  // 获取搜索历史
  getSearchHistory: () => {
    return api.get('/user/search-history')
  },

  // 添加搜索历史
  addSearchHistory: (keyword) => {
    return api.post('/user/search-history', { keyword })
  },

  // 删除搜索历史
  removeSearchHistory: (keyword) => {
    return api.delete('/user/search-history', { keyword })
  },

  // 清空搜索历史
  clearSearchHistory: () => {
    return api.delete('/user/search-history/all')
  },

  // 获取用户评价
  getUserReviews: (params = {}) => {
    return api.get('/user/reviews', params)
  },

  // 提交反馈
  submitFeedback: (data) => {
    return api.post('/user/feedback', data)
  },

  // 举报内容
  reportContent: (data) => {
    return api.post('/user/report', data)
  }
}

module.exports = userService