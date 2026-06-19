# SoulAI 项目审查与可行性方案

> 日期：2026-06-16  
> 范围：`discusion.md` 产品讨论文档 + `prototype/` React 原型代码 + 竞品/开源技术/东南亚市场调研  
> 目标：判断项目是否可做、如何落地、原型如何演进为商业化产品。

---

## 1. 执行摘要

SoulAI 项目的大方向是可行的，而且有明确市场空位：**面向东南亚的 AI Spiritual Wellness Platform**，融合西方占星、塔罗、东方命理、冥想疗愈、AI 陪伴与真人大师咨询。目前全球已有 Co-Star、Nebula、The Pattern、AstroTalk 等成熟玩家，但它们分别偏向西方占星、印度吠陀占星或单一市场；在泰国、越南、印尼、马来西亚等东南亚市场，还没有一个强势的「多命理体系 + 本地语言 + AI 陪伴 + 真人顾问 Marketplace」平台。

但当前原型更接近 **高保真概念 Demo**，不是可直接商业化的 MVP。它已经很好地展示了产品愿景、视觉风格和核心场景，但真实落地还缺少：真实命理计算引擎、用户系统、后端数据库、支付系统、内容审核、AI 安全策略、真人大师入驻/订单系统、合规声明、数据隐私设计和移动端发行方案。

建议采取 **两阶段技术路线**：

1. **短期 0-3 个月：保留现有 React/Vite 原型，改造成可验证的 Web/PWA MVP**  
   目标是快速验证用户是否愿意每天使用、是否愿意为深度解读或真人咨询付费。

2. **中期 3-9 个月：在验证留存和付费后，再启动 Flutter 原生 App**  
   东南亚移动互联网和支付场景高度 App 化，长期商业化应以 iOS/Android 原生体验为主，但不建议一开始就重写 Flutter。

项目最应该聚焦的 MVP 不是「把所有命理系统都做完」，而是：

> **每日灵性洞察 + AI 灵性顾问聊天 + 塔罗/占星/紫微的少量高质量解读 + 情绪疗愈日记 + 付费深度报告/真人咨询入口。**

---

## 2. 当前项目资产审查

### 2.1 讨论文档 `discusion.md` 的核心价值

讨论文档已经形成了比较完整的产品方向：

- 产品定位：AI Spiritual Wellness Platform，而不是传统算命工具。
- 目标市场：优先东南亚，尤其泰国、越南、印尼、菲律宾、马来西亚。
- 商业逻辑：
  - 算命/塔罗负责获客。
  - AI 顾问负责日活。
  - 冥想、日记、情绪疗愈负责留存。
  - 长期成长档案负责订阅续费。
  - 真人大师 Marketplace 负责高客单价变现。
- 推荐技术栈：Flutter + FastAPI + PostgreSQL + Redis + Qdrant + LLM。
- 设计方向：Mystic Luxury Minimalism，深夜蓝、神秘紫、月光金，Dark Mode First。

这个方向是合理的。尤其值得保留的是「不要只做算命工具，而是做灵性成长和情绪疗愈平台」这一定位，因为它同时有利于：

- 降低监管风险；
- 提高 App Store 审核通过率；
- 提升长期留存；
- 避免被用户当作一次性娱乐工具；
- 方便引入 AI 陪伴、冥想、日记、社区等高频场景。

### 2.2 当前原型 `prototype/` 的完成度

原型使用 React 19 + TypeScript + Vite + Tailwind CSS 4 + Motion + Express + Gemini API，核心结构如下：

- `prototype/src/App.tsx`：主应用壳、底部 Tab、全局状态、本地持久化。
- `prototype/server.ts`：Express 后端，提供 Gemini API 调用和 fallback 内容。
- `prototype/src/components/HomeView.tsx`：首页、每日能量、佛教供养、木鱼、快捷占卜。
- `prototype/src/components/DiscoverView.tsx`：塔罗、占星、八字、紫微、易经、六爻、生命灵数。
- `prototype/src/components/ChatView.tsx`：4 个 AI 顾问人格聊天。
- `prototype/src/components/HealingView.tsx`：冥想播放器、情绪 check-in、呼吸练习、日记。
- `prototype/src/components/CommunityView.tsx`：社区 Feed、发帖、点赞、评论。
- `prototype/src/components/MarketplaceView.tsx`：大师市集、预约流程、下单模拟。
- `prototype/src/components/ProfileView.tsx`：用户档案、语言切换、出生信息、历史记录。
- `prototype/src/components/OnboardingView.tsx`：5 步引导流程。
- `prototype/src/lib/translations.ts`：英文、中文、越南语、泰语文案。
- `prototype/src/lib/tarotData.ts`：塔罗牌数据，目前只有 12 张大阿卡那。

整体评价：**原型非常适合演示愿景，但真实业务实现比例偏低。**

它已经完成了：

- 高保真移动端视觉框架；
- 7 个核心 Tab 的产品信息架构；
- 多语言基础能力；
- AI 聊天/每日解读/塔罗解读 API 入口；
- 用户 Profile、日记、塔罗历史等 localStorage 模拟；
- Marketplace、Community、Healing 等关键商业场景 UI。

但还没有完成：

- 真实注册登录；
- 后端数据库；
- 真实命理计算；
- 真实支付；
- 真实大师入驻和订单；
- 真实社区后端和审核；
- 真实推送；
- 真实埋点；
- 真实订阅权益控制；
- 合规免责声明；
- AI 输出安全防护；
- App Store / Google Play 发行方案。

---

## 3. 原型与商业化产品之间的关键差距

### 3.1 数据层差距

当前所有用户数据基本存在浏览器 localStorage：

- `soul_profile`
- `soul_journals`
- `soul_tarot_history`
- `soul_is_premium`
- `soul_lang`
- `soul_large_text`
- `soul_active_tab`

这适合 Demo，但不适合正式产品。正式产品至少需要：

- 用户表；
- 出生资料表；
- 情绪记录表；
- 日记表；
- AI 对话表；
- 占卜报告表；
- 订阅权益表；
- 订单表；
- 大师档案表；
- 社区帖子/评论/举报表；
- 内容审核记录表。

建议数据库：

- PostgreSQL：主业务数据。
- Redis：会话、限流、短期缓存。
- Object Storage：音频、图片、头像、报告 PDF。
- Vector DB：Qdrant / pgvector / Pinecone，用于灵性知识库 RAG。

### 3.2 命理计算差距

当前 Discover 中的八字、紫微、易经、六爻、生命灵数大多是 mock 或简化逻辑。生产环境必须把「计算」和「解读」分开：

1. **计算层**：根据出生时间、地点、历法转换生成结构化命盘。
2. **知识层**：根据命盘结构检索对应解释文本。
3. **AI 合成层**：把结构化结果 + 知识片段 + 用户上下文整合成自然语言报告。

不能直接让 LLM「凭空算命」。原因：

- 容易幻觉；
- 用户会质疑准确性；
- 不同命理体系有明确规则；
- 付费报告需要可复现；
- 后续大师复核需要结构化结果。

### 3.3 AI 后端差距

当前 `server.ts` 直接把用户输入拼进 prompt，并调用 Gemini，再返回文本。这个方式 Demo 可用，但生产环境需要增强：

- Prompt 模板版本管理；
- 用户输入安全过滤；
- 输出安全分类；
- 危机干预策略；
- Token 成本控制；
- 多模型 fallback；
- 对话摘要和长期记忆；
- RAG 检索；
- 请求限流；
- 日志与追踪；
- A/B 测试；
- 不同市场的语气和合规差异。

尤其要注意：SoulAI 涉及情绪疗愈和心理支持，必须明确避免：

- 诊断疾病；
- 替代心理医生；
- 鼓励用户做重大财务/医疗/法律决定；
- 过度宿命论；
- 对焦虑、抑郁、自伤风险用户给出不当建议。

### 3.4 支付与商业化差距

当前 Premium 是本地状态 toggle：`soul_is_premium`。正式产品需要：

- Apple IAP / Google Play Billing；
- 本地支付网关：Xendit、Stripe、2C2P、Opn/Omise、PayMongo 等；
- 订阅状态同步；
- 订单和发票；
- 退款处理；
- 大师咨询抽佣；
- 优惠码；
- 付费报告库存和权限控制。

建议：

- App 内订阅走 Apple / Google 官方 IAP，避免上架风险。
- Web/PWA 和真人咨询可用 Xendit + Stripe 混合。
- 东南亚本地支付优先级：
  - 泰国：PromptPay、TrueMoney、Rabbit LINE Pay。
  - 越南：MoMo、ZaloPay、VNPay。
  - 印尼：GoPay、OVO、DANA、ShopeePay。
  - 菲律宾：GCash、Maya。
  - 马来西亚：Touch 'n Go、GrabPay、Boost、DuitNow QR。
  - 新加坡：PayNow、银行卡、GrabPay。

