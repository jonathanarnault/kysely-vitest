import { default as fs } from "node:fs/promises";
import { default as path } from "node:path";
import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import type { ProvidedContext } from "vitest";
import type { Vite } from "vitest/node";
import type { DialectFactory, SeedFunction } from "./types.js";

export function createPlugin<K extends keyof ProvidedContext>({
	name,
	configKey,
	dialectFactory,
}: PluginConfig<K>) {
	return function plugin<DB>({
		config,
		migrationFolder,
		seed,
	}: PluginParams<K, DB>): Vite.Plugin {
		return {
			name: `kysely-vitest-${name}`,
			async configureVitest(context) {
				const db = new Kysely<DB>({
					dialect: dialectFactory(config),
				});

				try {
					if (migrationFolder) {
						try {
							const migrator = new Migrator({
								db,
								provider: new FileMigrationProvider({
									fs,
									path,
									migrationFolder,
								}),
							});

							await migrator.migrateToLatest();
						} catch (e) {
							context.vitest.logger.error(
								`[${name}] Error during migrations: ${e}`,
							);
							throw e;
						}
					}

					try {
						await seed?.(db);
					} catch (e) {
						context.vitest.logger.error(`[${name}] Error during seeding: ${e}`);
						throw e;
					}

					context.vitest.provide(configKey, config);
				} finally {
					await db.destroy();
				}
			},
		};
	};
}

export type PluginConfig<K extends keyof ProvidedContext> = {
	name: string;
	configKey: K;
	dialectFactory: DialectFactory<K>;
};

export type PluginParams<K extends keyof ProvidedContext, DB> = {
	config: ProvidedContext[K];
	migrationFolder?: string;
	seed?: SeedFunction<DB>;
};
