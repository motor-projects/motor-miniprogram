// pages/index/index.js
const motorcycleService = require('../../services/motorcycle')
const { showToast, getShareConfig } = require('../../utils/util')

Page({
  data: {
    banners: [
      {
        id: 1,
        image: 'https://via.placeholder.com/750x300/3b82f6/ffffff?text=摩托车展示1',
        title: '最新摩托车发布',
        link: '/pages/list/list'
      },
      {
        id: 2,
        image: 'https://via.placeholder.com/750x300/ef4444/ffffff?text=摩托车展示2',
        title: '热门车型推荐',
        link: '/pages/list/list?category=sport'
      },
      {
        id: 3,
        image: 'https://via.placeholder.com/750x300/10b981/ffffff?text=摩托车展示3',
        title: '新手入门指南',
        link: '/pages/list/list?category=beginner'
      }
    ],
    categories: [
      { name: '运动车', icon: '/images/category-sport.png', value: 'sport' },
      { name: '街车', icon: '/images/category-naked.png', value: 'naked' },
      { name: '巡航车', icon: '/images/category-cruiser.png', value: 'cruiser' },
      { name: '越野车', icon: '/images/category-offroad.png', value: 'offroad' },
      { name: '踏板车', icon: '/images/category-scooter.png', value: 'scooter' },
      { name: '复古车', icon: '/images/category-retro.png', value: 'retro' },
      { name: '电动车', icon: '/images/category-electric.png', value: 'electric' },
      { name: '更多', icon: '/images/category-more.png', value: 'more' }
    ],
    hotMotorcycles: [],
    news: [
      {
        id: 1,
        title: '2024年度最佳摩托车评选结果揭晓',
        image: 'https://via.placeholder.com/200x120/3b82f6/ffffff?text=新闻1',
        time: '2小时前'
      },
      {
        id: 2,
        title: '春季摩托车保养指南完整版',
        image: 'https://via.placeholder.com/200x120/ef4444/ffffff?text=新闻2',
        time: '5小时前'
      },
      {
        id: 3,
        title: '新手选购摩托车的十大要点',
        image: 'https://via.placeholder.com/200x120/10b981/ffffff?text=新闻3',
        time: '1天前'
      }
    ],
    loading: false,
    refreshing: false
  },

  onLoad(options) {
    console.log('首页加载:', options)
    this.loadData()
    
    // 记录页面访问
    this.recordPageView()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.hotMotorcycles.length === 0) {
      this.loadData()
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadData().finally(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    // 首页通常不需要加载更多
  },

  // 加载页面数据
  loadData() {
    this.setData({ loading: true })
    
    return Promise.all([
      this.loadHotMotorcycles(),
      this.loadStatistics()
    ]).finally(() => {
      this.setData({ loading: false })
    })
  },

  // 加载热门摩托车
  async loadHotMotorcycles() {
    try {
      const result = await motorcycleService.getHotMotorcycles(8)
      
      if (result && result.motorcycles) {
        this.setData({
          hotMotorcycles: result.motorcycles
        })
      }
    } catch (error) {
      console.error('加载热门摩托车失败:', error)
      showToast('加载失败，请重试', 'error')
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const stats = await motorcycleService.getStatistics()
      console.log('统计数据:', stats)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 记录页面访问
  recordPageView() {
    // 这里可以添加统计代码
    console.log('记录首页访问')
  },

  // 点击搜索框
  goToSearch() {
    wx.switchTab({
      url: '/pages/search/search'
    })
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    
    if (category === 'more') {
      wx.navigateTo({
        url: '/pages/category/category'
      })
    } else {
      wx.switchTab({
        url: `/pages/list/list?category=${category}`
      })
    }
  },

  // 查看更多摩托车
  goToList() {
    wx.switchTab({
      url: '/pages/list/list'
    })
  },

  // 进入摩托车详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 点击轮播图
  onBannerTap(e) {
    const banner = this.data.banners[e.detail.current]
    if (banner && banner.link) {
      wx.navigateTo({
        url: banner.link
      })
    }
  },

  // 点击新闻
  onNewsTap(e) {
    const newsId = e.currentTarget.dataset.id
    // 这里可以跳转到新闻详情页或外部链接
    showToast('功能开发中')
  },

  // 分享配置
  onShareAppMessage() {
    return getShareConfig({
      title: '摩托车数据 - 发现你的理想座驾',
      path: '/pages/index/index'
    })
  },

  onShareTimeline() {
    return getShareConfig({
      title: '摩托车数据 - 发现你的理想座驾'
    })
  }
})