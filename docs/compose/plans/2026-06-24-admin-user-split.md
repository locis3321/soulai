# Admin/User Frontend Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the monolithic frontend into two independent deployable apps (`apps/web` for users, `apps/admin` for admins) with shared packages, eliminating admin code exposure from the user-facing build.

**Architecture:** Convert to npm workspaces monorepo. Move current `frontend/` to `apps/web/`, strip admin code. Create new `apps/admin/` as a standalone Vite+React app. Extract shared types to `packages/shared-types/`. Backend stays at `backend/`. Docker Compose updated with separate containers.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, npm workspaces, Docker

## Global Constraints

- Admin app uses independent `admin_token` in localStorage (not Zustand store)
- Admin app calls `/api/admin/*` endpoints only
- User app must NOT include any admin code in its build output
- Backend admin routes keep existing JWT auth — no changes to backend auth
- All existing e2e tests must continue to pass against `apps/web`
- Production: admin on port 3001 (or separate domain `admin.soulai.xxx`)

---

### Task 1: Create Monorepo Structure

**Files:**
- Create: `apps/` directory
- Create: `packages/` directory
- Create: `package.json` (root — workspaces config)
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p apps packages/shared-types
```

- [ ] **Step 2: Create root package.json with workspaces**

Create `package.json` at project root:
```json
{
  "name": "soulai",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "backend"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "dev:admin": "npm run dev --workspace=apps/admin",
    "dev:all": "npm run dev --workspace=apps/web & npm run dev --workspace=apps/admin",
    "build": "npm run build --workspaces",
    "build:web": "npm run build --workspace=apps/web",
    "build:admin": "npm run build --workspace=apps/admin",
    "lint": "npm run lint --workspaces",
    "test": "npm run test --workspaces"
  }
}
```

- [ ] **Step 3: Create shared-types package**

Create `packages/shared-types/package.json`:
```json
{
  "name": "@soulai/shared-types",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
```

Create `packages/shared-types/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["*.ts"]
}
```

---

### Task 2: Extract Shared Types

**Files:**
- Create: `packages/shared-types/index.ts`
- Modify: `frontend/src/types.ts` (will be moved in Task 3)

- [ ] **Step 1: Read current types.ts**

Read `frontend/src/types.ts` (102 lines) to understand all type definitions.

- [ ] **Step 2: Create shared-types/index.ts**

Copy all type definitions from `frontend/src/types.ts` into `packages/shared-types/index.ts`. This includes:
- `UserProfile`
- `EnergyScores`
- `DailyInsightData`
- `AdvisorKey`, `AdvisorInfo`
- `ChatMessage`
- `TarotCard`
- `MoodType`, `MoodCheckIn`
- `HealingJournal`
- `MeditationSession`
- `TarotCardSpread`
- `ApiResponse<T>`

---

### Task 3: Create apps/web (User Frontend)

**Files:**
- Move: `frontend/` → `apps/web/` (entire directory)
- Modify: `apps/web/package.json` (add shared-types dependency)
- Modify: `apps/web/src/App.tsx` (remove admin imports/routes)
- Modify: `apps/web/vite.config.ts` (adjust if needed)
- Modify: `apps/web/tsconfig.json` (add shared-types path)
- Delete: `apps/web/src/admin/` directory

- [ ] **Step 1: Move frontend to apps/web**

```bash
mv frontend apps/web
```

- [ ] **Step 2: Update apps/web/package.json**

Add dependency on shared-types:
```json
"@soulai/shared-types": "*"
```

Remove any admin-specific dependencies if present (none currently — admin only uses react + axios).

- [ ] **Step 3: Update apps/web/tsconfig.json**

Add path alias for shared-types:
```json
"paths": {
  "@soulai/shared-types": ["../../packages/shared-types"]
}
```

- [ ] **Step 4: Update type imports in apps/web**

Change `import { UserProfile } from '../types'` to `import { UserProfile } from '@soulai/shared-types'` in all files that import from `types.ts`. Files to update:
- `src/components/CommunityView.tsx`
- `src/components/MarketplaceView.tsx`
- `src/components/HomeView.tsx`
- `src/components/ChatView.tsx`
- `src/components/HealingView.tsx`
- `src/components/ProfileView.tsx`
- `src/components/DiscoverView.tsx`
- `src/components/OnboardingView.tsx`
- `src/App.tsx`
- Any other file importing from `types.ts`

Keep `apps/web/src/types.ts` as a re-export from `@soulai/shared-types` for backward compatibility:
```typescript
export * from '@soulai/shared-types'
```

- [ ] **Step 5: Remove admin code from App.tsx**

In `apps/web/src/App.tsx`:
1. Remove import: `import AdminApp from './admin/AdminApp'`
2. Remove route: `<Route path="/admin/*" element={<AdminApp />} />`
3. Remove any admin-related guards or context if present

- [ ] **Step 6: Delete admin directory**

```bash
rm -rf apps/web/src/admin/
```

- [ ] **Step 7: Update Dockerfile path references**

Update `apps/web/Dockerfile` — no changes needed since it's a self-contained Vite project.

- [ ] **Step 8: Verify web app builds**

```bash
cd apps/web && npm run build
```
Expected: Clean build, no admin code in output.

- [ ] **Step 9: Verify no admin code in build output**

```bash
grep -r "admin" apps/web/dist/ --include="*.js" -l
```
Expected: No matches (or only non-admin references like "administer").

---

### Task 4: Create apps/admin (Admin Frontend)

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/vite.config.ts`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/tsconfig.node.json`
- Create: `apps/admin/index.html`
- Create: `apps/admin/src/main.tsx`
- Create: `apps/admin/src/App.tsx`
- Create: `apps/admin/src/index.css`
- Copy: `apps/admin/src/admin/` (from original frontend/src/admin/)

- [ ] **Step 1: Create apps/admin directory**

```bash
mkdir -p apps/admin/src apps/admin/public
```

- [ ] **Step 2: Create apps/admin/package.json**

```json
{
  "name": "@soulai/admin",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3001",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 3: Create apps/admin/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Create apps/admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create apps/admin/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SoulAI Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create apps/admin/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 7: Create apps/admin/src/index.css**

Minimal CSS reset — admin uses inline styles, only needs basic resets:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a1a; color: #e2e8f0; }
```

- [ ] **Step 8: Create apps/admin/src/App.tsx**

Import and render the existing admin component with React Router:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminApp from './admin/AdminApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 9: Copy admin source files**

Copy `frontend/src/admin/` directory to `apps/admin/src/admin/`:
```bash
cp -r apps/web/src/admin apps/admin/src/admin
```

This includes:
- `AdminApp.tsx` (527 lines — the main admin component)
- `LoginPage.tsx` (admin login page)
- `api.ts` (admin API client with `admin_token`)

- [ ] **Step 10: Install dependencies and build**

```bash
cd apps/admin && npm install && npm run build
```
Expected: Clean build.

---

### Task 5: Update Docker Compose

**Files:**
- Modify: `docker-compose.yml` (add admin-frontend service)
- Create: `apps/admin/Dockerfile`
- Modify: `apps/admin/nginx.conf` (for production)

- [ ] **Step 1: Create apps/admin/Dockerfile**

Three-stage build like the web app:
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3001
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Create apps/admin/nginx.conf**

```nginx
server {
    listen 3001;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 3: Update docker-compose.yml**

Add admin-frontend service after the existing frontend service:
```yaml
  admin-frontend:
    build:
      context: ./apps/admin
      dockerfile: Dockerfile
    container_name: soulai-admin-frontend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      VITE_API_URL: http://localhost:4000/api/admin
    depends_on:
      - backend
    volumes:
      - ./apps/admin/src:/app/src
```

Update existing frontend service context:
```yaml
  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: soulai-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:4000/api
    depends_on:
      - backend
    volumes:
      - ./apps/web/src:/app/src
      - ./apps/web/public:/app/public
```

- [ ] **Step 4: Update docker-compose.prod.yml**

Same pattern — add admin-frontend service with production target, update frontend context to `./apps/web`.

- [ ] **Step 5: Update nginx/nginx.conf (reverse proxy)**

Add admin upstream and location block:
```nginx
upstream admin_frontend {
    server admin-frontend:3001;
}

server {
    # ... existing config ...

    # Admin panel (separate port or domain)
    location /admin/ {
        proxy_pass http://admin_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

### Task 6: Update Playwright Config and E2E Tests

**Files:**
- Modify: `apps/web/playwright.config.ts` (update paths)
- Modify: `apps/web/e2e/app.spec.ts` (remove admin-related tests if any)
- Move: `apps/web/e2e/` stays in web (user e2e tests)

- [ ] **Step 1: Update playwright.config.ts**

The config is already in `frontend/` which becomes `apps/web/`. The `webServer` commands need updating:
```typescript
webServer: [
  {
    command: 'cd ../../backend && npm run dev',
    url: 'http://localhost:4000/health',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
],
```

- [ ] **Step 2: Verify e2e tests pass**

```bash
cd apps/web && NODE_ENV=test npx playwright test --project=chromium
```
Expected: 12/12 pass.

---

### Task 7: Update .gitignore and Documentation

**Files:**
- Modify: `.gitignore` (add apps/*/dist, node_modules patterns)
- Modify: `AGENTS.md` (update directory structure docs)
- Modify: `.env.example` (add admin-specific vars)

- [ ] **Step 1: Update .gitignore**

Add:
```
apps/*/dist
apps/*/.vite
packages/*/dist
```

- [ ] **Step 2: Update .env.example**

Add admin-specific variables:
```
# Admin Frontend
ADMIN_API_URL=http://localhost:4000/api/admin
```

---

### Task 8: Full Verification

- [ ] **Step 1: Backend lint and tests**

```bash
cd backend && npm run lint && npx vitest run
```

- [ ] **Step 2: Web app lint and tests**

```bash
cd apps/web && npm run lint && npx vitest run
```

- [ ] **Step 3: Admin app lint**

```bash
cd apps/admin && npm run lint
```

- [ ] **Step 4: Web app build**

```bash
cd apps/web && npm run build
```

- [ ] **Step 5: Admin app build**

```bash
cd apps/admin && npm run build
```

- [ ] **Step 6: Verify no admin code in web build**

```bash
grep -rl "AdminApp\|admin_token\|/api/admin" apps/web/dist/
```
Expected: No matches.

- [ ] **Step 7: E2E tests**

```bash
cd apps/web && NODE_ENV=test npx playwright test --project=chromium
```
Expected: 12/12 pass.

- [ ] **Step 8: Docker Compose build**

```bash
docker compose -f docker-compose.prod.yml build
```
Expected: All images build.
