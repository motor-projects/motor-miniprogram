import React from 'react'
import { Link } from 'react-router-dom'
import {
  TruckIcon,
  UserGroupIcon,
  DocumentTextIcon,
  EyeIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../utils/format'
import { cn } from '../../utils/cn'
import type { AdminStats as AdminStatsType } from '../../types'

interface AdminStatsProps {
  stats: {
    motorcycles: { total: number; published: number; draft: number }
    users: { total: number; active: number; new: number }
    reviews: { total: number; pending: number; averageRating: number }
    traffic: { pageViews: number; uniqueVisitors: number }
  }
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: '摩托车总数',
      value: stats.motorcycles.total,
      change: '+12',
      changeType: 'increase' as const,
      icon: TruckIcon,
      color: 'blue',
      href: '/admin/motorcycles',
      subStats: [
        { label: '已发布', value: stats.motorcycles.published },
        { label: '草稿', value: stats.motorcycles.draft },
      ]
    },
    {
      title: '用户总数',
      value: stats.users.total,
      change: '+89',
      changeType: 'increase' as const,
      icon: UserGroupIcon,
      color: 'green',
      href: '/admin/users',
      subStats: [
        { label: '活跃用户', value: stats.users.active },
        { label: '新用户', value: stats.users.new },
      ]
    },
    {
      title: '评价总数',
      value: stats.reviews.total,
      change: '+23',
      changeType: 'increase' as const,
      icon: DocumentTextIcon,
      color: 'yellow',
      href: '/admin/reviews',
      subStats: [
        { label: '待审核', value: stats.reviews.pending },
        { label: '平均评分', value: stats.reviews.averageRating, format: (v: number) => v.toFixed(1) },
      ]
    },
    {
      title: '页面浏览量',
      value: stats.traffic.pageViews,
      change: '+5.2%',
      changeType: 'increase' as const,
      icon: EyeIcon,
      color: 'purple',
      href: '/admin/analytics',
      subStats: [
        { label: '独立访客', value: stats.traffic.uniqueVisitors },
      ]
    },
  ]

  const recentActivity = [
    { id: 1, type: 'motorcycle', action: '新增摩托车', item: 'Honda CBR1000RR-R', time: '2 分钟前' },
    { id: 2, type: 'user', action: '新用户注册', item: 'rider2023', time: '15 分钟前' },
    { id: 3, type: 'review', action: '新评价', item: 'Yamaha YZF-R1', time: '1 小时前' },
    { id: 4, type: 'user', action: '用户登录', item: 'motofan88', time: '2 小时前' },
    { id: 5, type: 'motorcycle', action: '更新车型', item: 'Ducati Panigale V4', time: '3 小时前' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'motorcycle': return TruckIcon
      case 'user': return UserGroupIcon
      case 'review': return DocumentTextIcon
      default: return DocumentTextIcon
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'motorcycle': return 'text-blue-600'
      case 'user': return 'text-green-600'
      case 'review': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="mt-2 text-gray-600">欢迎回到管理后台，下面是系统的概览数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
                <div className={cn(
                  'flex-shrink-0 p-3 rounded-full',
                  card.color === 'blue' && 'bg-blue-100',
                  card.color === 'green' && 'bg-green-100',
                  card.color === 'yellow' && 'bg-yellow-100',
                  card.color === 'purple' && 'bg-purple-100'
                )}>
                  <card.icon className={cn(
                    'h-6 w-6',
                    card.color === 'blue' && 'text-blue-600',
                    card.color === 'green' && 'text-green-600',
                    card.color === 'yellow' && 'text-yellow-600',
                    card.color === 'purple' && 'text-purple-600'
                  )} />
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-sm">
                  {card.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={cn(
                    'font-medium',
                    card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {card.change}
                  </span>
                  <span className="text-gray-500 ml-1">迗月</span>
                </div>
                <Link to={card.href}>
                  <Button variant="ghost" size="sm">查看详情</Button>
                </Link>
              </div>
              
              {/* 子统计 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  {card.subStats.map((subStat, index) => (
                    <div key={index}>
                      <span className="block">{subStat.label}</span>
                      <span className="font-medium text-gray-900">
                        {subStat.format ? subStat.format(subStat.value) : subStat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近活动 */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">最近活动</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="p-6 flex items-center space-x-4">
                  <div className={cn('flex-shrink-0 p-2 rounded-full bg-gray-100')}>
                    <Icon className={cn('h-4 w-4', getActivityColor(activity.type))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.action}</span>
                      {' '}
                      <span className="text-gray-600">{activity.item}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-6 py-3 bg-gray-50">
            <Link to="/admin/analytics">
              <Button variant="ghost" size="sm" className="w-full">
                查看所有活动
              </Button>
            </Link>
          </div>
        </Card>

        {/* 快速操作 */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">快速操作</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link to="/admin/motorcycles/new">
              <Button className="w-full justify-start" variant="secondary">
                <TruckIcon className="h-4 w-4 mr-2" />
                添加新摩托车
              </Button>
            </Link>
            <Link to="/admin/reviews">
              <Button className="w-full justify-start" variant="secondary">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                处理待审核评价
                {stats.reviews.pending > 0 && (
                  <Badge variant="warning" className="ml-auto">
                    {stats.reviews.pending}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button className="w-full justify-start" variant="secondary">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                管理用户
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button className="w-full justify-start" variant="secondary">
                <EyeIcon className="h-4 w-4 mr-2" />
                查看系统设置
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}