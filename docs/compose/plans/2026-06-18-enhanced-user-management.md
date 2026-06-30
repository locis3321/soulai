# Enhanced User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the admin user management from a basic list into a full customer-service and operations console with search, filters, comprehensive user detail, and admin actions.

**Architecture:** Backend adds a migration for new columns/tables, enhances existing list/detail endpoints with filters and comprehensive data joins, and adds new action endpoints (mark-risk, notes). Frontend extracts UsersPage into its own file with a filter bar, paginated table, full-page detail view with tabbed sections, and an action toolbar.

**Tech Stack:** Express + TypeScript + PostgreSQL (backend), React 19 + TypeScript + Vite (admin frontend)

## Global Constraints

- Reply to users in Chinese per AGENTS.md
- Bilingual admin UI (zh default, en secondary) — all new strings in both locales
- No emojis in code unless requested
- Backend permission checks via `requireAdminPermission()` on all new endpoints
- Audit log all admin actions via `logAudit()`
- Keep changes minimal — no refactoring of unrelated code

---

## File Structure

### Backend
- **Create:** `backend/src/db/migrations/007_user_management.sql` — new columns + notes table
- **Modify:** `backend/src/routes/admin.ts` — enhanced list/detail endpoints, new action endpoints
- **Modify:** `backend/src/db/migrate.ts` — register migration 007 (if needed)

### Frontend (Admin)
- **Create:** `apps/admin/src/admin/UsersPage.tsx` — extracted, full-featured user management page
- **Modify:** `apps/admin/src/admin/AdminApp.tsx` — import UsersPage, remove inline implementation
- **Modify:** `apps/admin/src/admin/api.ts` — add new API methods
- **Modify:** `apps/admin/src/i18n/locales/zh.json` — add Chinese strings
- **Modify:** `apps/admin/src/i18n/locales/en.json` — add English strings

---

## Task 1: Database Migration 007

**Covers:** Schema for enhanced user management

**Files:**
- Create: `backend/src/db/migrations/007_user_management.sql`

**Changes:**
- Add `region VARCHAR(50)` to `users` (nullable, defaults to NULL)
- Add `is_high_risk BOOLEAN DEFAULT false` to `users`
- Add `risk_reason TEXT` to `users`
- Add `risk_marked_at TIMESTAMP` to `users`
- Add `risk_marked_by UUID REFERENCES admin_users(id)` to `users`
- Create `admin_user_notes` table: id, user_id (FK users), admin_user_id (FK admin_users), note TEXT, created_at
- Add index on `users(is_high_risk)` and `admin_user_notes(user_id)`

- [ ] Write migration SQL
- [ ] Verify migration runs: `cd backend && npm run dev` (auto-runs migrations on startup)
- [ ] Commit

---

## Task 2: Backend — Enhanced User List Endpoint

**Covers:** User list with search, filters, pagination

**Files:**
- Modify: `backend/src/routes/admin.ts` — `GET /admin/users` endpoint

**Changes to `GET /admin/users`:**
- Add query params: `language`, `tier`, `is_active`, `is_high_risk`, `created_after`, `created_before`, `last_active_after`, `last_active_before`
- Add `region` to SELECT
- Add `last_active` via subquery on `user_activity` (MAX(created_at))
- Add `is_high_risk` to SELECT
- Build WHERE clause dynamically based on provided filters
- Return `total` count alongside `users` for pagination
- Support `search` by email, name, OR user ID (exact match on UUID)

- [ ] Implement enhanced query with dynamic filters
- [ ] Test via curl against running backend
- [ ] Commit

---

## Task 3: Backend — Enhanced User Detail Endpoint

**Covers:** Comprehensive user detail with all data sections

**Files:**
- Modify: `backend/src/routes/admin.ts` — `GET /admin/users/:userId` endpoint

**Changes to `GET /admin/users/:userId`:**
Add these data sections to the Promise.all:
- `chatSessions` — from `chat_sessions` JOIN with message count and last message preview (LEFT JOIN chat_messages)
- `tarotReadings` — from `tarot_readings` (id, question, spread_type, cards, reading_text preview, created_at), LIMIT 20
- `astrologyReadings` — from `astrology_readings` (id, reading_type, birth_data, reading_text preview, created_at), LIMIT 20
- `communityPosts` — from `community_posts` (id, category, title, likes_count, comments_count, created_at), LIMIT 20
- `communityComments` — from `community_comments` JOIN `community_posts` (comment content, post title, created_at), LIMIT 20
- `bookings` — from `bookings` JOIN `practitioners` (booking_date, time, mode, status, practitioner name), LIMIT 20
- `practitionerReviews` — from `practitioner_reviews` JOIN `practitioners` (rating, comment, practitioner name, created_at), LIMIT 20
- `aiRequestSummary` — from `ai_request_logs` GROUP BY request_type (count, avg latency), LIMIT 20
- `privacyStatus` — from `admin_audit_logs` WHERE target_id = userId AND action IN ('export_user_data', 'delete_user_data') (action, created_at), LIMIT 5
- `notes` — from `admin_user_notes` JOIN `admin_users` (note, admin email, created_at), ORDER BY created_at DESC
- Add `is_high_risk`, `risk_reason`, `region` to user SELECT