### 3.5 社区与 Marketplace 差距

当前 Community 和 Marketplace 都是前端 mock。正式上线时，这两个模块是高风险模块，因为涉及：

- 用户生成内容；
- 欺诈风险；
- 大师资质；
- 交易纠纷；
- 退款和投诉；
- 内容审核；
- 诱导迷信/医疗/投资建议风险。

建议 MVP 阶段不要开放完整社区和自由入驻 Marketplace。可以采用：

- 社区先做只读内容流 + 官方话题；
- 发帖只开放白名单或内测用户；
- 大师只做平台审核的 5-20 位种子顾问；
- 所有咨询入口都加免责声明；
- 咨询内容禁止医疗、法律、投资、赌博、诅咒、恐吓式营销。

---

## 4. 市场与竞品结论

### 4.1 全球竞品格局

调研显示，主要竞品如下：

- **Co-Star**：20M+ downloads，主打 AI + NASA 数据 + 西方占星，每日个性化推送和好友匹配强，但没有真人顾问。
- **Nebula**：功能非常广，包含星盘、塔罗、手相、梦境、真人占星师，订阅价格相对激进。
- **AstroTalk**：50M+ downloads，印度/南亚强势，Vedic astrology + 真人聊天/电话，按分钟收费能力强。
- **The Pattern**：15M+ downloads，把占星包装成心理人格模式，弱化占星术语，用户接受度高。
- **Sanctuary**：曾经主打真人占星师 + AI 解读，但近期状态不稳定，说明高成本真人服务和订阅留存有挑战。
- **Moonly**：月相 + 自我照顾，细分但稳定。

重要启示：

- 单纯「每日星座」已经非常红海。
- 「AI + 个性化 + 社交分享」是标配。
- 真人顾问能提高收入，但运营重。
- The Pattern 的「心理模式」包装值得学习：少说预测，多说自我理解。
- AstroTalk 证明真人咨询的高客单价成立，但它更偏印度市场。

### 4.2 东南亚市场空位

东南亚本地存在大量单点应用：

- 泰国：ดูดวง / Morchang 类应用， fortune-telling 文化高度主流。
- 越南：Tử Vi、Lịch Vạn Niên、Xem Tử Vi 类应用普遍，紫微/农历/生肖非常深入日常文化。
- 印尼：穆斯林主流语境下对算命较敏感，但爪哇 Primbon、巴厘文化、华人 BaZi/ZiWei 仍有细分市场。
- 马来西亚：穆斯林市场需谨慎，但华人和印度裔用户对命理接受度较高。
- 菲律宾：民间信仰、天主教文化、占星娱乐接受度较高。

目前市场缺口：

> 没有一个产品同时做到「泰语/越南语深度本地化 + 西方占星 + 紫微/八字 + 塔罗 + AI 陪伴 + 真人咨询」。

这就是 SoulAI 的机会。

### 4.3 合规定位建议

不建议在市场传播中主打：

- 100% 准确预测未来；
- 改命；
- 保证复合；
- 保证发财；
- 消灾转运；
- 替代心理治疗；
- 投资/医疗/法律决策指导。

建议统一定位为：

- Spiritual Wellness；
- Self-discovery；
- Mindfulness Companion；
- Cultural Astrology & Reflection；
- Emotional Journaling；
- AI-guided Reflection；
- Personal Growth。

中文可表达为：

> SoulAI 是一个融合传统命理文化、AI 对话和情绪疗愈的灵性成长平台，帮助用户通过每日觉察、命盘解读、冥想练习和温和陪伴，更好地理解自己、稳定情绪、做出更清醒的生活选择。

---

## 5. 技术选型建议

### 5.1 React 原型 vs Flutter App

讨论文档建议 Flutter，当前原型是 React Web。这不是问题，反而是合理的早期路径。

#### React/Vite/PWA 的优点

- 现有原型可复用；
- 修改快；
- 适合产品验证；
- 可快速接入 Web 支付和埋点；
- 可做 SEO / landing page；
- 发布成本低。

#### React/Vite/PWA 的缺点

- App Store 存在感弱；
- 东南亚用户对原生 App 信任更高；
- 推送、IAP、深度移动体验不如原生；
- Marketplace 和订阅长期需要 App 分发。

#### Flutter 的优点

- Android 表现好，适合东南亚；
- iOS/Android 单代码库；
- 动画和视觉表现适合灵性产品；
- Firebase 集成方便；
- 长期商业化更适合。

#### 建议结论

不要立即重写 Flutter。建议路线：

1. **0-3 个月：React PWA MVP**  
   用最小成本验证留存、内容偏好、支付意愿。

2. **3-6 个月：React 后台 + API 稳定化**  
   抽象后端 API，确保未来 Flutter 可复用。

3. **6-9 个月：Flutter App**  
   当 D1/D7 留存、付费转化、获客成本达到基本阈值后，再投入 Flutter。

### 5.2 推荐目标架构

建议目标架构：

```text
Client Layer
├── React PWA MVP
├── Flutter iOS/Android App
└── Admin Console

API Layer
├── FastAPI / NestJS / Express API Gateway
├── Auth Service
├── User/Profile Service
├── Divination Service
├── AI Orchestrator
├── Payment Service
├── Marketplace Service
├── Community Service
└── Notification Service

AI Layer
├── LLM Provider Router
│   ├── Claude
│   ├── GPT
│   └── Gemini
├── Prompt Template Registry
├── RAG Retriever
├── Safety Classifier
├── Conversation Memory
└── Report Generator

Calculation Layer
├── Western Astrology Engine
├── ZiWei Engine
├── BaZi Engine
├── Tarot Engine
├── I Ching Engine
└── Numerology Engine

Data Layer
├── PostgreSQL
├── Redis
├── Qdrant / pgvector
├── Object Storage
└── Analytics Warehouse
```

### 5.3 后端框架建议

如果团队偏 Python：推荐 **FastAPI**。

优点：

- 适合 AI/RAG 工作流；
- 与 Python 占星库、Kerykeion、pyswisseph 更容易集成；
- 快速开发；
- 类型提示完善。

如果团队偏 TypeScript：推荐 **NestJS** 或保持 Express 但重构。

优点：

- 可直接使用 `iztro` TypeScript 生态；
- 前后端统一语言；
- 工程化成熟。

折中建议：

- 主 API 用 TypeScript/NestJS；
- 西方占星/Kerykeion 等 Python 计算做独立 microservice；
- 或第一版全部用 Node.js + `iztro` + `swisseph`，降低复杂度。

---

## 6. 命理与灵性引擎落地方案

### 6.1 可直接使用的开源能力

#### 紫微斗数：`iztro`

- `iztro` 是当前最值得采用的紫微斗数开源库。
- TypeScript/JavaScript 生态，npm 可用。
- 支持本命盘、十二宫、主星、辅星、大限、流年等。
- 支持中英文等 i18n。
- 适合直接集成到 Node.js 后端或前端计算层。

建议：紫微斗数作为 MVP 中的东方命理主打，比八字更容易依赖现成库落地。

#### 西方占星：Swiss Ephemeris / Kerykeion

- Swiss Ephemeris 是西方占星计算金标准。
- Node.js 可用 `swisseph`，Python 可用 `pyswisseph`。
- Python 的 `Kerykeion` 更适合快速生成星盘 SVG、宫位、相位等。

建议：MVP 可先只做：

- 太阳星座；
- 月亮星座；
- 上升星座；
- 基本行星落座；
- 3-5 个重点相位；
- AI 生成心理型解读。

#### 塔罗：静态数据 + LLM 解读

塔罗数据成熟，可以使用：

- 78 张牌完整 JSON；
- 正位/逆位含义；
- 关键词；
- 牌阵位置说明。

当前原型只有 12 张大阿卡那，建议扩展到完整 78 张。

MVP 中塔罗最容易做出付费感：

- 单牌每日指引；
- 三牌牌阵；
- 爱情关系牌阵；
- 职业选择牌阵；
- 付费深度报告。

#### 生命灵数

生命灵数计算简单，可以自研。

适合作为：

- Onboarding 后的即时反馈；
- 免费用户的轻量内容；
- 分享图传播素材。

### 6.2 需要谨慎或后置的能力

#### 八字 BaZi

八字有较多 Python/JS 小库，但成熟度参差不齐。真正可商业化的八字系统需要：

- 公历/农历转换；
- 节气切换；
- 时区和出生地处理；
- 四柱；
- 十神；
- 藏干；
- 纳音；
- 大运；
- 流年；
- 喜用神；
- 格局判断。

建议：MVP 不要承诺「专业八字大师级」。可以先做轻量版：

- 四柱计算；
- 五行比例；
- 性格/关系/事业方向解读；
- 后续再引入专业命理顾问校验。

