#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_MODE=0
TITLE=""
SCOPE=""
VERIFY=""
TASK_FILE=""

usage() {
  cat <<'USAGE'
Usage:
  scripts/codex-mimo-task.sh --title "Task title" --scope "Allowed files/modules" --verify "commands" [--file task.md] [--run]

Purpose:
  Build a constrained Mimo Code task prompt for SoulAI. By default this script only
  prints the prompt so Codex can inspect it before dispatching. Add --run to call:
    mimo run --dir <project> --title <title> "<prompt>"

Examples:
  scripts/codex-mimo-task.sh \
    --title "Fix backend TypeScript build" \
    --scope "backend/package.json backend/src backend/tsconfig.json" \
    --verify "cd backend && npm run lint"

  scripts/codex-mimo-task.sh \
    --title "Fix auth init SQL mismatch" \
    --scope "init.sql backend/prisma/schema.prisma backend/src/routes/auth.ts" \
    --verify "cd backend && npm run lint" \
    --run
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)
      TITLE="${2:-}"
      shift 2
      ;;
    --scope)
      SCOPE="${2:-}"
      shift 2
      ;;
    --verify)
      VERIFY="${2:-}"
      shift 2
      ;;
    --file)
      TASK_FILE="${2:-}"
      shift 2
      ;;
    --run)
      RUN_MODE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$TITLE" || -z "$SCOPE" || -z "$VERIFY" ]]; then
  echo "Missing required --title, --scope, or --verify." >&2
  usage >&2
  exit 2
fi

TASK_BODY=""
if [[ -n "$TASK_FILE" ]]; then
  if [[ ! -f "$TASK_FILE" ]]; then
    echo "Task file does not exist: $TASK_FILE" >&2
    exit 2
  fi
  TASK_BODY="$(sed -n '1,240p' "$TASK_FILE")"
else
  TASK_BODY="$(cat)"
fi

PROMPT="$(cat <<EOF
You are Mimo Code acting as the implementation worker for the SoulAI repository.
Codex is the coordinator and reviewer. Implement only the task below, then stop.

Project:
- Root: $PROJECT_ROOT
- Read and follow AGENTS.md before editing.
- Product positioning: spiritual wellness, self-discovery, emotional reflection.
- Do not introduce deterministic fortune-telling claims, medical/legal/investment advice, fear-based upsells, or real secrets.

Task title:
$TITLE

Task details:
$TASK_BODY

Allowed scope:
$SCOPE

Hard constraints:
- Keep changes small and focused.
- Do not modify files outside the allowed scope unless the task is impossible without it; if so, explain first and stop.
- Do not change mimocode.json secrets or any existing .env files.
- Do not add broad refactors or new architecture unless explicitly requested in the task details.
- Do not commit changes.

Verification to run:
$VERIFY

Required final report:
- Files changed
- What behavior changed
- Verification commands and results
- Any skipped verification and why
- Any follow-up risk for Codex to review
EOF
)"

if [[ "$RUN_MODE" -eq 0 ]]; then
  printf '%s\n' "$PROMPT"
  exit 0
fi

command -v mimo >/dev/null 2>&1 || {
  echo "mimo command not found in PATH." >&2
  exit 127
}

mimo run --dir "$PROJECT_ROOT" --title "$TITLE" "$PROMPT"
