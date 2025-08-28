// 共享工具函数
import { Motorcycle } from './types'

// 格式化价格
export const formatPrice = (price: number, currency = 'CNY'): string => {
  if (!price) return '价格待询'
  
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency
  })
  
  return formatter.format(price)
}

// 格式化数字
export const formatNumber = (num: number, decimals = 0): string => {
  if (num === undefined || num === null) return '-'
  return num.toLocaleString('zh-CN', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// 生成 URL 友好的 slug
export const generateSlug = (brand: string, model: string, year: number): string => {
  return `${year}-${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// 获取摩托车完整名称
export const getFullName = (motorcycle: Motorcycle): string => {
  return `${motorcycle.year} ${motorcycle.brand} ${motorcycle.model}`
}

// 计算功率重量比
export const calculatePowerToWeight = (hp?: number, weight?: number): string => {
  if (!hp || !weight) return '-'
  const ratio = (hp / weight * 1000).toFixed(2)
  return `${ratio} hp/kg`
}

// 时间格式化
export const formatDate = (dateString: string, format = 'relative'): string => {
  const date = new Date(dateString)
  const now = new Date()
  
  if (format === 'relative') {
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  }
  
  return date.toLocaleDateString('zh-CN')
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深度克隆
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

// 获取图片 URL
export const getImageUrl = (url?: string, size?: 'thumb' | 'medium' | 'large'): string => {
  if (!url) return '/images/placeholder.png'
  
  // 如果是 Cloudinary URL，添加尺寸参数
  if (url.includes('cloudinary.com') && size) {
    const sizeMap = {
      thumb: 'w_200,h_150,c_fill',
      medium: 'w_400,h_300,c_fill',
      large: 'w_800,h_600,c_fill'
    }
    return url.replace('/upload/', `/upload/${sizeMap[size]}/`)
  }
  
  return url
}

// 验证邮箱
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证手机号
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 获取文件大小的友好显示
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成随机 ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// 安全的 JSON 解析
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}