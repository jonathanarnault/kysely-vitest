# `@kysely-vitest/postgres`

`@kysely-vitest/postgres` provides helpers to test your modules that depends on [`kysely`](https://kysely.dev/) to query your PostgreSQL database.

## Install

`kysely-vitest` depends on `kysely@^0.28.0`, `kysely-postgres-js` and `vitest@^4.0.0` as peer dependencies. Run one of the following commands to install the dependencies:

```shell
npm install kysely kysely-postgres-js && npm install -D vitest @kysely-vitest/postgres
# or
yarn add kysely kysely-postgres-js && yarn add -D vitest @kysely-vitest/postgres
# or
pnpm add kysely kysely-postgres-js && pnpm add -D vitest @kysely-vitest/postgres
```

Then, you can define your [database types](https://kysely.dev/docs/getting-started#types) in `src/db.ts`:

```ts
// in src/db.ts
export type DB = {
    // ...
};
```

## Configure the Plugin

First, we will register the `kyselyPostgres` plugin in `vitest.config.ts`:

```ts
// in vitest.config.ts
import path from "node:path";
import { kyselyPostgres } from "@kysely-vitest/postgres/plugin.js";
import { defineConfig } from "vitest/config";
import type { DB } from "./src/db.js";

export default defineConfig({
    plugins: [
        // Other plugins
        kyselyPostgres<DB>({
            config: {
                database: "testdb",
                username: "test",
                password: "test",
            },
            migrationFolder: path.resolve(__dirname, "migrations"),
        }),
    ],
    test: {
        // Test configuration
    },
});
```

Then we can create the `pgTest` function in `src/tests/pgTest.ts` that will be used in our test suite:

```ts
// in src/tests/pgTest.ts
import { createPostgresTestFunction } from "@kysely-vitest/postgres/test.js";
import type { DB } from "../db.js";

export const pgTest = createPostgresTestFunction<DB>();
```

Note: The test function will create a database client by worker.

## Create a Test

To run a test on your database, use the `pgTest` function instead of the `it/test` function provided by `vitest`. Note that `pgTest` is an extension of `it/test` and can be used exactly as the base function.

```ts
// in src/myTestSuite.spec.ts
import { describe, expect } from "vitest";
import { pgTest } from "./tests/pgTest.js";

describe("myTestSuite", () => {
    pgTest("my test", async ({ db }) => {
        // ...
    });
});
```

Note: The `db` parameter is a transaction that is rolled back after the test to ensure that each test runs in isolation.

## Run your Test Suite with a Managed Container

To run you test suite with a managed container, you can configure the container to use in the `vitest.config.ts` file.

Here is an example on how to configure a managed container with `@kysely-vitest/postgres`:

```ts
// in vitest.config.ts

export default defineConfig({
    plugins: [
        // Other plugins
        kyselyPostgres<DB>({
            config: {
                // Will be used as host port, defaults to `5432`
                port: 5433,

                // Will be used in POSTGRES_DB env, defaults to `testdb`
                database: "mydb",

                // Will be used in POSTGRES_USER env, defaults to `testuser`
                user: "myuser",

                // Will be used in POSTGRES_PASSWORD env, defaults to `test`
                password: "secret",

                // The container will use postgres:latest
                dockerContainer: true
            },
        }),
    ],
});
```

You can also select a custom `image` or `tag` for the container:

```ts
// in vitest.config.ts

export default defineConfig({
    plugins: [
        // Other plugins
        kyselyPostgres<DB>({
            config: {
                // ... configuration

                // Use custom image / tag
                dockerContainer: {
                    image: "postgres",
                    tag: "18-alpine",
                },
            },
        }),
    ],
});
```

## Run your Test Suite with an Unmanaged Container

To run you test suite with an unmanaged container, you will need to start a PostgreSQL database on your own. The `@kysely-vitest/postgres` plugin will automatically run your migrations on that database.

You can use the following `docker-compose.yml` file to run your test database:

```yml
# in docker-compose.yml
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 10s
      timeout: 5s
      retries: 5
```

Then run your test suite with the following commands:

```shell
# Start test database
docker compose up --wait

# Run you tests
npx vitest
# or
yarn vitest
# or
pnpm vitest

# Stop test database an cleanup volumes
docker compose down --volumes
```

## Seeding

You can provide a seeding function to the `@kysely-vitest/postgres` adapter to seed your database before running the tests.

First create your `seed` function in `src/tests/seed.js`:

```ts
// in src/tests/seed.js
import type { SeedFunction } from "@kysely-vitest/postgres/types.js";
import { sql } from "kysely";
import type { DB } from "../db.js";

export const seed: SeedFunction<DB> = async (db) => {
    await sql<void>`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`.execute(db);

    await db
        .insertInto("users")
        .values([{ username: "alice" }, { username: "bob" }])
        .execute();
};
```

Then configure the `kyselyPostgres` plugin in `vitest.config.ts` to use your `seed` function:

```ts
// in vitest.config.ts
import path from "node:path";
import { kyselyPostgres } from "@kysely-vitest/postgres/plugin.js";
import { defineConfig } from "vitest/config";
import type { DB } from "./src/db.js";
import { seed } from "./src/tests/seed.js";

export default defineConfig({
    plugins: [
        // Other plugins
        kyselyPostgres<DB>({
            // Configure the plugin
            seed,
        }),
    ],
    test: {
        // Test configuration
    },
});
```

Note: The seeding function will be run once before running your tests suite and will not run on test reload.
