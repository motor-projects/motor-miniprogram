// 应用常量

// API 端点
export const API_ENDPOINTS = {
  AUTH: '/auth',
  MOTORCYCLES: '/motorcycles',
  REVIEWS: '/reviews',
  UPLOAD: '/upload',
  ADMIN: '/admin',
  STATS: '/stats',
} as const

// 摩托车分类
export const MOTORCYCLE_CATEGORIES = [
  '跑车',
  '街车',
  '旅行',
  '越野',
  '巡航',
  '复古',
  '踏板',
  '电动',
  '其他'
] as const

// 摩托车品牌
export const MOTORCYCLE_BRANDS = [
  'Honda',
  'Yamaha',
  'Suzuki',
  'Kawasaki',
  'BMW',
  'Ducati',
  'KTM',
  'Harley-Davidson',
  'Triumph',
  'Aprilia',
  'MV Agusta',
  'Indian',
  'Moto Guzzi',
  'Royal Enfield',
  'Benelli',
  'CFMoto',
  'QJMotor',
  'Zongshen',
  '其他'
] as const

// 发动机类型
export const ENGINE_TYPES = [
  '单缸',
  '双缸',
  '三缸',
  '四缸',
  '六缸',
  'V型双缸',
  'V型四缸',
  '水平对置',
  '电动机'
] as const

// 燃油系统
export const FUEL_SYSTEMS = [
  '化油器',
  '电子燃油喷射',
  '直喷',
  '电动'
] as const

// 冷却方式
export const COOLING_TYPES = [
  '风冷',
  '水冷',
  '油冷',
  '液冷'
] as const

// 传动类型
export const TRANSMISSION_TYPES = [
  '手动',
  '自动',
  'CVT',
  'DCT',
  '半自动'
] as const

// 评价类型
export const RATING_CATEGORIES = {
  OVERALL: '综合评分',
  PERFORMANCE: '性能表现',
  COMFORT: '舒适度',
  RELIABILITY: '可靠性',
  VALUE: '性价比',
  STYLING: '外观设计'
} as const

// 排序选项
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high',
  POWER_LOW: 'power_low',
  POWER_HIGH: 'power_high',
  RATING_HIGH: 'rating_high',
  RATING_LOW: 'rating_low',
  POPULAR: 'popular'
} as const

// 排序显示名称
export const SORT_LABELS = {
  [SORT_OPTIONS.NEWEST]: '最新发布',
  [SORT_OPTIONS.OLDEST]: '最早发布',
  [SORT_OPTIONS.PRICE_LOW]: '价格低到高',
  [SORT_OPTIONS.PRICE_HIGH]: '价格高到低',
  [SORT_OPTIONS.POWER_LOW]: '功率低到高',
  [SORT_OPTIONS.POWER_HIGH]: '功率高到低',
  [SORT_OPTIONS.RATING_HIGH]: '评分高到低',
  [SORT_OPTIONS.RATING_LOW]: '评分低到高',
  [SORT_OPTIONS.POPULAR]: '最受欢迎'
} as const

// 分页设置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
} as const

// 图片设置
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  THUMBNAIL_SIZE: { width: 300, height: 200 },
  LARGE_SIZE: { width: 1200, height: 800 }
} as const

// 本地存储键
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches',
  COMPARISON_LIST: 'comparison_list',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

// 主题设置
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const

// 语言设置
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
  JA_JP: 'ja-JP'
} as const

// 单位系统
export const UNIT_SYSTEMS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial'
} as const

// 通知类型
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const

// 表单验证规则
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  EMAIL_MAX_LENGTH: 254,
  REVIEW_TITLE_MAX_LENGTH: 100,
  REVIEW_CONTENT_MIN_LENGTH: 20,
  REVIEW_CONTENT_MAX_LENGTH: 2000,
  MAX_PROS_CONS: 5
} as const

// 性能参数范围
export const PERFORMANCE_RANGES = {
  DISPLACEMENT: { min: 50, max: 3000 },
  POWER: { min: 1, max: 500 },
  TORQUE: { min: 1, max: 300 },
  TOP_SPEED: { min: 30, max: 400 },
  WEIGHT: { min: 50, max: 500 },
  PRICE: { min: 1000, max: 10000000 }
} as const

// 动画设置
export const ANIMATION = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)'
  }
} as const

// 断点设置
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const

// Z-Index 层级
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080
} as const