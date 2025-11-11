import { Kysely } from "kysely";
import { inject, type ProvidedContext, test } from "vitest";
import type { DialectFactory } from "./types.js";

export function createTestFunction<K extends keyof ProvidedContext, DB>({
	configKey,
	dialectFactory,
}: CreateTestFunctionParams<K>) {
	return test.extend<{
		perWorker: Kysely<DB>;
		db: Kysely<DB>;
	}>({
		perWorker: [
			// biome-ignore lint/correctness/noEmptyPattern: This is required by vitest
			async ({}, use) => {
				const postgresConfig = inject(configKey);
				const db = new Kysely<DB>({
					dialect: dialectFactory(postgresConfig),
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
}

export type CreateTestFunctionParams<K extends keyof ProvidedContext> = {
	configKey: K;
	dialectFactory: DialectFactory<K>;
};
