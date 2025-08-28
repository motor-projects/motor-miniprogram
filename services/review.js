// services/review.js
const { api } = require('../utils/request')

// 评价服务
const reviewService = {
  // 获取评价列表
  getReviews: (motorcycleId, params = {}) => {
    return api.get(`/reviews/${motorcycleId}`, params)
  },

  // 获取评价详情
  getReviewById: (reviewId) => {
    return api.get(`/reviews/detail/${reviewId}`)
  },

  // 提交评价
  submitReview: (data) => {
    return api.post('/reviews', data)
  },

  // 更新评价
  updateReview: (reviewId, data) => {
    return api.put(`/reviews/${reviewId}`, data)
  },

  // 删除评价
  deleteReview: (reviewId) => {
    return api.delete(`/reviews/${reviewId}`)
  },

  // 点赞评价
  likeReview: (reviewId) => {
    return api.post(`/reviews/${reviewId}/like`)
  },

  // 取消点赞
  unlikeReview: (reviewId) => {
    return api.delete(`/reviews/${reviewId}/like`)
  },

  // 举报评价
  reportReview: (reviewId, reason) => {
    return api.post(`/reviews/${reviewId}/report`, { reason })
  },

  // 获取评价统计
  getReviewStats: (motorcycleId) => {
    return api.get(`/reviews/${motorcycleId}/stats`)
  }
}

module.exports = reviewService