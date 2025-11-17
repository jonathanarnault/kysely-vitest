# `@kysely-vitest/core`

`@kysely-vitest/core` provides helper functions to create you custom adapter for `kysely-vitest`. An adapter consists in 3 functions:

- A `kysely` [dialect factory](#create-the-dialect-factory)
- A `vitest` [plugin function](#create-the-plugin-function)
- A `test` [function factory](#create-the-test-function-factory)

## Create the Dialect Factory

The dialect factory will be used to initialize the connection to the database when running migrations, seeding the database and running tests.

Here is an example on how to create you dialect factory function:

```ts
// in src/tests/dialect.ts
import type { DialectFactory } from "@kysely-vitest/core/types.js";
import { MyDialect } from 'kysely/my-dialect';

export const MY_DIALECT_CONFIG_KEY = "myDialectConfig" as const;

export const myDialectFactory: DialectFactory<
    typeof MY_DIALECT_CONFIG_KEY
> = (config) => {
    return new MyDialect({
        // Dialect configuration
    })
};

// Extend vitest types
declare module "vitest" {
    export type MyDialectConfig = {
        // Dialect options
    };

    export interface ProvidedContext {
        myDialectConfig: MyDialectConfig;
    }
}
```

## Create the Plugin Function

Once your dialect function has been created, you can create the plugin function that will be used by `vitest` to run migrations, seed the database and configure your `test` function.

Here is an example on how to create your plugin:

```ts
// in src/tests/plugin.ts
import { createPlugin } from "@kysely-vitest/core/plugin.js";
import { MY_DIALECT_CONFIG_KEY, myDialectFactory } from "./dialect.js";

export const kyselyPlugin = createPlugin({
    name: "plugin",
    configKey: MY_DIALECT_CONFIG_KEY,
    dialectFactory: myDialectFactory,
});
```

Then, you can use your plugin in the `vitest.config.ts` file:

```ts
// in vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import type { DB } from "./src/db.js";
import { kyselyPlugin } from "./src/tests/plugin.js";

export default defineConfig({
    plugins: [
        // Other plugins
        kyselyPlugin<DB>({
            config: {
                // Your dialect configuration
            },
            migrationFolder: path.resolve(__dirname, "migrations"),
        }),
    ],
    test: {
        // Test configuration
    },
});
```

Note: You can use also use a [`seed`](#seeding) function with your plugin.

## Configuration Provider

The `configProvider` function can be used to cleanup the configuration that will be passed to the test context and configure the managed docker container.

Pass your custom config provider when you configure your plugin:

```ts
// ...
import { configProvider, type MyConfig } from "./config.js";

export const kyselyPlugin = createPlugin<
    typeof MY_DIALECT_CONFIG_KEY,
    MyConfig
>({
    name: "plugin",
    configKey: MY_DIALECT_CONFIG_KEY,
    configProvider,
    dialectFactory: myDialectFactory,
});
```

Then you can create your custom config provider in `src/tests/config.js`:

```ts
// in src/tests/config.js

export const configProvider: ConfigProvider<
    typeof MY_DIALECT_CONFIG_KEY,
    MyConfig
> = async (config) {
    return {
        config: {
            // ... transform provided config
        },
        dockerContainer: {
            // ... Docker container configuration
        } | false
    }
}
```

## Create the Test Function Factory

Once your plugin has been configured, you can create your `test` function. Here is an example of a `dbTest` function:

```ts
// in src/tests/dbTest.ts
import { createTestFunction } from "@kysely-vitest/core/test.js";
import { MY_DIALECT_CONFIG_KEY, myDialectFactory } from "./dialect.js";
import type { DB } from "../db.js";

export const dbTest = createTestFunction<typeof MY_DIALECT_CONFIG_KEY, DB>({
    configKey: MY_DIALECT_CONFIG_KEY,
    dialectFactory: myDialectFactory,
});
```

Then you can use your test function inside your test suites:

```ts
// in src/myTestSuite.spec.ts
import { describe, expect } from "vitest";
import { dbTest } from "./tests/dbTest.js";

describe("myTestSuite", () => {
    dbTest("my test", async ({ db }) => {
        // ...
    });
});
```

Note: The `db` parameter is a transaction that is rolled back after the test to ensure that each test runs in isolation.

## Seeding

You can provide a seeding function to your adapter to seed your database before running the tests. Here is an example with your custom adapter:

First create your `seed` function in `src/tests/seed.js`:

```ts
// in src/tests/seed.js
import type { SeedFunction } from "@kysely-vitest/core/types.js";
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

Then configure the plugin in `vitest.config.ts` to use your `seed` function:

```ts
// in vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import type { DB } from "./src/db.js";
import { kyselyPlugin } from "./src/tests/plugin.js";
import { seed } from "./src/tests/seed.js";

export default defineConfig({
    plugins: [
        // Other plugins
        kyselyPlugin<DB>({
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
