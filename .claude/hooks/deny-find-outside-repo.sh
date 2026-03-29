#!/usr/bin/env bash
# Blocks `find` from searching outside the repository root.

command=$(jq -r '.tool_input.command // ""')

# Only proceed if find is invoked
if ! echo "$command" | grep -qE '(^|[|;&[:space:]])find[[:space:]]'; then
  exit 0
fi

# Resolve repository root (fall back to PWD if not in a git repo)
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

# Extract the path argument: strip everything up to and including `find `, take first token
find_path=$(echo "$command" | sed -E 's/(.*[[:space:]]|^)find[[:space:]]+//' | awk '{print $1}')

# Only block when an absolute path outside the repo root is given
if [[ "$find_path" == /* ]]; then
  real_path=$(realpath "$find_path" 2>/dev/null || echo "$find_path")
  if [[ "$real_path" != "$repo_root"* ]]; then
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Running find outside the repository root (%s) is not allowed"}}' "$repo_root"
    exit 0
  fi
fi
