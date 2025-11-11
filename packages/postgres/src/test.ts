import { createTestFunction } from "@kysely-vitest/core/test.js";
import { POSTGRES_CONFIG_KEY, postgresDialectFactory } from "./dialect.js";

export function createPostgresTestFunction<DB>() {
	return createTestFunction<typeof POSTGRES_CONFIG_KEY, DB>({
		configKey: POSTGRES_CONFIG_KEY,
		dialectFactory: postgresDialectFactory,
	});
}
