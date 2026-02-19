#!/usr/bin/env bash
# Stop hook: blocks Claude from finishing until PLAN.md is updated.
# On first fire (stop_hook_active=false): check if PLAN.md was recently modified.
#   - If yes (modified in last 5 min): exit 0 (already updated this session).
#   - If no: exit 2 with instructions.
# On second fire (stop_hook_active=true): exit 0 to allow stop.

set -euo pipefail

INPUT=$(cat)

STOP_HOOK_ACTIVE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('stop_hook_active', False)).lower())" 2>/dev/null || echo "false")

if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# If PLAN.md was modified in the last 5 minutes, it's already been updated this session.
PLAN_FILE="$CLAUDE_PROJECT_DIR/PLAN.md"
if [ -f "$PLAN_FILE" ]; then
  if find "$PLAN_FILE" -mmin -5 | grep -q .; then
    exit 0
  fi
fi

cat >&2 <<'INSTRUCTIONS'
BEFORE YOU FINISH: You must update PLAN.md to reflect the work just completed.

1. Read PLAN.md
2. Find the task(s) that match what you just did and mark them as completed by changing `- [ ]` to `- [x]`
3. If the work you did does NOT match any existing task in PLAN.md (i.e. it was an ad-hoc request), append a new entry under a "## Ad Hoc Tasks" section at the bottom of PLAN.md. Format:
   - [x] **<short task description>** — (Ad hoc: <brief reason why this was needed outside the planned tasks>)
4. After updating PLAN.md, you may finish.
INSTRUCTIONS

exit 2
