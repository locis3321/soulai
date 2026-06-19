# SoulAI 项目架构说明

## 整体架构

```
soulai/
├── frontend/          # React + Vite 前端应用
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/           # Node.js/Express API 服务器
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   └── middleware/    # 中间件
│   └── package.json
│
├── services/
│   └── astrology/     # Python FastAPI 算法服务
│       ├── app/
│       │   ├── api/       # API 端点
│       │   ├── core/      # 核心计算
│       │   └── models/    # 数据模型
│       └── requirements.txt
│
├── packages/          # 共享代码（类型定义等）
│   └── shared/
│
├── docker-compose.yml # Docker 编排
└── docs/              # 文档
```

## 技术栈

### 前端 (Frontend)
- **框架**：React 19 + TypeScript
- **构建**：Vite
- **样式**：Tailwind CSS 4
- **状态管理**：Zustand + TanStack Query
- **路由**：React Router
- **动效**：Motion (framer-motion)
- **部署**：Vercel / Cloudflare Pages / Netlify

### 后端 (Backend)
- **框架**：Express.js 或 NestJS（TypeScript）
- **数据库**：PostgreSQL 15
- **缓存**：Redis 7
- **ORM**：Prisma 或 Drizzle
- **认证**：JWT + bcrypt
- **支付**：Stripe / Xendit
- **部署**：Railway / Fly.io / AWS ECS

### 算法服务 (Astrology Service)
- **框架**：FastAPI (Python)
- **占星计算**：Kerykeion + pyswisseph
- **农历/八字**：lunar-python
- **部署**：独立容器 / AWS Lambda

## 前后端分离部署

### 开发环境
```bash
# 前端开发服务器 (端口 3000)
cd frontend && npm run dev

# 后端 API 服务器 (端口 4000)
cd backend && npm run dev

# Python 算法服务 (端口 8000)
cd services/astrology && uvicorn app.main:app --reload
```

### 生产环境
- **前端**：静态文件部署到 CDN
- **后端**：容器化部署到云平台
- **算法服务**：独立容器或 Serverless

## API 通信

```
浏览器/APP
    │
    ├─── 前端 (React) ─────────────────────┐
    │                                       │
    │    /api/* 请求                        │
    │         │                             │
    │         ▼                             │
    │    后端 (Express/NestJS) ◄────────────┘
    │         │
    │         ├── 用户认证
    │         ├── 业务逻辑
    │         ├── 数据库操作
    │         │
    │         └── 需要计算时 ──► Python 算法服务
    │                              │
    │                              ├── 占星计算
    │                              ├── 八字计算
    │                              └── 返回结果
    │
    └─── 静态资源 (CDN)
```

## 为什么这样分离？

### 前端独立
- 可以独立部署到 CDN，访问速度快
- 前端团队可以独立开发
- 支持 SSR/SSG（如果用 Next.js）

### 后端独立
- 可以水平扩展
- 支持多客户端（Web、APP、小程序）
- 便于微服务演进

### Python 算法服务独立
- Python 生态有最好的占星/命理库
- 可以独立扩展计算资源
- 便于算法迭代和优化

## 当前 prototype 的处理

当前 `prototype/` 目录可以：
1. **保留作为快速原型验证**
2. **逐步迁移到分离架构**
3. **前端代码直接复制到 frontend/**
4. **后端逻辑迁移到 backend/**

## 下一步建议

1. 将 prototype 中的前端代码移到 `frontend/`
2. 创建独立的 `backend/` 项目
3. 使用 Docker Compose 统一开发环境
4. 逐步迁移 API 调用
