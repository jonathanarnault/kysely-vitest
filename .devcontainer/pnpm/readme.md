# PNPM integration

Installs pnpm, runs `pnpm install` on create, and installs the global `typescript-language-server`.

- The project's `node_modules` lives in the `node_modules` volume of [`compose.yaml`](../compose.yaml), shared with the `app` service and kept across rebuilds.
- The pnpm store lives in `node_modules/.pnpm-store` (set by `pnpm_config_store_dir` in compose), so store and packages share one mount and pnpm can hardlink instead of copying.
- The `app` service only mounts it and restarts until the first install is done.
- `PNPM_HOME` (`/mnt/pnpm`) holds global binaries and is not persisted.
