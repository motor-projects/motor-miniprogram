/**
 * Common type definitions
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'KRW';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface NumberFormatOptions {
  decimals?: number;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  prefix?: string;
  suffix?: string;
}

export interface DateFormatOptions {
  format?: string;
  locale?: string;
  timezone?: string;
}