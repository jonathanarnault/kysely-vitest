import { createPlugin } from "@kysely-vitest/core/plugin.js";
import { configProvider, type PluginConfig } from "./config.js";
import { POSTGRES_CONFIG_KEY, postgresDialectFactory } from "./dialect.js";

export const kyselyPostgres = createPlugin<
	typeof POSTGRES_CONFIG_KEY,
	PluginConfig
>({
	name: "postgres",
	configKey: POSTGRES_CONFIG_KEY,
	configProvider,
	dialectFactory: postgresDialectFactory,
});
