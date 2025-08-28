import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Filter, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotorcycleList } from '../components/motorcycle/MotorcycleList'
import { SearchFilters } from '../components/motorcycle/SearchFilters'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { fetchMotorcycles } from '../store/slices/motorcycleSlice'
import { updateFilters } from '../store/slices/filterSlice'
import { setSidebarOpen } from '../store/slices/uiSlice'
import { RootState } from '../store'
import type { AppDispatch } from '../store'
import { SearchFilters as SearchFiltersType } from '../types'
import { cn } from '../utils/cn'

export function MotorcycleListPage() {
  const dispatch = useDispatch<AppDispatch>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  const {
    motorcycles,
    loading,
    hasNextPage,
    pagination,
    availableFilters
  } = useSelector((state: RootState) => state.motorcycles)
  
  const filters = useSelector((state: RootState) => state.filters)
  
  // 从URL参数初始化筛选器
  useEffect(() => {
    const urlFilters: Partial<SearchFiltersType> = {}
    
    const search = searchParams.get('search')
    const brand = searchParams.getAll('brand')
    const category = searchParams.getAll('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minPower = searchParams.get('minPower')
    const maxPower = searchParams.get('maxPower')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    
    if (search) urlFilters.search = search
    if (brand.length) urlFilters.brand = brand
    if (category.length) urlFilters.category = category
    if (minPrice) urlFilters.minPrice = Number(minPrice)
    if (maxPrice) urlFilters.maxPrice = Number(maxPrice)
    if (minPower) urlFilters.minPower = Number(minPower)
    if (maxPower) urlFilters.maxPower = Number(maxPower)
    if (sortBy) urlFilters.sortBy = sortBy as any
    if (sortOrder) urlFilters.sortOrder = sortOrder as any
    
    if (Object.keys(urlFilters).length > 0) {
      dispatch(updateFilters(urlFilters))
    }
  }, [])
  
  // 监听筛选器变化，更新URL和获取数据
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.brand?.length) {
      filters.brand.forEach(brand => params.append('brand', brand))
    }
    if (filters.category?.length) {
      filters.category.forEach(category => params.append('category', category))
    }
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
    if (filters.minPower) params.set('minPower', filters.minPower.toString())
    if (filters.maxPower) params.set('maxPower', filters.maxPower.toString())
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    
    setSearchParams(params, { replace: true })
    
    // 获取摩托车数据
    dispatch(fetchMotorcycles({ 
      filters, 
      page: 1,
      reset: true 
    }))
  }, [filters, dispatch, setSearchParams])
  
  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      dispatch(fetchMotorcycles({ 
        filters, 
        page: (pagination?.currentPage || 0) + 1,
        reset: false 
      }))
    }
  }
  
  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    // 筛选器已通过redux管理，这里不需要额外处理
  }
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-neutral-900 mb-2"
          >
            摩托车大全
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-600"
          >
            发现适合您的完美摩托车
          </motion.p>
        </div>
        
        <div className="flex gap-8">
          {/* 桌面端筛选器侧边栏 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block w-80 flex-shrink-0"
          >
            <div className="sticky top-8">
              <Card className="max-h-[calc(100vh-6rem)] overflow-y-auto">
                <SearchFilters
                  availableFilters={availableFilters}
                  onFiltersChange={handleFiltersChange}
                />
              </Card>
            </div>
          </motion.div>
          
          {/* 主内容区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 min-w-0"
          >
            {/* 移动端筛选器按钮 */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(true)}
                leftIcon={<Filter className="w-4 h-4" />}
                className="w-full"
              >
                筛选器
              </Button>
            </div>
            
            <MotorcycleList
              motorcycles={motorcycles}
              loading={loading}
              hasNextPage={hasNextPage}
              onLoadMore={handleLoadMore}
              totalCount={pagination?.totalItems}
              filters={filters}
            />
          </motion.div>
        </div>
      </div>
      
      {/* 移动端筛选器抽屉 */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
          >
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">筛选器</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <SearchFilters
                availableFilters={availableFilters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
            
            <div className="p-4 border-t border-neutral-200">
              <Button
                fullWidth
                onClick={() => setShowMobileFilters(false)}
              >
                查看结果
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}