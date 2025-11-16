import type { DialectFactory } from "@kysely-vitest/core/types.js";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres, { type Options, type PostgresType } from "postgres";

export const POSTGRES_CONFIG_KEY = "postgresConfig" as const;

export const postgresDialectFactory: DialectFactory<
	typeof POSTGRES_CONFIG_KEY
> = (config) => {
	return new PostgresJSDialect({
		postgres: postgres({
			debug: false,
			onnotice() {},
			...config,
		}),
	});
};

declare module "vitest" {
	export type PostgresImageTag =
		| "latest"
		| "18"
		| "18-alpine"
		| "17"
		| "17-alpine"
		| "16"
		| "16-alpine";

	export type PostgresConfig = Options<Record<string, PostgresType>>;

	export interface ProvidedContext {
		postgresConfig: PostgresConfig;
	}
}
