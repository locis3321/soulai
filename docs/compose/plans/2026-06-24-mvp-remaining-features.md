# MVP Remaining Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Community and Marketplace frontend to backend APIs, create a Privacy page with data export/delete, fix the privacy delete endpoint, and add production deployment configuration.

**Architecture:** Replace hardcoded mock data in CommunityView.tsx and MarketplaceView.tsx with API calls via the existing `api` client. Create a new PrivacyView component with policy display, data export (JSON download), and data delete (with confirmation). Add nginx reverse proxy config for production.

**Tech Stack:** React, TypeScript, Vite, Express, PostgreSQL, nginx, Docker

---

### Task 1: Wire CommunityView to Backend API

**Covers:** Community frontend integration

**Files:**
- Modify: `frontend/src/components/CommunityView.tsx`
- Modify: `frontend/src/i18n/locales/en.json` (add loading/error i18n keys)
- Modify: `frontend/src/i18n/locales/zh.json`
- Modify: `frontend/src/i18n/locales/vi.json`
- Modify: `frontend/src/i18n/locales/th.json`
- Modify: `frontend/src/i18n/locales/my.json`

- [ ] **Step 1: Read current CommunityView.tsx to understand structure**

The component at `frontend/src/components/CommunityView.tsx` uses hardcoded mock data (lines 46-101). The backend API is already defined in `frontend/src/lib/api.ts` (lines 260-289):
- `api.getCommunityPosts(category?, limit, offset)` → `{ posts, total }`
- `api.getCommunityPost(postId)` → `{ post, comments }`
- `api.createCommunityPost({ category, title, content })` → `{ post, moderated }`
- `api.addComment(postId, content)` → `{ comment, moderated }`
- `api.toggleLike(postId)` → `{ liked }`
- `api.toggleBookmark(postId)` → `{ bookmarked }`

Backend response shape (from `backend/src/routes/community.ts`):
- Post: `{ id, category, title, content, likesCount, commentsCount, createdAt, authorName, authorAvatar, liked, bookmarked }`
- Comment: `{ id, content, createdAt, authorName, authorAvatar }`

- [ ] **Step 2: Rewrite CommunityView.tsx to use API calls**

Replace the mock data with real API calls. Key changes:
1. Remove hardcoded `posts` state (lines 46-101)
2. Add `useEffect` to fetch posts on mount and category change
3. Add loading and error states
4. Wire `handleLike` to `api.toggleLike(postId)`
5. Wire `handleBookmark` to `api.toggleBookmark(postId)`
6. Wire `publishDraftPost` to `api.createCommunityPost()`
7. Wire `submitComment` to `api.addComment(postId, content)`
8. When clicking a post, fetch full post with comments via `api.getCommunityPost(postId)`
9. Add relative time formatting (e.g., "2h ago") using a simple helper
10. Map `authorAvatar` from API (falls back to '👤')

The updated interface should match the API response:
```typescript
interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  category: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
}
```

For comments, fetch from the post detail endpoint when a post is selected.

- [ ] **Step 3: Add i18n keys for loading/error states**

Add to all 5 locale files under the `community` namespace:
```json
"loading": "Loading posts...",
"errorLoading": "Failed to load posts. Pull to retry.",
"noPosts": "No posts in this category yet.",
"postCreated": "Post published!",
"commentAdded": "Comment added!"
```

- [ ] **Step 4: Run lint and typecheck**