#### 六爻 Liu Yao

六爻开源生态非常弱，商业化需要大量规则自研：

- 起卦方式；
- 纳甲；
- 六亲；
- 世应；
- 动爻；
- 变卦；
- 日月建；
- 用神判断。

建议：六爻放到第二阶段或作为娱乐化轻量功能，不作为 MVP 核心。

#### 易经 I Ching

易经卦象生成简单，但高质量解释难。建议作为内容模块，而不是核心付费引擎。

---

## 7. AI 产品设计方案

### 7.1 AI 不应该「算」，而应该「解释」

正确流程：

```text
用户输入出生资料/问题
→ 规则引擎计算结构化结果
→ 检索知识库解释片段
→ LLM 结合用户画像生成个性化表达
→ 安全检查
→ 输出报告/对话
```

错误流程：

```text
用户输入出生资料
→ 直接问 LLM：请帮我算命
→ 输出不可复现的幻觉文本
```

### 7.2 AI 顾问人格建议

当前原型的 4 个顾问方向合理：

- Luna：情绪支持、温柔疗愈；
- Athena：理性分析、行动建议；
- Mystic：塔罗/占星/象征解读；
- Zen：冥想、正念、放下执念。

建议生产化时做进一步约束：

- 每个顾问有固定 system prompt；
- 每个顾问有禁止话术；
- 每个顾问有 response schema；
- 每个顾问有危机处理策略；
- 每个顾问有市场本地化版本。

例如 Luna 可以更接近心理支持，但必须避免心理诊断；Mystic 可以讲象征和直觉，但必须避免绝对预测；Athena 可以给行动建议，但不能给投资、医疗、法律决定；Zen 可以讲冥想，但不能把痛苦简单归因于「业力」。

### 7.3 RAG 知识库建议

建议建立 4 类知识库：

1. **命理知识库**
   - 星座、宫位、相位；
   - 紫微星曜、宫位、大限、流年；
   - 八字五行、十神、日主；
   - 塔罗牌义和牌阵。

2. **疗愈知识库**
   - CBT；
   - ACT；
   - 正念；
   - 呼吸练习；
   - 睡眠卫生；
   - 情绪命名。

3. **本地文化知识库**
   - 泰国佛教语境；
   - 越南 Tử Vi 和农历文化；
   - 印尼/马来穆斯林敏感表达；
   - 菲律宾民间信仰语境。

4. **安全与合规知识库**
   - 心理危机处理；
   - 医疗/法律/投资免责声明；
   - 禁止承诺；
   - 平台政策。

### 7.4 模型选择建议

不要绑定单一模型。建议做 Provider Router：

- 高质量报告：Claude / GPT 高阶模型；
- 高频聊天：较低成本模型；
- 多语言本地化：按语言评估模型质量；
- 内容审核：轻量分类模型；
- 备用模型：Gemini / OpenAI / Anthropic 互为 fallback。

当前 `server.ts` 中模型名写死在代码里，生产环境应改为配置项，并加上：

- 超时；
- 重试；
- fallback；
- 成本记录；
- prompt 版本号；
- request id。

---

## 8. 产品功能优先级

### 8.1 MVP 必做功能

建议 MVP 只做 6 个核心模块：

#### 1. Onboarding + 出生资料

- 语言选择；
- 兴趣选择；
- 出生日期；
- 出生时间；
- 出生地点；
- 用户昵称；
- 合规免责声明确认。

#### 2. Home 每日灵性洞察

- 每日能量分数；
- 今日一句个性化提醒；
- 今日塔罗单牌；
- 今日情绪 check-in；
- 分享图。

这是日活核心。

#### 3. AI 顾问聊天

第一版保留 2-3 个顾问即可：

- Luna：情绪支持；
- Mystic：塔罗/占星；
- Athena：行动建议。

Zen 可作为冥想模块内的教练，不一定单独做聊天入口。

#### 4. 塔罗模块

- 完整 78 张牌；
- 单牌；
- 三牌；
- 爱情牌阵；
- 职业牌阵；
- 免费每日 1 次；
- 付费深度报告。

#### 5. 紫微/占星轻量报告

建议首版只上：

- 西方基础星盘；
- 紫微基础命盘；
- 3 页以内的 AI 解读；
- 高级报告付费解锁。

八字、六爻先不作为首版重点。

#### 6. Healing 日记和情绪疗愈

- 情绪 check-in；
- 呼吸练习；
- 正念语录；
- 日记；
- 每周情绪趋势。

这是区别于普通算命 App 的关键。

### 8.2 MVP 可弱化功能

#### Community

原型中社区做得丰富，但 MVP 不建议完整开放。建议先做：

- 官方内容流；
- 用户只能点赞/收藏；
- 内测用户发帖；
- 举报和审核后台准备好后再开放。

#### Marketplace

Marketplace 商业潜力大，但运营重。MVP 建议只做：

- 预约意向表单；
- 5-10 位平台审核顾问；
- 人工排班；
- 先用外部聊天工具或轻量内嵌聊天；
- 不开放自由入驻。

#### 佛教供养/木鱼/点灯

当前 Home 中佛教元素很强，有差异化，但跨市场需要谨慎：

- 泰国、越南可能接受度高；
- 印尼、马来穆斯林用户可能反感；
- 西方用户可能觉得过度宗教化。

建议改成可配置：

- 泰国/越南版本：可保留 Buddhist Wellness 表达；
- 印尼/马来版本：弱化宗教仪式，改为 mindfulness / reflection；
- 英文国际版：改为 spiritual ritual / intention setting。

---

## 9. 商业模式建议

### 9.1 不建议一开始强推高价订阅

调研显示用户有订阅疲劳。建议采用「免费高频 + 低价单次 + 中价订阅 + 高价真人」组合。

### 9.2 推荐价格结构

#### Free

- 每日洞察；
- 每日单牌；
- 每日有限 AI 聊天；
- 基础星盘/紫微摘要；
- 情绪日记。

#### Plus：约 US$4.99 - 7.99/月

- 更多 AI 聊天额度；
- 三牌塔罗；
- 每周报告；
- 情绪趋势；
- 无广告。

#### Premium：约 US$9.99 - 14.99/月

- 深度命盘报告；
- 无限或高额度 AI 顾问；
- 关系匹配；
- 年度运势；
- 高级冥想内容。

#### 单次付费报告：US$2.99 - 19.99

- 爱情关系报告；
- 事业方向报告；
- 年度运势报告；
- 紫微深度报告；
- 塔罗深度解读。

#### 真人咨询

- 按分钟或按 session 收费；
- 平台抽佣 20%-30%；
- 先从文字咨询开始，再扩展语音/视频。

### 9.3 最推荐的首版变现路径

优先级：

1. 单次深度报告；
2. Plus 低价订阅；
3. 真人顾问预约；
4. Premium 高级订阅；
5. 社区增值。

原因：单次报告比订阅更容易让新用户付费，尤其适合塔罗、爱情、年度运势等强动机场景。

---

## 10. 合规与安全方案

### 10.1 产品免责声明

必须在 Onboarding、AI 聊天、付费报告、真人咨询前展示简洁免责声明：

> SoulAI 提供的内容仅用于自我探索、文化娱乐、情绪觉察和个人成长参考，不构成医疗、心理治疗、法律、财务或其他专业建议。如你正处于严重情绪危机或可能伤害自己/他人，请立即联系当地紧急服务或专业人士。

### 10.2 AI 安全策略

必须识别以下风险：

- 自伤/自杀表达；
- 严重抑郁或惊恐；
- 家暴；
- 医疗咨询；
- 投资建议；
- 法律问题；
- 迷信恐吓；
- 对他人施咒/报复；
- 未成年人敏感内容。

处理方式：

- 温和支持；
- 不做诊断；
- 不给危险建议；
- 引导寻求专业帮助；
- 提供当地紧急资源；
- 对高风险内容触发人工审核或安全模板。

### 10.3 市场合规差异

#### 泰国

- 接受度高；
- 可保留佛教/功德/祈愿元素；
- 注意不要涉及诈骗式承诺。

#### 越南

- Tử Vi 文化强；
- 政府对迷信宣传可能敏感；
- 建议包装成文化、自我理解、心理健康辅助。

#### 印尼/马来西亚

- 穆斯林市场对 fortune-telling 敏感；
- 避免「预测命运」；
- 改为 personality insight、reflection、mindfulness；
- 可做非穆斯林细分营销，但公开广告要谨慎。

#### 新加坡

- 消费者保护和广告规范严格；
- 必须有免责声明；
- 不得承诺结果；
- 真人咨询要防诈骗。

---

## 11. 实施路线图

### Phase 0：2 周，原型整理与验证准备

目标：把当前 Demo 变成可继续开发的基础。

任务：

