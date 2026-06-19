# AGENTS.md

This file provides guidance for AI coding agents working in this repository, especially when using opencode.

## Project Overview

SoulAI is an AI spiritual wellness and self-discovery product targeting Southeast Asia. The product combines:

- AI spiritual advisors
- Tarot, astrology, Zi Wei Dou Shu, BaZi, I Ching, numerology
- Emotional healing, journaling, meditation, breathing exercises
- Community features
- Future practitioner / guru marketplace
- Multi-language support for English, Chinese, Vietnamese, and Thai

The intended positioning is **Spiritual Wellness / Self-discovery / Emotional Reflection**, not deterministic fortune-telling.

Avoid product language that promises guaranteed outcomes, exact predictions, medical advice, legal advice, investment advice, or supernatural certainty.

## Repository Structure

```text
/home/weihs/soulai
├── discusion.md                         # Original product discussion and strategy notes
├── SoulAI_项目审查与可行性方案.md          # Feasibility and implementation plan
├── AGENTS.md                            # Agent guidance file
└── prototype/                           # Current React prototype
    ├── package.json
    ├── server.ts                        # Express API + Gemini integration fallback demo server
    ├── src/
    │   ├── App.tsx                      # Main app shell and global state
    │   ├── main.tsx
    │   ├── types.ts
    │   ├── index.css
    │   ├── lib/
    │   │   ├── constants.ts             # Advisors, meditations, affirmations
    │   │   ├── tarotData.ts             # Current partial tarot deck data
    │   │   └── translations.ts          # en / zh / vi / th strings
    │   └── components/
    │       ├── HomeView.tsx
    │       ├── DiscoverView.tsx
    │       ├── ChatView.tsx
    │       ├── HealingView.tsx
    │       ├── CommunityView.tsx
    │       ├── MarketplaceView.tsx
    │       ├── ProfileView.tsx
    │       ├── OnboardingView.tsx
    │       └── FlippableTarotCard.tsx
    └── ...
```

## Current Prototype Stack

The prototype currently uses:

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Motion (`motion/react`)
- lucide-react
- react-markdown
- Express
- `@google/genai`
- localStorage for demo persistence

This is a high-fidelity prototype, not yet a production MVP.

## Common Commands

Run commands from `prototype/` unless otherwise noted.

