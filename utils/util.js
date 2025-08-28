// utils/util.js

// 格式化时间
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 格式化相对时间
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

// 格式化价格
const formatPrice = (price) => {
  if (!price) return '暂无报价'
  
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1)}万`
  }
  
  return price.toLocaleString()
}

// 格式化功率
const formatPower = (power) => {
  if (!power) return '-'
  
  if (power.hp && power.kw) {
    return `${power.hp}HP / ${power.kw}kW`
  } else if (power.hp) {
    return `${power.hp}HP`
  } else if (power.kw) {
    return `${power.kw}kW`
  }
  
  return '-'
}

// 格式化扭矩
const formatTorque = (torque) => {
  if (!torque) return '-'
  
  if (torque.nm && torque.lbft) {
    return `${torque.nm}N·m / ${torque.lbft}lb-ft`
  } else if (torque.nm) {
    return `${torque.nm}N·m`
  } else if (torque.lbft) {
    return `${torque.lbft}lb-ft`
  }
  
  return '-'
}

// 防抖函数
const debounce = (func, delay) => {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// 节流函数
const throttle = (func, delay) => {
  let lastExecTime = 0
  return function (...args) {
    const currentTime = Date.now()
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    }
  }
}

// 深拷贝
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 获取图片信息
const getImageInfo = (src) => {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    })
  })
}

// 预览图片
const previewImages = (urls, current = 0) => {
  wx.previewImage({
    urls,
    current: typeof current === 'number' ? urls[current] : current
  })
}

// 分享配置
const shareConfig = {
  title: '摩托车数据 - 发现你的理想座驾',
  path: '/pages/index/index',
  imageUrl: '/images/share-logo.png'
}

// 获取分享配置
const getShareConfig = (customConfig = {}) => {
  return {
    ...shareConfig,
    ...customConfig
  }
}

// 保存到相册
const saveImageToPhotosAlbum = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    })
  })
}

// 获取设备信息
const getSystemInfo = () => {
  return new Promise((resolve, reject) => {
    wx.getSystemInfo({
      success: resolve,
      fail: reject
    })
  })
}

// 显示操作反馈
const showToast = (title, icon = 'success', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

const showModal = (title, content, showCancel = true) => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      showCancel,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 设置导航栏标题
const setNavigationBarTitle = (title) => {
  wx.setNavigationBarTitle({
    title
  })
}

// 获取场景值信息
const getSceneInfo = (scene) => {
  const sceneMap = {
    1001: '发现栏小程序主入口',
    1005: '顶部搜索框的搜索结果页',
    1006: '发现栏小程序主入口搜索框的搜索结果页',
    1007: '单人聊天会话中的小程序消息卡片',
    1008: '群聊会话中的小程序消息卡片',
    1011: '扫描二维码',
    1012: '长按图片识别二维码',
    1013: '手机相册选取二维码',
    1014: '小程序模版消息',
    1017: '前往体验版的入口页',
    1019: '微信钱包',
    1020: '公众号 profile 页相关小程序列表',
    1022: '聊天顶部置顶小程序入口',
    1023: '安卓系统桌面图标',
    1024: '小程序 profile 页',
    1025: '扫描一维码',
    1026: '附近小程序列表',
    1027: '索票夹',
    1028: '卡包',
    1029: '微信卡包',
    1030: '自定义交易组件',
    1031: '长按图片识别一维码',
    1032: '手机相册选取一维码',
    1034: '微信支付完成页',
    1035: '公众号自定义菜单',
    1036: 'App 分享消息卡片',
    1037: '小程序打开小程序',
    1038: '从另一个小程序返回',
    1039: '摇电视',
    1042: '添加好友搜索',
    1043: '公众号模板消息',
    1044: '带 shareTicket 的小程序消息卡片',
    1045: '朋友圈广告',
    1046: '朋友圈广告详情页',
    1047: '扫描小程序码',
    1048: '长按图片识别小程序码',
    1049: '手机相册选取小程序码',
    1052: '卡券的适用门店列表',
    1053: '搜一搜的结果页',
    1054: '顶部搜索框小程序快捷入口',
    1056: '音乐播放器菜单',
    1057: '钱包中的银行卡详情页',
    1058: '公众号文章',
    1059: '体验版小程序绑定邀请页',
    1064: '微信连Wi-Fi状态栏',
    1067: '公众号文章广告',
    1068: '附近小程序列表广告',
    1069: '移动应用',
    1071: '钱包中的银行卡列表页',
    1072: '二维码收款页面',
    1073: '客服消息列表下拉刷新',
    1074: '公众号会话下拉刷新',
    1077: '摇周边',
    1078: '连Wi-Fi成功页',
    1079: '微信游戏中心',
    1081: '客服消息下发',
    1082: '从微信读书到小程序',
    1084: '下拉小程序快捷入口',
    1089: '微信聊天主界面下拉',
    1090: '长按小程序右上角菜单唤出最近使用历史',
    1091: '公众号文章商品卡片',
    1092: '城市服务入口',
    1095: '小程序广告组件',
    1096: '聊天记录',
    1097: '微信支付签约页',
    1099: '页面内嵌插件',
    1102: '公众号 profile 页服务预览',
    1103: '发现-小程序主入口我的小程序列表',
    1104: '微信聊天主界面下拉所有小程序列表',
    1107: '小程序后台唤起',
    1108: '从微信电脑版小程序面板打开',
    1109: '微信买单页',
    1110: '群应用商店',
    1111: '扫描或长按识别二维码',
    1112: '开发版小程序绑定邀请页'
  }
  
  return sceneMap[scene] || '未知来源'
}

module.exports = {
  formatTime,
  formatRelativeTime,
  formatPrice,
  formatPower,
  formatTorque,
  debounce,
  throttle,
  deepClone,
  getImageInfo,
  previewImages,
  getShareConfig,
  saveImageToPhotosAlbum,
  getSystemInfo,
  showToast,
  showModal,
  setNavigationBarTitle,
  getSceneInfo
}