- 拆分超大组件，降低维护难度；
- 建立真实路由结构；
- 建立 API client 层；
- 移除硬编码 mock 的关键业务假象；
- 增加基础 disclaimer；
- 增加 analytics 埋点；
- 增加错误处理和 loading 状态；
- 完成 78 张塔罗数据；
- 明确 Free/Paid 权益边界。

输出：可内测的 React PWA。

### Phase 1：1-2 个月，Web MVP

目标：验证核心留存与付费意愿。

功能：

- 登录注册；
- 用户 Profile 后端化；
- 每日洞察；
- AI 顾问聊天；
- 塔罗完整牌组；
- 基础星盘或紫微；
- 情绪日记；
- 单次付费报告；
- 基础订阅；
- 后台查看用户和订单。

技术：

- PostgreSQL；
- Auth；
- Redis 限流；
- LLM Router；
- Prompt 模板；
- Stripe/Xendit 初步接入；
- Sentry/日志；
- PostHog/GA4。

核心指标：

- D1 留存 > 30%；
- D7 留存 > 10%-15%；
- 免费到付费转化 > 2%；
- 单次报告购买率 > 1%-3%；
- AI 聊天用户次日回访率 > 20%。

### Phase 2：3-4 个月，东南亚本地化 Beta

目标：验证泰国和越南两个重点市场。

功能：

- 泰语、越南语深度本地化；
- 泰国本地日历/佛教语境内容；
- 越南 Tử Vi/农历内容；
- 紫微 `iztro` 正式接入；
- 西方星盘计算正式接入；
- 关系匹配；
- 周报/月报；
- 种子大师预约；
- 内容审核后台。

核心指标：

- 每周活跃用户增长；
- 本地语言用户平均会话时长；
- 报告购买率；
- 大师预约转化率；
- 投诉率和退款率。

### Phase 3：5-9 个月，Flutter App 与 Marketplace

目标：进入正式移动端商业化。

功能：

- Flutter iOS/Android；
- App Store / Google Play；
- Push notification；
- IAP；
- 真人顾问文字/语音咨询；
- 顾问后台；
- 排班和佣金；
- 社区 Beta；
- 推荐裂变。

核心指标：

- CAC；
- LTV；
- 订阅留存；
- 咨询 GMV；
- 大师供给效率；
- App 评分。

### Phase 4：9-18 个月，规模化

目标：多市场扩张。

功能：

- 印尼/菲律宾/马来西亚本地化；
- 更多命理体系；
- AI 长期成长档案；
- 社交关系图谱；
- Wearable 数据接入；
- 企业 wellness 合作；
- 内容创作者生态。

---

## 12. 团队配置建议

### 12.1 MVP 阶段最小团队

建议 5-7 人：

1. Product / Founder：1 人  
   负责定位、路线图、数据指标、市场验证。

2. Full-stack Engineer：1-2 人  
   负责 React、API、数据库、支付。

3. AI Engineer：1 人  
   负责 LLM、RAG、prompt、安全策略。

4. Mobile/Frontend Designer：1 人  
   负责高质量 UI/UX、本地化视觉。

5. Content & Localization：1-2 人  
   泰语/越南语、本地文化、命理内容。

6. Part-time Astrology/Spiritual Consultant：若干  
   用于校验报告、顾问话术和 Marketplace 种子供给。

### 12.2 不建议一开始配置过重

第一阶段不需要：

- 大型算法团队；
- 完整客服团队；
- 大规模大师 BD；
- 自研所有命理引擎；
- 原生 App 团队；
- 完整社区运营团队。

先验证一个市场、一个核心闭环。

---

## 13. 成本估算

以下为粗略估算，按 3-6 个月 MVP/Beta 计算。

### 13.1 开发成本

如果已有创始团队参与开发：

- MVP 开发：US$20k - 60k；
- Beta 产品：US$60k - 150k；
- Flutter App + Marketplace：US$150k - 300k+。

如果外包，成本可能更低但质量和持续迭代风险更高。

### 13.2 AI 成本

取决于调用频率和模型：

- 早期内测：US$100 - 1,000/月；
- 小规模上线：US$1,000 - 5,000/月；
- 大规模聊天：需要缓存、摘要、额度控制，否则成本容易失控。

控制策略：

- 免费用户使用轻量模型；
- 深度报告使用高质量模型；
- 常见解释用 RAG + 模板；
- 对话做摘要；
- 每日洞察可批量生成/缓存；
- 付费用户才开放长上下文。

### 13.3 基础设施成本

早期：

- Vercel/Cloudflare/Render/Fly.io：US$20 - 300/月；
- PostgreSQL 托管：US$20 - 200/月；
- Redis：US$10 - 100/月；
- Vector DB：US$0 - 300/月；
- 日志监控：US$0 - 200/月。

### 13.4 本地化和内容成本

- 泰语/越南语专业本地化：US$1k - 5k 起；
- 命理顾问校验：US$50 - 200/小时；
- 冥想音频/内容制作：US$500 - 10k+。

---

## 14. 当前原型的具体改进建议

### 14.1 代码结构

当前多个组件过大，例如：

- `DiscoverView.tsx` 超过 1000 行；
- `ProfileView.tsx` 超过 700 行；
- `HealingView.tsx` 超过 700 行；
- `HomeView.tsx` 超过 700 行。

建议拆分：

```text
components/discover/
├── DiscoverHub.tsx
├── TarotModule.tsx
├── AstrologyModule.tsx
├── BaziModule.tsx
├── ZiWeiModule.tsx
├── IChingModule.tsx
├── LiuYaoModule.tsx
└── NumerologyModule.tsx

components/healing/
├── MoodCheckIn.tsx
├── BreathingExercise.tsx
├── MeditationPlayer.tsx
├── HealingJournal.tsx
└── EmotionTrends.tsx
```

### 14.2 状态管理

当前全部集中在 `App.tsx` 和 localStorage。建议：

- MVP：使用 Zustand + API client；
- 后端化：React Query / TanStack Query；
- localStorage 只保存 token、语言、主题等轻量偏好。

### 14.3 API 层

当前前端直接调用 `/api/*`。建议新增：

```text
src/lib/api.ts
src/lib/queryKeys.ts
src/services/advisorService.ts
src/services/divinationService.ts
src/services/profileService.ts
```

### 14.4 类型系统

当前 `types.ts` 很简单。建议扩展：

- User；
- Session；
- Subscription；
- PaymentOrder；
- Advisor；
- ReadingReport；
- BirthChart；
- ZiWeiChart；
- TarotSpread；
- MarketplaceBooking；
- CommunityPost。

### 14.5 多语言

当前 `translations.ts` 是手写对象，后续会变得难维护。建议：

- 使用 i18next 或 Lingui；
- 按模块拆分语言文件；
- 增加 key 检查；
- 本地化不要只翻译文字，还要调整文化表达。

### 14.6 视觉与交互

当前视觉风格强烈，有记忆点，但也有风险：

优点：

- 高辨识度；
- 神秘感强；
- 适合 Demo；
- 动效丰富。

风险：

- 信息密度偏高；
- 宗教符号偏重；
- 底部 7 个 Tab 太多；
- 长辈大字模式有趣但需要真适配；
- 一些 emoji 和文案可能显得不够高级。

建议 MVP Tab 简化为 5 个：

1. Today；
2. Oracle；
3. Advisor；
4. Healing；
5. Me。

Community 和 Marketplace 可放到二级入口。

---

## 15. 风险清单

### 15.1 市场风险

- 用户把产品当娱乐，留存不足；
- 订阅转化不高；
- 本地文化理解不够导致反感；
- 宗教/迷信敏感；
- 全球竞品进入 SEA。

缓解：

- 先泰国/越南双市场小规模验证；
- 用本地顾问参与内容；
- 避免绝对预测；
- 强化每日陪伴和情绪价值。

### 15.2 技术风险

- AI 幻觉；
- 命理计算错误；
- 多语言质量不稳定；
- 成本失控；
- 原型代码难维护。

缓解：

- 规则计算 + RAG + LLM；
- 报告模板化；
- 本地语言人工校验；
- 免费额度控制；
- 组件拆分和后端重构。

### 15.3 合规风险

- 被认为诱导迷信；
- AI 提供心理/医疗不当建议；
- 真人大师诈骗；
- 社区违规内容。

缓解：

- Wellness 定位；
- 明确免责声明；
- AI 安全分类；
- 大师实名审核；
- 社区审核和举报。

### 15.4 运营风险

- 大师供给质量不稳定；
- 退款纠纷；
- 内容制作成本高；
- 多市场本地化复杂。

缓解：

- Marketplace 后置；
- 种子顾问白名单；
- 标准服务流程；
- 先做 1-2 个重点市场。

---

## 16. 推荐的第一版 PRD 范围

如果现在要把原型推进成 MVP，我建议第一版只写这些需求：

### 核心用户故事

