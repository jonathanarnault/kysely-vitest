import { createPlugin } from "@kysely-vitest/core/plugin.js";
import { POSTGRES_CONFIG_KEY, postgresDialectFactory } from "./dialect.js";

export const kyselyPostgres = createPlugin({
	name: "postgres",
	configKey: POSTGRES_CONFIG_KEY,
	dialectFactory: postgresDialectFactory,
});
