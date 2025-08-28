// 共享类型定义
export interface Motorcycle {
  _id: string
  brand: string
  model: string
  year: number
  category: MotorcycleCategory
  price?: {
    msrp?: number
    currency: string
  }
  engine?: EngineSpecs
  performance?: PerformanceData
  dimensions?: DimensionData
  images?: ImageData[]
  features?: string[]
  colors?: ColorOption[]
  rating?: RatingData
  transmission?: TransmissionData
  suspension?: SuspensionData
  brakes?: BrakeData
  wheels?: WheelData
  status: MotorcycleStatus
  tags?: string[]
  seo?: SEOData
  fullName?: string
  powerToWeight?: string
  createdAt: string
  updatedAt: string
}

export type MotorcycleCategory = '街车' | '跑车' | '巡航' | '越野' | '踏板' | '复古' | '旅行' | '竞技'

export type MotorcycleStatus = 'active' | 'discontinued' | 'concept'

export interface EngineSpecs {
  type?: EngineType
  displacement?: number // cc
  bore?: number // mm
  stroke?: number // mm
  compressionRatio?: string
  cooling?: CoolingType
  fuelSystem?: FuelSystemType
  valvesPerCylinder?: number
  maxRpm?: number
}

export type EngineType = '单缸' | '双缸' | '三缸' | '四缸' | '六缸' | '电动'
export type CoolingType = '风冷' | '水冷' | '油冷'
export type FuelSystemType = '化油器' | '电喷' | '电动'

export interface PerformanceData {
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
  topSpeed?: number // km/h
  acceleration?: {
    zeroToSixty?: number // seconds
    zeroToHundred?: number // seconds
    quarterMile?: number // seconds
  }
  fuelEconomy?: {
    city?: number // L/100km
    highway?: number
    combined?: number
  }
}

export interface DimensionData {
  length?: number // mm
  width?: number // mm
  height?: number // mm
  wheelbase?: number // mm
  seatHeight?: number // mm
  groundClearance?: number // mm
  weight?: {
    dry?: number // kg
    wet?: number // kg
    gvwr?: number // kg
  }
  fuelCapacity?: number // L
}

export interface ImageData {
  url: string
  alt?: string
  type?: ImageType
}

export type ImageType = 'main' | 'side' | 'rear' | 'engine' | 'interior' | 'detail'

export interface ColorOption {
  name: string
  hex?: string
  imageUrl?: string
}

export interface RatingData {
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

export interface TransmissionData {
  type?: TransmissionType
  gears?: number
}

export type TransmissionType = '手动' | '自动' | 'CVT' | '双离合'

export interface SuspensionData {
  front?: string
  rear?: string
}

export interface BrakeData {
  front?: string
  rear?: string
  abs?: boolean
}

export interface WheelData {
  front?: {
    size?: string
    tire?: string
  }
  rear?: {
    size?: string
    tire?: string
  }
}

export interface SEOData {
  slug: string
  metaTitle?: string
  metaDescription?: string
}

// API 相关类型
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  brand?: string[]
  category?: MotorcycleCategory[]
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
    applied: FilterParams
    available: {
      brands: string[]
      categories: MotorcycleCategory[]
      priceRange: { min: number; max: number }
      powerRange: { min: number; max: number }
    }
  }
}