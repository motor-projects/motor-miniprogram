import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Eye, Compare, Share2, Star } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Motorcycle } from '../../types'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { LazyImage } from '../ui/LazyImage'
import { addToComparison } from '../../store/slices/comparisonSlice'
import { addToFavorites, removeFromFavorites } from '../../store/slices/authSlice'
import { RootState } from '../../store'
import { cn } from '../../utils/cn'
import { formatPrice, formatPower } from '../../utils/format'
import { useToast } from '../../hooks/useToast'

interface MotorcycleCardProps {
  motorcycle: Motorcycle
  viewMode?: 'grid' | 'list'
  showComparison?: boolean
  className?: string
}

export function MotorcycleCard({ 
  motorcycle, 
  viewMode = 'grid',
  showComparison = true,
  className 
}: MotorcycleCardProps) {
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const { user } = useSelector((state: RootState) => state.auth)
  const { items: comparisonItems } = useSelector((state: RootState) => state.comparison)
  
  const isFavorite = user?.favorites.includes(motorcycle._id) || false
  const isInComparison = comparisonItems.some(item => item.motorcycleId === motorcycle._id)
  const canAddToComparison = comparisonItems.length < 3
  
  const mainImage = motorcycle.images?.[0]?.url || '/placeholder-motorcycle.jpg'
  const detailUrl = `/motorcycle/${motorcycle.seo?.slug || motorcycle._id}`
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast({
        title: '请先登录',
        description: '登录后即可收藏摩托车',
        variant: 'warning'
      })
      return
    }
    
    if (isFavorite) {
      dispatch(removeFromFavorites(motorcycle._id))
      toast({
        title: '已取消收藏',
        description: `${motorcycle.brand} ${motorcycle.model}`,
        variant: 'success'
      })
    } else {
      dispatch(addToFavorites(motorcycle._id))
      toast({
        title: '收藏成功',
        description: `${motorcycle.brand} ${motorcycle.model}`,
        variant: 'success'
      })
    }
  }
  
  const handleComparisonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isInComparison) {
      toast({
        title: '已在对比列表中',
        description: '该摩托车已经在对比列表中了',
        variant: 'info'
      })
      return
    }
    
    if (!canAddToComparison) {
      toast({
        title: '对比列表已满',
        description: '最多只能对比3款摩托车',
        variant: 'warning'
      })
      return
    }
    
    dispatch(addToComparison(motorcycle))
    toast({
      title: '已加入对比',
      description: `${motorcycle.brand} ${motorcycle.model}`,
      variant: 'success'
    })
  }
  
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.share({
        title: `${motorcycle.brand} ${motorcycle.model}`,
        text: `查看这款 ${motorcycle.brand} ${motorcycle.model} 的详细信息`,
        url: window.location.origin + detailUrl
      })
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.origin + detailUrl)
      toast({
        title: '链接已复制',
        description: '分享链接已复制到剪贴板',
        variant: 'success'
      })
    }
  }
  
  if (viewMode === 'list') {
    return (
      <Card className={cn('overflow-hidden', className)} hover="lift">
        <Link to={detailUrl} className="block">
          <div className="flex gap-4 p-4">
            <div className="relative w-32 h-20 flex-shrink-0">
              <LazyImage
                src={mainImage}
                alt={`${motorcycle.brand} ${motorcycle.model}`}
                className="w-full h-full object-cover rounded-md"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-neutral-200 animate-pulse rounded-md" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 truncate">
                    {motorcycle.brand} {motorcycle.model}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {motorcycle.year} • {motorcycle.category}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {motorcycle.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{motorcycle.rating.overall}</span>
                        <span className="text-sm text-neutral-500">({motorcycle.rating.reviews})</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFavoriteClick}
                    className={cn(
                      'text-neutral-400 hover:text-red-500',
                      isFavorite && 'text-red-500'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
                  </Button>
                  
                  {showComparison && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleComparisonClick}
                      className={cn(
                        'text-neutral-400 hover:text-blue-500',
                        isInComparison && 'text-blue-500'
                      )}
                      disabled={!canAddToComparison && !isInComparison}
                    >
                      <Compare className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  {motorcycle.performance?.power?.hp && (
                    <Badge variant="secondary" size="sm">
                      {formatPower(motorcycle.performance.power)}
                    </Badge>
                  )}
                  {motorcycle.engine?.displacement && (
                    <Badge variant="outline" size="sm">
                      {motorcycle.engine.displacement}cc
                    </Badge>
                  )}
                </div>
                
                {motorcycle.price?.msrp && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900">
                      {formatPrice(motorcycle.price)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="overflow-hidden group" hover="lift">
        <Link to={detailUrl} className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            <LazyImage
              src={mainImage}
              alt={`${motorcycle.brand} ${motorcycle.model}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onLoad={() => setImageLoaded(true)}
            />
            
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
            )}
            
            {/* 悬浮按钮 */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteClick}
                className={cn(
                  'bg-white/80 backdrop-blur-sm text-neutral-600 hover:text-red-500 hover:bg-white',
                  isFavorite && 'text-red-500'
                )}
              >
                <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
              </Button>
              
              {showComparison && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleComparisonClick}
                  className={cn(
                    'bg-white/80 backdrop-blur-sm text-neutral-600 hover:text-blue-500 hover:bg-white',
                    isInComparison && 'text-blue-500'
                  )}
                  disabled={!canAddToComparison && !isInComparison}
                >
                  <Compare className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* 分类标签 */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary">
                {motorcycle.category}
              </Badge>
            </div>
            
            {/* 评分 */}
            {motorcycle.rating && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{motorcycle.rating.overall}</span>
              </div>
            )}
            
            {/* 查看详情覆盖层 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button variant="ghost" className="bg-white/90 backdrop-blur-sm">
                <Eye className="w-4 h-4 mr-2" />
                查看详情
              </Button>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-neutral-900 text-lg leading-tight">
                  {motorcycle.brand} {motorcycle.model}
                </h3>
                <p className="text-sm text-neutral-600">
                  {motorcycle.year} • {motorcycle.category}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {motorcycle.performance?.power?.hp && (
                  <Badge variant="secondary" size="sm">
                    {formatPower(motorcycle.performance.power)}
                  </Badge>
                )}
                {motorcycle.engine?.displacement && (
                  <Badge variant="outline" size="sm">
                    {motorcycle.engine.displacement}cc
                  </Badge>
                )}
                {motorcycle.performance?.topSpeed && (
                  <Badge variant="outline" size="sm">
                    {motorcycle.performance.topSpeed}km/h
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                {motorcycle.price?.msrp ? (
                  <div>
                    <p className="text-lg font-bold text-neutral-900">
                      {formatPrice(motorcycle.price)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-neutral-500">价格面议</p>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  )
}