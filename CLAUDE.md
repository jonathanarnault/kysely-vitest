# kysely-vitest

Vitest plugins to test code that queries a database through [Kysely](https://kysely.dev/).
A plugin starts the database (Docker image, custom Dockerfile, or an external server), runs migrations and an optional seed once per run, and exposes a test function whose `db` fixture is a transaction rolled back after each test.
User-facing docs live in [readme.md](readme.md).

## Conventions

- TypeScript strict mode, double quotes, semicolons (enforced by Biome).
- Put helper functions after the function that uses them.
- Name test files `*.spec.ts` and use Vitest.
- Use the `context7` MCP server, when available, to browse package documentation.

## Packages

pnpm workspace orchestrated by Turborepo; `core` and `postgres` are published to npm.

- `packages/core` (`@kysely-vitest/core`): dialect-agnostic plugin, test function, and Docker container management.
- `packages/postgres` (`@kysely-vitest/postgres`): Postgres adapter built on `core` and `kysely-postgres-js`.
- `packages/postgres-test-*` (private): integration suites running the Postgres plugin against a real database, one per setup:
  - `docker`: `postgres` image started by the plugin (port 5433).
  - `dockerfile`: image built from the package's `Dockerfile` (port 5434).
  - `postgis`: `postgis` image with a custom healthcheck (port 5435).
  - `external`: an already running server, the dev container's `postgres` service (port 5432).

## Commands

- Test all packages: `make test`
- Test one package: `pnpm turbo run test --filter=@kysely-vitest/<package>`
- Type check: `make typecheck`
- Lint: `make lint-check`, fix with `make lint-apply`

- Turbo builds dependencies before `test` and `typecheck`, so no separate build step is needed.
- Docker is not available in the dev container, so the `docker`, `dockerfile`, and `postgis` suites run no tests there (`passWithNoTests`); CI runs them.
