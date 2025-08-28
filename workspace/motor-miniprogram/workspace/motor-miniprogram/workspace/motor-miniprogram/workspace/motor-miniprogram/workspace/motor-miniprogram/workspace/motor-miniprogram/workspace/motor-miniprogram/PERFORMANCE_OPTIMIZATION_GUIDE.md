# Motor Projects 性能优化实施指南

## 🎯 优化路线图

本指南提供了 Motor Projects 性能优化的详细实施步骤，按照优先级和影响程度分阶段执行。

---

## 🚀 第一阶段：立即优化 (1-3天实施)

### 1. 数据库索引优化

**影响**: 查询性能提升 60-80%  
**实施时间**: 2小时  
**风险等级**: 🟢 低

#### 实施步骤

1. **连接到MongoDB**:
```bash
# 进入MongoDB容器
docker exec -it motor-projects_mongo-primary_1 mongosh

# 或使用外部客户端连接
mongosh "mongodb://localhost:27017/motor"
```

2. **创建关键索引**:
```javascript
// 切换到motor数据库
use motor;

// 摩托车数据索引
db.motorcycles.createIndex({ "brand": 1, "model": 1 });
db.motorcycles.createIndex({ "userId": 1, "status": 1 });
db.motorcycles.createIndex({ "createdAt": -1 });
db.motorcycles.createIndex({ "category": 1, "createdAt": -1 });

// 用户数据索引
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

// 复合索引为复杂查询
db.motorcycles.createIndex({ 
    "userId": 1, 
    "brand": 1, 
    "status": 1 
});

// 文本搜索索引
db.motorcycles.createIndex({
    "brand": "text",
    "model": "text",
    "description": "text"
}, {
    "weights": {
        "brand": 10,
        "model": 8,
        "description": 1
    }
});
```

3. **验证索引效果**:
```javascript
// 查看所有索引
db.motorcycles.getIndexes();

// 分析查询计划
db.motorcycles.find({ "userId": "user123", "brand": "Honda" }).explain("executionStats");

// 检查索引使用情况
db.motorcycles.aggregate([
    { $indexStats: {} }
]);
```

4. **监控索引性能**:
```javascript
// 启用慢查询日志
db.setProfilingLevel(2, { slowms: 100 });

// 查看慢查询
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty();
```

### 2. Redis缓存策略实施

**影响**: API响应时间减少 40-70%  
**实施时间**: 4小时  
**风险等级**: 🟢 低

#### Backend API缓存实现

1. **安装Redis客户端** (如未安装):
```bash
cd motor-backend
npm install redis ioredis
```

2. **创建缓存工具类** `src/utils/cache.js`:
```javascript
const Redis = require('ioredis');

class CacheManager {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
        });
    }

    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, data, ttl = 300) { // 默认5分钟
        try {
            await this.redis.setex(key, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            console.error('Cache del error:', error);
            return false;
        }
    }

    generateKey(prefix, ...params) {
        return `${prefix}:${params.join(':')}`;
    }
}

module.exports = new CacheManager();
```

3. **创建缓存中间件** `src/middleware/cache.js`:
```javascript
const cache = require('../utils/cache');

const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
    return async (req, res, next) => {
        // 只缓存GET请求
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = keyGenerator 
            ? keyGenerator(req)
            : `api:${req.originalUrl}:${JSON.stringify(req.query)}`;

        try {
            const cachedData = await cache.get(cacheKey);
            
            if (cachedData) {
                console.log(`Cache hit: ${cacheKey}`);
                return res.json(cachedData);
            }

            // 存储原始的res.json方法
            const originalJson = res.json.bind(res);
            
            // 重写res.json方法以缓存响应
            res.json = (data) => {
                // 只缓存成功响应
                if (res.statusCode === 200 && data) {
                    cache.set(cacheKey, data, ttl);
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

module.exports = cacheMiddleware;
```

4. **应用缓存到路由** `src/routes/motorcycles.js`:
```javascript
const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');

// 缓存摩托车列表5分钟
router.get('/', 
    cacheMiddleware(300, (req) => {
        const { page = 1, limit = 20, brand, category } = req.query;
        return `motorcycles:list:${page}:${limit}:${brand || ''}:${category || ''}`;
    }),
    async (req, res) => {
        // 原有的controller逻辑
        // ...
    }
);

// 缓存摩托车详情10分钟
router.get('/:id', 
    cacheMiddleware(600, (req) => `motorcycles:detail:${req.params.id}`),
    async (req, res) => {
        // 原有的controller逻辑
        // ...
    }
);

module.exports = router;
```