1. 用户可以选择语言并完成出生资料录入。
2. 用户每天打开 App 可以看到个性化今日洞察。
3. 用户可以抽一张每日塔罗牌。
4. 用户可以完成三牌塔罗并获得 AI 解读。
5. 用户可以和 Luna/Mystic/Athena 聊天。
6. 用户可以记录情绪和日记。
7. 用户可以购买一份深度报告。
8. 用户可以查看历史报告。
9. 用户可以看到付费权益说明。
10. 用户可以看到清晰免责声明。

### 暂不做

- 完整社区；
- 大规模 Marketplace；
- 六爻专业版；
- 复杂八字格局；
- 视频咨询；
- Wearable；
- 多人社交关系图谱。

---

## 17. 最终建议

SoulAI 值得继续推进，但必须避免「功能大而全」导致迟迟无法上线。当前原型展示了一个很有想象力的完整愿景，但商业化第一步应该极度聚焦。

我建议的落地顺序是：

1. **保留现有 React 原型，不立刻推倒重写。**
2. **把原型改造成 Web/PWA MVP，先验证泰国和越南用户。**
3. **第一阶段核心只做每日洞察、AI 顾问、塔罗、基础星盘/紫微、情绪日记、单次付费报告。**
4. **命理计算必须规则化，LLM 只负责解释和陪伴。**
5. **产品统一包装为 Spiritual Wellness / Self-discovery，避免强预测和迷信承诺。**
6. **Marketplace 和 Community 后置，先做白名单和轻量入口。**
7. **当留存和付费被验证后，再投入 Flutter 原生 App。**

如果用一句话总结：

> SoulAI 的机会不是做一个「更会算命的 AI」，而是做一个「懂东南亚文化、会用命理语言陪伴用户进行自我理解和情绪疗愈的 AI 灵性成长平台」。

---

## 18. 下一步行动清单

### 立即可做，1 周内

- [ ] 把原型 7 个 Tab 简化成 MVP 信息架构。
- [ ] 扩展完整 78 张塔罗数据。
- [ ] 增加免责声明和 AI 安全边界。
- [ ] 接入基础 analytics。
- [ ] 设计 Free / Plus / Premium 权益表。
- [ ] 明确首发市场：建议泰国 + 越南。

### 2-4 周

- [ ] 后端用户系统和 PostgreSQL。
- [ ] AI Prompt 模板化。
- [ ] 每日洞察缓存。
- [ ] 塔罗深度报告付费页。
- [ ] 紫微 `iztro` PoC。
- [ ] 西方星盘 PoC。
- [ ] 泰语/越南语文案人工校验。

### 1-2 个月

- [ ] Web MVP 内测。
- [ ] Stripe/Xendit 支付 PoC。
- [ ] 报告购买闭环。
- [ ] AI 聊天额度系统。
- [ ] 后台管理端。
- [ ] 种子用户访谈。

### 3-6 个月

- [ ] 东南亚 Beta。
- [ ] 种子大师预约。
- [ ] Flutter 立项评估。
- [ ] App Store / Google Play 准备。
- [ ] 增长实验和分享图裂变。

---

## 附录 A：对当前代码的重点备注

- `prototype/src/App.tsx`：主状态集中，适合 Demo，但正式产品需迁移到后端和状态管理。
- `prototype/server.ts`：AI API 入口清晰，但需要生产级安全、限流、日志和模型配置。
- `prototype/src/components/DiscoverView.tsx`：产品愿景完整，但过大，应拆分，并把 mock 命理替换为计算服务。
- `prototype/src/components/ChatView.tsx`：AI 顾问方向正确，可作为 MVP 核心模块。
- `prototype/src/components/HealingView.tsx`：差异化强，建议保留情绪 check-in、呼吸和日记，音乐播放器可简化。
- `prototype/src/components/CommunityView.tsx`：不建议首版开放完整 UGC。
- `prototype/src/components/MarketplaceView.tsx`：商业潜力大，但应后置并白名单运营。
- `prototype/src/lib/translations.ts`：已有本地化意识，但需专业校验和模块化。
- `prototype/src/lib/tarotData.ts`：目前只有 12 张牌，需扩展到 78 张。

---

## 附录 B：详细开源项目、组件库与技术复用方案

这一章是对前文技术方案的补充。核心原则是：**不要自研可复用的基础设施，不要让 LLM 替代确定性算法，不要一开始就重写所有端。**

SoulAI 应该把研发资源集中在以下真正有差异化的部分：

- 东南亚本地化产品体验；
- 命理结果与疗愈语言的结合；
- AI 顾问人格和安全边界；
- 付费报告和真人咨询闭环；
- 用户长期成长档案。

其他部分应尽量复用成熟开源项目、SaaS、组件库或第三方服务。

---

### B.1 自研与复用边界

| 模块 | 建议 | 原因 |
|---|---|---|
| UI 基础组件 | 复用组件库 | Button、Dialog、Tabs、Form、Toast 不应自研 |
| 动效与卡片翻转 | 复用 Motion / Lottie / Rive | 灵性产品需要动效，但底层动画引擎不必自研 |
| 多语言框架 | 复用 i18next / Lingui | 文案会快速膨胀，手写对象不可维护 |
| 登录注册 | 复用 Supabase Auth / Firebase Auth / Clerk | OAuth、邮箱验证、密码重置、安全策略复杂 |
| 支付订阅 | 复用 Stripe / Xendit / RevenueCat | 支付、退款、订阅状态同步不应自研 |
| 西方占星计算 | 复用 Swiss Ephemeris / Kerykeion | 天文历算复杂，成熟库更可靠 |
| 紫微斗数 | 复用 `iztro` | 现成 TypeScript 库，适合 MVP |
| 农历/节气/八字基础 | 复用 `lunar-javascript` / `lunar-python` | 历法转换不应自研 |
| 塔罗牌数据 | 复用公开 JSON + 自建内容库 | 牌义数据可复用，产品化解释需自建 |
| 六爻/奇门/高级八字 | 后置，谨慎自研 | 开源成熟度低，规则复杂 |
| AI 编排 | 部分复用 LangChain/LlamaIndex/LiteLLM/Langfuse | 但核心 prompt、persona、安全策略需自研 |
| 社区审核 | 复用审核 API + 自建运营规则 | UGC 风险高 |
| 后台管理 | 复用 Retool / Appsmith / Forest Admin 或自建轻后台 | 早期不要投入太多 |

---

### B.2 推荐的 MVP 技术栈组合

#### 推荐组合 A：最快验证型，适合 0-3 个月 MVP

这个方案最大化复用当前 React 原型，尽快上线验证。

```text
Frontend
- React + Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- Motion
- TanStack Query
- Zustand
- react-hook-form + zod
- i18next

Backend / BaaS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Edge Functions 或轻量 Node API
- pgvector 或 Qdrant Cloud

AI
- LiteLLM 或自建简单 Model Router
- Claude / GPT / Gemini 任一主模型 + 备用模型
- Langfuse 记录 prompt、成本、质量
- RAG：LlamaIndex / LangChain / 自建轻量检索

Divination
- iztro：紫微斗数
- lunar-javascript：农历、节气、基础八字
- swisseph Node 或 Python Kerykeion microservice：西方占星
- Tarot JSON：完整 78 张牌数据

Payment
- Stripe：Web 国际卡支付
- Xendit：东南亚本地支付
- RevenueCat：后续 App IAP 订阅

Analytics / Ops
- PostHog
- Sentry
- Metabase / Supabase SQL Dashboard
```

优点：

- 上线最快；
- 当前原型复用率高；
- 不需要立刻搭完整微服务；
- 适合验证泰国/越南用户反馈。

缺点：

- Supabase Edge Functions 做复杂 AI 编排不够舒服；
- 后续 Marketplace、复杂订单、顾问排班可能需要独立后端；
- 西方占星若用 Python 库，仍需一个独立计算服务。

适用判断：如果目标是 **8-12 周内做出可付费 Web MVP**，选这个。

#### 推荐组合 B：工程化后端型，适合 3-9 个月 Beta

```text
Frontend
- React + Vite 或 Next.js
- Tailwind CSS + shadcn/ui
- TanStack Query
- Zustand
- i18next

Backend
- NestJS
- PostgreSQL + Prisma
- Redis + BullMQ
- S3 / Cloudflare R2
- Qdrant / pgvector

Python Calculation Service
- FastAPI
- Kerykeion
- pyswisseph
- lunar-python

AI Platform
- LiteLLM / Portkey / 自建 Provider Router
- Langfuse
- LlamaIndex / LangChain
- Guardrails / Zod structured output

Payment
- Stripe
- Xendit
- RevenueCat

Admin
- Retool / Appsmith / 自建 Next.js Admin
```

优点：

