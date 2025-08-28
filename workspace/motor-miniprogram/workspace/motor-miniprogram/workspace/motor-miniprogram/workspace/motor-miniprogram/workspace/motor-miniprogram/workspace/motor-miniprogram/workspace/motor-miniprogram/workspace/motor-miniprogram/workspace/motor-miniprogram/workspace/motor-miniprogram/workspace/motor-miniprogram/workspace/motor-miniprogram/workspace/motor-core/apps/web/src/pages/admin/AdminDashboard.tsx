import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  HomeIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { AdminStats } from './AdminStats'
import { AdminMotorcycles } from './AdminMotorcycles'
import { AdminUsers } from './AdminUsers'
import { AdminReviews } from './AdminReviews'
import { AdminSettings } from './AdminSettings'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../utils/cn'

const navigation = [
  { name: '仪表盘', href: '/admin', icon: HomeIcon, id: 'dashboard' },
  { name: '摩托车管理', href: '/admin/motorcycles', icon: TruckIcon, id: 'motorcycles' },
  { name: '用户管理', href: '/admin/users', icon: UserGroupIcon, id: 'users' },
  { name: '评价管理', href: '/admin/reviews', icon: DocumentTextIcon, id: 'reviews' },
  { name: '统计分析', href: '/admin/analytics', icon: ChartBarIcon, id: 'analytics' },
  { name: '系统设置', href: '/admin/settings', icon: CogIcon, id: 'settings' },
]

export const AdminDashboard: React.FC = () => {
  const location = useLocation()
  const [stats, setStats] = useState({
    motorcycles: { total: 0, published: 0, draft: 0 },
    users: { total: 0, active: 0, new: 0 },
    reviews: { total: 0, pending: 0, averageRating: 0 },
    traffic: { pageViews: 0, uniqueVisitors: 0 }
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // 这里将调用实际的API来获取统计数据
      // const response = await adminAPI.getStats()
      // setStats(response)
      
      // 暂时使用模拟数据
      setStats({
        motorcycles: { total: 152, published: 141, draft: 11 },
        users: { total: 1234, active: 1180, new: 54 },
        reviews: { total: 2847, pending: 23, averageRating: 4.2 },
        traffic: { pageViews: 15420, uniqueVisitors: 8341 }
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const getCurrentPage = () => {
    const path = location.pathname
    if (path === '/admin' || path === '/admin/') return 'dashboard'
    if (path.startsWith('/admin/motorcycles')) return 'motorcycles'
    if (path.startsWith('/admin/users')) return 'users'
    if (path.startsWith('/admin/reviews')) return 'reviews'
    if (path.startsWith('/admin/analytics')) return 'analytics'
    if (path.startsWith('/admin/settings')) return 'settings'
    return 'dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* 侧边栏 */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">管理后台</h2>
          </div>
          
          <nav className="mt-6 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = getCurrentPage() === item.id
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'mr-3 h-5 w-5',
                          isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        )}
                      />
                      {item.name}
                      {item.id === 'reviews' && stats.reviews.pending > 0 && (
                        <Badge variant="warning" className="ml-auto">
                          {stats.reviews.pending}
                        </Badge>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/" element={<AdminStats stats={stats} />} />
              <Route path="/motorcycles/*" element={<AdminMotorcycles />} />
              <Route path="/users/*" element={<AdminUsers />} />
              <Route path="/reviews/*" element={<AdminReviews />} />
              <Route path="/analytics" element={<AdminAnalytics stats={stats} />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

// 统计分析组件
const AdminAnalytics: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
        <p className="mt-2 text-gray-600">查看系统详细的数据统计和分析报告</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">总摩托车数</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.motorcycles.total}</dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">用户总数</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.users.total}</dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">评价总数</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.reviews.total}</dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">月活跃用户</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.users.active}</dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">摩托车品牌分布</h3>
          <div className="space-y-4">
            {/* 这里可以集成图表库，如 Chart.js 或 Recharts */}
            <div className="text-center text-gray-500 py-8">
              图表组件将在这里显示
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">用户活跃度趋势</h3>
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              图表组件将在这里显示
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}