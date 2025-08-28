import React, { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import type { Review } from '../../types'
import { cn } from '../../utils/cn'

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const { showToast } = useToast()

  // 模拟评价数据
  const mockReviews: Review[] = [
    {
      _id: '1',
      motorcycleId: '1',
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
      content: '这台车的性能表现非常出色，动力强劲，操控精准。外观设计也很漂亮，是一台值得推荐的好车。',
      pros: ['动力强劲', '操控精准', '外观漂亮'],
      cons: ['油耗略高', '维修成本贵'],
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
      motorcycleId: '2',
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
      content: '整体还不错，但是有一些小问题需要改进。希望厂家能够持续优化。',
      pros: ['性能不错'],
      cons: ['舒适度一般', '性价比不高'],
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
  }, [searchTerm, statusFilter])

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

  const handleApprove = async (reviewId: string) => {
    try {
      // 模拟 API 调用
      console.log(`Approving review ${reviewId}`)
      showToast('评价已通过审核', 'success')
      loadReviews()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleReject = async (reviewId: string) => {
    if (!confirm('确定要拒绝这条评价吗？')) return

    try {
      // 模拟 API 调用
      console.log(`Rejecting review ${reviewId}`)
      showToast('评价已拒绝', 'success')
      loadReviews()
    } catch (error) {
      showToast('操作失败', 'error')
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('确定要删除这条评价吗？该操作不可恢复。')) return

    try {
      // 模拟 API 调用
      console.log(`Deleting review ${reviewId}`)
      showToast('评价已删除', 'success')
      loadReviews()
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  const getStatusBadge = (review: Review) => {
    if (review.verified) {
      return <Badge variant="success">已通过</Badge>
    } else {
      return <Badge variant="warning">待审核</Badge>
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={cn(
              'h-4 w-4',
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            )}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}</span>
      </div>
    )
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'pending' && !review.verified) ||
                         (statusFilter === 'approved' && review.verified)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">评价管理</h1>
            <p className="mt-1 text-gray-500">管理所有用户评价和反馈</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索评价内容..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">所有评价</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
          </select>
        </div>
      </div>

      {/* 评价列表 */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <Card key={review._id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 评价头部 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
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
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{review.title}</h3>
                      <p className="text-sm text-gray-500">
                        由 <span className="font-medium">{review.user.username}</span> 发表于 {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(review)}
                    {review.verified && (
                      <Badge variant="primary">已验证</Badge>
                    )}
                  </div>
                </div>

                {/* 评分 */}
                <div className="mb-4">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 mr-2">综合评分:</span>
                      {renderStars(review.rating.overall)}
                    </div>
                    <div className="text-sm text-gray-500">
                      有用: {review.helpful.count} 人
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">性能:</span>
                      <span className="ml-1 font-medium">{review.rating.performance}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">舒适:</span>
                      <span className="ml-1 font-medium">{review.rating.comfort}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">可靠:</span>
                      <span className="ml-1 font-medium">{review.rating.reliability}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">性价比:</span>
                      <span className="ml-1 font-medium">{review.rating.value}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">外观:</span>
                      <span className="ml-1 font-medium">{review.rating.styling}</span>
                    </div>
                  </div>
                </div>

                {/* 评价内容 */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{review.content}</p>
                </div>

                {/* 优缺点 */}
                {(review.pros.length > 0 || review.cons.length > 0) && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {review.pros.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2">优点</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {review.pros.map((pro, index) => (
                            <li key={index} className="flex items-center">
                              <CheckIcon className="h-3 w-3 text-green-600 mr-2" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.cons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2">缺点</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {review.cons.map((con, index) => (
                            <li key={index} className="flex items-center">
                              <XMarkIcon className="h-3 w-3 text-red-600 mr-2" />
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
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">使用情况</h4>
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

                {/* 操作按钮 */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReview(review)}
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    查看详情
                  </Button>
                  
                  {!review.verified && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApprove(review._id)}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        通过
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(review._id)}
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        拒绝
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(review._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <Card className="p-12 text-center">
          <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到评价</h3>
          <p className="mt-1 text-sm text-gray-500">请尝试调整搜索条件</p>
        </Card>
      )}

      {/* 统计信息 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
            <div className="text-sm text-gray-500">总评价数</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reviews.filter(r => !r.verified).length}
            </div>
            <div className="text-sm text-gray-500">待审核</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {reviews.filter(r => r.verified).length}
            </div>
            <div className="text-sm text-gray-500">已通过</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating.overall, 0) / reviews.length).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-500">平均评分</div>
          </div>
        </Card>
      </div>
    </div>
  )
}