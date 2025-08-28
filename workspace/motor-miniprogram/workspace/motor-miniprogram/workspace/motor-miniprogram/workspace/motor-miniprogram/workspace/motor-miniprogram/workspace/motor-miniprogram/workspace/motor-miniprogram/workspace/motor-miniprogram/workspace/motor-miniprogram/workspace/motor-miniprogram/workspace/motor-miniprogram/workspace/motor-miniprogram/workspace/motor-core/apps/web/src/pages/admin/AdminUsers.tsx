import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../hooks/useToast'
import type { User } from '../../types'
import { cn } from '../../utils/cn'

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { showToast } = useToast()

  // 模拟用户数据
  const mockUsers: User[] = [
    {
      _id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      favorites: [],
      reviews: [],
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        joinDate: '2024-01-01'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '2',
      username: 'motofan88',
      email: 'fan@example.com',
      role: 'user',
      favorites: ['1', '2'],
      reviews: ['1'],
      profile: {
        firstName: 'Moto',
        lastName: 'Fan',
        bio: '摩托车爱好者',
        location: '上海',
        joinDate: '2024-02-15'
      },
      createdAt: '2024-02-15T00:00:00Z',
      updatedAt: '2024-02-15T00:00:00Z'
    }
  ]

  useEffect(() => {
    loadUsers()
  }, [currentPage, searchTerm, statusFilter, roleFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUsers(mockUsers)
      setTotalPages(1)
    } catch (error) {
      console.error('Failed to load users:', error)
      showToast('加载用户失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      // 模拟 API 调用
      console.log(`Changing user ${userId} status to ${newStatus}`)
      showToast('用户状态已更新', 'success')
      loadUsers()
    } catch (error) {
      showToast('更新失败', 'error')
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (!confirm('确定要修改用户角色吗？')) return

    try {
      // 模拟 API 调用
      console.log(`Changing user ${userId} role to ${newRole}`)
      showToast('用户角色已更新', 'success')
      loadUsers()
    } catch (error) {
      showToast('更新失败', 'error')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="primary" className="flex items-center">
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            管理员
          </Badge>
        )
      case 'user':
        return (
          <Badge variant="secondary" className="flex items-center">
            <UserCircleIcon className="h-3 w-3 mr-1" />
            用户
          </Badge>
        )
      default:
        return <Badge>{role}</Badge>
    }
  }

  const getStatusBadge = (user: User) => {
    // 模拟用户状态逐辑
    const isActive = true // 模拟所有用户都是活跃的
    return isActive ? (
      <Badge variant="success">活跃</Badge>
    ) : (
      <Badge variant="warning">停用</Badge>
    )
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
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
            <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
            <p className="mt-1 text-gray-500">管理系统中的所有用户</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">所有角色</option>
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
          
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">所有状态</option>
            <option value="active">活跃</option>
            <option value="inactive">停用</option>
          </select>
        </div>
      </div>

      {/* 用户列表 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  联系信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活动统计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.avatar}
                            alt={user.username}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.profile?.firstName && user.profile?.lastName
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : user.username}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    {user.profile?.location && (
                      <div className="text-sm text-gray-500">{user.profile.location}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>收藏: {user.favorites.length}</div>
                      <div className="text-gray-500">评价: {user.reviews.length}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      {/* 角色切换 */}
                      <select
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as 'user' | 'admin')}
                      >
                        <option value="user">用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到用户</h3>
            <p className="mt-1 text-sm text-gray-500">请尝试调整搜索条件</p>
          </div>
        )}
      </Card>

      {/* 统计卡片 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">总用户数</dt>
                <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">活跃用户</dt>
                <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldExclamationIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">管理员</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}