# Motor Backend Service

这是 Motor 项目的独立后端服务，提供完整的摩托车数据管理 API 和爬虫工具。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和其他服务
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 运行测试

```bash
npm test
```

## 爬虫工具

本项目包含多个 Python 爬虫脚本，用于收集摩托车数据：

### 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 运行爬虫

```bash
# CycleWorld 爬虫
npm run scraper:cycleworld

# Motorcycle.com 爬虫  
npm run scraper:motorcyclecom

# 运行所有爬虫
npm run scraper:all

# 数据管理工具
npm run data:manage
```

## Docker 部署

### 开发环境

```bash
docker-compose up -d
```

### 生产环境

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 项目结构

```
motor-backend/
├── src/                 # 后端服务源码
├── scripts/            # Python 爬虫脚本
├── tests/              # 测试文件
├── uploads/            # 上传文件目录
├── package.json        # Node.js 配置
├── requirements.txt    # Python 依赖
└── docker-compose.yml  # Docker 配置
```

## API 文档

API 文档可在开发服务器启动后访问：
- http://localhost:5000/api/docs

## 依赖项目

- `@motor-projects/motor-shared` - 共享类型和工具函数

## 技术栈

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Cache**: Redis
- **Authentication**: JWT
- **File Upload**: Multer + Cloudinary
- **Testing**: Jest + Supertest
- **Python Tools**: requests, beautifulsoup4, pandas

## 环境变量

请参考 `.env.example` 文件了解完整的环境变量配置。

## License

MIT