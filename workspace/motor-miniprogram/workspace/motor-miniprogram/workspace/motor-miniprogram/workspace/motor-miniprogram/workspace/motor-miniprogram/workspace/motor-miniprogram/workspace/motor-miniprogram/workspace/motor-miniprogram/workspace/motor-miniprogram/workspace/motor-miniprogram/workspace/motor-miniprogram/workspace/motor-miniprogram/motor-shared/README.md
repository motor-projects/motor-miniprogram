# Motor Shared - 共享代码库

摩托车性能数据系统的共享代码库，包含所有项目通用的类型定义、常量和工具函数。

## 技术栈

- **语言**: TypeScript
- **构建工具**: TypeScript Compiler
- **测试**: Jest
- **代码检查**: ESLint

## 目录结构

```
motor-shared/
├── src/
│   ├── types/              # 类型定义
│   │   ├── index.ts        # 主类型导出
│   │   ├── motorcycle.ts   # 摩托车相关类型
│   │   ├── api.ts          # API 相关类型
│   │   └── common.ts       # 通用类型
│   ├── constants/          # 常量定义
│   │   ├── index.ts        # 主常量导出
│   │   ├── motorcycle.ts   # 摩托车相关常量
│   │   ├── api.ts          # API 相关常量
│   │   └── validation.ts   # 验证规则
│   ├── utils/              # 工具函数
│   │   ├── index.ts        # 主工具导出
│   │   ├── formatters.ts   # 数据格式化
│   │   ├── validators.ts   # 数据验证
│   │   ├── helpers.ts      # 辅助函数
│   │   └── transformers.ts # 数据转换
│   ├── __tests__/          # 测试文件
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants/
│   └── index.ts            # 主入口文件
├── dist/                   # 编译输出
├── package.json
├── tsconfig.json           # TypeScript 配置
├── .eslintrc.json          # ESLint 配置
├── jest.config.js          # Jest 配置
├── .gitignore
└── README.md
```

## 安装使用

### 作为本地依赖

在其他项目中引用：

```json
// package.json
{
  "dependencies": {
    "@motor/shared": "file:../motor-shared"
  }
}
```

### 作为 npm 包

如果发布到 npm：

```bash
npm install @motor/shared
```

## 使用示例

### 类型定义

```typescript
// 导入类型
import { Motorcycle, MotorcycleFilter, ApiResponse } from '@motor/shared';

// 使用类型
const motorcycle: Motorcycle = {
  id: '1',
  brand: 'Honda',
  model: 'CBR1000RR',
  year: 2023,
  // ...
};

const filter: MotorcycleFilter = {
  brands: ['Honda', 'Yamaha'],
  categories: ['跑车'],
  priceRange: { min: 100000, max: 500000 }
};
```

### 常量使用

```typescript
// 导入常量
import { MOTORCYCLE_CATEGORIES, API_ENDPOINTS, VALIDATION_RULES } from '@motor/shared';

// 使用常量
console.log(MOTORCYCLE_CATEGORIES); // ['街车', '跑车', ...]
console.log(API_ENDPOINTS.MOTORCYCLES); // '/api/motorcycles'
console.log(VALIDATION_RULES.BRAND_MAX_LENGTH); // 50
```

### 工具函数

```typescript
// 导入工具函数
import { formatPrice, validateEmail, slugify, deepMerge } from '@motor/shared';

// 使用工具函数
const price = formatPrice(125000, 'CNY'); // "￥125,000"
const isValid = validateEmail('user@example.com'); // true
const slug = slugify('Honda CBR1000RR'); // 'honda-cbr1000rr'

const merged = deepMerge(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 } }
); // { a: 1, b: { c: 2, d: 3 } }
```

## API 参考

### 主要类型

#### Motorcycle

摩托车数据的主要接口定义。

```typescript
interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: MotorcycleCategory;
  engine: {
    type: EngineType;
    displacement: number;
    cylinders: number;
    cooling: CoolingType;
    fuelSystem: FuelSystemType;
  };
  performance: {
    power: {
      hp: number;
      kw: number;
      rpm: number;
    };
    torque: {
      nm: number;
      lbft: number;
      rpm: number;
    };
    topSpeed?: number;
    acceleration?: {
      zeroToSixty: number;
      zeroToHundred: number;
    };
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    seatHeight: number;
    weight: {
      dry: number;
      wet: number;
    };
    fuelCapacity: number;
  };
  price: {
    msrp: number;
    currency: CurrencyCode;
  };
  images: MotorcycleImage[];
  features: string[];
  colors: string[];
  rating?: number;
  status: MotorcycleStatus;
  createdAt: string;
  updatedAt: string;
}
```

