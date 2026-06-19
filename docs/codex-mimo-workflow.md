# Codex + Mimo Code Workflow

This project uses Codex as the main coordinator and reviewer, and Mimo Code as an implementation worker. Codex should keep the decision-making role: task decomposition, scope control, permission judgment, code review, live intervention, and verification review.

Mimo Code should receive small, bounded implementation tasks. Do not ask Mimo to "fix everything" or make product, payment, safety, or architecture decisions without Codex review.

## Verification Model

Mimo is responsible for running all required verification before reporting done. This includes lint, build, and Playwright UI validation when frontend behavior is involved. Mimo must not report completion without executing the verification commands specified in its task prompt.

Codex reviews Mimo's verification output, diffs, and may inspect files or run additional spot checks. Codex does not replace Mimo's own verification; it reviews it.

## Current Local Status

- A Mimo Code TUI process was observed running locally.
- `mimo run` is available and can dispatch a one-shot implementation task, but it is not enough for live supervision.
- `mimo acp --hostname 127.0.0.1 --port 7788 --cwd /home/weihs/soulai` starts a local Mimo HTTP/ACP server.
- Mimo Code is an opencode-derived tool, and the tested HTTP routes are opencode-compatible:
  - `GET /session` for session listing.
  - `GET /session/{sessionID}` for session metadata.
  - `GET /session/{sessionID}/message` for message and tool-call history.
  - `POST /session/{sessionID}/message` for continuing/intervening in a session.
  - `POST /session/{sessionID}/abort` for aborting a session.
  - `GET /global/event` for an event stream.
- `mimo session list` currently fails with a local Mimo database checkpoint error, so this workflow does not depend on session listing.
- Public GitHub search shows several opencode bridge projects, including `HNGM-HP/opencode-bridge`, `ET06731/opencode-im-bridge`, and `SiddhantBohra/cc-opencode-bridge`. They are useful references, but this repository keeps a small local wrapper because the immediate need is Codex-to-local-Mimo supervision for one workspace.

## Live Supervision Pattern

For serious development work, prefer an HTTP-managed Mimo session over `mimo run`.

1. Start Mimo ACP/server for the project.
2. Codex lists or creates the target Mimo session.
3. Codex watches session events and/or message history.
4. Codex interrupts or replies when the implementation direction is wrong, when permission is required, or when Mimo asks for a decision.
5. Mimo runs required verification (lint, build, Playwright when applicable) and reports results.
6. Codex reviews Mimo's output, diffs, and verification results.

The correct production shape is:

```text
User <-> Codex <-> Mimo HTTP/ACP or bridge <-> Mimo Code session
```

Avoid relying on:

```text
User <-> Codex -> mimo run
```

`mimo run` can still be used for short, bounded, low-risk tasks, but it does not give Codex enough runtime control.

## Local Bridge

This repository includes a thin bridge for Codex-managed opencode/Mimo-compatible sessions:

```bash
node scripts/mimo-bridge.mjs --start-mimo
```

Defaults:

- Bridge URL: `http://127.0.0.1:7790`
- Mimo ACP URL: `http://127.0.0.1:7788`
- Upstream override: `OPENCODE_BASE_URL=http://127.0.0.1:7788`
- Preferred session override: `MIMO_SESSION_ID=ses_...`
- Project root: current working directory
- Session state: `.mimo-bridge-state.json`

Useful endpoints:

```bash
curl -s http://127.0.0.1:7790/health
curl -s http://127.0.0.1:7790/status
curl -s http://127.0.0.1:7790/sessions
curl -s http://127.0.0.1:7790/messages
```

Ensure or recover the current project session:

```bash
curl -s -X POST http://127.0.0.1:7790/session/ensure \
  -H 'content-type: application/json' \
  -d '{"title":"Codex-managed SoulAI development"}'
```

Send a task into the same project session:

```bash
curl -s -X POST http://127.0.0.1:7790/task \
  -H 'content-type: application/json' \
  -d '{"message":"Fix only the backend TypeScript build failures. Run cd backend && npm run lint. Do not touch payment behavior."}'
```

Intervene in the same session:

