import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import { inject, type PostgresTestDB, test } from "vitest";

export const pgTest = test.extend<{
	perWorker: Kysely<PostgresTestDB>;
	db: Kysely<PostgresTestDB>;
}>({
	perWorker: [
		// biome-ignore lint/correctness/noEmptyPattern: This is required by vitest
		async ({}, use) => {
			const postgresConfig = inject("postgresConfig");
			const db = new Kysely<PostgresTestDB>({
				dialect: new PostgresJSDialect({
					postgres: postgres(postgresConfig),
				}),
			});

			await use(db);

			await db.destroy();
		},
		{ scope: "worker", auto: true },
	],
	async db({ perWorker }, use) {
		const trx = await perWorker.startTransaction().execute();
		try {
			await use(trx);
		} finally {
			await trx.rollback().execute();
		}
	},
});

declare module "vitest" {
	export interface PostgresTestDB {}
}
