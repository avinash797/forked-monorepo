#!/usr/bin/env bash
#
# Run a Supabase CLI command against an EXPLICIT environment.
#
#   scripts/supabase-env.sh <dev|prod> <supabase args...>
#
# Why this exists: `supabase link` stores one "current project" in
# supabase/.temp/project-ref. Every bare `supabase db push` then silently targets
# whatever you linked last. This wrapper never links. It passes the target on every
# command (--db-url for database commands, --project-ref/--project-id for platform
# commands), so the environment is decided per invocation and is impossible to inherit.
#
# Guardrails:
#   - refuses to run while a link file exists (so bare CLI commands fail loudly instead
#     of guessing)
#   - prod requires typing PROD, and is non-interactive only inside CI
#   - destructive flags are blocked on prod outright
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_BIN="${SUPABASE_BIN:-supabase}"

# All chatter goes to stderr: stdout must stay clean for `gen types > file` redirects.
red()    { printf '\033[31m%s\033[0m\n' "$*" >&2; }
yellow() { printf '\033[33m%s\033[0m\n' "$*" >&2; }
dim()    { printf '\033[2m%s\033[0m\n' "$*" >&2; }
die()    { red "error: $*" >&2; exit 1; }

TARGET_ENV="${1:-}"
[ -n "$TARGET_ENV" ] || die "usage: scripts/supabase-env.sh <dev|prod> <supabase args...>"
shift
[ "$#" -gt 0 ] || die "no supabase command given (e.g. 'db push --dry-run')"

case "$TARGET_ENV" in
    dev|prod) ;;
    local) die "'local' is not routed through this script — use the plain npm run db:* scripts" ;;
    *) die "unknown environment '$TARGET_ENV' (expected dev or prod)" ;;
esac

# ---------------------------------------------------------------- project mapping
# shellcheck source=/dev/null
. "$ROOT/supabase/projects.env"

if [ "$TARGET_ENV" = "prod" ]; then
    PROJECT_REF="$SUPABASE_PROJECT_REF_PROD"
    PROJECT_NAME="$SUPABASE_PROJECT_NAME_PROD"
else
    PROJECT_REF="$SUPABASE_PROJECT_REF_DEV"
    PROJECT_NAME="$SUPABASE_PROJECT_NAME_DEV"
fi
[ -n "$PROJECT_REF" ] || die "no project ref configured for '$TARGET_ENV' in supabase/projects.env"

# ------------------------------------------------------------------ no stale link
LINK_FILE="$ROOT/supabase/.temp/project-ref"
if [ -f "$LINK_FILE" ] && [ "${SUPABASE_ALLOW_LINK:-}" != "1" ]; then
    LINKED="$(cat "$LINK_FILE")"
    red "error: this repo is linked to project '$LINKED'."
    echo "  This setup deliberately does not use 'supabase link' — a link is exactly the" >&2
    echo "  state that makes a bare command hit the wrong project." >&2
    echo "  Remove it and re-run:  rm $LINK_FILE" >&2
    exit 1
fi

# ------------------------------------------------------------------- db url / creds
SECRETS_FILE="$ROOT/supabase/.env.$TARGET_ENV"
if [ -f "$SECRETS_FILE" ]; then
    set -a
    # shellcheck source=/dev/null
    . "$SECRETS_FILE"
    set +a
fi

# ------------------------------------------------------------ classify the command
CMD="${1:-}"
SUB="${2:-}"
NEEDS_DB_URL=0
NEEDS_PROJECT_REF=0
NEEDS_PROJECT_ID=0

case "$CMD" in
    db)
        NEEDS_DB_URL=1
        ;;
    migration)
        case "$SUB" in
            list|up|repair|fetch|squash) NEEDS_DB_URL=1 ;;
            *) ;;  # 'migration new' is local-only
        esac
        ;;
    gen)
        NEEDS_PROJECT_ID=1
        ;;
    functions|secrets|config|storage|branches|domains|network-bans|network-restrictions|postgres-config|ssl-enforcement|vanity-subdomains)
        NEEDS_PROJECT_REF=1
        ;;
    *)
        ;;
esac

if [ "$NEEDS_DB_URL" = "1" ]; then
    [ -n "${SUPABASE_DB_URL:-}" ] || die "SUPABASE_DB_URL is not set.
  Create $SECRETS_FILE from supabase/.env.$TARGET_ENV.example
  (Dashboard -> Connect -> Session pooler connection string, password included)."
fi

# --------------------------------------------------------- prod destructive blocks
ARGS_STR="$*"
if [ "$TARGET_ENV" = "prod" ]; then
    case "$ARGS_STR" in
        "db reset"*)      die "'db reset' is never allowed against prod. It drops the database." ;;
        *--include-seed*) die "'--include-seed' is never allowed against prod. Seeds are dev-only data." ;;
        *--linked*)       die "'--linked' has no meaning here — this setup does not link. Drop the flag." ;;
    esac
fi

# ------------------------------------------------------------------- confirm prod
if [ "$TARGET_ENV" = "prod" ] && [[ "$ARGS_STR" != *"--dry-run"* ]]; then
    if [ "${CI:-}" = "true" ]; then
        yellow "CI detected — skipping interactive prod confirmation."
    elif [ ! -t 0 ]; then
        die "refusing to touch prod from a non-interactive shell (set CI=true only in CI)."
    else
        echo >&2
        red   "  ┌───────────────────────────────────────────────┐"
        red   "  │  PRODUCTION  —  $PROJECT_NAME"
        red   "  │  project: $PROJECT_REF"
        red   "  │  command: supabase $ARGS_STR"
        red   "  └───────────────────────────────────────────────┘"
        echo >&2
        printf 'Type PROD to continue (anything else aborts): ' >&2
        read -r REPLY_CONFIRM
        [ "$REPLY_CONFIRM" = "PROD" ] || die "aborted."
    fi
fi

# ------------------------------------------------------------------------ dispatch
if [ "$NEEDS_DB_URL" = "1" ] && [[ "$ARGS_STR" != *"--db-url"* ]] && [[ "$ARGS_STR" != *"--local"* ]]; then
    set -- "$@" --db-url "$SUPABASE_DB_URL"
fi
if [ "$NEEDS_PROJECT_REF" = "1" ] && [[ "$ARGS_STR" != *"--project-ref"* ]]; then
    set -- "$@" --project-ref "$PROJECT_REF"
fi
if [ "$NEEDS_PROJECT_ID" = "1" ] && [[ "$ARGS_STR" != *"--project-id"* ]] && [[ "$ARGS_STR" != *"--local"* ]]; then
    set -- "$@" --project-id "$PROJECT_REF"
fi

if [ "$TARGET_ENV" = "prod" ]; then
    yellow "→ [PROD] $PROJECT_NAME ($PROJECT_REF)"
else
    dim "→ [dev] $PROJECT_NAME ($PROJECT_REF)"
fi
dim "  supabase $ARGS_STR"

cd "$ROOT"
exec "$SUPABASE_BIN" "$@"
