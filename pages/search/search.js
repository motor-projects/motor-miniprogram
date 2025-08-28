// pages/search/search.js
const motorcycleService = require('../../services/motorcycle')
const userService = require('../../services/user')
const { debounce, showToast, getShareConfig } = require('../../utils/util')

Page({
  data: {
    searchKeyword: '',
    showKeyboard: true,
    showSuggestions: false,
    showResults: false,
    showSortPanel: false,
    showFilterPanel: false,
    
    // 搜索建议
    suggestions: [],
    
    // 搜索历史
    searchHistory: [],
    
    // 热门搜索
    hotKeywords: [
      '本田CBR',
      '雅马哈R1',
      '杜卡迪',
      '川崎忍者',
      '宝马S1000RR',
      '哈雷戴维森',
      '春风',
      '钱江',
      '新手摩托车',
      '踏板车'
    ],
    
    // 热门品牌
    hotBrands: [
      { name: '本田', logo: '/images/brands/honda.png' },
      { name: '雅马哈', logo: '/images/brands/yamaha.png' },
      { name: '川崎', logo: '/images/brands/kawasaki.png' },
      { name: '铃木', logo: '/images/brands/suzuki.png' },
      { name: '杜卡迪', logo: '/images/brands/ducati.png' },
      { name: '宝马', logo: '/images/brands/bmw.png' },
      { name: '哈雷', logo: '/images/brands/harley.png' },
      { name: '春风', logo: '/images/brands/cfmoto.png' }
    ],
    
    // 搜索结果
    searchResults: [],
    totalCount: 0,
    currentPage: 1,
    hasMore: false,
    loading: false,
    
    // 排序
    sortBy: 'relevance',
    sortText: '相关度',
    
    // 筛选
    selectedBrands: [],
    selectedCategories: [],
    minPrice: null,
    maxPrice: null,
    availableBrands: [],
    availableCategories: []
  },

  onLoad(options) {
    console.log('搜索页加载:', options)
    
    // 处理页面参数
    if (options.keyword) {
      this.setData({ 
        searchKeyword: options.keyword,
        showKeyboard: false,
        showResults: true
      })
      this.performSearch()
    }
    
    this.loadSearchHistory()
    this.loadFilterOptions()
  },

  onShow() {
    // 刷新搜索历史
    this.loadSearchHistory()
  },

  // 创建防抖搜索函数
  onReady() {
    this.debouncedSearch = debounce(this.getSuggestions.bind(this), 300)
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ 
      searchKeyword: keyword,
      showSuggestions: keyword.length > 0,
      showResults: false
    })
    
    if (keyword.length > 0) {
      this.debouncedSearch(keyword)
    } else {
      this.setData({ suggestions: [] })
    }
  },

  // 获取搜索建议
  async getSuggestions(keyword) {
    try {
      // 这里可以调用API获取搜索建议
      // 暂时使用模拟数据
      const suggestions = this.generateSuggestions(keyword)
      this.setData({ suggestions })
    } catch (error) {
      console.error('获取搜索建议失败:', error)
    }
  },

  // 生成搜索建议
  generateSuggestions(keyword) {
    const { hotKeywords } = this.data
    return hotKeywords.filter(item => 
      item.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 5)
  },

  // 执行搜索
  async performSearch() {
    const { searchKeyword } = this.data
    
    if (!searchKeyword.trim()) {
      showToast('请输入搜索关键词')
      return
    }
    
    this.setData({
      showSuggestions: false,
      showResults: true,
      showKeyboard: false,
      currentPage: 1
    })
    
    // 添加到搜索历史
    this.addToSearchHistory(searchKeyword)
    
    // 执行搜索
    await this.searchMotorcycles(true)
  },

  // 搜索摩托车
  async searchMotorcycles(reset = false) {
    if (this.data.loading && !reset) return
    
    this.setData({ loading: true })
    
    try {
      const page = reset ? 1 : this.data.currentPage + 1
      const params = this.buildSearchParams(page)
      
      const result = await motorcycleService.searchMotorcycles(this.data.searchKeyword, params)
      
      if (result && result.motorcycles) {
        const searchResults = reset ? result.motorcycles : [...this.data.searchResults, ...result.motorcycles]
        
        this.setData({
          searchResults,
          totalCount: result.pagination.totalItems,
          currentPage: page,
          hasMore: result.pagination.hasNext
        })
        
        // 更新筛选选项
        if (result.filters && result.filters.available) {
          this.setData({
            availableBrands: result.filters.available.brands || [],
            availableCategories: result.filters.available.categories || []
          })
        }
      }
    } catch (error) {
      console.error('搜索失败:', error)
      showToast('搜索失败，请重试', 'error')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 构建搜索参数
  buildSearchParams(page) {
    const params = {
      page,
      limit: 20
    }
    
    // 排序
    if (this.data.sortBy !== 'relevance') {
      const [sortField, sortOrder] = this.data.sortBy.split('_')
      params.sortBy = sortField
      params.sortOrder = sortOrder
    }
    
    // 筛选
    if (this.data.selectedBrands.length > 0) {
      params.brands = this.data.selectedBrands
    }
    if (this.data.selectedCategories.length > 0) {
      params.categories = this.data.selectedCategories
    }
    if (this.data.minPrice !== null) {
      params.minPrice = this.data.minPrice * 10000
    }
    if (this.data.maxPrice !== null) {
      params.maxPrice = this.data.maxPrice * 10000
    }
    
    return params
  },

  // 选择搜索建议
  selectSuggestion(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchKeyword: keyword })
    this.performSearch()
  },

  // 选择搜索历史
  selectHistory(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchKeyword: keyword })
    this.performSearch()
  },

  // 选择热门关键词
  selectHotKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchKeyword: keyword })
    this.performSearch()
  },

  // 选择品牌
  selectBrand(e) {
    const brand = e.currentTarget.dataset.brand
    this.setData({ searchKeyword: brand })
    this.performSearch()
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchKeyword: '',
      showSuggestions: false,
      showResults: false,
      suggestions: []
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 加载搜索历史
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({ searchHistory: history.slice(0, 10) })
  },

  // 添加到搜索历史
  addToSearchHistory(keyword) {
    if (!keyword.trim()) return
    
    let history = wx.getStorageSync('searchHistory') || []
    
    // 移除重复项
    history = history.filter(item => item !== keyword)
    
    // 添加到开头
    history.unshift(keyword)
    
    // 限制数量
    history = history.slice(0, 20)
    
    wx.setStorageSync('searchHistory', history)
    this.setData({ searchHistory: history.slice(0, 10) })
    
    // 同步到服务器
    userService.addSearchHistory(keyword).catch(console.error)
  },

  // 移除搜索历史
  removeHistory(e) {
    const keyword = e.currentTarget.dataset.keyword
    let history = this.data.searchHistory.filter(item => item !== keyword)
    
    wx.setStorageSync('searchHistory', history)
    this.setData({ searchHistory: history })
    
    // 同步到服务器
    userService.removeSearchHistory(keyword).catch(console.error)
  },

  // 清空搜索历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({ searchHistory: [] })
          
          // 同步到服务器
          userService.clearSearchHistory().catch(console.error)
        }
      }
    })
  },

  // 加载筛选选项
  async loadFilterOptions() {
    try {
      const filters = await motorcycleService.getFilterOptions()
      this.setData({
        availableBrands: filters.brands || [],
        availableCategories: filters.categories || []
      })
    } catch (error) {
      console.error('加载筛选选项失败:', error)
    }
  },

  // 加载更多
  loadMore() {
    this.searchMotorcycles(false)
  },

  // 显示排序选项
  showSortOptions() {
    this.setData({ showSortPanel: true })
  },

  // 隐藏排序面板
  hideSortPanel() {
    this.setData({ showSortPanel: false })
  },

  // 选择排序
  selectSort(e) {
    const sort = e.currentTarget.dataset.sort
    let sortText = '相关度'
    
    switch (sort) {
      case 'price_asc':
        sortText = '价格从低到高'
        break
      case 'price_desc':
        sortText = '价格从高到低'
        break
      case 'year_desc':
        sortText = '年份最新'
        break
      case 'rating_desc':
        sortText = '评分最高'
        break
    }
    
    this.setData({
      sortBy: sort,
      sortText,
      showSortPanel: false
    })
    
    // 重新搜索
    this.searchMotorcycles(true)
  },

  // 显示更多筛选
  showMoreFilters() {
    this.setData({ showFilterPanel: true })
  },

  // 隐藏筛选面板
  hideFilterPanel() {
    this.setData({ showFilterPanel: false })
  },

  // 切换品牌筛选
  toggleBrand(e) {
    const brand = e.currentTarget.dataset.brand
    let selectedBrands = [...this.data.selectedBrands]
    
    const index = selectedBrands.indexOf(brand)
    if (index !== -1) {
      selectedBrands.splice(index, 1)
    } else {
      selectedBrands.push(brand)
    }
    
    this.setData({ selectedBrands })
  },

  // 切换类型筛选
  toggleCategory(e) {
    const category = e.currentTarget.dataset.category
    let selectedCategories = [...this.data.selectedCategories]
    
    const index = selectedCategories.indexOf(category)
    if (index !== -1) {
      selectedCategories.splice(index, 1)
    } else {
      selectedCategories.push(category)
    }
    
    this.setData({ selectedCategories })
  },

  // 价格变化
  onMinPriceChange(e) {
    this.setData({ minPrice: e.detail.value })
  },

  onMaxPriceChange(e) {
    this.setData({ maxPrice: e.detail.value })
  },

  // 重置筛选
  resetFilters() {
    this.setData({
      selectedBrands: [],
      selectedCategories: [],
      minPrice: null,
      maxPrice: null
    })
  },

  // 应用筛选
  applyFilters() {
    this.setData({ showFilterPanel: false })
    this.searchMotorcycles(true)
  },

  // 切换收藏
  async toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const motorcycle = this.data.searchResults.find(item => item._id === id)
    
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
      const searchResults = this.data.searchResults.map(item => {
        if (item._id === id) {
          return { ...item, isFavorited: !item.isFavorited }
        }
        return item
      })
      
      this.setData({ searchResults })
    } catch (error) {
      console.error('收藏操作失败:', error)
      showToast('操作失败，请重试', 'error')
    }
  },

  // 添加到对比
  addToCompare(e) {
    const id = e.currentTarget.dataset.id
    const motorcycle = this.data.searchResults.find(item => item._id === id)
    
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

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    
    // 添加浏览历史
    userService.addHistory(id).catch(console.error)
    
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 分享配置
  onShareAppMessage() {
    const { searchKeyword } = this.data
    
    return getShareConfig({
      title: searchKeyword ? `搜索"${searchKeyword}"的摩托车结果` : '摩托车搜索',
      path: `/pages/search/search?keyword=${searchKeyword}`
    })
  }
})