#### MotorcycleFilter

摩托车筛选条件。

```typescript
interface MotorcycleFilter {
  brands?: string[];
  categories?: MotorcycleCategory[];
  years?: { min: number; max: number };
  priceRange?: { min: number; max: number };
  displacement?: { min: number; max: number };
  power?: { min: number; max: number };
  engineTypes?: EngineType[];
  coolingTypes?: CoolingType[];
  status?: MotorcycleStatus[];
  search?: string;
}
```

#### ApiResponse

通用 API 响应格式。

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}
```

### 主要常量

```typescript
// 摩托车分类
export const MOTORCYCLE_CATEGORIES: readonly string[];

// 发动机类型
export const ENGINE_TYPES: readonly string[];

// 冷却方式
export const COOLING_TYPES: readonly string[];

// API 端点
export const API_ENDPOINTS: Record<string, string>;

// 数据验证规则
export const VALIDATION_RULES: Record<string, number | string[]>;

// 默认值
export const DEFAULT_VALUES: Record<string, any>;
```

### 主要工具函数

#### 数据格式化

```typescript
// 价格格式化
export function formatPrice(amount: number, currency?: CurrencyCode): string;

// 数字格式化
export function formatNumber(num: number, options?: NumberFormatOptions): string;

// 日期格式化
export function formatDate(date: Date | string, format?: string): string;

// 单位转换
export function convertPower(hp: number, from: 'hp' | 'kw', to: 'hp' | 'kw'): number;
export function convertTorque(value: number, from: 'nm' | 'lbft', to: 'nm' | 'lbft'): number;
```

#### 数据验证

```typescript
// 邮箱验证
export function validateEmail(email: string): boolean;

// URL 验证
export function validateUrl(url: string): boolean;

// 摩托车数据验证
export function validateMotorcycle(data: Partial<Motorcycle>): ValidationResult;

// 通用字段验证
export function validateField(value: any, rules: ValidationRule[]): ValidationResult;
```

#### 辅助函数

```typescript
// 字符串转 slug
export function slugify(text: string): string;

// 深度合并对象
export function deepMerge<T>(target: T, ...sources: Partial<T>[]): T;

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void;

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void;

// 随机 ID 生成
export function generateId(prefix?: string): string;

// 数组去重
export function uniqueArray<T>(arr: T[], key?: keyof T): T[];
```

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 监视模式编译
npm run watch

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 测试

```bash
# 运行所有测试
npm test

# 监视模式测试
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 发布

```bash
# 清理和重新构建
npm run clean && npm run build

# 发布到 npm (如果需要)
npm publish
```

## 贡献指南

### 添加新类型

1. 在 `src/types/` 中添加类型定义
2. 在 `src/types/index.ts` 中导出
3. 添加测试用例
4. 更新文档

### 添加新常量

1. 在 `src/constants/` 中添加常量
2. 在 `src/constants/index.ts` 中导出
3. 添加相关类型定义

### 添加新工具函数

1. 在 `src/utils/` 中添加函数
2. 在 `src/utils/index.ts` 中导出
3. 添加单元测试
4. 添加 JSDoc 文档

### 代码规范

- 使用 TypeScript 严格模式
- 所有公开 API 必须有类型定义
- 所有函数必须有 JSDoc 文档
- 所有新功能必须有测试用例
- 使用 `const assertions` 确保类型安全

```typescript
// 好的示例
export const CATEGORIES = ['street', 'sport'] as const;
export type Category = typeof CATEGORIES[number];

/**
 * 格式化价格
 * @param amount - 价格数量
 * @param currency - 货币代码
 * @returns 格式化后的价格字符串
 */
export function formatPrice(amount: number, currency: CurrencyCode = 'CNY'): string {
  // 实现...
}
```

## 常见问题

### Q: 为什么编译失败？

A: 检查 TypeScript 配置和类型定义是否正确。运行 `npm run type-check` 查看具体错误。

### Q: 如何在本地项目中使用？

A: 使用 `file:` 协议引用本地路径，或者使用 `npm link` 命令。

### Q: 如何更新其他项目中的共享代码？

A: 修改后运行 `npm run build`，其他项目会自动使用更新后的代码。

## 许可证

MIT License

## 支持

如遇到问题，请创建 Issue 或联系开发团队。