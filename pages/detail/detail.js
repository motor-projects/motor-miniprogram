// pages/detail/detail.js
const motorcycleService = require('../../services/motorcycle')
const userService = require('../../services/user')
const reviewService = require('../../services/review')
const { 
  showToast, 
  formatPrice, 
  formatPower, 
  formatRelativeTime, 
  previewImages, 
  getShareConfig 
} = require('../../utils/util')

Page({
  data: {
    motorcycle: {},
    reviews: [],
    similarMotorcycles: [],
    activeTab: 'specs',
    loading: false,
    isInCompare: false,
    compareCount: 0,
    hasMoreReviews: false,
    reviewPage: 1
  },

  onLoad(options) {
    console.log('详情页加载:', options)
    
    if (options.id) {
      this.motorcycleId = options.id
      this.loadMotorcycleDetail()
    } else if (options.slug) {
      this.motorcycleSlug = options.slug
      this.loadMotorcycleBySlug()
    } else {
      showToast('参数错误', 'error')
      wx.navigateBack()
    }
  },

  onShow() {
    this.checkCompareStatus()
    this.loadCompareCount()
  },

  onPullDownRefresh() {
    this.loadMotorcycleDetail().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载摩托车详情
  async loadMotorcycleDetail() {
    if (!this.motorcycleId) return
    
    this.setData({ loading: true })
    
    try {
      const motorcycle = await motorcycleService.getMotorcycleById(this.motorcycleId)
      
      // 格式化数据
      this.formatMotorcycleData(motorcycle)
      
      this.setData({ motorcycle })
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: `${motorcycle.brand} ${motorcycle.model}`
      })
      
      // 并行加载其他数据
      this.loadRelatedData()
      
    } catch (error) {
      console.error('加载摩托车详情失败:', error)
      showToast('加载失败，请重试', 'error')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 根据slug加载摩托车详情
  async loadMotorcycleBySlug() {
    if (!this.motorcycleSlug) return
    
    try {
      const motorcycle = await motorcycleService.getMotorcycleBySlug(this.motorcycleSlug)
      this.motorcycleId = motorcycle._id
      this.formatMotorcycleData(motorcycle)
      this.setData({ motorcycle })
      
      wx.setNavigationBarTitle({
        title: `${motorcycle.brand} ${motorcycle.model}`
      })
      
      this.loadRelatedData()
    } catch (error) {
      console.error('加载摩托车详情失败:', error)
      showToast('加载失败，请重试', 'error')
    }
  },

  // 格式化摩托车数据
  formatMotorcycleData(motorcycle) {
    // 格式化价格
    if (motorcycle.price && motorcycle.price.msrp) {
      motorcycle.price.formattedMsrp = formatPrice(motorcycle.price.msrp)
    }
    
    // 格式化功率
    if (motorcycle.performance && motorcycle.performance.power) {
      motorcycle.performance.power.formatted = formatPower(motorcycle.performance.power)
    }
    
    // 检查是否已收藏
    this.checkFavoriteStatus(motorcycle._id)
  },

  // 加载相关数据
  async loadRelatedData() {
    await Promise.all([
      this.loadReviews(),
      this.loadSimilarMotorcycles(),
      this.addToHistory()
    ])
  },

  // 加载评价
  async loadReviews(reset = true) {
    try {
      const page = reset ? 1 : this.data.reviewPage + 1
      const result = await reviewService.getReviews(this.motorcycleId, {
        page,
        limit: 5,
        sortBy: 'helpful',
        sortOrder: 'desc'
      })
      
      if (result && result.reviews) {
        // 格式化评价时间
        result.reviews.forEach(review => {
          review.createdAt = formatRelativeTime(review.createdAt)
        })
        
        const reviews = reset ? result.reviews : [...this.data.reviews, ...result.reviews]
        
        this.setData({
          reviews,
          hasMoreReviews: result.pagination.hasNext,
          reviewPage: page
        })
      }
    } catch (error) {
      console.error('加载评价失败:', error)
    }
  },

  // 加载相似摩托车
  async loadSimilarMotorcycles() {
    try {
      const { motorcycle } = this.data
      const result = await motorcycleService.getMotorcycles({
        category: motorcycle.category,
        brand: motorcycle.brand,
        limit: 10,
        exclude: motorcycle._id
      })
      
      if (result && result.motorcycles) {
        this.setData({
          similarMotorcycles: result.motorcycles.slice(0, 5)
        })
      }
    } catch (error) {
      console.error('加载相似摩托车失败:', error)
    }
  },

  // 添加到浏览历史
  async addToHistory() {
    try {
      await userService.addHistory(this.motorcycleId)
    } catch (error) {
      console.error('添加浏览历史失败:', error)
    }
  },

  // 检查收藏状态
  async checkFavoriteStatus(motorcycleId) {
    try {
      const result = await userService.checkFavorite(motorcycleId)
      
      this.setData({
        'motorcycle.isFavorited': result.isFavorited
      })
    } catch (error) {
      console.error('检查收藏状态失败:', error)
    }
  },

  // 检查对比状态
  checkCompareStatus() {
    const compareItems = wx.getStorageSync('compareItems') || []
    const isInCompare = compareItems.some(item => item._id === this.motorcycleId)
    
    this.setData({ isInCompare })
  },

  // 加载对比数量
  loadCompareCount() {
    const compareItems = wx.getStorageSync('compareItems') || []
    this.setData({ compareCount: compareItems.length })
  },

  // 切换标签
  changeTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    
    // 如果是评价标签且没有加载过评价，则加载
    if (tab === 'reviews' && this.data.reviews.length === 0) {
      this.loadReviews()
    }
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset
    const { motorcycle } = this.data
    const urls = motorcycle.images.map(img => img.url)
    
    previewImages(urls, index)
  },

  // 预览评价图片
  previewReviewImage(e) {
    const { images, current } = e.currentTarget.dataset
    previewImages(images, current)
  },

  // 切换收藏
  async toggleFavorite() {
    const { motorcycle } = this.data
    
    try {
      if (motorcycle.isFavorited) {
        await userService.removeFavorite(motorcycle._id)
        showToast('已取消收藏')
      } else {
        await userService.addFavorite(motorcycle._id)
        showToast('已添加收藏')
      }
      
      this.setData({
        'motorcycle.isFavorited': !motorcycle.isFavorited
      })
    } catch (error) {
      console.error('收藏操作失败:', error)
      showToast('操作失败，请重试', 'error')
    }
  },

  // 加入对比
  addToCompare() {
    const { motorcycle, isInCompare } = this.data
    let compareItems = wx.getStorageSync('compareItems') || []
    
    if (isInCompare) {
      // 移除对比
      compareItems = compareItems.filter(item => item._id !== motorcycle._id)
      showToast('已移除对比')
    } else {
      // 检查数量限制
      if (compareItems.length >= 3) {
        showToast('最多只能对比3款摩托车')
        return
      }
      
      // 添加到对比
      compareItems.push(motorcycle)
      showToast('已加入对比')
    }
    
    wx.setStorageSync('compareItems', compareItems)
    
    this.setData({
      isInCompare: !isInCompare,
      compareCount: compareItems.length
    })
  },

  // 跳转到对比页面
  goToCompare() {
    const compareItems = wx.getStorageSync('compareItems') || []
    
    if (compareItems.length < 2) {
      showToast('至少选择2款摩托车进行对比')
      return
    }
    
    const ids = compareItems.map(item => item._id)
    wx.navigateTo({
      url: `/pages/compare/compare?ids=${ids.join(',')}`
    })
  },

  // 跳转到评价页面
  goToReviews() {
    wx.navigateTo({
      url: `/pages/reviews/reviews?motorcycleId=${this.motorcycleId}`
    })
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    
    wx.redirectTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 加载更多评价
  loadMoreReviews() {
    this.loadReviews(false)
  },

  // 切换评价有用
  async toggleHelpful(e) {
    const reviewId = e.currentTarget.dataset.id
    const review = this.data.reviews.find(item => item._id === reviewId)
    
    if (!review) return
    
    try {
      if (review.isHelpful) {
        await reviewService.unlikeReview(reviewId)
        review.helpful.count--
      } else {
        await reviewService.likeReview(reviewId)
        review.helpful.count++
      }
      
      review.isHelpful = !review.isHelpful
      
      this.setData({ reviews: this.data.reviews })
    } catch (error) {
      console.error('点赞操作失败:', error)
      showToast('操作失败，请重试', 'error')
    }
  },

  // 联系经销商
  contactDealer() {
    // 这里可以实现联系经销商的功能
    // 比如拨打电话、跳转到客服等
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    })
  },

  // 分享摩托车
  shareMotorcycle() {
    // 触发分享
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 分享配置
  onShareAppMessage() {
    const { motorcycle } = this.data
    
    return getShareConfig({
      title: `${motorcycle.brand} ${motorcycle.model} - 详细参数配置`,
      path: `/pages/detail/detail?id=${motorcycle._id}`,
      imageUrl: motorcycle.images && motorcycle.images[0] ? motorcycle.images[0].url : ''
    })
  },

  onShareTimeline() {
    const { motorcycle } = this.data
    
    return getShareConfig({
      title: `${motorcycle.brand} ${motorcycle.model} - 摩托车参数配置详情`,
      query: `id=${motorcycle._id}`,
      imageUrl: motorcycle.images && motorcycle.images[0] ? motorcycle.images[0].url : ''
    })
  }
})