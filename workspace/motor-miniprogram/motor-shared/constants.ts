// 共享常量
export const MOTORCYCLE_CATEGORIES = [
  '街车',
  '跑车',
  '巡航',
  '越野',
  '踏板',
  '复古',
  '旅行',
  '竞技'
] as const

export const ENGINE_TYPES = [
  '单缸',
  '双缸',
  '三缸',
  '四缸',
  '六缸',
  '电动'
] as const

export const COOLING_TYPES = [
  '风冷',
  '水冷',
  '油冷'
] as const

export const FUEL_SYSTEM_TYPES = [
  '化油器',
  '电喷',
  '电动'
] as const

export const TRANSMISSION_TYPES = [
  '手动',
  '自动',
  'CVT',
  '双离合'
] as const

export const MOTORCYCLE_STATUS = [
  'active',
  'discontinued',
  'concept'
] as const

export const IMAGE_TYPES = [
  'main',
  'side',
  'rear',
  'engine',
  'interior',
  'detail'
] as const

// API 相关常量
export const API_ENDPOINTS = {
  MOTORCYCLES: '/api/motorcycles',
  UPLOAD: '/api/upload',
  STATS: '/api/motorcycles/stats'
} as const

export const SORT_OPTIONS = [
  { value: 'createdAt', label: '最新创建' },
  { value: 'price.msrp', label: '价格' },
  { value: 'performance.power.hp', label: '马力' },
  { value: 'year', label: '年份' },
  { value: 'brand', label: '品牌' }
] as const

export const PAGE_SIZES = [12, 24, 48] as const

// 缺省值
export const DEFAULT_VALUES = {
  PAGE_SIZE: 12,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc',
  CURRENCY: 'CNY',
  IMAGE_QUALITY: 'auto',
  DEBOUNCE_DELAY: 300
} as const

// 数据验证
export const VALIDATION_RULES = {
  BRAND_MIN_LENGTH: 1,
  BRAND_MAX_LENGTH: 50,
  MODEL_MIN_LENGTH: 1,
  MODEL_MAX_LENGTH: 100,
  YEAR_MIN: 1900,
  YEAR_MAX: new Date().getFullYear() + 2,
  DISPLACEMENT_MIN: 0,
  DISPLACEMENT_MAX: 2000,
  POWER_MIN: 0,
  POWER_MAX: 500,
  PRICE_MIN: 0,
  PRICE_MAX: 1000000,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
} as const