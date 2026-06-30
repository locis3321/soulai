# AGENTS.md

Guidance for coding agents working in `/home/weihs/soulai`.

## Required Behavior

- Reply to users in Chinese unless the user explicitly requests another language.
- Work directly in this repository with the current Codex tools.
- Do not use Mimo Code, `mimo run`, or `mimo acp`.
- Do not recreate removed Mimo workflow files or legacy app directories unless the user explicitly asks for that restoration.
- Inspect files, edit code, run verification, and report results directly.
- Keep changes small and focused on the user request.
- After every task, deliver an actually usable service by running the latest code with Docker Compose.
- Provide verification or testing links, accounts, and passwords for the running service after each task.

## Active Scope

Active development happens only in:

- `apps/web/` - User-facing React + Vite frontend (port 3000)
- `apps/admin/` - Admin React + Vite frontend (port 3001)
- `packages/shared-types/` - Shared TypeScript type definitions
- `backend/` - Express + TypeScript backend

Removed or inactive paths:

- `prototype/` has been removed.
- `services/astrology/` has been removed.
- `frontend/` has been moved to `apps/web/`.
- Astrology calculations are implemented in `backend/src/services/astrology.ts`.

Do not add new active code outside `apps/`, `packages/`, or `backend/` unless the user explicitly asks for a repository-structure change.

## Product Boundaries

SoulAI is a spiritual wellness and self-reflection product. Keep product language in these frames:

- self-discovery
- emotional reflection
- wellness guidance
- entertainment or reflective readings

Do not add wording or behavior that:

- guarantees future outcomes
- claims supernatural certainty
- gives medical, legal, investment, or crisis instructions
- claims diagnosis or treatment
- uses fear-based upsells
- says payment can remove curses, bad luck, karma, or disasters
- encourages dependency on readings

AI, tarot, astrology, Zi Wei Dou Shu, BaZi, I Ching, and numerology features must include safety boundaries where relevant.

## Current Stack

Frontend:

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Motion
- lucide-react
- react-markdown

Backend:

- Express
- TypeScript
- PostgreSQL
- Redis
- `@google/genai`
- deterministic astrology/divination services in `backend/src/services/`

## Common Commands

Backend:

```bash
cd backend
npm install
npm run dev
npm run lint
npx vitest run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run lint
npx vitest run
npx playwright test --project=chromium
```

Docker development:

```bash
docker compose up --build
```

Development runtime expectations:

- Use Docker Compose as the default full-stack runtime for integration and manual verification.
- When a task needs API, database, Redis, or UI validation, start `docker compose up --build` unless services are already running.
- Keep the Docker services running during active development so frontend/backend code changes hot-reload automatically.
- Prefer validating against the default local ports instead of asking the user to start services manually.
- Stop or restart services only when needed for the task, and report the running URLs when validation depends on them.

Default local ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Adminer: `http://localhost:8080`
- Redis UI: `http://localhost:8081`

## Environment

- Use `.env.example` files in active workspaces when present.
- Expected AI variable: `GEMINI_API_KEY`.
- If `GEMINI_API_KEY` is missing, the demo backend may use local mock responses.
- Never commit real API keys, credentials, private tokens, or production secrets.

## Design Checklist

Before designing a solution or writing code, explicitly consider:

- Whether there is already a proven solution, pattern, or codebase to reuse.
- Whether the proposed design or implementation is too complex for future extension.
- Whether mature libraries or established approaches can solve the problem reliably.
- Whether the functionality can be implemented more simply, including with a one-line change when appropriate.
- Whether the change increases coupling, and whether it respects layering, domain boundaries, or DDD-style separation where relevant.
- Whether the result is maintainable and operable in development and production.
- Whether comments are needed to explain intent, constraints, or non-obvious behavior so other team members can read the code easily.

## Coding Rules

- Prefer existing patterns and local helper APIs.
- Keep TypeScript types strict and meaningful.
- Do not introduce broad refactors unless requested.
- Avoid unnecessary comments.
- Do not add emojis to code or docs unless requested.
- Preserve existing visual direction unless the task is design-related.
- Keep API calls behind a frontend service layer.
- Do not store sensitive state or paid entitlement state only in localStorage.

React-specific:

- Split large components when modifying them substantially.
- Avoid adding more logic to already-large files such as `DiscoverView.tsx`, `HomeView.tsx`, `HealingView.tsx`, and `ProfileView.tsx`.
- Extract reusable UI sections into subcomponents when it reduces complexity.

## AI Feature Rules

When adding or changing AI features:

- Use structured prompts.
- Include the selected language explicitly.
- Include safety constraints.
- Prefer structured JSON output for app-critical data.
- Store a prompt version when generated reports are persisted.
- Use deterministic calculation libraries for chart data, then use the LLM only for interpretation.

Do not let an LLM invent astrology, BaZi, Zi Wei Dou Shu, or numerology calculations that should come from deterministic code.

## Localization

Supported languages:

- `en`
- `my`
- `zh`
- `vi`
- `th`

When adding user-facing strings, update all supported languages or use an intentional fallback. Avoid literal machine translation for culturally sensitive spiritual content.

## Testing Requirements

Before reporting completion for code changes, run verification relevant to the changed area.

A complete feature test must include this sequence:

1. Static code checks
2. Unit tests
3. API functional tests
4. UI automated functional tests with Playwright

Required commands:

- Backend TypeScript changes: `cd backend && npm run lint && npx vitest run`
- Frontend TypeScript changes: `cd frontend && npm run lint && npx vitest run`
- UI changes: `cd frontend && npx playwright test --project=chromium`
- Substantial backend changes: `cd backend && npm run build`
- Substantial frontend changes: `cd frontend && npm run build`

For API changes, include backend API/integration coverage or targeted HTTP smoke tests against the changed endpoints.

After any automated or manual test run, clean up all data created by that test run. Do not leave E2E, smoke-test, or temporary verification records in the shared development database.

If any verification step cannot be run, report exactly what was not run and why.

## Documentation

- Do not create new planning documents unless requested.
- Prefer updating existing documentation when documentation changes are needed.
- Keep documentation aligned with the active `frontend/` and `backend/` architecture.