- 更适合正式商业化；
- TypeScript 生态适合 `iztro`、前后端类型共享；
- Python 服务可专门处理占星、星盘图、部分算法；
- Redis + BullMQ 适合报告生成、支付回调、通知任务。

缺点：

- 初期开发成本更高；
- 团队需要 Node + Python 双栈；
- DevOps 复杂度上升。

适用判断：如果已经确认要做正式 Beta，并开始接入支付、大师、报告队列，选这个。

#### 推荐组合 C：Flutter App 型，适合 Web MVP 验证后

```text
Mobile
- Flutter
- Riverpod 或 Bloc
- go_router
- Dio
- freezed + json_serializable
- flutter_secure_storage
- cached_network_image
- lottie / rive / flutter_animate
- just_audio
- in_app_purchase 或 RevenueCat purchases_flutter
- firebase_messaging

Backend
- 复用组合 B 的 API

Analytics
- Firebase Analytics
- PostHog Flutter SDK
- AppsFlyer / Adjust
- Sentry Flutter
```

优点：

- Android 表现好，适合东南亚；
- 动效和沉浸式体验优秀；
- App Store / Google Play 信任度更高；
- 推送、IAP、留存运营更完整。

缺点：

- 不应在产品未验证前投入；
- 需要重新实现前端交互；
- 当前 React 原型不能直接复用代码，只能复用设计和 API。

适用判断：当 Web MVP 已验证 D7 留存、报告购买和 AI 聊天复访后，再启动。

---

### B.3 前端 UI 与交互组件库

#### Web MVP 推荐组合

首选：**Tailwind CSS + shadcn/ui + Radix UI + Motion**。

| 类别 | 推荐 | 用途 | 备注 |
|---|---|---|---|
| Utility CSS | Tailwind CSS | 样式基础 | 当前原型已使用，继续保留 |
| Headless 组件 | Radix UI | Dialog、Popover、Tabs、Tooltip、Switch | 可访问性好，适合自定义视觉 |
| 组件封装 | shadcn/ui | 快速生成高质量组件 | 与 Tailwind/Radix 配合好，不锁死样式 |
| 动效 | Motion | 页面切换、卡片翻转、微交互 | 当前已使用 `motion/react` |
| 表单 | react-hook-form | 出生资料、支付表单、预约表单 | 性能好、生态成熟 |
| 校验 | zod | 表单校验、API schema | 可与 TypeScript 类型联动 |
| Toast | sonner | 轻量提示 | 比自研 toast 更快 |
| Command palette | cmdk | 搜索大师、搜索命理系统 | 可用于 Marketplace 搜索 |
| Carousel | Embla Carousel / Swiper | 大师推荐、塔罗牌横滑 | Embla 更轻，Swiper 功能更全 |
| 图标 | lucide-react | 当前已使用 | 保留即可 |
| Markdown | react-markdown + remark-gfm | AI 报告渲染 | 需配合安全过滤 |
| 富文本编辑 | TipTap | 社区发帖、日记高级版 | MVP 可先不用 |

不建议首选：

- MUI：组件成熟但视觉容易变成普通后台风，不适合 Mystic Luxury。
- Ant Design：后台强，C 端灵性 App 不够贴合。
- Chakra UI：开发快，但深度定制神秘风格不如 Tailwind + Radix。
- DaisyUI：快，但视觉质感不够高端。

#### 灵性产品可复用视觉组件

可以逐步沉淀一套 SoulAI 自有组件，但底层基于开源组件：

```text
src/components/soul/
├── SoulCard.tsx              # 玻璃态/星云卡片
├── SoulButton.tsx            # 金色/紫色渐变按钮
├── OracleCard.tsx            # 塔罗/命理入口卡
├── EnergyRing.tsx            # 能量环形进度
├── EnergyBar.tsx             # 爱情/事业/财富/心情进度条
├── AdvisorAvatar.tsx         # AI 顾问头像
├── MysticDialog.tsx          # 神秘风弹窗
├── ReportMarkdown.tsx        # AI 报告安全渲染
├── LanguageSwitcher.tsx      # 多语言切换
├── Paywall.tsx               # 付费墙
├── DisclaimerBox.tsx         # 合规免责声明
└── SharePoster.tsx           # 分享图组件
```

这些组件建议自建，因为它们构成产品品牌体验；但不要自研 Dialog、Tabs、Tooltip、Form 这些底层基础组件。

#### 图表与可视化

| 场景 | 推荐库 | 说明 |
|---|---|---|
| 情绪趋势折线图 | Recharts | 简单、React 友好 |
| 五行比例条 | 自定义 + CSS | 不需要重图表库 |
| 星盘轮盘 | SVG 自绘 / Kerykeion SVG | 星盘更适合专门生成 |
| 紫微十二宫 | SVG / CSS Grid 自绘 | 业务形态特殊，建议自建展示组件 |
| 社区数据后台 | ECharts | 后台复杂图表更强 |
| 分享图生成 | html-to-image / satori | 生成社交传播图 |

---

### B.4 移动端 Flutter 组件与库

如果进入 Flutter 阶段，建议不要使用过度封装的 UI 套件，而是用 Flutter 原生 Material 组件 + 自定义主题 + 动效库。

| 类别 | 推荐 | 用途 |
|---|---|---|
| 状态管理 | Riverpod | 类型安全，适合中大型 App |
| 路由 | go_router | 官方推荐方向，适合深链 |
| 网络 | Dio | 拦截器、重试、错误处理成熟 |
| 数据模型 | freezed + json_serializable | 不可变模型、JSON 解析 |
| 本地安全存储 | flutter_secure_storage | token、敏感配置 |
| 普通本地缓存 | shared_preferences / hive | 偏好设置、离线内容 |
| 图片缓存 | cached_network_image | 头像、大师图片 |
| 动效 | flutter_animate | 快速微交互 |
| 高级动效 | Rive / Lottie | 冥想动画、呼吸动画、星盘动效 |
| 音频 | just_audio | 冥想音频、睡眠故事 |
| 后台音频 | audio_service | 若做真实音频播放 |
| 推送 | firebase_messaging | FCM 推送 |
| 崩溃监控 | sentry_flutter / Firebase Crashlytics | 稳定性 |
| 订阅/IAP | RevenueCat purchases_flutter | 跨 iOS/Android 订阅管理 |
| 原生支付 | in_app_purchase | 若不使用 RevenueCat |
| Analytics | Firebase Analytics / PostHog | 用户行为 |
| 远程配置 | Firebase Remote Config | A/B 测试、市场差异配置 |

Flutter 中不建议直接依赖较弱维护的 `dart_iztro` 作为核心算法。更稳的方式是：

```text
Flutter App
→ 调用后端 Divination API
→ 后端使用 TypeScript iztro / Python astrology service
→ 返回结构化命盘 + AI 解读
```

这样可以避免客户端算法版本不一致，也方便修复命理计算 bug。

---

### B.5 命理、占星、塔罗与历法开源库

#### 紫微斗数

首选：`iztro`。

| 项目 | 语言 | 用途 | 成熟度 | 建议 |
|---|---|---|---|---|
| `iztro` | TypeScript/JavaScript | 紫微斗数命盘、十二宫、星曜、大限、流年 | 较高 | MVP 首选 |
| `dart_iztro` | Dart | Flutter 侧紫微计算 | 较低/需复核 | 不建议作为核心生产依赖 |

建议落地方式：

```text
用户出生资料
→ 标准化时间/地点/时区
→ iztro 生成 ZiWei chart JSON
→ 存库
→ RAG 检索星曜/宫位解释
→ LLM 生成个性化报告
```

应自建的部分：

- 紫微报告模板；
- 星曜解释知识库；
- 宫位优先级；
- 年度/关系/事业报告的产品化文案；
- 泰语/越南语本地化解释。

不应自研的部分：

- 十二宫排盘；
- 星曜落宫；
- 大限/流年基础计算。

#### 农历、节气与基础八字

可选：`lunar-javascript` / `lunar-python`。

这些库通常可处理：

- 公历农历转换；
- 干支；
- 节气；
- 生肖；
- 基础八字字段。

八字正式产品需要特别注意：

- 年柱按立春还是春节；
- 月柱按节气；
- 真太阳时是否使用；
- 出生地时区；
- 子时换日规则；
- 大运起运规则；
- 性别与顺逆排大运；
- 十神、藏干、旺衰、格局、喜用神。

建议阶段化：

1. MVP：只做五行比例、四柱展示、性格倾向。
2. Beta：加入十神、流年、大运。
3. 正式版：邀请专业八字顾问校验规则和报告。

不要一开始承诺「大师级精准八字」。八字如果做得粗糙，反而会伤害信任。

#### 西方占星

推荐组合：

