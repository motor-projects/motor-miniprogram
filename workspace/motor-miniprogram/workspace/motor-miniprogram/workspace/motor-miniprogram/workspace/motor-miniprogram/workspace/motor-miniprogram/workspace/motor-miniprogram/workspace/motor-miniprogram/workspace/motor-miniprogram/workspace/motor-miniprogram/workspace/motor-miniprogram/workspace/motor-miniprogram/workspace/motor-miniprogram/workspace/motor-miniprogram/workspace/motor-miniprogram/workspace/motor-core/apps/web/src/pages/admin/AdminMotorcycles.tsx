import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { LazyImage } from '../../components/ui/LazyImage'
import { MotorcycleForm } from '../../components/admin/MotorcycleForm'
import { useToast } from '../../hooks/useToast'
import { motorcycleApi } from '../../services/api'
import type { Motorcycle, MotorcycleFilters } from '../../types'
import { cn } from '../../utils/cn'
import { formatCurrency, formatPower } from '../../utils/format'

interface AdminMotorcycleListProps {
  onEdit: (motorcycle: Motorcycle) => void
  onDelete: (id: string) => void
}

const AdminMotorcycleList: React.FC<AdminMotorcycleListProps> = ({ onEdit, onDelete }) => {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState<MotorcycleFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { showToast } = useToast()

  useEffect(() => {
    loadMotorcycles()
  }, [currentPage, filters, searchTerm])

  const loadMotorcycles = async () => {
    setLoading(true)
    try {
      const response = await motorcycleApi.getMotorcycles({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        ...filters
      })
      setMotorcycles(response.motorcycles)
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      console.error('Failed to load motorcycles:', error)
      showToast('加载失败，请稍后重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(motorcycles.map(m => m._id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    
    if (!confirm(`确定要删除选中的 ${selectedItems.length} 台摩托车吗？`)) return

    try {
      await Promise.all(selectedItems.map(id => motorcycleApi.deleteMotorcycle(id)))
      showToast(`已成功删除 ${selectedItems.length} 台摩托车`, 'success')
      setSelectedItems([])
      loadMotorcycles()
    } catch (error) {
      showToast('批量删除失败，请稍后重试', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">已发布</Badge>
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>
      case 'archived':
        return <Badge variant="warning">已归档</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* 头部和搜索 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">摩托车管理</h1>
            <p className="mt-1 text-gray-500">管理所有摩托车信息和数据</p>
          </div>
          <Link to="/admin/motorcycles/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加摩托车
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索摩托车..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm">
            <FunnelIcon className="h-4 w-4 mr-2" />
            筛选
          </Button>
          {selectedItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <TrashIcon className="h-4 w-4 mr-2" />
              删除选中的 ({selectedItems.length})
            </Button>
          )}
        </div>
      </div>

      {/* 摩托车列表 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedItems.length === motorcycles.length && motorcycles.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  摩托车
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  性能
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {motorcycles.map((motorcycle) => (
                <tr key={motorcycle._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedItems.includes(motorcycle._id)}
                      onChange={(e) => handleSelectItem(motorcycle._id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <LazyImage
                        src={motorcycle.images?.[0]?.url || '/placeholder-motorcycle.jpg'}
                        alt={`${motorcycle.brand} ${motorcycle.model}`}
                        className="h-12 w-16 object-cover rounded-lg mr-4"
                      />
                      <div>
                        <Link
                          to={`/motorcycle/${motorcycle.seo?.slug}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {motorcycle.brand} {motorcycle.model}
                        </Link>
                        <p className="text-xs text-gray-500">{motorcycle.year}年</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p>{motorcycle.category}</p>
                      {motorcycle.engine?.displacement && (
                        <p className="text-xs text-gray-500">{motorcycle.engine.displacement}cc</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      {motorcycle.performance?.power?.hp && (
                        <p>{formatPower(motorcycle.performance.power.hp)}</p>
                      )}
                      {motorcycle.performance?.topSpeed && (
                        <p className="text-xs text-gray-500">{motorcycle.performance.topSpeed} km/h</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {motorcycle.price?.msrp ? formatCurrency(motorcycle.price.msrp) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(motorcycle.status)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link to={`/motorcycle/${motorcycle.seo?.slug}`}>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(motorcycle)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(motorcycle._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <p className="text-sm text-gray-700">
                第 {currentPage} 页，共 {totalPages} 页
              </p>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export const AdminMotorcycles: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const handleEdit = (motorcycle: Motorcycle) => {
    navigate(`/admin/motorcycles/edit/${motorcycle._id}`, { state: { motorcycle } })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这台摩托车吗？')) return

    try {
      await motorcycleApi.deleteMotorcycle(id)
      showToast('删除成功', 'success')
      // 重新加载列表
    } catch (error) {
      showToast('删除失败，请稍后重试', 'error')
    }
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={<AdminMotorcycleList onEdit={handleEdit} onDelete={handleDelete} />} 
      />
      <Route path="/new" element={<MotorcycleForm />} />
      <Route path="/edit/:id" element={<MotorcycleForm />} />
    </Routes>
  )
}