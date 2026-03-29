#!/usr/bin/env bash
# Blocks Claude from reading sensitive files or files outside the repository root.
# Add filename patterns (basename only) to the DENIED_FILES list below.

DENIED_FILES=(
  ".env"
)

file=$(jq -r '.tool_input.file_path // ""')

# Resolve repository root (fall back to PWD if not in a git repo)
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

# Resolve the absolute, canonical path of the requested file
real_file=$(realpath "$file" 2>/dev/null || echo "$file")

# Block reads outside the repository root
if [[ -n "$real_file" && "$real_file" != "$repo_root"* ]]; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Reading files outside the repository root (%s) is not allowed" }}' "$repo_root"
  exit 0
fi

basename=$(basename "$file")

for pattern in "${DENIED_FILES[@]}"; do
  if [[ "$basename" == "$pattern" ]]; then
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Reading %s is not allowed" }}' "$basename"
    exit 0
  fi
done
