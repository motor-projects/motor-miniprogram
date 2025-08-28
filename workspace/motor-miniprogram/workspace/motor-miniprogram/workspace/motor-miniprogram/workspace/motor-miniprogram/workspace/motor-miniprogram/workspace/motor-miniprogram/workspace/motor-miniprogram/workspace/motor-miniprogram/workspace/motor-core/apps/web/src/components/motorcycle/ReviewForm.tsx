import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { StarIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import type { Motorcycle } from '../../types'
import { cn } from '../../utils/cn'

interface ReviewFormProps {
  motorcycle: Motorcycle
  onSubmit: (data: any) => void
  onCancel: () => void
}

interface ReviewFormData {
  rating: {
    overall: number
    performance: number
    comfort: number
    reliability: number
    value: number
    styling: number
  }
  title: string
  content: string
  pros: string[]
  cons: string[]
  ownership?: {
    duration: string
    mileage: number
    useCase: string
  }
}

const ratingCategories = [
  { key: 'overall', name: '综合评分', description: '总体满意度' },
  { key: 'performance', name: '性能表现', description: '动力、加速、操控' },
  { key: 'comfort', name: '舒适度', description: '驾驶姿势、座椅、震动' },
  { key: 'reliability', name: '可靠性', description: '质量、耐用性、故障率' },
  { key: 'value', name: '性价比', description: '价格与性能的匹配度' },
  { key: 'styling', name: '外观设计', description: '造型、配色、细节' }
] as const

export const ReviewForm: React.FC<ReviewFormProps> = ({ motorcycle, onSubmit, onCancel }) => {
  const [ratings, setRatings] = useState({
    overall: 0,
    performance: 0,
    comfort: 0,
    reliability: 0,
    value: 0,
    styling: 0
  })
  const [pros, setPros] = useState<string[]>([])
  const [cons, setCons] = useState<string[]>([])
  const [currentPro, setCurrentPro] = useState('')
  const [currentCon, setCurrentCon] = useState('')
  const [showOwnership, setShowOwnership] = useState(false)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReviewFormData>()

  const setRating = (category: string, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }))
  }

  const addPro = () => {
    if (currentPro.trim() && pros.length < 5) {
      setPros(prev => [...prev, currentPro.trim()])
      setCurrentPro('')
    }
  }

  const addCon = () => {
    if (currentCon.trim() && cons.length < 5) {
      setCons(prev => [...prev, currentCon.trim()])
      setCurrentCon('')
    }
  }

  const removePro = (index: number) => {
    setPros(prev => prev.filter((_, i) => i !== index))
  }

  const removeCon = (index: number) => {
    setCons(prev => prev.filter((_, i) => i !== index))
  }

  const onFormSubmit = (data: any) => {
    // 验证评分
    if (ratings.overall === 0) {
      alert('请给出综合评分')
      return
    }

    const reviewData = {
      ...data,
      rating: ratings,
      pros,
      cons,
      motorcycleId: motorcycle._id,
      ...(showOwnership && data.ownership && {
        ownership: {
          duration: data.ownership.duration,
          mileage: parseInt(data.ownership.mileage),
          useCase: data.ownership.useCase
        }
      })
    }

    onSubmit(reviewData)
  }

  const renderStarRating = (category: string, current: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(category, star)}
            className={cn(
              'p-1 rounded transition-colors',
              current >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            )}
          >
            {current >= star ? (
              <StarIconSolid className="h-6 w-6" />
            ) : (
              <StarIcon className="h-6 w-6" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {current > 0 ? `${current}.0` : '请评分'}
        </span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">写评价</h2>
              <p className="text-sm text-gray-600 mt-1">
                {motorcycle.brand} {motorcycle.model} ({motorcycle.year})
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            {/* 评分区域 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">评分</h3>
              <div className="space-y-4">
                {ratingCategories.map((category) => (
                  <div key={category.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <div className="ml-4">
                      {renderStarRating(category.key, ratings[category.key as keyof typeof ratings])}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 评价内容 */}
            <div className="space-y-4">
              <Input
                label="评价标题 *"
                {...register('title', { required: '请输入评价标题' })}
                error={errors.title?.message}
                placeholder="简要总结您的使用感受"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细评价 *
                </label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  {...register('content', { 
                    required: '请输入详细评价',
                    minLength: { value: 20, message: '评价内容至少20个字符' }
                  })}
                  placeholder="请分享您的使用感受、驾驶体验等，帮助其他用户了解这台车..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
            </div>

            {/* 优缺点 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 优点 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">优点</h4>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="输入优点"
                      value={currentPro}
                      onChange={(e) => setCurrentPro(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPro())}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addPro}
                      disabled={!currentPro.trim() || pros.length >= 5}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {pros.map((pro, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-green-800">{pro}</span>
                        <button
                          type="button"
                          onClick={() => removePro(index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">最多可添加 5 个优点</p>
                </div>
              </div>

              {/* 缺点 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">缺点</h4>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="输入缺点"
                      value={currentCon}
                      onChange={(e) => setCurrentCon(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCon())}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addCon}
                      disabled={!currentCon.trim() || cons.length >= 5}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {cons.map((con, index) => (
                      <div key={index} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-red-800">{con}</span>
                        <button
                          type="button"
                          onClick={() => removeCon(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">最多可添加 5 个缺点</p>
                </div>
              </div>
            </div>

            {/* 使用情况 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="ownership"
                  className="rounded"
                  checked={showOwnership}
                  onChange={(e) => setShowOwnership(e.target.checked)}
                />
                <label htmlFor="ownership" className="font-medium text-gray-900">
                  添加使用情况 (可选)
                </label>
              </div>
              
              {showOwnership && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <Input
                    label="持有时间"
                    {...register('ownership.duration')}
                    placeholder="例: 2年"
                  />
                  <Input
                    label="行驶里程 (公里)"
                    type="number"
                    {...register('ownership.mileage')}
                    placeholder="例: 15000"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">使用场景</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      {...register('ownership.useCase')}
                    >
                      <option value="">选择场景</option>
                      <option value="日常通勤">日常通勤</option>
                      <option value="周末休闲">周末休闲</option>
                      <option value="长途旅行">长途旅行</option>
                      <option value="跑道驾驶">跑道驾驶</option>
                      <option value="越野探险">越野探险</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={ratings.overall === 0}
              >
                发布评价
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}