/**
 * Data validation utilities
 */

import type { ValidationResult, ValidationRule } from '../types/common';

/**
 * 验证邮箱地址
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证 URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证手机号
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证字段
 */
export function validateField(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];
  
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(rule.message);
        }
        break;
        
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          errors.push(rule.message);
        }
        break;
        
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          errors.push(rule.message);
        }
        break;
        
      case 'pattern':
        if (typeof value === 'string' && !rule.value.test(value)) {
          errors.push(rule.message);
        }
        break;
        
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          errors.push(rule.message);
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 验证数字范围
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * 验证必填字段
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}