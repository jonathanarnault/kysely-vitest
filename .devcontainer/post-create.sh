#!/usr/bin/env bash

set -e

cat >> "$HOME/.zshrc" <<'EOF2'
alias g="git"
alias a="git add -p"
alias s="git status"
alias d="git diff"
EOF2