```bash
cd frontend && npm run lint && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Run frontend unit tests**

```bash
cd frontend && npx vitest run
```
Expected: All tests pass

---

### Task 2: Wire MarketplaceView to Backend API

**Covers:** Marketplace frontend integration

**Files:**
- Modify: `frontend/src/components/MarketplaceView.tsx`
- Modify: `frontend/src/i18n/locales/en.json` (add loading/error i18n keys)
- Modify: `frontend/src/i18n/locales/zh.json`
- Modify: `frontend/src/i18n/locales/vi.json`
- Modify: `frontend/src/i18n/locales/th.json`
- Modify: `frontend/src/i18n/locales/my.json`

- [ ] **Step 1: Read current MarketplaceView.tsx to understand structure**

The component at `frontend/src/components/MarketplaceView.tsx` uses hardcoded mock data (lines 65-140). The backend API is already defined in `frontend/src/lib/api.ts` (lines 291-315):
- `api.getPractitioners(category?, search?)` → `{ practitioners }`
- `api.getPractitioner(id)` → `{ practitioner, reviews }`
- `api.createBooking({ practitionerId, bookingDate, bookingTime, consultationMode })` → `{ booking }`
- `api.getUserBookings()` → `{ bookings }`
- `api.submitReview(practitionerId, rating, comment?)` → `{ review }`

Backend response shape (from `backend/src/routes/marketplace.ts`):
- Practitioner: `{ id, name, avatar, specialties, rating, reviewsCount, experienceYears, location, pricePerSession, bio, languages, isVerified }`
- Review: `{ id, rating, comment, createdAt, reviewerName }`

- [ ] **Step 2: Rewrite MarketplaceView.tsx to use API calls**

Replace mock data with real API calls. Key changes:
1. Remove hardcoded `mastersList` state (lines 65-140)
2. Add `useEffect` to fetch practitioners on mount
3. Add loading and error states
4. Wire `triggerBookSession` to `api.createBooking()`
5. When clicking a practitioner, fetch detail via `api.getPractitioner(id)` to get reviews
6. Map API response fields to existing UI structure:
   - `pricePerSession` from API is a string (e.g., "$58")
   - `rating` from API is a number
   - `isVerified` replaces the hardcoded `ShieldCheck` display
7. Keep the existing UI structure (lobby, all-masters sub-pages, detail view)
8. Update the `Master` interface to match API response

- [ ] **Step 3: Add i18n keys for loading/error states**

Add to all 5 locale files under the `marketplace` namespace:
```json
"loading": "Loading practitioners...",
"errorLoading": "Failed to load practitioners.",
"bookingSuccess": "Booking confirmed!",
"bookingError": "Failed to create booking."
```

- [ ] **Step 4: Run lint and typecheck**

```bash
cd frontend && npm run lint && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Run frontend unit tests**

```bash
cd frontend && npx vitest run
```
Expected: All tests pass

---

### Task 3: Create Privacy Page

**Covers:** Privacy frontend page

**Files:**
- Create: `frontend/src/components/PrivacyView.tsx`
- Modify: `frontend/src/App.tsx` (add `/privacy` route)
- Modify: `frontend/src/i18n/locales/en.json` (add privacy namespace)
- Modify: `frontend/src/i18n/locales/zh.json`
- Modify: `frontend/src/i18n/locales/vi.json`
- Modify: `frontend/src/i18n/locales/th.json`
- Modify: `frontend/src/i18n/locales/my.json`

- [ ] **Step 1: Add privacy i18n keys to all locale files**

Add a `privacy` namespace to all 5 locale files:
```json
"privacy": {
  "title": "Privacy & Data",
  "subtitle": "Manage your personal data and privacy settings",
  "policyTitle": "Privacy Policy",
  "lastUpdated": "Last updated",
  "exportTitle": "Export Your Data",
  "exportDesc": "Download a copy of all your personal data in JSON format.",
  "exportBtn": "Download My Data",
  "exportSuccess": "Data export downloaded successfully.",
  "exportError": "Failed to export data.",
  "deleteTitle": "Delete Your Data",
  "deleteDesc": "Permanently delete all your personal data and deactivate your account. This action cannot be undone.",
  "deleteBtn": "Delete All My Data",
  "deleteConfirm": "Type DELETE to confirm",
  "deleteConfirmTitle": "Are you sure?",
  "deleteConfirmDesc": "This will permanently delete all your data including readings, journals, chat history, and community posts. This cannot be undone.",
  "deleteSuccess": "All personal data has been deleted. Your account has been deactivated.",
  "deleteError": "Failed to delete data.",
  "cancel": "Cancel",
  "confirm": "Confirm Delete"
}
```

Translate to zh.json, vi.json, th.json, my.json with appropriate translations.

- [ ] **Step 2: Create PrivacyView.tsx component**

Create `frontend/src/components/PrivacyView.tsx` with:
1. Fetch privacy policy from `apiClient.get('/privacy/policy')` on mount
2. Display policy sections in collapsible cards
3. "Export Data" button that calls `apiClient.get('/privacy/export')` and triggers a JSON file download
4. "Delete Data" button that shows a confirmation modal (type "DELETE" to confirm), then calls `apiClient.delete('/privacy/delete')`
5. Match existing UI style (dark theme, rounded cards, same color palette)
6. Accept `largeTextMode` prop like other views

The component should be ~150-200 lines, focused and simple.

- [ ] **Step 3: Add `/privacy` route to App.tsx**

In `frontend/src/App.tsx`, add a route for `/privacy` that renders `PrivacyView`. Add it near the profile/settings routes. Also add a link from ProfileView to `/privacy`.

- [ ] **Step 4: Add privacy link in ProfileView**

