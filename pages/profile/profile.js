// pages/profile/profile.js
const userService = require('../../services/user')
const motorcycleService = require('../../services/motorcycle')
const { showToast, showModal, getShareConfig } = require('../../utils/util')

const app = getApp()

Page({
  data: {
    userInfo: {},
    stats: {
      favorites: 0,
      history: 0,
      reviews: 0
    },
    compareCount: 0,
    recommendations: [],
    version: '1.0.0'
  },

  onLoad() {
    console.log('个人中心加载')
    this.loadUserInfo()
    this.loadVersion()
  },

  onShow() {
    this.loadUserInfo()
    this.loadUserStats()
    this.loadCompareCount()
    this.loadRecommendations()
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadUserInfo(),
      this.loadUserStats(),
      this.loadRecommendations()
    ]).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })
    
    // 如果已登录，从服务器获取最新信息
    if (userInfo.nickName) {
      this.fetchUserProfile()
    }
  },

  // 从服务器获取用户信息
  async fetchUserProfile() {
    try {
      const profile = await userService.getUserInfo()
      
      if (profile) {
        const userInfo = {
          ...this.data.userInfo,
          ...profile
        }
        
        this.setData({ userInfo })
        wx.setStorageSync('userInfo', userInfo)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  // 加载用户统计
  async loadUserStats() {
    if (!this.data.userInfo.nickName) return
    
    try {
      const [favorites, history, reviews] = await Promise.all([
        userService.getFavorites({ count: true }),
        userService.getHistory({ count: true }),
        userService.getUserReviews({ count: true })
      ])
      
      this.setData({
        stats: {
          favorites: favorites.total || 0,
          history: history.total || 0,
          reviews: reviews.total || 0
        }
      })
    } catch (error) {
      console.error('加载用户统计失败:', error)
    }
  },

  // 加载对比数量
  loadCompareCount() {
    const compareItems = wx.getStorageSync('compareItems') || []
    this.setData({ compareCount: compareItems.length })
  },

  // 加载推荐摩托车
  async loadRecommendations() {
    if (!this.data.userInfo.nickName) return
    
    try {
      const result = await motorcycleService.getRecommendedMotorcycles(5)
      
      if (result && result.motorcycles) {
        this.setData({
          recommendations: result.motorcycles
        })
      }
    } catch (error) {
      console.error('加载推荐失败:', error)
    }
  },

  // 加载版本信息
  loadVersion() {
    this.setData({
      version: app.globalData.version || '1.0.0'
    })
  },

  // 选择头像
  chooseAvatar() {
    if (!this.data.userInfo.nickName) {
      this.login()
      return
    }
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadAvatar(tempFilePath)
      }
    })
  },

  // 上传头像
  async uploadAvatar(filePath) {
    try {
      wx.showLoading({ title: '上传中...' })
      
      // 这里应该调用上传头像的API
      // const result = await userService.uploadAvatar(filePath)
      
      // 暂时更新本地头像
      const userInfo = {
        ...this.data.userInfo,
        avatarUrl: filePath
      }
      
      this.setData({ userInfo })
      wx.setStorageSync('userInfo', userInfo)
      
      showToast('头像更新成功')
    } catch (error) {
      console.error('上传头像失败:', error)
      showToast('上传失败，请重试', 'error')
    } finally {
      wx.hideLoading()
    }
  },

  // 微信登录
  async login() {
    try {
      // 获取用户信息
      const userProfile = await this.getUserProfile()
      
      if (userProfile) {
        // 获取登录凭证
        const loginResult = await this.wxLogin()
        
        if (loginResult.code) {
          // 发送到服务器进行登录
          const result = await userService.wxLogin(loginResult.code)
          
          if (result && result.token) {
            // 保存登录信息
            wx.setStorageSync('token', result.token)
            wx.setStorageSync('userInfo', {
              ...userProfile.userInfo,
              ...result.user
            })
            
            this.setData({
              userInfo: {
                ...userProfile.userInfo,
                ...result.user
              }
            })
            
            showToast('登录成功')
            
            // 加载用户数据
            this.loadUserStats()
            this.loadRecommendations()
          }
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      showToast('登录失败，请重试', 'error')
    }
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: resolve,
        fail: reject
      })
    })
  },

  // 微信登录
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })
  },

  // 退出登录
  async logout() {
    const confirm = await showModal('退出登录', '确定要退出登录吗？')
    
    if (confirm) {
      // 清除本地数据
      wx.removeStorageSync('token')
      wx.removeStorageSync('userInfo')
      
      this.setData({
        userInfo: {},
        stats: {
          favorites: 0,
          history: 0,
          reviews: 0
        },
        recommendations: []
      })
      
      showToast('已退出登录')
    }
  },

  // 跳转到收藏页
  goToFavorites() {
    if (!this.checkLogin()) return
    
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  // 跳转到历史页
  goToHistory() {
    if (!this.checkLogin()) return
    
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  // 跳转到评价页
  goToReviews() {
    if (!this.checkLogin()) return
    
    wx.navigateTo({
      url: '/pages/reviews/reviews?type=user'
    })
  },

  // 跳转到对比页
  goToCompare() {
    const compareItems = wx.getStorageSync('compareItems') || []
    
    if (compareItems.length === 0) {
      showToast('暂无对比车型')
      return
    }
    
    const ids = compareItems.map(item => item._id)
    wx.navigateTo({
      url: `/pages/compare/compare?ids=${ids.join(',')}`
    })
  },

  // 跳转到设置页
  goToSettings() {
    wx.navigateTo({
      url: '/subpackages/user/settings/settings'
    })
  },

  // 跳转到反馈页
  goToFeedback() {
    if (!this.checkLogin()) return
    
    wx.navigateTo({
      url: '/subpackages/user/feedback/feedback'
    })
  },

  // 跳转到关于页
  goToAbout() {
    wx.navigateTo({
      url: '/subpackages/user/about/about'
    })
  },

  // 联系客服
  contactCustomerService() {
    wx.showActionSheet({
      itemList: ['在线客服', '电话客服', '邮件反馈'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 打开客服会话
            wx.openCustomerServiceChat({
              extInfo: { url: 'https://work.weixin.qq.com/xxx' },
              corpId: 'corpId',
              success: () => console.log('客服会话打开成功'),
              fail: () => showToast('客服暂不可用')
            })
            break
          case 1:
            // 拨打电话
            wx.makePhoneCall({
              phoneNumber: '400-123-4567'
            })
            break
          case 2:
            // 复制邮箱
            wx.setClipboardData({
              data: 'support@motorcycle.com',
              success: () => showToast('邮箱已复制到剪贴板')
            })
            break
        }
      }
    })
  },

  // 分享应用
  shareApp() {
    // 触发分享
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 检查登录状态
  checkLogin() {
    if (!this.data.userInfo.nickName) {
      showToast('请先登录')
      this.login()
      return false
    }
    return true
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