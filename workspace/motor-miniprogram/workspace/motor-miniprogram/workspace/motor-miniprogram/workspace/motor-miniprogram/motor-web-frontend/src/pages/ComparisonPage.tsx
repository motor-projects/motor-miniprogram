import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { XMarkIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { RootState, AppDispatch } from '../store'
import { removeFromComparison, clearComparison } from '../store/slices/comparisonSlice'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LazyImage } from '../components/ui/LazyImage'
import { SearchFilters } from '../components/motorcycle/SearchFilters'
import { useToast } from '../hooks/useToast'
import { motorcycleApi } from '../services/api'
import type { Motorcycle } from '../types'
import { cn } from '../utils/cn'
import { formatCurrency, formatPower } from '../utils/format'

interface ComparisonAttribute {
  label: string
  getValue: (motorcycle: Motorcycle) => string | number | undefined
  format?: (value: any) => string
  category: 'basic' | 'engine' | 'performance' | 'dimensions'
}

const comparisonAttributes: ComparisonAttribute[] = [
  // 基本信息
  { label: '品牌', getValue: (m) => m.brand, category: 'basic' },
  { label: '型号', getValue: (m) => m.model, category: 'basic' },
  { label: '年份', getValue: (m) => m.year, category: 'basic' },
  { label: '类型', getValue: (m) => m.category, category: 'basic' },
  { label: '售价', getValue: (m) => m.price?.msrp, format: formatCurrency, category: 'basic' },
  
  // 发动机
  { label: '发动机类型', getValue: (m) => m.engine?.type, category: 'engine' },
  { label: '排量 (cc)', getValue: (m) => m.engine?.displacement, format: (v) => v ? `${v}cc` : '-', category: 'engine' },
  { label: '缸径 (mm)', getValue: (m) => m.engine?.bore, format: (v) => v ? `${v}mm` : '-', category: 'engine' },
  { label: '行程 (mm)', getValue: (m) => m.engine?.stroke, format: (v) => v ? `${v}mm` : '-', category: 'engine' },
  { label: '压缩比', getValue: (m) => m.engine?.compressionRatio, category: 'engine' },
  { label: '冷却方式', getValue: (m) => m.engine?.cooling, category: 'engine' },
  { label: '燃油系统', getValue: (m) => m.engine?.fuelSystem, category: 'engine' },
  
  // 性能
  { label: '最大功率', getValue: (m) => m.performance?.power?.hp, format: formatPower, category: 'performance' },
  { label: '最大扭矩', getValue: (m) => m.performance?.torque?.nm, format: (v) => v ? `${v} Nm` : '-', category: 'performance' },
  { label: '最高速度', getValue: (m) => m.performance?.topSpeed, format: (v) => v ? `${v} km/h` : '-', category: 'performance' },
  { label: '0-100km/h', getValue: (m) => m.performance?.acceleration?.zeroToHundred, format: (v) => v ? `${v}s` : '-', category: 'performance' },
  { label: '油耗 (L/100km)', getValue: (m) => m.performance?.fuelEconomy?.combined, format: (v) => v ? `${v}L/100km` : '-', category: 'performance' },
  
  // 尺寸
  { label: '长度 (mm)', getValue: (m) => m.dimensions?.length, format: (v) => v ? `${v}mm` : '-', category: 'dimensions' },
  { label: '宽度 (mm)', getValue: (m) => m.dimensions?.width, format: (v) => v ? `${v}mm` : '-', category: 'dimensions' },
  { label: '高度 (mm)', getValue: (m) => m.dimensions?.height, format: (v) => v ? `${v}mm` : '-', category: 'dimensions' },
  { label: '轴距 (mm)', getValue: (m) => m.dimensions?.wheelbase, format: (v) => v ? `${v}mm` : '-', category: 'dimensions' },
  { label: '座高 (mm)', getValue: (m) => m.dimensions?.seatHeight, format: (v) => v ? `${v}mm` : '-', category: 'dimensions' },
  { label: '干重 (kg)', getValue: (m) => m.dimensions?.weight?.dry, format: (v) => v ? `${v}kg` : '-', category: 'dimensions' },
  { label: '湿重 (kg)', getValue: (m) => m.dimensions?.weight?.wet, format: (v) => v ? `${v}kg` : '-', category: 'dimensions' },
  { label: '油箱容量 (L)', getValue: (m) => m.dimensions?.fuelCapacity, format: (v) => v ? `${v}L` : '-', category: 'dimensions' },
]

const categories = [
  { id: 'basic', name: '基本信息' },
  { id: 'engine', name: '发动机' },
  { id: 'performance', name: '性能' },
  { id: 'dimensions', name: '尺寸重量' },
]

