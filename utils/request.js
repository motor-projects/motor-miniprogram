// utils/request.js
const app = getApp()

const request = (options) => {
  return new Promise((resolve, reject) => {
    // 显示加载提示
    if (options.loading !== false) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
    }

    const { url, method = 'GET', data = {}, header = {} } = options
    
    // 构建完整的请求URL
    const baseUrl = app.globalData.baseUrl
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`

    // 获取用户token
    const token = wx.getStorageSync('token')
    if (token) {
      header.Authorization = `Bearer ${token}`
    }

    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success: (res) => {
        wx.hideLoading()
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          console.error('请求失败:', res)
          
          if (res.statusCode === 401) {
            // 未授权，跳转到登录页
            wx.removeStorageSync('token')
            wx.removeStorageSync('userInfo')
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
          
          reject(res.data || { message: '请求失败' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('网络请求失败:', err)
        
        wx.showToast({
          title: '网络连接失败',
          icon: 'error'
        })
        
        reject(err)
      }
    })
  })
}

// 封装常用请求方法
const api = {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url, data) => request({ url, method: 'DELETE', data })
}

module.exports = {
  request,
  api
}