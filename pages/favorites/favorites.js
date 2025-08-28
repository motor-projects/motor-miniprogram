// pages/favorites/favorites.js
const userService = require('../../services/user')
const { showToast, showModal, formatRelativeTime, getShareConfig } = require('../../utils/util')

Page({
  data: {
    favorites: [],
    currentPage: 1,
    hasMore: false,
    loading: false,
    editMode: false,
    selectedItems: [],
    viewMode: 'grid', // grid | list
    sortBy: 'time', // time | price
    showNoteModal: false,
    noteText: '',
    currentNoteId: ''
  },

  onLoad() {
    console.log('收藏页加载')
    this.loadFavorites()
    this.loadViewMode()
  },

  onShow() {
    // 刷新收藏列表
    this.refreshFavorites()
  },

  onPullDownRefresh() {
    this.refreshFavorites().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 加载收藏列表
  async loadFavorites(reset = true) {
    if (this.data.loading && !reset) return
    
    this.setData({ loading: true })
    
    try {
      const page = reset ? 1 : this.data.currentPage + 1
      const params = {
        page,
        limit: 20,
        sortBy: this.data.sortBy === 'time' ? 'addedAt' : 'price',
        sortOrder: this.data.sortBy === 'time' ? 'desc' : 'asc'
      }
      
      const result = await userService.getFavorites(params)
      
      if (result && result.favorites) {
        // 格式化时间
        result.favorites.forEach(item => {
          item.addedAt = formatRelativeTime(item.addedAt)
        })
        
        const favorites = reset ? result.favorites : [...this.data.favorites, ...result.favorites]
        
        this.setData({
          favorites,
          currentPage: page,
          hasMore: result.pagination.hasNext
        })
      }
    } catch (error) {
      console.error('加载收藏失败:', error)
      showToast('加载失败，请重试', 'error')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 刷新收藏列表
  refreshFavorites() {
    return this.loadFavorites(true)
  },

  // 加载更多
  loadMore() {
    this.loadFavorites(false)
  },

  // 加载视图模式
  loadViewMode() {
    const viewMode = wx.getStorageSync('favoritesViewMode') || 'grid'
    this.setData({ viewMode })
  },

  // 切换视图模式
  changeViewMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ viewMode: mode })
    wx.setStorageSync('favoritesViewMode', mode)
  },

  // 切换排序
  changeSort(e) {
    const sort = e.currentTarget.dataset.sort
    this.setData({ sortBy: sort })
    this.refreshFavorites()
  },

  // 切换编辑模式
  toggleEditMode() {
    this.setData({
      editMode: !this.data.editMode,
      selectedItems: []
    })
  },

  // 切换选择
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    let selectedItems = [...this.data.selectedItems]
    
    const index = selectedItems.indexOf(id)
    if (index !== -1) {
      selectedItems.splice(index, 1)
    } else {
      selectedItems.push(id)
    }
    
    this.setData({ selectedItems })
  },

  // 批量对比
  batchCompare() {
    const { selectedItems } = this.data
    
    if (selectedItems.length < 2) {
      showToast('请选择至少2款摩托车进行对比')
      return
    }
    
    if (selectedItems.length > 3) {
      showToast('最多只能对比3款摩托车')
      return
    }
    
    // 获取选中的摩托车
    const selectedMotorcycles = this.data.favorites
      .filter(item => selectedItems.includes(item.motorcycleId))
      .map(item => item.motorcycle)
    
    // 保存到对比列表
    wx.setStorageSync('compareItems', selectedMotorcycles)
    
    // 跳转到对比页面
    wx.navigateTo({
      url: `/pages/compare/compare?ids=${selectedItems.join(',')}`
    })
  },

  // 批量删除
  async batchDelete() {
    const { selectedItems } = this.data
    
    const confirm = await showModal(
      '删除收藏',
      `确定要删除选中的${selectedItems.length}个收藏吗？`
    )
    
    if (!confirm) return
    
    try {
      wx.showLoading({ title: '删除中...' })
      
      // 批量删除
      await Promise.all(
        selectedItems.map(id => userService.removeFavorite(id))
      )
      
      // 更新本地列表
      const favorites = this.data.favorites.filter(
        item => !selectedItems.includes(item.motorcycleId)
      )
      
      this.setData({
        favorites,
        selectedItems: [],
        editMode: false
      })
      
      showToast('删除成功')
      
    } catch (error) {
      console.error('批量删除失败:', error)
      showToast('删除失败，请重试', 'error')
    } finally {
      wx.hideLoading()
    }
  },

  // 添加到对比
  addToCompare(e) {
    const id = e.currentTarget.dataset.id
    const motorcycle = this.data.favorites.find(item => item.motorcycleId === id)?.motorcycle
    
    if (!motorcycle) return
    
    let compareItems = wx.getStorageSync('compareItems') || []
    
    // 检查是否已存在
    const existingIndex = compareItems.findIndex(item => item._id === id)
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
  },

  // 分享摩托车
  shareMotorcycle(e) {
    const motorcycle = e.currentTarget.dataset.motorcycle
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    // 设置临时分享数据
    this.shareData = motorcycle
  },

  // 显示备注弹窗
  showNoteModal(id, currentNote = '') {
    this.setData({
      showNoteModal: true,
      noteText: currentNote,
      currentNoteId: id
    })
  },

  // 隐藏备注弹窗
  hideNoteModal() {
    this.setData({
      showNoteModal: false,
      noteText: '',
      currentNoteId: ''
    })
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({ noteText: e.detail.value })
  },

  // 保存备注
  async saveNote() {
    const { currentNoteId, noteText } = this.data
    
    try {
      // 这里应该调用API更新备注
      // await userService.updateFavoriteNote(currentNoteId, noteText)
      
      // 更新本地数据
      const favorites = this.data.favorites.map(item => {
        if (item.motorcycleId === currentNoteId) {
          return { ...item, notes: noteText }
        }
        return item
      })
      
      this.setData({ favorites })
      this.hideNoteModal()
      showToast('备注保存成功')
      
    } catch (error) {
      console.error('保存备注失败:', error)
      showToast('保存失败，请重试', 'error')
    }
  },

  // 跳转到详情页
  goToDetail(e) {
    const motorcycle = e.detail.motorcycle
    wx.navigateTo({
      url: `/pages/detail/detail?id=${motorcycle._id}`
    })
  },

  // 跳转到列表页
  goToList() {
    wx.switchTab({
      url: '/pages/list/list'
    })
  },

  // 收藏状态变化
  onFavoriteChange(e) {
    const { motorcycleId, isFavorited } = e.detail
    
    if (!isFavorited) {
      // 从收藏列表中移除
      const favorites = this.data.favorites.filter(
        item => item.motorcycleId !== motorcycleId
      )
      this.setData({ favorites })
    }
  },

  // 分享配置
  onShareAppMessage() {
    if (this.shareData) {
      const motorcycle = this.shareData
      this.shareData = null
      
      return getShareConfig({
        title: `${motorcycle.brand} ${motorcycle.model} - 我收藏的摩托车`,
        path: `/pages/detail/detail?id=${motorcycle._id}`,
        imageUrl: motorcycle.images && motorcycle.images[0] ? motorcycle.images[0].url : ''
      })
    }
    
    return getShareConfig({
      title: '我的摩托车收藏',
      path: '/pages/favorites/favorites'
    })
  }
})