5. **缓存失效策略** `src/controllers/motorcycles.js`:
```javascript
const cache = require('../utils/cache');

const createMotorcycle = async (req, res) => {
    try {
        // 创建摩托车的逻辑
        const motorcycle = await Motorcycle.create(req.body);

        // 清除相关缓存
        await cache.del('motorcycles:list:*'); // 清除列表缓存
        await cache.del(`motorcycles:user:${req.user.id}:*`); // 清除用户缓存

        res.status(201).json(motorcycle);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateMotorcycle = async (req, res) => {
    try {
        const { id } = req.params;
        const motorcycle = await Motorcycle.findByIdAndUpdate(id, req.body, { new: true });

        // 清除特定缓存
        await cache.del(`motorcycles:detail:${id}`);
        await cache.del('motorcycles:list:*');

        res.json(motorcycle);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
```

### 3. Nginx性能配置优化

**影响**: 页面加载速度提升 30-50%  
**实施时间**: 1小时  
**风险等级**: 🟡 中

#### 优化 `nginx/nginx.conf`:

```nginx
# 优化的Nginx配置
worker_processes auto;
worker_connections 1024;
worker_rlimit_nofile 2048;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for" '
                   'rt=$request_time uct="$upstream_connect_time" '
                   'uht="$upstream_header_time" urt="$upstream_response_time"';

    # 基础优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # 客户端配置
    client_max_body_size 50M;
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;

    # Gzip压缩配置
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # Brotli压缩 (如果支持)
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 上游服务器配置
    upstream backend {
        least_conn;
        server backend:5000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream frontend {
        server web-frontend:3000;
        keepalive 16;
    }

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=2r/s;

    # 主服务器配置
    server {
        listen 80;
        server_name localhost;
        
        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API路由 - 应用限流
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # 超时配置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # 静态资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
            
            # 尝试直接提供文件，否则转发给前端
            try_files $uri @frontend;
        }

        # 前端路由
        location / {
            try_files $uri @frontend;
        }

        location @frontend {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # 健康检查端点
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # 状态监控页面 (可选)
    server {
        listen 8080;
        server_name localhost;
        
        location /nginx_status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            allow 172.0.0.0/8;
            deny all;
        }
    }
}
```

### 4. 验证优化效果

#### 性能测试脚本 `scripts/test-optimization.sh`:

```bash
#!/bin/bash

echo "🧪 测试优化效果..."

# 测试API响应时间
echo "📊 API性能测试:"
for i in {1..5}; do
    time curl -s "http://localhost:5000/api/health" > /dev/null
done

# 测试缓存命中
echo "🎯 缓存测试:"
echo "首次请求 (未命中):"
time curl -s "http://localhost:5000/api/motorcycles" > /dev/null
echo "第二次请求 (命中):"
time curl -s "http://localhost:5000/api/motorcycles" > /dev/null

# 测试压缩
echo "📦 压缩测试:"
curl -H "Accept-Encoding: gzip" -I "http://localhost:3000/"

# 数据库查询性能
echo "🗄️ 数据库性能测试:"
# 这里需要在应用中添加性能监控端点

echo "✅ 优化测试完成"
```

---

## 🔧 第二阶段：中期优化 (1-2周实施)

### 1. 前端性能优化

#### 1.1 代码分割和懒加载

**实施 React Router 代码分割** `src/App.tsx`:

```typescript
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';

// 懒加载组件
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MotorcyclesPage = React.lazy(() => import('./pages/MotorcyclesPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

function App() {
  return (
    <Router>
      <div className="App">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/motorcycles" element={<MotorcyclesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
```

#### 1.2 Bundle分析和优化

**添加 bundle 分析工具**:

```bash
cd motor-web-frontend
npm install --save-dev @rollup/plugin-visualizer
```

