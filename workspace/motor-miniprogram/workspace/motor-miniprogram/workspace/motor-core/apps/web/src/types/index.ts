export interface Motorcycle {
  _id: string
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
  images?: {
    url: string
    alt?: string
    type?: string
  }[]
  features?: string[]
  colors?: {
    name: string
    hex?: string
    imageUrl?: string
  }[]
  rating?: {
    overall: number
    reviews: number
    breakdown?: {
      performance?: number
      comfort?: number
      reliability?: number
      value?: number
      styling?: number
    }
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
  status: string
  tags?: string[]
  seo?: {
    slug: string
    metaTitle?: string
    metaDescription?: string
  }
  fullName?: string
  powerToWeight?: string
  createdAt: string
  updatedAt: string
}

export interface MotorcycleFilters {
  brand?: string[]
  category?: string[]
  minPrice?: number
  maxPrice?: number
  minPower?: number
  maxPower?: number
  search?: string
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
}

export interface MotorcycleListResponse {
  motorcycles: Motorcycle[]
  pagination: PaginationInfo
  filters: {
    applied: MotorcycleFilters
    available: {
      brands: string[]
      categories: string[]
      priceRange: { min: number; max: number }
      powerRange: { min: number; max: number }
    }
  }
}

export interface StatisticsResponse {
  total: number
  brands: number
  categories: number
  topBrands: { _id: string; count: number }[]
  categoryDistribution: { _id: string; count: number }[]
}

export interface UploadResponse {
  message: string
  url: string
  publicId?: string
  filename?: string
}

export interface ApiError {
  message: string
  error?: any
  errors?: any[]
}

// 用户认证相关类型
export interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  favorites: string[]
  reviews: string[]
  profile?: {
    firstName?: string
    lastName?: string
    bio?: string
    location?: string
    joinDate: string
  }
  preferences?: {
    units: 'metric' | 'imperial'
    language: string
    notifications: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface ResetPasswordCredentials {
  email: string
}

// 评价系统类型
export interface Review {
  _id: string
  motorcycleId: string
  userId: string
  user: {
    username: string
    avatar?: string
  }
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
  helpful: {
    count: number
    users: string[]
  }
  verified: boolean
  images?: string[]
  createdAt: string
  updatedAt: string
}

// 比较功能类型
export interface ComparisonItem {
  motorcycleId: string
  motorcycle: Motorcycle
  addedAt: string
}

export interface ComparisonState {
  items: ComparisonItem[]
  maxItems: number
}

// 收藏类型
export interface Favorite {
  _id: string
  userId: string
  motorcycleId: string
  motorcycle?: Motorcycle
  addedAt: string
  notes?: string
}

// 搜索和筛选增强
export interface SearchFilters extends MotorcycleFilters {
  sortBy?: 'price' | 'power' | 'year' | 'rating' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  inStock?: boolean
  featured?: boolean
  electric?: boolean
}

// UI状态类型
export interface UIState {
  isLoading: boolean
  isSidebarOpen: boolean
  theme: 'light' | 'dark'
  viewMode: 'grid' | 'list'
  notifications: Notification[]
  modals: {
    auth: boolean
    comparison: boolean
    imageGallery: boolean
  }
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  autoClose?: number
  actions?: {
    label: string
    onClick: () => void
  }[]
  createdAt: string
}

// 图片上传类型
export interface ImageUpload {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// 表单验证类型
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
}

// 管理后台类型
export interface AdminStats {
  motorcycles: {
    total: number
    published: number
    draft: number
    recent: Motorcycle[]
  }
  users: {
    total: number
    active: number
    new: number
    recent: User[]
  }
  reviews: {
    total: number
    pending: number
    averageRating: number
    recent: Review[]
  }
  traffic: {
    pageViews: number
    uniqueVisitors: number
    topPages: { path: string; views: number }[]
  }
}

// 响应式断点
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// 性能优化类型
export interface LazyLoadConfig {
  threshold: number
  rootMargin: string
  triggerOnce: boolean
}

export interface InfiniteScrollConfig {
  hasNextPage: boolean
  fetchNextPage: () => void
  isFetchingNextPage: boolean
}