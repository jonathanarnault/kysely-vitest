#!/usr/bin/env bash

set -e

SETTINGS=.claude/settings.json

# Settings only declare marketplaces and plugins; the clones live in
# ~/.claude/plugins, a fresh volume per container. Add every declared
# marketplace (idempotent, and refreshes a stale clone), then install every
# enabled plugin that is missing. Local scope keeps the CLI out of the shared
# ~/.claude/settings.json and from rewriting the committed project settings.
if [ -f "$SETTINGS" ]; then
	jq -r '.extraKnownMarketplaces // {} | to_entries[] | .value.source
	  | .repo // .url // .path // empty' "$SETTINGS" |
		while read -r source; do
			claude plugin marketplace add "$source"
		done
	claude plugin marketplace update

	installed=$(claude plugin list)
	jq -r '.enabledPlugins // {} | to_entries[] | select(.value) | .key' "$SETTINGS" |
		while read -r plugin; do
			grep -qF "$plugin" <<<"$installed" || claude plugin install "$plugin"
		done
fi

# Trust the workspace so Claude skips the trust dialog on first launch.
CLAUDE_JSON="$HOME/.claude.json"
[ -s "$CLAUDE_JSON" ] || echo '{}' >"$CLAUDE_JSON"
jq --arg dir "$PWD" '.projects[$dir].hasTrustDialogAccepted = true' "$CLAUDE_JSON" >"$CLAUDE_JSON.tmp"
mv "$CLAUDE_JSON.tmp" "$CLAUDE_JSON"
