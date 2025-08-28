import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tab } from '@headlessui/react'
import { UserCircleIcon, HeartIcon, StarIcon, CogIcon } from '@heroicons/react/24/outline'
import { RootState, AppDispatch } from '../store'
import { updateUser } from '../store/slices/authSlice'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { MotorcycleCard } from '../components/motorcycle/MotorcycleCard'
import { useToast } from '../hooks/useToast'
import { authAPI } from '../services/authAPI'
import { motorcycleApi } from '../services/api'
import type { User, Motorcycle, Review } from '../types'
import { cn } from '../utils/cn'

const tabs = [
  { name: '个人信息', icon: UserCircleIcon, id: 'profile' },
  { name: '收藏夹', icon: HeartIcon, id: 'favorites' },
  { name: '我的评价', icon: StarIcon, id: 'reviews' },
  { name: '设置', icon: CogIcon, id: 'settings' },
]

export const UserProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)
  const { showToast } = useToast()
  
  const [selectedTab, setSelectedTab] = useState(0)
  const [favorites, setFavorites] = useState<Motorcycle[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
  })

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      // 加载收藏
      const favoritesResponse = await authAPI.getFavorites()
      setFavorites(favoritesResponse.favorites)
      
      // 加载评价
      const reviewsResponse = await authAPI.getUserReviews()
      setReviews(reviewsResponse.reviews)
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(updateUser(formData)).unwrap()
      setIsEditing(false)
      showToast('个人信息更新成功', 'success')
    } catch (error) {
      showToast('更新失败，请稍后重试', 'error')
    }
  }

  const handleRemoveFavorite = async (motorcycleId: string) => {
    try {
      await authAPI.removeFavorite(motorcycleId)
      setFavorites(prev => prev.filter(m => m._id !== motorcycleId))
      showToast('已从收藏夹移除', 'success')
    } catch (error) {
      showToast('操作失败，请稍后重试', 'error')
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">用户中心</h1>
        <p className="mt-2 text-gray-600">管理您的个人信息、收藏和评价</p>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-8">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                cn(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {/* 个人信息 */}
          <Tab.Panel>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">个人信息</h2>
                <Button
                  variant={isEditing ? 'secondary' : 'primary'}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? '取消' : '编辑'}
                </Button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="用户名"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                    <Input
                      label="邮箱"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    <Input
                      label="姓"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                    <Input
                      label="名"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                    <Input
                      label="所在地"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      个人简介
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="介绍一下您自己..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                      取消
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                      保存
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="h-20 w-20 rounded-full object-cover" />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {user.profile?.firstName && user.profile?.lastName
                          ? `${user.profile.firstName} ${user.profile.lastName}`
                          : user.username}
                      </h3>
                      <p className="text-gray-500">{user.email}</p>
                      <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                        {user.role === 'admin' ? '管理员' : '用户'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-gray-500">所在地</label>
                      <p className="mt-1 text-gray-900">{user.profile?.location || '未设置'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">注册时间</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {user.profile?.bio && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500">个人简介</label>
                      <p className="mt-1 text-gray-900">{user.profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Tab.Panel>

          {/* 收藏夹 */}
          <Tab.Panel>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">我的收藏</h2>
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无收藏</h3>
                  <p className="mt-1 text-sm text-gray-500">浏览摩托车页面时点击收藏按钮</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((motorcycle) => (
                    <div key={motorcycle._id} className="relative">
                      <MotorcycleCard motorcycle={motorcycle} />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveFavorite(motorcycle._id)}
                      >
                        移除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Tab.Panel>

          {/* 我的评价 */}
          <Tab.Panel>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">我的评价</h2>
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无评价</h3>
                  <p className="mt-1 text-sm text-gray-500">在摩托车详情页发表您的评价</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{review.title}</h3>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={cn(
                                    'h-4 w-4',
                                    i < review.rating.overall ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-2 text-gray-600">{review.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Tab.Panel>

          {/* 设置 */}
          <Tab.Panel>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">账户设置</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-base font-medium text-gray-900">偏好设置</label>
                  <p className="text-sm text-gray-500">自定义您的使用体验</p>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">单位制</span>
                      <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                        <option value="metric">公制</option>
                        <option value="imperial">英制</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">邮件通知</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <hr />
                
                <div>
                  <label className="text-base font-medium text-gray-900">安全设置</label>
                  <p className="text-sm text-gray-500">管理您的账户安全</p>
                  <div className="mt-4 space-y-3">
                    <Button variant="secondary" size="sm">
                      修改密码
                    </Button>
                    <Button variant="secondary" size="sm">
                      两步验证
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}