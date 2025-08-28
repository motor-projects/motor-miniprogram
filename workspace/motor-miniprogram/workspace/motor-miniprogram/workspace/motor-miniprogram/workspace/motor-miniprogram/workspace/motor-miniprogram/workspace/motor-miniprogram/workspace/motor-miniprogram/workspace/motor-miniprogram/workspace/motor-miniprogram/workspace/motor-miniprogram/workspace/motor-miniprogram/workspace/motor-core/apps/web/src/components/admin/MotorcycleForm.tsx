import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PhotoIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { useToast } from '../../hooks/useToast'
import { motorcycleApi, uploadApi } from '../../services/api'
import type { Motorcycle } from '../../types'
import { cn } from '../../utils/cn'

interface MotorcycleFormData {
  brand: string
  model: string
  year: number
  category: string
  price?: {
    msrp?: number
    currency: string
  }
  engine?: {
    type?: string
    displacement?: number
    bore?: number
    stroke?: number
    compressionRatio?: string
    cooling?: string
    fuelSystem?: string
    valvesPerCylinder?: number
    maxRpm?: number
  }
  performance?: {
    power?: {
      hp?: number
      kw?: number
      rpm?: number
    }
    torque?: {
      nm?: number
      lbft?: number
      rpm?: number
    }
    topSpeed?: number
    acceleration?: {
      zeroToSixty?: number
      zeroToHundred?: number
      quarterMile?: number
    }
    fuelEconomy?: {
      city?: number
      highway?: number
      combined?: number
    }
  }
  dimensions?: {
    length?: number
    width?: number
    height?: number
    wheelbase?: number
    seatHeight?: number
    groundClearance?: number
    weight?: {
      dry?: number
      wet?: number
      gvwr?: number
    }
    fuelCapacity?: number
  }
  transmission?: {
    type?: string
    gears?: number
  }
  suspension?: {
    front?: string
    rear?: string
  }
  brakes?: {
    front?: string
    rear?: string
    abs?: boolean
  }
  wheels?: {
    front?: {
      size?: string
      tire?: string
    }
    rear?: {
      size?: string
      tire?: string
    }
  }
  features?: string[]
  tags?: string[]
  status: string
  seo?: {
    slug: string
    metaTitle?: string
    metaDescription?: string
  }
}

const motorcycleCategories = [
  '跑车',
  '街车',
  '旅行',
  '越野',
  '巡航',
  '复古',
  '踏板',
  '电动',
  '其他'
]

const engineTypes = [
  '单缸',
  '双缸',
  '三缸',
  '四缸',
  '六缸',
  'V型双缸',
  '水平对置',
  '电动机'
]

