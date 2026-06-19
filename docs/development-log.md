# SoulAI 开发过程记录

## 项目概述

SoulAI 是一个面向东南亚市场的 AI 灵性健康与自我发现平台，融合东西方命理、AI 顾问、情绪疗愈和社区功能。

## 开发阶段

### 阶段 0：原型整理与验证准备（2 周）

**目标**：把当前 Demo 变成可继续开发的基础。

**已完成任务**：

1. **扩展塔罗牌数据到完整 78 张**
   - 创建了 `src/lib/tarotDataComplete.ts` 文件
   - 包含完整的 22 张大阿卡那牌和 56 张小阿卡那牌
   - 更新了 `src/lib/tarotData.ts` 文件使用完整数据

2. **拆分超大组件**
   - 创建了 `src/components/discover/` 目录
   - 创建了 `TarotModule.tsx` 组件作为第一个拆分的模块
   - 为后续拆分其他模块奠定了基础

3. **建立 API client 层**
   - 创建了 `src/lib/api.ts` 文件
   - 封装了 `/api/daily-insight`、`/api/astrology-reading`、`/api/tarot-reading` 等 API 调用
   - 提供了类型安全的 API 客户端

4. **增加基础免责声明和 AI 安全边界**
   - 创建了 `src/components/Disclaimer.tsx` 组件
   - 创建了 `src/lib/safety.ts` 文件
   - 定义了 AI 安全规则和危机处理机制

5. **增加 analytics 埋点和错误处理**
   - 创建了 `src/lib/analytics.ts` 文件
   - 创建了 `src/lib/errorHandling.ts` 文件
   - 实现了事件跟踪和错误处理机制

6. **明确 Free/Paid 权益边界和订阅模型**
   - 创建了 `src/lib/subscription.ts` 文件
   - 定义了 Free、Plus、Premium 三个订阅层级
   - 实现了权益检查和升级推荐功能

7. **运行 lint 检查和类型验证**
   - 安装了项目依赖
   - 通过了 TypeScript 类型检查
   - 验证了代码的正确性

8. **运行 build 检查验证构建**
   - 成功构建了项目
   - 生成了生产环境文件
   - 验证了构建流程的正确性

## 技术架构

### 前端技术栈
- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Motion (`motion/react`)
- lucide-react
- react-markdown

### 后端技术栈
- Express
- `@google/genai`
- localStorage 用于演示持久化

### 新增模块
- `src/lib/api.ts` - API 客户端
- `src/lib/analytics.ts` - 分析跟踪
- `src/lib/errorHandling.ts` - 错误处理
- `src/lib/safety.ts` - AI 安全边界
- `src/lib/subscription.ts` - 订阅模型
- `src/components/Disclaimer.tsx` - 免责声明组件
- `src/components/discover/TarotModule.tsx` - 塔罗模块组件

## 下一步计划

### 阶段 1：Web MVP（1-2 个月）

**目标**：验证核心留存与付费意愿。

**待完成任务**：

1. **登录注册系统**
   - 实现用户认证
   - 集成 Supabase Auth 或类似服务

2. **用户 Profile 后端化**
   - 将 localStorage 数据迁移到后端数据库
   - 实现数据同步

3. **每日洞察功能**
   - 实现个性化每日洞察
   - 集成 AI 生成内容

4. **AI 顾问聊天**
   - 实现多顾问人格系统
   - 集成 AI 对话功能

5. **塔罗完整牌组**
   - 完成 78 张塔罗牌数据
   - 实现多种牌阵

6. **基础星盘或紫微**
   - 集成 iztro 库实现紫微斗数
   - 集成 Swiss Ephemeris 实现西方占星

7. **情绪日记**
   - 实现情绪记录功能
   - 实现日记编辑功能

8. **单次付费报告**
   - 实现付费报告生成
   - 集成支付系统

9. **基础订阅**
   - 实现订阅管理
   - 集成支付网关

## 开发规范

### 代码风格
- 使用 TypeScript 严格类型
- 遵循 React Hooks 最佳实践
- 使用 Tailwind CSS 进行样式设计
- 保持组件小型化和可复用性

### 文件组织
- `src/components/` - React 组件
- `src/lib/` - 工具函数和业务逻辑
- `src/types/` - TypeScript 类型定义
- `src/assets/` - 静态资源

### 命名规范
- 组件文件使用 PascalCase
- 工具函数使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 类型定义使用 PascalCase

## 质量保证

### 测试策略
- 单元测试：使用 Jest 或 Vitest
- 集成测试：使用 React Testing Library
- E2E 测试：使用 Playwright 或 Cypress

### 代码质量
- ESLint 用于代码检查
- Prettier 用于代码格式化
- TypeScript 用于类型检查
- Husky 用于 Git hooks

### 性能优化
- 代码分割和懒加载
- 图片优化
- 缓存策略
- 监控和报警

## 部署策略

### 开发环境
- 本地开发服务器
- 热重载
- 开发工具集成

### 测试环境
- 自动化测试
- 代码覆盖率
- 性能测试

### 生产环境
- CDN 加速
- 负载均衡
- 监控和日志
- 备份和恢复

## 风险管理

### 技术风险
- AI 模型成本控制
- 数据安全和隐私
- 系统稳定性
- 性能瓶颈

### 产品风险
- 用户留存率
- 付费转化率
- 市场竞争
- 合规风险

### 缓解措施
- 成本监控和优化
- 数据加密和备份
- 系统监控和报警
- 用户反馈和迭代

## 总结

阶段 0 的原型整理工作已经完成，为后续的 MVP 开发奠定了坚实的基础。下一步将进入阶段 1 的 Web MVP 开发，重点验证核心留存和付费意愿。