**更新 `vite.config.ts`**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
```

#### 1.3 图片优化组件

**创建优化的图片组件** `src/components/OptimizedImage.tsx`:

```typescript
import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  webpSrc?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=',
  webpSrc,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <img
          src={placeholder}
          alt="Loading..."
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
      )}
      
      {isInView && (
        <picture>
          {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;
```

### 2. 容器镜像优化

#### 2.1 多阶段构建 Dockerfile

**优化后端 Dockerfile** `motor-backend/Dockerfile`:

```dockerfile
# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件并安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build 2>/dev/null || echo "No build script found"

# 生产阶段
FROM node:18-alpine AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 只复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# 安装dumb-init用于信号处理
RUN apk add --no-cache dumb-init

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 使用dumb-init启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
```

**优化前端 Dockerfile** `motor-web-frontend/Dockerfile`:

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --silent

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段 - 使用nginx
FROM nginx:alpine AS production

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建好的文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建非root用户
RUN adduser -D -s /bin/sh www-data

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 2.2 Docker构建优化配置

**创建 `.dockerignore`**:
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
.vscode
*.md
tests
docs
.github
```

**优化 Docker Compose**:
```yaml
# docker-compose.yml 性能优化部分
services:
  backend:
    build:
      context: ./motor-backend
      dockerfile: Dockerfile
      # 使用构建缓存
      cache_from:
        - motor-backend:latest
    # 资源限制
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.2'
    # 优化重启策略
    restart: unless-stopped
    
  web-frontend:
    build:
      context: ./motor-web-frontend
      dockerfile: Dockerfile
      cache_from:
        - motor-web-frontend:latest
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.3'
        reservations:
          memory: 128M
          cpus: '0.1'
```

---

## 📈 第三阶段：长期优化 (1-2月实施)

### 1. 微服务架构优化

#### 1.1 API网关实施

**使用 Kong 或 Nginx Plus 作为API网关**:

```yaml
# docker-compose.yml 添加API网关
services:
  api-gateway:
    image: kong:latest
    environment:
      - KONG_DATABASE=off
      - KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml
      - KONG_PROXY_ACCESS_LOG=/dev/stdout
      - KONG_ADMIN_ACCESS_LOG=/dev/stdout
      - KONG_PROXY_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_LISTEN=0.0.0.0:8001
    volumes:
      - ./gateway/kong.yml:/kong/declarative/kong.yml
    ports:
      - "8000:8000"
      - "8443:8443"
      - "8001:8001"
      - "8444:8444"
```

#### 1.2 消息队列集成

**添加 Redis Bull Queue**:

```javascript
// src/queue/motorcycleQueue.js
const Queue = require('bull');
const redis = require('../config/redis');

const motorcycleQueue = new Queue('motorcycle processing', {
    redis: {
        host: redis.options.host,
        port: redis.options.port,
        password: redis.options.password,
    },
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// 处理摩托车图片优化
motorcycleQueue.process('optimize-images', 5, async (job) => {
    const { motorcycleId, images } = job.data;
    
    try {
        // 图片优化逻辑
        const optimizedImages = await optimizeImages(images);
        
        // 更新数据库
        await Motorcycle.findByIdAndUpdate(motorcycleId, {
            images: optimizedImages,
            status: 'active'
        });
        
        // 清除相关缓存
        await cache.del(`motorcycles:detail:${motorcycleId}`);
        
        return { success: true, optimizedCount: optimizedImages.length };
    } catch (error) {
        throw error;
    }
});

module.exports = motorcycleQueue;
```

### 2. 高级监控实施

#### 2.1 自定义指标收集

**添加 Prometheus 指标** `src/middleware/metrics.js`:

```javascript
const prometheus = require('prom-client');

// 创建自定义指标
const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
});

const databaseQueryDuration = new prometheus.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['collection', 'operation']
});

// 中间件
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    activeConnections.inc();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        
        httpRequestDuration
            .labels(req.method, route, res.statusCode)
            .observe(duration);
            
        httpRequestTotal
            .labels(req.method, route, res.statusCode)
            .inc();
            
        activeConnections.dec();
    });
    
    next();
};

// 数据库查询监控
const monitorQuery = async (collection, operation, queryFn) => {
    const start = Date.now();
    
    try {
        const result = await queryFn();
        const duration = (Date.now() - start) / 1000;
        
        databaseQueryDuration
            .labels(collection, operation)
            .observe(duration);
            
        return result;
    } catch (error) {
        const duration = (Date.now() - start) / 1000;
        databaseQueryDuration
            .labels(collection, `${operation}_error`)
            .observe(duration);
        throw error;
    }
};

module.exports = {
    metricsMiddleware,
    monitorQuery,
    register: prometheus.register
};
```

#### 2.2 智能告警配置

**Prometheus 告警规则** `monitoring/prometheus/rules/motor-alerts.yml`:

```yaml
groups:
  - name: motor-projects-alerts
    rules:
      # API响应时间告警
      - alert: HighAPIResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "API响应时间过长"
          description: "95%的API请求响应时间超过500ms，当前值: {{ $value }}s"

      # 错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "HTTP错误率过高"
          description: "5xx错误率超过5%，当前值: {{ $value | humanizePercentage }}"

      # 数据库性能告警
      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) > 0.1
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "数据库查询缓慢"
          description: "95%的数据库查询时间超过100ms"

      # 内存使用告警
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "容器内存使用率过高"
          description: "容器 {{ $labels.container_label_com_docker_compose_service }} 内存使用率超过85%"

      # Redis连接告警
      - alert: RedisConnectionFailure
        expr: redis_connected_clients < 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis连接失败"
          description: "Redis服务器连接数为0，缓存服务可能不可用"
```

---

## 🔍 性能监控仪表板

### Grafana Dashboard 配置

**创建综合性能仪表板** `monitoring/grafana/dashboards/motor-performance.json`:

```json
{
  "dashboard": {
    "title": "Motor Projects Performance",
    "panels": [
      {
        "title": "API Response Time (P95)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95 Response Time"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 0.5},
                {"color": "red", "value": 1}
              ]
            }
          }
        }
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])",
            "legendFormat": "{{ method }} {{ route }}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph", 
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[1m]) / rate(http_requests_total[1m])",
            "legendFormat": "5xx Error Rate"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))",
            "legendFormat": "{{ collection }} {{ operation }}"
          }
        ]
      }
    ]
  }
}
```

---

## 📊 效果验证和持续优化

### 性能基准测试脚本

**创建自动化基准测试** `scripts/benchmark.sh`:

```bash
#!/bin/bash

echo "🚀 Motor Projects Performance Benchmark"
echo "========================================"

# 配置参数
API_BASE_URL="http://localhost:5000"
WEB_BASE_URL="http://localhost:3000"
TEST_DURATION=60
CONCURRENT_USERS=50

# 创建结果目录
RESULTS_DIR="./performance-results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

# API性能测试
echo "📊 API Performance Test..."
wrk -t4 -c$CONCURRENT_USERS -d${TEST_DURATION}s \
    --latency "$API_BASE_URL/api/motorcycles" \
    > "$RESULTS_DIR/api_test.txt"

# Web性能测试 (使用Lighthouse)
echo "🌐 Web Performance Test..."
lighthouse "$WEB_BASE_URL" \
    --output=json \
    --output-path="$RESULTS_DIR/lighthouse.json" \
    --chrome-flags="--headless"

# 数据库性能测试
echo "🗄️ Database Performance Test..."
node scripts/db-benchmark.js > "$RESULTS_DIR/db_test.txt"

# 生成报告
echo "📄 Generating Report..."
node scripts/generate-performance-report.js "$RESULTS_DIR"

echo "✅ Benchmark Complete! Results saved to: $RESULTS_DIR"
```

### 持续监控策略

1. **每日性能报告**: 自动生成性能趋势报告
2. **性能回归测试**: CI/CD集成性能测试
3. **容量规划**: 基于监控数据的资源规划
4. **性能优化循环**: 定期评估和优化

---

## 📋 实施检查清单

### 立即优化检查清单
- [ ] 数据库索引创建完成
- [ ] Redis缓存策略实施
- [ ] Nginx配置优化
- [ ] 性能指标监控设置
- [ ] 基准测试执行

### 中期优化检查清单  
- [ ] 前端代码分割实施
- [ ] 图片优化组件部署
- [ ] Docker镜像多阶段构建
- [ ] 容器资源限制配置
- [ ] 高级监控指标收集

### 长期优化检查清单
- [ ] API网关部署
- [ ] 消息队列集成
- [ ] 分布式追踪实施
- [ ] 智能告警配置
- [ ] 自动化性能测试

---

## 🎯 预期成果

通过完整实施本优化指南，预期达到以下性能目标:

| 指标 | 优化前 | 优化后 | 改善幅度 |
|------|--------|--------|----------|
| API响应时间 (P95) | 800ms | 300ms | 62.5% ↓ |
| 页面加载时间 | 4s | 2s | 50% ↓ |
| 数据库查询时间 | 200ms | 50ms | 75% ↓ |
| 系统可用性 | 95% | 99.5% | 4.5% ↑ |
| 并发处理能力 | 100 RPS | 500 RPS | 400% ↑ |
| 容器镜像大小 | 500MB | 150MB | 70% ↓ |

**总体性能提升预期: 60-80%**

---

**文档更新**: 2025年8月27日  
**版本**: v1.0  
**下次更新**: 优化实施后1个月