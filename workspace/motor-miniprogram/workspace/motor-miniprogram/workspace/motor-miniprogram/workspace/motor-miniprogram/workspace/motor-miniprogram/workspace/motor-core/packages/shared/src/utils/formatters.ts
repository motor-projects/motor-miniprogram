/**
 * Data formatting utilities
 */

import type { CurrencyCode, NumberFormatOptions } from '../types/common';

/**
 * 格式化价格
 */
export function formatPrice(amount: number, currency: CurrencyCode = 'CNY'): string {
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
}

/**
 * 格式化数字
 */
export function formatNumber(num: number, options: NumberFormatOptions = {}): string {
  const {
    decimals = 0,
    thousandsSeparator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = ''
  } = options;
  
  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  
  const formatted = parts.join(decimalSeparator);
  
  return `${prefix}${formatted}${suffix}`;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 功率单位转换
 */
export function convertPower(value: number, from: 'hp' | 'kw', to: 'hp' | 'kw'): number {
  if (from === to) return value;
  
  if (from === 'hp' && to === 'kw') {
    return Math.round(value * 0.7457 * 100) / 100;
  }
  
  if (from === 'kw' && to === 'hp') {
    return Math.round(value * 1.341 * 100) / 100;
  }
  
  return value;
}

/**
 * 扭矩单位转换
 */
export function convertTorque(value: number, from: 'nm' | 'lbft', to: 'nm' | 'lbft'): number {
  if (from === to) return value;
  
  if (from === 'nm' && to === 'lbft') {
    return Math.round(value * 0.7376 * 100) / 100;
  }
  
  if (from === 'lbft' && to === 'nm') {
    return Math.round(value * 1.3558 * 100) / 100;
  }
  
  return value;
}