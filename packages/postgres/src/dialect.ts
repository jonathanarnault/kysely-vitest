import type { DialectFactory } from "@kysely-vitest/core/types.js";
import { PostgresJSDialect } from "kysely-postgres-js";
import type { Options, PostgresType } from "postgres";
import postgres from "postgres";

export const POSTGRES_CONFIG_KEY = "postgresConfig" as const;

export const postgresDialectFactory: DialectFactory<
	typeof POSTGRES_CONFIG_KEY
> = (config) => {
	return new PostgresJSDialect({
		postgres: postgres(config),
	});
};

declare module "vitest" {
	export type PostgresConfig = Options<Record<string, PostgresType>>;

	export interface ProvidedContext {
		postgresConfig: PostgresConfig;
	}
}