```bash
cd prototype
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Scripts from `prototype/package.json`:

```json
{
  "dev": "tsx server.ts",
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
  "start": "node dist/server.cjs",
  "preview": "vite preview",
  "clean": "rm -rf dist server.js",
  "lint": "tsc --noEmit"
}
```

The dev server runs on port `3000` via `server.ts`.

## Environment Variables

See `.env.example` and `prototype/.env` if present.

Expected variable:

```bash
GEMINI_API_KEY="..."
```

If `GEMINI_API_KEY` is missing, the demo server falls back to local mock responses.

Never commit real API keys, credentials, private tokens, or production secrets.

## Product Direction

The recommended product direction is:

1. Keep the existing React prototype for Web/PWA MVP validation.
2. Do not immediately rewrite everything in Flutter.
3. Validate core retention and payment willingness first.
4. Later build Flutter iOS/Android app after Web MVP metrics are validated.

Recommended MVP scope:

- Onboarding and birth profile
- Daily personalized spiritual insight
- AI advisor chat
- Full 78-card tarot experience
- Basic astrology or Zi Wei report
- Mood check-in
- Healing journal
- Simple paywall / report purchase flow
- Clear safety disclaimer

Defer or simplify:

- Full community UGC
- Large practitioner marketplace
- Advanced BaZi
- Professional Liu Yao
- Video consultation
- Wearable integration

## Technical Direction

Prefer reuse over custom implementation.

Recommended reusable/open-source components and services:

### Frontend

- Tailwind CSS for styling
- shadcn/ui + Radix UI for base components
- Motion for animation
- TanStack Query for API state
- Zustand for light client state
- react-hook-form + zod for forms and validation
- i18next or Lingui for localization
- Recharts for simple charts
- Embla Carousel or Swiper for carousel interactions
- sonner for toast notifications

### Backend / Data

Potential production options:

- Supabase for fast MVP auth, PostgreSQL, storage
- NestJS for a more structured TypeScript backend
- FastAPI for Python-based AI / astrology calculation services
- PostgreSQL as primary database
- Redis for cache, rate limiting, and queues
- BullMQ for background jobs
- Cloudflare R2 / S3 / Supabase Storage for files

### Divination / Astrology Libraries

Prefer deterministic calculation libraries before LLM interpretation.

- `iztro` for Zi Wei Dou Shu
- `lunar-javascript` or `lunar-python` for lunar calendar, solar terms, and basic Chinese calendar support
- Swiss Ephemeris / `swisseph` / `pyswisseph` for Western astrology
- `Kerykeion` for Python astrology charts and SVG natal charts
- Public tarot JSON datasets as initial 78-card data source

Do not let an LLM directly invent chart calculations. Use libraries to calculate structured data, then use the LLM to interpret.

### AI / RAG / Observability

Recommended tools:

- LiteLLM or a custom model router for Claude / GPT / Gemini fallback
- Langfuse or Helicone for prompt tracing, cost, and quality tracking
- LlamaIndex or LangChain for RAG if needed
- pgvector or Qdrant for vector search
- zod / JSON Schema for structured output validation

AI outputs must include safety boundaries and must not provide medical, legal, investment, or crisis advice beyond supportive redirection.

### Payments

- Stripe for international cards and Web payments
- Xendit for Southeast Asian local payments
- RevenueCat for future iOS / Android subscriptions
- Apple IAP and Google Play Billing for in-app digital subscriptions

Do not self-build subscription state management unless necessary.

## Coding Guidelines

### General

- Prefer small, focused changes.
- Do not introduce broad refactors unless explicitly requested.
- Keep TypeScript types strict and meaningful.
- Prefer existing files and patterns before adding new abstractions.
- Avoid unnecessary comments. Add comments only for non-obvious constraints or decisions.
- Do not add emojis to new code or docs unless the user specifically asks.
- Preserve existing visual direction unless the task is design-related.

### React

- Split large components when modifying them substantially.
- Avoid adding more logic to already-large files such as `DiscoverView.tsx`, `HomeView.tsx`, `HealingView.tsx`, and `ProfileView.tsx`.
- Prefer extracting reusable UI sections into subcomponents.
- Keep API calls behind a service layer when adding new backend integration.
- Do not persist sensitive or paid entitlement state only in localStorage.

### State Management

Current prototype uses localStorage for demo state. Production code should move toward:

- Backend persistence for profile, reports, journals, subscriptions, and chat history
- TanStack Query for server state
- Zustand for lightweight client UI state
- localStorage only for non-sensitive preferences such as language and UI mode

### AI Integration

When adding AI features:

- Use structured prompts.
- Include language selection explicitly.
- Include safety constraints.
- Prefer structured JSON output for app-critical data.
- Store prompt version if report generation is persisted.
- Separate deterministic calculation from AI interpretation.

### Localization

The app currently supports:

- `en`
- `zh`
- `vi`
- `th`

When adding user-facing strings, update all supported languages or provide a deliberate fallback.

Avoid literal machine translation for culturally sensitive spiritual content. Thai and Vietnamese wording should eventually be reviewed by native speakers.

### Safety and Compliance

Always frame readings as reflection, self-discovery, entertainment, or wellness guidance.

Do not add features or wording that:

- Guarantees future outcomes
- Claims medical or psychological diagnosis
- Gives investment, legal, or medical instructions
- Encourages dependency on readings
- Uses fear-based upsells
- Says payment can remove curses, bad luck, karma, or disasters
- Encourages harmful behavior

Include clear disclaimers around AI advisor, tarot, astrology, and paid reports.

## Suggested Refactor Priorities

If asked to improve the prototype, prioritize:

1. Add proper API client / service layer.
2. Split `DiscoverView.tsx` into feature modules.
3. Expand tarot deck to 78 cards.
4. Add disclaimer components.
5. Move translations into modular i18n files.
6. Replace localStorage-only premium state with backend-ready entitlement model.
7. Add analytics events for onboarding, daily insight, tarot, chat, paywall, and purchase.
8. Add real deterministic PoC for `iztro` and/or astrology calculations.

## Recommended Internal Modules

Future structure can evolve toward:

```text
src/
├── app/
├── components/
│   ├── ui/                 # shadcn/Radix-style base UI
│   └── soul/               # SoulAI branded reusable components
├── features/
│   ├── onboarding/
│   ├── today/
│   ├── tarot/
│   ├── astrology/
│   ├── ziwei/
│   ├── advisor/
│   ├── healing/
│   ├── marketplace/
│   └── profile/
├── lib/
│   ├── api/
│   ├── i18n/
│   ├── analytics/
│   ├── safety/
│   └── utils/
└── types/
```

## Testing Expectations

Before reporting completion for code changes:

- Run `npm run lint` in `prototype/` when TypeScript files change.
- Run `npm run build` for substantial changes.
- For UI changes, start the dev server and manually verify the changed flow in the browser if possible.
- Explicitly mention if UI verification could not be performed.

## Documentation

Primary planning document:

- `SoulAI_项目审查与可行性方案.md`

Use this document for product and technical direction before making major architectural changes.

Do not create additional planning documents unless requested. Prefer updating existing documentation when appropriate.

## Recent Development Progress

### Phase 0: Prototype Cleanup & Validation Preparation (Completed)

**Completed Tasks:**

1. **Expanded Tarot Deck to 78 Cards**
   - Created `src/lib/tarotDataComplete.ts` with full 78-card deck
   - Updated `src/lib/tarotData.ts` to use complete data
   - Includes 22 Major Arcana and 56 Minor Arcana cards

2. **Split Large Components**
   - Created `src/components/discover/` directory
   - Created `TarotModule.tsx` as first extracted module
   - Established pattern for further component splitting

3. **Created API Client Layer**
   - Created `src/lib/api.ts` with typed API client
   - Encapsulated `/api/daily-insight`, `/api/astrology-reading`, `/api/tarot-reading`
   - Provided type-safe API calls with error handling

4. **Added Disclaimer and AI Safety**
   - Created `src/components/Disclaimer.tsx` component
   - Created `src/lib/safety.ts` with AI safety rules
   - Implemented crisis detection and response system

5. **Added Analytics and Error Handling**
   - Created `src/lib/analytics.ts` for event tracking
   - Created `src/lib/errorHandling.ts` for error management
   - Implemented comprehensive tracking for user interactions

6. **Defined Subscription Model**
   - Created `src/lib/subscription.ts` with tiered subscription system
   - Defined Free, Plus, and Premium tiers with specific features
   - Implemented feature access control and upgrade recommendations

7. **Quality Assurance**
   - Ran `npm run lint` - TypeScript type checking passed
   - Ran `npm run build` - Production build successful
   - Verified code correctness and build process

8. **Documentation**
   - Created `docs/development-log.md` with detailed progress record
   - Documented technical architecture and next steps
   - Established development standards and quality assurance processes

### New Modules Added

- `src/lib/api.ts` - API client with typed endpoints
- `src/lib/analytics.ts` - Event tracking and analytics
- `src/lib/errorHandling.ts` - Error handling utilities
- `src/lib/safety.ts` - AI safety boundaries and crisis detection
- `src/lib/subscription.ts` - Subscription model and entitlements
- `src/components/Disclaimer.tsx` - Disclaimer component
- `src/components/discover/TarotModule.tsx` - Extracted tarot module

### Phase 1: Web MVP Status (Completed 2026-06-19)

All Phase 1 tasks are implemented and verified:

1. ✅ User authentication and registration (JWT, register/login/me/refresh)
2. ✅ Backend database integration (PostgreSQL via Docker, all CRUD routes)
3. ✅ Personalized daily insights (AI-generated with user context)
4. ✅ Multi-advisor AI chat system (4 personas: Luna, Athena, Mystic, Zen)
5. ✅ Complete tarot experience (78-card deck, single/3-card/celtic spreads)
6. ✅ `iztro` integration for Zi Wei Dou Shu (deterministic calculation)
7. ✅ Swiss Ephemeris integration for Western astrology (swisseph)
8. ✅ Healing journal and mood tracking (CRUD + stats)
9. ✅ Payment integration (Alipay/WeChat Pay with order metadata)
10. ✅ Subscription management UI (tier comparison, payment flow, cancel)

**New modules added:**
- `components/PaywallModal.tsx` - Premium feature gating
- `components/SubscriptionPage.tsx` - Subscription management
- `components/discover/AstrologyModule.tsx` - Extracted astrology module
- `components/discover/BaZiModule.tsx` - Extracted BaZi module
- `components/discover/ZiWeiModule.tsx` - Extracted ZiWei module
- `components/discover/NumerologyModule.tsx` - Extracted numerology module
- `backend/src/services/astrology.ts` - swisseph natal chart calculation
- `backend/src/services/bazi.ts` - lunar-javascript BaZi calculation
- `backend/src/services/ziwei.ts` - iztro Zi Wei calculation
- `backend/src/routes/bazi.ts`, `numerology.ts`, `ziwei.ts` - API routes
- `backend/src/types/lunar-javascript.d.ts` - TypeScript declarations

**E2e tests:** 8 Playwright tests passing (chromium). Auth, navigation, API routes, BaZi calculate button, tarot API, healing API, console errors.

### Remaining Work (Not MVP-Blocking)

- Analytics event tracking
- Translation file modularization (currently single file)
- Content moderation system
- Practitioner marketplace backend
- Community UGC features
- Data privacy/GDPR compliance
- Mobile app (Flutter) after web MVP metrics validation

### Development Guidelines

**Code Quality:**
- Run `npm run lint` before committing TypeScript changes
- Run `npm run build` for substantial changes
- Maintain strict TypeScript types
- Follow React Hooks best practices

**Component Architecture:**
- Split large components into focused modules
- Keep components under 300 lines when possible
- Extract reusable UI sections into subcomponents
- Maintain clear separation of concerns

**State Management:**
- Use API client layer for backend calls
- Implement proper error handling
- Track user interactions with analytics
- Respect subscription entitlements
