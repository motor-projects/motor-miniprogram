// app.js
App({
  onLaunch() {
    // 小程序启动时触发
    console.log('摩托车数据小程序启动')
    
    // 检查更新
    this.checkForUpdate()
    
    // 初始化用户信息
    this.initUserInfo()
  },

  onShow() {
    // 小程序显示时触发
  },

  onHide() {
    // 小程序隐藏时触发
  },

  checkForUpdate() {
    const updateManager = wx.getUpdateManager()
    
    updateManager.onCheckForUpdate((res) => {
      // 请求完新版本信息的回调
      console.log('检查更新:', res.hasUpdate)
    })
    
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
    
    updateManager.onUpdateFailed(() => {
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
    })
  },

  initUserInfo() {
    // 初始化用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  },

  globalData: {
    userInfo: null,
    baseUrl: wx.canIUse('getSystemInfoSync') && wx.getSystemInfoSync().platform === 'devtools' 
      ? 'http://localhost:5000/api'
      : 'https://api.motor-projects.com/api',
    version: '1.0.0'
  }
})