| 项目 | 语言 | 用途 | 建议 |
|---|---|---|---|
| Swiss Ephemeris | C 核心，多语言绑定 | 行星位置、宫位、天文历算 | 金标准 |
| `swisseph` | Node.js | Node 后端占星计算 | 如果后端主栈是 TS 可用 |
| `pyswisseph` | Python | Python 占星计算 | 稳定成熟 |
| `Kerykeion` | Python | 星盘、相位、SVG 图 | 适合快速生成 natal chart |
| `flatlib` | Python | 传统占星 | 可评估，但活跃度需复核 |
| `astronomy-engine` | JS/Python/C# | 天文位置计算 | 可辅助，但不是完整占星产品库 |

推荐落地方式：

```text
Astrology Service（Python FastAPI）
├── Kerykeion 生成 natal chart JSON/SVG
├── pyswisseph 处理高级计算
└── 返回 planets / houses / aspects / chart_svg
```

前端只负责展示，不做复杂星盘计算。

#### 塔罗

可复用：

| 资源 | 用途 | 建议 |
|---|---|---|
| `ekelen/tarot-api` | 78 张牌 JSON 数据 | 可作为初始数据参考 |
| `dariusk/corpora` tarot 数据 | 牌名、基础含义 | 可补充参考 |
| 自建 Tarot content DB | 产品化解释、本地化、牌阵 | 必须建设 |

塔罗不需要复杂算法库，核心是内容和体验：

```text
洗牌随机算法
→ 抽牌
→ 正逆位
→ 牌阵位置
→ 牌义 + 位置意义 + 用户问题
→ LLM 生成解读
```

需要自建：

- 牌阵定义；
- 位置含义；
- 爱情/事业/自我成长不同语境；
- 多语言牌义；
- 付费报告模板；
- 分享卡片。

#### 易经 I Ching

可复用：

- 64 卦基础数据；
- 六爻阴阳生成；
- 本卦、变卦、动爻逻辑；
- 开源 JSON 数据或小型 `iching` 包。

建议自建产品层：

- 卦辞/爻辞现代解释；
- 情绪疗愈视角解释；
- 爱情/事业/关系问题模板；
- 泰语/越南语文化化表达。

#### 六爻 Liu Yao

结论：不建议 MVP 做专业六爻。

原因：

- 成熟开源库少；
- 中文民间 repo 质量不一；
- 规则复杂，容易出错；
- 专业用户对错误非常敏感。

可以先做娱乐化版本：

- 三枚硬币生成六爻；
- 展示本卦/变卦；
- 不做复杂纳甲、六亲、世应、日月建判断；
- 明确写成「I Ching reflection」而不是专业六爻断卦。

#### 生命灵数

建议自研。

原因：

- 逻辑简单；
- 易于本地化；
- 适合分享传播；
- 不需要引入依赖。

---

### B.6 AI、RAG、Prompt 与安全组件

#### AI 编排

| 工具 | 用途 | 建议 |
|---|---|---|
| LangChain | Agent/RAG/工具调用 | 功能全，但抽象偏重 |
| LlamaIndex | RAG、文档索引 | 知识库检索更顺手 |
| Vercel AI SDK | Web/Next.js 流式 AI UI | 如果前端用 Next.js 很适合 |
| LiteLLM | 多模型 API 统一网关 | 推荐用于 Claude/GPT/Gemini fallback |
| Portkey | LLM gateway、日志、成本 | 可选 SaaS |
| Langfuse | Prompt 观测、trace、成本 | 强烈建议早期接入 |
| Helicone | LLM 请求日志与成本 | 可选 |
| PromptLayer | Prompt 管理 | 可选 |

推荐 MVP 不要一开始上复杂 Agent 框架。建议先做：

```text
Prompt Template Registry
+ Model Router
+ RAG Retriever
+ Structured Output Parser
+ Safety Classifier
+ Trace Logger
```

#### RAG 与向量数据库

| 方案 | 适合场景 | 建议 |
|---|---|---|
| pgvector | MVP、小规模知识库 | 如果已经用 PostgreSQL，最省事 |
| Qdrant | 中等规模、过滤强、部署简单 | 推荐中期使用 |
| Pinecone | 托管、稳定、少运维 | 成本较高 |
| Weaviate | 复杂知识图谱/语义搜索 | 初期偏重 |
| Chroma | 本地开发/PoC | 不建议直接生产依赖 |

建议知识库分 collection：

```text
knowledge_astrology
knowledge_ziwei
knowledge_bazi
knowledge_tarot
knowledge_iching
knowledge_healing
knowledge_safety
knowledge_localization_th
knowledge_localization_vi
```

#### 结构化输出与校验

AI 报告不要只返回自由文本。建议使用 schema：

```ts
type ReadingReport = {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
    confidence?: "low" | "medium" | "high";
  }>;
  actions: string[];
  disclaimer: string;
  safetyFlags: string[];
};
```

可用工具：

- Zod：TypeScript schema 校验；
- Instructor：Python 结构化输出；
- Guardrails AI：输出约束；
- JSON Schema：跨语言校验。

#### AI 安全与内容审核

可复用：

| 类型 | 工具/服务 | 用途 |
|---|---|---|
| 文本审核 | OpenAI Moderation / Perspective API / 自建分类器 | UGC、聊天输入 |
| LLM 输出安全 | 自建 safety prompt + 分类模型 | 防止医疗/法律/投资建议 |
| 社区审核 | Hive / Sightengine / Google Vision / AWS Rekognition | 图片和文本审核 |
| 危机干预 | 自建规则 + 本地热线资源表 | 自伤风险处理 |

SoulAI 必须自建的安全策略：

- 禁止绝对预测；
- 禁止恐吓式命理；
- 禁止「必须付费才能消灾」；
- 禁止医疗诊断；
- 禁止投资建议；
- 禁止法律判断；
- 自伤风险转介；
- 未成年人保护。

---

### B.7 后端、数据库与基础设施选型

#### 后端框架

| 方案 | 优点 | 缺点 | 建议 |
|---|---|---|---|
| Express | 当前已有，轻量 | 结构松散，长期难维护 | Demo 可保留，正式需重构 |
| NestJS | 工程化强，TypeScript 生态好 | 初期样板多 | 推荐中期主后端 |
| FastAPI | AI/Python 生态好 | 前后端类型共享弱 | 推荐作为 AI/占星服务 |
| Next.js API Routes | 前后端一体 | 复杂任务不适合 | Landing/MVP 可用 |
| Supabase Edge Functions | 快速上线 | 复杂业务受限 | 适合 MVP 初期 |

推荐架构：

```text
NestJS Main API
├── Auth/Profile
├── Subscription/Payment
├── Report/Order
├── Marketplace
├── Community
├── Notification
└── Divination Orchestrator

FastAPI Calculation/AI Service
├── Kerykeion / pyswisseph
├── RAG
├── Report generation
└── Safety classification
```

如果团队小，第一阶段可以先用 Supabase + Edge Functions，后续再迁移。

#### ORM 与数据库

| 工具 | 用途 | 建议 |
|---|---|---|
| PostgreSQL | 主数据库 | 首选 |
| Prisma | TypeScript ORM | NestJS/Node 推荐 |
| Drizzle | 轻量 TypeScript ORM | 喜欢 SQL 控制感可选 |
| SQLAlchemy | Python ORM | FastAPI 服务推荐 |
| Redis | 缓存、限流、队列 | 中期必需 |
| BullMQ | Node 队列 | 报告生成、支付回调、推送 |
| Celery/RQ | Python 队列 | Python 服务可选 |

建议核心表：

```text
users
profiles
birth_profiles
subscriptions
entitlements
ai_conversations
ai_messages
reading_reports
tarot_spreads
ziwei_charts
astrology_charts
mood_checkins
journals
orders
payments
practitioners
bookings
community_posts
community_comments
moderation_events
```

#### 文件与对象存储

| 方案 | 适合 | 建议 |
|---|---|---|
| Cloudflare R2 | 图片、报告、音频 | 成本低，推荐 |
| AWS S3 | 标准对象存储 | 稳定但配置复杂 |
| Supabase Storage | MVP 快速集成 | 如果用 Supabase 推荐 |
| Firebase Storage | Flutter/Firebase 生态 | App 阶段可用 |

存储对象：

- 用户头像；
- 大师头像；
- 冥想音频；
- 报告 PDF；
- 分享图；
- 社区图片。

---

### B.8 支付、订阅与东南亚本地支付

#### Web 支付

| 方案 | 优点 | 建议 |
|---|---|---|
| Stripe | API 好、订阅成熟、国际卡强 | 国际用户、新加坡、马来西亚、泰国部分场景 |
| Xendit | 东南亚本地支付覆盖强 | 印尼、菲律宾、越南、泰国、本地钱包 |
| 2C2P | 东南亚老牌支付 | 泰国/企业合作可评估 |
| Opn/Omise | 泰国强 | 泰国重点市场可评估 |
| PayMongo | 菲律宾强 | 菲律宾市场可评估 |