- [ ] Implement enhanced detail query
- [ ] Test via curl
- [ ] Commit

---

## Task 4: Backend — New Admin Action Endpoints

**Covers:** Mark high-risk, internal notes

**Files:**
- Modify: `backend/src/routes/admin.ts`

**New endpoints:**
1. `POST /admin/users/:userId/mark-risk` — body: `{ reason: string, isHighRisk: boolean }`. Updates `is_high_risk`, `risk_reason`, `risk_marked_at`, `risk_marked_by`. Audit logged.
2. `GET /admin/users/:userId/notes` — returns notes list with admin email
3. `POST /admin/users/:userId/notes` — body: `{ note: string }`. Creates note. Audit logged.

- [ ] Implement mark-risk endpoint
- [ ] Implement notes GET/POST endpoints
- [ ] Test via curl
- [ ] Commit

---

## Task 5: Frontend — API Client + i18n Updates

**Covers:** Frontend API methods and translations

**Files:**
- Modify: `apps/admin/src/admin/api.ts`
- Modify: `apps/admin/src/i18n/locales/zh.json`
- Modify: `apps/admin/src/i18n/locales/en.json`

**API client additions:**
- `getUsers(params)` — extend to accept filter params (language, tier, is_active, is_high_risk, date ranges)
- `markRisk(id, reason, isHighRisk)` — POST mark-risk
- `getUserNotes(id)` — GET notes
- `addUserNote(id, note)` — POST notes

**i18n keys to add (both zh and en):**
- User list: region, highRisk, lastActive, filters (language, tier, active, highRisk, dateRange), all, free, plus, premium, yes, no
- User detail: tabs/sections (profile, subscription, payments, aiChat, tarotReadings, astrologyReadings, community, marketplace, privacy, notes)
- Actions: disable, enable, adjustSubscription, markHighRisk, unmarkRisk, exportData, addNote, save, cancel, reason, notePlaceholder
- Detail fields: chatSession, messageCount, lastMessage, spreadType, readingType, practitioner, bookingDate, bookingStatus, rating, comment, exportTime, deleteTime, noData

- [ ] Add API methods
- [ ] Add all i18n keys to zh.json
- [ ] Add all i18n keys to en.json
- [ ] Commit

---

## Task 6: Frontend — UsersPage Component

**Covers:** Full user management UI

**Files:**
- Create: `apps/admin/src/admin/UsersPage.tsx`
- Modify: `apps/admin/src/admin/AdminApp.tsx` — import and use new UsersPage

**Component structure:**
- `UsersPage` — main container, manages list/detail view state
  - Filter bar: search input + language dropdown + tier dropdown + active dropdown + high-risk dropdown + date range inputs
  - User table: email, name, language, region, tier, active, high-risk badge, created, last active — clickable rows
  - Pagination controls (prev/next + page info)
  - `UserDetailPanel` — shown when a user is selected, replaces the list view
    - Header: email, name, badges (tier, active, high-risk)
    - Action toolbar: Disable/Enable, Adjust Subscription, Mark/Unmark High-Risk, Export Data
    - Sections (vertically stacked, collapsible):
      1. Profile (basic info, birth data, language, region)
      2. Subscription (current tier + history table)
      3. Payments (table)
      4. AI Chat (sessions table with message count, last message)
      5. Readings (tarot + astrology/BaZi tables)
      6. Community (posts + comments tables)
      7. Marketplace (bookings + reviews tables)
      8. AI Usage (summary table by request type)
      9. Privacy (export/delete status)
      10. Internal Notes (list + add form)
    - Subscription adjustment modal (tier select + reason)
    - High-risk modal (reason input)
    - Note add form (textarea + submit)

- [ ] Create UsersPage.tsx with filter bar + table
- [ ] Implement UserDetailPanel with all sections
- [ ] Implement action toolbar with modals
- [ ] Wire into AdminApp.tsx
- [ ] Commit

---

## Task 7: Verification

**Covers:** Full verification per AGENTS.md testing requirements

- [ ] Backend lint: `cd backend && npm run lint`
- [ ] Backend build: `cd backend && npm run build`
- [ ] Backend tests: `cd backend && npx vitest run`
- [ ] Frontend lint: `cd apps/admin && npm run lint`
- [ ] Frontend build: `cd apps/admin && npm run build`
- [ ] Docker Compose up + manual smoke test
- [ ] Clean up test data
