/**
 * Motorcycle-related constants
 */

// 摩托车分类
export const MOTORCYCLE_CATEGORIES = [
  '街车',
  '跑车', 
  '巡航',
  '越野',
  '踏板',
  '复古',
  '旅行',
  '竞技'
] as const;

export type MotorcycleCategory = typeof MOTORCYCLE_CATEGORIES[number];

// 发动机类型
export const ENGINE_TYPES = [
  '单缸',
  '双缸',
  '三缸', 
  '四缸',
  '六缸',
  '电动'
] as const;

export type EngineType = typeof ENGINE_TYPES[number];

// 冷却方式
export const COOLING_TYPES = [
  '风冷',
  '水冷',
  '油冷'
] as const;

export type CoolingType = typeof COOLING_TYPES[number];

// 燃料系统
export const FUEL_SYSTEM_TYPES = [
  '化油器',
  '电喷',
  '电动'
] as const;

export type FuelSystemType = typeof FUEL_SYSTEM_TYPES[number];

// 变速箱类型
export const TRANSMISSION_TYPES = [
  '手动',
  '自动',
  'CVT',
  '双离合'
] as const;

export type TransmissionType = typeof TRANSMISSION_TYPES[number];

// 摩托车状态
export const MOTORCYCLE_STATUS = [
  'active',
  'discontinued', 
  'concept'
] as const;

export type MotorcycleStatus = typeof MOTORCYCLE_STATUS[number];

// 图片类型
export const IMAGE_TYPES = [
  'main',
  'side',
  'rear',
  'engine',
  'interior',
  'detail'
] as const;

export type ImageType = typeof IMAGE_TYPES[number];