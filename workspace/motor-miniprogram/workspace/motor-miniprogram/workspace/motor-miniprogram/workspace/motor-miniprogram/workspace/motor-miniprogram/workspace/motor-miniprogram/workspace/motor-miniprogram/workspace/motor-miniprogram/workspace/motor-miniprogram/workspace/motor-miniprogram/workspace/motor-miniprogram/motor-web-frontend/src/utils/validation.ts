// 表单验证工具函数

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('密码至少需耐8个字符')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateUsername = (username: string): {
  isValid: boolean
  error?: string
} => {
  if (username.length < 3) {
    return { isValid: false, error: '用户名至少需耐3个字符' }
  }
  
  if (username.length > 20) {
    return { isValid: false, error: '用户名不能超过20个字符' }
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: '用户名只能包含字母、数字和下划线' }
  }
  
  return { isValid: true }
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 摩托车数据验证
export const validateMotorcycleYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear()
  return year >= 1900 && year <= currentYear + 2
}

export const validateDisplacement = (displacement: number): boolean => {
  return displacement > 0 && displacement <= 3000
}

export const validatePower = (power: number): boolean => {
  return power > 0 && power <= 500
}

export const validatePrice = (price: number): boolean => {
  return price > 0 && price <= 10000000
}

// 文件验证
export const validateImageFile = (file: File): {
  isValid: boolean
  error?: string
} => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: '仅支持 JPG、PNG、GIF 和 WebP 格式的图片' 
    }
  }
  
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: '图片大小不能超过 5MB' 
    }
  }
  
  return { isValid: true }
}

// 通用验证器
export class FormValidator {
  private errors: Record<string, string> = {}
  
  email(value: string, fieldName = '邮箱'): this {
    if (!validateEmail(value)) {
      this.errors[fieldName] = '请输入有效的邮箱地址'
    }
    return this
  }
  
  required(value: any, fieldName = '字段'): this {
    if (!value || (typeof value === 'string' && !value.trim())) {
      this.errors[fieldName] = `${fieldName}不能为空`
    }
    return this
  }
  
  minLength(value: string, min: number, fieldName = '字段'): this {
    if (value && value.length < min) {
      this.errors[fieldName] = `${fieldName}至少需要${min}个字符`
    }
    return this
  }
  
  maxLength(value: string, max: number, fieldName = '字段'): this {
    if (value && value.length > max) {
      this.errors[fieldName] = `${fieldName}不能超过${max}个字符`
    }
    return this
  }
  
  min(value: number, min: number, fieldName = '字段'): this {
    if (value < min) {
      this.errors[fieldName] = `${fieldName}不能小于${min}`
    }
    return this
  }
  
  max(value: number, max: number, fieldName = '字段'): this {
    if (value > max) {
      this.errors[fieldName] = `${fieldName}不能大于${max}`
    }
    return this
  }
  
  pattern(value: string, pattern: RegExp, message: string): this {
    if (value && !pattern.test(value)) {
      this.errors[Object.keys(this.errors).length.toString()] = message
    }
    return this
  }
  
  custom(condition: boolean, message: string): this {
    if (!condition) {
      this.errors[Object.keys(this.errors).length.toString()] = message
    }
    return this
  }
  
  getErrors(): Record<string, string> {
    return this.errors
  }
  
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0
  }
  
  getFirstError(): string | null {
    const firstKey = Object.keys(this.errors)[0]
    return firstKey ? this.errors[firstKey] : null
  }
  
  reset(): this {
    this.errors = {}
    return this
  }
}

// 使用示例:
// const validator = new FormValidator()
// validator
//   .required(email, '邮箱')
//   .email(email)
//   .required(password, '密码')
//   .minLength(password, 8, '密码')
// 
// if (validator.hasErrors()) {
//   console.log(validator.getErrors())
// }