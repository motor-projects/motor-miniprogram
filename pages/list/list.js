// pages/list/list.js
const motorcycleService = require('../../services/motorcycle')
const userService = require('../../services/user')
const { showToast, formatPrice, formatPower, getShareConfig } = require('../../utils/util')

Page({
  data: {
    motorcycles: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false
    },
    filters: {
      brands: [],
      categories: [],
      priceRange: { min: 0, max: 50 }
    },
    // 筛选状态
    selectedBrand: '',
    selectedCategory: '',
    selectedPriceRange: '',
    minPrice: null,
    maxPrice: null,
    sortBy: 'default',
    sortOrder: 'desc',
    // 面板显示状态
    showBrandPanel: false,
    showCategoryPanel: false,
    showPricePanel: false,
    showSortPanel: false,
    // 视图模式
    viewMode: 'grid', // grid | list
    // 加载状态
    loading: false,
    hasMore: true,
    // 对比功能
    compareItems: [],
    maxCompareItems: 3
  },

  onLoad(options) {
    console.log('列表页加载:', options)
    
    // 处理页面参数
    if (options.category) {
      this.setData({ selectedCategory: options.category })
    }
    if (options.brand) {
      this.setData({ selectedBrand: options.brand })
    }
    if (options.search) {
      this.setData({ searchKeyword: options.search })
    }
    
    this.loadInitialData()
  },

  onShow() {
    // 从本地存储恢复对比列表
    this.loadCompareItems()
    // 刷新收藏状态
    this.refreshFavoriteStatus()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 加载初始数据
  async loadInitialData() {
    await this.loadFilters()
    await this.loadMotorcycles(true)
  },

  // 加载筛选选项
  async loadFilters() {
    try {
      const filters = await motorcycleService.getFilterOptions()
      this.setData({
        'filters.brands': filters.brands || [],
        'filters.categories': filters.categories || [],
        'filters.priceRange': filters.priceRange || { min: 0, max: 50 }
      })
    } catch (error) {
      console.error('加载筛选选项失败:', error)
    }
  },

  // 加载摩托车列表
  async loadMotorcycles(reset = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const page = reset ? 1 : this.data.pagination.currentPage + 1
      const params = this.buildRequestParams(page)
      
      const result = await motorcycleService.getMotorcycles(params)
      
      if (result && result.motorcycles) {
        const motorcycles = reset ? result.motorcycles : [...this.data.motorcycles, ...result.motorcycles]
        
        this.setData({
          motorcycles,
          pagination: result.pagination,
          hasMore: result.pagination.hasNext
        })
      }
    } catch (error) {
      console.error('加载摩托车列表失败:', error)
      showToast('加载失败，请重试', 'error')
    } finally {
      this.setData({ loading: false })
      if (reset) {
        wx.stopPullDownRefresh()
      }
    }
  },

  // 构建请求参数
  buildRequestParams(page) {
    const params = {
      page,
      limit: 20
    }
    
    if (this.data.selectedBrand) {
      params.brand = this.data.selectedBrand
    }
    if (this.data.selectedCategory) {
      params.category = this.data.selectedCategory
    }
    if (this.data.minPrice !== null) {
      params.minPrice = this.data.minPrice * 10000
    }
    if (this.data.maxPrice !== null) {
      params.maxPrice = this.data.maxPrice * 10000
    }
    if (this.data.searchKeyword) {
      params.search = this.data.searchKeyword
    }
    if (this.data.sortBy !== 'default') {
      params.sortBy = this.data.sortBy
      params.sortOrder = this.data.sortOrder
    }
    
    return params
  },

  // 刷新数据
  refreshData() {
    this.loadMotorcycles(true)
  },

  // 加载更多
  loadMore() {
    this.loadMotorcycles(false)
  },

  // 显示品牌筛选
  showBrandFilter() {
    this.hidePanels()
    this.setData({ showBrandPanel: !this.data.showBrandPanel })
  },

  // 显示类型筛选
  showCategoryFilter() {
    this.hidePanels()
    this.setData({ showCategoryPanel: !this.data.showCategoryPanel })
  },

  // 显示价格筛选
  showPriceFilter() {
    this.hidePanels()
    this.setData({ showPricePanel: !this.data.showPricePanel })
  },

  // 显示排序筛选
  showSortFilter() {
    this.hidePanels()
    this.setData({ showSortPanel: !this.data.showSortPanel })
  },

  // 隐藏所有面板
  hidePanels() {
    this.setData({
      showBrandPanel: false,
      showCategoryPanel: false,
      showPricePanel: false,
      showSortPanel: false
    })
  },

  // 选择品牌
  selectBrand(e) {
    const brand = e.currentTarget.dataset.brand
    this.setData({ selectedBrand: brand })
    this.hidePanels()
    this.refreshData()
  },

  // 选择类型
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category })
    this.hidePanels()
    this.refreshData()
  },

  // 选择价格范围
  selectPriceRange(e) {
    const range = e.currentTarget.dataset.range
    const [min, max] = range.split('-').map(Number)
    
    this.setData({
      minPrice: min,
      maxPrice: max === 50 ? null : max,
      selectedPriceRange: max === 50 ? `${min}万以上` : `${min}-${max}万`
    })
    this.hidePanels()
    this.refreshData()
  },

  // 价格滑块变化
  onMinPriceChange(e) {
    this.setData({ minPrice: e.detail.value })
  },

  onMaxPriceChange(e) {
    this.setData({ maxPrice: e.detail.value })
  },

  // 选择排序
  selectSort(e) {
    const { sort, order } = e.currentTarget.dataset
    this.setData({
      sortBy: sort,
      sortOrder: order || 'desc'
    })
    this.hidePanels()
    this.refreshData()
  },

  // 切换视图模式
  changeViewMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ viewMode: mode })
    
    // 保存用户偏好
    wx.setStorageSync('viewMode', mode)
  },

  // 切换收藏
  async toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const motorcycle = this.data.motorcycles.find(item => item._id === id)
    
    if (!motorcycle) return
    
    try {
      if (motorcycle.isFavorited) {
        await userService.removeFavorite(id)
        showToast('已取消收藏')
      } else {
        await userService.addFavorite(id)
        showToast('已添加收藏')
      }
      
      // 更新本地状态
      const motorcycles = this.data.motorcycles.map(item => {
        if (item._id === id) {
          return { ...item, isFavorited: !item.isFavorited }
        }
        return item
      })
      
      this.setData({ motorcycles })
    } catch (error) {
      console.error('收藏操作失败:', error)
      showToast('操作失败，请重试', 'error')
    }
  },

  // 添加到对比
  addToCompare(e) {
    const id = e.currentTarget.dataset.id
    const motorcycle = this.data.motorcycles.find(item => item._id === id)
    
    if (!motorcycle) return
    
    let compareItems = [...this.data.compareItems]
    
    // 检查是否已存在
    const existingIndex = compareItems.findIndex(item => item._id === id)
    if (existingIndex !== -1) {
      compareItems.splice(existingIndex, 1)
      showToast('已移除对比')
    } else {
      // 检查数量限制
      if (compareItems.length >= this.data.maxCompareItems) {
        showToast(`最多只能对比${this.data.maxCompareItems}款摩托车`)
        return
      }
      
      compareItems.push(motorcycle)
      showToast('已添加对比')
    }
    
    this.setData({ compareItems })
    this.saveCompareItems()
  },

  // 跳转到对比页面
  goToCompare() {
    if (this.data.compareItems.length < 2) {
      showToast('至少选择2款摩托车进行对比')
      return
    }
    
    const ids = this.data.compareItems.map(item => item._id)
    wx.navigateTo({
      url: `/pages/compare/compare?ids=${ids.join(',')}`
    })
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    
    // 添加浏览历史
    userService.addHistory(id).catch(console.error)
    
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 保存对比列表
  saveCompareItems() {
    wx.setStorageSync('compareItems', this.data.compareItems)
  },

  // 加载对比列表
  loadCompareItems() {
    const compareItems = wx.getStorageSync('compareItems') || []
    this.setData({ compareItems })
  },

  // 刷新收藏状态
  async refreshFavoriteStatus() {
    // 这里可以批量检查收藏状态
    // 为了简化，暂时跳过实现
  },

  // 分享配置
  onShareAppMessage() {
    const { selectedBrand, selectedCategory } = this.data
    let title = '摩托车大全'
    
    if (selectedBrand && selectedCategory) {
      title = `${selectedBrand} ${selectedCategory}摩托车`
    } else if (selectedBrand) {
      title = `${selectedBrand}摩托车`
    } else if (selectedCategory) {
      title = `${selectedCategory}摩托车`
    }
    
    return getShareConfig({
      title,
      path: `/pages/list/list?brand=${selectedBrand}&category=${selectedCategory}`
    })
  }
})