export const ComparisonPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { items } = useSelector((state: RootState) => state.comparison)
  const { showToast } = useToast()
  
  const [selectedCategory, setSelectedCategory] = useState('basic')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Motorcycle[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const filteredAttributes = comparisonAttributes.filter(
    attr => attr.category === selectedCategory
  )

  const handleRemoveItem = (motorcycleId: string) => {
    dispatch(removeFromComparison(motorcycleId))
    showToast('已移除对比项目', 'success')
  }

  const handleClearAll = () => {
    dispatch(clearComparison())
    showToast('已清空对比列表', 'success')
  }

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await motorcycleApi.getMotorcycles({
        search: searchTerm,
        limit: 10
      })
      setSearchResults(response.motorcycles)
    } catch (error) {
      console.error('Search failed:', error)
      showToast('搜索失败，请稍后重试', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  const addToComparison = (motorcycle: Motorcycle) => {
    if (items.length >= 4) {
      showToast('最多只能同时对比4台摩托车', 'warning')
      return
    }
    
    // 检查是否已存在
    if (items.some(item => item.motorcycle._id === motorcycle._id)) {
      showToast('该摩托车已在对比列表中', 'warning')
      return
    }
    
    // 添加到对比
    dispatch({
      type: 'comparison/addToComparison',
      payload: {
        motorcycleId: motorcycle._id,
        motorcycle,
        addedAt: new Date().toISOString()
      }
    })
    showToast(`已添加 ${motorcycle.brand} ${motorcycle.model} 到对比列表`, 'success')
    setIsSearchOpen(false)
  }

  const getBestValue = (attribute: ComparisonAttribute, type: 'max' | 'min' = 'max') => {
    const values = items
      .map(item => attribute.getValue(item.motorcycle))
      .filter(v => v != null && v !== '')
      .map(v => typeof v === 'string' ? parseFloat(v) || 0 : v)
      .filter(v => !isNaN(v as number))
    
    if (values.length === 0) return null
    
    return type === 'max' ? Math.max(...values as number[]) : Math.min(...values as number[])
  }

  const isHighlighted = (attribute: ComparisonAttribute, motorcycle: Motorcycle) => {
    const value = attribute.getValue(motorcycle)
    if (value == null || value === '') return false
    
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    if (isNaN(numValue as number)) return false
    
    // 根据属性类型决定是否高亮（通常数值越大越好，但有些例外）
    let bestValue
    if (attribute.label.includes('油耗') || attribute.label.includes('加速') || attribute.label.includes('重量')) {
      bestValue = getBestValue(attribute, 'min')
    } else {
      bestValue = getBestValue(attribute, 'max')
    }
    
    return bestValue !== null && numValue === bestValue
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <ArrowPathIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">对比列表为空</h2>
          <p className="mt-2 text-gray-600">
            您还没有添加任何摩托车进行对比。去浏览页面添加您感兴趣的车型吧！
          </p>
          <div className="mt-6 space-x-4">
            <Link to="/motorcycles">
              <Button>浏览摩托车</Button>
            </Link>
            <Button variant="secondary" onClick={() => setIsSearchOpen(true)}>
              搜索添加
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">摩托车对比</h1>
          <p className="mt-2 text-gray-600">对比不同摩托车的性能参数</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => setIsSearchOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加对比
          </Button>
          <Button variant="outline" onClick={handleClearAll}>
            清空全部
          </Button>
        </div>
      </div>

      {/* 分类切换 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
              selectedCategory === category.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 对比表格 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-900 min-w-[200px]">
                  参数
                </th>
                {items.map((item) => (
                  <th key={item.motorcycle._id} className="text-center py-4 px-4 font-medium text-gray-900 min-w-[200px]">
                    <div className="space-y-3">
                      <div className="relative">
                        <button
                          onClick={() => handleRemoveItem(item.motorcycle._id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 text-red-600" />
                        </button>
                        <LazyImage
                          src={item.motorcycle.images?.[0]?.url || '/placeholder-motorcycle.jpg'}
                          alt={`${item.motorcycle.brand} ${item.motorcycle.model}`}
                          className="w-24 h-16 object-cover rounded-lg mx-auto"
                        />
                      </div>
                      <div>
                        <Link
                          to={`/motorcycle/${item.motorcycle.seo?.slug}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {item.motorcycle.brand} {item.motorcycle.model}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.motorcycle.year}年
                        </p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAttributes.map((attribute, index) => (
                <tr key={index} className={cn(
                  'border-b border-gray-100 hover:bg-gray-50',
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                )}>
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {attribute.label}
                  </td>
                  {items.map((item) => {
                    const value = attribute.getValue(item.motorcycle)
                    const formattedValue = value != null && value !== '' 
                      ? (attribute.format ? attribute.format(value) : String(value))
                      : '-'
                    const highlighted = isHighlighted(attribute, item.motorcycle)
                    
                    return (
                      <td key={item.motorcycle._id} className={cn(
                        'py-3 px-4 text-center',
                        highlighted ? 'bg-green-50 font-semibold text-green-800' : 'text-gray-900'
                      )}>
                        {highlighted && (
                          <Badge variant="success" className="mb-1">优秀</Badge>
                        )}
                        <div>{formattedValue}</div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 搜索模态框 */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">添加对比车型</h3>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <SearchFilters
                onSearch={handleSearch}
                placeholder="搜索摩托车品牌、型号..."
                showFilters={false}
              />
              
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">搜索中...</p>
                </div>
              ) : (
                <div className="mt-6 max-h-96 overflow-y-auto space-y-3">
                  {searchResults.map((motorcycle) => (
                    <div
                      key={motorcycle._id}
                      className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => addToComparison(motorcycle)}
                    >
                      <LazyImage
                        src={motorcycle.images?.[0]?.url || '/placeholder-motorcycle.jpg'}
                        alt={`${motorcycle.brand} ${motorcycle.model}`}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {motorcycle.brand} {motorcycle.model}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {motorcycle.year}年 · {motorcycle.category}
                        </p>
                      </div>
                      <div className="text-right">
                        {motorcycle.price?.msrp && (
                          <p className="font-medium text-primary-600">
                            {formatCurrency(motorcycle.price.msrp)}
                          </p>
                        )}
                        {motorcycle.performance?.power?.hp && (
                          <p className="text-sm text-gray-500">
                            {formatPower(motorcycle.performance.power.hp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      请输入关键词搜索摩托车
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}