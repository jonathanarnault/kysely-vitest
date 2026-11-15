#!/usr/bin/env bash

set -e

pnpm install

# Global packages use their own store under PNPM_HOME, not the project one.
pnpm_config_store_dir="$PNPM_HOME/store" pnpm add -g "typescript-language-server@6.0.3"
