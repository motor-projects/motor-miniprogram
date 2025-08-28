// components/motorcycle-card/motorcycle-card.js
const userService = require('../../services/user')
const { showToast } = require('../../utils/util')

Component({
  properties: {
    motorcycle: {
      type: Object,
      value: {}
    },
    showActions: {
      type: Boolean,
      value: true
    }
  },

  data: {
    
  },

  methods: {
    // 卡片点击
    onCardTap() {
      this.triggerEvent('cardtap', {
        motorcycle: this.properties.motorcycle
      })
    },

    // 收藏点击
    async onFavoriteTap() {
      const { motorcycle } = this.properties
      
      try {
        if (motorcycle.isFavorited) {
          await userService.removeFavorite(motorcycle._id)
          showToast('已取消收藏')
        } else {
          await userService.addFavorite(motorcycle._id)
          showToast('已添加收藏')
        }
        
        // 触发事件通知父组件更新状态
        this.triggerEvent('favoritechange', {
          motorcycleId: motorcycle._id,
          isFavorited: !motorcycle.isFavorited
        })
        
        // 更新本地状态
        this.setData({
          'motorcycle.isFavorited': !motorcycle.isFavorited
        })
        
      } catch (error) {
        console.error('收藏操作失败:', error)
        showToast('操作失败，请重试', 'error')
      }
    },

    // 对比点击
    onCompareTap() {
      const { motorcycle } = this.properties
      
      let compareItems = wx.getStorageSync('compareItems') || []
      
      // 检查是否已存在
      const existingIndex = compareItems.findIndex(item => item._id === motorcycle._id)
      if (existingIndex !== -1) {
        compareItems.splice(existingIndex, 1)
        showToast('已移除对比')
      } else {
        // 检查数量限制
        if (compareItems.length >= 3) {
          showToast('最多只能对比3款摩托车')
          return
        }
        
        compareItems.push(motorcycle)
        showToast('已添加对比')
      }
      
      wx.setStorageSync('compareItems', compareItems)
      
      // 触发事件通知父组件
      this.triggerEvent('comparechange', {
        motorcycleId: motorcycle._id,
        compareItems
      })
    }
  }
})