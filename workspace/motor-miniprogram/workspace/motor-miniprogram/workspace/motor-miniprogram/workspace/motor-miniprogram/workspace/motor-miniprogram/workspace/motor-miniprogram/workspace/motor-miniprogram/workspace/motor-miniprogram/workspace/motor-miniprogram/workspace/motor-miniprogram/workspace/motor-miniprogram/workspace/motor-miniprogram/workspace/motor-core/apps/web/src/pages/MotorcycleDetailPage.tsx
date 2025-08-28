import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { 
  HeartIcon, 
  ShareIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ImageGallery } from '../components/motorcycle/ImageGallery'
import { ReviewSection } from '../components/motorcycle/ReviewSection'
import { useToast } from '../hooks/useToast'
import { motorcycleApi } from '../services/api'
import type { Motorcycle } from '../types'
import { RootState, AppDispatch } from '../store'
import { cn } from '../utils/cn'
import { formatCurrency, formatPower } from '../utils/format'

export const MotorcycleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { showToast } = useToast()
  
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('specs')

  useEffect(() => {
    if (slug) {
      loadMotorcycle()
    }
  }, [slug])

  const loadMotorcycle = async () => {
    if (!slug) return
    
    setLoading(true)
    try {
      const data = await motorcycleApi.getMotorcycleBySlug(slug)
      setMotorcycle(data)
      
      // 检查是否已收藏
      if (user && user.favorites.includes(data._id)) {
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Failed to load motorcycle:', error)
      showToast('加载失败，请稍后重试', 'error')
      navigate('/motorcycles')
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('请先登录', 'warning')
      return
    }
    
    if (!motorcycle) return

    try {
      if (isFavorite) {
        // 移除收藏
        setIsFavorite(false)
        showToast('已从收藏夹移除', 'success')
      } else {
        // 添加收藏
        setIsFavorite(true)
        showToast('已添加到收藏夹', 'success')
      }
    } catch (error) {
      showToast('操作失败，请稍后重试', 'error')
    }
  }

  const handleShare = async () => {
    if (navigator.share && motorcycle) {
      try {
        await navigator.share({
          title: `${motorcycle.brand} ${motorcycle.model}`,
          text: `查看这款${motorcycle.year}年的${motorcycle.brand} ${motorcycle.model}`,
          url: window.location.href
        })
      } catch (error) {
        // 如果分享失败，复制链接到剪贴板
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('链接已复制到剪贴板', 'success')
    } catch (error) {
      showToast('复制失败', 'error')
    }
  }

  const addToComparison = () => {
    if (!motorcycle) return
    
    // 添加到对比列表
    dispatch({
      type: 'comparison/addToComparison',
      payload: {
        motorcycleId: motorcycle._id,
        motorcycle,
        addedAt: new Date().toISOString()
      }
    })
    showToast('已添加到对比列表', 'success')
  }

  const tabs = [
    { id: 'specs', name: '技术参数' },
    { id: 'features', name: '配置详情' },
    { id: 'reviews', name: '用户评价' },
    { id: 'compare', name: '参数对比' }
  ]

  const renderSpecs = () => {
    if (!motorcycle) return null

    const specSections = [
      {
        title: '发动机',
        items: [
          { label: '类型', value: motorcycle.engine?.type },
          { label: '排量', value: motorcycle.engine?.displacement ? `${motorcycle.engine.displacement}cc` : undefined },
          { label: '缸径x行程', value: motorcycle.engine?.bore && motorcycle.engine?.stroke ? `${motorcycle.engine.bore}x${motorcycle.engine.stroke}mm` : undefined },
          { label: '压缩比', value: motorcycle.engine?.compressionRatio },
          { label: '冷却方式', value: motorcycle.engine?.cooling },
          { label: '燃油系统', value: motorcycle.engine?.fuelSystem },
          { label: '最大转速', value: motorcycle.engine?.maxRpm ? `${motorcycle.engine.maxRpm} rpm` : undefined },
        ]
      },
      {
        title: '性能参数',
        items: [
          { label: '最大功率', value: motorcycle.performance?.power?.hp ? formatPower(motorcycle.performance.power.hp) : undefined },
          { label: '最大扭矩', value: motorcycle.performance?.torque?.nm ? `${motorcycle.performance.torque.nm} Nm` : undefined },
          { label: '最高时速', value: motorcycle.performance?.topSpeed ? `${motorcycle.performance.topSpeed} km/h` : undefined },
          { label: '0-100km/h', value: motorcycle.performance?.acceleration?.zeroToHundred ? `${motorcycle.performance.acceleration.zeroToHundred}s` : undefined },
          { label: '综合油耗', value: motorcycle.performance?.fuelEconomy?.combined ? `${motorcycle.performance.fuelEconomy.combined}L/100km` : undefined },
        ]
      },
      {
        title: '外形尺寸',
        items: [
          { label: '长x宽x高', value: motorcycle.dimensions?.length && motorcycle.dimensions?.width && motorcycle.dimensions?.height ? `${motorcycle.dimensions.length}x${motorcycle.dimensions.width}x${motorcycle.dimensions.height}mm` : undefined },
          { label: '轴距', value: motorcycle.dimensions?.wheelbase ? `${motorcycle.dimensions.wheelbase}mm` : undefined },
          { label: '座高', value: motorcycle.dimensions?.seatHeight ? `${motorcycle.dimensions.seatHeight}mm` : undefined },
          { label: '离地间隙', value: motorcycle.dimensions?.groundClearance ? `${motorcycle.dimensions.groundClearance}mm` : undefined },
          { label: '整备质量', value: motorcycle.dimensions?.weight?.wet ? `${motorcycle.dimensions.weight.wet}kg` : undefined },
          { label: '油箱容量', value: motorcycle.dimensions?.fuelCapacity ? `${motorcycle.dimensions.fuelCapacity}L` : undefined },
        ]
      }
    ]

    return (
      <div className="space-y-8">
        {specSections.map((section, index) => (
          <Card key={index} className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{section.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.filter(item => item.value).map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const renderFeatures = () => {
    if (!motorcycle) return null

    const features = motorcycle.features || []
    
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">配置详情</h3>
        {features.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暂无配置信息</p>
        )}
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-video bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!motorcycle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">未找到摩托车</h2>
          <p className="mt-2 text-gray-600">请检查链接是否正确或返回列表页</p>
          <Link to="/motorcycles" className="mt-4 inline-block">
            <Button>返回列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700">首页</Link>
          <span>/</span>
          <Link to="/motorcycles" className="hover:text-gray-700">摩托车</Link>
          <span>/</span>
          <span className="text-gray-900">{motorcycle.brand}</span>
          <span>/</span>
          <span className="text-gray-900">{motorcycle.model}</span>
        </nav>

        {/* 主要内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧 - 图片画廊 */}
          <div className="lg:col-span-2">
            <ImageGallery motorcycle={motorcycle} />
          </div>

          {/* 右侧 - 基本信息 */}
          <div className="space-y-6">
            {/* 标题和基本信息 */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {motorcycle.brand} {motorcycle.model}
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">{motorcycle.year}年</p>
                </div>
                <Badge variant="primary">{motorcycle.category}</Badge>
              </div>
              
              {/* 评分 */}
              {motorcycle.rating && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < motorcycle.rating!.overall ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{motorcycle.rating.overall}</span>
                  <span className="text-sm text-gray-500">({motorcycle.rating.reviews} 评价)</span>
                </div>
              )}

              {/* 价格 */}
              {motorcycle.price?.msrp && (
                <div className="mb-6">
                  <div className="text-2xl font-bold text-primary-600">
                    {formatCurrency(motorcycle.price.msrp)}
                  </div>
                  <div className="text-sm text-gray-500">厂商指导价</div>
                </div>
              )}

              {/* 关键参数 */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {motorcycle.engine?.displacement && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{motorcycle.engine.displacement}cc</div>
                    <div className="text-sm text-gray-500">排量</div>
                  </div>
                )}
                {motorcycle.performance?.power?.hp && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{motorcycle.performance.power.hp}HP</div>
                    <div className="text-sm text-gray-500">功率</div>
                  </div>
                )}
                {motorcycle.performance?.topSpeed && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{motorcycle.performance.topSpeed}</div>
                    <div className="text-sm text-gray-500">最高时速 km/h</div>
                  </div>
                )}
                {motorcycle.dimensions?.weight?.wet && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{motorcycle.dimensions.weight.wet}kg</div>
                    <div className="text-sm text-gray-500">整备质量</div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={handleFavorite}
                  className="flex items-center justify-center"
                >
                  {isFavorite ? (
                    <HeartIconSolid className="h-4 w-4 mr-2 text-red-500" />
                  ) : (
                    <HeartIcon className="h-4 w-4 mr-2" />
                  )}
                  {isFavorite ? '已收藏' : '收藏'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleShare}
                  className="flex items-center justify-center"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  分享
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  onClick={addToComparison}
                  className="flex items-center justify-center"
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  加入对比
                </Button>
                <Link to="/comparison" className="w-full">
                  <Button variant="outline" className="w-full flex items-center justify-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    查看对比
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* 详细信息选项卡 */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab.name}
                  {tab.id === 'reviews' && motorcycle.rating && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {motorcycle.rating.reviews}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'specs' && renderSpecs()}
            {activeTab === 'features' && renderFeatures()}
            {activeTab === 'reviews' && <ReviewSection motorcycle={motorcycle} />}
            {activeTab === 'compare' && (
              <Card className="p-12 text-center">
                <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">参数对比</h3>
                <p className="mt-2 text-gray-600">请到对比页面查看详细的参数对比</p>
                <Link to="/comparison" className="mt-4 inline-block">
                  <Button>前往对比页面</Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}