#### App 内订阅

| 方案 | 用途 | 建议 |
|---|---|---|
| Apple IAP | iOS 数字内容订阅 | 必须支持 |
| Google Play Billing | Android 订阅 | 必须支持 |
| RevenueCat | 统一管理 IAP、订阅状态、权益 | 强烈推荐 |

建议做法：

```text
Web 单次报告 / 真人咨询：Stripe + Xendit
App 数字订阅：RevenueCat + Apple/Google IAP
真人咨询服务费：可走外部支付，但需根据平台规则谨慎设计
```

不要自己维护复杂的订阅状态。使用 RevenueCat 可以显著降低 iOS/Android 订阅、退款、恢复购买、跨端权益同步的复杂度。

---

### B.9 Admin、运营和内容管理

早期不要自研完整后台。可选：

| 工具 | 用途 | 建议 |
|---|---|---|
| Retool | 订单、用户、报告、顾问管理 | 非常适合早期运营后台 |
| Appsmith | 开源后台搭建 | 成本低，可自托管 |
| Forest Admin | 数据后台 | 可选 |
| Directus | Headless CMS + 数据管理 | 内容库可考虑 |
| Strapi | CMS | 命理文章、冥想内容管理 |
| Sanity | 结构化内容管理 | 内容团队友好 |

建议后台模块：

- 用户查询；
- 订单查询；
- 报告重生成；
- 大师资料审核；
- 预约管理；
- 内容审核；
- prompt 版本查看；
- 知识库文档管理；
- 多语言文案管理。

---

### B.10 数据分析、增长与监控

| 类别 | 推荐 | 用途 |
|---|---|---|
| 产品分析 | PostHog | 事件、漏斗、留存、A/B 测试，自托管可选 |
| 替代方案 | Amplitude / Mixpanel | 商业分析强，但成本可能更高 |
| 基础统计 | GA4 | 免费，但产品行为分析较弱 |
| 移动归因 | AppsFlyer / Adjust | App 投放归因 |
| 错误监控 | Sentry | 前后端错误、性能追踪 |
| 日志 | Logtail / Datadog / Grafana Loki | 生产日志 |
| LLM 观测 | Langfuse / Helicone | prompt、token、成本、质量 |
| BI | Metabase / Superset | 内部指标看板 |

必须埋点的事件：

```text
onboarding_started
onboarding_completed
birth_profile_submitted
daily_insight_viewed
tarot_card_drawn
tarot_report_generated
ai_chat_started
ai_message_sent
mood_checkin_created
journal_created
paywall_viewed
checkout_started
purchase_completed
report_shared
advisor_booking_started
advisor_booking_paid
```

关键漏斗：

```text
安装/访问
→ 完成 onboarding
→ 查看每日洞察
→ 第一次塔罗/聊天
→ 第二天回来
→ 看到 paywall
→ 开始支付
→ 支付成功
```

---

### B.11 可复用业务模块设计

这些不是普通开源库能直接解决的，但可以做成 SoulAI 内部复用模块，避免功能越做越乱。

#### 1. BirthProfile 标准化模块

```ts
type BirthProfile = {
  date: string;
  time?: string;
  placeText?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  calendar: "gregorian" | "lunar";
  gender?: "female" | "male" | "other" | "unknown";
};
```

职责：

- 地点转经纬度；
- 经纬度转时区；
- 校验出生时间；
- 统一传给紫微/八字/占星引擎。

可复用库：

- Google Places / Mapbox Geocoding / GeoNames；
- timezone lookup 库；
- date-fns / Luxon / Temporal polyfill。

#### 2. DivinationResult 统一结构

```ts
type DivinationResult = {
  system: "tarot" | "astrology" | "ziwei" | "bazi" | "iching" | "numerology";
  input: unknown;
  computedData: unknown;
  interpretation: ReadingReport;
  generatedAt: string;
  version: string;
};
```

好处：

- 所有报告可统一存库；
- 历史记录可统一展示；
- 付费权益可统一控制；
- AI prompt 可统一接入。

#### 3. Entitlement 权益模块

```ts
type Entitlement = {
  userId: string;
  plan: "free" | "plus" | "premium";
  aiMessagesPerDay: number;
  tarotReportsPerMonth: number;
  deepReportsPerMonth: number;
  marketplaceDiscount?: number;
};
```

不要在前端用 `isPremium` 布尔值控制权益。必须后端判断。

#### 4. AI Advisor 模块

```ts
type AdvisorPersona = {
  key: "luna" | "athena" | "mystic" | "zen";
  displayName: string;
  systemPromptVersion: string;
  allowedTopics: string[];
  blockedTopics: string[];
  safetyPolicy: string;
  responseStyle: string;
};
```

每个 AI 顾问都应有：

- persona prompt；
- safety prompt；
- local language prompt；
- response schema；
- fallback response。

#### 5. ReportTemplate 模块

```ts
type ReportTemplate = {
  key: string;
  system: "tarot" | "ziwei" | "astrology" | "bazi";
  market: "global" | "th" | "vi" | "id" | "my";
  sections: string[];
  paidTier: "free" | "plus" | "premium" | "one_time";
};
```

报告不能每次完全自由生成。模板化可以提高质量、降低成本、方便多语言。

---

### B.12 推荐优先集成顺序

#### 第 1 周：前端工程化和 UI 复用

- 引入 shadcn/ui + Radix；
- 引入 react-hook-form + zod；
- 引入 TanStack Query；
- 把 `DiscoverView.tsx` 拆分为多个模块；
- 抽出 `SoulCard`、`SoulButton`、`ReportMarkdown`、`Paywall`。

#### 第 2 周：数据和用户系统

- 接入 Supabase Auth 或自建 Auth；
- 建立 PostgreSQL schema；
- Profile、Journal、ReadingHistory 后端化；
- localStorage 只保留语言和 UI 偏好。

#### 第 3 周：塔罗产品化

- 扩展完整 78 张塔罗数据；
- 建立 TarotCard、TarotSpread、TarotReading 表；
- 建立牌阵模板；
- 接入 AI 结构化报告；
- 增加分享图生成。

#### 第 4 周：紫微/占星 PoC

- 接入 `iztro` 生成紫微命盘 JSON；
- 接入 `lunar-javascript` 处理历法；
- 建立 Python Kerykeion 服务生成星盘；
- 报告先做英文/中文，再交给泰语/越南语本地化。

#### 第 5-6 周：支付与权益

- 接入 Stripe Checkout；
- 接入 Xendit PoC；
- 建立 entitlement 后端判断；
- 单次深度报告付费；
- AI 聊天额度限制。

#### 第 7-8 周：安全、分析和内测

- 接入 PostHog；
- 接入 Sentry；
- 接入 Langfuse；
- 增加 AI safety classifier；
- 增加免责声明；
- 泰语/越南语核心文案人工校验；
- 小规模内测。

---

### B.13 最终推荐的「不要自研」清单

不要自研：

- UI 基础组件；
- 登录注册；
- 支付订阅；
- 农历/节气历法；
- 西方天文历算；
- 紫微基础排盘；
- 图表基础库；
- 表单校验；
- 多语言框架；
- 错误监控；
- 产品分析；
- LLM trace 和成本统计；
- 后台 CRUD 初版。

可以自研：

- SoulAI 品牌 UI 组件；
- 塔罗牌阵体验；
- AI 顾问人格；
- 命理解读知识库；
- 东南亚本地化内容；
- 报告模板；
- 安全策略；
- 用户长期成长档案；
- 大师 Marketplace 的业务规则。

必须谨慎自研或后置：

- 专业八字格局判断；
- 六爻断卦；
- 奇门遁甲；
- 完整社区；
- 大规模真人咨询调度；
- 自建音频内容库；
- 自建支付订阅系统。

---

### B.14 技术选型最终建议

如果现在立即开始工程化，我建议采用以下路线：

```text
当前 0-3 个月：
React + Vite + Tailwind + shadcn/ui
Supabase/PostgreSQL 或 NestJS/PostgreSQL
iztro + lunar-javascript + Tarot JSON
Kerykeion Python microservice
Claude/GPT/Gemini Router + Langfuse
Stripe + Xendit
PostHog + Sentry

3-9 个月：
NestJS 主后端 + FastAPI AI/占星服务
Redis + BullMQ
Qdrant 或 pgvector
RevenueCat
Retool/Appsmith Admin

9 个月后：
Flutter App
RevenueCat IAP
FCM/APNs Push
AppsFlyer/Adjust
Marketplace 和 Community 扩展
```

一句话结论：

> SoulAI 不应该把资源花在重复造轮子上。基础设施、通用 UI、支付、历法、占星、紫微排盘都应复用成熟库；真正要自研的是「命理文化 + AI 陪伴 + 情绪疗愈 + 东南亚本地化」这条产品化链路。
