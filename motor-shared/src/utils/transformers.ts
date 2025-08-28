/**
 * Data transformation utilities
 */

/**
 * 驼峰命名转下划线
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 下划线转驼峰命名
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 对象键名转换为驼峰式
 */
export function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(keysToCamel) as T;
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      result[camelKey] = keysToCamel(obj[key]);
      return result;
    }, {} as any) as T;
  }
  
  return obj;
}

/**
 * 对象键名转换为下划线式
 */
export function keysToSnake<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(keysToSnake) as T;
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = keysToSnake(obj[key]);
      return result;
    }, {} as any) as T;
  }
  
  return obj;
}

/**
 * 数组转对象（按指定字段分组）
 */
export function arrayToObject<T>(arr: T[], key: keyof T): Record<string, T> {
  return arr.reduce((obj, item) => {
    const keyValue = String(item[key]);
    obj[keyValue] = item;
    return obj;
  }, {} as Record<string, T>);
}

/**
 * 数组分组
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const keyValue = String(item[key]);
    if (!groups[keyValue]) {
      groups[keyValue] = [];
    }
    groups[keyValue].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 数组分块
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * 数组扩展（将嵌套数组展开）
 */
export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.reduce<T[]>((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

/**
 * 对象过滤（移除空值）
 */
export function omitEmpty<T>(obj: T): Partial<T> {
  return Object.entries(obj as any).reduce((filtered, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      filtered[key as keyof T] = value;
    }
    return filtered;
  }, {} as Partial<T>);
}

/**
 * 对象选取指定字段
 */
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((picked, key) => {
    if (key in obj) {
      picked[key] = obj[key];
    }
    return picked;
  }, {} as Pick<T, K>);
}

/**
 * 对象排除指定字段
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}