In `frontend/src/components/ProfileView.tsx`, update the existing privacy section (lines 476-505) to include a link/button that navigates to `/privacy` instead of just showing static text.

- [ ] **Step 5: Run lint and typecheck**

```bash
cd frontend && npm run lint && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 6: Run frontend unit tests**

```bash
cd frontend && npx vitest run
```
Expected: All tests pass

---

### Task 4: Fix Privacy Delete Endpoint

**Covers:** Backend data deletion completeness

**Files:**
- Modify: `backend/src/routes/privacy.ts` (add missing DELETE statements)

- [ ] **Step 1: Add missing delete statements to privacy.ts**

The current DELETE endpoint (lines 91-113) is missing cleanup for:
- `community_comments` (has FK to community_posts)
- `community_likes`
- `community_bookmarks`
- `community_posts`
- `practitioner_reviews` (has FK to bookings)
- `bookings`

Add these before the existing deletes, respecting FK order:
```typescript
await db.query(`DELETE FROM community_comments WHERE user_id = $1`, [userId])
await db.query(`DELETE FROM community_likes WHERE user_id = $1`, [userId])
await db.query(`DELETE FROM community_bookmarks WHERE user_id = $1`, [userId])
await db.query(`DELETE FROM community_posts WHERE user_id = $1`, [userId])
await db.query(`DELETE FROM practitioner_reviews WHERE user_id = $1`, [userId])
await db.query(`DELETE FROM bookings WHERE user_id = $1`, [userId])
```

- [ ] **Step 2: Run backend lint and tests**

```bash
cd backend && npm run lint && npx vitest run
```
Expected: All tests pass

---

### Task 5: Production Deployment Configuration

**Covers:** Production deployment

**Files:**
- Create: `nginx/nginx.conf`
- Create: `docker-compose.prod.yml`
- Create: `.env.example` (root level, production env template)
- Modify: `backend/Dockerfile` (fix to run built code, not dev)
- Modify: `frontend/Dockerfile` (add production build stage)

- [ ] **Step 1: Create nginx configuration**

Create `nginx/nginx.conf` with:
- Reverse proxy: `/` → frontend (port 3000), `/api` → backend (port 4000)
- Gzip compression for static assets
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- Static asset caching (1 year for hashed assets)
- Health check endpoint passthrough
- WebSocket support for Vite HMR (dev only, not in prod)

- [ ] **Step 2: Update frontend Dockerfile for production**

Add a multi-stage build:
1. Stage 1: Build with `npm run build`
2. Stage 2: Serve with nginx:alpine, copying built dist and nginx config

- [ ] **Step 3: Fix backend Dockerfile**

The current backend Dockerfile runs `npm run dev` even after building. Fix to:
1. Build with `npm run build`
2. Run with `node dist/index.js` (production mode)

- [ ] **Step 4: Create docker-compose.prod.yml**

Create a production compose file that:
- Removes adminer and redis-commander (debug tools)
- Adds nginx service
- Sets `NODE_ENV=production` for backend
- Uses environment variables from `.env` file (not hardcoded)
- Removes dev volume mounts (no hot-reload in production)
- Adds restart policies

- [ ] **Step 5: Create root .env.example**

Document all required environment variables:
```
# Database
POSTGRES_USER=soulai
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=soulai_db

# Redis
REDIS_PASSWORD=<strong-password>

# Backend
JWT_SECRET=<random-64-char-string>
GEMINI_API_KEY=<your-gemini-key>
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production

# Frontend
VITE_API_URL=/api
```

- [ ] **Step 6: Verify docker-compose builds**

```bash
docker compose -f docker-compose.prod.yml build
```
Expected: All images build successfully

---

### Task 6: Run Full Verification Suite

**Covers:** All tasks verification

- [ ] **Step 1: Backend lint and tests**

```bash
cd backend && npm run lint && npx vitest run
```
Expected: All pass

- [ ] **Step 2: Frontend lint and typecheck**

```bash
cd frontend && npm run lint && npx tsc --noEmit
```
Expected: All pass

- [ ] **Step 3: Frontend unit tests**

```bash
cd frontend && npx vitest run
```
Expected: All pass

- [ ] **Step 4: Backend build**

```bash
cd backend && npm run build
```
Expected: Clean build

- [ ] **Step 5: Frontend build**

```bash
cd frontend && npm run build
```
Expected: Clean build

- [ ] **Step 6: E2E tests**

```bash
cd frontend && npx playwright test --project=chromium
```
Expected: All pass (may need backend running with NODE_ENV=test)
