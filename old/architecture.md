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

### 命理计算 (Backend Services)
- **框架**：Express.js 内部 TypeScript service
- **占星计算**：swisseph
- **农历/八字**：lunar-javascript
- **紫微斗数**：iztro
- **部署**：随 backend API 一起部署

## 前后端分离部署

### 开发环境
```bash
# 前端开发服务器 (端口 3000)
cd frontend && npm run dev

# 后端 API 服务器 (端口 4000)
cd backend && npm run dev

```

### 生产环境
- **前端**：静态文件部署到 CDN
- **后端**：容器化部署到云平台
- **命理计算**：作为后端服务模块部署

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
    │         └── 后端 service 层完成命理计算
    │              ├── 占星计算
    │              ├── 八字计算
    │              ├── 紫微斗数
    │              └── 返回结果
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

### 后端内置命理计算
- 当前 MVP 已将命理计算收敛到 backend service 层
- 减少独立服务部署和跨服务调试成本
- 后续如果计算负载或语言生态需要，再拆分独立服务

## 下一步建议

1. 使用 Docker Compose 统一开发环境
2. 补齐 API 功能测试和 Playwright UI 自动化测试
3. 持续将命理计算保持为确定性计算 + AI 解读
