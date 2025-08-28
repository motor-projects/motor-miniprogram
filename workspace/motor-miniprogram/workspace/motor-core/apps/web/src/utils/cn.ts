import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并Tailwind CSS类名的工具函数
 * 使用clsx进行条件类名处理，twMerge处理冲突的Tailwind类
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}