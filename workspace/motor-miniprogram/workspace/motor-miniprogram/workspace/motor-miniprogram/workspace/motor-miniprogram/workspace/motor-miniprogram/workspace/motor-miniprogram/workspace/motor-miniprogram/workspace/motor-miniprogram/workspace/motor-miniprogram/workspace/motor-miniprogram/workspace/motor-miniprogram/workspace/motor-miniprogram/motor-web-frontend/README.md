# Motor Web Frontend - 摩托车 Web 前端

摩托车性能数据系统的 Web 前端应用，基于 React + TypeScript + Vite 构建。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Redux Toolkit
- **数据获取**: TanStack Query (React Query)
- **路由**: React Router v6
- **UI 组件**: Headless UI + Tailwind CSS
- **表单处理**: React Hook Form
- **动画**: Framer Motion
- **图标**: Lucide React + Heroicons
- **测试**: Vitest + Testing Library

## 目录结构

```
motor-web-frontend/
├── public/                 # 静态资源
│   ├── favicon.ico
│   ├── logo.svg
│   └── manifest.json
├── src/
│   ├── components/         # 组件
│   │   ├── ui/             # 基础 UI 组件
│   │   ├── layout/         # 布局组件
│   │   ├── motorcycle/     # 摩托车相关组件
│   │   └── common/         # 通用组件
│   ├── pages/              # 页面组件
│   │   ├── home/
│   │   ├── motorcycles/
│   │   ├── admin/
│   │   └── auth/
│   ├── store/              # Redux 状态管理
│   │   ├── index.ts
│   │   └── slices/
│   ├── services/           # API 服务
│   │   ├── api.ts
│   │   └── queries/
│   ├── hooks/              # 自定义 Hook
│   ├── types/              # 类型定义
│   ├── utils/              # 工具函数
│   ├── assets/             # 资源文件
│   ├── styles/             # 样式文件
│   ├── App.tsx             # 主组件
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── tests/                  # 测试文件
│   ├── setup.ts
│   └── __mocks__/
├── index.html              # HTML 模板
├── package.json
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── .eslintrc.json          # ESLint 配置
├── .gitignore
├── Dockerfile
└── README.md
```

## 快速开始

### 1. 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env.local

# 编辑 .env.local 文件
nano .env.local
```

环境变量说明：

```env
# API 配置
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000

# 应用配置
VITE_APP_NAME=Motor Performance System
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# 缓存配置
VITE_CACHE_TIME=300000
VITE_STALE_TIME=60000

# Cloudinary (如果直接上传图片)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset

# 分析和监控
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=

# 功能开关
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_ERROR_BOUNDARY=true
VITE_ENABLE_PWA=false
```

### 4. 启动开发服务

```bash
# 开发模式 (默认端口 3000)
npm run dev

# 指定端口
npm run dev -- --port 3001
```

应用将在 http://localhost:3000 启动

### 5. 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

## 主要功能

### 页面功能

- **首页**: 摩托车展示、搜索、统计信息
- **摩托车列表**: 分页、筛选、排序、搜索
- **摩托车详情**: 完整信息展示、图片廊、性能对比
- **管理后台**: CRUD 操作、批量管理、数据导入
- **用户系统**: 注册、登录、个人中心

### UI 特性

- 响应式设计，支持移动端
- 深色/浅色主题切换
- 动画过渡和交互效果
- 无限滚动加载
- 图片懒加载
- 离线支持 (PWA)

### 性能优化

- 代码分割和懒加载
- 图片优化和压缩
- API 响应缓存
- 组件层面缓存
- Service Worker 缓存

## 开发指南

### 代码规范

```bash
# 检查代码规范
npm run lint

# 修复代码规范
npm run lint:fix

# 类型检查
npm run type-check
```

### 组件开发原则

1. **单一职责原则**: 每个组件只负责一个功能
2. **组件复用**: 通用组件放在 `components/ui/`
3. **Props 类型**: 使用 TypeScript 严格类型定义
4. **状态管理**: 优先使用本地状态，必要时使用 Redux
5. **样式管理**: 使用 Tailwind CSS，避免内联样式

### 目录命名约定

- 组件文件: PascalCase (`MotorcycleCard.tsx`)
- Hook 文件: camelCase 以 `use` 开头 (`useMotorcycles.ts`)
- 工具函数: camelCase (`formatPrice.ts`)
- 常量文件: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`)

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 可视化测试界面
npm run test:ui

# 覆盖率报告
npm run test:coverage
```

### 测试类型

1. **单元测试**: 组件、Hook、工具函数
2. **集成测试**: API 调用、状态管理
3. **E2E 测试**: 关键用户流程

### 测试文件结构

```
tests/
├── components/         # 组件测试
├── hooks/              # Hook 测试
├── utils/              # 工具函数测试
├── services/           # API 测试
├── __mocks__/          # Mock 文件
└── setup.ts            # 测试环境设置
```

## Docker 部署

### 构建镜像

```bash
npm run docker:build
```

### 运行容器

```bash
# 单独运行
npm run docker:run

# 使用 docker-compose
docker-compose up -d
```

### 多阶段构建

Dockerfile 使用多阶段构建，优化镜像大小：

1. **Build 阶段**: 安装依赖并构建
2. **Production 阶段**: 仅包含构建产物和 Nginx

## 部署

### 支持的平台

- **Vercel** (推荐): 零配置部署
- **Netlify**: 支持 SPA 路由
- **阿里云 OSS**: 静态托管
- **AWS S3 + CloudFront**: CDN 加速
- **自建服务器**: Nginx + Docker

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Netlify 部署

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod --dir=dist
```

### 生产环境检查清单

- [ ] 环境变量配置完成
- [ ] API 地址配置正确
- [ ] CDN 和缓存配置
- [ ] SEO 优化完成
- [ ] 性能监控配置
- [ ] 错误追踪配置
- [ ] SSL 证书配置
- [ ] 安全头配置

## 性能监控

### 内置监控

- React DevTools
- Redux DevTools
- Vite Bundle Analyzer

### 第三方监控

- Google Analytics
- Sentry 错误追踪
- Lighthouse 性能分析
- Web Vitals 指标

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 TypeScript 类型错误
   - 验证依赖安装完整

2. **API 调用失败**
   - 检查环境变量配置
   - 验证后端服务状态

3. **样式问题**
   - 检查 Tailwind 配置
   - 清除浏览器缓存

### 日志查看

```bash
# 开发环境
npm run dev # 控制台输出

# 生产环境
# 检查浏览器控制台和网络面板
```

## 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License

## 支持

如遇到问题，请创建 Issue 或联系开发团队。