export const MotorcycleForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEdit = !!id
  const existingMotorcycle = location.state?.motorcycle as Motorcycle
  const { showToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<Array<{ url: string; alt?: string; file?: File }>>([])
  const [uploadingImages, setUploadingImages] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('basic')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MotorcycleFormData>({
    defaultValues: {
      status: 'draft',
      price: { currency: 'CNY' },
      features: [],
      tags: []
    }
  })

  useEffect(() => {
    if (isEdit && existingMotorcycle) {
      reset({
        ...existingMotorcycle,
        year: existingMotorcycle.year,
      })
      if (existingMotorcycle.images) {
        setImages(existingMotorcycle.images.map(img => ({ url: img.url, alt: img.alt })))
      }
    }
  }, [isEdit, existingMotorcycle, reset])

  const handleImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    const newUploadIds = fileArray.map(f => f.name + Date.now())
    setUploadingImages(prev => [...prev, ...newUploadIds])

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        try {
          const response = await uploadApi.uploadSingle(file)
          return { url: response.url, alt: file.name }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          showToast(`上传 ${file.name} 失败`, 'error')
          return null
        } finally {
          setUploadingImages(prev => prev.filter(id => id !== newUploadIds[index]))
        }
      })

      const results = await Promise.all(uploadPromises)
      const validResults = results.filter(result => result !== null)
      
      if (validResults.length > 0) {
        setImages(prev => [...prev, ...validResults as Array<{ url: string; alt?: string }>])
        showToast(`成功上传 ${validResults.length} 张图片`, 'success')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast('图片上传失败', 'error')
      setUploadingImages([])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: MotorcycleFormData) => {
    setLoading(true)
    try {
      const formData = {
        ...data,
        images: images.map(img => ({ url: img.url, alt: img.alt || '' }))
      }

      if (isEdit && id) {
        await motorcycleApi.updateMotorcycle(id, formData)
        showToast('摩托车信息已更新', 'success')
      } else {
        await motorcycleApi.createMotorcycle(formData)
        showToast('摩托车已创建', 'success')
      }
      
      navigate('/admin/motorcycles')
    } catch (error) {
      console.error('Save error:', error)
      showToast(isEdit ? '更新失败' : '创建失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', name: '基本信息' },
    { id: 'engine', name: '发动机' },
    { id: 'performance', name: '性能数据' },
    { id: 'dimensions', name: '尺寸重量' },
    { id: 'details', name: '详细配置' },
    { id: 'media', name: '图片管理' },
    { id: 'seo', name: 'SEO设置' }
  ]

  const generateSlug = (brand: string, model: string, year: number) => {
    return `${brand}-${model}-${year}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
  }

  const brandValue = watch('brand')
  const modelValue = watch('model')
  const yearValue = watch('year')

  useEffect(() => {
    if (brandValue && modelValue && yearValue) {
      const slug = generateSlug(brandValue, modelValue, yearValue)
      setValue('seo.slug', slug)
    }
  }, [brandValue, modelValue, yearValue, setValue])

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="品牌 *"
          {...register('brand', { required: '请输入品牌' })}
          error={errors.brand?.message}
        />
        <Input
          label="型号 *"
          {...register('model', { required: '请输入型号' })}
          error={errors.model?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="年份 *"
          type="number"
          min="1900"
          max="2030"
          {...register('year', { 
            required: '请输入年份',
            valueAsNumber: true,
            min: { value: 1900, message: '年份不能小于1900' },
            max: { value: 2030, message: '年份不能大于2030' }
          })}
          error={errors.year?.message}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">类型 *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            {...register('category', { required: '请选择类型' })}
          >
            <option value="">选择类型</option>
            {motorcycleCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            {...register('status')}
          >
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="售价 (CNY)"
          type="number"
          step="0.01"
          {...register('price.msrp', { valueAsNumber: true })}
        />
      </div>
    </div>
  )

  const renderEngineSpecs = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">发动机类型</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            {...register('engine.type')}
          >
            <option value="">选择类型</option>
            {engineTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <Input
          label="排量 (cc)"
          type="number"
          {...register('engine.displacement', { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="缸径 (mm)"
          type="number"
          step="0.1"
          {...register('engine.bore', { valueAsNumber: true })}
        />
        <Input
          label="行程 (mm)"
          type="number"
          step="0.1"
          {...register('engine.stroke', { valueAsNumber: true })}
        />
        <Input
          label="压缩比"
          {...register('engine.compressionRatio')}
          placeholder="例: 12.5:1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="冷却方式"
          {...register('engine.cooling')}
          placeholder="例: 液冷、风冷"
        />
        <Input
          label="燃油系统"
          {...register('engine.fuelSystem')}
          placeholder="例: 电子燃油喷射"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="每缸气门数"
          type="number"
          {...register('engine.valvesPerCylinder', { valueAsNumber: true })}
        />
        <Input
          label="最大转速 (rpm)"
          type="number"
          {...register('engine.maxRpm', { valueAsNumber: true })}
        />
      </div>
    </div>
  )

  const renderPerformance = () => (
    <div className="space-y-8">
      {/* 功率和扭矩 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">功率和扭矩</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="最大功率 (HP)"
            type="number"
            step="0.1"
            {...register('performance.power.hp', { valueAsNumber: true })}
          />
          <Input
            label="最大功率 (kW)"
            type="number"
            step="0.1"
            {...register('performance.power.kw', { valueAsNumber: true })}
          />
          <Input
            label="功率转速 (rpm)"
            type="number"
            {...register('performance.power.rpm', { valueAsNumber: true })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <Input
            label="最大扭矩 (Nm)"
            type="number"
            step="0.1"
            {...register('performance.torque.nm', { valueAsNumber: true })}
          />
          <Input
            label="最大扭矩 (lb-ft)"
            type="number"
            step="0.1"
            {...register('performance.torque.lbft', { valueAsNumber: true })}
          />
          <Input
            label="扭矩转速 (rpm)"
            type="number"
            {...register('performance.torque.rpm', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* 速度和加速 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">速度和加速</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="最高速度 (km/h)"
            type="number"
            {...register('performance.topSpeed', { valueAsNumber: true })}
          />
          <Input
            label="0-100km/h (s)"
            type="number"
            step="0.1"
            {...register('performance.acceleration.zeroToHundred', { valueAsNumber: true })}
          />
          <Input
            label="四分之一英里 (s)"
            type="number"
            step="0.1"
            {...register('performance.acceleration.quarterMile', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* 油耗 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">油耗</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="市区油耗 (L/100km)"
            type="number"
            step="0.1"
            {...register('performance.fuelEconomy.city', { valueAsNumber: true })}
          />
          <Input
            label="高速油耗 (L/100km)"
            type="number"
            step="0.1"
            {...register('performance.fuelEconomy.highway', { valueAsNumber: true })}
          />
          <Input
            label="综合油耗 (L/100km)"
            type="number"
            step="0.1"
            {...register('performance.fuelEconomy.combined', { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  )

  const renderDimensions = () => (
    <div className="space-y-8">
      {/* 尺寸 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">外形尺寸 (mm)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="长度"
            type="number"
            {...register('dimensions.length', { valueAsNumber: true })}
          />
          <Input
            label="宽度"
            type="number"
            {...register('dimensions.width', { valueAsNumber: true })}
          />
          <Input
            label="高度"
            type="number"
            {...register('dimensions.height', { valueAsNumber: true })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <Input
            label="轴距"
            type="number"
            {...register('dimensions.wheelbase', { valueAsNumber: true })}
          />
          <Input
            label="座高"
            type="number"
            {...register('dimensions.seatHeight', { valueAsNumber: true })}
          />
          <Input
            label="离地间隙"
            type="number"
            {...register('dimensions.groundClearance', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* 重量 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">重量 (kg)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="干重"
            type="number"
            step="0.1"
            {...register('dimensions.weight.dry', { valueAsNumber: true })}
          />
          <Input
            label="湿重"
            type="number"
            step="0.1"
            {...register('dimensions.weight.wet', { valueAsNumber: true })}
          />
          <Input
            label="最大载重"
            type="number"
            step="0.1"
            {...register('dimensions.weight.gvwr', { valueAsNumber: true })}
          />
        </div>
      </div>

      <Input
        label="油箱容量 (L)"
        type="number"
        step="0.1"
        {...register('dimensions.fuelCapacity', { valueAsNumber: true })}
      />
    </div>
  )

  const renderDetails = () => (
    <div className="space-y-8">
      {/* 传动系统 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">传动系统</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="传动类型"
            {...register('transmission.type')}
            placeholder="例: 6档手动、CVT"
          />
          <Input
            label="档位数"
            type="number"
            {...register('transmission.gears', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* 悬挂系统 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">悬挂系统</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="前悬挂"
            {...register('suspension.front')}
          />
          <Input
            label="后悬挂"
            {...register('suspension.rear')}
          />
        </div>
      </div>

      {/* 制动系统 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">制动系统</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="前制动"
            {...register('brakes.front')}
          />
          <Input
            label="后制动"
            {...register('brakes.rear')}
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded mr-2"
              {...register('brakes.abs')}
            />
            <span className="text-sm font-medium text-gray-700">ABS 防抗死制动系统</span>
          </label>
        </div>
      </div>

      {/* 轮胎规格 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">轮胎规格</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">前轮</h4>
            <div className="space-y-3">
              <Input
                label="轮胎尺寸"
                {...register('wheels.front.size')}
                placeholder="例: 120/70 ZR17"
              />
              <Input
                label="轮胎品牌"
                {...register('wheels.front.tire')}
              />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">后轮</h4>
            <div className="space-y-3">
              <Input
                label="轮胎尺寸"
                {...register('wheels.rear.size')}
                placeholder="例: 180/55 ZR17"
              />
              <Input
                label="轮胎品牌"
                {...register('wheels.rear.tire')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMediaManagement = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">图片管理</label>
        
        {/* 上传区域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  点击上传或拖拽图片
                </span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                支持 PNG、JPG、GIF 格式，单个文件不超过5MB
              </p>
            </div>
          </div>
        </div>

        {/* 上传进度 */}
        {uploadingImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">上传中...</p>
            {uploadingImages.map(id => (
              <div key={id} className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            ))}
          </div>
        )}

        {/* 已上传的图片 */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={image.alt || `Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                    主图
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderSEO = () => (
    <div className="space-y-6">
      <Input
        label="URL 别名 (Slug)"
        {...register('seo.slug')}
        placeholder="自动生成"
      />
      <Input
        label="SEO 标题"
        {...register('seo.metaTitle')}
        placeholder="页面标题，用于搜索引擎"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">SEO 描述</label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          {...register('seo.metaDescription')}
          placeholder="页面描述，用于搜索引擎结果显示"
        />
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicInfo()
      case 'engine': return renderEngineSpecs()
      case 'performance': return renderPerformance()
      case 'dimensions': return renderDimensions()
      case 'details': return renderDetails()
      case 'media': return renderMediaManagement()
      case 'seo': return renderSEO()
      default: return renderBasicInfo()
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? '编辑摩托车' : '添加摩托车'}
        </h1>
        <p className="mt-1 text-gray-500">
          {isEdit ? '修改摩托车的详细信息' : '添加新的摩托车到数据库'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 选项卡 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 表单内容 */}
        <Card className="p-6 mb-8">
          {renderTabContent()}
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/motorcycles')}
          >
            取消
          </Button>
          <Button
            type="submit"
            isLoading={loading}
          >
            {isEdit ? '保存修改' : '创建摩托车'}
          </Button>
        </div>
      </form>
    </div>
  )
}