```bash
curl -s -X POST http://127.0.0.1:7790/reply \
  -H 'content-type: application/json' \
  -d '{"message":"Stop changing frontend files. Keep the scope to backend TypeScript build errors only."}'
```

Abort the active session:

```bash
curl -s -X POST http://127.0.0.1:7790/abort \
  -H 'content-type: application/json' \
  -d '{}'
```

Watch native Mimo events:

```bash
curl -N http://127.0.0.1:7790/events
```

The bridge deliberately does not expose Mimo's `/config` endpoint because it can include local credentials.

## One-Shot Dispatch Pattern

1. Codex inspects repository context and defines a narrow task.
2. Codex generates a constrained worker prompt with `scripts/codex-mimo-task.sh`.
3. Codex previews the prompt first.
4. Codex dispatches with `--run` only after the prompt is acceptable.
5. Mimo implements, runs verification commands, and reports changed files plus verification output.
6. Codex reviews Mimo's output with `git diff`, reads touched files, and may run additional spot checks.
7. Codex either accepts, makes a small direct fix, or sends a focused follow-up task.

## One-Shot Script Usage

Preview a task prompt:

```bash
scripts/codex-mimo-task.sh \
  --title "Fix auth init SQL mismatch" \
  --scope "init.sql backend/prisma/schema.prisma backend/src/routes/auth.ts" \
  --verify "cd backend && npm run lint" <<'TASK'
Fix the mismatch where init.sql creates users without password_hash while auth registration and login depend on password_hash.
Keep the SQL schema, Prisma schema, and auth route field names aligned.
If sample users cannot be safely logged in, remove them or use an obvious development-only placeholder hash.
TASK
```

Dispatch the same task to Mimo:

```bash
scripts/codex-mimo-task.sh \
  --title "Fix auth init SQL mismatch" \
  --scope "init.sql backend/prisma/schema.prisma backend/src/routes/auth.ts" \
  --verify "cd backend && npm run lint" \
  --run <<'TASK'
Fix the mismatch where init.sql creates users without password_hash while auth registration and login depend on password_hash.
Keep the SQL schema, Prisma schema, and auth route field names aligned.
If sample users cannot be safely logged in, remove them or use an obvious development-only placeholder hash.
TASK
```

Use a task file when the prompt is longer:

```bash
scripts/codex-mimo-task.sh \
  --title "Fix payment callback order metadata" \
  --scope "backend/src/routes/payments.ts init.sql backend/prisma/schema.prisma" \
  --verify "cd backend && npm run lint" \
  --file /tmp/payment-task.md \
  --run
```

## Review Checklist For Codex

After Mimo finishes, Codex should inspect Mimo's reported verification output. Codex may run additional spot checks:

```bash
git status --short
git diff --stat
git diff
```

Then spot-check lint or build if Mimo's output is unclear or suspicious:

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

Run only the commands relevant to the touched area. For substantial frontend changes, also check the frontend build and manually verify the changed flow when possible.

Do not skip Mimo's own verification. Codex spot checks supplement Mimo's required verification; they do not replace it.

## Recommended Task Order For Current Review Findings

1. Remove committed runtime secrets from normal project configuration when allowed by the user.
2. Fix backend TypeScript checks.
3. Align `init.sql`, Prisma, and auth fields for `users.password_hash`.
4. Fix payment order metadata and idempotent callbacks.
5. Mount or proxy BaZi, ZiWei, and numerology APIs used by the frontend.
6. Replace placeholder astrology calculations with deterministic calculation services before LLM interpretation.

The user explicitly asked not to handle the `mimocode.json` MiniMax key yet. Do not change that file for now.

## Worker Prompt Rules

Every Mimo task should include:

- Exact goal
- Allowed file or module scope
- Hard constraints
- Verification commands
- Required final report format

Avoid vague prompts such as:

```text
Fix all backend issues.
```

Prefer bounded prompts such as:

```text
Fix only the backend TypeScript errors in db typing, JWT expiresIn typing, payment amount typing, and implicit any issues. Do not change runtime behavior except where needed to satisfy the type checker.
```
