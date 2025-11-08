import type { Options, PostgresType } from "postgres";
import type { PostgresConfig } from "vitest";
import type { Vite } from "vitest/node";

export function kyselyPostgres(config: PostgresConfig): Vite.Plugin {
	return {
		name: "kysely-vitest-postgres",
		async configureVitest(context) {
			context.vitest.provide("postgresConfig", config);
		},
	};
}

declare module "vitest" {
	export type PostgresConfig = Options<Record<string, PostgresType>>;

	export interface ProvidedContext {
		postgresConfig: PostgresConfig;
	}
}
