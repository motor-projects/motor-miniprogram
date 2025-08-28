import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { StarIcon, HandThumbUpIcon, HandThumbDownIcon, FlagIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ReviewForm } from './ReviewForm'
import { useToast } from '../../hooks/useToast'
import { RootState } from '../../store'
import type { Review, Motorcycle } from '../../types'
import { cn } from '../../utils/cn'

interface ReviewSectionProps {
  motorcycle: Motorcycle
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ motorcycle }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { showToast } = useToast()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest')
  const [filterRating, setFilterRating] = useState<number | null>(null)

  // 模拟评价数据
  const mockReviews: Review[] = [
    {
      _id: '1',
      motorcycleId: motorcycle._id,
      userId: '2',
      user: {
        username: 'motofan88',
        avatar: undefined
      },
      rating: {
        overall: 4.5,
        performance: 5,
        comfort: 4,
        reliability: 4,
        value: 4,
        styling: 5
      },
      title: '非常出色的摩托车',
      content: '这台车的性能表现非常出色，动力强劲，操控精准。外观设计也很漂亮，是一台值得推荐的好车。在日常使用中，这台车的表现超出了我的预期。无论是在城市道路还是高速公路上，都能给人带来非常好的驾驶体验。',
      pros: ['动力强劲', '操控精准', '外观漂亮', '做工精细'],
      cons: ['油耗略高', '维修成本贵', '座椅偏硬'],
      ownership: {
        duration: '1年',
        mileage: 15000,
        useCase: '日常通勤'
      },
      helpful: {
        count: 12,
        users: ['3', '4', '5']
      },
      verified: true,
      createdAt: '2024-08-20T10:30:00Z',
      updatedAt: '2024-08-20T10:30:00Z'
    },
    {
      _id: '2',
      motorcycleId: motorcycle._id,
      userId: '3',
      user: {
        username: 'rider2023'
      },
      rating: {
        overall: 3.5,
        performance: 4,
        comfort: 3,
        reliability: 4,
        value: 3,
        styling: 4
      },
      title: '还可以，有些小问题',
      content: '整体还不错，但是有一些小问题需要改进。希望厂家能够持续优化。使用了大概半年时间，整体来说还是满意的。',
      pros: ['性能不错', '维护方便'],
      cons: ['舒适度一般', '性价比不高', '噪音偏大'],
      helpful: {
        count: 5,
        users: ['4']
      },
      verified: false,
      createdAt: '2024-08-19T15:20:00Z',
      updatedAt: '2024-08-19T15:20:00Z'
    }
  ]

  useEffect(() => {
    loadReviews()
  }, [motorcycle._id])

  const loadReviews = async () => {
    setLoading(true)
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setReviews(mockReviews)
    } catch (error) {
      console.error('Failed to load reviews:', error)
      showToast('加载评价失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async (reviewData: any) => {
    try {
      // 模拟 API 调用
      console.log('Submitting review:', reviewData)
      showToast('评价提交成功，等待审核', 'success')
      setShowReviewForm(false)
      loadReviews()
    } catch (error) {
      showToast('评价提交失败', 'error')
    }
  }

  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!isAuthenticated) {
      showToast('请先登录', 'warning')
      return
    }

    try {
      // 模拟 API 调用
      console.log(`Marking review ${reviewId} as ${isHelpful ? 'helpful' : 'not helpful'}`)
      showToast(isHelpful ? '已标记为有用' : '已标记为无用', 'success')
      loadReviews()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleReport = async (reviewId: string, reason: string) => {
    if (!isAuthenticated) {
      showToast('请先登录', 'warning')
      return
    }

    try {
      // 模拟 API 调用
      console.log(`Reporting review ${reviewId} for: ${reason}`)
      showToast('举报已提交，我们将尽快处理', 'success')
    } catch (error) {
      showToast('举报失败', 'error')
    }
  }

  const renderStars = (rating: number, large = false) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          const filled = i < Math.floor(rating)
          const halfFilled = i === Math.floor(rating) && rating % 1 !== 0
          
          return (
            <div key={i} className="relative">
              <StarIcon className={cn(
                large ? 'h-5 w-5' : 'h-4 w-4',
                'text-gray-300'
              )} />
              {(filled || halfFilled) && (
                <StarIconSolid 
                  className={cn(
                    large ? 'h-5 w-5' : 'h-4 w-4',
                    'absolute inset-0 text-yellow-400',
                    halfFilled && 'w-1/2 overflow-hidden'
                  )}
                />
              )}
            </div>
          )
        })}
        <span className={cn(
          'ml-1 font-medium',
          large ? 'text-base' : 'text-sm',
          'text-gray-700'
        )}>
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  const sortedAndFilteredReviews = reviews
    .filter(review => filterRating === null || Math.floor(review.rating.overall) === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'highest':
          return b.rating.overall - a.rating.overall
        case 'lowest':
          return a.rating.overall - b.rating.overall
        case 'helpful':
          return b.helpful.count - a.helpful.count
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating.overall, 0) / reviews.length
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => Math.floor(r.rating.overall) === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => Math.floor(r.rating.overall) === rating).length / reviews.length) * 100
      : 0
  }))

  return (
    <div className="space-y-8">
      {/* 评价概览 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(averageRating, true)}
            <p className="text-sm text-gray-500 mt-2">
              基于 {reviews.length} 条评价
            </p>
          </div>
          
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium w-3">{rating}</span>
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 评价操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">最新</option>
            <option value="oldest">最早</option>
            <option value="highest">评分最高</option>
            <option value="lowest">评分最低</option>
            <option value="helpful">最有用</option>
          </select>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">所有评分</option>
            <option value="5">5 星</option>
            <option value="4">4 星</option>
            <option value="3">3 星</option>
            <option value="2">2 星</option>
            <option value="1">1 星</option>
          </select>
        </div>
        
        {isAuthenticated ? (
          <Button onClick={() => setShowReviewForm(true)}>
            写评价
          </Button>
        ) : (
          <Button onClick={() => showToast('请先登录后再评价', 'warning')}>
            登录后评价
          </Button>
        )}
      </div>

      {/* 评价列表 */}
      <div className="space-y-6">
        {sortedAndFilteredReviews.map((review) => (
          <Card key={review._id} className="p-6">
            {/* 评价头部 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {review.user.avatar ? (
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={review.user.avatar}
                      alt={review.user.username}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {review.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{review.user.username}</h3>
                    {review.verified && (
                      <Badge variant="success" className="text-xs">已验证</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {renderStars(review.rating.overall)}
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 评价内容 */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              <p className="text-gray-700 leading-relaxed">{review.content}</p>
            </div>

            {/* 详细评分 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-500">性能</div>
                <div className="font-medium">{review.rating.performance}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">舒适</div>
                <div className="font-medium">{review.rating.comfort}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">可靠</div>
                <div className="font-medium">{review.rating.reliability}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">性价比</div>
                <div className="font-medium">{review.rating.value}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">外观</div>
                <div className="font-medium">{review.rating.styling}</div>
              </div>
            </div>

            {/* 优缺点 */}
            {(review.pros.length > 0 || review.cons.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {review.pros.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-green-700 mb-2">优点</h5>
                    <ul className="space-y-1">
                      {review.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {review.cons.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-700 mb-2">缺点</h5>
                    <ul className="space-y-1">
                      {review.cons.map((con, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 使用情况 */}
            {review.ownership && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">使用情况</h5>
                <div className="text-sm text-gray-600 grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-500">持有时间:</span>
                    <span className="ml-1 font-medium">{review.ownership.duration}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">里程:</span>
                    <span className="ml-1 font-medium">{review.ownership.mileage.toLocaleString()} 公里</span>
                  </div>
                  <div>
                    <span className="text-gray-500">使用场景:</span>
                    <span className="ml-1 font-medium">{review.ownership.useCase}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 评价操作 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleHelpful(review._id, true)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600 transition-colors"
                >
                  <HandThumbUpIcon className="h-4 w-4" />
                  <span>有用 ({review.helpful.count})</span>
                </button>
                <button
                  onClick={() => handleHelpful(review._id, false)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  <HandThumbDownIcon className="h-4 w-4" />
                  <span>无用</span>
                </button>
              </div>
              <button
                onClick={() => handleReport(review._id, '不当内容')}
                className="flex items-center space-x-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FlagIcon className="h-4 w-4" />
                <span>举报</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {sortedAndFilteredReviews.length === 0 && (
        <Card className="p-12 text-center">
          <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无评价</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterRating ? `暂无 ${filterRating} 星评价` : '该摩托车尚未收到评价'}
          </p>
          {isAuthenticated && (
            <Button 
              className="mt-4" 
              onClick={() => setShowReviewForm(true)}
            >
              成为第一个评价者
            </Button>
          )}
        </Card>
      )}

      {/* 评价表单模态框 */}
      {showReviewForm && (
        <ReviewForm
          motorcycle={motorcycle}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
    </div>
  )
}