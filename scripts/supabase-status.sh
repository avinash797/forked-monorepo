#!/usr/bin/env bash
#
# Show, at a glance, which Supabase project everything in this repo points at.
# Run it whenever you are about to do something you cannot undo.
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=/dev/null
. "$ROOT/supabase/projects.env"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
dim()  { printf '\033[2m%s\033[0m\n' "$*"; }

label_ref() {
    case "$1" in
        "$SUPABASE_PROJECT_REF_DEV")  printf 'dev   (%s)' "$SUPABASE_PROJECT_NAME_DEV" ;;
        "$SUPABASE_PROJECT_REF_PROD") printf 'PROD  (%s)' "$SUPABASE_PROJECT_NAME_PROD" ;;
        127.0.0.1|localhost)          printf 'local stack' ;;
        "")                           printf '(unset)' ;;
        *)                            printf 'UNKNOWN ref %s' "$1" ;;
    esac
}

ref_from_env_file() {
    local file="$1" key="$2" url
    [ -f "$file" ] || { printf 'missing'; return; }
    url="$(grep -E "^[[:space:]]*$key=" "$file" | tail -n1 | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
    [ -n "$url" ] || { printf '(unset)'; return; }
    case "$url" in
        *127.0.0.1*|*localhost*) label_ref 127.0.0.1; return ;;
    esac
    label_ref "$(printf '%s' "$url" | sed -E 's#https?://([a-z0-9]+)\.supabase\.co.*#\1#')"
}

echo
bold "Supabase projects"
printf '  dev   %-24s %s\n' "$SUPABASE_PROJECT_REF_DEV"  "$SUPABASE_PROJECT_NAME_DEV"
printf '  PROD  %-24s %s\n' "$SUPABASE_PROJECT_REF_PROD" "$SUPABASE_PROJECT_NAME_PROD"

echo
bold "Credentials on this machine"
for e in dev prod; do
    if [ -f "$ROOT/supabase/.env.$e" ]; then
        printf '  supabase/.env.%-5s present\n' "$e"
    else
        printf '  supabase/.env.%-5s MISSING  (copy supabase/.env.%s.example)\n' "$e" "$e"
    fi
done

echo
bold "CLI link state"
if [ -f "$ROOT/supabase/.temp/project-ref" ]; then
    printf '  LINKED to %s  <- remove it: rm supabase/.temp/project-ref\n' "$(cat "$ROOT/supabase/.temp/project-ref")"
    printf '  A link makes bare `supabase db push` target that project silently.\n'
else
    printf '  not linked  (correct — every command names its target explicitly)\n'
fi

echo
bold "App env files point at"
printf '  apps/mobile/.env.local  -> %s\n' "$(ref_from_env_file "$ROOT/apps/mobile/.env.local" EXPO_PUBLIC_SUPABASE_URL)"
printf '  apps/mobile/.env.prod   -> %s\n' "$(ref_from_env_file "$ROOT/apps/mobile/.env.prod" EXPO_PUBLIC_SUPABASE_URL)"
printf '  apps/web/.env.local     -> %s\n' "$(ref_from_env_file "$ROOT/apps/web/.env.local" NEXT_PUBLIC_SUPABASE_URL)"
echo
dim "  Expected: *.env.local -> dev or local stack, mobile/.env.prod -> PROD."
dim "  Web prod env vars live in Vercel, not in this repo."
echo
